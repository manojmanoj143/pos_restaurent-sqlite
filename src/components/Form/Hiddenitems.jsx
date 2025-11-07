// src/components/Form/Hiddenitems.jsx
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Alert } from "react-bootstrap";
import { FaArrowLeft, FaEye, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

const Hiddenitems = () => {
  const [hiddenItems, setHiddenItems] = useState([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:8000`);
        } else {
          setBaseUrl("");
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl("");
      }
    };
    fetchConfig();
  }, []);

  // Fetch hidden items
  const handleFetchHiddenItems = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/hidden-items`);
      setHiddenItems(response.data);
    } catch (error) {
      console.error("Error fetching hidden items:", error);
      setWarningMessage("Error while fetching hidden items");
    }
  };

  // Unhide an item
  const handleUnhideItem = async (itemId) => {
    try {
      const response = await axios.patch(`${baseUrl}/api/items/${itemId}/unhide`);
      if (response.status === 200) {
        await handleFetchHiddenItems();
        setWarningMessage("Item unhidden successfully!");
      }
    } catch (error) {
      console.error('Error unhiding item:', error);
      setWarningMessage(error.response?.data?.error || 'Error while unhiding item');
    }
  };

  // Force delete hidden item
  const handleForceDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to permanently delete this item? Sales history will remain.")) {
      try {
        await axios.delete(`${baseUrl}/api/items/${itemId}/force-delete`);
        await handleFetchHiddenItems();
        setWarningMessage("Item deleted successfully!");
      } catch (error) {
        setWarningMessage(error.response?.data?.error || 'Error deleting item');
      }
    }
  };

  // Go back to ItemListPage
  const goBack = () => {
    navigate('/items');
  };

  // Initial fetch
  useEffect(() => {
    if (baseUrl !== null) {
      handleFetchHiddenItems();
    }
  }, [baseUrl]);

  // Enhanced styles for better design and alignment
  const containerStyle = {
    background: "linear-gradient(135deg, rgb(161, 196, 253) 0%, rgb(194, 233, 251) 100%)",
    minHeight: "100vh",
    padding: "20px",
    position: "relative",
  };

  const contentStyle = {
    marginLeft: "80px",
    marginTop: "80px",
    maxWidth: "1400px",
  };

  const headerStyle = {
    color: "#2c3e50",
    fontWeight: "bold",
    textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
    marginBottom: "10px",
  };

  const descriptionStyle = {
    color: "#34495e",
    fontSize: "1.1rem",
    lineHeight: "1.5",
    marginBottom: "30px",
  };

  const tableStyle = {
    fontSize: "0.9rem",
    marginTop: "10px",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  };

  const summaryStyle = {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    backdropFilter: "blur(10px)",
  };

  const cardStyle = {
    maxWidth: "100%",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
    borderRadius: "12px",
    border: "none",
    marginBottom: "30px",
    background: "rgba(255, 255, 255, 0.95)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  };

  const cardHoverStyle = {
    transform: "translateY(-5px)",
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)",
  };

  const backButtonStyle = {
    position: "fixed",
    top: "20px",
    left: "20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    color: "#fff",
    borderRadius: "50px",
    padding: "12px 16px",
    cursor: "pointer",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  };

  const alertStyle = {
    marginLeft: "0",
    marginTop: "20px",
    maxWidth: "800px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    background: "rgba(255, 193, 7, 0.9)",
  };

  const noItemsStyle = {
    color: "#7f8c8d",
    fontSize: "1.2rem",
    textAlign: "center",
    padding: "40px",
    background: "rgba(255, 255, 255, 0.7)",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  };

  return (
    <div style={containerStyle} className="container-fluid p-4">
      {/* Enhanced Back Button */}
      <button
        onClick={goBack}
        style={backButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        }}
      >
        <FaArrowLeft style={{ fontSize: "18px", marginRight: "5px" }} />
        Back
      </button>

      {/* Main Content */}
      <div style={contentStyle}>
        <h2 style={headerStyle}>Hidden Items</h2>
        <p style={descriptionStyle}>
          These items are hidden because they have associated sales. They won't appear in the item list. Manage them here with options to unhide or force delete.
        </p>

        {warningMessage && (
          <Alert variant="warning" style={alertStyle}>
            {warningMessage}
            <button
              style={{ 
                float: "right", 
                background: "none", 
                border: "none", 
                color: "#fff", 
                cursor: "pointer", 
                fontSize: "20px",
                fontWeight: "bold",
                opacity: "0.8",
                transition: "opacity 0.3s ease"
              }}
              onClick={() => setWarningMessage("")}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.8"}
            >
              ×
            </button>
          </Alert>
        )}

        {hiddenItems.length === 0 ? (
          <div style={noItemsStyle}>
            <FaEye style={{ fontSize: "4rem", color: "#bdc3c7", marginBottom: "15px", display: "block", margin: "0 auto" }} />
            <p>No hidden items found. Everything is visible and ready!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {hiddenItems.map((hiddenItem, index) => (
              <Card 
                key={hiddenItem._id} 
                className="mb-0" 
                style={cardStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.1)";
                }}
              >
                <Card.Body style={{ padding: "25px" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <Card.Title style={{ fontSize: "1.8rem", color: "#2c3e50", margin: 0, flex: 1 }}>
                      {hiddenItem.item_name}
                    </Card.Title>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleUnhideItem(hiddenItem._id)}
                        style={{ 
                          borderRadius: "20px", 
                          padding: "8px 16px",
                          fontWeight: "500",
                          transition: "all 0.3s ease",
                          background: "linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)",
                          border: "none"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        <FaEye style={{ marginRight: "5px" }} /> Unhide
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleForceDelete(hiddenItem._id)}
                        style={{ 
                          borderRadius: "20px", 
                          padding: "8px 16px",
                          fontWeight: "500",
                          transition: "all 0.3s ease",
                          background: "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
                          border: "none"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        <FaTrash style={{ marginRight: "5px" }} /> Confirm Delete
                      </Button>
                    </div>
                  </div>

                  {hiddenItem.sales && hiddenItem.sales.length > 0 ? (
                    <>
                      <h6 style={{ color: "#34495e", marginBottom: "15px", fontSize: "1.1rem", fontWeight: "600" }}>
                        Sales History ({hiddenItem.sales.length})
                      </h6>
                      <div style={{ overflowX: "auto", borderRadius: "8px" }}>
                        <Table striped bordered hover size="sm" style={tableStyle}>
                          <thead style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)" }}>
                            <tr>
                              <th style={{ textAlign: "center", width: "120px", fontWeight: "600", color: "#2c3e50" }}>Invoice No</th>
                              <th style={{ textAlign: "center", width: "100px", fontWeight: "600", color: "#2c3e50" }}>Customer</th>
                              <th style={{ textAlign: "center", width: "120px", fontWeight: "600", color: "#2c3e50" }}>Date</th>
                              <th style={{ textAlign: "center", width: "100px", fontWeight: "600", color: "#2c3e50" }}>Time</th>
                              <th style={{ textAlign: "center", width: "100px", fontWeight: "600", color: "#2c3e50" }}>Payment</th>
                              <th style={{ textAlign: "center", width: "120px", fontWeight: "600", color: "#2c3e50" }}>Subtotal</th>
                              <th style={{ textAlign: "center", width: "80px", fontWeight: "600", color: "#2c3e50" }}>VAT</th>
                              <th style={{ textAlign: "center", width: "100px", fontWeight: "600", color: "#2c3e50" }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hiddenItem.sales.map((sale, idx) => (
                              <tr key={idx} style={{ transition: "background-color 0.2s ease" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}>
                                <td style={{ textAlign: "center", fontWeight: "500" }}>{sale.invoice_no}</td>
                                <td style={{ textAlign: "center", fontWeight: "500" }}>{sale.customer || 'N/A'}</td>
                                <td style={{ textAlign: "center", fontWeight: "500" }}>{sale.date}</td>
                                <td style={{ textAlign: "center", fontWeight: "500" }}>{sale.time}</td>
                                <td style={{ textAlign: "center", fontWeight: "500" }}>{sale.payment_method || 'CASH'}</td>
                                <td style={{ textAlign: "center", fontWeight: "500" }}>{hiddenItem.summary.currency} {sale.total}</td>
                                <td style={{ textAlign: "center", fontWeight: "500" }}>{hiddenItem.summary.currency} {sale.vat_amount}</td>
                                <td style={{ textAlign: "center", fontWeight: "600", color: "#27ae60" }}>{hiddenItem.summary.currency} {sale.grand_total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                      <div style={summaryStyle}>
                        <h6 style={{ marginBottom: "15px", color: "#2c3e50", fontWeight: "600" }}>
                          <strong>Summary:</strong>
                        </h6>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", fontSize: "1rem" }}>
                          <p style={{ margin: 0 }}><strong>Total Records:</strong> <span style={{ color: "#3498db" }}>{hiddenItem.summary.total_records}</span></p>
                          <p style={{ margin: 0 }}><strong>Total Quantity Sold:</strong> <span style={{ color: "#3498db" }}>{hiddenItem.summary.total_qty_sold}</span></p>
                          <p style={{ margin: 0 }}><strong>Subtotal:</strong> <span style={{ color: "#27ae60" }}>{hiddenItem.summary.currency} {hiddenItem.summary.subtotal}</span></p>
                          <p style={{ margin: 0 }}><strong>VAT:</strong> <span style={{ color: "#f39c12" }}>{hiddenItem.summary.currency} {hiddenItem.summary.vat}</span></p>
                          <p style={{ margin: 0 }}><strong>Grand Total:</strong> <span style={{ color: "#e74c3c", fontWeight: "600" }}>{hiddenItem.summary.currency} {hiddenItem.summary.grand_total}</span></p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ 
                      textAlign: "center", 
                      color: "#7f8c8d", 
                      padding: "20px",
                      background: "rgba(248, 249, 250, 0.8)",
                      borderRadius: "8px",
                      border: "1px dashed #bdc3c7"
                    }}>
                      <FaEye style={{ fontSize: "2rem", color: "#bdc3c7", marginBottom: "10px" }} />
                      <p>No sales associated with this item.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hiddenitems;