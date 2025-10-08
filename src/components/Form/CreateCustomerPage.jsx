import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const CreateCustomerPage = () => {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    building_name: "",
    flat_villa_no: "",
    location: "",
  });
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedISDCode, setSelectedISDCode] = useState("+91");
  const [showISDCodeDropdown, setShowISDCodeDropdown] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [customerGroups, setCustomerGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isdCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+971", country: "UAE" },
    { code: "+61", country: "Australia" },
  ];

  useEffect(() => {
    fetchCustomerGroups();
    if (location.state?.newGroupId) {
      setSelectedGroup(location.state.newGroupId);
    }
  }, [location.state]);

  const fetchCustomerGroups = async () => {
    try {
      const response = await fetch('/api/customer-groups');
      const data = await response.json();
      setCustomerGroups(data);
    } catch (error) {
      console.error('Error fetching customer groups:', error);
    }
  };

  const handleISDCodeSelect = (code) => {
    setSelectedISDCode(code);
    setShowISDCodeDropdown(false);
  };

  const handleGroupSelect = (groupId) => {
    if (groupId === "create-new") {
      navigate('/create-customer-group', { state: { fromCreateCustomer: true } });
    } else {
      setSelectedGroup(groupId);
      setShowGroupDropdown(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!customerName.trim() || !phoneNumber || phoneNumber.length !== 10) {
      setWarningMessage("Customer name and 10-digit phone number are required.");
      setWarningType("warning");
      return;
    }

    try {
      const customerData = {
        customer_name: customerName.trim(),
        phone_number: `${selectedISDCode}${phoneNumber}`,
        building_name: deliveryAddress.building_name || "",
        flat_villa_no: deliveryAddress.flat_villa_no || "",
        location: deliveryAddress.location || "",
        whatsapp_number: whatsappNumber || "",
        email: email || "",
        customer_group: selectedGroup || "",
      };

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        setWarningMessage('Customer created successfully!');
        setWarningType("success");
        setCustomerName("");
        setPhoneNumber("");
        setDeliveryAddress({ building_name: "", flat_villa_no: "", location: "" });
        setWhatsappNumber("");
        setEmail("");
        setSelectedISDCode("+91");
        setSelectedGroup("");
      } else {
        const errorData = await response.json();
        setWarningMessage(errorData.error || 'Failed to create customer');
        setWarningType("warning");
      }
    } catch (error) {
      console.error('Error:', error);
      setWarningMessage('Error while creating customer');
      setWarningType("warning");
    }
  };

  const handleDeliveryAddressChange = (field, value) => {
    setDeliveryAddress((prev) => ({ ...prev, [field]: value.trimStart() }));
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setPhoneNumber(value);
  };

  const handleWhatsappNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setWhatsappNumber(value);
  };

  const handleWarningOk = () => {
    setWarningMessage("");
    setWarningType("warning");
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="container mt-5 p-4">
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

      <div className="row">
        <div className="col-md-12">
          <div className="d-flex align-items-center mb-4">
            <button 
              type="button" 
              className="btn btn-secondary rounded-pill"
              onClick={handleBackToAdmin}
            >
              Back to Admin
            </button>
            <h1 className="mb-0 flex-grow-1 text-center">Create a New Customer</h1>
          </div>
          <div className="inner-container">
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="customer_name">Customer Name:</label>
                  <input
                    type="text"
                    id="customer_name"
                    className="form-control rounded-pill"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Phone Number:</label>
                  <div className="input-group">
                    <div className="input-group-prepend position-relative">
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill"
                        onClick={() => setShowISDCodeDropdown(!showISDCodeDropdown)}
                      >
                        {selectedISDCode} <i className="bi bi-chevron-down"></i>
                      </button>
                      {showISDCodeDropdown && (
                        <ul className="dropdown-menu show position-absolute" style={{ zIndex: 1050 }}>
                          {isdCodes.map((isd, index) => (
                            <li key={index} className="dropdown-item" onClick={() => handleISDCodeSelect(isd.code)}>
                              {isd.code} ({isd.country})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <input
                      type="text"
                      className="form-control rounded-pill"
                      placeholder="Enter Phone Number"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="flat_villa_no">Flat/Villa No:</label>
                  <input
                    type="text"
                    id="flat_villa_no"
                    className="form-control rounded-pill"
                    value={deliveryAddress.flat_villa_no}
                    onChange={(e) => handleDeliveryAddressChange("flat_villa_no", e.target.value)}
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="building_name">Building Name:</label>
                  <input
                    type="text"
                    id="building_name"
                    className="form-control rounded-pill"
                    value={deliveryAddress.building_name}
                    onChange={(e) => handleDeliveryAddressChange("building_name", e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="location">Location:</label>
                  <input
                    type="text"
                    id="location"
                    className="form-control rounded-pill"
                    value={deliveryAddress.location}
                    onChange={(e) => handleDeliveryAddressChange("location", e.target.value)}
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="whatsapp_number">WhatsApp Number:</label>
                  <input
                    type="text"
                    id="whatsapp_number"
                    className="form-control rounded-pill"
                    value={whatsappNumber}
                    onChange={handleWhatsappNumberChange}
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    className="form-control rounded-pill"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Customer Group:</label>
                  <div className="input-group">
                    <div className="input-group-prepend position-relative">
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill w-100"
                        onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                      >
                        {selectedGroup ? customerGroups.find(g => g._id === selectedGroup)?.group_name || "Select Group" : "Select Group"} <i className="bi bi-chevron-down"></i>
                      </button>
                      {showGroupDropdown && (
                        <ul className="dropdown-menu show position-absolute" style={{ zIndex: 1050 }}>
                          {customerGroups.map((group) => (
                            <li key={group._id} className="dropdown-item" onClick={() => handleGroupSelect(group._id)}>
                              {group.group_name}
                            </li>
                          ))}
                          <li className="dropdown-item" onClick={() => handleGroupSelect("create-new")}>
                            Create New Group
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-center mt-4">
              <button 
                type="button" 
                className="btn btn-primary rounded-pill px-5"
                onClick={handleCreateCustomer}
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          background: #ffffff;
          padding: 2.5rem;
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          max-width: 900px;
          margin: 2rem auto;
        }
        .inner-container {
          background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
          padding: 2rem;
          border-radius: 8px;
        }
        h1 {
          color: #2c3e50;
          font-weight: 700;
          font-size: 2rem;
          text-align: center;
        }
        .form-group label {
          font-weight: 600;
          color: #34495e;
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }
        .form-control {
          border-radius: 25px;
          border: 1px solid #b0bec5;
          padding: 0.75rem 1.25rem;
          background-color: #fff;
          transition: all 0.3s ease;
        }
        .form-control:focus {
          border-color: #007bff;
          box-shadow: 0 0 8px rgba(0, 123, 255, 0.3);
        }
        .btn-primary {
          background-color: #007bff;
          border-color: #007bff;
          padding: 0.75rem 2rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          background-color: #0056b3;
          border-color: #0056b3;
          transform: translateY(-2px);
        }
        .btn-secondary {
          background-color: #6c757d;
          border-color: #6c757d;
          border-radius: 25px;
          padding: 0.5rem 1.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-secondary:hover {
          background-color: #5a6268;
          border-color: #5a6268;
          transform: translateY(-2px);
        }
        .alert {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1050;
          min-width: 350px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          font-size: 1rem;
          background-color: ${warningType === 'success' ? '#d4edda' : '#fff3cd'};
          border: 1px solid ${warningType === 'success' ? '#28a745' : '#ffc107'};
        }
        .alert .btn {
          padding: 0.5rem 1.5rem;
          font-size: 0.9rem;
          border-radius: 25px;
        }
        .dropdown-menu {
          border-radius: 8px;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-height: 200px;
          overflow-y: auto;
        }
        .dropdown-item {
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .dropdown-item:hover {
          background-color: #f1f5f9;
        }
        .input-group-prepend button {
          border-radius: 25px 0 0 25px;
          border: 1px solid #b0bec5;
          background-color: #fff;
          padding: 0.75rem 1rem;
        }
        @media (max-width: 991px) {
          .container {
            padding: 1.5rem;
          }
          .inner-container {
            padding: 1.5rem;
          }
          .alert {
            min-width: 80%;
            font-size: 0.95rem;
          }
          .alert .btn {
            padding: 0.4rem 1.2rem;
          }
        }
        @media (max-width: 576px) {
          .container {
            padding: 1rem;
          }
          .inner-container {
            padding: 1rem;
          }
          h1 {
            font-size: 1.5rem;
          }
          .alert {
            min-width: 90%;
            font-size: 0.85rem;
          }
          .alert .btn {
            padding: 0.3rem 1rem;
            font-size: 0.8rem;
          }
          .form-control {
            padding: 0.6rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateCustomerPage;