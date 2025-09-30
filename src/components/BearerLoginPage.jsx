import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../Context/UserContext'; // Ensure this context exists in your project
import axios from 'axios';
import './BearerLoginPage.css';
// --- API Configuration ---
const api = axios.create({
  timeout: 5000,
});
const configureApi = (config) => {
  if (config?.mode === 'client' && config?.server_ip) {
    const baseURL = `http://${config.server_ip}:8000`;
    api.defaults.baseURL = baseURL;
    console.log(`API configured for CLIENT mode. Pointing to ${baseURL}`);
  } else {
    api.defaults.baseURL = 'http://localhost:8000';
    console.log('API configured for SERVER mode.');
  }
};
// --- Modals ---
function InitialSetupModal({ onConfigSubmit, localIp }) {
  const [mode, setMode] = useState('server');
  const [serverIp, setServerIp] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState('error');
  const handleSubmit = () => {
    if (mode === 'client' && !serverIp.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
      setWarningMessage('Please enter a valid IP address for the server.');
      setWarningType('error');
      return;
    }
    setWarningMessage('');
    onConfigSubmit({ mode, server_ip: serverIp });
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      {warningMessage && (
        <div className={`alert alert-${warningType} text-center alert-dismissible fade show`} role="alert">
          {warningMessage}
          <button
            type="button"
            className="btn btn-primary ms-3"
            onClick={() => setWarningMessage('')}
          >
            OK
          </button>
        </div>
      )}
      <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Application Setup</h2>
        <p className="mb-6 text-gray-600">
          Choose the role for this terminal. This can be changed later from the Network Status screen.
        </p>
        <div className="space-y-4">
          <div
            onClick={() => setMode('server')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              mode === 'server' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <h3 className="font-bold text-lg text-gray-900">Main Server</h3>
            <p className="text-gray-600">
              This terminal will manage the database and act as the central point for all other terminals.
              Your IP is <strong className="text-blue-600">{localIp}</strong>.
            </p>
          </div>
          <div
            onClick={() => setMode('client')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              mode === 'client' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <h3 className="font-bold text-lg text-gray-900">Client Terminal</h3>
            <p className="text-gray-600">
              This terminal will connect to an existing Main Server on your network.
            </p>
            {mode === 'client' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Main Server IP Address
                </label>
                <input
                  type="text"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 192.168.1.10"
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
function ConfigurationStatusModal({ show, onClose, networkInfo, onReconfigure, onRefresh }) {
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState('success');
  if (!show) return null;
  const isServer = networkInfo?.config?.mode === 'server';
  const dbStatusClass =
    networkInfo?.database_status === 'Connected'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      {warningMessage && (
        <div className={`alert alert-${warningType} text-center alert-dismissible fade show`} role="alert">
          {warningMessage}
          <button
            type="button"
            className="btn btn-primary ms-3"
            onClick={() => setWarningMessage('')}
          >
            OK
          </button>
        </div>
      )}
      <div className="modal-content bg-white rounded-lg p-6 max-w-md w-full shadow-lg text-center">
        <h2 className="modal-title text-2xl font-bold mb-4">Network Status</h2>
        <div className={`status-badge px-4 py-2 rounded-full inline-block mb-4 ${dbStatusClass}`}>
          Database Status: <strong>{networkInfo?.database_status || 'Unknown'}</strong>
        </div>
        {isServer ? (
          <div className="info-box bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Running as Main Server</h3>
            <p className="text-gray-700 mt-1">
              This terminal is the primary server. Other terminals on the network will connect to it.
            </p>
            <p className="text-gray-800 font-mono bg-gray-200 px-2 py-1 rounded mt-2 inline-block">
              Your IP: <strong>{networkInfo?.local_ip}</strong>
            </p>
          </div>
        ) : (
          <div className="info-box bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">Running as Client Terminal</h3>
            <p className="text-gray-700 mt-1">
              This terminal is connected to a main server on the network.
            </p>
            <p className="text-gray-800 font-mono bg-gray-200 px-2 py-1 rounded mt-2 inline-block">
              Server IP: <strong>{networkInfo?.config?.server_ip || 'N/A'}</strong>
            </p>
            {networkInfo?.database_status === 'Disconnected' && (
              <p className="text-red-600 mt-2">
                Cannot connect to the main server. Please check the server IP or network.
              </p>
            )}
          </div>
        )}
        <div className="modal-actions mt-6 flex justify-center space-x-3">
          <button
            className="refresh-button bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={() => {
              onRefresh();
              setWarningMessage('Refreshing network status...');
              setWarningType('info');
            }}
          >
            Refresh Status
          </button>
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            onClick={() => {
              onReconfigure();
              setWarningMessage('Switching to configuration mode...');
              setWarningType('info');
            }}
          >
            Change Mode
          </button>
          <button
            className="close-button bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={onClose}
          >
            OK
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Network mode is set automatically on startup. To change modes, use the Change Mode button or restart the application.
        </p>
      </div>
    </div>
  );
}
function BearerLoginPage() {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState('error');
  const [isLoading, setIsLoading] = useState(false);
  const [appState, setAppState] = useState('initializing');
  const [networkInfo, setNetworkInfo] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showClientNotification, setShowClientNotification] = useState(false);
  const fetchNetworkInfo = async (retries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get('http://localhost:8000/api/network_info', { timeout: 3000 });
        const netInfo = response.data;
        setNetworkInfo(netInfo);
        if (!netInfo.config || !netInfo.config.mode) {
          setAppState('needs_config');
        } else {
          configureApi(netInfo.config);
          setAppState('ready');
          if (netInfo.config.mode === 'client' && !localStorage.getItem('clientNotified')) {
            setShowClientNotification(true);
          }
        }
        return netInfo;
      } catch (err) {
        console.error(`Fetch network info attempt ${attempt} failed:`, err);
        if (attempt === retries) {
          setWarningMessage(
            `Failed to connect to the backend server after ${retries} attempts. Please ensure it is running on port 8000 and check your network.`
          );
          setWarningType('error');
          setAppState('error');
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };
  useEffect(() => {
    fetchNetworkInfo();
  }, []);
  const handleConfigSubmit = async (config) => {
    try {
      await axios.post('http://localhost:8000/api/configure', config);
      setWarningMessage('Configuration saved! The application will now reload with the new settings.');
      setWarningType('success');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setWarningMessage(`Configuration failed: ${err.response?.data?.error || err.message}`);
      setWarningType('error');
    }
  };
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setWarningMessage('');
    try {
      const response = await api.post('/api/login', {
        identifier,
        password,
        type: 'mobile_or_username',
      });
      const { user, requires_opening_entry } = response.data;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      setWarningMessage('Login Successful!');
      setWarningType('success');
      setTimeout(() => {
        const role = user.role.toLowerCase();
        if (role === 'bearer') {
          navigate(requires_opening_entry ? '/opening-entry' : '/home');
        } else if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate(`/${role}/${user.id}`);
        }
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed. Please check your credentials or network connection to the server.';
      console.error('Login error:', err);
      setWarningMessage(errorMessage);
      setWarningType('error');
      if (errorMessage.includes('Cannot connect to main server') || errorMessage.includes('Database not connected')) {
        setShowConfigModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleClientNotificationAcknowledge = () => {
    setShowClientNotification(false);
    localStorage.setItem('clientNotified', 'true');
    setWarningMessage('Client mode acknowledged.');
    setWarningType('success');
  };
  if (appState === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl font-semibold">Initializing Application...</p>
          <p className="text-gray-600">Checking network configuration.</p>
        </div>
      </div>
    );
  }
  if (appState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {warningMessage && (
          <div className={`alert alert-${warningType} text-center alert-dismissible fade show`} role="alert">
            {warningMessage}
            <button
              type="button"
              className="btn btn-primary ms-3"
              onClick={() => setWarningMessage('')}
            >
              OK
            </button>
          </div>
        )}
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h2>
          <button
            onClick={() => fetchNetworkInfo()}
            className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (appState === 'needs_config') {
    return <InitialSetupModal onConfigSubmit={handleConfigSubmit} localIp={networkInfo?.local_ip} />;
  }
  return (
    <>
      {warningMessage && (
        <div className={`alert alert-${warningType} text-center alert-dismissible fade show`} role="alert">
          {warningMessage}
          <button
            type="button"
            className="btn btn-primary ms-3"
            onClick={() => setWarningMessage('')}
          >
            OK
          </button>
        </div>
      )}
      <ConfigurationStatusModal
        show={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        networkInfo={networkInfo}
        onReconfigure={() => setAppState('needs_config')}
        onRefresh={fetchNetworkInfo}
      />
      {showClientNotification && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="modal-content bg-white rounded-lg p-8 max-w-sm w-full shadow-lg text-center">
            <h2 className="text-xl font-bold mb-3">Connected to Server</h2>
            <p className="text-gray-700 mb-5">
              This terminal is running in client mode and is connected to the main server at IP:
              <strong className="block font-mono bg-gray-200 px-2 py-1 rounded mt-2">
                {networkInfo.config.server_ip}
              </strong>
            </p>
            <button
              onClick={handleClientNotificationAcknowledge}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
      <div className="login-container min-h-screen flex items-center justify-center bg-gray-100">
        <div className="login-box bg-white p-8 rounded-lg shadow-lg max-w-md w-full relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowConfigModal(true)}
              className="config-button bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-300"
              title="View Network Status"
            >
              Network Status
            </button>
          </div>
          <h2 className="login-title text-2xl font-bold mb-2 text-center">Login</h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            {networkInfo?.config?.mode === 'server'
              ? 'Running as Main Server'
              : `Client connected to ${networkInfo?.config?.server_ip || 'N/A'}`}
          </p>
          <form onSubmit={handleLoginSubmit} className="login-form space-y-4">
            <div className="form-group">
              <label className="form-label block text-gray-700">Mobile Number or Username:</label>
              <input
                type="text"
                className="form-input w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter identifier"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label className="form-label block text-gray-700">Password:</label>
              <input
                type="password"
                className="form-input w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="submit-button w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
      {/* Add CSS styling consistent with Navbar.jsx */}
      <style jsx>{`
        .alert {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1050;
          min-width: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
          font-size: 1rem;
        }
        .alert .btn {
          margin-left: 15px;
          padding: 5px 20px;
          font-size: 0.9rem;
        }
        @media (max-width: 991px) {
          .alert {
            min-width: 80%;
          }
        }
        @media (max-width: 576px) {
          .alert {
            min-width: 90%;
            font-size: 0.9rem;
          }
          .alert .btn {
            padding: 4px 15px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </>
  );
}
export default BearerLoginPage;