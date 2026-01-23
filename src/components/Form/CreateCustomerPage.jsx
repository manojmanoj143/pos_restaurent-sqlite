import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import { FaArrowLeft, FaTimes, FaBackspace } from 'react-icons/fa';
/* ────────────────────── KEYPAD COMPONENT ────────────────────── */
const NumericKeypad = ({ onKeyPress, onDelete, onClose, onClear }) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <div className="numeric-keypad-overlay">
      <div className="numeric-keypad">
        <div className="keypad-header">
          <span>Enter Number</span>
          <button className="close-keypad-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="keypad-grid">
          {keys.map((key) => (
            <button key={key} className="keypad-btn" onClick={() => onKeyPress(key.toString())}>
              {key}
            </button>
          ))}
          <button className="keypad-btn action-btn" onClick={onClear}>C</button>
          <button className="keypad-btn" onClick={() => onKeyPress("0")}>0</button>
          <button className="keypad-btn action-btn" onClick={onDelete}><FaBackspace /></button>
        </div>
        <button className="keypad-done-btn" onClick={onClose}>Done</button>
      </div>
      <style jsx>{`
        .numeric-keypad-overlay {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          top: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 3000;
          padding-bottom: 20px;
        }
        .numeric-keypad {
          background-color: #fff;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
          padding: 20px;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .keypad-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          font-weight: bold;
          font-size: 18px;
          color: #333;
        }
        .close-keypad-btn {
          background: none;
          border: none;
          font-size: 20px;
          color: #666;
          cursor: pointer;
        }
        .keypad-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 15px;
        }
        .keypad-btn {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 15px;
          font-size: 24px;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          transition: background-color 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .keypad-btn:active {
          background-color: #e2e6ea;
          transform: scale(0.98);
        }
        .keypad-btn.action-btn {
          background-color: #e9ecef;
          color: #495057;
        }
        .keypad-done-btn {
          width: 100%;
          padding: 15px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
        }
        .keypad-done-btn:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
};
const SearchableSelect = ({ options = [], value = '', onChange, placeholder, allowCreateNew = false, onAddNewValue = null, createNewLabel = null, onCreateRequest = null }) => {
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
    if (allowCreateNew && !onAddNewValue) {
      if (onChange) onChange(newSearch);
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
    if (onCreateRequest) {
      onCreateRequest(search);
      setShowList(false);
      return;
    }
    if (onAddNewValue) {
      if (!search.trim()) {
        setShowList(false);
        return;
      }
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
          {allowCreateNew && (onAddNewValue || onCreateRequest) && (
            (() => {
              const isExactMatch = filteredOptions.some(option => option.toLowerCase() === search.toLowerCase());
              const hasSearch = !!search.trim();
              if ((onCreateRequest && !isExactMatch) || (onAddNewValue && hasSearch && !isExactMatch)) {
                let createText;
                if (hasSearch) {
                  createText = createNewLabel ? `Create New ${createNewLabel}: "${search.trim()}"` : `Create New: "${search.trim()}"`;
                } else {
                  createText = createNewLabel ? `Create New ${createNewLabel}` : `Create New`;
                }
                return (
                  <li
                    key="create-new"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCreateNewOption();
                    }}
                    style={{ fontStyle: 'italic', color: '#007bff' }}
                  >
                    {createText}
                  </li>
                );
              }
              return null;
            })()
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
    field4: "" // Added for potential future use or if needed, but primary logic uses 1-3
  });
  /* ────────────────────── KEYPAD STATE ────────────────────── */
  const [showNumpad, setShowNumpad] = useState(false);
  const [activeNumpadField, setActiveNumpadField] = useState(null);
  // Address Structure State
  const [addressStructure, setAddressStructure] = useState({
    structure: { countries: {} },
    linkedValues: {}
  });
  // Modal for adding new address value
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalField, setModalField] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalOnSave, setModalOnSave] = useState(null); // (newValue) => Promise<bool>
  const [modalOnChange, setModalOnChange] = useState(null); // (value) => void
  // Full Country Hierarchy Data
  // Format: "Country": ["Field1 Label", "Field2 Label", "Field3 Label"]
  // "N/A" indicates the field should not be shown.
  const countryAddressHierarchy = {
    "Afghanistan": ["Province", "District", "Area"],
    "Albania": ["County", "Municipality", "Area"],
    "Algeria": ["Province", "District", "Area"],
    "Andorra": ["Parish", "Area", "N/A"],
    "Angola": ["Province", "Municipality", "Area"],
    "Antigua and Barbuda": ["Parish", "Area", "N/A"],
    "Argentina": ["Province", "Department", "Municipality"],
    "Armenia": ["Province", "Community", "Area"],
    "Australia": ["State/Territory", "Local Government Area", "Suburb"],
    "Austria": ["State", "District", "Municipality"],
    "Azerbaijan": ["Economic Region", "District", "Area"],
    "Bahamas": ["District", "Area", "N/A"],
    "Bahrain": ["Governorate", "Municipality", "Area"],
    "Bangladesh": ["Division", "District", "Upazila"],
    "Barbados": ["Parish", "Area", "N/A"],
    "Belarus": ["Region", "District", "Area"],
    "Belgium": ["Region", "Province", "Municipality"],
    "Belize": ["District", "Town", "Area"],
    "Benin": ["Department", "Commune", "Area"],
    "Bhutan": ["District", "Gewog", "Village"],
    "Bolivia": ["Department", "Province", "Municipality"],
    "Bosnia and Herzegovina": ["Entity", "Canton", "Municipality"],
    "Botswana": ["District", "Sub-District", "Area"],
    "Brazil": ["State", "Municipality", "Neighborhood"],
    "Brunei": ["District", "Mukim", "Village"],
    "Bulgaria": ["Province", "Municipality", "Area"],
    "Burkina Faso": ["Region", "Province", "Commune"],
    "Burundi": ["Province", "Commune", "Area"],
    "Cambodia": ["Province", "District", "Commune"],
    "Cameroon": ["Region", "Division", "Sub-Division"],
    "Canada": ["Province/Territory", "Municipality", "Area"],
    "Cape Verde": ["Municipality", "Area", "N/A"],
    "Central African Republic": ["Prefecture", "Sub-Prefecture", "Area"],
    "Chad": ["Province", "Department", "Area"],
    "Chile": ["Region", "Province", "Commune"],
    "China": ["Province", "Prefecture", "County"],
    "Colombia": ["Department", "Municipality", "Area"],
    "Comoros": ["Island", "Prefecture", "Area"],
    "Costa Rica": ["Province", "Canton", "District"],
    "Croatia": ["County", "Municipality", "Area"],
    "Cuba": ["Province", "Municipality", "Area"],
    "Cyprus": ["District", "Municipality", "Area"],
    "Czech Republic": ["Region", "District", "Municipality"],
    "Denmark": ["Region", "Municipality", "Area"],
    "Djibouti": ["Region", "District", "Area"],
    "Dominica": ["Parish", "Area", "N/A"],
    "Dominican Republic": ["Province", "Municipality", "Area"],
    "Ecuador": ["Province", "Canton", "Parish"],
    "Egypt": ["Governorate", "District", "Area"],
    "El Salvador": ["Department", "Municipality", "Area"],
    "Equatorial Guinea": ["Province", "District", "Area"],
    "Eritrea": ["Region", "Sub-Region", "Area"],
    "Estonia": ["County", "Municipality", "Area"],
    "Eswatini": ["Region", "Inkhundla", "Area"],
    "Ethiopia": ["Region", "Zone", "Woreda"],
    "Fiji": ["Division", "Province", "District"],
    "Finland": ["Region", "Municipality", "Area"],
    "France": ["Region", "Department", "Commune"],
    "Gabon": ["Province", "Department", "Area"],
    "Gambia": ["Region", "District", "Area"],
    "Georgia": ["Region", "Municipality", "Area"],
    "Germany": ["State", "District", "Municipality"],
    "Ghana": ["Region", "District", "Area"],
    "Greece": ["Region", "Municipality", "Area"],
    "Grenada": ["Parish", "Area", "N/A"],
    "Guatemala": ["Department", "Municipality", "Area"],
    "Guinea": ["Region", "Prefecture", "Sub-Prefecture"],
    "Guinea-Bissau": ["Region", "Sector", "Area"],
    "Guyana": ["Region", "Neighborhood Council", "Area"],
    "Haiti": ["Department", "Arrondissement", "Commune"],
    "Honduras": ["Department", "Municipality", "Area"],
    "Hungary": ["County", "District", "Municipality"],
    "Iceland": ["Region", "Municipality", "Area"],
    "India": ["State/UT", "District", "Taluk"],
    "Indonesia": ["Province", "Regency/City", "District"],
    "Iran": ["Province", "County", "District"],
    "Iraq": ["Governorate", "District", "Area"],
    "Ireland": ["County", "Municipality", "Area"],
    "Israel": ["District", "Sub-District", "Area"],
    "Italy": ["Region", "Province", "Municipality"],
    "Jamaica": ["Parish", "Area", "N/A"],
    "Japan": ["Prefecture", "City/Ward", "District"],
    "Jordan": ["Governorate", "District", "Area"],
    "Kazakhstan": ["Region", "District", "Area"],
    "Kenya": ["County", "Sub-County", "Ward"],
    "Kiribati": ["Island", "Council", "Area"],
    "Kuwait": ["Governorate", "Area", "Block"],
    "Kyrgyzstan": ["Region", "District", "Area"],
    "Laos": ["Province", "District", "Village"],
    "Latvia": ["Municipality", "Area", "N/A"],
    "Lebanon": ["Governorate", "District", "Area"],
    "Lesotho": ["District", "Community Council", "Area"],
    "Liberia": ["County", "District", "Area"],
    "Libya": ["District", "Municipality", "Area"],
    "Liechtenstein": ["Municipality", "Area", "N/A"],
    "Lithuania": ["County", "Municipality", "Area"],
    "Luxembourg": ["Canton", "Commune", "Area"],
    "Madagascar": ["Region", "District", "Commune"],
    "Malawi": ["Region", "District", "Area"],
    "Malaysia": ["State", "District", "Mukim"],
    "Maldives": ["Atoll", "Island", "Area"],
    "Mali": ["Region", "Cercle", "Commune"],
    "Malta": ["Region", "Local Council", "Area"],
    "Marshall Islands": ["Atoll", "Municipality", "Area"],
    "Mauritania": ["Region", "Department", "Area"],
    "Mauritius": ["District", "Village", "Area"],
    "Mexico": ["State", "Municipality", "Locality"],
    "Micronesia": ["State", "Municipality", "Area"],
    "Moldova": ["District", "Commune", "Area"],
    "Monaco": ["Commune", "Area", "N/A"],
    "Mongolia": ["Province", "District", "Bag"],
    "Montenegro": ["Municipality", "Area", "N/A"],
    "Morocco": ["Region", "Province", "Commune"],
    "Mozambique": ["Province", "District", "Area"],
    "Myanmar": ["Region/State", "District", "Township"],
    "Namibia": ["Region", "Constituency", "Area"],
    "Nauru": ["District", "Area", "N/A"],
    "Nepal": ["Province", "District", "Municipality"],
    "Netherlands": ["Province", "Municipality", "Area"],
    "New Zealand": ["Region", "District", "Area"],
    "Nicaragua": ["Department", "Municipality", "Area"],
    "Niger": ["Region", "Department", "Commune"],
    "Nigeria": ["State", "Local Government Area", "Ward"],
    "North Korea": ["Province", "County", "Area"],
    "North Macedonia": ["Municipality", "Area", "N/A"],
    "Norway": ["County", "Municipality", "Area"],
    "Oman": ["Governorate", "Wilayat", "Area"],
    "Pakistan": ["Province", "Division", "District"],
    "Palau": ["State", "Area", "N/A"],
    "Panama": ["Province", "District", "Corregimiento"],
    "Papua New Guinea": ["Province", "District", "Area"],
    "Paraguay": ["Department", "District", "Area"],
    "Peru": ["Region", "Province", "District"],
    "Philippines": ["Region", "Province", "City/Municipality"],
    "Poland": ["Voivodeship", "County", "Gmina"],
    "Portugal": ["District", "Municipality", "Parish"],
    "Qatar": ["Municipality", "Zone", "Area"],
    "Romania": ["County", "Municipality", "Area"],
    "Russia": ["Federal Subject", "District", "Municipality"],
    "Rwanda": ["Province", "District", "Sector"],
    "Saint Lucia": ["District", "Area", "N/A"],
    "Samoa": ["District", "Village", "Area"],
    "San Marino": ["Municipality", "Area", "N/A"],
    "Saudi Arabia": ["Province", "Governorate", "Area"],
    "Senegal": ["Region", "Department", "Arrondissement"],
    "Serbia": ["District", "Municipality", "Area"],
    "Seychelles": ["District", "Area", "N/A"],
    "Sierra Leone": ["Province", "District", "Area"],
    "Singapore": ["City-State", "N/A", "N/A"],
    "Slovakia": ["Region", "District", "Municipality"],
    "Slovenia": ["Statistical Region", "Municipality", "Area"],
    "Solomon Islands": ["Province", "Ward", "Area"],
    "Somalia": ["State", "District", "Area"],
    "South Africa": ["Province", "District", "Municipality"],
    "South Korea": ["Province", "City/County", "District"],
    "South Sudan": ["State", "County", "Payam"],
    "Spain": ["Autonomous Community", "Province", "Municipality"],
    "Sri Lanka": ["Province", "District", "Division"],
    "Sudan": ["State", "Locality", "Area"],
    "Suriname": ["District", "Resort", "Area"],
    "Sweden": ["County", "Municipality", "Area"],
    "Switzerland": ["Canton", "Municipality", "Area"],
    "Syria": ["Governorate", "District", "Area"],
    "Taiwan": ["County/City", "District", "Area"],
    "Tajikistan": ["Region", "District", "Area"],
    "Tanzania": ["Region", "District", "Ward"],
    "Thailand": ["Province", "District", "Sub-District"],
    "Togo": ["Region", "Prefecture", "Canton"],
    "Tonga": ["Division", "District", "Area"],
    "Trinidad and Tobago": ["Region", "Municipality", "Area"],
    "Tunisia": ["Governorate", "Delegation", "Sector"],
    "Turkey": ["Province", "District", "Neighborhood"],
    "Turkmenistan": ["Province", "District", "Area"],
    "Tuvalu": ["Island", "Area", "N/A"],
    "Uganda": ["Region", "District", "Sub-County"],
    "Ukraine": ["Oblast", "Raion", "Hromada"],
    "United Arab Emirates": ["Emirate", "City", "Area"],
    "United Kingdom": ["Country", "County", "Borough"],
    "United States": ["State", "County", "City"],
    "Uruguay": ["Department", "Municipality", "Area"],
    "Uzbekistan": ["Region", "District", "Area"],
    "Vanuatu": ["Province", "Municipality", "Area"],
    "Vatican City": ["None", "N/A", "N/A"],
    "Venezuela": ["State", "Municipality", "Parish"],
    "Vietnam": ["Province", "District", "Commune"],
    "Yemen": ["Governorate", "District", "Area"],
    "Zambia": ["Province", "District", "Area"],
    "Zimbabwe": ["Province", "District", "Area"]
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [baseUrl, setBaseUrl] = useState("");
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
        const url = currentBaseUrl || "";
        fetchCustomerGroups(url);
        fetchAddressStructure(url);
      }
    };
    fetchConfig();
  }, []);
  useEffect(() => {
    if (showAddModal) {
      setModalValue('');
    }
  }, [showAddModal]);
  const fetchCustomerGroups = async (currentBaseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/customer-groups`);
      setCustomerGroups(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  const fetchAddressStructure = async (currentBaseUrl = baseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/address-structures`);
      setAddressStructure(res.data);
    } catch (e) {
      console.error("Failed to fetch address structure:", e);
    }
  };
  /* ────────────────────── RESTORE STATE ────────────────────── */
  useEffect(() => {
    if (location.state && location.state.formState) {
      const {
        customerName,
        phoneNumber,
        whatsappNumber,
        email,
        selectedISDCode,
        selectedWhatsappISDCode,
        deliveryAddress,
      } = location.state.formState;

      setCustomerName(customerName || "");
      setPhoneNumber(phoneNumber || "");
      setWhatsappNumber(whatsappNumber || "");
      setEmail(email || "");
      setSelectedISDCode(selectedISDCode || "+971");
      setSelectedWhatsappISDCode(selectedWhatsappISDCode || "+971");
      setDeliveryAddress(deliveryAddress || {
        building_name: "",
        flat_villa_no: "",
        country: "",
        field1: "",
        field2: "",
        field3: "",
        field4: ""
      });
    }

    if (location.state && location.state.newGroupId) {
      setSelectedGroup(location.state.newGroupId);
    }
  }, [location.state]);

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
  const handleGroupNameChange = (name) => {
    const group = customerGroups.find(g => g.group_name === name);
    if (group) {
      setSelectedGroup(group._id);
    } else {
      setSelectedGroup('');
    }
  };

  const handleNavigateToCreateGroup = (searchVal) => {
    const formState = {
      customerName,
      phoneNumber,
      whatsappNumber,
      email,
      selectedISDCode,
      selectedWhatsappISDCode,
      deliveryAddress,
    };
    navigate('/create-customer-group', {
      state: {
        fromCreateCustomer: true,
        formState,
        initialGroupName: searchVal
      }
    });
  };

  const getMaxDigits = (isdCode) => digitLengths[isdCode] || 10;
  /* ────────────────────── KEYPAD LOGIC ────────────────────── */
  const openNumpad = (field) => {
    setActiveNumpadField(field);
    setShowNumpad(true);
  };
  const closeNumpad = () => {
    setShowNumpad(false);
    setActiveNumpadField(null);
  };
  const handleNumpadKeyPress = (key) => {
    const updateField = (currentValue, maxDigits, setter) => {
      if (currentValue.length < maxDigits) {
        setter(currentValue + key);
      }
    };
    if (activeNumpadField === 'phone') {
      updateField(phoneNumber, getMaxDigits(selectedISDCode), setPhoneNumber);
    } else if (activeNumpadField === 'whatsapp') {
      updateField(whatsappNumber, getMaxDigits(selectedWhatsappISDCode), setWhatsappNumber);
    }
  };
  const handleNumpadDelete = () => {
    if (activeNumpadField === 'phone') {
      setPhoneNumber(prev => prev.slice(0, -1));
    } else if (activeNumpadField === 'whatsapp') {
      setWhatsappNumber(prev => prev.slice(0, -1));
    }
  };
  const handleNumpadClear = () => {
    if (activeNumpadField === 'phone') {
      setPhoneNumber("");
    } else if (activeNumpadField === 'whatsapp') {
      setWhatsappNumber("");
    }
  };
  const handlePhoneNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    const maxDigits = getMaxDigits(selectedISDCode);
    if (v.length <= maxDigits) setPhoneNumber(v);
  };
  const handleWhatsappNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    const maxDigits = getMaxDigits(selectedWhatsappISDCode);
    if (v.length <= maxDigits) setWhatsappNumber(v);
  };
  const handleCopyToWhatsapp = () => {
    setWhatsappNumber(phoneNumber);
    setSelectedWhatsappISDCode(selectedISDCode);
  };
  const handleDeliveryAddressChange = (field, value) => {
    setDeliveryAddress((p) => ({ ...p, [field]: value }));
  };
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
  const countryList = Object.keys(countryAddressHierarchy);
  // Helper to get labels for the selected country
  const getAddressLabels = (country) => {
    if (!country) return [];
    const hierarchyLabels = countryAddressHierarchy[country] || [];
    const dynamicCountry = addressStructure.structure.countries[country];
    if (dynamicCountry) {
      return [
        dynamicCountry.field1?.label || hierarchyLabels[0] || '',
        dynamicCountry.field2?.label || hierarchyLabels[1] || '',
        dynamicCountry.field3?.label || hierarchyLabels[2] || ''
      ];
    }
    return hierarchyLabels;
  };
  // Helper to get options for a field
  const getOptionsForField = (field, country, parent = null) => {
    const dynamicCountry = addressStructure.structure.countries[country];
    if (!dynamicCountry) return [];
    let opts = [];
    if (field === 'field1') {
      opts = dynamicCountry.field1?.values || [];
    } else if (field === 'field2') {
      if (parent && addressStructure.linkedValues[country] && addressStructure.linkedValues[country][parent]) {
        opts = addressStructure.linkedValues[country][parent].field2 || [];
      }
    } else if (field === 'field3') {
      if (parent && addressStructure.linkedValues[country] && addressStructure.linkedValues[country][parent]) {
        opts = addressStructure.linkedValues[country][parent].field3 || [];
      }
    }
    return opts;
  };
  // Handler for adding new address value
  const handleAddNewAddressValue = async (field, newValue) => {
    const country = deliveryAddress.country;
    if (!country) return false;
    let parent_value = '';
    if (field === 'field2') {
      parent_value = deliveryAddress.field1;
    } else if (field === 'field3') {
      parent_value = deliveryAddress.field2;
    }
    try {
      const res = await axios.post(`${baseUrl}/api/add-address-value`, {
        country,
        field,
        value: newValue,
        parent_value: parent_value || undefined
      });
      if (res.status === 200) {
        setAddressStructure((prev) => {
          const newStruct = {
            structure: { ...prev.structure },
            linkedValues: { ...prev.linkedValues },
          };
          const countryData = newStruct.structure.countries[country] || (newStruct.structure.countries[country] = {});
          if (field === "field1") {
            if (!countryData.field1) countryData.field1 = { values: [] };
            countryData.field1.values = [newValue, ...countryData.field1.values];
          } else if (field === "field2") {
            const linkedCountry = newStruct.linkedValues[country] || (newStruct.linkedValues[country] = {});
            const parentData = linkedCountry[parent_value] || (linkedCountry[parent_value] = {});
            parentData.field2 = [newValue, ...(parentData.field2 || [])];
          } else if (field === "field3") {
            const linkedCountry = newStruct.linkedValues[country] || (newStruct.linkedValues[country] = {});
            const parentData = linkedCountry[parent_value] || (linkedCountry[parent_value] = {});
            parentData.field3 = [newValue, ...(parentData.field3 || [])];
          }
          return newStruct;
        });
        await fetchAddressStructure();
        return true;
      }
    } catch (e) {
      console.error(e);
      setWarningMessage(`Failed to add new ${field} value`);
      setWarningType("warning");
      return false;
    }
    return false;
  };
  const addressLabels = getAddressLabels(deliveryAddress.country);
  const field1Label = addressLabels[0];
  const field2Label = addressLabels[1];
  const field3Label = addressLabels[2];
  const handleOpenAddModal = (field, initialSearch) => {
    setModalField(field);
    setModalValue(initialSearch);
    setModalOnSave(() => (newValue) => handleAddNewAddressValue(field, newValue));
    setModalOnChange(() => (value) => handleDeliveryAddressChange(field, value));
    setShowAddModal(true);
  };
  const handleSaveModal = async () => {
    const values = modalValue.split(',').map(v => v.trim()).filter(v => v);
    if (values.length === 0) {
      setShowAddModal(false);
      return;
    }
    if (modalOnSave) {
      let allSuccess = true;
      let firstValue = null;
      for (const val of values) {
        const success = await modalOnSave(val);
        if (!success) allSuccess = false;
        if (!firstValue) firstValue = val;
      }
      if (allSuccess && modalOnChange) {
        modalOnChange(firstValue); // Set to the first value added
      }
    }
    setShowAddModal(false);
  };
  const handleCloseModal = () => {
    setShowAddModal(false);
  };
  /* ────────────────────── RENDER ────────────────────── */
  return (
    <div className="create-customer-container">
      <button onClick={handleBackToAdmin} className="fixed-back-btn">
        <FaArrowLeft /> Back Login
      </button>
      {warningMessage && (
        <div className={`alert alert-${warningType} text-center alert-dismissible fade show`} role="alert">
          {warningMessage}
          <button type="button" className="btn-close" onClick={handleWarningOk} />
        </div>
      )}
      {/* NUMERIC KEYPAD COMPONENT */}
      {showNumpad && (
        <NumericKeypad
          onKeyPress={handleNumpadKeyPress}
          onDelete={handleNumpadDelete}
          onClose={closeNumpad}
          onClear={handleNumpadClear}
        />
      )}
      {/* ADD NEW VALUE MODAL */}
      {showAddModal && (
        <div className="add-modal-overlay">
          <div className="add-modal">
            <div className="modal-header">
              <span>Add New {modalField === 'field1' ? field1Label : modalField === 'field2' ? field2Label : field3Label}</span>
              <button className="close-modal-btn" onClick={handleCloseModal}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                placeholder="Enter new value(s), comma separated"
              />
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
              <button className="save-btn" onClick={handleSaveModal}>Save</button>
            </div>
          </div>
        </div>
      )}
      <div className="main-content-card">
        <div className="header-section">
          <div></div>
          <h1>Create a New Customer</h1>
          <div className="header-buttons">
            <button className="save-btn" onClick={handleCreateCustomer}>
              Save
            </button>
          </div>
        </div>
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
        <div className="form-section">
          {activeTab === "details" && (
            <div className="form-grid">
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
                    {/* KEYPAD TRIGGER FOR WHATSAPP */}
                    <input
                      type="text"
                      placeholder={`${getMaxDigits(selectedWhatsappISDCode)}-digit WhatsApp Number`}
                      value={whatsappNumber}
                      onChange={handleWhatsappNumberChange}
                      onClick={() => openNumpad('whatsapp')}
                      readOnly={true}
                      style={{ cursor: 'pointer', backgroundColor: '#fff' }}
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
                    onCreateRequest={handleNavigateToCreateGroup}
                    createNewLabel="Group"
                  />
                </div>
              </div>
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
                    {/* KEYPAD TRIGGER FOR PHONE */}
                    <input
                      type="text"
                      placeholder={`${getMaxDigits(selectedISDCode)}-digit Phone Number`}
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      onClick={() => openNumpad('phone')}
                      readOnly={true}
                      style={{ cursor: 'pointer', backgroundColor: '#fff' }}
                    />
                  </div>
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
          {activeTab === "address-and-contact" && (
            <div className="form-grid">
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
                      handleDeliveryAddressChange("field4", "");
                    }}
                    placeholder="Select Country"
                  />
                </div>
                {field1Label && field1Label !== "N/A" && field1Label !== "None" && (
                  <div className="form-group">
                    <label>{field1Label}</label>
                    <SearchableSelect
                      options={getOptionsForField("field1", deliveryAddress.country)}
                      value={deliveryAddress.field1}
                      onChange={(value) => {
                        handleDeliveryAddressChange("field1", value);
                        handleDeliveryAddressChange("field2", "");
                        handleDeliveryAddressChange("field3", "");
                      }}
                      placeholder={`Select or Create ${field1Label}`}
                      allowCreateNew={true}
                      onAddNewValue={(newValue) => handleAddNewAddressValue("field1", newValue)}
                      onCreateRequest={(search) => handleOpenAddModal("field1", search)}
                    />
                  </div>
                )}
                {field2Label && field2Label !== "N/A" && field2Label !== "None" && (
                  <div className="form-group">
                    <label>{field2Label}</label>
                    <SearchableSelect
                      options={getOptionsForField("field2", deliveryAddress.country, deliveryAddress.field1)}
                      value={deliveryAddress.field2}
                      onChange={(value) => {
                        handleDeliveryAddressChange("field2", value);
                        handleDeliveryAddressChange("field3", "");
                      }}
                      placeholder={`Select or Create ${field2Label}`}
                      allowCreateNew={true}
                      onAddNewValue={(newValue) => handleAddNewAddressValue("field2", newValue)}
                      onCreateRequest={(search) => handleOpenAddModal("field2", search)}
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
              <div className="form-column right">
                {field3Label && field3Label !== "N/A" && field3Label !== "None" && (
                  <div className="form-group">
                    <label>{field3Label}</label>
                    <SearchableSelect
                      options={getOptionsForField("field3", deliveryAddress.country, deliveryAddress.field2)}
                      value={deliveryAddress.field3}
                      onChange={(value) => handleDeliveryAddressChange("field3", value)}
                      placeholder={`Select or Create ${field3Label}`}
                      allowCreateNew={true}
                      onAddNewValue={(newValue) => handleAddNewAddressValue("field3", newValue)}
                      onCreateRequest={(search) => handleOpenAddModal("field3", search)}
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
                {!field1Label && <div className="form-group empty-align" />}
                {!field2Label && <div className="form-group empty-align" />}
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .create-customer-container {
          background: linear-gradient(135deg, #ffffff 0%, #3498db 100%);
          min-height: 100vh;
          padding: 20px;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
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
        .main-content-card {
          max-width: 1000px;
          margin: 80px auto 20px;
          background-color: #ffffff;
          border-radius: 15px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
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
 
        /* Add Modal Styles */
        .add-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
        }
        .add-modal {
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 400px;
          padding: 20px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          font-weight: bold;
          font-size: 18px;
          color: #333;
        }
        .close-modal-btn {
          background: none;
          border: none;
          font-size: 20px;
          color: #666;
          cursor: pointer;
        }
        .modal-body {
          margin-bottom: 15px;
        }
        .modal-body input {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          font-size: 13px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .modal-footer button {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }
        .modal-footer .cancel-btn {
          background: #dc3545;
          color: #fff;
        }
        .modal-footer .cancel-btn:hover {
          background: #c82333;
        }
        .modal-footer .save-btn {
          background: #007bff;
          color: #fff;
        }
        .modal-footer .save-btn:hover {
          background: #0056b3;
        }
 
        @media (max-width: 768px) {
          .header-section { flex-direction: column; text-align: center; }
          .header-buttons { justify-content: center; }
          .form-grid { grid-template-columns: 1fr; }
          .tabs-container { min-width: auto; }
          .copy-suggestion { flex-direction: column; align-items: flex-start; gap: 6px; }
          .alert { min-width: 280px; max-width: 95vw; left: 5px; right: 5px; transform: none; }
          .fixed-back-btn { left: 10px; top: 10px; padding: 6px 16px; font-size: 14px; }
          .main-content-card { margin: 60px auto 20px; padding: 20px; }
        }
      `}</style>
    </div>
  );
};
export default CreateCustomerPage;