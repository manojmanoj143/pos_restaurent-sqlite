// ComboOffer.jsx (full updated file)
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify"; // Assuming you have react-toastify for warnings; install if not: npm i react-toastify
const initialFormState = {
  description: "",
  total_price: 0,
  offer_price: "",
  offer_start_time: "",
  offer_end_time: "",
  items: [], // Array of selected items/addons/combos
  images: [], // Array of image filenames
};
const ComboOffer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState(initialFormState);
  const [allItems, setAllItems] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]); // To hold selected items/addons/combos
  const [totalPrice, setTotalPrice] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [baseUrl, setBaseUrl] = useState(""); // Added baseUrl state like in AdminPage
  // States for images
  const [images, setImages] = useState([]); // Filenames
  const [previewUrls, setPreviewUrls] = useState([]); // URLs for preview (local or served)
  /* -------------------------------------------------- FETCH CONFIG FOR BASE URL -------------------------------------------------- */
  // Added fetchConfig useEffect similar to AdminPage to determine baseUrl for client/server mode
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
        // After config, fetch items using the determined currentBaseUrl
        fetchData(currentBaseUrl);
      }
    };
    fetchConfig();
  }, []);
  /* -------------------------------------------------- FETCH ALL ITEMS -------------------------------------------------- */
  const fetchData = async (currentBaseUrl = "") => {
    setLoading(true);
    try {
      // UPDATED: Use dynamic baseUrl like in AdminPage
      const itemsResponse = await axios.get(`${currentBaseUrl || 'http://localhost:8000'}/api/items`);
      setAllItems(itemsResponse.data);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setWarningMessage(`Error fetching data: ${errorMsg}`);
      toast.error(`Error fetching data: ${errorMsg}`); // Toast for better UX
    } finally {
      setLoading(false);
    }
  };
  /* -------------------------------------------------- EDIT MODE -------------------------------------------------- */
  useEffect(() => {
    if (location.state && location.state.combo) {
      const combo = location.state.combo;
      setIsEdit(true);
      setFormData({
        _id: combo._id,
        description: combo.description,
        total_price: combo.total_price,
        offer_price: combo.offer_price || "",
        offer_start_time: combo.offer_start_time || "",
        offer_end_time: combo.offer_end_time || "",
        items: combo.items,
      });
      setSelectedComponents(combo.items);
      setTotalPrice(combo.total_price);
      // Set images for edit mode
      if (combo.images) {
        setImages(combo.images);
        const previews = combo.images.map(img => `${baseUrl}/api/combo-images/${img}`);
        setPreviewUrls(previews);
      }
    }
  }, [location.state, baseUrl]);
  // Helper to get image URL with baseUrl prefix
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/50";
    const prefix = baseUrl || 'http://localhost:8000';
    // For item images: ${prefix}${imagePath} (assuming relative path)
    // For addon/combo images: same
    return `${prefix}${imagePath}`;
  };
  /* -------------------------------------------------- IMAGE UPLOAD HANDLER -------------------------------------------------- */
  // Handle multiple image uploads
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const apiBase = baseUrl || 'http://localhost:8000';
    for (let file of files) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      try {
        const response = await axios.post(`${apiBase}/api/upload-combo-image`, uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const filename = response.data.filename;
        setImages((prev) => [...prev, filename]);
        // Create local preview URL
        const preview = URL.createObjectURL(file);
        setPreviewUrls((prev) => [...prev, preview]);
        toast.success(`Image ${filename} uploaded successfully`);
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        toast.error(`Failed to upload ${file.name}: ${errorMsg}`);
      }
    }
    // Clear input
    e.target.value = '';
  };
  // Remove image
  const removeImage = (index) => {
    URL.revokeObjectURL(previewUrls[index]); // Clean up local URL if any
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };
  /* -------------------------------------------------- INPUT HANDLERS -------------------------------------------------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleNumericInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) || "" }));
  };
  /* -------------------------------------------------- SELECTION LOGIC -------------------------------------------------- */
  // UPDATED: Enhanced to show images in selected components (already doing, but ensure paths)
  const handleSelection = (type, id, index = null) => {
    const selected = allItems.find((item) => item._id === id);
    if (!selected) return;
    let component;
    if (type === "item") {
      if (selected.price_list_rate === undefined) return;
      component = { type: "item", data: selected, price: selected.price_list_rate };
    } else if (type === "addon") {
      if (!selected.addons[index] || selected.addons[index].addon_price === undefined) return;
      component = {
        type: "addon",
        data: selected.addons[index],
        price: selected.addons[index].addon_price,
      };
    } else if (type === "combo") {
      if (!selected.combos[index] || selected.combos[index].combo_price === undefined) return;
      component = {
        type: "combo",
        data: selected.combos[index],
        price: selected.combos[index].combo_price,
      };
    }
    if (!component || component.price === undefined) return;
    setSelectedComponents((prev) => [...prev, component]);
    setTotalPrice((prev) => prev + component.price);
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, component],
      total_price: prev.total_price + component.price,
    }));
  };
  const removeSelection = (index) => {
    const removed = selectedComponents[index];
    if (!removed || removed.price === undefined) return;
    setSelectedComponents((prev) => prev.filter((_, i) => i !== index));
    setTotalPrice((prev) => prev - (removed?.price || 0));
    setFormData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return {
        ...prev,
        items: newItems,
        total_price: prev.total_price - (removed?.price || 0),
      };
    });
  };
  /* -------------------------------------------------- VALIDATION FOR TIMES -------------------------------------------------- */
  const validateOfferTimes = () => {
    if (formData.offer_start_time && formData.offer_end_time) {
      const startTime = new Date(formData.offer_start_time);
      const endTime = new Date(formData.offer_end_time);
      if (startTime >= endTime) {
        toast.error("Offer start time must be before end time"); // Client-side validation with toast
        return false;
      }
    }
    return true;
  };
  /* -------------------------------------------------- SUBMIT -------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateOfferTimes()) return; // Validate before submit
    setLoading(true);
    try {
      // UPDATED: Use dynamic baseUrl for POST/PUT requests like in AdminPage
      const apiBase = baseUrl || 'http://localhost:8000';
      // Ensure times are UTC ISO
      const submitData = { ...formData };
      if (submitData.offer_start_time) {
        submitData.offer_start_time = new Date(submitData.offer_start_time).toISOString();
      }
      if (submitData.offer_end_time) {
        submitData.offer_end_time = new Date(submitData.offer_end_time).toISOString();
      }
      // Include images
      submitData.images = images;
      if (isEdit) {
        await axios.put(`${apiBase}/api/combo-offer/${submitData._id}`, submitData);
        toast.success("Combo offer updated successfully!"); // Toast
      } else {
        await axios.post(`${apiBase}/api/combo-offer`, submitData);
        toast.success("Combo offer created successfully!"); // Toast
      }
      navigate("/admin", { replace: true });
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setWarningMessage(`Operation failed: ${errorMsg}`);
      toast.error(`Operation failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };
  /* -------------------------------------------------- STYLES -------------------------------------------------- */
  const pageStyle = {
    height: '100vh',
    overflowY: 'auto',
    background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
    padding: '20px',
    position: 'relative'
  };
  const formCardStyle = {
    maxWidth: "800px", // Wider for side-by-side layout
    margin: "80px auto 20px",
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "15px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    display: "grid",
    gridTemplateColumns: "1fr 300px", // Side layout for form and images
    gap: "20px",
  };
  const mainFormStyle = { // Left column
    gridColumn: "1",
  };
  const imagesSectionStyle = { // Right column
    gridColumn: "2",
    borderLeft: "1px solid #ddd",
    paddingLeft: "20px",
  };
  const formGroupStyle = { marginBottom: "20px" };
  const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "bold" };
  const inputStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid #bdc3c7",
    borderRadius: "5px",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
  };
  const textareaStyle = { ...inputStyle, height: "100px" };
  const selectStyle = { ...inputStyle };
  const selectedComponentsStyle = { marginBottom: "20px" };
  const componentItemStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
    backgroundColor: "#fff",
    padding: "10px",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };
  const componentImageStyle = { width: "50px", height: "50px", marginRight: "10px", borderRadius: "5px" };
  const componentTextStyle = { flex: 1 };
  const removeButtonStyle = {
    marginLeft: "10px",
    color: "#ffffff",
    background: "linear-gradient(135deg, #ff5252, #f44336)",
    border: "none",
    borderRadius: "5px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "background 0.3s ease",
  };
  const totalPriceStyle = { marginTop: "10px" };
  const submitButtonStyle = {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #3498db, #2980b9)",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "background 0.3s ease",
    gridColumn: "1 / -1", // Span both columns
  };
  const disabledButtonStyle = {
    ...submitButtonStyle,
    background: "linear-gradient(135deg, #bdc3c7, #95a5a5)",
    cursor: "not-allowed",
  };
  // Image upload styles
  const imageUploadStyle = {
    ...inputStyle,
    padding: "5px",
  };
  const imagesPreviewStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "400px",
    overflowY: "auto",
  };
  const imagePreviewItemStyle = {
    position: "relative",
    border: "1px solid #ddd",
    borderRadius: "5px",
    overflow: "hidden",
  };
  const imagePreviewStyle = {
    width: "100%",
    height: "150px",
    objectFit: "cover",
  };
  const removeImageButtonStyle = {
    position: "absolute",
    top: "5px",
    right: "5px",
    background: "rgba(255, 0, 0, 0.7)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    cursor: "pointer",
    fontSize: "12px",
  };
  const warningStyle = {
    backgroundColor: "#ffebee",
    padding: "10px",
    marginBottom: "20px",
    color: "#c0392b",
    borderRadius: "5px",
  };
  const loadingStyle = { textAlign: "center", color: "#7f8c8d" };
  const titleStyle = { marginLeft: "10px", color: "#2c3e50" };
  /* -------------------------------------------------- RENDER -------------------------------------------------- */
  return (
    <div style={pageStyle}>
      {/* Fixed Back Button in Top-Left Corner - Styled like EmployeeList */}
      <button
        onClick={() => navigate(-1)}
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
        disabled={loading}
      >
        <FaArrowLeft /> Back to Admin
      </button>
      {/* Warning / Success */}
      {warningMessage && <div style={warningStyle}>{warningMessage}</div>}
      {/* Loading */}
      {loading && <div style={loadingStyle}>Loading...</div>}
      {/* Form Card - Grid layout for side-by-side */}
      <div style={formCardStyle}>
        {/* Title inside card */}
        <h2 style={{
          textAlign: 'center',
          color: '#2c3e50',
          margin: '0 0 30px 0',
          fontSize: '1.8rem',
          fontWeight: '600',
          gridColumn: '1 / -1'
        }}>
          {isEdit ? "Edit Combo Offer" : "Create Combo Offer"}
        </h2>
        {/* Main Form - Left Side */}
        <div style={mainFormStyle}>
          <form onSubmit={handleSubmit}>
            {/* Description */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Offer Name</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={textareaStyle}
                required
              />
            </div>
            {/* Select Items / Addons / Combos – Include price in option text */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Select Items/Addons/Combos</label>
              <select
                onChange={(e) => {
                  const [type, id, index] = e.target.value.split("_");
                  handleSelection(type, id, index ? parseInt(index) : null);
                  e.target.value = ""; // reset select
                }}
                style={selectStyle}
              >
                <option value="">Select</option>
                {allItems.flatMap((item) => [
                  // Item option - Added price
                  <option key={item._id} value={`item_${item._id}`}>
                    {item.item_name} - ₹{item.price_list_rate} (Item)
                  </option>,
                  // Addon options - Added price
                  ...item.addons.map((addon, idx) => (
                    <option key={`${item._id}_addon_${idx}`} value={`addon_${item._id}_${idx}`}>
                      {addon.name1} - ₹{addon.addon_price} (Addon from {item.item_name})
                    </option>
                  )),
                  // Combo options - Added price
                  ...item.combos.map((combo, idx) => (
                    <option key={`${item._id}_combo_${idx}`} value={`combo_${item._id}_${idx}`}>
                      {combo.name1} - ₹{combo.combo_price} (Combo from {item.item_name})
                    </option>
                  )),
                ])}
              </select>
            </div>
            {/* Selected Components - UPDATED: Shows images for each selected */}
            <div style={selectedComponentsStyle}>
              <h3>Selected Components</h3>
              {selectedComponents.map((comp, index) => (
                <div key={index} style={componentItemStyle}>
                  <img
                    src={getImageUrl(
                      comp.data.image ||
                      comp.data.addon_image ||
                      comp.data.combo_image ||
                      comp.data.item_image ||
                      ""
                    )}
                    alt={comp.data.item_name || comp.data.name1 || "Component"}
                    style={componentImageStyle}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/50?text=No+Img";
                    }}
                  />
                  <span style={componentTextStyle}>
                    {comp.data.item_name || comp.data.name1} - ₹{comp.price || 0}
                  </span>
                  <button type="button" onClick={() => removeSelection(index)} style={removeButtonStyle}>
                    Remove
                  </button>
                </div>
              ))}
              {/* Editable Total Price */}
              <div style={totalPriceStyle}>
                <label style={labelStyle}>Total Price (Editable)</label>
                <input
                  type="number"
                  name="total_price"
                  value={formData.total_price}
                  onChange={handleNumericInputChange}
                  style={inputStyle}
                  required
                  // Prevent mouse wheel change
                  onWheel={(e) => e.target.blur()}
                />
              </div>
            </div>
            {/* Offer Price – WHEEL DISABLED */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Offer Price (Optional)</label>
              <input
                type="number"
                name="offer_price"
                value={formData.offer_price}
                onChange={handleNumericInputChange}
                style={inputStyle}
                min="0"
                step="0.01"
                // THIS IS THE ONLY NEW LINE
                onWheel={(e) => e.target.blur()}
              />
            </div>
            {/* Offer Start Time */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Offer Start Time (Optional)</label>
              <input
                type="datetime-local"
                name="offer_start_time"
                value={formData.offer_start_time}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>
            {/* Offer End Time */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Offer End Time (Optional)</label>
              <input
                type="datetime-local"
                name="offer_end_time"
                value={formData.offer_end_time}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>
          </form>
        </div>
        {/* Images Upload Section - Right Side */}
        <div style={imagesSectionStyle}>
          <h3>Upload Images</h3>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Select Images (Multiple)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              style={imageUploadStyle}
            />
          </div>
          <div style={imagesPreviewStyle}>
            {previewUrls.map((url, index) => (
              <div key={index} style={imagePreviewItemStyle}>
                <img src={url} alt={`Preview ${index + 1}`} style={imagePreviewStyle} />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  style={removeImageButtonStyle}
                >
                  ×
                </button>
              </div>
            ))}
            {images.length === 0 && <p style={{ color: "#666", fontStyle: "italic" }}>No images uploaded yet.</p>}
          </div>
        </div>
        {/* Submit Button - Spans both columns */}
        <button
          type="submit"
          disabled={loading || selectedComponents.length === 0} // Disable if no components
          style={loading ? disabledButtonStyle : submitButtonStyle}
          onClick={handleSubmit} // Attach to button outside form for grid span
        >
          {loading ? "Saving..." : isEdit ? "Update Combo Offer" : "Save Combo Offer"}
        </button>
      </div>
    </div>
  );
};
export default ComboOffer;