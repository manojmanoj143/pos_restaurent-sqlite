// Navbar.jsx (full updated code with system settings integration)
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get user from Redux or fallback to localStorage
  const reduxUser = useSelector((state) => state.user.user);
  const storedUser = JSON.parse(localStorage.getItem('user')) || { email: "Guest" };
  const user = reduxUser || storedUser;
  const posProfile = useSelector((state) => state.user.pos_profile) || storedUser.pos_profile;

  // Date and Time state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("success");
  const [pendingAction, setPendingAction] = useState(null);

  // System settings state with defaults
  const [settings, setSettings] = useState({
    country: 'Japan',
    language: 'English',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: 'JPY',
    dateFormat: 'dd-mm-yyyy',
    timeFormat: 'hh:mm a',
    numberFormat: '#,##,###.##',
    useNumberFormatFromCurrency: false,
    firstDayOfWeek: 'Monday',
    floatPrecision: 3,
    currencyPrecision: 4,
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load system settings on mount with fallback
  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('systemSettings'));
    if (storedSettings) {
      setSettings((prev) => ({ ...prev, ...storedSettings }));
    }
  }, []);

  // Dynamic date formatting based on system settings
  const getFormattedDate = (date, dateFormat) => {
    if (!dateFormat) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    const numericFormatter = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: 'numeric' });
    const parts = numericFormatter.formatToParts(date);
    const year = parts.find((p) => p.type === 'year')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';

    switch (dateFormat) {
      case 'dd-mm-yyyy':
        return `${day.padStart(2, '0')}-${month}-${year}`;
      case 'mm-dd-yyyy':
        return `${month}-${day.padStart(2, '0')}-${year}`;
      case 'yyyy-mm-dd':
        return `${year}-${month}-${day.padStart(2, '0')}`;
      case 'dd/mm/yyyy':
        return `${day.padStart(2, '0')}/${month}/${year}`;
      case 'mm/dd/yyyy':
        return `${month}/${day.padStart(2, '0')}/${year}`;
      case 'yyyy/mm/dd':
        return `${year}/${month}/${day.padStart(2, '0')}`;
      case 'yyyy-long-mm-dd':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'dd-MMM-yy':
        const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
        const dayStr = date.getDate().toString().padStart(2, '0');
        const yearShort = date.getFullYear().toString().slice(-2);
        return `${dayStr}-${monthShort}-${yearShort}`;
      default:
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // Dynamic time formatting based on system settings
  const getFormattedTime = (date, timeFormat) => {
    if (!timeFormat) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    const hasSeconds = timeFormat.includes(':ss') || timeFormat.includes('ss');
    const is12Hour = timeFormat.includes(' a') || timeFormat.startsWith('hh');

    const options = {
      hour: '2-digit',
      minute: '2-digit',
      ...(hasSeconds && { second: '2-digit' }),
      hour12: is12Hour,
    };

    return date.toLocaleTimeString('en-US', options);
  };

  const formattedDate = getFormattedDate(currentTime, settings.dateFormat);
  const formattedTime = getFormattedTime(currentTime, settings.timeFormat);

  // Handle OK button click for warning messages
  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage("");
    setWarningType("success");
  };

  // Logout handler
  const handleLogout = () => {
    setWarningMessage("Logout Successful!");
    setWarningType("success");
    setPendingAction(() => () => {
      localStorage.removeItem('user');
      navigate('/');
    });
  };

  // Opening Entry Navigation handler
  const handleOpeningEntryNavigation = () => {
    navigate('/opening-entry');
  };

  // Closing Entry Navigation handler
  const handleClosingEntryNavigation = () => {
    const posOpeningEntry = localStorage.getItem('posOpeningEntry') || '';
    console.log('Navigating to Closing Entry with posOpeningEntry:', posOpeningEntry);
    navigate('/closing-entry', { state: { posOpeningEntry } });
  };

  // Sales Report Navigation handler
  const handleSalesReportNavigation = () => {
    navigate('/sales-reports');
  };

  return (
    <div>
      {warningMessage && (
        <div className={`alert alert-${warningType} text-center alert-dismissible fade show`} role="alert">
          {warningMessage}
          <button
            type="button"
            className="btn btn-primary ms-3"
            onClick={handleWarningOk}
          >
            OK
          </button>
        </div>
      )}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container-fluid">
          <button
            className="navbar-toggler bg-light"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            {/* Centered Navigation Items */}
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 d-flex justify-content-center">
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    location.pathname === '/frontpage' ? 'active text-primary' : 'text-black'
                  } cursor-pointer`}
                  onClick={() => navigate('/frontpage')}
                  title="Home"
                >
                  <img src="/menuIcons/home.svg" alt="Home" className="icon-size" />
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    location.pathname === '/home' ? 'active text-primary' : 'text-black'
                  } cursor-pointer`}
                  onClick={() => navigate('/home')}
                  title="Type Of Delivery"
                >
                  <img src="/menuIcons/delivery.svg" alt="Delivery" className="icon-size" />
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    location.pathname === '/table' ? 'active text-primary' : 'text-black'
                  } cursor-pointer`}
                  onClick={() => navigate('/table')}
                  title="Table"
                >
                  <img src="/menuIcons/table1.svg" alt="Table" className="icon-size" />
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    location.pathname === '/kitchen' ? 'active text-primary' : 'text-black'
                  } cursor-pointer`}
                  onClick={() => navigate('/kitchen')}
                  title="Kitchen"
                >
                  <img src="/menuIcons/kitchen.svg" alt="Kitchen" className="icon-size" />
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    location.pathname === '/salespage' ? 'active text-primary' : 'text-black'
                  } cursor-pointer`}
                  onClick={() => navigate('/salespage')}
                  title="Sales Invoice"
                >
                  <img src="/menuIcons/save.svg" alt="Save" className="icon-size" />
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    location.pathname === '/sales-reports' ? 'active text-primary' : 'text-black'
                  } cursor-pointer`}
                  onClick={handleSalesReportNavigation}
                  title="Sales Report"
                >
                  <img src="/menuIcons/salesreport.svg" alt="Sales Report" className="icon-size" />
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    location.pathname === '/closing-entry' ? 'active text-primary' : 'text-black'
                  } cursor-pointer`}
                  onClick={handleClosingEntryNavigation}
                  title="Closing Entry"
                >
                  <img src="/menuIcons/closingentry.svg" alt="Closing Entry" className="icon-size" />
                </a>
              </li>
            </ul>

            {/* Right Side: User Info and Logout */}
            <div className="d-flex align-items-center ms-auto pe-3">
              <div className="user-info text-end me-3">
                <div className="d-flex align-items-center justify-content-end">
                  <i className="bi bi-person-circle fs-4 me-2"></i>
                  <span className="fw-bold text-black mb-0">{user.email}</span>
                </div>
                <small className="d-block text-muted">{formattedDate}</small>
                <small className="d-block text-muted">{formattedTime}</small>
              </div>
              <a
                className={`nav-link ${
                  location.pathname === '/logout' ? 'active text-primary' : 'text-black'
                } cursor-pointer`}
                onClick={handleLogout}
                title="Logout"
              >
                <img src="/menuIcons/poweroff.svg" alt="Logout" className="icon-size" />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Add CSS styling */}
      <style jsx>{`
        .icon-size {
          width: 36px;
          height: 36px;
          vertical-align: middle;
        }
        .nav-link {
          padding: 0.75rem 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .navbar-nav {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .nav-item {
          margin: 0 10px;
        }
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
          .navbar-nav {
            flex-direction: column;
            align-items: flex-start;
          }
          .nav-item {
            margin: 5px 0;
          }
          .alert {
            min-width: 80%;
          }
        }
        @media (max-width: 576px) {
          .icon-size {
            width: 28px;
            height: 28px;
          }
          .nav-link {
            padding: 0.5rem 1rem;
          }
          .alert {
            min-width: 90%;
            font-size: 0.9rem;
          }
          .alert .btn {
            padding: 4px 15px;
            font-size: 0.8rem;
          }
          .user-info {
            font-size: 0.9rem;
          }
          .bi-person-circle {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Navbar;