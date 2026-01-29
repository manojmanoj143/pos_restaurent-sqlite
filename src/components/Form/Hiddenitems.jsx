// src/components/Form/Hiddenitems.jsx
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Alert, Collapse } from "react-bootstrap";
import { FaArrowLeft, FaEye, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
const Hiddenitems = () => {
  const [hiddenItems, setHiddenItems] = useState([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [expandedSales, setExpandedSales] = useState({}); // State to track expanded sales for each item
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
      // Initialize expanded state for new items
      const initialExpanded = response.data.reduce((acc, item) => {
        acc[item._id] = false;
        return acc;
      }, {});
      setExpandedSales(initialExpanded);
    } catch (error) {
      console.error("Error fetching hidden items:", error);
      setWarningMessage("Error while fetching hidden items");
    }
  };
  // Toggle sales expansion for a specific item
  const toggleSalesExpansion = (itemId) => {
    setExpandedSales(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
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
  // UPDATED: Go back to AdminPage
  const goBack = () => {
    navigate('/admin');
  };
  // NEW: Function to get matching entries for the specific hidden item (similar to SalesReport's getMatchingEntries)
  const getMatchingEntriesForItem = (sales, filterItem) => {
    const lowerFilter = filterItem.toLowerCase();
    const entries = [];
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        // Match main item
        if (item.item_name && item.item_name.toLowerCase() === lowerFilter) {
          const baseAmount = parseFloat(item.amount) || parseFloat(item.basePrice) || 0;
          entries.push({
            type: 'Item',
            name: item.item_name,
            qty: item.quantity || 0,
            unitPrice: baseAmount,
            total: baseAmount * (item.quantity || 1),
            invoice_no: sale.invoice_no,
            customer: sale.customer || 'N/A',
            date: sale.date,
            time: sale.time,
            paymentMode: sale.payments?.[0]?.mode_of_payment || sale.payment_method || 'CASH',
            sale,
          });
        }
        // Match addons
        if (item.addons && item.addons.length > 0) {
          item.addons.forEach((addon) => {
            if (addon.addon_name && addon.addon_name.toLowerCase() === lowerFilter) {
              const addonContrib = (parseFloat(addon.addon_price) || 0) * (addon.addon_quantity || 1);
              entries.push({
                type: 'Addon',
                name: `${addon.addon_name}${addon.size ? ` (${addon.size})` : ''}`,
                qty: (addon.addon_quantity || 0) * (item.quantity || 1),
                unitPrice: parseFloat(addon.addon_price) || 0,
                total: addonContrib * (item.quantity || 1),
                invoice_no: sale.invoice_no,
                customer: sale.customer || 'N/A',
                date: sale.date,
                time: sale.time,
                paymentMode: sale.payments?.[0]?.mode_of_payment || sale.payment_method || 'CASH',
                sale,
                parentItem: item.item_name,
              });
            }
          });
        }
        // Match combos (using name1)
        if (item.selectedCombos && item.selectedCombos.length > 0) {
          item.selectedCombos.forEach((combo) => {
            if (combo.name1 && combo.name1.toLowerCase() === lowerFilter) {
              const comboContrib = (parseFloat(combo.combo_price) || 0) * (combo.combo_quantity || 1);
              entries.push({
                type: 'Combo',
                name: `${combo.name1}${combo.size ? ` (${combo.size})` : ''}`,
                qty: (combo.combo_quantity || 0) * (item.quantity || 1),
                unitPrice: parseFloat(combo.combo_price) || 0,
                total: comboContrib * (item.quantity || 1),
                invoice_no: sale.invoice_no,
                customer: sale.customer || 'N/A',
                date: sale.date,
                time: sale.time,
                paymentMode: sale.payments?.[0]?.mode_of_payment || sale.payment_method || 'CASH',
                sale,
                parentItem: item.item_name,
              });
            }
          });
        }
      });
    });
    // Sort by date descending
    return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  };
  // Initial fetch
  useEffect(() => {
    if (baseUrl !== null) {
      handleFetchHiddenItems();
    }
  }, [baseUrl]);
  // Enhanced styles for better design and alignment
  const containerStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
    height: "100vh",
    overflowY: "auto",
    padding: "20px",
    position: "relative"
  };
  const contentStyle = {
    maxWidth: "1250px",
    margin: "80px auto 20px",
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  };
  const headerStyle = {
    color: "#2c3e50",
    fontWeight: "bold",
    textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
    marginBottom: "10px",
    textAlign: 'center',
    fontSize: '1.8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  };
  const descriptionStyle = {
    color: "#34495e",
    fontSize: "1.1rem",
    lineHeight: "1.5",
    marginBottom: "30px",
    textAlign: 'center'
  };
  const tableStyle = {
    fontSize: "0.85rem",
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
    backgroundColor: 'transparent',
    border: '2px solid #3498db',
    color: '#3498db',
    cursor: "pointer",
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
  // UPDATED: Style for item image in header - Ensured proper loading (Enhanced for consistency with ItemListPage)
  const itemImageStyle = {
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "8px",
    marginRight: "15px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };
  // NEW: Style for sales toggle button
  const toggleButtonStyle = {
    background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
    border: "none",
    color: "#fff",
    borderRadius: "20px",
    padding: "8px 16px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    display: "inline-flex",
    alignItems: "center",
    marginBottom: "15px",
  };
  return (
    <div style={containerStyle} className="container-fluid p-4">
      {/* Enhanced Back Button */}
      <button
        onClick={goBack}
        style={backButtonStyle}
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
            {hiddenItems.map((hiddenItem, index) => {
              // NEW: Compute matching entries for detailed view
              const matchingEntries = hiddenItem.sales ? getMatchingEntriesForItem(hiddenItem.sales, hiddenItem.item_name) : [];
              // NEW: Simple amount formatter using item's summary currency
              const formatAmount = (value) => {
                const precision = 2;
                return `${hiddenItem.summary?.currency || 'INR'} ${Number(value).toFixed(precision)}`;
              };
              // UPDATED: Compute image src consistently with ItemListPage (using /api/images/ endpoint for reliability)
              const getItemImageSrc = (imagePath) => {
                if (!imagePath) return "https://via.placeholder.com/60x60?text=No+Img";
                // Use /api/images/ endpoint to match custom fields handling in ItemListPage
                const fullBaseUrl = baseUrl || '';
                return `${fullBaseUrl}/api/images/${imagePath}`;
              };
              return (
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
                      {/* UPDATED: Item image and name in flex - Enhanced error handling for image (Consistent with ItemListPage) */}
                      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        {hiddenItem.image && (
                          <img
                            src={getItemImageSrc(hiddenItem.image)}
                            alt={hiddenItem.item_name}
                            style={itemImageStyle}
                            onError={(e) => {
                              console.error("Image load error:", e.target.src);
                              e.target.src = "https://via.placeholder.com/60x60?text=No+Img"; // Fallback placeholder
                            }}
                          />
                        )}
                        <Card.Title style={{ fontSize: "1.8rem", color: "#2c3e50", margin: 0 }}>
                          {hiddenItem.item_name}
                        </Card.Title>
                      </div>
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
                        {/* UPDATED: Toggle button for sales history table only - Now uses matchingEntries.length */}
                        <Button
                          onClick={() => toggleSalesExpansion(hiddenItem._id)}
                          style={toggleButtonStyle}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                          {expandedSales[hiddenItem._id] ? (
                            <>
                              <FaChevronUp style={{ marginRight: "5px" }} /> Hide Detailed Sales History
                            </>
                          ) : (
                            <>
                              <FaChevronDown style={{ marginRight: "5px" }} /> View Detailed Sales History ({matchingEntries.length})
                            </>
                          )}
                        </Button>
                        {/* UPDATED: Collapsible sales table only (Summary moved outside) - Now detailed like SalesReport item filter */}
                        <Collapse in={expandedSales[hiddenItem._id]}>
                          <div>
                            <div style={{ overflowX: "auto", borderRadius: "8px", marginTop: "15px" }}>
                              <Table striped bordered hover size="sm" style={tableStyle}>
                                <thead style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)" }}>
                                  <tr>
                                    <th style={{ textAlign: "center", width: "120px", fontWeight: "600", color: "#2c3e50" }}>Invoice No</th>
                                    <th style={{ textAlign: "center", width: "150px", fontWeight: "600", color: "#2c3e50" }}>Customer</th>
                                    <th style={{ textAlign: "center", width: "100px", fontWeight: "600", color: "#2c3e50" }}>Date</th>
                                    <th style={{ textAlign: "center", width: "80px", fontWeight: "600", color: "#2c3e50" }}>Time</th>
                                    <th style={{ textAlign: "center", width: "100px", fontWeight: "600", color: "#2c3e50" }}>Payment</th>
                                    <th style={{ textAlign: "center", width: "80px", fontWeight: "600", color: "#2c3e50" }}>Type</th>
                                    <th style={{ textAlign: "center", width: "150px", fontWeight: "600", color: "#2c3e50" }}>Name</th>
                                    <th style={{ textAlign: "center", width: "60px", fontWeight: "600", color: "#2c3e50" }}>Qty</th>
                                    <th style={{ textAlign: "center", width: "100px", fontWeight: "600", color: "#2c3e50" }}>Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchingEntries.map((entry, idx) => (
                                    <tr key={`${entry.invoice_no}-${entry.name}-${idx}`} style={{ transition: "background-color 0.2s ease" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}>
                                      <td style={{ textAlign: "center", fontWeight: "500" }}>{entry.invoice_no}</td>
                                      <td style={{ textAlign: "center", fontWeight: "500" }}>{entry.customer}</td>
                                      <td style={{ textAlign: "center", fontWeight: "500" }}>{entry.date}</td>
                                      <td style={{ textAlign: "center", fontWeight: "500" }}>{entry.time}</td>
                                      <td style={{ textAlign: "center", fontWeight: "500" }}>{entry.paymentMode}</td>
                                      <td style={{ textAlign: "center", fontWeight: "500" }}>{entry.type} {entry.parentItem ? `(from ${entry.parentItem})` : ''}</td>
                                      <td style={{ textAlign: "center", fontWeight: "500" }}>{entry.name}</td>
                                      <td style={{ textAlign: "center", fontWeight: "500" }}>{entry.qty}</td>
                                      <td style={{ textAlign: "center", fontWeight: "600", color: "#27ae60" }}>{formatAmount(entry.total)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          </div>
                        </Collapse>
                        {/* UPDATED: Summary always visible (moved outside Collapse) */}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default Hiddenitems;