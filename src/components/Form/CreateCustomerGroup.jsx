import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const CreateCustomerGroup = () => {
  const [groupName, setGroupName] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [customerGroups, setCustomerGroups] = useState([]);
  const [editingGroupId, setEditingGroupId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchCustomerGroups = async () => {
    try {
      const response = await fetch('/api/customer-groups');
      const data = await response.json();
      setCustomerGroups(data);
    } catch (error) {
      console.error('Error fetching customer groups:', error);
    }
  };

  useEffect(() => {
    fetchCustomerGroups();
  }, []);

  const handleCreateOrUpdateGroup = async () => {
    if (!groupName.trim()) {
      setWarningMessage("Group name is required.");
      setWarningType("warning");
      return;
    }

    try {
      const groupData = {
        group_name: groupName.trim(),
      };

      let url = '/api/customer-groups';
      let method = 'POST';
      if (editingGroupId) {
        url = `/api/customer-groups/${editingGroupId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        const responseData = await response.json();
        setWarningMessage(editingGroupId ? 'Customer group updated successfully!' : 'Customer group created successfully!');
        setWarningType("success");
        setGroupName("");
        setEditingGroupId(null);
        fetchCustomerGroups();
        if (location.state?.fromCreateCustomer) {
          navigate('/create-customer', { state: { newGroupId: responseData._id || editingGroupId } });
        }
      } else {
        const errorData = await response.json();
        setWarningMessage(errorData.error || (editingGroupId ? 'Failed to update customer group' : 'Failed to create customer group'));
        setWarningType("warning");
      }
    } catch (error) {
      console.error('Error:', error);
      setWarningMessage(editingGroupId ? 'Error while updating customer group' : 'Error while creating customer group');
      setWarningType("warning");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      const response = await fetch(`/api/customer-groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWarningMessage('Customer group deleted successfully!');
        setWarningType("success");
        fetchCustomerGroups();
      } else {
        const errorData = await response.json();
        setWarningMessage(errorData.error || 'Failed to delete customer group');
        setWarningType("warning");
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setWarningMessage('Error while deleting customer group');
      setWarningType("warning");
    }
  };

  const handleEditGroup = (group) => {
    setGroupName(group.group_name);
    setEditingGroupId(group._id);
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
            <h1 className="mb-0 flex-grow-1 text-center">Create a New Customer Group</h1>
          </div>
          <div className="inner-container">
            <form onSubmit={(e) => { e.preventDefault(); handleCreateOrUpdateGroup(); }}>
              <div className="form-group mb-3">
                <label htmlFor="group_name">Enter Group Name:</label>
                <input
                  type="text"
                  id="group_name"
                  className="form-control rounded-pill"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex justify-content-center mt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary rounded-pill px-5"
                >
                  {editingGroupId ? 'Update Group' : 'Save Group'}
                </button>
              </div>
            </form>

            <div className="mt-5">
              <h2 className="mb-3 text-center">Existing Customer Groups</h2>
              {customerGroups.length === 0 ? (
                <p className="text-center">No customer groups found.</p>
              ) : (
                <ul className="list-group">
                  {customerGroups.map((group) => (
                    <li key={group._id} className="list-group-item d-flex justify-content-between align-items-center rounded">
                      {group.group_name}
                      <div>
                        <button 
                          className="btn btn-primary btn-sm me-2 rounded-pill" 
                          onClick={() => handleEditGroup(group)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm rounded-pill" 
                          onClick={() => handleDeleteGroup(group._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
        h1, h2 {
          color: #2c3e50;
          font-weight: 700;
          font-size: 2rem;
        }
        h2 {
          font-size: 1.5rem;
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
        .btn-danger {
          background-color: #dc3545;
          border-color: #dc3545;
          padding: 0.5rem 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-danger:hover {
          background-color: #c82333;
          border-color: #c82333;
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
        .list-group-item {
          border-radius: 8px;
          margin-bottom: 10px;
          background-color: #fff;
          border: 1px solid #b0bec5;
          padding: 1rem;
        }
        .list-group-item:hover {
          background-color: #f8f9fa;
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
          h2 {
            font-size: 1.2rem;
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
          .btn-primary, .btn-secondary, .btn-danger {
            padding: 0.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateCustomerGroup;