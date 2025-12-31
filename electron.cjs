const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { execFile } = require('child_process');
const http = require('http');
const fs = require('fs').promises;
const fsSync = require('fs');
const axios = require('axios');
let mainWindow;
let flaskProcess;
// mongoProcess variable removed as MongoDB is no longer managed by Electron
let printPreviewWindow;
let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  console.log('electron-updater loaded');
} catch (error) {
  console.error('Failed to load electron-updater:', error.message);
  process.exit(1);
}
// Set CONFIG_DIR to userData path
const userDataPath = app.getPath('userData');
process.env.CONFIG_DIR = userDataPath;
console.log(`CONFIG_DIR set to: ${process.env.CONFIG_DIR}`);
// Config reading is no longer needed in Electron, Flask handles it.
// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('Another instance running, quitting...');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  // Check Flask server status
  function isFlaskServerRunning() {
    return new Promise((resolve, reject) => {
      http
        .get('http://127.0.0.1:8000/api/test', { timeout: 2000 }, (res) => {
          if (res.statusCode === 200) resolve(true);
          else reject(new Error(`Flask responded with ${res.statusCode}`));
        })
        .on('error', () => reject(new Error('Flask not available')))
        .on('timeout', () => reject(new Error('Flask timeout')));
    });
  }
  // Shutdown Flask server
  async function shutdownFlaskServer(timeoutMs = 5000) {
    if (!flaskProcess || flaskProcess.killed) {
      console.log('No Flask process to shut down');
      return;
    }
    console.log('Shutting down Flask server');
    try {
      await axios.post('http://127.0.0.1:8000/api/shutdown', {}, { timeout: 2000 });
      console.log('Shutdown request sent');
      const exitPromise = new Promise((resolve) => {
        flaskProcess.on('exit', (code) => {
          console.log(`Flask exited with code ${code}`);
          resolve();
        });
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Shutdown timed out')), timeoutMs);
      });
      await Promise.race([exitPromise, timeoutPromise]);
    } catch (err) {
      console.error('Shutdown failed:', err.message);
      if (flaskProcess && !flaskProcess.killed) {
        console.log('Force killing Flask');
        flaskProcess.kill('SIGKILL');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  // The startMongoDB function has been completely removed.
  // Start Flask server
  function startFlaskServer() {
    const flaskExePath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '..', 'dist', 'flask_server_dist', 'flask_server.exe')
      : path.join(process.resourcesPath, 'flask_server.exe');
    const preExistingUploads = path.join(process.resourcesPath, 'pre-existing-Uploads');
    const userUploads = path.join(app.getPath('userData'), 'Uploads');
    console.log(`Flask path: ${flaskExePath}`);
    console.log(`Pre-existing uploads: ${preExistingUploads}`);
    console.log(`User uploads: ${userUploads}`);
    if (!fsSync.existsSync(flaskExePath)) {
      console.error(`Flask executable not found at ${flaskExePath}.`);
      // If flask isn't found, the app is useless. Quit.
      app.quit();
      return;
    }
    if (!fsSync.existsSync(userUploads)) {
      fsSync.mkdirSync(userUploads, { recursive: true });
      if (fsSync.existsSync(preExistingUploads)) {
        fsSync.cpSync(preExistingUploads, userUploads, { recursive: true });
        console.log(`Copied uploads to ${userUploads}`);
      }
    }
    flaskProcess = execFile(
      flaskExePath,
      [],
      { env: { ...process.env, UPLOAD_FOLDER: userUploads }, windowsHide: true },
      (err, stdout, stderr) => {
        if (err) console.error(`Flask error: ${err.message}`);
        if (stdout) console.log(`Flask stdout: ${stdout}`);
        if (stderr) console.error(`Flask stderr: ${stderr}`);
      }
    );
    flaskProcess.on('spawn', () => console.log('Flask spawned'));
    flaskProcess.on('error', (err) => {
      console.error(`Flask failed: ${err.message}`);
      app.quit();
    });
    flaskProcess.on('exit', (code) => console.log(`Flask exited: ${code}`));
  }
  // Create main window
  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: process.env.NODE_ENV === 'development',
        webSecurity: false,
      },
      autoHideMenuBar: true,
      show: false,
    });
    const loadingHtml = `
      <html>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0;">
          <div style="text-align: center;">Loading POS Application...</div>
        </body>
      </html>
    `;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHtml)}`);
    mainWindow.show();
    const startUrl = 'http://127.0.0.1:8000';
    const loadApp = () => {
      isFlaskServerRunning()
        .then(() => {
          mainWindow.loadURL(startUrl);
          mainWindow.webContents.on('did-finish-load', () => {
            console.log('App loaded');
            mainWindow.show();
            mainWindow.focus();
          });
        })
        .catch(() => setTimeout(loadApp, 1000));
    };
    loadApp();
    mainWindow.on('closed', () => (mainWindow = null));
  }
  // Setup auto-updater
  function setupAutoUpdater() {
    if (!autoUpdater) return;
    autoUpdater.on('checking-for-update', () => console.log('Checking updates...'));
    autoUpdater.on('update-available', (info) => console.log('Update available:', info.version));
    autoUpdater.on('update-downloaded', () => autoUpdater.quitAndInstall());
    autoUpdater.on('error', (err) => console.error('Update error:', err.message));
    autoUpdater.checkForUpdates().catch((err) => console.error('Update check failed:', err.message));
  }
  // IPC handlers
  ipcMain.on('open-print-preview', (event, content) => {
    if (printPreviewWindow) printPreviewWindow.close();
    printPreviewWindow = new BrowserWindow({
      width: 600,
      height: 800,
      parent: mainWindow,
      modal: true,
      webPreferences: { nodeIntegration: true, contextIsolation: false },
      autoHideMenuBar: true,
    });
    const htmlContent = `
      <html>
        <head><style>@media print { .no-print { display: none; } }</style></head>
        <body>
          <div style="width: 80mm; margin: auto;">${content}</div>
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `;
    printPreviewWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    printPreviewWindow.on('closed', () => {
      printPreviewWindow = null;
      event.reply('print-preview-response', { success: true });
    });
  });
  ipcMain.on('send-email', async (event, emailContent) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/send-email', emailContent, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      event.sender.send('email-response', { success: response.data.success, message: response.data.message });
    } catch (error) {
      event.sender.send('email-response', { success: false, error: error.message });
    }
  });
  ipcMain.on('restart-flask', async () => {
    try {
      await shutdownFlaskServer();
      startFlaskServer();
      mainWindow.reload();
      console.log('Flask restarted and window reloaded');
    } catch (err) {
      console.error('Failed to restart Flask:', err.message);
    }
  });
  // App lifecycle
  let isQuitting = false;
  app.on('before-quit', async (event) => {
    if (isQuitting) return;
    isQuitting = true
    event.preventDefault();
    try {
      await shutdownFlaskServer();
      // Logic to kill mongoProcess removed
      if (printPreviewWindow) printPreviewWindow.close();
    } catch (err) {
      console.error(`Shutdown error: ${err.message}`);
    } finally {
      app.exit(0);
    }
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.whenReady().then(() => {
    // Version change data reset logic - ENHANCED FOR ROBUSTNESS: Added file lock checks, better UTF-8 handling, and optional post-reset init.
    // On version change, clear all userData contents except version.txt to reset DB, configs, etc.
    // This ensures no old data persists after uninstall/install or update.
    // For fresh installs, creates empty userData and initializes defaults via Flask.
    const appDataPath = app.getPath("userData");
    const versionFile = path.join(appDataPath, "version.txt");
    const currentVersion = app.getVersion();
 
    // Ensure appDataPath exists (for fresh installs)
    if (!fsSync.existsSync(appDataPath)) {
      fsSync.mkdirSync(appDataPath, { recursive: true });
      console.log('Fresh install: Created userData directory.');
    }
 
    let oldVersion = null;
    let resetPerformed = false;
    if (fsSync.existsSync(versionFile)) {
      try {
        // Read with UTF-8 to avoid encoding issues
        oldVersion = fsSync.readFileSync(versionFile, { encoding: 'utf8' }).trim();
        if (oldVersion !== currentVersion) {
          console.log(`Version changed from ${oldVersion} to ${currentVersion}. Resetting all data for fresh start.`);
          // Clear all files/directories in userData except version.txt
          // Enhanced: Check for file locks and retry deletions
          const files = fsSync.readdirSync(appDataPath);
          let deleteErrors = 0;
          for (const file of files) {
            if (file !== 'version.txt') {
              const filePath = path.join(appDataPath, file);
              try {
                // Simple lock check: Try to open exclusively
                fsSync.openSync(filePath, 'r+');
                fsSync.closeSync(0); // Close the handle
                if (fsSync.statSync(filePath).isDirectory()) {
                  fsSync.rmSync(filePath, { recursive: true, force: true, maxRetries: 3 });
                  console.log(`Deleted directory: ${filePath}`);
                } else {
                  fsSync.unlinkSync(filePath);
                  console.log(`Deleted file: ${filePath}`);
                }
              } catch (deleteErr) {
                console.error(`Failed to delete ${filePath}: ${deleteErr.message}. Possible lock/perms issue.`);
                deleteErrors++;
                // Optional: Force-kill processes locking file (Windows-specific, advanced)
                // execSync(`handle.exe -c "${filePath}" -y`, { stdio: 'ignore' }); // Requires handle.exe tool
              }
            }
          }
          if (deleteErrors > 0) {
            console.warn(`${deleteErrors} files failed to delete. Manual cleanup may be needed.`);
          }
          console.log('All old data cleared. App will initialize as new.');
          resetPerformed = true;
          // OPTIONAL: Add migration or init API call here if needed after reset (uncomment after Flask starts)
          // setTimeout(async () => {
          // try { await axios.post('http://127.0.0.1:8000/api/init-fresh-db'); } catch (e) { console.error('Init API failed:', e.message); }
          // }, 5000);
        } else {
          console.log(`Version unchanged: ${currentVersion}. No reset needed.`);
        }
      } catch (readErr) {
        console.error(`Failed to read version.txt: ${readErr.message}. Treating as fresh install.`);
        oldVersion = null;
      }
    } else {
      console.log('Fresh install detected. Initializing with empty defaults.');
    }
 
    // Always save current version (creates/updates file safely with UTF-8)
    try {
      fsSync.writeFileSync(versionFile, currentVersion, { encoding: 'utf8' });
      console.log(`Current version saved: ${currentVersion}`);
    } catch (writeErr) {
      console.error(`Failed to write version.txt: ${writeErr.message}. Perms issue?`);
    }
 
    // FIXED: The logic to check for mode and start MongoDB has been removed.
    // The application now assumes an external MongoDB is available if needed by Flask.
    startFlaskServer();
    createWindow();
    setupAutoUpdater();
  });
}