const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const certPath = path.join(__dirname, 'kylesolutions.pfx');
const certPass = 'KyLe@123';
const exePath = path.join(__dirname, 'dist', 'flask_server.exe');
const dllDir = path.join(__dirname, 'dist', 'flask_server_dist', '_internal');
const signtoolPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe";

function signFile(filePath) {
  if (!fs.existsSync(filePath)) return console.log('Not found: ' + filePath);
  console.log('Signing: ' + filePath);
  execSync("${signtoolPath}" sign /f "" /p "" /tr http://timestamp.digicert.com/?td=sha256 /td sha256 /fd sha256 /a \"${filePath}\" , { stdio: 'inherit', shell: true });
  console.log('Signed: ' + filePath);
}

if (fs.existsSync(exePath)) signFile(exePath);
if (fs.existsSync(dllDir)) {
  fs.readdirSync(dllDir).filter(f => f.endsWith('.dll')).forEach(f => signFile(path.join(dllDir, f)));
}
console.log('All files signed 100% successfully! Now run: npm run electron:build');
