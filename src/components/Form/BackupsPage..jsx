// BackupPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import axios from 'axios';
function BackupPage() {
  const navigate = useNavigate();
  const [backups, setBackups] = useState([]);
  const [maxBackups, setMaxBackups] = useState(parseInt(localStorage.getItem('numberOfBackups')) || 5);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState('warning');
  const [pendingAction, setPendingAction] = useState(null);
  const [backupInterval, setBackupInterval] = useState(6);
  const [newInterval, setNewInterval] = useState(6);
  const [baseUrl, setBaseUrl] = useState("");
  const [companyDetails, setCompanyDetails] = useState(null);
  const computeTotalHours = (opening, closing) => {
    if (!opening || !closing) return 0;
    const [oh, om] = opening.split(':').map(Number);
    const [ch, cm] = closing.split(':').map(Number);
    let totalMin = (ch * 60 + cm) - (oh * 60 + om);
    if (totalMin < 0) totalMin += 1440;
    return totalMin / 60;
  };
  const totalHours = companyDetails ? computeTotalHours(companyDetails.openingTime, companyDetails.closingTime) : 0;
  const extendedHours = totalHours + 2;
  const numBackupsPreview = newInterval > 0 ? Math.floor(extendedHours / newInterval) : 0;
  useEffect(() => {
    const fetchConfig = async () => {
      let currentBaseUrl = "";
      try {
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          currentBaseUrl = `http://${appConfig.server_ip}:8000`;
          setBaseUrl(currentBaseUrl);
        } else {
          setBaseUrl("");
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl("");
      } finally {
        // Fetch data using currentBaseUrl
        fetchBackupInfo(currentBaseUrl);
        fetchBackupInterval(currentBaseUrl);
        fetchCompanyDetails(currentBaseUrl);
        // Set maxBackups from localStorage (local operation, no URL needed)
        const storedMax = parseInt(localStorage.getItem('numberOfBackups')) || 5;
        setMaxBackups(storedMax);
      }
    };
    fetchConfig();
  }, []);
  const fetchCompanyDetails = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/company-details`);
      if (response.data.companyDetails && response.data.companyDetails.length > 0) {
        const latest = response.data.companyDetails[response.data.companyDetails.length - 1];
        setCompanyDetails(latest);
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };
  const fetchBackupInterval = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/get-backup-interval`);
      setBackupInterval(response.data.interval);
      setNewInterval(response.data.interval);
    } catch (error) {
      console.error('Error fetching backup interval:', error);
      setWarningMessage(`Failed to fetch backup interval: ${error.message}`);
      setWarningType('warning');
    }
  };
  const handleSetInterval = async () => {
    try {
      await axios.post(`${baseUrl}/api/set-backup-interval`, { interval: newInterval });
      setBackupInterval(newInterval);
      setWarningMessage('Backup interval updated successfully!');
      setWarningType('success');
    } catch (error) {
      console.error('Error setting backup interval:', error);
      setWarningMessage(`Failed to set backup interval: ${error.message}`);
      setWarningType('warning');
    }
  };
  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage('');
    setWarningType('warning');
  };
  const fetchBackupInfo = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/backup-info`);
      const sortedData = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      const limitedData = sortedData.slice(0, maxBackups);
      setBackups(limitedData);
    } catch (error) {
      console.error('Error fetching backup info:', error);
      setWarningMessage(`Failed to fetch backup info: ${error.message}`);
      setWarningType('warning');
    }
  };
  const handleGoBack = () => {
    navigate('/admin');
  };
  const handleBackup = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/backup-to-excel`, {
        responseType: 'blob',
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const filename = `backup_restaurant_data_${timestamp}.xlsx`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setWarningMessage('Backup created successfully! Excel file downloaded and sent to configured email.');
      setWarningType('success');
      setPendingAction(() => () => fetchBackupInfo(baseUrl));
    } catch (error) {
      console.error('Backup error:', error);
      let errorMessage = 'Failed to create backup';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setWarningMessage(errorMessage);
      setWarningType('warning');
    }
  };
  const handleDownloadBackup = async (filename) => {
    try {
      const response = await axios.post(`${baseUrl}/api/download-backup`, { filename }, {
        responseType: 'blob',
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setWarningMessage('Backup downloaded successfully!');
      setWarningType('success');
    } catch (error) {
      console.error('Download backup error:', error);
      let errorMessage = 'Failed to download backup';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setWarningMessage(errorMessage);
      setWarningType('warning');
    }
  };
  const handleSetMaxBackups = (newMax) => {
    setMaxBackups(newMax);
    localStorage.setItem('numberOfBackups', newMax);
    fetchBackupInfo(baseUrl); // Refresh the list with new limit using baseUrl
  };
  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button in Top-Left Corner - Styled like EmployeeList */}
      <button
        onClick={handleGoBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: 'transparent',
          border: '2px solid #3498db',
          color: '#3498db',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          borderRadius: '50px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#3498db';
          e.target.style.color = '#ffffff';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#3498db';
          e.target.style.transform = 'scale(1)';
        }}
      >
        <FaArrowLeft /> Back to Admin
      </button>
      {/* Main Container - Like EmployeeList Card */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Warning Message - Styled like EmployeeList Alerts */}
        {warningMessage && (
          <div style={{
            background: warningType === 'success' ? 'linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%)' : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            color: warningType === 'success' ? '#155724' : '#c0392b',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: warningType === 'success' ? '1px solid #28a745' : '1px solid #e74c3c',
            boxShadow: warningType === 'success' ? '0 2px 4px rgba(40, 167, 69, 0.2)' : '0 2px 4px rgba(231, 76, 60, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            {warningMessage}
            <button
              onClick={handleWarningOk}
              style={{
                background: warningType === 'success' ? 'linear-gradient(135deg, #28a745 0%, #218838 100%)' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              OK
            </button>
          </div>
        )}
        {/* Header with Title */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
          <div></div> {/* Empty left for balance */}
          <h2 style={{
            textAlign: 'center',
            color: '#2c3e50',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            Backup Management
          </h2>
          <div></div> {/* Empty right for balance */}
        </div>
        {/* Section for Company Operating Hours */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '10px' }}>
              <h5 style={{ color: '#333', marginBottom: '15px' }}>Operating Hours from Company Details</h5>
              {companyDetails ? (
                <>
                  <p style={{ marginBottom: '10px' }}><strong>Opening Time:</strong> {companyDetails.openingTime || 'N/A'}</p>
                  <p style={{ marginBottom: '10px' }}><strong>Closing Time:</strong> {companyDetails.closingTime || 'N/A'}</p>
                  <p style={{ marginBottom: '10px' }}><strong>Total Operating Time:</strong> {companyDetails.totalTime || 'N/A'}</p>
                  <p style={{ marginBottom: '0' }}><strong>Extended for Backups:</strong> {extendedHours.toFixed(1)} hours (+2 hours)</p>
                </>
              ) : (
                <p className="text-muted" style={{ marginBottom: '0' }}>No company details available. Please save company details first.</p>
              )}
            </div>
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '10px' }}>
              <h5 style={{ color: '#333', marginBottom: '15px' }}>Set Automatic Backup Interval (hours)</h5>
              <div className="input-group mb-3">
                <input
                  type="number"
                  className="form-control"
                  value={newInterval}
                  onChange={(e) => setNewInterval(parseInt(e.target.value) || 1)}
                  min={1}
                  style={{ borderRadius: '5px 0 0 5px' }}
                />
                <button className="btn btn-primary" onClick={handleSetInterval} style={{ borderRadius: '0 5px 5px 0' }}>
                  Save Interval
                </button>
              </div>
              <p style={{ marginBottom: '10px', color: '#666' }}>Current interval: every {backupInterval} hours</p>
              {companyDetails && (
                <div className="mt-2 p-2 bg-light rounded" style={{ backgroundColor: 'rgba(248, 249, 250, 0.8)', borderRadius: '5px' }}>
                  <small style={{ color: '#555' }}>
                    Preview: ~{numBackupsPreview} backups/day with {newInterval}h interval over {extendedHours.toFixed(1)}h extended hours
                  </small>
                </div>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="card p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '10px' }}>
              <h5 style={{ color: '#333', marginBottom: '15px' }}>Set Number of Backups to Display</h5>
              <div className="input-group mb-3">
                <input
                  type="number"
                  className="form-control"
                  value={maxBackups}
                  onChange={(e) => handleSetMaxBackups(parseInt(e.target.value) || 5)}
                  min={1}
                  style={{ borderRadius: '5px' }}
                />
              </div>
              <p style={{ marginBottom: '0', color: '#666' }}>Current display limit: {maxBackups}</p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="d-flex justify-content-center">
              <button
                className="btn btn-warning"
                onClick={handleBackup}
                style={{
                  minWidth: '300px',
                  padding: '20px 30px',
                  fontSize: '1.3rem',
                  fontWeight: '500',
                  backgroundColor: '#ffc107',
                  borderColor: '#ffc107',
                  borderRadius: '10px',
                  boxShadow: '0 6px 12px rgba(255, 193, 7, 0.3)',
                  transition: 'all 0.3s ease',
                  color: '#fff',
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#e0a800';
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 8px 16px rgba(255, 193, 7, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#ffc107';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 12px rgba(255, 193, 7, 0.3)';
                }}
              >
                Create New Backup
              </button>
            </div>
          </div>
          <div className="col-md-6">
            <h4
              style={{
                color: '#444',
                fontWeight: '500',
                marginBottom: '20px',
                fontSize: '1.5rem',
              }}
            >
              Previous Backups (Latest {maxBackups})
            </h4>
            {backups.length > 0 ? (
              <div className="backup-list">
                {backups.map((backup) => (
                  <div
                    key={backup.filename}
                    className="backup-card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '12px',
                      padding: '15px 20px',
                      marginBottom: '15px',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      border: '1px solid #e0e0e0',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                    }}
                    onClick={() => handleDownloadBackup(backup.filename)}
                  >
                    <div style={{ flex: 1 }}>
                      <h6 style={{ margin: 0, fontSize: '1.1rem', color: '#333', fontWeight: '500' }}>
                        Backup - {backup.date}
                      </h6>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#777' }}>
                        Size: {backup.size}
                      </p>
                    </div>
                    <button
                      className="btn btn-outline-primary"
                      style={{
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        border: '2px solid #007bff',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadBackup(backup.filename);
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#007bff';
                        e.target.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#007bff';
                      }}
                    >
                      <FaDownload style={{ fontSize: '18px' }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No previous backups found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default BackupPage;