import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa'; // NEW: Import FaArrowLeft for back button
const SearchableSelect = ({ options = [], value = '', onChange, placeholder, allowCreateNew = false, onAddNewValue = null }) => {
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
  const handleCreateNewOption = async () => {
    if (!search.trim()) {
      setShowList(false);
      return;
    }
    if (onAddNewValue) {
      const success = await onAddNewValue(search);
      if (success) {
        setSearch(search);
        if (onChange) {
          onChange(search);
        }
        setShowList(false);
      }
    }
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
          {allowCreateNew && (
            <li
              key="create-new"
              onMouseDown={(e) => {
                e.preventDefault();
                handleCreateNewOption();
              }}
              style={{ fontStyle: 'italic', color: '#007bff' }}
            >
              Create New: "{search.trim() || 'value'}"
            </li>
          )}
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
            !allowCreateNew && <li className="no-options">No matching options</li>
          )}
          {allowCreateNew && filteredOptions.length === 0 && search.trim() && (
            <li className="no-options">Type above and select Create New</li>
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
    '+91': 10, // India
    '+1': 10, // USA/Canada
    '+44': 10, // UK
    '+971': 9, // UAE
    '+61': 9, // Australia
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
        const url = currentBaseUrl || "";
        fetchCustomerGroups(url);
        fetchAddressStructure(url);
      }
    };
    fetchConfig();
  }, []);
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
  /* ────────────────────── DYNAMIC ADD HANDLERS ────────────────────── */
  const handleAddNewField1 = useCallback(async (newValue) => {
    if (!deliveryAddress.country) {
      setWarningMessage("Please select a country first.");
      setWarningType("warning");
      return false;
    }
    try {
      await axios.post(`${baseUrl}/api/add-address-value`, {
        country: deliveryAddress.country,
        field: 'field1',
        value: newValue
      });
      await fetchAddressStructure(baseUrl);
      setWarningMessage(`New ${addressStructure.countries[deliveryAddress.country]?.field1?.label || 'State'} added: ${newValue}`);
      setWarningType("success");
      return true;
    } catch (e) {
      console.error(e);
      setWarningMessage(`Failed to add new ${addressStructure.countries[deliveryAddress.country]?.field1?.label || 'value'}`);
      setWarningType("warning");
      return false;
    }
  }, [deliveryAddress.country, baseUrl, fetchAddressStructure, addressStructure]);
  const handleAddNewField2 = useCallback(async (newValue) => {
    if (!deliveryAddress.country) {
      setWarningMessage("Please select a country first.");
      return false;
    }
    if (!deliveryAddress.field1) {
      setWarningMessage("Please select State first.");
      return false;
    }
    try {
      await axios.post(`${baseUrl}/api/add-address-value`, {
        country: deliveryAddress.country,
        field: 'field2',
        value: newValue,
        parent_value: deliveryAddress.field1
      });
      await fetchAddressStructure(baseUrl);
      setWarningMessage(`New ${addressStructure.countries[deliveryAddress.country]?.field2?.label || 'Area'} added: ${newValue}`);
      setWarningType("success");
      return true;
    } catch (e) {
      console.error(e);
      setWarningMessage(`Failed to add new ${addressStructure.countries[deliveryAddress.country]?.field2?.label || 'value'}`);
      setWarningType("warning");
      return false;
    }
  }, [deliveryAddress.country, deliveryAddress.field1, baseUrl, fetchAddressStructure, addressStructure]);
  const handleAddNewField3 = useCallback(async (newValue) => {
    if (!deliveryAddress.country) {
      setWarningMessage("Please select a country first.");
      return false;
    }
    if (!deliveryAddress.field1) {
      setWarningMessage("Please select State first.");
      return false;
    }
    try {
      await axios.post(`${baseUrl}/api/add-address-value`, {
        country: deliveryAddress.country,
        field: 'field3',
        value: newValue,
        parent_value: deliveryAddress.field1
      });
      await fetchAddressStructure(baseUrl);
      setWarningMessage(`New ${addressStructure.countries[deliveryAddress.country]?.field3?.label || 'District'} added: ${newValue}`);
      setWarningType("success");
      return true;
    } catch (e) {
      console.error(e);
      setWarningMessage(`Failed to add new ${addressStructure.countries[deliveryAddress.country]?.field3?.label || 'value'}`);
      setWarningType("warning");
      return false;
    }
  }, [deliveryAddress.country, deliveryAddress.field1, baseUrl, fetchAddressStructure, addressStructure]);
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
  // UPDATED: Inline create group
  const handleGroupNameChange = (name) => {
    const group = customerGroups.find(g => g.group_name === name);
    if (group) {
      setSelectedGroup(group._id);
    } else {
      setSelectedGroup('');
    }
  };
  const handleCreateNewGroup = async (newName) => {
    try {
      const res = await axios.post(`${baseUrl}/api/customer-groups`, { group_name: newName });
      if (res.status === 201) {
        const newId = res.data._id;
        setSelectedGroup(newId);
        setCustomerGroups(prev => [...prev, { _id: newId, group_name: newName }]);
        setWarningMessage(`Group "${newName}" created!`);
        setWarningType("success");
        return true;
      }
    } catch (e) {
      console.error(e);
      setWarningMessage("Failed to create group");
      setWarningType("warning");
      return false;
    }
    return false;
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
  // UPDATED: Enhanced error handling for duplicate phone number
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
      if (res.status === 201) {
        setWarningMessage("Customer created successfully!");
        setWarningType("success");
      } else {
        const err = res.data;
        setWarningMessage(err.error || "Failed to create customer");
        setWarningType("warning");
      }
    } catch (e) {
      if (e.response && e.response.status === 409) {
        const err = e.response.data;
        setWarningMessage(`Phone number already saved for customer: ${err.customer_name || 'existing customer'}`);
        setWarningType("warning");
      } else {
        setWarningMessage("Error while creating customer");
        setWarningType("warning");
      }
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
    setTempField1Value((data.field1?.values || []).join(", "));
    setTempField2Label(data.field2?.label || "");
    setTempField2Value((data.field2?.values || []).join(", "));
    setTempField3Label(data.field3?.label || "");
    setTempField3Value((data.field3?.values || []).join(", "));
    document.querySelector(".structure-builder-modal")?.scrollTo(0, 0);
  };
  // NEW: Delete entire country (REMOVED window.confirm, directly delete and show app warning message)
  const handleDeleteCountry = async (country) => {
    const updated = { ...addressStructure };
    delete updated.countries[country];
    const newLinks = { ...linkedValues };
    delete newLinks[country];
    const payload = {
      structure: updated,
      linkedValues: newLinks
    };
    try {
      const res = await axios.put(`${baseUrl}/api/address-structures`, payload);
      if (res.status === 200) {
        setAddressStructure(updated);
        setLinkedValues(newLinks);
        setWarningMessage(`"${country}" structure deleted successfully!`);
        setWarningType("success");
        resetTempInputs();
      } else {
        throw new Error('Delete failed');
      }
    } catch (e) {
      console.error(e);
      setWarningMessage(`Failed to delete "${country}" structure`);
      setWarningType("warning");
    }
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
    const f1Arr = tempField1Value.trim().split(",").map((s) => s.trim()).filter(Boolean);
    const f2Arr = tempField2Value.trim().split(",").map((s) => s.trim()).filter(Boolean);
    const f3Arr = tempField3Value.trim().split(",").map((s) => s.trim()).filter(Boolean);
    // ---- Handle Field 1 ----
    if (tempField1Label.trim()) {
      const label = tempField1Label.trim();
      const newF1Values = [...new Set(f1Arr)]; // Replace with input values (unique)
      countryData.field1 = { label, values: newF1Values.length > 0 ? newF1Values : [] };
    } else if (selectedCountryForEdit) {
      countryData.field1 = null;
    }
    // ---- Handle Field 2 ----
    if (tempField2Label.trim()) {
      const label = tempField2Label.trim();
      const newF2Values = [...new Set(f2Arr)]; // Replace
      countryData.field2 = { label, values: newF2Values.length > 0 ? newF2Values : [] };
    } else if (selectedCountryForEdit) {
      countryData.field2 = null;
    }
    // ---- Handle Field 3 ----
    if (tempField3Label.trim()) {
      const label = tempField3Label.trim();
      const newF3Values = [...new Set(f3Arr)]; // Replace
      countryData.field3 = { label, values: newF3Values.length > 0 ? newF3Values : [] };
    } else if (selectedCountryForEdit) {
      countryData.field3 = null;
    }
    // ---- LINKED VALUES (Field1 → Field2/Field3) ----
    let newLinks = { ...linkedValues };
    if (selectedCountryForEdit) {
      // Remove linked for deleted field1 values
      const oldF1s = addressStructure.countries[country]?.field1?.values || [];
      for (let oldF1 of oldF1s) {
        if (!f1Arr.includes(oldF1)) {
          delete newLinks[country]?.[oldF1];
        }
      }
    }
    // Set linked only if single f1 selected
    if (f1Arr.length === 1) {
      const f1 = f1Arr[0];
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
      {/* ── FIXED BACK BUTTON (NEW: Styled like EmployeeList) ── */}
      <button
        onClick={handleBackToAdmin}
        className="fixed-back-btn"
      >
        <FaArrowLeft /> Back to Admin
      </button>
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
      {/* ── MAIN CONTENT CARD (NEW: Wrapped with margin for fixed button) ── */}
      <div className="main-content-card">
        {/* ── HEADER ── */}
        <div className="header-section">
          <div></div> {/* Empty left for balance */}
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
                  <SearchableSelect
                    options={customerGroups.map(g => g.group_name)}
                    value={selectedGroup ? customerGroups.find(g => g._id === selectedGroup)?.group_name || '' : ''}
                    onChange={handleGroupNameChange}
                    placeholder="Select or Create Group"
                    allowCreateNew={true}
                    onAddNewValue={handleCreateNewGroup}
                  />
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
              {/* LEFT: Country, State (field1), Area (field2), Flat */}
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
                {/* FIELD 1 (State) */}
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
                      allowCreateNew={true}
                      onAddNewValue={handleAddNewField1}
                    />
                  </div>
                )}
                {/* FIELD 2 (Area) */}
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
                      allowCreateNew={true}
                      onAddNewValue={handleAddNewField2}
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
              {/* RIGHT: District (field3), Building Name */}
              <div className="form-column right">
                {/* FIELD 3 (District) */}
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
                      allowCreateNew={true}
                      onAddNewValue={handleAddNewField3}
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
                <div className="form-group empty-align" />
                <div className="form-group empty-align" />
              </div>
            </div>
          )}
        </div>
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
                    <div key={country} className="country-tag-wrapper">
                      <button
                        className="saved-country-tag"
                        onClick={() => loadCountryForEdit(country)}
                      >
                        {country}
                      </button>
                      <button
                        className="delete-country-btn"
                        onClick={() => handleDeleteCountry(country)}
                        title={`Delete ${country}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <hr />
            {/* COUNTRY - ALWAYS SHOWN */}
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
            {/* FIELD 1 - SHOWN IF COUNTRY IS FILLED */}
            {tempCountry.trim() && (
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
            )}
            {/* FIELD 2 - SHOWN IF COUNTRY FILLED AND FIELD1 LABEL FILLED */}
            {tempCountry.trim() && tempField1Label.trim() && (
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
            )}
            {/* FIELD 3 - SHOWN IF COUNTRY FILLED, FIELD1 AND FIELD2 LABELS FILLED */}
            {tempCountry.trim() && tempField1Label.trim() && tempField2Label.trim() && (
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
            )}
            {/* ACTIONS - ALWAYS SHOWN, BUT ENABLE SAVE ONLY IF AT LEAST COUNTRY FILLED */}
            <div className="modal-actions">
              <button
                className="save-structure-btn"
                onClick={saveAddressStructure}
                disabled={!tempCountry.trim()}
              >
                Save Structure
              </button>
              <button className="cancel-btn" onClick={cancelStructure}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── STYLES (UPDATED: Added gradient background, fixed back button, main card margin) ── */}
      <style jsx>{`
        /* Base Layout - UPDATED: Gradient background like EmployeeList */
        .create-customer-container {
          background: linear-gradient(135deg, #ffffff 0%, #3498db 100%);
          min-height: 100vh;
          padding: 20px;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        /* NEW: Fixed Back Button - Styled exactly like EmployeeList */
        .fixed-back-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          background-color: transparent;
          border: 2px solid #3498db;
          color: #3498db;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(52, 152, 219, 0.2);
          z-index: 1001;
          transition: all 0.3s ease;
        }
        .fixed-back-btn:hover {
          background-color: #3498db;
          color: #ffffff;
          transform: scale(1.05);
        }
        /* NEW: Main Content Card - With margin for fixed button, like EmployeeList */
        .main-content-card {
          max-width: 1000px;
          margin: 80px auto 20px;
          background-color: #ffffff;
          border-radius: 15px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        /* Header - UPDATED: Adjusted for card */
        .header-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 30px 30px 20px;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 2px solid #3498db;
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
        .save-btn { background: #007bff; color: #fff; }
        .save-btn:hover { background: #0056b3; }
        .address-structure-btn { background: #28a745; color: #fff; }
        .address-structure-btn:hover { background: #218838; }
        .save-structure-btn { background: #17a2b8; color: #fff; font-weight: bold; }
        .save-structure-btn:hover { background: #138496; }
        .save-structure-btn:disabled { background: #6c757d; cursor: not-allowed; }
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
          height:500px;
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
        /* Alert - UPDATED: Made more prominent (centered, wider) */
        .alert {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1050;
          padding: 16px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 6px 20px rgba(0,0,0,.15);
          min-width: 350px;
          max-width: 80vw;
          text-align: center;
        }
        .alert-success { background: #d4edda; border: 2px solid #c3e6cb; color: #155724; }
        .alert-warning { background: #fff3cd; border: 2px solid #ffeaa7; color: #856404; }
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
        .country-tag-wrapper {
          display: flex;
          align-items: center;
          gap: 5px;
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
        .delete-country-btn {
          background: #dc3545;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .delete-country-btn:hover {
          background: #c82333;
        }
        hr {
          margin: 24px 0;
          border: none;
          border-top: 1.5px solid #eee;
        }
        /* Field Group */
        .field-group {
          margin-bottom: 26px;
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
          .country-tag-wrapper { flex-direction: column; gap: 2px; align-items: flex-start; }
          .alert { min-width: 280px; max-width: 95vw; left: 5px; right: 5px; transform: none; }
          .fixed-back-btn { left: 10px; top: 10px; padding: 6px 16px; font-size: 14px; }
          .main-content-card { margin: 60px auto 20px; padding: 20px; }
        }
      `}</style>
    </div>
  );
};
export default CreateCustomerPage;