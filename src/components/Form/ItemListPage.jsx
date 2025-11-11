import React, { useState, useEffect } from "react";
import { Modal, Button, Card, Form, Badge, ListGroup, Table } from "react-bootstrap";
import { FaArrowLeft, FaPlusCircle, FaEye, FaEyeSlash, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

const ItemListPage = () => {
  const [itemList, setItemList] = useState([]);
  const [comboList, setComboList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [offerItem, setOfferItem] = useState(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerStartTime, setOfferStartTime] = useState("");
  const [offerEndTime, setOfferEndTime] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [nutritionData, setNutritionData] = useState({ ingredients: [], nutrition: {} });
  const [itemSales, setItemSales] = useState([]);
  const [baseUrl, setBaseUrl] = useState("");
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

  // Fetch all items (excluding hidden)
  const handleViewItems = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/items`);
      setItemList(response.data); // Backend already filters hidden
    } catch (error) {
      console.error("Error:", error);
      setWarningMessage("Error while fetching items");
    }
  };

  // Fetch all combo offers
  const handleViewCombos = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/combo-offer`);
      setComboList(response.data);
    } catch (error) {
      console.error("Error:", error);
      setWarningMessage("Error while fetching combo offers");
    }
  };

  // Fetch sales for selected item
  const fetchItemSales = async (itemId) => {
    try {
      const response = await axios.get(`${baseUrl}/api/items/${itemId}/sales`);
      setItemSales(response.data);
    } catch (error) {
      console.error("Error fetching item sales:", error);
      setWarningMessage("Error while fetching sales for this item");
    }
  };

  // Handle item or combo click to view details
  const handleItemClick = async (item, isCombo = false) => {
    const normalizedIngredients = normalizeIngredients(item.ingredients);
    setSelectedItem({ ...item, isCombo });
    setNutritionData({
      ingredients: normalizedIngredients,
      nutrition: item.nutrition || {},
    });
    if (!isCombo) {
      await fetchItemSales(item._id); // Fetch sales only for non-combo items
    }
    setShowModal(true);
  };

  // Handle sale click to view details
  const handleSaleClick = (sale) => {
    setSelectedSale(sale);
    setShowSaleModal(true);
  };

  // Delete sale
  const handleDeleteSale = async () => {
    if (selectedSale) {
      try {
        const response = await axios.delete(`${baseUrl}/api/sales/${selectedSale.invoice_no}`);
        if (response.status === 200) {
          setItemSales(itemSales.filter(sale => sale.invoice_no !== selectedSale.invoice_no));
          setShowSaleModal(false);
          setSelectedSale(null);
          setWarningMessage("Sale deleted successfully!");
          // Refresh item sales
          if (selectedItem) {
            await fetchItemSales(selectedItem._id);
          }
        } else {
          setWarningMessage(`Failed to delete sale: ${response.data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting sale:', error);
        setWarningMessage(error.response?.data?.error || 'Error while deleting sale');
      }
    }
  };

  // Close the item details modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setItemSales([]);
  };

  // Close the sale details modal
  const handleCloseSaleModal = () => {
    setShowSaleModal(false);
    setSelectedSale(null);
  };

  // Close the offer modal
  const handleCloseOfferModal = () => {
    setShowOfferModal(false);
    setOfferItem(null);
    setSearchTerm("");
    setOfferPrice("");
    setOfferStartTime("");
    setOfferEndTime("");
  };

  // Close the nutrition modal
  const handleCloseNutritionModal = () => {
    setShowNutritionModal(false);
  };

  // Go back to the previous page
  const goBack = () => {
    navigate('/admin');
  };

  // Delete item or combo - Modified to hide if has sales
  const handleDeleteItem = async () => {
    if (selectedItem) {
      try {
        const endpoint = selectedItem.isCombo
          ? `${baseUrl}/api/combo-offer/${selectedItem._id}`
          : `${baseUrl}/api/items/${selectedItem._id}`;
        const response = await axios.delete(endpoint);
        if (response.status === 200) {
          if (selectedItem.isCombo) {
            setComboList(comboList.filter(combo => combo._id !== selectedItem._id));
          } else {
            // Refresh items to reflect hide/delete
            await handleViewItems();
          }
          handleCloseModal();
          setWarningMessage(response.data.message || (selectedItem.isCombo ? "Combo offer deleted successfully!" : "Item handled successfully!"));
        } else {
          const errorData = response.data;
          setWarningMessage(`Failed to handle: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error:', error);
        setWarningMessage(error.response?.data?.error || 'Error while handling item');
      }
    }
  };

  // Edit item or combo
  const handleEditItem = () => {
    if (selectedItem.isCombo) {
      navigate("/combo-offer", {
        state: { combo: selectedItem },
      });
    } else {
      navigate("/create-item", {
        state: { item: { ...selectedItem, ingredients: normalizeIngredients(selectedItem.ingredients) } },
      });
    }
  };

  // Handle offer button click
  const handleOfferClick = () => {
    setShowOfferModal(true);
  };

  // Handle selecting an item for offer
  const handleOfferItemSelect = (item) => {
    setOfferItem(item);
    setOfferPrice("");
    setOfferStartTime("");
    setOfferEndTime("");
  };

  // Submit offer
  const handleOfferSubmit = async () => {
    if (!offerItem || !offerPrice || !offerStartTime || !offerEndTime) {
      setWarningMessage("Please fill all offer details");
      return;
    }
    try {
      const startTime = new Date(offerStartTime);
      const endTime = new Date(offerEndTime);
      if (startTime >= endTime) {
        setWarningMessage("Offer start time must be before end time");
        return;
      }
      const offerData = {
        offer_price: parseFloat(offerPrice),
        offer_start_time: startTime.toISOString(),
        offer_end_time: endTime.toISOString(),
      };
      const response = await axios.put(`${baseUrl}/api/items/${offerItem._id}/offer`, offerData);
      if (response.status === 200) {
        await handleViewItems();
        handleCloseOfferModal();
        setWarningMessage("Offer added successfully!");
      } else {
        const errorData = response.data;
        setWarningMessage(`Failed to add offer: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setWarningMessage('Error while adding offer');
    }
  };

  // Handle Ingredients & Nutrition button click
  const handleNutritionClick = () => {
    setShowNutritionModal(true);
  };

  // Handle Add New Item button click
  const handleAddNewItem = () => {
    navigate('/create-item');
  };

  // Handle Hidden Items button click - Now navigates to separate page
  const handleHiddenItemsClick = () => {
    navigate('/hidden-items');
  };

  // Normalize ingredients to always be an array
  const normalizeIngredients = (ingredients) => {
    if (Array.isArray(ingredients)) {
      return ingredients;
    }
    if (typeof ingredients === 'string' && ingredients.trim() !== '') {
      return [{ name: ingredients }];
    }
    if (typeof ingredients === 'object' && ingredients !== null && Object.keys(ingredients).length > 0) {
      return [ingredients];
    }
    return [];
  };

  // Initial fetch and refresh on popstate
  useEffect(() => {
    if (baseUrl !== null) {
      handleViewItems();
      handleViewCombos();
    }
  }, [baseUrl]);

  useEffect(() => {
    const handlePopState = () => {
      handleViewItems();
      handleViewCombos();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Inline styles
  const sidebarStyle = {
    position: "fixed",
    top: "70px",
    left: "0",
    width: "200px",
    height: "calc(100vh - 70px)",
    backgroundColor: "#f8f9fa",
    padding: "20px",
    overflowY: "auto",
    borderRight: "1px solid #ddd",
  };

  const categoryBoxStyle = {
    padding: "10px",
    marginBottom: "10px",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "5px",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.3s ease",
  };

  const selectedCategoryBoxStyle = {
    ...categoryBoxStyle,
    backgroundColor: "#28a745",
    color: "white",
    borderColor: "#28a745",
  };

  // UPDATED: Regular item card style
  const cardStyle = {
    border: "1px solid #eee",
    backgroundColor: "#fdfdfd",
    padding: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  };

  // UPDATED: Regular item card hover style
  const cardHoverStyle = {
    transform: "translateY(-5px)",
    boxShadow: "0 6px 10px rgba(0, 0, 0, 0.15)",
    borderColor: "#28a745"
  };

  const imgStyle = {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    borderRadius: "8px",
  };

  const contentStyle = {
    marginLeft: "220px",
    padding: "20px",
  };

  const priceStyle = {
    fontSize: "1rem",
    marginTop: "5px",
  };

  const strikethroughStyle = {
    textDecoration: "line-through",
    color: "#888",
    marginRight: "10px",
  };

  const offerPriceStyle = {
    color: "#ff4500",
    fontWeight: "bold",
  };

  const warningBoxStyle = {
    backgroundColor: "#fff3cd",
    border: "1px solid #ffeeba",
    color: "#856404",
    padding: "15px",
    marginBottom: "20px",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "60px",
  };

  const warningTextStyle = {
    margin: 0,
    fontSize: "14px",
  };

  const closeWarningStyle = {
    background: "none",
    border: "none",
    color: "#856404",
    cursor: "pointer",
    fontSize: "16px",
  };

  // UPDATED: multipleImagesStyle to center content
  const multipleImagesStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "10px",
    justifyContent: "center", // Center the images
  };

  const nutritionModalStyle = {
    padding: "20px",
  };

  const nutritionItemStyle = {
    marginBottom: "10px",
    fontSize: "1rem",
  };

  // Style for the fixed back button
  const backButtonStyle = {
    position: "fixed",
    top: "20px",
    left: "20px",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ccc",
    color: "#333",
    borderRadius: "5px",
    padding: "10px",
    cursor: "pointer",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
  };

  // UPDATED: Poster style for combo offers
  const posterStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    color: "#ffffff",
    position: "relative",
    cursor: "pointer",
    transition: "all 0.3s ease",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    height: "auto",
  };

  // UPDATED: Logo style for new combo card
  const logoStyle = {
    position: "absolute",
    top: "8px",
    left: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#ffffff",
    textShadow: "0 1px 3px rgba(0,0,0,0.3)"
  };

  // UPDATED: Offer name for new combo card
  const offerNameStyle = {
    fontSize: "22px",
    marginBottom: "8px",
    textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
    fontFamily: 'ui-sans-serif',
    color: "#ffffff",
    fontWeight: "600",
  };

  // UPDATED: Offer period for new combo card
  const offerPeriodStyle = {
    fontSize: "13px",
    color: "#ffffff",
    marginBottom: "8px",
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
  };

  // NEW: Style for uploaded multiple images - centered, larger thumbs
  const uploadedImagesStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "12px",
    justifyContent: "center",
  };

  const uploadedImageThumbStyle = {
    width: "60px", // Slightly larger for neat display
    height: "60px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "2px solid rgba(255, 255, 255, 0.5)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  // UPDATED: Items list for new combo card - full width, centered
  const itemsListStyle = {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "8px",
    padding: "10px",
    marginBottom: "8px",
    textAlign: "left",
  };

  // NEW: Item list item with image next to name - flex row
  const itemsListItemStyle = {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: "6px",
    listStyleType: "none",
    paddingLeft: "0",
  };

  const itemImageStyle = {
    width: "30px",
    height: "30px",
    objectFit: "cover",
    borderRadius: "4px",
    marginRight: "8px",
    border: "1px solid rgba(255, 255, 255, 0.5)",
  };

  // UPDATED: Total price for new combo card
  const totalPriceStyle = {
    fontSize: "18px",
    margin: "12px 0",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    padding: "8px",
    borderRadius: "8px",
    color: "#fdd835", // Bright yellow for price
    fontWeight: "bold",
    textAlign: "center",
  };

  // UPDATED: Limited offer for new combo card
  const limitedOfferStyle = {
    fontSize: "13px",
    color: "#fdd835", // Bright yellow
    marginTop: "8px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    textAlign: "center",
  };

  // UPDATED: View button for new combo card
  const viewButtonStyle = {
    marginTop: "8px",
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
    color: "#764ba2", // Match gradient
    fontWeight: "bold",
    padding: "6px 12px",
    borderRadius: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    display: "block",
    margin: "8px auto 0",
    transition: "all 0.3s ease",
  };

  // UPDATED: Get unique categories from items, including Combos Offer
  const getCategories = () => {
    const categories = [...new Set(itemList.map(item => item.item_group))];
    const filteredCategories = categories.filter(category => category);
    return ["All Items", ...filteredCategories, `Combos Offer (${comboList.length})`];
  };

  // Handle category selection
  const handleCategoryClick = (category) => {
    const cleanCategory = category.replace(/\s*\(\d+\)\s*$/, '');
    setSelectedCategory(cleanCategory);
  };

  // Filter items based on selected category
  const filteredItems = selectedCategory === "All Items"
    ? itemList
    : selectedCategory === "Combos Offer"
    ? comboList
    : itemList.filter(item => item.item_group === selectedCategory);

  // Check if item has an active offer
  const hasActiveOffer = (item) => {
    if (item.offer_price === undefined || !item.offer_start_time || !item.offer_end_time) {
      return false;
    }
    const currentTime = new Date();
    const startTime = new Date(item.offer_start_time);
    const endTime = new Date(item.offer_end_time);
    return startTime <= currentTime && currentTime <= endTime;
  };

  // Format nutrition field names for display
  const formatNutritionLabel = (key) => {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
  };

  // Render ingredients based on their type
  const renderIngredients = (ingredients) => {
    if (!ingredients) {
      return null;
    }
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      return (
        <ul>
          {ingredients.map((ingredient, index) => (
            <li key={index}>
              {ingredient.name || 'Unnamed ingredient'}
              {ingredient.quantity && ingredient.unit
                ? ` (${ingredient.quantity} ${ingredient.unit})`
                : ''}
              {ingredient.optional ? ' (Optional)' : ''}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof ingredients === 'string' && ingredients.trim() !== '') {
      return <p>{ingredients}</p>;
    }
    if (typeof ingredients === 'object' && ingredients !== null && Object.keys(ingredients).length > 0) {
      return (
        <ul>
          <li>
            {ingredients.name || 'Unnamed ingredient'}
            {ingredients.quantity && ingredients.unit
              ? ` (${ingredients.quantity} ${ingredients.unit})`
              : ''}
            {ingredients.optional ? ' (Optional)' : ''}
          </li>
        </ul>
      );
    }
    return null;
  };

  // Check if there's valid data to display
  const hasValidData = () => {
    const hasIngredients =
      (Array.isArray(nutritionData.ingredients) && nutritionData.ingredients.length > 0) ||
      (typeof nutritionData.ingredients === 'string' && nutritionData.ingredients.trim() !== '') ||
      (typeof nutritionData.ingredients === 'object' && nutritionData.ingredients !== null && Object.keys(nutritionData.ingredients).length > 0);
    const hasNutrition =
      nutritionData.nutrition &&
      Object.keys(nutritionData.nutrition).length > 0 &&
      Object.entries(nutritionData.nutrition).some(([_, value]) => value !== '' && value !== null && value !== undefined);
    return hasIngredients || hasNutrition;
  };

  // Searched items for offer modal
  const searchedItems = itemList.filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()));

  // UPDATED: Function to get combo items with images and names (for side-by-side display)
  const getComboItemsWithImages = (combo) => {
    const itemsWithImages = [];
    if (combo.items && combo.items.length > 0) {
      combo.items.forEach(comboItem => {
        const name = comboItem.data.item_name || comboItem.data.name1 || '';
        const image = comboItem.data.image || comboItem.data.addon_image || comboItem.data.combo_image || comboItem.data.item_image || null;
        if (name.trim() !== '') {
          itemsWithImages.push({ name, image });
        }
      });
    }
    return itemsWithImages;
  };

  // NEW: Function to get only uploaded images for centered display
  const getUploadedImages = (combo) => {
    if (combo.images && combo.images.length > 0) {
      return combo.images.map(img => `/api/combo-images/${img}`);
    }
    return [];
  };

  return (
    <div className="container-fluid mt-5">
      <button
        onClick={goBack}
        style={backButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#e0e0e0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#f0f0f0";
        }}
      >
        <FaArrowLeft style={{ fontSize: "24px" }} />
      </button>
      <button
        onClick={handleOfferClick}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: "#ff4500",
          border: "none",
          color: "white",
          borderRadius: "5px",
          padding: "10px 20px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          transition: "all 0.3s ease",
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#ff6347";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ff4500";
        }}
      >
        Offer
      </button>
      <button
        onClick={handleAddNewItem}
        style={{
          position: "fixed",
          top: "20px",
          right: "120px",
          backgroundColor: "#28a745",
          border: "none",
          color: "white",
          borderRadius: "5px",
          padding: "10px 20px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          transition: "all 0.3s ease",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#218838";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#28a745";
        }}
      >
        <FaPlusCircle style={{ marginRight: "5px" }} /> Add New Item
      </button>
      <button
        onClick={handleHiddenItemsClick}
        style={{
          position: "fixed",
          top: "20px",
          right: "320px",
          backgroundColor: "#6c757d",
          border: "none",
          color: "white",
          borderRadius: "5px",
          padding: "10px 20px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          transition: "all 0.3s ease",
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#5a6268";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#6c757d";
        }}
      >
        <FaEyeSlash style={{ marginRight: "5px" }} /> Hidden Items
      </button>
      {warningMessage && (
        <div style={warningBoxStyle}>
          <p style={warningTextStyle}>{warningMessage}</p>
          <button
            style={closeWarningStyle}
            onClick={() => setWarningMessage("")}
          >
            ×
          </button>
        </div>
      )}
      <div style={sidebarStyle}>
        <h4>Categories</h4>
        {getCategories().map((category) => {
          const [catName, count] = category.split(' (');
          return (
            <div
              key={catName}
              style={catName === selectedCategory ? selectedCategoryBoxStyle : categoryBoxStyle}
              onClick={() => handleCategoryClick(catName)}
              onMouseEnter={(e) => {
                if (catName !== selectedCategory) {
                  e.currentTarget.style.backgroundColor = "#e9ecef";
                }
              }}
              onMouseLeave={(e) => {
                if (catName !== selectedCategory) {
                  e.currentTarget.style.backgroundColor = "#fff";
                }
              }}
            >
              {catName}
              {count && <Badge variant="primary" style={{ marginLeft: "5px" }}>{count.replace(')', '')}</Badge>}
            </div>
          );
        })}
      </div>
      <div style={contentStyle}>
        <h2>{selectedCategory ? `${selectedCategory} Items` : "Select a Category"}</h2>
        <div className="row">
          {itemList.length === 0 ? (
            <p>No items to display.</p>
          ) : !selectedCategory ? (
            <p>Please select a category from the sidebar.</p>
          ) : selectedCategory === "Combos Offer" ? (
            filteredItems.map((combo) => (
              <div key={combo._id} className="col-md-3 mb-4">
                <Card
                  style={posterStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px) scale(1.01)";
                    e.currentTarget.style.boxShadow = "0 8px 15px rgba(0, 0, 0, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                  }}
                >
                  <div style={logoStyle}>K</div>
                  {/* Top: Offer name center */}
                  <h4 style={offerNameStyle}>{combo.description}</h4>
                  {/* Offer period in one line if active */}
                  {hasActiveOffer(combo) && (
                    <p style={offerPeriodStyle}>
                      <strong>Offer Period:</strong> {new Date(combo.offer_start_time).toLocaleDateString()} {new Date(combo.offer_start_time).toLocaleTimeString()} to {new Date(combo.offer_end_time).toLocaleDateString()} {new Date(combo.offer_end_time).toLocaleTimeString()}
                    </p>
                  )}
                  {/* NEW: Centered uploaded multiple images section */}
                  {(() => {
                    const uploadedImages = getUploadedImages(combo);
                    if (uploadedImages.length > 0) {
                      return (
                        <div style={uploadedImagesStyle}>
                          {uploadedImages.map((imgPath, idx) => {
                            const src = `${baseUrl}${imgPath}`;
                            return (
                              <img
                                key={idx}
                                src={src}
                                alt={`Uploaded combo image ${idx + 1}`}
                                style={uploadedImageThumbStyle}
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/60?text=No+Img";
                                }}
                              />
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {/* UPDATED: Full width items list with images next to names */}
                  <ul style={itemsListStyle}>
                    {getComboItemsWithImages(combo).map((itemWithImage, idx) => (
                      <li key={idx} style={itemsListItemStyle}>
                        {itemWithImage.image && (
                          <img
                            src={`${baseUrl}${itemWithImage.image}`}
                            alt={itemWithImage.name}
                            style={itemImageStyle}
                            onError={(e) => {
                              e.target.style.display = "none"; // Hide if error
                            }}
                          />
                        )}
                        {itemWithImage.name}
                      </li>
                    ))}
                  </ul>
                  {/* Bottom center: Total price with strikeout if offer */}
                  <p style={totalPriceStyle}>
                    Total Price: {hasActiveOffer(combo) ? (
                      <>
                        <span style={{ ...strikethroughStyle, color: "#aaa", fontSize: "16px" }}>₹{combo.total_price}</span>
                        <span style={{ color: "#fdd835", fontSize: "18px" }}>₹{combo.offer_price}</span>
                      </>
                    ) : (
                      <span style={{ color: "#ffffff", fontSize: "18px" }}>₹{combo.total_price}</span>
                    )}
                  </p>
                  {/* Limited offer center if active */}
                  {hasActiveOffer(combo) && <p style={limitedOfferStyle}>LIMITED OFFERS! Place Your Order</p>}
                  {/* View button center */}
                  <Button
                    variant="success"
                    onClick={() => handleItemClick(combo, true)}
                    style={viewButtonStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff";
                    }}
                  >
                    View
                  </Button>
                </Card>
              </div>
            ))
          ) : (
            filteredItems.map((item) => (
              <div key={item._id} className="col-md-2 mb-4">
                <Card
                  style={cardStyle}
                  onMouseEnter={(e) => (e.currentTarget.style = { ...cardStyle, ...cardHoverStyle })}
                  onMouseLeave={(e) => (e.currentTarget.style = cardStyle)}
                >
                  <Card.Img
                    variant="top"
                    src={`${baseUrl}${item.image}` || "https://via.placeholder.com/200x200?text=No+Image+Available"}
                    alt={item.item_name || item.name}
                    style={imgStyle}
                  />
                  <Card.Body style={{ textAlign: "center", padding: "0.75rem" }}>
                    <Card.Title style={{ fontSize: "1rem", color: "black", marginBottom: "0.5rem", height: "40px", overflow: "hidden" }}>
                      {item.item_name || item.name}
                    </Card.Title>
                    <div style={priceStyle}>
                      {hasActiveOffer(item) ? (
                        <>
                          <span style={strikethroughStyle}>₹{item.price_list_rate || item.total_price}</span>
                          <span style={offerPriceStyle}>₹{item.offer_price}</span>
                        </>
                      ) : (
                        <span>₹{item.price_list_rate || item.total_price}</span>
                      )}
                    </div>
                     <Button variant="success" onClick={() => handleItemClick(item, selectedCategory === "Combos Offer")}
                      className="w-100"
                      style={{ marginTop: "10px", backgroundColor: "#28a745", borderColor: "#28a745" }}
                    >
                      View
                    </Button>
                  </Card.Body>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Item Details Modal */}
      {selectedItem && (
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{selectedItem.item_name || selectedItem.description}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="container">
              {/* --- UPDATED LAYOUT: START --- */}
              <div className="row">
                {/* Left Column: Image */}
                <div className="col-md-5">
                  <h6>Image:</h6>
                  <img
                    src={`${baseUrl}${selectedItem.image}` || "https://via.placeholder.com/200x200?text=No+Image+Available"}
                    alt={selectedItem.item_name || selectedItem.description}
                    className="img-fluid"
                    style={{ ...imgStyle, height: "auto", maxHeight: "300px" }} // Adjusted style
                  />
                </div>
                {/* Right Column: Details */}
                <div className="col-md-7">
                  {!selectedItem.isCombo && (
                    <>
                      <h5>Item Code: {selectedItem.item_code}</h5>
                      <h5>Item Group: {selectedItem.item_group}</h5>
                      <h5>Kitchen: {selectedItem.kitchen || "Not specified"}</h5>
                    </>
                  )}
                  <h5>
                    Price:{" "}
                    {hasActiveOffer(selectedItem) ? (
                      <>
                        <span style={strikethroughStyle}>₹{selectedItem.price_list_rate || selectedItem.total_price}</span>{" "}
                        <span style={offerPriceStyle}>₹{selectedItem.offer_price}</span>
                      </>
                    ) : (
                      `₹${selectedItem.price_list_rate || selectedItem.total_price}`
                    )}
                  </h5>
                  {hasActiveOffer(selectedItem) && (
                    <>
                      <h5>Offer Starts: {new Date(selectedItem.offer_start_time).toLocaleString()}</h5>
                      <h5>Offer Ends: {new Date(selectedItem.offer_end_time).toLocaleString()}</h5>
                    </>
                  )}
                </div>
              </div>
              {/* Bottom Row: Additional Images (Centered) */}
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="row mt-3">
                  <div className="col-12">
                    <h6>Additional Images:</h6>
                    <div style={multipleImagesStyle}>
                      {selectedItem.images.map((img, idx) => {
                        const src = selectedItem.isCombo
                          ? `${baseUrl}/api/combo-images/${img}`
                          : `${baseUrl}${img}`;
                        return (
                          <img
                            key={idx}
                            src={src}
                            alt={`${selectedItem.item_name || selectedItem.description} additional ${idx + 1}`}
                            style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/100x100?text=Image+Not+Found";
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {/* --- UPDATED LAYOUT: END --- */}
              {/* Other details (Addons, Combos, Variants, etc.) can go here in new rows */}
              <div className="row mt-3">
                <div className="col-12">
                  {selectedItem.addons && selectedItem.addons.length > 0 && (
                    <div>
                      <h6>Addons:</h6>
                      <ul>
                        {selectedItem.addons
                          .filter(addon => addon.name1 || addon.addon_price > 0 || addon.addon_image)
                          .map((addon, idx) => (
                            <li key={idx}>
                              {addon.name1 && <p>Name: {addon.name1}</p>}
                              {addon.addon_price > 0 && <p>Price: ₹{addon.addon_price}</p>}
                              {addon.addon_image && (
                                <img
                                  src={`${baseUrl}${addon.addon_image}`}
                                  alt={addon.name1}
                                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                />
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {selectedItem.combos && selectedItem.combos.length > 0 && (
                    <div>
                      <h6>Combos:</h6>
                      <ul>
                        {selectedItem.combos
                          .filter(combo => combo.name1 || combo.combo_price > 0 || combo.combo_image)
                          .map((combo, idx) => (
                            <li key={idx}>
                              {combo.name1 && <p>Name: {combo.name1}</p>}
                              {combo.combo_price > 0 && <p>Price: ₹{combo.combo_price}</p>}
                              {combo.combo_image && (
                                <img
                                  src={`${baseUrl}${combo.combo_image}`}
                                  alt={combo.name1}
                                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                />
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {selectedItem.items && selectedItem.items.length > 0 && selectedItem.isCombo && (
                    <div>
                      <h6>Items in Combo:</h6>
                      <ul>
                        {selectedItem.items.map((comboItem, idx) => (
                          <li key={idx}>
                            {comboItem.data.item_name || comboItem.data.name1} - ₹{comboItem.price}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedItem.variants && selectedItem.variants.length > 0 && (
                    <div>
                      <h6>Variants:</h6>
                      <ul>
                        {selectedItem.variants
                          .filter(variant => variant.type_of_variants || variant.variant_image)
                          .map((variant, idx) => (
                            <li key={idx}>
                              {variant.type_of_variants && <p>Type: {variant.type_of_variants}</p>}
                              {variant.variant_image && (
                                <img
                                  src={`${baseUrl}${variant.variant_image}`}
                                  alt={variant.type_of_variants}
                                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                />
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {selectedItem.custom_fields && selectedItem.custom_fields.length > 0 && (
                    <div>
                      <h6>Custom Fields:</h6>
                      <ul>
                        {selectedItem.custom_fields.map((field, idx) => (
                          <li key={idx}>
                            <p>
                              {field.name}:{" "}
                              {field.type === "image" ? (
                                <img
                                  src={field.value ? `${baseUrl}/api/images/${field.value}` : "https://via.placeholder.com/100x100?text=No+Image+Available"}
                                  alt={field.name}
                                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                />
                              ) : field.type === "checkbox" ? (
                                field.value ? "Yes" : "No"
                              ) : (
                                field.value
                              )}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
            <Button variant="danger" onClick={handleDeleteItem}>Delete/Hide</Button>
            <Button variant="success" onClick={handleEditItem}>Edit</Button>
            {!selectedItem.isCombo && <Button variant="primary" onClick={handleNutritionClick}>Ingredients & Nutrition</Button>}
          </Modal.Footer>
        </Modal>
      )}
      {/* Sale Details Modal */}
      {selectedSale && (
        <Modal show={showSaleModal} onHide={handleCloseSaleModal} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>Sale Details - {selectedSale.invoice_no}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="container">
              <h5>Customer: {selectedSale.customer || 'N/A'}</h5>
              <h5>Date: {selectedSale.date}</h5>
              <h5>Time: {selectedSale.time}</h5>
              <h5>Payment Method: {selectedSale.payment_method || 'CASH'}</h5>
              <h5>Subtotal: {selectedSale.invoice_currency} {selectedSale.total}</h5>
              <h5>VAT: {selectedSale.invoice_currency} {selectedSale.vat_amount}</h5>
              <h5>Grand Total: {selectedSale.invoice_currency} {selectedSale.grand_total}</h5>
              <h6>Items:</h6>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.item_name}</td>
                      <td>{item.quantity}</td>
                      <td>{selectedSale.invoice_currency} {item.basePrice}</td>
                      <td>{selectedSale.invoice_currency} {item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseSaleModal}>Close</Button>
            <Button variant="danger" onClick={handleDeleteSale}>
              <FaTrash /> Delete Sale
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      {/* Nutrition Modal */}
      {selectedItem && (
        <Modal show={showNutritionModal} onHide={handleCloseNutritionModal}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedItem.item_name} - Ingredients & Nutrition</Modal.Title>
          </Modal.Header>
          <Modal.Body style={nutritionModalStyle}>
            {hasValidData() ? (
              <div>
                {(nutritionData.ingredients || Array.isArray(nutritionData.ingredients)) && (
                  <div style={nutritionItemStyle}>
                    <h6>Ingredients:</h6>
                    {renderIngredients(nutritionData.ingredients)}
                  </div>
                )}
                {nutritionData.nutrition && Object.keys(nutritionData.nutrition).length > 0 && (
                  <div style={nutritionItemStyle}>
                    <h6>Nutrition Information:</h6>
                    <ul>
                      {Object.entries(nutritionData.nutrition)
                        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
                        .map(([key, value]) => (
                          <li key={key}>
                            <strong>{formatNutritionLabel(key)}:</strong> {value}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>No ingredients or nutrition data available for this item.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseNutritionModal}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}
      {/* Offer Modal */}
      {showOfferModal && (
        <Modal show={showOfferModal} onHide={handleCloseOfferModal}>
          <Modal.Header closeButton>
            <Modal.Title>Create Offer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Search Items</Form.Label>
                <Form.Control
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for items..."
                />
              </Form.Group>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {searchedItems.length === 0 && searchTerm && (
                  <p>No items found.</p>
                )}
                {searchedItems.map((item) => (
                  <Card
                    key={item._id}
                    style={{
                      marginBottom: "10px",
                      cursor: "pointer",
                      backgroundColor: offerItem?._id === item._id ? "#e9ecef" : "white",
                    }}
                    onClick={() => handleOfferItemSelect(item)}
                  >
                    <Card.Body>
                      <Card.Title>{item.item_name}</Card.Title>
                      <Card.Text>Price: ₹{item.price_list_rate}</Card.Text>
                    </Card.Body>
                  </Card>
                ))}
              </div>
              {offerItem && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Selected Item: {offerItem.item_name}</Form.Label>
                    <Form.Text className="d-block">Current Price: ₹{offerItem.price_list_rate}</Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Offer Price</Form.Label>
                    <Form.Control
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="Enter offer price"
                      min="0"
                      step="0.01"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Offer Start Time</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={offerStartTime}
                      onChange={(e) => setOfferStartTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Offer End Time</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={offerEndTime}
                      onChange={(e) => setOfferEndTime(e.target.value)}
                      min={offerStartTime || new Date().toISOString().slice(0, 16)}
                    />
                  </Form.Group>
                </>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseOfferModal}>Close</Button>
            <Button variant="primary" onClick={handleOfferSubmit} disabled={!offerItem}>
              Create Offer
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default ItemListPage;