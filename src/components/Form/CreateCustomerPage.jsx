import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';

const SearchableSelect = ({ options = [], value = '', onChange, placeholder }) => {
  const [search, setSearch] = useState(value || '');
  const [showList, setShowList] = useState(false);
  useEffect(() => {
    setSearch(value || '');
  }, [value]);
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );
  const handleInputChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    if (!showList) {
      setShowList(true);
    }
  };
  const handleSelectOption = (option) => {
    setSearch(option);
    if (onChange) {
      onChange(option);
    }
    setShowList(false);
  };
  const handleFocus = () => {
    setShowList(true);
  };
  const handleBlur = () => {
    setTimeout(() => {
      setShowList(false);
    }, 200);
  };
  return (
    <div className="searchable-select">
      <input
        type="text"
        value={search}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
      {showList && (
        <ul className="searchable-list">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectOption(option);
                }}
              >
                {option}
              </li>
            ))
          ) : (
            <li className="no-options">No matching options</li>
          )}
        </ul>
      )}
    </div>
  );
};

const CreateCustomerPage = () => {
  /* ────────────────────── BASIC STATE ────────────────────── */
  const [activeTab, setActiveTab] = useState("details");
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedISDCode, setSelectedISDCode] = useState("+971");
  const [selectedWhatsappISDCode, setSelectedWhatsappISDCode] = useState("+971");
  const [showISDCodeDropdown, setShowISDCodeDropdown] = useState(false);
  const [showWhatsappISDCodeDropdown, setShowWhatsappISDCodeDropdown] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [customerGroups, setCustomerGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    building_name: "",
    flat_villa_no: "",
    country: "",
    field1: "",
    field2: "",
    field3: "",
  });
  /* ────────────────────── ADDRESS STRUCTURE STATE ────────────────────── */
  const [showStructureBuilder, setShowStructureBuilder] = useState(false);
  const defaultStructure = {
    countries: {},
  };
  const [addressStructure, setAddressStructure] = useState(defaultStructure);
  const [selectedCountryForEdit, setSelectedCountryForEdit] = useState("");
  // Temp inputs for adding new
  const [tempCountry, setTempCountry] = useState("");
  const [tempField1Label, setTempField1Label] = useState("");
  const [tempField1Value, setTempField1Value] = useState("");
  const [tempField2Label, setTempField2Label] = useState("");
  const [tempField2Value, setTempField2Value] = useState("");
  const [tempField3Label, setTempField3Label] = useState("");
  const [tempField3Value, setTempField3Value] = useState("");
  // NEW STATE FOR LINKED VALUES (Field1 → Field2/Field3)
  const [linkedValues, setLinkedValues] = useState({}); // { country: { field1Value: { field2: [], field3: [] } } }
  const navigate = useNavigate();
  const location = useLocation();
  const [baseUrl, setBaseUrl] = useState(""); // NEW: Added baseUrl state from AdminPage
  
  // UPDATED: Digit lengths per country for dynamic validation
  const digitLengths = {
    '+91': 10,    // India
    '+1': 10,     // USA/Canada
    '+44': 10,    // UK
    '+971': 9,    // UAE
    '+61': 9,     // Australia
  };
  
  const isdCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+971", country: "UAE" },
    { code: "+61", country: "Australia" },
  ];
  const tabs = ["Details", "Address & Contact"];
  /* ────────────────────── EFFECTS ────────────────────── */
  useEffect(() => {
    // NEW: Fetch config to set baseUrl (copied from AdminPage)
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
        // Fetch data after baseUrl is set
        if (currentBaseUrl) {
          fetchCustomerGroups(currentBaseUrl);
          fetchAddressStructure(currentBaseUrl);
        } else {
          fetchCustomerGroups("");
          fetchAddressStructure("");
        }
      }
    };
    fetchConfig();
    if (location.state?.newGroupId) setSelectedGroup(location.state.newGroupId);
  }, [location.state]);
  const fetchCustomerGroups = async (currentBaseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/customer-groups`);
      setCustomerGroups(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  // NEW: Separate function for fetching address structure with baseUrl
  const fetchAddressStructure = async (currentBaseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/address-structures`);
      setAddressStructure(res.data.structure || defaultStructure);
      setLinkedValues(res.data.linkedValues || {});
    } catch (e) {
      console.warn("Failed to load address structure", e);
    }
  };
  /* ────────────────────── BASIC HANDLERS ────────────────────── */
  const handleISDCodeSelect = (code) => {
    setSelectedISDCode(code);
    setSelectedWhatsappISDCode(code);
    setShowISDCodeDropdown(false);
  };
  const handleWhatsappISDCodeSelect = (code) => {
    setSelectedWhatsappISDCode(code);
    setShowWhatsappISDCodeDropdown(false);
  };
  const handleGroupSelect = (id) => {
    if (id === "create-new") {
      navigate("/create-customer-group", { state: { fromCreateCustomer: true } });
    } else {
      setSelectedGroup(id);
    }
  };
  
  // UPDATED: Dynamic max digits based on selected ISD code
  const getMaxDigits = (isdCode) => digitLengths[isdCode] || 10;
  
  // UPDATED: Phone number change with dynamic limit
  const handlePhoneNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    const maxDigits = getMaxDigits(selectedISDCode);
    if (v.length <= maxDigits) setPhoneNumber(v);
  };
  
  // UPDATED: WhatsApp number change with dynamic limit
  const handleWhatsappNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    const maxDigits = getMaxDigits(selectedWhatsappISDCode);
    if (v.length <= maxDigits) setWhatsappNumber(v);
  };
  
  // NEW: Handler to copy phone to WhatsApp
  const handleCopyToWhatsapp = () => {
    setWhatsappNumber(phoneNumber);
    setSelectedWhatsappISDCode(selectedISDCode);
  };
  const handleDeliveryAddressChange = (field, value) => {
    setDeliveryAddress((p) => ({ ...p, [field]: value }));
  };
  
  // UPDATED: Validation with dynamic exact length per country
  const handleCreateCustomer = async () => {
    if (!customerName.trim()) {
      setWarningMessage("Customer name is required.");
      setWarningType("warning");
      return;
    }
    const phoneMaxDigits = getMaxDigits(selectedISDCode);
    if (phoneNumber.length !== phoneMaxDigits) {
      setWarningMessage(`Phone number must be exactly ${phoneMaxDigits} digits for ${isdCodes.find(c => c.code === selectedISDCode)?.country || 'this country'}.`);
      setWarningType("warning");
      return;
    }
    if (whatsappNumber) {
      const whatsappMaxDigits = getMaxDigits(selectedWhatsappISDCode);
      if (whatsappNumber.length !== whatsappMaxDigits) {
        setWarningMessage(`WhatsApp number must be exactly ${whatsappMaxDigits} digits for ${isdCodes.find(c => c.code === selectedWhatsappISDCode)?.country || 'this country'}.`);
        setWarningType("warning");
        return;
      }
    }
    const payload = {
      customer_name: customerName.trim(),
      phone_number: `${selectedISDCode}${phoneNumber}`,
      whatsapp_number: whatsappNumber ? `${selectedWhatsappISDCode}${whatsappNumber}` : "",
      email: email || "",
      customer_group: selectedGroup || "",
      ...deliveryAddress,
    };
    try {
      const res = await axios.post(`${baseUrl}/api/customers`, payload);
      if (res.status === 200 || res.status === 201) {
        setWarningMessage("Customer created successfully!");
        setWarningType("success");
      } else {
        const err = res.data;
        setWarningMessage(err.error || "Failed to create customer");
        setWarningType("warning");
      }
    } catch (e) {
      setWarningMessage("Error while creating customer");
      setWarningType("warning");
    }
  };
  const handleWarningOk = () => {
    setWarningMessage("");
    setWarningType("warning");
  };
  const handleBackToAdmin = () => navigate("/admin");
  const getTabKey = (tab) =>
    tab.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
  /* ────────────────────── ADDRESS STRUCTURE LOGIC ────────────────────── */
  const startStructureBuilder = () => {
    setShowStructureBuilder(true);
    resetTempInputs();
  };
  const resetTempInputs = () => {
    setTempCountry("");
    setTempField1Label("");
    setTempField1Value("");
    setTempField2Label("");
    setTempField2Value("");
    setTempField3Label("");
    setTempField3Value("");
    setSelectedCountryForEdit("");
  };
  const loadCountryForEdit = (country) => {
    const data = addressStructure.countries[country];
    if (!data) return;
    setSelectedCountryForEdit(country);
    setTempCountry(country);
    setTempField1Label(data.field1?.label || "");
    setTempField1Value("");
    setTempField2Label(data.field2?.label || "");
    setTempField2Value("");
    setTempField3Label(data.field3?.label || "");
    setTempField3Value("");
    document.querySelector(".structure-builder-modal")?.scrollTo(0, 0);
  };
  // UPDATED: Click a saved Field1 value → fill Field1, Field2 & Field3
  const handleField1ValueClick = (value) => {
    setTempField1Value(value); // NEW: Populate Field1 value too
    const country = currentEditCountry;
    const links = linkedValues[country]?.[value] || { field2: [], field3: [] };
    setTempField2Value(links.field2.join(", "));
    setTempField3Value(links.field3.join(", "));
  };
  const saveAddressStructure = async () => {
    const country = tempCountry.trim();
    if (!country) {
      setWarningMessage("Country name is required.");
      setWarningType("warning");
      return;
    }
    const updated = { ...addressStructure };
    if (!updated.countries) updated.countries = {};
    if (!updated.countries[country]) {
      updated.countries[country] = { field1: null, field2: null, field3: null };
    }
    const countryData = updated.countries[country];
    // ---- Field 1 (MULTIPLE VALUES, COMMA-SEPARATED) ----
    if (tempField1Label.trim()) {
      const label = tempField1Label.trim();
      const f1Arr = tempField1Value.trim().split(",").map((s) => s.trim()).filter(Boolean);
      let existingValues = countryData.field1?.values || [];
      const newValues = [...new Set([...existingValues, ...f1Arr])];
      countryData.field1 = { label, values: newValues };
    }
    // ---- Field 2 ----
    if (tempField2Label.trim()) {
      const label = tempField2Label.trim();
      const f2Arr = tempField2Value.trim().split(",").map((s) => s.trim()).filter(Boolean);
      let existingF2 = countryData.field2?.values || [];
      const newF2 = [...new Set([...existingF2, ...f2Arr])];
      countryData.field2 = { label, values: newF2 };
    }
    // ---- Field 3 ----
    if (tempField3Label.trim()) {
      const label = tempField3Label.trim();
      const f3Arr = tempField3Value.trim().split(",").map((s) => s.trim()).filter(Boolean);
      let existingF3 = countryData.field3?.values || [];
      const newF3 = [...new Set([...existingF3, ...f3Arr])];
      countryData.field3 = { label, values: newF3 };
    }
    // ---- LINKED VALUES (Field1 → Field2/Field3) ----
    let newLinks = { ...linkedValues };
    if (tempField1Value.trim() && (tempField2Value.trim() || tempField3Value.trim())) {
      const f1 = tempField1Value.trim(); // Single value for key
      const f2Arr = tempField2Value.trim().split(",").map((s) => s.trim()).filter(Boolean);
      const f3Arr = tempField3Value.trim().split(",").map((s) => s.trim()).filter(Boolean);
      if (!newLinks[country]) newLinks[country] = {};
      newLinks[country][f1] = { field2: f2Arr, field3: f3Arr };
    }
    // Save to backend
    const payload = {
      structure: updated,
      linkedValues: newLinks
    };
    try {
      const res = await axios.put(`${baseUrl}/api/address-structures`, payload);
      if (res.status === 200) {
        setAddressStructure(updated);
        setLinkedValues(newLinks);
        setShowStructureBuilder(false);
        setWarningMessage(`Address structure for "${country}" saved successfully!`);
        setWarningType("success");
        resetTempInputs();
      } else {
        throw new Error('Save failed');
      }
    } catch (e) {
      console.error(e);
      setWarningMessage("Failed to save address structure");
      setWarningType("warning");
    }
  };
  const cancelStructure = () => {
    setShowStructureBuilder(false);
    resetTempInputs();
  };
  const countryList = Object.keys(addressStructure.countries || {});
  const currentEditCountry = selectedCountryForEdit || tempCountry;
  // Helper to get filtered values for the selected Field1
  const getFilteredValues = (field) => {
    if (!deliveryAddress.country || !deliveryAddress.field1) return [];
    const links = linkedValues[deliveryAddress.country]?.[deliveryAddress.field1];
    return links?.[field] || [];
  };
  /* ────────────────────── RENDER ────────────────────── */
  return (
    <div className="create-customer-container">
      {/* ── ALERT ── */}
      {warningMessage && (
        <div
          className={`alert alert-${warningType} text-center alert-dismissible fade show`}
          role="alert"
        >
          {warningMessage}
          <button type="button" className="btn-close" onClick={handleWarningOk} />
        </div>
      )}
      {/* ── HEADER ── */}
      <div className="header-section">
        <button className="back-btn" onClick={handleBackToAdmin}>
          Back to Admin
        </button>
        <h1>Create a New Customer</h1>
        <div className="header-buttons">
          <button className="address-structure-btn" onClick={startStructureBuilder}>
            Address Structure
          </button>
          <button className="save-btn" onClick={handleCreateCustomer}>
            Save
          </button>
        </div>
      </div>
      {/* ── TABS ── */}
      <div className="tabs-section">
        <div className="tabs-container">
          {tabs.map((tab, i) => {
            const key = getTabKey(tab);
            return (
              <button
                key={i}
                className={`tab-btn ${activeTab === key ? "active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>
      {/* ── FORM CONTENT ── */}
      <div className="form-section">
        {/* DETAILS TAB */}
        {activeTab === "details" && (
          <div className="form-grid">
            {/* LEFT */}
            <div className="form-column left">
              <div className="form-group">
                <label>
                  Customer Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>WhatsApp Number</label>
                <div className="phone-input-group">
                  <div className="isd-wrapper">
                    <button
                      className="isd-btn"
                      type="button"
                      onClick={() => setShowWhatsappISDCodeDropdown(!showWhatsappISDCodeDropdown)}
                    >
                      {selectedWhatsappISDCode}
                    </button>
                    {showWhatsappISDCodeDropdown && (
                      <ul className="isd-dropdown">
                        {isdCodes.map((c, i) => (
                          <li key={i}>
                            <button
                              className="dropdown-item"
                              type="button"
                              onClick={() => handleWhatsappISDCodeSelect(c.code)}
                            >
                              {c.code} ({c.country})
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* UPDATED: Dynamic placeholder based on digits */}
                  <input
                    type="text"
                    placeholder={`${getMaxDigits(selectedWhatsappISDCode)}-digit WhatsApp Number`}
                    value={whatsappNumber}
                    onChange={handleWhatsappNumberChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Customer Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => handleGroupSelect(e.target.value)}
                >
                  <option value="">Select Group</option>
                  {customerGroups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.group_name}
                    </option>
                  ))}
                  <option value="create-new">Create New Group</option>
                </select>
              </div>
            </div>
            {/* RIGHT */}
            <div className="form-column right">
              <div className="form-group">
                <label>
                  Phone Number <span className="required">*</span>
                </label>
                <div className="phone-input-group">
                  <div className="isd-wrapper">
                    <button
                      className="isd-btn"
                      type="button"
                      onClick={() => setShowISDCodeDropdown(!showISDCodeDropdown)}
                    >
                      {selectedISDCode}
                    </button>
                    {showISDCodeDropdown && (
                      <ul className="isd-dropdown">
                        {isdCodes.map((c, i) => (
                          <li key={i}>
                            <button
                              className="dropdown-item"
                              type="button"
                              onClick={() => handleISDCodeSelect(c.code)}
                            >
                              {c.code} ({c.country})
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* UPDATED: Dynamic placeholder based on digits */}
                  <input
                    type="text"
                    placeholder={`${getMaxDigits(selectedISDCode)}-digit Phone Number`}
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                  />
                </div>
                {/* NEW: Copy to WhatsApp Suggestion */}
                {phoneNumber && !whatsappNumber && (
                  <div className="copy-suggestion">
                    <span>Use the same number for WhatsApp?</span>
                    <button type="button" className="copy-btn" onClick={handleCopyToWhatsapp}>
                      Copy
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group empty-align" />
            </div>
          </div>
        )}
        {/* ADDRESS & CONTACT TAB */}
        {activeTab === "address-and-contact" && (
          <div className="form-grid">
            {/* LEFT */}
            <div className="form-column left">
              <div className="form-group">
                <label>Country</label>
                <SearchableSelect
                  options={countryList}
                  value={deliveryAddress.country}
                  onChange={(value) => {
                    handleDeliveryAddressChange("country", value);
                    handleDeliveryAddressChange("field1", "");
                    handleDeliveryAddressChange("field2", "");
                    handleDeliveryAddressChange("field3", "");
                  }}
                  placeholder="Select Country"
                />
              </div>
              {/* FIELD 1 */}
              {deliveryAddress.country && addressStructure.countries[deliveryAddress.country]?.field1 && (
                <div className="form-group">
                  <label>{addressStructure.countries[deliveryAddress.country].field1.label}</label>
                  <SearchableSelect
                    options={addressStructure.countries[deliveryAddress.country].field1.values || []}
                    value={deliveryAddress.field1}
                    onChange={(value) => {
                      handleDeliveryAddressChange("field1", value);
                      // UPDATED: Clear Field2 and Field3 when Field1 changes (including to empty)
                      handleDeliveryAddressChange("field2", "");
                      handleDeliveryAddressChange("field3", "");
                    }}
                    placeholder={`Select ${addressStructure.countries[deliveryAddress.country].field1.label}`}
                  />
                </div>
              )}
              {/* FIELD 3 (shown always if defined) */}
              {deliveryAddress.country && addressStructure.countries[deliveryAddress.country]?.field3 && (
                <div className="form-group">
                  <label>{addressStructure.countries[deliveryAddress.country].field3.label}</label>
                  <SearchableSelect
                    options={getFilteredValues("field3").length > 0
                      ? getFilteredValues("field3")
                      : (addressStructure.countries[deliveryAddress.country].field3.values || [])}
                    value={deliveryAddress.field3}
                    onChange={(value) => handleDeliveryAddressChange("field3", value)}
                    placeholder={`Select ${addressStructure.countries[deliveryAddress.country].field3.label}`}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Flat / Villa No</label>
                <input
                  type="text"
                  value={deliveryAddress.flat_villa_no}
                  onChange={(e) => handleDeliveryAddressChange("flat_villa_no", e.target.value)}
                />
              </div>
            </div>
            {/* RIGHT */}
            <div className="form-column right">
              {/* FIELD 2 (filtered by selected Field1) */}
              {deliveryAddress.country && addressStructure.countries[deliveryAddress.country]?.field2 && (
                <div className="form-group">
                  <label>{addressStructure.countries[deliveryAddress.country].field2.label}</label>
                  <SearchableSelect
                    options={getFilteredValues("field2").length > 0
                      ? getFilteredValues("field2")
                      : (addressStructure.countries[deliveryAddress.country].field2.values || [])}
                    value={deliveryAddress.field2}
                    onChange={(value) => handleDeliveryAddressChange("field2", value)}
                    placeholder={`Select ${addressStructure.countries[deliveryAddress.country].field2.label}`}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Building Name</label>
                <input
                  type="text"
                  value={deliveryAddress.building_name}
                  onChange={(e) => handleDeliveryAddressChange("building_name", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ── ADDRESS STRUCTURE BUILDER MODAL ── */}
      {showStructureBuilder && (
        <div className="structure-builder-overlay">
          <div className="structure-builder-modal">
            <h2>Define Address Structure</h2>
            <p className="subtitle">
              Add country and up to 3 custom fields (e.g., Emirate, City, Area/Village).
            </p>
            {/* SAVED COUNTRIES */}
            {countryList.length > 0 && (
              <div className="saved-countries-section">
                <p className="saved-label">Saved Countries (Click to edit):</p>
                <div className="saved-tags">
                  {countryList.map((country) => (
                    <button
                      key={country}
                      className="saved-country-tag"
                      onClick={() => loadCountryForEdit(country)}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <hr />
            {/* COUNTRY */}
            <div className="field-group">
              <label>Country Name</label>
              <input
                type="text"
                placeholder="e.g., UAE, India"
                value={tempCountry}
                onChange={(e) => setTempCountry(e.target.value)}
                disabled={!!selectedCountryForEdit}
                className={selectedCountryForEdit ? "disabled-input" : ""}
              />
            </div>
            {/* FIELD 1 */}
            <div className="field-group">
              <label>Field 1 Label (e.g., Emirate, State)</label>
              <input
                type="text"
                placeholder="Enter label"
                value={tempField1Label}
                onChange={(e) => setTempField1Label(e.target.value)}
              />
              <label className="value-label">Field 1 Value (comma-separated for multiples)</label>
              <div className="input-with-list">
                <input
                  type="text"
                  placeholder="e.g., Tamil Nadu, Andhra Pradesh, Arunachal Pradesh"
                  value={tempField1Value}
                  onChange={(e) => setTempField1Value(e.target.value)}
                />
                {/* UPDATED: Show saved values as clickable spans */}
                {addressStructure.countries[currentEditCountry]?.field1?.values?.length > 0 && (
                  <div className="saved-list">
                    Saved: {addressStructure.countries[currentEditCountry].field1.values.map((v, i) => (
                      <span
                        key={i}
                        className="clickable-value"
                        onClick={() => handleField1ValueClick(v)}
                        style={{ marginLeft: "4px", cursor: "pointer", color: "#007bff" }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* FIELD 2 */}
            <div className="field-group">
              <label>Field 2 Label (e.g., City, District)</label>
              <input
                type="text"
                placeholder="Enter label"
                value={tempField2Label}
                onChange={(e) => setTempField2Label(e.target.value)}
              />
              <label className="value-label">Field 2 Value (comma-separated for multiples)</label>
              <div className="input-with-list">
                <input
                  type="text"
                  placeholder="e.g., Sharjah, Chennai"
                  value={tempField2Value}
                  onChange={(e) => setTempField2Value(e.target.value)}
                />
              </div>
            </div>
            {/* FIELD 3 */}
            <div className="field-group">
              <label>Field 3 Label (e.g., Area, Village)</label>
              <input
                type="text"
                placeholder="Enter label"
                value={tempField3Label}
                onChange={(e) => setTempField3Label(e.target.value)}
              />
              <label className="value-label">Field 3 Value (comma-separated for multiples)</label>
              <div className="input-with-list">
                <input
                  type="text"
                  placeholder="e.g., Al Barsha, Koyambedu"
                  value={tempField3Value}
                  onChange={(e) => setTempField3Value(e.target.value)}
                />
              </div>
            </div>
            {/* ACTIONS */}
            <div className="modal-actions">
              <button className="save-structure-btn" onClick={saveAddressStructure}>
                Save Structure
              </button>
              <button className="cancel-btn" onClick={cancelStructure}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── STYLES (unchanged) ── */}
      <style jsx>{`
        /* Base Layout */
        .create-customer-container {
          background: #f8f9fa;
          min-height: 100vh;
          padding: 20px;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        /* Header */
        .header-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .header-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .back-btn,
        .save-btn,
        .address-structure-btn,
        .save-structure-btn,
        .cancel-btn {
          padding: 10px 20px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .back-btn { background: #6c757d; color: #fff; }
        .back-btn:hover { background: #5a6268; }
        .save-btn { background: #007bff; color: #fff; }
        .save-btn:hover { background: #0056b3; }
        .address-structure-btn { background: #28a745; color: #fff; }
        .address-structure-btn:hover { background: #218838; }
        .save-structure-btn { background: #17a2b8; color: #fff; font-weight: bold; }
        .save-structure-btn:hover { background: #138496; }
        .cancel-btn { background: #dc3545; color: #fff; }
        .cancel-btn:hover { background: #c82333; }
        h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        /* Tabs */
        .tabs-section { margin-bottom: 20px; overflow-x: auto; }
        .tabs-container {
          display: flex;
          gap: 0;
          background: #fff;
          border-radius: 8px 8px 0 0;
          min-width: 400px;
        }
        .tab-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: #e9ecef;
          color: #495057;
          cursor: pointer;
          white-space: nowrap;
          font-size: 14px;
        }
        .tab-btn:hover { background: #dee2e6; }
        .tab-btn.active {
          background: #fff;
          color: #007bff;
          border-bottom: 3px solid #007bff;
          font-weight: bold;
        }
        /* Form */
        .form-section {
          background: #fff;
          padding: 24px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,.1);
          max-width: 1000px;
          margin: 0 auto;
        }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .form-column { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .empty-align { height: 0; margin: 0; visibility: hidden; }
        .form-group label {
          font-size: 13px;
          font-weight: bold;
          color: #333;
        }
        .required { color: #e74c3c; }
        .form-group input,
        .form-group select {
          height: 42px;
          padding: 0 12px;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #0056b3;
          box-shadow: 0 0 0 3px rgba(0,123,255,.2);
        }
        /* NEW: Copy Suggestion Styles */
        .copy-suggestion {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #e7f3ff;
          border: 1px solid #b3d9ff;
          border-radius: 4px;
          font-size: 13px;
          color: #0066cc;
          margin-top: 4px;
        }
        .copy-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .copy-btn:hover {
          background: #0056b3;
        }
        /* Searchable Select */
        .searchable-select {
          position: relative;
          width: 100%;
        }
        .searchable-select input {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .searchable-select input:focus {
          outline: none;
          border-color: #0056b3;
          box-shadow: 0 0 0 3px rgba(0,123,255,.2);
        }
        .searchable-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1.5px solid #007bff;
          border-top: none;
          border-radius: 0 0 6px 6px;
          max-height: 200px;
          overflow-y: auto;
          list-style: none;
          margin: 0;
          padding: 0;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
        }
        .searchable-list li {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          border-bottom: 1px solid #f0f0f0;
        }
        .searchable-list li:hover {
          background: #f8f9fa;
        }
        .searchable-list .no-options {
          color: #6c757d;
          font-style: italic;
          cursor: default;
          padding: 12px;
          text-align: center;
        }
        /* Phone Input */
        .phone-input-group {
          display: flex;
          height: 42px;
          border: 1.5px solid #007bff;
          border-radius: 6px;
        }
        .isd-wrapper { position: relative; }
        .isd-btn {
          background: #fff;
          border: none;
          border-right: 1.5px solid #007bff;
          padding: 0 10px;
          font-size: 13px;
          height: 100%;
          width: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .isd-btn:hover { background: #f1f3f5; }
        .isd-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 1050;
          background: #fff;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          list-style: none;
          margin: 2px 0 0;
          padding: 6px 0;
          min-width: 140px;
          max-height: 220px;
          overflow-y: auto;
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
        }
        .dropdown-item {
          width: 100%;
          padding: 8px 14px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: 13px;
        }
        .dropdown-item:hover { background: #f8f9fa; }
        .phone-input-group input {
          flex: 1;
          padding: 0 12px;
          font-size: 13px;
        }
        .phone-input-group input:focus { outline: none; }
        /* Alert */
        .alert {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1050;
          padding: 14px 18px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,.1);
        }
        .alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .alert-warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        /* Structure Builder Modal */
        .structure-builder-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }
        .structure-builder-modal {
          background: #fff;
          padding: 32px;
          border-radius: 14px;
          width: 100%;
          max-width: 750px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.25);
          max-height: 92vh;
          overflow-y: auto;
        }
        .structure-builder-modal h2 {
          margin: 0 0 8px;
          font-size: 22px;
          color: #222;
          font-weight: 600;
        }
        .subtitle {
          font-size: 13.5px;
          color: #666;
          margin-bottom: 22px;
          line-height: 1.5;
        }
        /* Saved Countries */
        .saved-countries-section { margin-bottom: 18px; }
        .saved-label {
          font-weight: bold;
          font-size: 13px;
          color: #333;
          margin-bottom: 10px;
        }
        .saved-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .saved-country-tag {
          background: #d1ecf1;
          color: #0c5460;
          border: none;
          padding: 7px 14px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: 0.2s;
        }
        .saved-country-tag:hover {
          background: #bee5eb;
        }
        hr {
          margin: 24px 0;
          border: none;
          border-top: 1.5px solid #eee;
        }
        /* Field Group */
        .field-group {
          margin-bottom: 26px;
        }
        .field-group label {
          display: block;
          margin-bottom: 7px;
          font-weight: bold;
          font-size: 13.5px;
          color: #333;
        }
        .value-label {
          margin-top: 12px;
          margin-bottom: 7px;
        }
        .field-group input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          font-size: 13.5px;
        }
        .disabled-input {
          background: #f8f9fa !important;
          color: #6c757d;
          cursor: not-allowed;
        }
        .input-with-list {
          position: relative;
        }
        .saved-list {
          font-size: 12.5px;
          color: #28a745;
          font-style: italic;
          margin-top: 8px;
          padding-left: 4px;
          line-height: 1.4;
        }
        .clickable-value:hover { text-decoration: underline; }
        /* Modal Actions */
        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 18px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1.5px solid #eee;
        }
        /* Responsive */
        @media (max-width: 768px) {
          .header-section { flex-direction: column; text-align: center; }
          .header-buttons { justify-content: center; }
          .form-grid { grid-template-columns: 1fr; }
          .structure-builder-modal { padding: 24px; max-width: 95%; }
          .tabs-container { min-width: auto; }
          .copy-suggestion { flex-direction: column; align-items: flex-start; gap: 6px; }
        }
      `}</style>
    </div>
  );
};

export default CreateCustomerPage;