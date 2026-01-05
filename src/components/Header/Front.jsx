import React, { useEffect, useState, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import FoodDetails from "./FoodDetails"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import { Card, Button } from 'react-bootstrap';
import "./front.css"
const SearchableSelect = ({ options = [], value = '', onChange, placeholder }) => {
  const [search, setSearch] = useState(value || '');
  const [showList, setShowList] = useState(false);
  const selectRef = useRef(null); // Ref for the entire select container
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
  const handleSelectOption = (option, e) => {
    e.stopPropagation(); // Prevent event from bubbling
    setSearch(option);
    if (onChange) {
      onChange(option);
    }
    setShowList(false);
  };
  const handleFocus = () => {
    setShowList(true);
  };
  const handleBlur = (e) => {
    // Check if the click is moving focus outside the select container
    if (selectRef.current && !selectRef.current.contains(e.relatedTarget)) {
      setShowList(false);
    }
  };
  const handleListMouseDown = (e) => {
    e.stopPropagation(); // Prevent outside click handlers from closing the parent form
    e.preventDefault(); // Prevent default to avoid blur issues
  };
  return (
    <div className="searchable-select" ref={selectRef}>
      <input
        type="text"
        value={search}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
      {showList && (
        <ul className="searchable-list" onMouseDown={handleListMouseDown}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSelectOption(option, e);
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
function FrontPage() {
  const [menuItems, setMenuItems] = useState([])
  const [comboList, setComboList] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("All Items")
  const [categories, setCategories] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [billCartItems, setBillCartItems] = useState([])
  const [isPhoneNumberSet, setIsPhoneNumberSet] = useState(false)
  const [savedOrders, setSavedOrders] = useState([])
  const [phoneNumber, setPhoneNumber] = useState("")
  const [customers, setCustomers] = useState([])
  const [customerName, setCustomerName] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [showCustomerSection, setShowCustomerSection] = useState(false)
  const [baseUrl, setBaseUrl] = useState(""); // Dynamic base URL for client/server mode
  const [currency, setCurrency] = useState("INR"); // NEW: Currency from settings, default INR
  const [useCurrencySymbol, setUseCurrencySymbol] = useState(false); // NEW: Toggle between Symbol and Code
  // NEW: Company tax details for fallback when item tax_rate is 0 but tax_applicable is true
  const [companyTaxType, setCompanyTaxType] = useState('GST'); // Default to GST
  const [companyTaxRate, setCompanyTaxRate] = useState(18); // Default fallback rate (e.g., 18% for GST)
  const [deliveryAddress, setDeliveryAddress] = useState({
    building_name: "",
    flat_villa_no: "",
    country: "",
    field1: "",
    field2: "",
    field3: "",
  })
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [whatsappISDCode, setWhatsappISDCode] = useState("+91") // NEW: Separate ISD for WhatsApp
  const [showWhatsappISDCodeDropdown, setShowWhatsappISDCodeDropdown] = useState(false) // NEW: Dropdown for WhatsApp ISD
  const [email, setEmail] = useState("")
  const [orderId, setOrderId] = useState(null)
  // UPDATED: Add orderNo state to capture backend-generated orderNo after SAVE for new orders
  const [orderNo, setOrderNo] = useState(null)
  const [bookedTables, setBookedTables] = useState([])
  const [bookedChairs, setBookedChairs] = useState({})
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showISDCodeDropdown, setShowISDCodeDropdown] = useState(false)
  const [selectedISDCode, setSelectedISDCode] = useState("+91")
  const [warningMessage, setWarningMessage] = useState("")
  const [warningType, setWarningType] = useState("warning")
  const [pendingAction, setPendingAction] = useState(null)
  const [selectedCartItem, setSelectedCartItem] = useState(null)
  const [currentDate, setCurrentDate] = useState("")
  const [currentTime, setCurrentTime] = useState("")
  const [startIndex, setStartIndex] = useState(0)
  const [totalChairs, setTotalChairs] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("selectedTheme") || "light"
  })
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [isConfirmation, setIsConfirmation] = useState(false)
  const phoneNumberRef = useRef(null)
  const customerSectionRef = useRef(null)
  const themes = {
    light: {
      name: "Light",
      icon: "☀️",
    },
    dark: {
      name: "Dark",
      icon: "🌙",
    },
    nature: {
      name: "Nature",
      icon: "🌿",
    },
    sunset: {
      name: "Sunset",
      icon: "🌅",
    },
  }
  const [customerGroups, setCustomerGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  // Address Structure State
  const defaultStructure = {
    countries: {},
  };
  const [addressStructure, setAddressStructure] = useState(defaultStructure);
  const [linkedValues, setLinkedValues] = useState({});
  // NEW: POS Grid View Toggle State
  const [showPOSGrid, setShowPOSGrid] = useState(false);
  // FIXED: Define generate_order_number function to resolve ReferenceError
  const generate_order_number = (orderType) => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const typePrefix = orderType === "Dine In" ? "DIN" : orderType === "Takeaway" ? "TAK" : "DEL";
    return `${typePrefix}-${timestamp}`;
  };
  // UPDATED: Helper function to format price with currency symbol (e.g., "₹200.00" for INR)
  // Maps currency codes to symbols; defaults to INR symbol if no currency or invalid
  const getCurrencySymbol = (currCode) => {
    const symbols = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      AED: "د.إ",
      JPY: "¥",
      CNY: "¥",
      SGD: "$",
      MYR: "RM",
      THB: "฿",
      IDR: "Rp",
      KRW: "₩",
      PHP: "₱",
      SAR: "﷼",
      QAR: "﷼",
      KWD: "د.ك",
      OMR: "﷼",
      BHD: ".د.ب",
      CAD: "$",
      AUD: "$",
      NZD: "$",
      CHF: "CHF",
      ZAR: "R",
      BRL: "R$",
      PKR: "₨",
      LKR: "Rs",
      NGN: "₦"
      // Add more as needed
    };
    return symbols[currCode?.toUpperCase()] || '₹'; // Default to ₹ (INR) if not found
  };
  const formatPrice = (price) => {
    const symbol = useCurrencySymbol ? getCurrencySymbol(currency) : `${currency} `; // Get symbol or code based on setting
    if (isNaN(price) || price === 0) return `${symbol}0.00`;
    return `${symbol}${price.toFixed(2)}`;
  };
  // NEW: Helper to get effective tax rate (use company tax if item rate is 0 but applicable)
  const getEffectiveTaxRate = (taxApplicable, taxRate, isAddon = false, isCombo = false) => {
    if (!taxApplicable) return 0;
    if (taxRate > 0) return taxRate;
    // If applicable but rate 0, fallback to company tax rate
    return companyTaxRate;
  };
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme)
    setShowThemeSelector(false)
    localStorage.setItem("selectedTheme", theme)
    document.body.className = `theme-${theme}`
  }
  useEffect(() => {
    const savedTheme = localStorage.getItem("selectedTheme") || "light"
    setCurrentTheme(savedTheme)
    document.body.className = `theme-${savedTheme}`
  }, [])
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`
  }, [currentTheme])
  const reduxUser = useSelector((state) => state.user.user)
  const storedUser = JSON.parse(localStorage.getItem("user")) || { email: "Guest" }
  const user = reduxUser || storedUser
  const isdCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+971", country: "UAE" },
    { code: "+61", country: "Australia" },
  ]
  const location = useLocation()
  const { state } = location
  const {
    tableNumber = "N/A",
    chairsCount = 0,
    chairsBooked = [],
    orderType = "Dine In",
    existingOrder,
    cartItems: initialCartItems,
    phoneNumber: initialPhoneNumber,
    customerName: initialCustomerName,
    deliveryAddress: initialDeliveryAddress,
    whatsappNumber: initialWhatsappNumber,
    email: initialEmail,
    deliveryPersonId, // NEW: Destructured for Online Delivery
    deliveryPersonName, // NEW: Destructured for Online Delivery
  } = state || {}
  const navigate = useNavigate()
  // Fetch config for baseUrl (client/server mode)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:8000`);
        } else {
          setBaseUrl(""); // Relative paths for server mode
        }
        console.log("API configured for", appConfig.mode, "mode. Pointing to", baseUrl || "localhost");
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl(""); // Fallback to relative
      }
    };
    fetchConfig();
  }, []);
  // UPDATED: Fetch currency from settings (default INR with symbol handling)
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/settings` : '/api/settings';
        const response = await axios.get(apiPath);
        const { currency: fetchedCurrency = "INR", useCurrencySymbol: fetchedUseSymbol = false } = response.data;
        setCurrency(fetchedCurrency.toUpperCase()); // Ensure uppercase like INR, AED
        setUseCurrencySymbol(fetchedUseSymbol);
        console.log("Fetched currency:", fetchedCurrency, "Use Symbol:", fetchedUseSymbol); // Debug
      } catch (error) {
        console.error("Failed to fetch currency settings:", error);
        setCurrency("INR"); // Fallback to INR
      }
    };
    fetchCurrency();
  }, [baseUrl]);
  // NEW: Fetch company details for tax fallback
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/company-details` : '/api/company-details';
        const response = await axios.get(apiPath);
        if (response.data.companyDetails && response.data.companyDetails.length > 0) {
          const latestDetails = response.data.companyDetails[response.data.companyDetails.length - 1];
          const taxType = latestDetails.taxType || 'GST';
          const taxPercentage = Number(latestDetails.taxPercentage) || 18; // Default 18% if not set
          setCompanyTaxType(taxType);
          setCompanyTaxRate(taxPercentage);
          console.log("Fetched company tax:", taxType, taxPercentage); // Debug
        }
      } catch (error) {
        console.error("Failed to fetch company details for tax:", error);
        // Fallback to defaults
        setCompanyTaxType('GST');
        setCompanyTaxRate(18);
      }
    };
    fetchCompanyDetails();
  }, [baseUrl]);
  // Handle clicks outside customer section
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerSectionRef.current && !customerSectionRef.current.contains(event.target) && showCustomerSection) {
        setShowCustomerSection(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showCustomerSection])
  // Update date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      setCurrentDate(now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }))
    }
    updateDateTime()
    const intervalId = setInterval(updateDateTime, 60000)
    return () => clearInterval(intervalId)
  }, [])
  // Fetch table data
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/tables`);
        const table = response.data.message.find((t) => String(t.table_number) === String(tableNumber))
        if (table) {
          setTotalChairs(table.number_of_chairs || 0)
        } else {
          setTotalChairs(0)
        }
      } catch (err) {
        setWarningMessage(`Error fetching table data: ${err.message}`)
        setWarningType("warning")
      }
    }
    if (tableNumber && tableNumber !== "N/A") fetchTableData()
  }, [tableNumber, baseUrl])
  // FIXED: Always fetch address structure, regardless of baseUrl (use relative if empty)
  useEffect(() => {
    const fetchAddressStructure = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/address-structures` : '/api/address-structures';
        const response = await fetch(apiPath);
        if (!response.ok) {
          throw new Error('Failed to fetch address structure');
        }
        const data = await response.json();
        setAddressStructure(data.structure || defaultStructure);
        setLinkedValues(data.linkedValues || {});
      } catch (error) {
        console.error('Error fetching address structure:', error);
      }
    };
    fetchAddressStructure();
  }, [baseUrl]);
  // Initialize state from location state
  useEffect(() => {
    if (state) {
      setPhoneNumber(
        initialPhoneNumber?.replace(/^\+\d+/, "") || existingOrder?.phoneNumber?.replace(/^\+\d+/, "") || "",
      )
      setCustomerName(initialCustomerName || existingOrder?.customerName || "")
      const savedAddress = initialDeliveryAddress || existingOrder?.deliveryAddress || {}
      setDeliveryAddress({
        building_name: savedAddress.building_name || "",
        flat_villa_no: savedAddress.flat_villa_no || "",
        country: savedAddress.country || "",
        field1: savedAddress.field1 || "",
        field2: savedAddress.field2 || "",
        field3: savedAddress.field3 || "",
      })
      // UPDATED: Parse full whatsapp number to separate code and digits
      const fullWhatsapp = initialWhatsappNumber || existingOrder?.whatsappNumber || "";
      const whatsappCode = isdCodes.find((isd) => fullWhatsapp.startsWith(isd.code))?.code || "+91";
      setWhatsappISDCode(whatsappCode);
      setWhatsappNumber(fullWhatsapp.replace(whatsappCode, "") || "");
      setEmail(initialEmail || existingOrder?.email || "")
      setIsPhoneNumberSet(!!(initialPhoneNumber || existingOrder?.phoneNumber))
      setCartItems(initialCartItems || existingOrder?.cartItems || [])
      setBillCartItems(initialCartItems || existingOrder?.cartItems || [])
      setOrderId(existingOrder?.orderId || null)
      // UPDATED: Set orderNo from existingOrder if available
      setOrderNo(existingOrder?.orderNo || null)
      setBookedChairs(JSON.parse(localStorage.getItem("bookedChairs")) || {})
    }
  }, [
    state,
    existingOrder,
    initialCartItems,
    initialPhoneNumber,
    initialCustomerName,
    initialDeliveryAddress,
    initialWhatsappNumber,
    initialEmail,
  ])
  // Load saved orders and booked tables/chairs
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedOrders")) || []
    setSavedOrders(saved)
    const booked = JSON.parse(localStorage.getItem("bookedTables")) || []
    setBookedTables(booked)
    const chairs = JSON.parse(localStorage.getItem("bookedChairs")) || {}
    setBookedChairs(chairs)
  }, [])
  // Fetch menu items and combos
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/items`)
        const data = response.data
        if (Array.isArray(data)) {
          const formattedItems = data.map((item) => ({
            id: uuidv4(),
            name: item.item_name || "Unnamed Item",
            category: item.item_group ? item.item_group.toLowerCase() : "uncategorized",
            image: item.image ? `${baseUrl}${item.image}` : "/static/images/default-item.jpg",
            basePrice: Number(item.price_list_rate) || 0,
            offer_price: Number(item.offer_price) || 0,
            offer_start_time: item.offer_start_time,
            offer_end_time: item.offer_end_time,
            tax_applicable: item.tax_applicable || false,
            tax_rate: item.tax_rate || 0,
            size: item.size || {
              enabled: true,
              small_price: Number(item.price_list_rate) - 10 || 0,
              medium_price: Number(item.price_list_rate) || 0,
              large_price: Number(item.price_list_rate) + 10 || 0,
            },
            cold: item.cold || { enabled: false, ice_preference: "without_ice", ice_price: 10 },
            spicy: item.spicy || { enabled: false, is_spicy: false, spicy_price: 20 },
            sugar: item.sugar || { enabled: false, level: "medium" },
            custom_variants: item.custom_variants || [],
            addons:
              item.addons?.map((addon) => ({
                name1: addon.name1,
                addon_image: addon.addon_image ? `${baseUrl}${addon.addon_image}` : "/static/images/default-addon-image.jpg",
                price: Number(addon.addon_price) || 0,
                tax_applicable: addon.tax_applicable || false,
                tax_rate: addon.tax_rate || 0,
                size: addon.size || {
                  enabled: true,
                  small_price: Number(addon.addon_price) - 10 || 0,
                  medium_price: Number(addon.addon_price) || 0,
                  large_price: Number(addon.addon_price) + 10 || 0,
                },
                cold: addon.cold || { enabled: false, ice_price: 10 },
                spicy: addon.spicy || { enabled: false, is_spicy: false, spicy_price: 20 },
                sugar: addon.sugar || { enabled: false, level: "medium" },
                kitchen: addon.kitchen || "Main Kitchen",
                custom_variants: addon.custom_variants || [],
              })) || [],
            combos:
              item.combos?.map((combo) => ({
                name1: combo.name1,
                combo_image: combo.combo_image ? `${baseUrl}${combo.combo_image}` : "/static/images/default-combo-image.jpg",
                price: Number(combo.combo_price) || 0,
                tax_applicable: combo.tax_applicable || false,
                tax_rate: combo.tax_rate || 0,
                size: combo.size || {
                  enabled: true,
                  small_price: Number(combo.combo_price) - 10 || 0,
                  medium_price: Number(combo.combo_price) || 0,
                  large_price: Number(combo.combo_price) + 10 || 0,
                },
                cold: combo.cold || { enabled: false, ice_price: 10 },
                spicy: combo.spicy || { enabled: false, is_spicy: false, spicy_price: 30 },
                sugar: combo.sugar || { enabled: false, level: "medium" },
                kitchen: combo.kitchen || "Main Kitchen",
                custom_variants: combo.custom_variants || [],
              })) || [],
            kitchen: item.kitchen || "Main Kitchen",
            ingredients: item.ingredients || [],
          }))
          setMenuItems(formattedItems)
          setFilteredItems(formattedItems)
        }
      } catch (error) {
        console.error("Error fetching items:", error)
        setWarningMessage("Failed to load menu items. Please try again.")
        setWarningType("warning")
      }
    }
    const fetchCombos = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/combo-offer`);
        if (response.data) {
          const data = response.data;
          const formattedCombos = data.map((combo) => ({
            id: combo._id,
            name: combo.description || "Combo Offer",
            category: "combos offer",
            images: combo.images || [], // FIXED: Use uploaded images array for combo
            image: combo.images && combo.images.length > 0 ? `${baseUrl}/api/combo-images/${combo.images[0]}` : "/static/images/default-combo.jpg", // Primary image
            basePrice: Number(combo.total_price) || 0,
            offer_price: Number(combo.offer_price) || 0,
            offer_start_time: combo.offer_start_time,
            offer_end_time: combo.offer_end_time,
            tax_applicable: false, // Default for combo offers
            tax_rate: 0,
            isCombo: true,
            comboItems: combo.items.map((citem) => ({
              name: citem.data.item_name || citem.data.name1,
              description: citem.data.description || '',
              price: Number(citem.price) || 0,
              image: citem.data.image ? `${baseUrl}${citem.data.image}` : citem.data.addon_image ? `${baseUrl}${citem.data.addon_image}` : citem.data.combo_image ? `${baseUrl}${citem.data.combo_image}` : "https://via.placeholder.com/80",
              kitchen: citem.data.kitchen || "Main Kitchen",
            })),
            addons: combo.addons || [], // FIXED: Include addons for rendering
            combos: combo.combos || [], // FIXED: Include sub-combos
            kitchen: combo.kitchen || "Main Kitchen",
          }));
          setComboList(formattedCombos);
        } else {
          console.error('Failed to fetch combos');
        }
      } catch (error) {
        console.error('Error fetching combos:', error);
      }
    };
    fetchItems()
    fetchCombos()
  }, [baseUrl])
  useEffect(() => {
    const uniqueCategories = [...new Set(menuItems.map((item) => item.category))];
    const filteredCategories = uniqueCategories.filter((category) => category && category !== "uncategorized");
    setCategories([`Combos Offer (${comboList.length})`, "All Items", ...filteredCategories]);
  }, [menuItems, comboList]);
  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/customers` : '/api/customers';
        const response = await axios.get(apiPath)
        setCustomers(response.data)
        setFilteredCustomers(response.data)
      } catch (error) {
        console.error("Error fetching customers:", error)
        setWarningMessage("Failed to load customers. Please try again.")
        setWarningType("warning")
      }
    }
    fetchCustomers()
  }, [baseUrl])
  // Fetch customer groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/customer-groups` : '/api/customer-groups';
        const response = await axios.get(apiPath)
        setCustomerGroups(response.data)
      } catch (error) {
        console.error("Error fetching customer groups:", error)
        setWarningMessage("Failed to load customer groups. Please try again.")
        setWarningType("warning")
      }
    }
    fetchGroups()
  }, [baseUrl])
  // REMOVED: Fetch VAT rate - now per item
  // Filter menu items based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(menuItems)
      setSelectedCategory("All Items")
    } else {
      const filtered = menuItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredItems(filtered)
      setSelectedCategory("")
    }
  }, [searchQuery, menuItems])
  const handleFilter = (category) => {
    setSearchQuery("")
    let cleanCategory = category;
    if (category.includes("Combos Offer")) {
      cleanCategory = "Combos Offer";
      setFilteredItems(comboList)
    } else if (category === "All Items") {
      setFilteredItems(menuItems)
    } else {
      const filtered = menuItems.filter((item) => item.category.toLowerCase() === category.toLowerCase())
      setFilteredItems(filtered)
    }
    setSelectedCategory(cleanCategory)
  }
  const handleItemClick = (item, preSelectedSize = null) => {
    // Check if we are clicking a specific size variant card (so we pass preSelectedSize)
    // OR if the item object itself has a preSelectedSize property attached during mapping
    const size = preSelectedSize || item.preSelectedSize || null;

    const existingCartItem = cartItems.find((cartItem) =>
      cartItem.item_name === item.name &&
      (!size || cartItem.selectedSize === size)
    );

    setSelectedItem(item)

    if (existingCartItem) {
      setSelectedCartItem(existingCartItem)
    } else if (size) {
      // Pass a mock cart item to FoodDetails to force the selected size
      setSelectedCartItem({ selectedSize: size })
    } else {
      setSelectedCartItem(null)
    }
  }
  const handleCartItemClick = (cartItem) => {
    const menuItem = menuItems.find((item) => item.name === cartItem.item_name);
    setSelectedItem(menuItem || null);
    setSelectedCartItem(cartItem);
  }
  const hasActiveOffer = (item) => {
    if (item.offer_price === undefined || !item.offer_start_time || !item.offer_end_time) {
      return false;
    }
    const currentTime = new Date();
    const startTime = new Date(item.offer_start_time);
    const endTime = new Date(item.offer_end_time);
    return startTime <= currentTime && currentTime <= endTime;
  };
  const calculateOfferSizePrice = (offerPrice, size) => {
    if (!offerPrice) return 0
    switch (size) {
      case "S":
        return offerPrice - 10
      case "M":
        return offerPrice
      case "L":
        return offerPrice + 10
      default:
        return offerPrice
    }
  }
  const createStandaloneAddonItem = (addon, size = "M", isSplitVariant = false, mainItemSize = null) => {
    const effectiveSize = isSplitVariant ? size : (mainItemSize || size);
    const addonSizePrice = addon?.size?.enabled
      ? effectiveSize === "S" ? addon.size.small_price || addon.price - 10 || 0
        : effectiveSize === "L" ? addon.size.large_price || addon.price + 10 || 0
          : addon.size.medium_price || addon.price || 0
      : addon.price || 0;

    const effectiveTaxRate = getEffectiveTaxRate(addon.tax_applicable, addon.tax_rate, true);
    const exclTotal = addonSizePrice * 1; // Quantity 1
    const taxTotal = effectiveTaxRate > 0 ? exclTotal * (effectiveTaxRate / 100) : 0;
    const taxBreakdown = taxTotal > 0 ? { [effectiveTaxRate]: taxTotal } : {};

    return {
      id: uuidv4(),
      item_name: addon.name1, // Standalone: Use addon name as item
      name: addon.name1,
      quantity: 1,
      basePrice: addonSizePrice, // Use size-adjusted price
      totalPrice: exclTotal + taxTotal,
      exclTotal,
      taxTotal,
      taxBreakdown,
      mainTaxTotal: taxTotal,
      mainTaxRate: effectiveTaxRate,
      mainExclPerUnit: addonSizePrice, // Needed for main item quantity updates
      selectedSize: effectiveSize,
      kitchen: addon.kitchen || "Main Kitchen",
      image: addon.addon_image || "/static/images/default-addon-image.jpg",
      isStandaloneAddon: true, // Flag to identify in cart/billing
      status: "Pending",
      served: false,
      // Variants for addon itself (if needed later)
      addonVariants: { [addon.name1]: { size: effectiveSize } }, // Self-reference if needed
    };
  };

  // NEW: Helper to create standalone combo as cart item
  const createStandaloneComboItem = (combo, size = "M", isSplitVariant = false, mainItemSize = null) => {
    const effectiveSize = isSplitVariant ? size : (mainItemSize || size);
    const comboSizePrice = combo?.size?.enabled
      ? effectiveSize === "S" ? combo.size.small_price || combo.price - 10 || 0
        : effectiveSize === "L" ? combo.size.large_price || combo.price + 10 || 0
          : combo.size.medium_price || combo.price || 0
      : combo.price || 0;

    const effectiveTaxRate = getEffectiveTaxRate(combo.tax_applicable, combo.tax_rate, false, true);
    const exclTotal = comboSizePrice * 1; // Quantity 1
    const taxTotal = effectiveTaxRate > 0 ? exclTotal * (effectiveTaxRate / 100) : 0;
    const taxBreakdown = taxTotal > 0 ? { [effectiveTaxRate]: taxTotal } : {};

    return {
      id: uuidv4(),
      item_name: combo.name1, // Standalone: Use combo name as item
      name: combo.name1,
      quantity: 1,
      basePrice: comboSizePrice,
      totalPrice: exclTotal + taxTotal,
      exclTotal,
      taxTotal,
      taxBreakdown,
      mainTaxTotal: taxTotal,
      mainTaxRate: effectiveTaxRate,
      mainExclPerUnit: comboSizePrice, // Needed for main item quantity updates
      selectedSize: effectiveSize,
      kitchen: combo.kitchen || "Main Kitchen",
      image: combo.combo_image || "/static/images/default-combo-image.jpg",
      isStandaloneCombo: true, // Flag to identify
      status: "Pending",
      served: false,
      // Combo details if sub-items
      comboItems: combo.comboItems || [], // If it's a sub-combo
    };
  };

  const handleItemUpdate = (updatedItem) => {
    // FIXED: Preserve ID for updates to prevent duplication (e.g., when size changes)
    if (selectedCartItem && !updatedItem.id) {
      updatedItem = { ...updatedItem, id: selectedCartItem.id };
    }
    // FIXED: Prioritize updating by ID if provided (for edits, preserves status)
    let existingItemIndex = -1;
    if (updatedItem.id && selectedCartItem) {
      existingItemIndex = cartItems.findIndex((cartItem) => cartItem.id === updatedItem.id);
    }
    if (existingItemIndex === -1 && !updatedItem.isCombo) {
      // STRICT MATCHING: Compare Name, Size, Addons, and Sub-Combos
      const menuItem = menuItems.find((item) => item.name === updatedItem.item_name)
      const hasSizeVariant = menuItem?.size?.enabled || false
      const updatedSelectedSize = hasSizeVariant ? updatedItem.variants?.size?.selected : null

      existingItemIndex = cartItems.findIndex(
        (cartItem) =>
          cartItem.item_name === updatedItem.item_name &&
          // Strict Size Match
          (hasSizeVariant ? cartItem.selectedSize === updatedSelectedSize : cartItem.selectedSize === null) &&
          // Strict Addon Match (Keys)
          Object.keys(cartItem.addonQuantities || {}).sort().join(',') === Object.keys(updatedItem.addonQuantities || {}).sort().join(',') &&
          // Strict Combo Match (Keys)
          Object.keys(cartItem.comboQuantities || {}).sort().join(',') === Object.keys(updatedItem.comboQuantities || {}).sort().join(',')
      )
    }
    if (updatedItem.isCombo) {
      const menuItem = comboList.find(c => c.id === updatedItem.id) || updatedItem; // Use combo as menuItem
      const hasOffer = hasActiveOffer(menuItem);
      const finalPrice = hasOffer ? menuItem.offer_price || 0 : menuItem.basePrice || 0; // excl per unit
      const quantity = (updatedItem.isPOSGrid && existingItemIndex !== -1) ? cartItems[existingItemIndex].quantity + (Number(updatedItem.quantity) || 1) : (Number(updatedItem.quantity) || 1);
      // UPDATED: Use effective tax rate for combo
      const effectiveTaxRate = getEffectiveTaxRate(menuItem.tax_applicable, menuItem.tax_rate);
      const exclTotal = finalPrice * quantity;
      const taxTotal = effectiveTaxRate > 0 ? exclTotal * (effectiveTaxRate / 100) : 0;
      const taxBreakdown = taxTotal > 0 ? { [effectiveTaxRate]: taxTotal } : {};
      const mainTaxTotal = taxTotal;
      const mainTaxRate = effectiveTaxRate;
      const cartItem = {
        id: existingItemIndex !== -1 ? cartItems[existingItemIndex].id : uuidv4(),
        name: updatedItem.name,
        item_name: updatedItem.name,
        quantity,
        originalBasePrice: hasOffer ? updatedItem.basePrice || 0 : null,
        basePrice: finalPrice,
        totalPrice: exclTotal + taxTotal, // incl
        exclTotal,
        taxTotal,
        taxBreakdown,
        mainTaxTotal,
        mainTaxRate,
        isCombo: true,
        // FIXED: Set is_combo_offer and offer_description for backend recognition
        is_combo_offer: true,
        offer_description: updatedItem.name,
        comboItems: updatedItem.comboItems,
        kitchen: updatedItem.kitchen || "Main Kitchen",
        status: "Pending",
        served: false,
        image: updatedItem.image,
        kitchenStatuses: existingItemIndex !== -1 ? cartItems[existingItemIndex].kitchenStatuses : {}, // Preserve statuses
      };
      if (existingItemIndex !== -1) {
        setCartItems((prevItems) => {
          const updatedItems = [...prevItems]
          updatedItems[existingItemIndex] = cartItem
          return updatedItems
        })
        setBillCartItems((prevItems) => {
          const updatedItems = [...prevItems]
          updatedItems[existingItemIndex] = cartItem
          return updatedItems
        })
      } else {
        setCartItems((prevItems) => [...prevItems, cartItem])
        setBillCartItems((prevItems) => [...prevItems, cartItem])
      }
      setSelectedItem(null)
      setSelectedCartItem(null)
      return;
    }
    const menuItem = menuItems.find((item) => item.name === updatedItem.item_name)
    const hasSizeVariant = menuItem?.size?.enabled || false
    const updatedSelectedSize = hasSizeVariant ? updatedItem.variants?.size?.selected : null
    const hasOffer = hasActiveOffer(menuItem);
    let originalBasePrice = menuItem.basePrice || 0;
    let finalBasePrice = hasOffer ? menuItem.offer_price || 0 : menuItem.basePrice || 0;
    if (hasSizeVariant) {
      const size = updatedSelectedSize || "M";
      originalBasePrice = size === "S" ? menuItem.size.small_price || 0 : size === "L" ? menuItem.size.large_price || 0 : menuItem.size.medium_price || 0;
      finalBasePrice = hasOffer ? calculateOfferSizePrice(menuItem.offer_price || 0, size) : originalBasePrice;
    }
    // UPDATED: Use effective tax rate for main item
    const effectiveMainTaxRate = getEffectiveTaxRate(menuItem.tax_applicable, menuItem.tax_rate);
    // FIXED: Handle addons and combos without recreation errors
    const addonVariants = {}
    const addonImages = {}
    const addonPrices = {} // excl per unit
    const addonSizePrices = {}
    const addonIcePrices = {}
    const addonSpicyPrices = {}
    const addonCustomVariantsDetails = updatedItem.addonCustomVariantsDetails || {}
    const addonTaxes = {}
    const addonTaxRates = {}
    const addonInclPrices = {} // per unit incl? No, total incl for the addon
    const addonExclTotals = {}
    let addonTaxTotal = 0
    let addonExclTotal = 0 // FIXED: Add sum for excl total
    let taxBreakdown = {}; // FIXED: Initialize early for loops
    Object.keys(updatedItem.addonQuantities || {}).forEach((addonName) => {
      const addon = menuItem?.addons.find((a) => a.name1 === addonName)
      const addonBasePrice = addon?.price || updatedItem.addonPrices?.[addonName] || 0
      const variants = updatedItem.addonVariants?.[addonName] || {}
      const addonSize = variants.size || "M"
      const addonCold = variants.cold || "without_ice"
      const addonSpicy = variants.spicy || false
      const addonSizePrice = addon?.size?.enabled
        ? addonSize === "S"
          ? addon.size.small_price || addonBasePrice - 10 || 0
          : addonSize === "L"
            ? addon.size.large_price || addonBasePrice + 10 || 0
            : addon.size.medium_price || addonBasePrice || 0
        : addonBasePrice || 0
      const addonIcePrice = addon?.cold?.enabled && addonCold === 'with_ice' ? addon.cold.ice_price || 0 : 0
      const addonSpicyPrice = addon?.spicy?.enabled && addonSpicy ? addon.spicy.spicy_price || 30 : 0
      const customVariantsPrice = addonCustomVariantsDetails[addonName]
        ? Object.values(addonCustomVariantsDetails[addonName]).reduce((sum, variant) => sum + (variant.price || 0), 0)
        : 0
      const exclPerUnit = addonSizePrice + addonIcePrice + addonSpicyPrice + customVariantsPrice
      const qty = Number(updatedItem.addonQuantities[addonName]) || 1
      const exclTotal = exclPerUnit * qty
      // UPDATED: Use effective tax rate for addon
      const effectiveAddonTaxRate = getEffectiveTaxRate(addon?.tax_applicable, addon?.tax_rate, true);
      const tax = effectiveAddonTaxRate > 0 ? exclTotal * (effectiveAddonTaxRate / 100) : 0
      addonTaxTotal += tax
      addonExclTotal += exclTotal // FIXED: Sum excl
      addonTaxes[addonName] = tax
      addonTaxRates[addonName] = effectiveAddonTaxRate
      addonInclPrices[addonName] = exclTotal + tax
      addonExclTotals[addonName] = exclTotal
      addonVariants[addonName] = {
        ...variants,
        size: addonSize,
        cold: addonCold,
        spicy: addonSpicy,
        kitchen: addon?.kitchen || "Main Kitchen",
        sugar: variants.sugar || "medium",
      }
      addonImages[addonName] = addon?.addon_image || addon?.image || "/static/images/default-addon-image.jpg"
      addonPrices[addonName] = exclPerUnit // per unit excl
      addonSizePrices[addonName] = addonSizePrice
      addonIcePrices[addonName] = addonIcePrice
      addonSpicyPrices[addonName] = addonSpicyPrice
      if (tax > 0) {
        taxBreakdown[effectiveAddonTaxRate] = (taxBreakdown[effectiveAddonTaxRate] || 0) + tax;
      }
    })
    const comboVariants = {}
    const comboImages = {}
    const comboPrices = {} // excl per unit
    const comboSizePrices = {}
    const comboIcePrices = {}
    const comboSpicyPrices = {}
    const comboCustomVariantsDetails = updatedItem.comboCustomVariantsDetails || {}
    const comboTaxes = {}
    const comboTaxRates = {}
    const comboInclPrices = {}
    const comboExclTotals = {}
    let comboTaxTotal = 0
    let comboExclTotal = 0 // FIXED: Add sum for excl total
    Object.keys(updatedItem.comboQuantities || {}).forEach((comboName) => {
      const combo = menuItem?.combos.find((c) => c.name1 === comboName)
      const comboBasePrice = combo?.price || updatedItem.comboPrices?.[comboName] || 0
      const variants = updatedItem.comboVariants?.[comboName] || {}
      const comboSize = variants.size || "M"
      const comboCold = variants.cold || "without_ice"
      const comboSpicy = variants.spicy || false
      const comboSizePrice = combo?.size?.enabled
        ? comboSize === "S"
          ? combo.size.small_price || comboBasePrice - 10 || 0
          : comboSize === "L"
            ? combo.size.large_price || comboBasePrice + 10 || 0
            : combo.size.medium_price || comboBasePrice || 0
        : comboBasePrice || 0
      const comboIcePrice = combo?.cold?.enabled && comboCold === 'with_ice' ? combo.cold.ice_price || 0 : 0
      const comboSpicyPrice = combo?.spicy?.enabled && comboSpicy ? combo.spicy.spicy_price || 30 : 0
      const customVariantsPrice = comboCustomVariantsDetails[comboName]
        ? Object.values(comboCustomVariantsDetails[comboName]).reduce((sum, variant) => sum + (variant.price || 0), 0)
        : 0
      const exclPerUnit = comboSizePrice + comboIcePrice + comboSpicyPrice + customVariantsPrice
      const qty = Number(updatedItem.comboQuantities[comboName]) || 1
      const exclTotal = exclPerUnit * qty
      // UPDATED: Use effective tax rate for combo
      const effectiveComboTaxRate = getEffectiveTaxRate(combo?.tax_applicable, combo?.tax_rate, false, true);
      const tax = effectiveComboTaxRate > 0 ? exclTotal * (effectiveComboTaxRate / 100) : 0
      comboTaxTotal += tax
      comboExclTotal += exclTotal // FIXED: Sum excl
      comboTaxes[comboName] = tax
      comboTaxRates[comboName] = effectiveComboTaxRate
      comboInclPrices[comboName] = exclTotal + tax
      comboExclTotals[comboName] = exclTotal
      comboVariants[comboName] = {
        ...variants,
        size: comboSize,
        cold: comboCold,
        spicy: comboSpicy,
        kitchen: combo?.kitchen || "Main Kitchen",
        sugar: variants.sugar || "medium",
      }
      comboImages[comboName] = combo?.combo_image || combo?.image || "/static/images/default-combo-image.jpg"
      comboPrices[comboName] = exclPerUnit // per unit excl
      comboSizePrices[comboName] = comboSizePrice
      comboIcePrices[comboName] = comboIcePrice
      comboSpicyPrices[comboName] = comboSpicyPrice
      if (tax > 0) {
        taxBreakdown[effectiveComboTaxRate] = (taxBreakdown[effectiveComboTaxRate] || 0) + tax;
      }
    })
    const customVariantsDetails = {}
    const customVariantsQuantities = {}
    let customVariantsTotalPrice = 0 // per unit
    if (updatedItem.selectedCustomVariants && menuItem?.custom_variants) {
      menuItem.custom_variants.forEach((variant) => {
        if (variant.enabled) {
          variant.subheadings.forEach((sub) => {
            if (updatedItem.selectedCustomVariants[sub.name]) {
              customVariantsDetails[sub.name] = { name: sub.name, price: sub.price || 0, heading: variant.heading }
              customVariantsQuantities[sub.name] = Number(updatedItem.customVariantsQuantities?.[sub.name]) || 1 // FIXED: Explicit Number() || 1
              customVariantsTotalPrice += (sub.price || 0) * (Number(updatedItem.customVariantsQuantities?.[sub.name]) || 1)
            }
          })
        }
      })
    }
    const quantity = (updatedItem.isPOSGrid && existingItemIndex !== -1) ? cartItems[existingItemIndex].quantity + (Number(updatedItem.quantity) || 1) : (Number(updatedItem.quantity) || 1);
    const mainExclPerUnit = finalBasePrice + (Number(updatedItem.icePrice) || 0) + (Number(updatedItem.spicyPrice) || 0) + customVariantsTotalPrice
    const mainExclTotal = mainExclPerUnit * quantity
    const mainTaxTotal = effectiveMainTaxRate > 0 ? mainExclTotal * (effectiveMainTaxRate / 100) : 0
    const mainTaxRate = effectiveMainTaxRate
    if (mainTaxTotal > 0) {
      taxBreakdown[effectiveMainTaxRate] = (taxBreakdown[effectiveMainTaxRate] || 0) + mainTaxTotal; // FIXED: Add to existing
    }
    // FIXED: Remove invalid merge, as we're building taxBreakdown incrementally
    const totalExcl = mainExclTotal + addonExclTotal + comboExclTotal
    const totalTax = mainTaxTotal + addonTaxTotal + comboTaxTotal
    const cartItem = {
      ...updatedItem,
      id: existingItemIndex !== -1 ? cartItems[existingItemIndex].id : uuidv4(),
      name: updatedItem.item_name || "Unnamed Item",
      item_name: updatedItem.item_name,
      quantity,
      originalBasePrice: hasOffer ? originalBasePrice : null,
      basePrice: finalBasePrice,
      icePrice: Number(updatedItem.icePrice) || 0, // FIXED: Explicit Number()
      spicyPrice: Number(updatedItem.spicyPrice) || 0, // FIXED: Explicit Number()
      totalPrice: totalExcl + totalTax, // incl
      exclTotal: totalExcl,
      taxTotal: totalTax,
      taxBreakdown,
      mainTaxTotal,
      mainTaxRate,
      mainExclPerUnit, // FIXED: Store per unit for scaling
      addonExclTotal, // FIXED: Store totals for scaling
      comboExclTotal, // FIXED: Store totals for scaling
      addonTaxes,
      addonTaxRates,
      addonInclPrices,
      comboTaxes,
      comboTaxRates,
      comboInclPrices,
      addonQuantities: updatedItem.addonQuantities || {},
      addonVariants,
      addonPrices,
      addonSizePrices,
      addonIcePrices,
      addonSpicyPrices,
      addonImages,
      comboQuantities: updatedItem.comboQuantities || {},
      comboVariants,
      comboPrices,
      comboSizePrices,
      comboIcePrices,
      comboSpicyPrices,
      comboImages,
      selectedCombos: updatedItem.selectedCombos || [],
      selectedSize: updatedSelectedSize,
      icePreference: updatedItem.variants?.cold?.icePreference || "without_ice",
      isSpicy: updatedItem.variants?.spicy?.isSpicy || false,
      sugarLevel: updatedItem.variants?.sugar?.level || menuItem?.sugar?.level || "medium",
      kitchen: updatedItem.kitchen || "Main Kitchen",
      ingredients: updatedItem.ingredients || [],
      selectedCustomVariants: updatedItem.selectedCustomVariants || {},
      customVariantsDetails,
      customVariantsQuantities,
      status: "Pending",
      served: false,
      image: menuItem?.image || "/static/images/default-item.jpg",
      kitchenStatuses: existingItemIndex !== -1 ? cartItems[existingItemIndex].kitchenStatuses : {}, // FIXED: Preserve statuses on update
      kitchenNotes: updatedItem.kitchenNotes || {},
    }
    if (existingItemIndex !== -1) {
      setCartItems((prevItems) => {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = cartItem
        return updatedItems
      })
      setBillCartItems((prevItems) => {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = cartItem
        return updatedItems
      })
    } else {
      setCartItems((prevItems) => [...prevItems, cartItem])
      setBillCartItems((prevItems) => [...prevItems, cartItem])
    }
    setSelectedItem(null)
    setSelectedCartItem(null)
  }
  const handleQuantityChange = (itemId, value, type, name) => {
    const newQty = Math.max(1, Number.parseInt(value) || 1)
    const updateItems = (prevItems) =>
      prevItems.map((cartItem) => {
        if (cartItem.id === itemId) {
          let updatedItem = { ...cartItem }
          if (cartItem.isCombo) {
            const exclPerUnit = cartItem.basePrice || 0
            const exclTotal = exclPerUnit * newQty
            const taxTotal = cartItem.tax_applicable ? exclTotal * (cartItem.tax_rate / 100) : 0
            updatedItem = {
              ...updatedItem,
              quantity: newQty,
              exclTotal,
              taxTotal,
              totalPrice: exclTotal + taxTotal,
              mainTaxTotal: taxTotal,
            }
            return updatedItem;
          }
          if (type === "item") {
            // FIXED: Use stored mainExclPerUnit for scaling
            const mainExclPerUnit = updatedItem.mainExclPerUnit || 0
            const mainExclTotalNew = mainExclPerUnit * newQty
            const mainTaxTotalNew = updatedItem.mainTaxRate > 0 ? mainExclTotalNew * (updatedItem.mainTaxRate / 100) : 0
            const deltaMainExcl = mainExclTotalNew - (updatedItem.mainExclTotal || 0)
            const deltaMainTax = mainTaxTotalNew - (updatedItem.mainTaxTotal || 0)
            updatedItem = {
              ...updatedItem,
              quantity: newQty,
              mainExclTotal: mainExclTotalNew,
              mainTaxTotal: mainTaxTotalNew,
              exclTotal: (updatedItem.exclTotal || 0) + deltaMainExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaMainTax,
              totalPrice: updatedItem.totalPrice + deltaMainExcl + deltaMainTax,
            }
          } else if (type === "addon" && name) {
            // Recalculate for this addon
            const addon = menuItems.find(m => m.addons.some(a => a.name1 === name))?.addons.find(a => a.name1 === name)
            const oldQty = Number(updatedItem.addonQuantities[name]) || 1
            const exclPerUnit = updatedItem.addonPrices[name] || 0
            const oldExcl = exclPerUnit * oldQty
            const oldTax = updatedItem.addonTaxes[name] || 0
            const newExcl = exclPerUnit * newQty
            // UPDATED: Use effective tax rate for addon
            const effectiveAddonTaxRate = getEffectiveTaxRate(addon?.tax_applicable, addon?.tax_rate, true);
            const newTax = effectiveAddonTaxRate > 0 ? newExcl * (effectiveAddonTaxRate / 100) : 0
            const deltaExcl = newExcl - oldExcl
            const deltaTax = newTax - oldTax
            updatedItem = {
              ...updatedItem,
              addonQuantities: { ...updatedItem.addonQuantities, [name]: newQty },
              addonTaxes: { ...updatedItem.addonTaxes, [name]: newTax },
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: updatedItem.totalPrice + deltaExcl + deltaTax,
            }
          } else if (type === "combo" && name) {
            // Similar for combo
            const combo = menuItems.find(m => m.combos.some(c => c.name1 === name))?.combos.find(c => c.name1 === name)
            const oldQty = Number(updatedItem.comboQuantities[name]) || 1
            const exclPerUnit = updatedItem.comboPrices[name] || 0
            const oldExcl = exclPerUnit * oldQty
            const oldTax = updatedItem.comboTaxes[name] || 0
            const newExcl = exclPerUnit * newQty
            // UPDATED: Use effective tax rate for combo
            const effectiveComboTaxRate = getEffectiveTaxRate(combo?.tax_applicable, combo?.tax_rate, false, true);
            const newTax = effectiveComboTaxRate > 0 ? newExcl * (effectiveComboTaxRate / 100) : 0
            const deltaExcl = newExcl - oldExcl
            const deltaTax = newTax - oldTax
            updatedItem = {
              ...updatedItem,
              comboQuantities: { ...updatedItem.comboQuantities, [name]: newQty },
              comboTaxes: { ...updatedItem.comboTaxes, [name]: newTax },
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: updatedItem.totalPrice + deltaExcl + deltaTax,
            }
          } else if (type === "customVariant" && name) {
            // Recalculate custom total
            const customVariantsTotalPrice = Object.entries(updatedItem.customVariantsDetails || {}).reduce(
              (sum, [variantName, variant]) =>
                sum +
                (variant.price || 0) *
                (variantName === name ? newQty : updatedItem.customVariantsQuantities?.[variantName] || 1),
              0,
            )
            const mainExclPerUnitNew = (updatedItem.basePrice || 0) + (updatedItem.icePrice || 0) + (updatedItem.spicyPrice || 0) + customVariantsTotalPrice
            const mainExclTotalNew = mainExclPerUnitNew * updatedItem.quantity
            const mainTaxTotalNew = updatedItem.mainTaxRate > 0 ? mainExclTotalNew * (updatedItem.mainTaxRate / 100) : 0
            const deltaMainExcl = mainExclTotalNew - (updatedItem.mainExclTotal || 0)
            const deltaMainTax = mainTaxTotalNew - (updatedItem.mainTaxTotal || 0)
            updatedItem = {
              ...updatedItem,
              customVariantsQuantities: { ...updatedItem.customVariantsQuantities, [name]: newQty },
              mainExclTotal: mainExclTotalNew,
              mainTaxTotal: mainTaxTotalNew,
              exclTotal: (updatedItem.exclTotal || 0) + deltaMainExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaMainTax,
              totalPrice: updatedItem.totalPrice + deltaMainExcl + deltaMainTax,
            }
          }
          return updatedItem
        }
        return cartItem
      })
    setCartItems(updateItems)
    setBillCartItems(updateItems)
  }
  const getAddonsTotal = (item) => {
    if (!item.addonQuantities || !item.addonPrices) return 0
    return Object.entries(item.addonQuantities).reduce((sum, [addonName, qty]) => {
      const price = item.addonPrices[addonName] || 0
      return sum + price * (Number(qty) || 1) // FIXED: Explicit Number() || 1
    }, 0)
  }
  const getCombosTotal = (item) => {
    if (!item.comboQuantities || !item.comboPrices) return 0
    return Object.entries(item.comboQuantities).reduce((sum, [comboName, qty]) => {
      const price = item.comboPrices[comboName] || 0
      return sum + price * (Number(qty) || 1) // FIXED: Explicit Number() || 1
    }, 0)
  }
  const getCustomVariantsTotal = (item) => {
    if (!item.customVariantsDetails || !item.customVariantsQuantities) return 0
    return Object.entries(item.customVariantsDetails).reduce((sum, [variantName, variant]) => {
      const qty = Number(item.customVariantsQuantities[variantName]) || 1 // FIXED: Explicit Number() || 1
      return sum + (variant.price || 0) * qty
    }, 0)
  }
  const getMainItemTotal = (item) => {
    if (item.isCombo) {
      return (item.basePrice || 0) * (Number(item.quantity) || 1) // FIXED: Explicit Number()
    }
    const mainItemPrice = (item.basePrice || 0) + (item.icePrice || 0) + (item.spicyPrice || 0) + getCustomVariantsTotal(item)
    return mainItemPrice * (Number(item.quantity) || 1) // FIXED: Explicit Number()
  }
  const getOriginalMainItemTotal = (item) => {
    if (item.originalBasePrice) {
      const mainItemPrice = (item.originalBasePrice || 0) + (item.icePrice || 0) + (item.spicyPrice || 0) + getCustomVariantsTotal(item)
      return mainItemPrice * (Number(item.quantity) || 1) // FIXED: Explicit Number()
    }
    return getMainItemTotal(item)
  }
  // UPDATED: Excl total calculation
  const calculateExclTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.exclTotal || 0), 0)
  }
  // UPDATED: Tax total calculation
  const calculateTaxTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.taxTotal || 0), 0)
  }
  // UPDATED: VAT by rate
  const getVatByRate = (items) => {
    const byRate = {};
    items.forEach(item => {
      if (item.taxBreakdown) {
        Object.entries(item.taxBreakdown).forEach(([rate, amt]) => {
          byRate[rate] = (byRate[rate] || 0) + amt;
        });
      }
    });
    return byRate;
  }
  const removeFromCart = (item) => {
    setCartItems((prevItems) => prevItems.filter((cartItem) => cartItem.id !== item.id))
    setBillCartItems((prevItems) => prevItems.filter((cartItem) => cartItem.id !== item.id))
  }
  const removeAddonOrCombo = (itemId, type, name) => {
    const updateItems = (prevItems) =>
      prevItems.map((cartItem) => {
        if (cartItem.id === itemId) {
          let updatedItem = { ...cartItem }
          if (type === "addon") {
            const oldQty = Number(updatedItem.addonQuantities[name]) || 1
            const exclPerUnit = updatedItem.addonPrices[name] || 0
            const oldExcl = exclPerUnit * oldQty
            const oldTax = updatedItem.addonTaxes[name] || 0
            const { [name]: _, ...remainingAddons } = updatedItem.addonQuantities || {}
            const { [name]: __, ...remainingAddonVariants } = updatedItem.addonVariants || {}
            const { [name]: ___, ...remainingAddonPrices } = updatedItem.addonPrices || {}
            const { [name]: ____, ...remainingAddonImages } = updatedItem.addonImages || {}
            const { [name]: _____, ...remainingAddonSizePrices } = updatedItem.addonSizePrices || {}
            const { [name]: ______, ...remainingAddonIcePrices } = updatedItem.addonIcePrices || {}
            const { [name]: _______, ...remainingAddonSpicyPrices } = updatedItem.addonSpicyPrices || {}
            const { [name]: ________, ...remainingAddonTaxes } = updatedItem.addonTaxes || {}
            const { [name]: _________, ...remainingAddonTaxRates } = updatedItem.addonTaxRates || {}
            const { [name]: __________, ...remainingAddonInclPrices } = updatedItem.addonInclPrices || {}
            updatedItem = {
              ...updatedItem,
              addonQuantities: remainingAddons,
              addonVariants: remainingAddonVariants,
              addonPrices: remainingAddonPrices,
              addonSizePrices: remainingAddonSizePrices,
              addonIcePrices: remainingAddonIcePrices,
              addonSpicyPrices: remainingAddonSpicyPrices,
              addonImages: remainingAddonImages,
              addonTaxes: remainingAddonTaxes,
              addonTaxRates: remainingAddonTaxRates,
              addonInclPrices: remainingAddonInclPrices,
              addonCustomVariantsDetails: { ...updatedItem.addonCustomVariantsDetails, [name]: {} },
              exclTotal: updatedItem.exclTotal - oldExcl,
              taxTotal: updatedItem.taxTotal - oldTax,
              totalPrice: updatedItem.totalPrice - oldExcl - oldTax,
            }
          } else if (type === "combo") {
            const oldQty = Number(updatedItem.comboQuantities[name]) || 1
            const exclPerUnit = updatedItem.comboPrices[name] || 0
            const oldExcl = exclPerUnit * oldQty
            const oldTax = updatedItem.comboTaxes[name] || 0
            const { [name]: _, ...remainingCombos } = updatedItem.comboQuantities || {}
            const { [name]: __, ...remainingComboVariants } = updatedItem.comboVariants || {}
            const { [name]: ___, ...remainingComboPrices } = updatedItem.comboPrices || {}
            const { [name]: ____, ...remainingComboImages } = updatedItem.comboImages || {}
            const { [name]: _____, ...remainingComboSizePrices } = updatedItem.comboSizePrices || {}
            const { [name]: ______, ...remainingComboIcePrices } = updatedItem.comboIcePrices || {}
            const { [name]: _______, ...remainingComboSpicyPrices } = updatedItem.comboSpicyPrices || {}
            const { [name]: ________, ...remainingComboTaxes } = updatedItem.comboTaxes || {}
            const { [name]: _________, ...remainingComboTaxRates } = updatedItem.comboTaxRates || {}
            const { [name]: __________, ...remainingComboInclPrices } = updatedItem.comboInclPrices || {}
            updatedItem = {
              ...updatedItem,
              comboQuantities: remainingCombos,
              comboVariants: remainingComboVariants,
              comboPrices: remainingComboPrices,
              comboSizePrices: remainingComboSizePrices,
              comboIcePrices: remainingComboIcePrices,
              comboSpicyPrices: remainingComboSpicyPrices,
              comboImages: remainingComboImages,
              comboTaxes: remainingComboTaxes,
              comboTaxRates: remainingComboTaxRates,
              comboInclPrices: remainingComboInclPrices,
              selectedCombos: updatedItem.selectedCombos.filter((combo) => combo.name1 !== name),
              comboCustomVariantsDetails: { ...updatedItem.comboCustomVariantsDetails, [name]: {} },
              exclTotal: updatedItem.exclTotal - oldExcl,
              taxTotal: updatedItem.taxTotal - oldTax,
              totalPrice: updatedItem.totalPrice - oldExcl - oldTax,
            }
          }
          return updatedItem
        }
        return cartItem
      })
    setCartItems(updateItems)
    setBillCartItems(updateItems)
  }
  const removeCustomVariant = (itemId, variantName) => {
    const updateItems = (prevItems) =>
      prevItems.map((cartItem) => {
        if (cartItem.id === itemId) {
          const { [variantName]: _, ...remainingCustomVariants } = cartItem.selectedCustomVariants || {}
          const { [variantName]: __, ...remainingCustomVariantsDetails } = cartItem.customVariantsDetails || {}
          const { [variantName]: ___, ...remainingCustomVariantsQuantities } = cartItem.customVariantsQuantities || {}
          const customVariantsTotalPrice = Object.entries(remainingCustomVariantsDetails).reduce(
            (sum, [vName, variant]) => sum + (variant.price || 0) * (remainingCustomVariantsQuantities[vName] || 1),
            0,
          )
          const mainExclPerUnitNew = (cartItem.basePrice || 0) + (cartItem.icePrice || 0) + (cartItem.spicyPrice || 0) + customVariantsTotalPrice
          const mainExclTotalNew = mainExclPerUnitNew * cartItem.quantity
          const mainTaxTotalNew = cartItem.mainTaxRate > 0 ? mainExclTotalNew * (cartItem.mainTaxRate / 100) : 0
          const deltaMainExcl = mainExclTotalNew - cartItem.mainExclTotal
          const deltaMainTax = mainTaxTotalNew - cartItem.mainTaxTotal
          return {
            ...cartItem,
            selectedCustomVariants: remainingCustomVariants,
            customVariantsDetails: remainingCustomVariantsDetails,
            customVariantsQuantities: remainingCustomVariantsQuantities,
            mainExclTotal: mainExclTotalNew,
            mainTaxTotal: mainTaxTotalNew,
            exclTotal: cartItem.exclTotal + deltaMainExcl,
            taxTotal: cartItem.taxTotal + deltaMainTax,
            totalPrice: cartItem.totalPrice + deltaMainExcl + deltaMainTax,
          }
        }
        return cartItem
      })
    setCartItems(updateItems)
    setBillCartItems(updateItems)
  }
  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
    setWarningMessage("")
    setWarningType("warning")
  }
  const handleConfirmYes = () => {
    setShowPaymentModal(true)
    setIsConfirmation(false)
  }
  const handleConfirmNo = () => {
    setCartItems([])
    setBillCartItems([])
    if (orderType === "Dine In") {
      navigate("/table")
    }
    setIsConfirmation(false)
  }
  // UPDATED: Use excl total for subtotal
  const calculateSubtotal = (items) => calculateExclTotal(items)
  const calculateOriginalSubtotal = (items) => {
    return items.reduce((sum, item) => {
      let mainItemPrice = (Number(item.basePrice) || 0) + (Number(item.icePrice) || 0) + (Number(item.spicyPrice) || 0) + getCustomVariantsTotal(item) // FIXED: Explicit Number()
      if (item.originalBasePrice) {
        mainItemPrice = (Number(item.originalBasePrice) || 0) + (Number(item.icePrice) || 0) + (Number(item.spicyPrice) || 0) + getCustomVariantsTotal(item) // FIXED: Explicit Number()
      }
      const mainItemTotal = mainItemPrice * (Number(item.quantity) || 1) // FIXED: Explicit Number()
      const addonsTotal = getAddonsTotal(item)
      const combosTotal = getCombosTotal(item)
      return sum + mainItemTotal + addonsTotal + combosTotal
    }, 0)
  }
  const handlePaymentSelection = async (method) => {
    if (billCartItems.length === 0) {
      setWarningMessage("Cart is empty. Please add items before proceeding.")
      setWarningType("warning")
      return
    }
    if (user.email === "Guest") {
      setWarningMessage("Please log in to save the sale.")
      setWarningType("warning")
      return
    }
    const subtotal = calculateExclTotal(billCartItems)
    const totalVat = calculateTaxTotal(billCartItems)
    const grandTotal = subtotal + totalVat
    if (isNaN(grandTotal) || grandTotal === 0) {
      setWarningMessage("Invalid total amount. Please check your cart items.")
      setWarningType("warning")
      return
    }
    const paymentDetails = {
      mode_of_payment: method,
      amount: Number(grandTotal.toFixed(2)),
    }
    const { chairsBooked } = location.state || {}
    const billDetails = {
      customer: customerName.trim() || "N/A",
      phoneNumber: phoneNumber ? `${selectedISDCode}${phoneNumber}` : "N/A",
      whatsappNumber: whatsappNumber ? `${whatsappISDCode}${whatsappNumber}` : "N/A", // UPDATED: Use full WhatsApp with code
      tableNumber: tableNumber || "N/A",
      chairsBooked: chairsBooked,
      deliveryAddress: deliveryAddress,
      email: email || "N/A",
      items: billCartItems.map((item) => ({
        item_name: item.item_name || item.name,
        basePrice: Number(item.basePrice) || 0,
        originalBasePrice: item.originalBasePrice || null,
        icePreference: item.icePreference,
        ice_price: Number(item.icePrice) || 0,
        isSpicy: item.isSpicy,
        spicy_price: Number(item.spicyPrice) || 0,
        quantity: Number(item.quantity) || 1,
        amount: Number((item.totalPrice || 0).toFixed(2)) || 0, // incl
        tax_amount: Number(item.taxTotal || 0), // UPDATED: Add tax amount
        excl_amount: Number(item.exclTotal || 0), // UPDATED: Add excl for backend if needed
        addons: Object.entries(item.addonQuantities || {}).map(([addonName, qty]) => ({
          name1: addonName,
          addon_image: item.addonImages?.[addonName] || "/static/images/default-addon-image.jpg",
          addon_size_price: Number(item.addonSizePrices?.[addonName] || 0),
          addon_ice_price: Number(item.addonIcePrices?.[addonName] || 0),
          addon_spicy_price: Number(item.addonSpicyPrices?.[addonName] || 0),
          addon_price: Number(item.addonPrices?.[addonName] || item.addonVariants?.[addonName]?.price || 0),
          addon_quantity: Number(qty) || 1, // FIXED: Explicit Number() || 1
          tax_amount: Number(item.addonTaxes?.[addonName] || 0), // UPDATED: Add tax for addon
          size: item.addonVariants?.[addonName]?.size || "M",
          cold: item.addonVariants?.[addonName]?.cold || "without_ice",
          isSpicy: item.addonVariants?.[addonName]?.spicy || false,
          kitchen: item.addonVariants?.[addonName]?.kitchen || "Main Kitchen",
          sugar: item.addonVariants?.[addonName]?.sugar || "medium",
          custom_variants: item.addonCustomVariantsDetails?.[addonName] || {},
        })),
        selectedCombos: Object.entries(item.comboQuantities || {}).map(([comboName, qty]) => ({
          name1: comboName,
          combo_image: item.comboImages?.[comboName] || "/static/images/default-combo-image.jpg",
          combo_size_price: Number(item.comboSizePrices?.[comboName] || 0),
          combo_ice_price: Number(item.comboIcePrices?.[comboName] || 0),
          combo_spicy_price: Number(item.comboSpicyPrices?.[comboName] || 0),
          combo_price: Number(item.comboPrices?.[comboName] || item.comboVariants?.[comboName]?.price || 0),
          size: item.comboVariants?.[comboName]?.size || "M",
          cold: item.comboVariants?.[comboName]?.cold || "without_ice",
          isSpicy: item.comboVariants?.[comboName]?.spicy || false,
          kitchen: item.comboVariants?.[comboName]?.kitchen || "Main Kitchen",
          sugar: item.comboVariants?.[comboName]?.sugar || "medium",
          combo_quantity: Number(qty) || 1, // FIXED: Explicit Number() || 1
          tax_amount: Number(item.comboTaxes?.[comboName] || 0), // UPDATED: Add tax for combo
          custom_variants: item.comboCustomVariantsDetails?.[comboName] || {},
        })),
        kitchen: item.kitchen,
        selectedSize: item.selectedSize || null,
        ingredients: item.ingredients || [],
        selectedCustomVariants: item.selectedCustomVariants || {},
        customVariantsDetails: item.customVariantsDetails || {},
        customVariantsQuantities: item.customVariantsQuantities || {},
        image: item.image || "/static/images/default-item.jpg",
        // FIXED: Preserve is_combo_offer and offer_description for backend
        is_combo_offer: item.is_combo_offer || false,
        offer_description: item.offer_description || null,
        kitchenStatuses: item.kitchenStatuses || {},
      })),
      subtotal: Number(subtotal.toFixed(2)),
      vat_amount: Number(totalVat.toFixed(2)), // UPDATED: Add total VAT
      totalAmount: Number(grandTotal.toFixed(2)), // UPDATED: Grand total incl VAT
      payments: [paymentDetails],
      invoice_no: `INV-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    try {
      const savedSale = await handleSaveToBackend(paymentDetails)
      if (savedSale) {
        billDetails.invoice_no = savedSale.invoice_no
      }
      // FIXED: Use dynamic baseUrl for order update
      if (orderId) {
        try {
          const apiPath = baseUrl ? `${baseUrl}/api/activeorders/${orderId}` : `/api/activeorders/${orderId}`;
          await axios.put(apiPath, { paid: true });
          console.log("Order updated with paid status");
        } catch (error) {
          console.error("Error updating order paid status:", error);
        }
      }
      if (orderType === "Takeaway") {
        setWarningMessage("Payment completed. Takeaway order processed successfully!")
        setWarningType("success")
        setPendingAction(() => () => {
          setCartItems([])
          setBillCartItems([])
          setShowPaymentModal(false)
          setOrderId(null)
        })
      } else if (method === "CASH") {
        setWarningMessage("Payment completed. Redirecting to cash payment page...")
        setWarningType("success")
        setPendingAction(() => () => {
          navigate("/cash", { state: { billDetails } })
          handlePaymentCompletion(tableNumber, chairsBooked)
          setOrderId(null)
        })
      } else if (method === "CARD") {
        setWarningMessage("Payment completed. Redirecting to card payment page...")
        setWarningType("success")
        setPendingAction(() => () => {
          navigate("/card", { state: { billDetails } })
          handlePaymentCompletion(tableNumber, chairsBooked)
          setOrderId(null)
        })
      } else if (method === "UPI") {
        setWarningMessage("Redirecting to UPI payment... Please complete the payment in your UPI app.")
        setWarningType("warning")
        setPendingAction(() => () => {
          navigate("/upi", { state: { billDetails } })
          handlePaymentCompletion(tableNumber, chairsBooked)
          setOrderId(null)
        })
      }
      setShowPaymentModal(false)
    } catch (error) {
      console.error("Error processing payment:", error)
      setWarningMessage(`Failed to process payment: ${error.message}`)
      setWarningType("warning")
    }
  }
  const handlePaymentCompletion = (tableNumber, chairsBooked) => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const order = savedOrders.find(o => o.tableNumber === tableNumber && o.chairsBooked.some(c => chairsBooked.includes(c)));
    if (order) {
      order.paid = true;
      localStorage.setItem("savedOrders", JSON.stringify(savedOrders));
      setCartItems([]);
      setBillCartItems([]);
      setWarningMessage(
        `Payment for Table ${tableNumber}, Chairs ${chairsBooked.join(", ")} completed.`
      );
      setWarningType("success");
      setPendingAction(() => () => navigate("/table"));
    }
  }
  // UPDATED: handleSaveToBackend - NEW: Include posOpeningEntry from localStorage, use grand total
  const handleSaveToBackend = async (paymentDetails) => {
    if (billCartItems.length === 0) {
      setWarningMessage("Cart is empty. Please add items before saving.")
      setWarningType("warning")
      throw new Error("Cart is empty")
    }
    if (user.email === "Guest") {
      setWarningMessage("Please log in to save the sale.")
      setWarningType("warning")
      throw new Error("User not logged in")
    }
    const validItems = billCartItems.filter((item) => (Number(item.quantity) || 1) > 0) // FIXED: Explicit Number()
    if (validItems.length !== billCartItems.length) {
      setWarningMessage("All items must have a quantity greater than zero.")
      setWarningType("warning")
      throw new Error("Invalid item quantities")
    }
    const subtotal = calculateExclTotal(billCartItems)
    const totalVat = calculateTaxTotal(billCartItems)
    const grandTotal = subtotal + totalVat
    // NEW: Get posOpeningEntry from localStorage (set in OpeningEntryWithNavbar.jsx)
    const posOpeningEntry = localStorage.getItem('posOpeningEntry') || '';
    console.log('Including posOpeningEntry in sales payload:', posOpeningEntry); // Debug log
    const payload = {
      customer: customerName.trim() || "N/A",
      phoneNumber: phoneNumber ? `${selectedISDCode}${phoneNumber}` : "N/A",
      whatsappNumber: whatsappNumber ? `${whatsappISDCode}${whatsappNumber}` : "N/A", // UPDATED: Full WhatsApp with code
      tableNumber: tableNumber || "N/A",
      chairsBooked: chairsBooked,
      deliveryAddress: deliveryAddress,
      email: email || "N/A",
      items: validItems.map((item) => {
        // NEW: Log item for debugging (remove in prod)
        console.log(`Payload item: ${item.item_name}, quantity: ${item.quantity}, addons:`, item.addonQuantities, 'combos:', item.comboQuantities);
        return ({
          item_name: item.item_name || item.name || "Unnamed Item",
          basePrice: Number(item.basePrice) || 0,
          originalBasePrice: item.originalBasePrice || null,
          icePreference: item.icePreference,
          ice_price: Number(item.icePrice) || 0,
          isSpicy: item.isSpicy,
          spicy_price: Number(item.spicyPrice) || 0,
          quantity: Number(item.quantity) || 1,
          amount: Number(item.totalPrice.toFixed(2)) || 0, // incl
          tax_amount: Number(item.taxTotal || 0), // UPDATED
          excl_amount: Number(item.exclTotal || 0), // UPDATED
          addons: Object.entries(item.addonQuantities || {}).map(([addonName, qty]) => ({
            name1: addonName,
            addon_image: item.addonImages?.[addonName] || "/static/images/default-addon-image.jpg",
            addon_size_price: Number(item.addonSizePrices?.[addonName] || 0),
            addon_ice_price: Number(item.addonIcePrices?.[addonName] || 0),
            addon_spicy_price: Number(item.addonSpicyPrices?.[addonName] || 0),
            addon_price: Number(item.addonPrices?.[addonName] || item.addonVariants?.[addonName]?.price || 0),
            addon_quantity: Number(qty) || 1, // FIXED: Explicit Number() || 1
            tax_amount: Number(item.addonTaxes?.[addonName] || 0), // UPDATED
            size: item.addonVariants?.[addonName]?.size || "M",
            cold: item.addonVariants?.[addonName]?.cold || "without_ice",
            isSpicy: item.addonVariants?.[addonName]?.spicy || false,
            kitchen: item.addonVariants?.[addonName]?.kitchen || "Main Kitchen",
            sugar: item.addonVariants?.[addonName]?.sugar || "medium",
            custom_variants: item.addonCustomVariantsDetails?.[addonName] || {},
          })),
          selectedCombos: Object.entries(item.comboQuantities || {}).map(([comboName, qty]) => ({
            name1: comboName,
            combo_image: item.comboImages?.[comboName] || "/static/images/default-combo-image.jpg",
            combo_size_price: Number(item.comboSizePrices?.[comboName] || 0),
            combo_ice_price: Number(item.comboIcePrices?.[comboName] || 0),
            combo_spicy_price: Number(item.comboSpicyPrices?.[comboName] || 0),
            combo_price: Number(item.comboPrices?.[comboName] || item.comboVariants?.[comboName]?.price || 0),
            size: item.comboVariants?.[comboName]?.size || "M",
            cold: item.comboVariants?.[comboName]?.cold || "without_ice",
            isSpicy: item.comboVariants?.[comboName]?.spicy || false,
            kitchen: item.comboVariants?.[comboName]?.kitchen || "Main Kitchen",
            sugar: item.comboVariants?.[comboName]?.sugar || "medium",
            combo_quantity: Number(qty) || 1, // FIXED: Explicit Number() || 1
            tax_amount: Number(item.comboTaxes?.[comboName] || 0), // UPDATED
            custom_variants: item.comboCustomVariantsDetails?.[comboName] || {},
          })),
          kitchen: item.kitchen,
          selectedSize: item.selectedSize || null,
          ingredients: item.ingredients || [],
          selectedCustomVariants: item.selectedCustomVariants || {},
          customVariantsDetails: item.customVariantsDetails || {},
          customVariantsQuantities: item.customVariantsQuantities || {},
          image: item.image || "/static/images/default-item.jpg",
          // FIXED: Preserve is_combo_offer and offer_description for backend
          is_combo_offer: item.is_combo_offer || false,
          offer_description: item.offer_description || null,
          kitchenStatuses: item.kitchenStatuses || {},
        })
      }),
      subtotal: Number(subtotal.toFixed(2)),
      vat_amount: Number(totalVat.toFixed(2)), // UPDATED
      total: Number(grandTotal.toFixed(2)), // UPDATED: Grand total
      userId: user.email,
      payment_terms: [{ due_date: new Date().toISOString().split("T")[0], payment_terms: "Immediate" }],
      payments: [paymentDetails],
      orderType: orderType || "Dine In",
      status: "Pending",
      // UPDATED: Use orderNo state (from SAVE) or existingOrder.orderNo for Online Delivery to match active order
      orderNo: orderType === "Online Delivery" ? (orderNo || existingOrder?.orderNo || generate_order_number(orderType)) : null,
      deliveryPersonName: orderType === "Online Delivery" ? (deliveryPersonName || existingOrder?.deliveryPersonName || "") : null,
      // NEW: Include pos_opening_entry for association with opening entry
      pos_opening_entry: posOpeningEntry,
    }
    // NEW: Log full payload for debugging (remove in prod)
    console.log("Sending sales payload:", payload);
    try {
      // FIXED: Use dynamic baseUrl for sales save
      const apiPath = baseUrl ? `${baseUrl}/api/sales` : '/api/sales';
      const response = await axios.post(apiPath, payload)
      setWarningMessage(`Sale saved successfully! Invoice No: ${response.data.invoice_no}`)
      setWarningType("success")
      setPendingAction(() => () => {
        setCartItems([])
        setBillCartItems([])
      })
      return response.data
    } catch (error) {
      console.error("Error saving to backend:", error)
      setWarningMessage(`Failed to save sale: ${error.response?.data?.error || error.message}`)
      setWarningType("warning")
      throw error
    }
  }
  const handleKeyPress = (e) => {
    if (e.key === " " || e.keyCode === 32) {
      e.preventDefault()
    }
  }
  const handleDeliveryAddressChange = (field, value) => {
    setDeliveryAddress((p) => ({ ...p, [field]: value }));
    // If changing country or field1, clear dependent fields
    if (field === 'country' || field === 'field1') {
      setDeliveryAddress((p) => ({ ...p, field2: '', field3: '' }));
    }
  };
  // Helper to get filtered values for the selected Field1
  const getFilteredValues = (field) => {
    if (!deliveryAddress.country || !deliveryAddress.field1) return [];
    const links = linkedValues[deliveryAddress.country]?.[deliveryAddress.field1];
    return links?.[field] || [];
  };
  const countryList = Object.keys(addressStructure.countries || {});
  const handleCreateCustomer = async () => {
    if (orderType !== "Dine In" && (!customerName.trim() || !phoneNumber)) {
      setWarningMessage("Customer name and phone number are required for non-Dine In orders.")
      setWarningType("warning")
      return
    }
    if (orderType !== "Dine In" && phoneNumber.length !== 10) {
      setWarningMessage("Phone number must be 10 digits for non-Dine In orders.")
      setWarningType("warning")
      return
    }
    try {
      const customerData = {
        customer_name: customerName.trim(),
        phone_number: `${selectedISDCode}${phoneNumber}`,
        whatsapp_number: `${whatsappISDCode}${whatsappNumber}`, // UPDATED: Full WhatsApp with code
        building_name: deliveryAddress.building_name || "",
        flat_villa_no: deliveryAddress.flat_villa_no || "",
        country: deliveryAddress.country || "",
        field1: deliveryAddress.field1 || "",
        field2: deliveryAddress.field2 || "",
        field3: deliveryAddress.field3 || "",
        email: email || "",
        customer_group: selectedGroupId || null,
      }
      // FIXED: Use dynamic baseUrl for customer create
      const apiPath = baseUrl ? `${baseUrl}/api/customers` : '/api/customers';
      const response = await axios.post(apiPath, customerData)
      const newCustomer = { ...customerData, _id: response.data.id }
      setCustomers((prev) => [...prev, newCustomer])
      setFilteredCustomers((prev) => [...prev, newCustomer])
      setShowCustomerSection(false)
      setWarningMessage("Customer saved successfully!")
      setWarningType("success")
      setPendingAction(() => () => {
        setIsPhoneNumberSet(true)
        phoneNumberRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    } catch (error) {
      console.error("Error creating customer:", error)
      if (error.response?.status === 409) {
        setWarningMessage(
          `Phone number ${phoneNumber} already exists for customer ${error.response.data.customer_name}`,
        )
      } else {
        setWarningMessage(`Failed to create customer: ${error.response?.data?.error || error.message}`)
      }
      setWarningType("warning")
    }
  }
  const handleUpdateCustomer = async (id) => {
    if (orderType !== "Dine In" && (!customerName.trim() || !phoneNumber)) {
      setWarningMessage("Customer name and phone number are required for non-Dine In orders.")
      setWarningType("warning")
      return
    }
    if (orderType !== "Dine In" && phoneNumber.length !== 10) {
      setWarningMessage("Phone number must be 10 digits for non-Dine In orders.")
      setWarningType("warning")
      return
    }
    try {
      const customerData = {
        customer_name: customerName.trim(),
        phone_number: `${selectedISDCode}${phoneNumber}`,
        whatsapp_number: `${whatsappISDCode}${whatsappNumber}`, // UPDATED: Full WhatsApp with code
        building_name: deliveryAddress.building_name || "",
        flat_villa_no: deliveryAddress.flat_villa_no || "",
        country: deliveryAddress.country || "",
        field1: deliveryAddress.field1 || "",
        field2: deliveryAddress.field2 || "",
        field3: deliveryAddress.field3 || "",
        email: email || "",
        customer_group: selectedGroupId || null,
      }
      // FIXED: Use dynamic baseUrl for customer update
      const apiPath = baseUrl ? `${baseUrl}/api/customers/${id}` : `/api/customers/${id}`;
      await axios.put(apiPath, customerData)
      const updatedCustomer = { ...customerData, _id: id }
      setCustomers((prev) => prev.map((c) => (c._id === id ? updatedCustomer : c)))
      setFilteredCustomers((prev) => prev.map((c) => (c._id === id ? updatedCustomer : c)))
      setShowCustomerSection(false)
      setWarningMessage("Customer saved successfully!")
      setWarningType("success")
      setPendingAction(() => () => {
        setIsPhoneNumberSet(true)
        phoneNumberRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    } catch (error) {
      console.error("Error updating customer:", error)
      setWarningMessage(`Failed to update customer: ${error.response?.data?.error || error.message}`)
      setWarningType("warning")
    }
  }
  const handleCustomerNameChange = (e) => {
    const value = e.target.value
    setCustomerName(value)
    if (value.trim() === "") {
      setFilteredCustomers(customers)
      setPhoneNumber("")
      setWhatsappNumber("")
      setWhatsappISDCode("+91") // RESET: WhatsApp code
      setDeliveryAddress({ building_name: "", flat_villa_no: "", country: "", field1: "", field2: "", field3: "" })
      setEmail("")
      setSelectedGroupId("")
      setIsPhoneNumberSet(false)
    } else {
      const filtered = customers.filter((customer) =>
        customer.customer_name.toLowerCase().includes(value.toLowerCase()),
      )
      setFilteredCustomers(filtered)
    }
  }
  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 10) setPhoneNumber(value)
    if (value.length === 0) {
      setCustomerName("")
      setWhatsappNumber("")
      setWhatsappISDCode("+91") // RESET: WhatsApp code
      setDeliveryAddress({ building_name: "", flat_villa_no: "", country: "", field1: "", field2: "", field3: "" })
      setEmail("")
      setSelectedGroupId("")
      setIsPhoneNumberSet(false)
    } else if (value.length === 10) {
      const existingCustomer = customers.find((c) => c.phone_number === `${selectedISDCode}${value}`)
      if (existingCustomer) {
        setCustomerName(existingCustomer.customer_name)
        setDeliveryAddress({
          building_name: existingCustomer.building_name || "",
          flat_villa_no: existingCustomer.flat_villa_no || "",
          country: existingCustomer.country || "",
          field1: existingCustomer.field1 || "",
          field2: existingCustomer.field2 || "",
          field3: existingCustomer.field3 || "",
        })
        setEmail(existingCustomer.email || "")
        setSelectedGroupId(existingCustomer.customer_group || "")
        // UPDATED: Parse full whatsapp_number for existing customer
        const fullWhatsapp = existingCustomer.whatsapp_number || ""
        const whatsappCode = isdCodes.find((isd) => fullWhatsapp.startsWith(isd.code))?.code || "+91"
        setWhatsappISDCode(whatsappCode)
        setWhatsappNumber(fullWhatsapp.replace(whatsappCode, ""))
        setIsPhoneNumberSet(true)
      } else {
        setIsPhoneNumberSet(false)
      }
    }
  }
  // NEW: Handler to copy phone to WhatsApp (triggered by copy message or button)
  const handleCopyPhoneToWhatsapp = () => {
    setWhatsappNumber(phoneNumber);
    setWhatsappISDCode(selectedISDCode);
  };
  // UPDATED: WhatsApp number change handler (digits only, up to 10)
  const handleWhatsappNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 10) setWhatsappNumber(value)
  };
  const handleISDCodeSelect = (code) => {
    setSelectedISDCode(code)
    setShowISDCodeDropdown(false)
  }
  // NEW: Handler for WhatsApp ISD code select
  const handleWhatsappISDCodeSelect = (code) => {
    setWhatsappISDCode(code)
    setShowWhatsappISDCodeDropdown(false)
  }
  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.customer_name)
    const fullPhone = customer.phone_number || ""
    const code = isdCodes.find((isd) => fullPhone.startsWith(isd.code))?.code || "+91"
    setSelectedISDCode(code)
    setPhoneNumber(fullPhone.replace(code, ""))
    // UPDATED: Parse full whatsapp_number
    const fullWhatsapp = customer.whatsapp_number || ""
    const whatsappCode = isdCodes.find((isd) => fullWhatsapp.startsWith(isd.code))?.code || "+91"
    setWhatsappISDCode(whatsappCode)
    setWhatsappNumber(fullWhatsapp.replace(whatsappCode, ""))
    setDeliveryAddress({
      building_name: customer.building_name || "",
      flat_villa_no: customer.flat_villa_no || "",
      country: customer.country || "",
      field1: customer.field1 || "",
      field2: customer.field2 || "",
      field3: customer.field3 || "",
    })
    setEmail(customer.email || "")
    setSelectedGroupId(customer.customer_group || "")
    setShowCustomerSection(false)
    setIsPhoneNumberSet(true)
  }
  const handleCustomerSubmit = async () => {
    if (orderType === "Dine In") {
      setIsPhoneNumberSet(true)
      return
    }
    if (customerName.trim() && phoneNumber.length === 10) {
      const existingCustomer = customers.find((c) => c.phone_number === `${selectedISDCode}${phoneNumber}`)
      const customerData = {
        customer_name: customerName.trim(),
        phone_number: `${selectedISDCode}${phoneNumber}`,
        whatsapp_number: `${whatsappISDCode}${whatsappNumber}`, // UPDATED: Full with code
        building_name: deliveryAddress.building_name || "",
        flat_villa_no: deliveryAddress.flat_villa_no || "",
        country: deliveryAddress.country || "",
        field1: deliveryAddress.field1 || "",
        field2: deliveryAddress.field2 || "",
        field3: deliveryAddress.field3 || "",
        email: email || "",
        customer_group: selectedGroupId || null,
      }
      if (existingCustomer) {
        const hasChanges = Object.keys(customerData).some(
          (key) => customerData[key] !== (existingCustomer[key] || "")
        )
        if (hasChanges) {
          await handleUpdateCustomer(existingCustomer._id)
        } else {
          handleCustomerSelect(existingCustomer)
        }
      } else {
        await handleCreateCustomer()
      }
    }
  }
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setWarningMessage("Group name is required.")
      setWarningType("warning")
      return
    }
    try {
      // FIXED: Use dynamic baseUrl for group create
      const apiPath = baseUrl ? `${baseUrl}/api/customer-groups` : '/api/customer-groups';
      const response = await axios.post(apiPath, { group_name: newGroupName.trim() })
      setCustomerGroups([response.data, ...customerGroups])
      setSelectedGroupId(response.data._id)
      setNewGroupName("")
      setShowGroupModal(false)
      setWarningMessage("Group created successfully!")
      setWarningType("success")
    } catch (error) {
      console.error("Error creating group:", error)
      setWarningMessage("Failed to create group.")
      setWarningType("warning")
    }
  }
  // FIXED: Updated saveOrder to use generate_order_number without undefined orderNo
  const saveOrder = async () => {
    if (cartItems.length === 0) {
      setWarningMessage("Cart is empty. Please add items before saving.")
      setWarningType("warning")
      return
    }
    if (user.email === "Guest") {
      setWarningMessage("Please log in to save the order.")
      setWarningType("warning")
      return
    }
    let currentOrderId = orderId || uuidv4()
    const { chairsBooked } = location.state || {}
    const newOrder = {
      orderId: currentOrderId,
      orderNo: generate_order_number(orderType), // FIXED: Use the defined function directly
      customerName: customerName || "N/A",
      tableNumber: tableNumber || "N/A",
      chairsBooked: Array.isArray(chairsBooked) ? chairsBooked : [],
      phoneNumber: phoneNumber ? `${selectedISDCode}${phoneNumber}` : "N/A",
      whatsappNumber: whatsappNumber ? `${whatsappISDCode}${whatsappNumber}` : "N/A", // UPDATED: Full WhatsApp
      deliveryAddress: deliveryAddress || { building_name: "", flat_villa_no: "", country: "", field1: "", field2: "", field3: "" },
      email: email || "N/A",
      cartItems: cartItems.map((item) => ({
        id: item.id || uuidv4(),
        item_name: item.item_name || item.name,
        name: item.name || item.item_name,
        image: item.image || "/static/images/default-item.jpg",
        quantity: Number(item.quantity) || 1, // FIXED: Explicit Number()
        basePrice: Number(item.basePrice) || 0, // FIXED: Explicit Number()
        originalBasePrice: item.originalBasePrice || null,
        totalPrice: Number(item.totalPrice) || (Number(item.basePrice) * (Number(item.quantity) || 1)) || 0, // FIXED: Explicit Number()
        exclTotal: item.exclTotal || 0,
        taxTotal: item.taxTotal || 0,
        addonQuantities: item.addonQuantities || {},
        addonVariants: item.addonVariants || {},
        addonPrices: item.addonPrices || {},
        addonSizePrices: item.addonSizePrices || {},
        addonIcePrices: item.addonIcePrices || {},
        addonSpicyPrices: item.addonSpicyPrices || {},
        addonImages: item.addonImages || {},
        addonTaxes: item.addonTaxes || {},
        comboQuantities: item.comboQuantities || {},
        comboVariants: item.comboVariants || {},
        comboPrices: item.comboPrices || {},
        comboSizePrices: item.comboSizePrices || {},
        comboIcePrices: item.comboIcePrices || {},
        comboSpicyPrices: item.comboSpicyPrices || {},
        comboImages: item.comboImages || {},
        comboTaxes: item.comboTaxes || {},
        selectedCombos: item.selectedCombos || [],
        selectedSize: item.selectedSize || null,
        kitchen: item.kitchen || "Main Kitchen",
        ingredients: item.ingredients || [],
        requiredKitchens: item.requiredKitchens || [],
        kitchenStatuses: item.kitchenStatuses || {}, // Preserve statuses
        served: item.served || false,
        addonCustomVariantsDetails: item.addonCustomVariantsDetails || {},
        comboCustomVariantsDetails: item.comboCustomVariantsDetails || {},
        customVariantsDetails: item.customVariantsDetails || {},
        customVariantsQuantities: item.customVariantsQuantities || {},
        selectedCustomVariants: item.selectedCustomVariants || {},
        icePreference: item.icePreference || "without_ice",
        isSpicy: item.isSpicy || false,
        sugarLevel: item.sugarLevel || "medium",
        // FIXED: Preserve is_combo_offer and offer_description
        is_combo_offer: item.is_combo_offer || false,
        offer_description: item.offer_description || null,
        comboItems: item.comboItems || [], // Include comboItems for combo offers
        kitchenNotes: item.kitchenNotes || {},
      })),
      timestamp: new Date().toISOString(),
      orderType: orderType || "Dine In",
      status: "Pending",
      paid: false,
    }
    try {
      // FIXED: Use dynamic baseUrl for kitchen save
      const apiPathKitchen = baseUrl ? `${baseUrl}/api/kitchen-saved` : '/api/kitchen-saved';
      const kitchenResponse = await axios.post(apiPathKitchen, newOrder)
      if (!kitchenResponse.data.success) {
        throw new Error(kitchenResponse.data.error || "Failed to notify kitchen")
      }
      console.log("Order sent to kitchen:", kitchenResponse.data.order_id)
      let message = "Order saved successfully!";
      if (orderId) {
        // FIXED: Use dynamic baseUrl for order update
        const apiPathUpdate = baseUrl ? `${baseUrl}/api/activeorders/${orderId}` : `/api/activeorders/${orderId}`;
        const updateResponse = await axios.put(apiPathUpdate, newOrder)
        if (updateResponse.status === 200) {
          console.log("Order updated successfully")
          message = "Order updated successfully!";
        }
      } else {
        // FIXED: Use dynamic baseUrl for order save
        const apiPathSave = baseUrl ? `${baseUrl}/api/activeorders` : '/api/activeorders';
        const response = await axios.post(apiPathSave, newOrder)
        if (response.status === 201) {
          console.log("Order saved successfully")
          setOrderId(response.data.orderId)
          // UPDATED: Set orderNo from backend response for new orders
          setOrderNo(response.data.orderNo)
          currentOrderId = response.data.orderId
        } else {
          throw new Error("Failed to save order")
        }
      }
      const updatedOrders = [
        ...savedOrders.filter(
          (order) =>
            !(order.tableNumber === tableNumber && order.chairsBooked.some((chair) => chairsBooked.includes(chair))),
        ),
        { ...newOrder, orderId: currentOrderId },
      ]
      setSavedOrders(updatedOrders)
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders))
      if (orderType === "Dine In") {
        const updatedBookedTables = [...new Set([...bookedTables, tableNumber])]
        setBookedTables(updatedBookedTables)
        localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables))
        const updatedBookedChairs = { ...bookedChairs }
        updatedBookedChairs[tableNumber] = [...new Set([...(updatedBookedChairs[tableNumber] || []), ...chairsBooked])]
        setBookedChairs(updatedBookedChairs)
        localStorage.setItem("bookedChairs", JSON.stringify(updatedBookedChairs))
      }
      setWarningMessage(`${message} Do you want to pay now?`)
      setWarningType("success")
      setIsConfirmation(true)
      setPendingAction(() => handleConfirmYes)
      setPendingAction(() => () => {
        setCartItems([])
        setBillCartItems([])
        if (orderType === "Dine In") {
          navigate("/table")
        }
      })
    } catch (error) {
      console.error("Error saving order:", error)
      setWarningMessage(`Failed to save order: ${error.response?.data?.error || error.message}`)
      setWarningType("warning")
    }
  }
  const handleSetPhoneNumber = () => {
    if (orderType === "Dine In") {
      setIsPhoneNumberSet(true)
      return
    }
    if (phoneNumber.length !== 10) {
      setWarningMessage("Please enter a valid 10-digit phone number.")
      setWarningType("warning")
      return
    }
    handleCustomerSubmit()
  }
  const cancelCart = () => {
    setCartItems([])
    setBillCartItems([])
    setWarningMessage("Cart cleared successfully.")
    setWarningType("success")
  }
  const handleActiveOrdersClick = () => {
    navigate("/active-orders")
  }
  const handleNext = () => {
    setStartIndex((prev) => prev + 1)
  }
  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1))
  }
  const handleSalesReportNavigation = () => {
    navigate("/sales-reports")
  }
  const handleClosingEntryNavigation = () => {
    navigate("/closing-entry")
  }
  const handleLogout = () => {
    localStorage.removeItem("user")
    navigate("/")
  }
  const totalBookedChairs = bookedChairs[tableNumber]?.length || 0
  const availableChairs = totalChairs - totalBookedChairs
  const subtotal = calculateExclTotal(cartItems)
  const vatByRate = getVatByRate(cartItems)
  const totalVat = calculateTaxTotal(cartItems)
  const total = subtotal + totalVat
  const showKitchenColumn = orderType === "Dine In"
  const visibleCategories = categories.slice(startIndex, startIndex + 5)
  // FIXED: Function to get all names for combo bullet list (from ItemListPage)
  const getAllNames = (combo) => {
    const names = [];
    // Items
    if (combo.comboItems && combo.comboItems.length > 0) {
      combo.comboItems.forEach(comboItem => {
        names.push(comboItem.name || '');
      });
    }
    // Addons
    if (combo.addons && combo.addons.length > 0) {
      combo.addons.forEach(addon => {
        if (addon.name1) names.push(addon.name1);
      });
    }
    // Combos (sub-combos)
    if (combo.combos && combo.combos.length > 0) {
      combo.combos.forEach(subCombo => {
        if (subCombo.name1) names.push(subCombo.name1);
      });
    }
    return names.filter(name => name.trim() !== '');
  };
  // UPDATED: Function to get combo items with images and names (for side-by-side display) - from ItemListPage
  const getComboItemsWithImages = (combo) => {
    const itemsWithImages = [];
    if (combo.comboItems && combo.comboItems.length > 0) {
      combo.comboItems.forEach(comboItem => {
        const name = comboItem.name || '';
        const image = comboItem.image || null;
        if (name.trim() !== '') {
          itemsWithImages.push({ name, image });
        }
      });
    }
    return itemsWithImages;
  };
  // NEW: Function to get only uploaded images for centered display - from ItemListPage
  const getUploadedImages = (combo) => {
    if (combo.images && combo.images.length > 0) {
      return combo.images.map(img => `/api/combo-images/${img}`);
    }
    return [];
  };
  // Inline styles for combo poster - EXACTLY from ItemListPage
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
  const logoStyle = {
    position: "absolute",
    top: "8px",
    left: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#ffffff",
    textShadow: "0 1px 3px rgba(0,0,0,0.3)"
  };
  const offerNameStyle = {
    fontSize: "22px",
    marginBottom: "8px",
    textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
    fontFamily: 'ui-sans-serif',
    color: "#ffffff",
    fontWeight: "600",
  };
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
  const uploadedImagesStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "10px",
    justifyContent: "center", // Center the images
  };
  const uploadedImageThumbStyle = {
    width: "60px", // Slightly larger for neat display
    height: "60px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "2px solid rgba(255, 255, 255, 0.5)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };
  const itemsListStyle = {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "8px",
    padding: "10px",
    marginBottom: "8px",
    textAlign: "left",
  };
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
  const limitedOfferStyle = {
    fontSize: "13px",
    color: "#fdd835", // Bright yellow
    marginTop: "8px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    textAlign: "center",
  };
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
  const strikethroughStyle = {
    textDecoration: "line-through",
    color: "#888",
    marginRight: "10px",
  };
  const offerPriceStyle = {
    color: "#ff4500",
    fontWeight: "bold",
  };
  // UPDATED: Price display helper for cart rows - FIXED: Return excl price always (VAT at bottom only); for isComboSub return "Included" or 0
  // FIXED: Add null checks and optional chaining to prevent undefined errors (e.g., item?.icePrice)
  const getPriceDisplay = (item, isMain = false, addonName = null, comboName = null, isIce = false, isSpicy = false, isCustom = false, isComboSub = false, showBreakdown = false) => {
    if (!item) return formatPrice(0); // FIXED: Guard against undefined item
    if (isComboSub) {
      // For combo subitem, included in combo price
      return "Included";
    }
    let excl = 0
    let tax = 0
    let rate = 0
    if (isMain) {
      excl = getMainItemTotal(item)
      tax = item.mainTaxTotal || 0
      rate = item.mainTaxRate || 0
    } else if (addonName) {
      const qty = Number(item.addonQuantities?.[addonName]) || 1 // FIXED: Optional chaining
      excl = (item.addonPrices?.[addonName] || 0) * qty // FIXED: Optional chaining
      tax = item.addonTaxes?.[addonName] || 0 // FIXED: Optional chaining
      rate = item.addonTaxRates?.[addonName] || 0 // FIXED: Optional chaining
    } else if (comboName) {
      const qty = Number(item.comboQuantities?.[comboName]) || 1 // FIXED: Optional chaining
      excl = (item.comboPrices?.[comboName] || 0) * qty // FIXED: Optional chaining
      tax = item.comboTaxes?.[comboName] || 0 // FIXED: Optional chaining
      rate = item.comboTaxRates?.[comboName] || 0 // FIXED: Optional chaining
    } else if (isIce) {
      excl = (item?.icePrice || 0) * (item?.quantity || 1) // FIXED: Optional chaining for icePrice and quantity
      tax = 0 // Part of main
    } else if (isSpicy) {
      excl = (item?.spicyPrice || 0) * (item?.quantity || 1) // FIXED: Optional chaining
      tax = 0
    } else if (isCustom) {
      // For custom, per variant
      excl = getCustomVariantsTotal(item)
      tax = 0 // Part of main
    }
    if (showBreakdown && tax > 0) {
      return `${formatPrice(excl)} + VAT ${rate}% (${formatPrice(tax)}) = ${formatPrice(excl + tax)}`
    }
    // FIXED: Always return excl price for cart rows (VAT shown only at bottom summary)
    return formatPrice(excl)
  }

  return (
    <div className="frontpage-container">
      <div className={`frontpage-sidebar ${isSidebarOpen ? "open" : ""}`}>
        {isSidebarOpen && (
          <div className="frontpage-sidebar-close" onClick={() => setIsSidebarOpen(false)}>
            <i className="bi bi-x"></i>
          </div>
        )}
        <ul className="navbar-nav mx-auto mb-2 mb-lg-0 d-flex justify-content-center flex-column align-items-center h-100">
          <li className="nav-item">
            <a
              className={`nav-link ${location.pathname === "/frontpage" ? "active text-primary" : "text-black"} cursor-pointer`}
              onClick={() => navigate("/frontpage")}
              title="Home"
            >
              <img src="/menuIcons/home.svg" alt="Home" className="icon-size" />
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${location.pathname === "/home" ? "active text-primary" : "text-black"} cursor-pointer`}
              onClick={() => navigate("/home")}
              title="Type Of Delivery"
            >
              <img src="/menuIcons/delivery.svg" alt="Delivery" className="icon-size" />
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${location.pathname === "/table" ? "active text-primary" : "text-black"} cursor-pointer`}
              onClick={() => navigate("/table")}
              title="Table"
            >
              <img src="/menuIcons/table1.svg" alt="Table" className="icon-size" />
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${location.pathname === "/kitchen" ? "active text-primary" : "text-black"} cursor-pointer`}
              onClick={() => navigate("/kitchen")}
              title="Kitchen"
            >
              <img src="/menuIcons/kitchen.svg" alt="Kitchen" className="icon-size" />
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${location.pathname === "/salespage" ? "active text-primary" : "text-black"} cursor-pointer`}
              onClick={() => navigate("/salespage")}
              title="Sales Invoice"
            >
              <img src="/menuIcons/save.svg" alt="Save" className="icon-size" />
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${location.pathname === "/sales-reports" ? "active text-primary" : "text-black"} cursor-pointer`}
              onClick={handleSalesReportNavigation}
              title="Sales Report"
            >
              <img src="/menuIcons/salesreport.svg" alt="Sales Report" className="icon-size" />
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${location.pathname === "/closing-entry" ? "active text-primary" : "text-black"} cursor-pointer`}
              onClick={handleClosingEntryNavigation}
              title="Closing Entry"
            >
              <img src="/menuIcons/closingentry.svg" alt="Closing Entry" className="icon-size" />
            </a>
          </li>
          <li className="nav-item">
            <a
              className="nav-link text-black cursor-pointer"
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              title="Theme"
            >
              <div className="theme-icon">🎨</div>
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${showPOSGrid ? "active text-primary" : "text-black"} cursor-pointer`}
              onClick={() => setShowPOSGrid(!showPOSGrid)}
              title={showPOSGrid ? "Switch to Normal View" : "Switch to POS Grid View"}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Simple grid icon representation */}
                <i className={`bi ${showPOSGrid ? "bi-grid-3x3-gap-fill" : "bi-grid-3x3-gap"}`} style={{ fontSize: "20px" }}></i>
                <span style={{ fontSize: "10px" }}>{showPOSGrid ? "POS" : "Normal"}</span>
              </div>
            </a>
          </li>
          <li className="nav-item mt-auto">
            <a className="nav-link text-black cursor-pointer" onClick={handleLogout} title="Logout">
              <img src="/menuIcons/poweroff.svg" alt="Logout" className="icon-size" />
            </a>
          </li>
        </ul>
      </div>
      {showThemeSelector && (
        <div className="theme-selector-dropdown">
          <div className="theme-selector-header">
            <h4>Choose Theme</h4>
            <button className="theme-close-btn" onClick={() => setShowThemeSelector(false)}>
              <i className="bi bi-x"></i>
            </button>
          </div>
          <div className="theme-options">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                className={`theme-option ${currentTheme === key ? "active" : ""}`}
                onClick={() => handleThemeChange(key)}
              >
                <span className="theme-emoji">{theme.icon}</span>
                <span className="theme-name">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {isSidebarOpen && <div className="frontpage-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      {showThemeSelector && <div className="theme-selector-overlay" onClick={() => setShowThemeSelector(false)}></div>}
      <div className="frontpage-main-content">
        <div className="frontpage-header">
          <div className="frontpage-hamburger" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <i className="bi bi-list"></i>
          </div>
          <h2>Restaurant POS</h2>
          <div className="frontpage-user-info">
            <div className="frontpage-date-time">
              <div className="frontpage-date-time-row">
                <span>{currentDate}</span>
                <span>{currentTime}</span>
              </div>
            </div>
            <div className="frontpage-user-profile">
              <span>{user.email}</span>
              <div className="frontpage-user-avatar">{user.email.charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </div>
        <div className="frontpage-category-search-section">
          <div className="frontpage-category-nav">
            <button className="frontpage-nav-arrow" onClick={handlePrev} disabled={startIndex === 0}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <div className="frontpage-categories-container">
              {visibleCategories.map((category) => (
                <button
                  key={category}
                  className={`frontpage-category-btn ${selectedCategory === (category.includes("Combos Offer") ? "Combos Offer" : category) ? "active" : ""}`}
                  onClick={() => handleFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <button className="frontpage-nav-arrow" onClick={handleNext} disabled={startIndex + 5 >= categories.length}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
          <div className="frontpage-search-container">
            <i className="bi bi-search frontpage-search-icon"></i>
            <input
              type="text"
              className="frontpage-search-input"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="frontpage-menu-section">
          {showPOSGrid ? (
            /* ── POS GRID VIEW ── */
            <div className="frontpage-pos-layout" style={{ display: 'flex', gap: '15px', height: '100%' }}>
              {/* Left Side: Items Grid */}
              <div className="frontpage-pos-items" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="row">
                  {filteredItems.flatMap((item) => {
                    // Split logic for POS Grid:
                    // If item has sizes enabled, create 3 separate grid items (S, M, L).
                    // Otherwise, keep as 1 grid item.
                    if (item.size && item.size.enabled) {
                      return ['S', 'M', 'L'].map(size => ({
                        ...item,
                        isSplitVariant: true,
                        splitSize: size,
                        // Determine price for this specific size card
                        displayPrice: size === 'S' ? item.size.small_price : size === 'L' ? item.size.large_price : item.size.medium_price
                      }));
                    }
                    return [item];
                  }).map((item, index) => {
                    // Unique key generation relying on index to avoid duplicates with same ID
                    const uniqueKey = item.isSplitVariant ? `${item.id}-${item.splitSize}` : item.id;

                    return (
                      <div key={uniqueKey} className="col-md-3 mb-3">
                        <div
                          className="pos-item-card"
                          // If it's a split variant, clicking the main card body adds THAT size.
                          // If normal item, clicking adds default.
                          onClick={(e) => {
                            if (item.isSplitVariant) {
                              handleItemUpdate({
                                ...item,
                                item_name: item.name,
                                quantity: 1,
                                isPOSGrid: true, // Flag for increment logic
                                variants: { size: { selected: item.splitSize } }
                              });
                            } else {
                              handleItemUpdate({
                                ...item,
                                item_name: item.name,
                                quantity: 1,
                                isPOSGrid: true // Flag for increment logic
                              });
                            }
                          }}
                          style={{
                            border: '1px solid #ddd',
                            padding: '8px',
                            borderRadius: '8px',
                            background: '#fff',
                            height: 'auto',
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {/* Item Name & Base Info */}
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                            <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                            <div>
                              <h6 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                                {item.name} {item.isSplitVariant ? `(${item.splitSize})` : ''}
                              </h6>
                              <small className="text-success" style={{ fontWeight: 'bold' }}>
                                {formatPrice(item.isSplitVariant ? item.displayPrice : item.basePrice)}
                              </small>
                            </div>
                          </div>

                        </div>

                        {/* Addons Section - Separate Box */}
                        {item.addons && item.addons.length > 0 && (
                          <div className="pos-addons-container" style={{
                            marginTop: '5px',
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}>
                            <small style={{ fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px', borderBottom: '1px solid #eee', paddingBottom: '2px' }}>Addons</small>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {item.addons.map((addon, idx) => (
                                <div key={idx} style={{ width: '100%' }}>
                                  {addon.size && addon.size.enabled ? (
                                    /* Sized Addon: Filter sizes based on main item context */
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                      {((item.isSplitVariant && item.splitSize) ? [item.splitSize] : ['S', 'M', 'L']).map((size) => {
                                        const price = size === 'S' ? (addon.size.small_price || 0) : size === 'L' ? (addon.size.large_price || 0) : (addon.size.medium_price || 0);
                                        return (
                                          <div
                                            key={size}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const standaloneAddon = createStandaloneAddonItem(addon, size, item.isSplitVariant, item.splitSize || item.selectedSize);
                                              setCartItems(prev => [...prev, standaloneAddon]);
                                              setBillCartItems(prev => [...prev, standaloneAddon]);
                                              setWarningMessage(`${addon.name1} added to cart!`);
                                              setWarningType("success");
                                            }}
                                            style={{
                                              border: '1px solid #17a2b8',
                                              borderRadius: '4px',
                                              padding: '6px 2px',
                                              fontSize: '11px',
                                              cursor: 'pointer',
                                              background: '#e0f7fa',
                                              flex: 1,
                                              textAlign: 'center',
                                              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                              minHeight: '50px'
                                            }}
                                            title={`${addon.name1} (${size})`}
                                          >
                                            <div style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: '1.2', marginBottom: '2px' }}>{addon.name1}</div>
                                            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>({size})</div>
                                            <div style={{ color: '#007bff', fontSize: '10px', fontWeight: 'bold' }}>+{formatPrice(price)}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    /* Regular Addon: Single Box - Styled to Match Variants Height */
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Default to "M" or item size if not explicit
                                        const size = item.isSplitVariant ? item.splitSize : "M";
                                        const standaloneAddon = createStandaloneAddonItem(addon, size, item.isSplitVariant, item.splitSize || item.selectedSize);
                                        setCartItems(prev => [...prev, standaloneAddon]);
                                        setBillCartItems(prev => [...prev, standaloneAddon]);
                                        setWarningMessage(`${addon.name1} added to cart!`);
                                        setWarningType("success");
                                      }}
                                      style={{
                                        border: '1px solid #17a2b8',
                                        borderRadius: '4px',
                                        padding: '6px 8px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        background: '#e0f7fa',
                                        textAlign: 'center',
                                        width: '100%',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        minHeight: '50px',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                                      }}
                                    >
                                      <div style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: '1.2' }}>{addon.name1}</div>
                                      <div style={{ color: '#007bff', fontWeight: 'bold', marginTop: '2px' }}>+{formatPrice(addon.price)}</div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Combos Section - Separate Box */}
                        {item.combos && item.combos.length > 0 && (
                          <div className="pos-combos-container" style={{
                            marginTop: '5px',
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}>
                            <small style={{ fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px', borderBottom: '1px solid #eee', paddingBottom: '2px' }}>Combos</small>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {item.combos.map((combo, idx) => (
                                <div key={idx} style={{ width: '100%' }}>
                                  {combo.size && combo.size.enabled ? (
                                    /* Sized Combo: Filter sizes based on main item context */
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                      {((item.isSplitVariant && item.splitSize) ? [item.splitSize] : ['S', 'M', 'L']).map((size) => {
                                        const price = size === 'S' ? (combo.size.small_price || 0) : size === 'L' ? (combo.size.large_price || 0) : (combo.size.medium_price || 0);
                                        return (
                                          <div
                                            key={size}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const standaloneCombo = createStandaloneComboItem(combo, size, item.isSplitVariant, item.splitSize || item.selectedSize);
                                              setCartItems(prev => [...prev, standaloneCombo]);
                                              setBillCartItems(prev => [...prev, standaloneCombo]);
                                              setWarningMessage(`${combo.name1} added to cart!`);
                                              setWarningType("success");
                                            }}
                                            style={{
                                              border: '1px solid #ffc107',
                                              borderRadius: '4px',
                                              padding: '6px 2px',
                                              fontSize: '11px',
                                              cursor: 'pointer',
                                              background: '#ffefc1',
                                              flex: 1,
                                              textAlign: 'center',
                                              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                              minHeight: '50px'
                                            }}
                                            title={`${combo.name1} (${size})`}
                                          >
                                            <div style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: '1.2', marginBottom: '2px' }}>{combo.name1}</div>
                                            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>({size})</div>
                                            <div style={{ color: '#d39e00', fontSize: '10px', fontWeight: 'bold' }}>+{formatPrice(price)}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    /* Regular Combo: Single Box - Styled to Match Variants Height */
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const size = item.isSplitVariant ? item.splitSize : "M";
                                        const standaloneCombo = createStandaloneComboItem(combo, size, item.isSplitVariant, item.splitSize || item.selectedSize);
                                        setCartItems(prev => [...prev, standaloneCombo]);
                                        setBillCartItems(prev => [...prev, standaloneCombo]);
                                        setWarningMessage(`${combo.name1} added to cart!`);
                                        setWarningType("success");
                                      }}
                                      style={{
                                        border: '1px solid #ffc107',
                                        borderRadius: '4px',
                                        padding: '6px 8px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        background: '#ffefc1',
                                        textAlign: 'center',
                                        width: '100%',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        minHeight: '50px',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                                      }}
                                    >
                                      <div style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: '1.2' }}>{combo.name1}</div>
                                      <div style={{ color: '#d39e00', fontWeight: 'bold', marginTop: '2px' }}>+{formatPrice(combo.price)}</div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Category Sidebar */}
              <div className="frontpage-pos-categories" style={{ width: '150px', overflowY: 'auto', borderLeft: '1px solid #eee', paddingLeft: '10px' }}>
                <h6 style={{ fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>Categories</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      onClick={() => handleFilter(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── NORMAL CARD VIEW (Simplified) ── */
            <div className={`frontpage-menu-grid ${selectedCategory === "Combos Offer" ? "combo-grid" : ""}`}>
              {/* Logic: 
                  1. Flatten main items: if enabled size, S/M/L cards. Else 1 card.
                  2. Combos Offer: Poster style.
                  3. Hide generic addon/combo items if they appear in standard list (filteredItems usually contains them if they were fetched as items? 
                     Actually menuItems comes from /api/items. Addons usually attached to items. 
                     But the user says "DO NOT generate separate cards for addons". 
                     Assuming filteredItems ONLY contains Main Items and Combo Offers based on API. 
              */}
              {filteredItems.flatMap((item) => {
                // CASE 1: Poster / Combo Offer
                if (item.isCombo) {
                  return [{ ...item, isPoster: true }];
                }

                // CASE 2: Main Item - Single Card (User Request: "Normal view item only")
                // We do NOT split into sizes (S/M/L) here anymore.
                return [{
                  ...item,
                  displayPrice: item.basePrice,
                  displayName: item.name,
                  preSelectedSize: null
                }];
              }).map((item, index) => { // Use index for unique key with UUID fallback
                if (item.isPoster) {
                  // Render Poster Card (Combo Offer)
                  return (
                    <div key={item.id} className="col-md-6 mb-4">
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
                        <h4 style={offerNameStyle}>{item.name}</h4>
                        {hasActiveOffer(item) && (
                          <p style={offerPeriodStyle}>
                            <strong>Offer Period:</strong> {new Date(item.offer_start_time).toLocaleDateString()} {new Date(item.offer_start_time).toLocaleTimeString()} to {new Date(item.offer_end_time).toLocaleDateString()} {new Date(item.offer_end_time).toLocaleTimeString()}
                          </p>
                        )}
                        {(() => {
                          const uploadedImages = getUploadedImages(item);
                          if (uploadedImages.length > 0) {
                            return (
                              <div style={uploadedImagesStyle}>
                                {uploadedImages.map((imgPath, idx) => (
                                  <img key={idx} src={`${baseUrl}${imgPath}`} alt="" style={uploadedImageThumbStyle} onError={(e) => { e.target.src = "https://via.placeholder.com/60?text=No+Img"; }} />
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()}
                        <ul style={itemsListStyle}>
                          {getComboItemsWithImages(item).map((itemWithImage, idx) => (
                            <li key={idx} style={itemsListItemStyle}>
                              {itemWithImage.image && <img src={itemWithImage.image} alt="" style={itemImageStyle} onError={(e) => { e.target.style.display = "none"; }} />}
                              {itemWithImage.name}
                            </li>
                          ))}
                        </ul>
                        <p style={totalPriceStyle}>
                          Total Price: {hasActiveOffer(item) ? (
                            <>
                              <span style={{ ...strikethroughStyle, color: "#aaa", fontSize: "16px" }}>{formatPrice(item.basePrice)}</span>
                              <span style={{ color: "#fdd835", fontSize: "18px" }}>{formatPrice(item.offer_price)}</span>
                            </>
                          ) : (
                            <span style={{ color: "#ffffff", fontSize: "18px" }}>{formatPrice(item.basePrice)}</span>
                          )}
                        </p>
                        {hasActiveOffer(item) && <p style={limitedOfferStyle}>LIMITED OFFERS! Place Your Order</p>}
                        <Button
                          variant="success"
                          onClick={() => handleItemUpdate({ ...item, quantity: 1 })}
                          style={viewButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f0f0f0"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; }}
                        >
                          Add to Cart
                        </Button>
                      </Card>
                    </div>
                  );
                }

                // Render Normal Card (Main Item / Variant)
                return (
                  <div key={item.id + (item.preSelectedSize || "")} className="frontpage-menu-card" onClick={() => handleItemClick(item, item.preSelectedSize)}>
                    {/* Size Badge */}
                    {item.preSelectedSize && (
                      <span className="badge bg-primary" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}>
                        {item.preSelectedSize}
                      </span>
                    )}
                    <img src={item.image || "/placeholder.svg"} alt={item.displayName} className="frontpage-menu-card-image" />
                    <div className="frontpage-menu-card-content">
                      <h5 className="frontpage-menu-card-name" style={{ fontSize: '1rem', fontWeight: 600 }}>{item.displayName}</h5>
                      <p className="frontpage-menu-card-price">
                        {formatPrice(hasActiveOffer(item) && !item.isVariantCard ? item.offer_price : item.displayPrice)}
                      </p>
                      {hasActiveOffer(item) && !item.isVariantCard && <span className="frontpage-offer-badge">Offer</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="frontpage-billing-section">
        <div className="frontpage-billing-tabs">
          <button
            className={`frontpage-billing-tab ${location.pathname === "/active-orders" ? "active" : ""}`}
            onClick={handleActiveOrdersClick}
          >
            Active Orders
          </button>
          <button
            className={`frontpage-billing-tab ${showCustomerSection ? "active" : ""}`}
            onClick={() => setShowCustomerSection(true)}
          >
            Customers
          </button>
        </div>
        {showCustomerSection && (
          <div className="frontpage-customer-info" ref={customerSectionRef}>
            <div className="frontpage-input-group">
              <input
                type="text"
                className="frontpage-customer-input"
                placeholder="Enter Customer Name"
                value={customerName}
                onChange={handleCustomerNameChange}
                onKeyPress={(e) => orderType !== "Dine In" && e.key === "Enter" && handleCustomerSubmit()}
              />
              {filteredCustomers.length > 0 && customerName.trim() && (
                <ul className="frontpage-customer-suggestions">
                  {filteredCustomers.map((customer, index) => (
                    <li key={index} onClick={() => handleCustomerSelect(customer)}>
                      {customer.customer_name} ({customer.phone_number})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="frontpage-phone-input-group">
              <div className="frontpage-phone-prefix">
                <button className="frontpage-isd-button" onClick={() => setShowISDCodeDropdown(!showISDCodeDropdown)}>
                  {selectedISDCode} <i className="bi bi-chevron-down"></i>
                </button>
                {showISDCodeDropdown && (
                  <ul className="frontpage-isd-code-dropdown">
                    {isdCodes.map((isd, index) => (
                      <li key={index} onClick={() => handleISDCodeSelect(isd.code)}>
                        {isd.code} ({isd.country})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                ref={phoneNumberRef}
                type="text"
                className="frontpage-phone-input"
                placeholder="Enter Phone Number"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
              />
            </div>
            {orderType !== "Dine In" && (
              <>
                {/* NEW: Copy suggestion for WhatsApp */}
                {phoneNumber && !whatsappNumber && (
                  <div className="copy-suggestion">
                    <span>Use the same number for WhatsApp?</span>
                    <button type="button" className="copy-btn" onClick={handleCopyPhoneToWhatsapp}>
                      Copy
                    </button>
                  </div>
                )}
                <div className="frontpage-phone-input-group">
                  <div className="frontpage-phone-prefix">
                    <button className="frontpage-isd-button" onClick={() => setShowWhatsappISDCodeDropdown(!showWhatsappISDCodeDropdown)}>
                      {whatsappISDCode} <i className="bi bi-chevron-down"></i>
                    </button>
                    {showWhatsappISDCodeDropdown && (
                      <ul className="frontpage-isd-code-dropdown">
                        {isdCodes.map((isd, index) => (
                          <li key={index} onClick={() => handleWhatsappISDCodeSelect(isd.code)}>
                            {isd.code} ({isd.country})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    type="text"
                    className="frontpage-phone-input"
                    placeholder="Enter WhatsApp Number"
                    value={whatsappNumber}
                    onChange={handleWhatsappNumberChange}
                  />
                </div>
                <div className="frontpage-input-group">
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
                  <div className="frontpage-input-group">
                    <label>{addressStructure.countries[deliveryAddress.country].field1.label}</label>
                    <SearchableSelect
                      options={addressStructure.countries[deliveryAddress.country].field1.values || []}
                      value={deliveryAddress.field1}
                      onChange={(value) => {
                        handleDeliveryAddressChange("field1", value);
                        // Clear Field2 and Field3 when Field1 changes
                        handleDeliveryAddressChange("field2", "");
                        handleDeliveryAddressChange("field3", "");
                      }}
                      placeholder={`Select ${addressStructure.countries[deliveryAddress.country].field1.label}`}
                    />
                  </div>
                )}
                {/* FIELD 2 (filtered by selected Field1) */}
                {deliveryAddress.country && addressStructure.countries[deliveryAddress.country]?.field2 && (
                  <div className="frontpage-input-group">
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
                {/* FIELD 3 (shown always if defined) */}
                {deliveryAddress.country && addressStructure.countries[deliveryAddress.country]?.field3 && (
                  <div className="frontpage-input-group">
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
                <input
                  type="text"
                  className="frontpage-customer-input"
                  placeholder="Enter Flat/Villa No"
                  value={deliveryAddress.flat_villa_no}
                  onChange={(e) => handleDeliveryAddressChange("flat_villa_no", e.target.value)}
                />
                <input
                  type="text"
                  className="frontpage-customer-input"
                  placeholder="Enter Building Name"
                  value={deliveryAddress.building_name}
                  onChange={(e) => handleDeliveryAddressChange("building_name", e.target.value)}
                />
                <input
                  type="email"
                  className="frontpage-customer-input"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="frontpage-input-group">
                  <select
                    className="frontpage-customer-input"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                  >
                    <option value="">Select Customer Group</option>
                    {customerGroups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.group_name}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="frontpage-add-group-btn" onClick={() => setShowGroupModal(true)}>
                  Add New Group
                </button>
                <button className="frontpage-save-customer-btn" onClick={handleCustomerSubmit}>
                  Save Customer
                </button>
              </>
            )}
          </div>
        )}
        <div className="frontpage-order-details">
          {orderType === "Dine In" && tableNumber && tableNumber !== "N/A" && (
            <>
              <h4 className="frontpage-order-header">
                Order for Table {tableNumber}, Chairs {Array.isArray(chairsBooked) ? chairsBooked.join(", ") : "None"}
              </h4>
              <div className="frontpage-chairs-container">
                {totalChairs > 0 ? (
                  <>
                    {Array.from({ length: totalBookedChairs }).map((_, index) => (
                      <i
                        key={`booked-${index}`}
                        className="fa-solid fa-chair frontpage-chair-icon frontpage-booked-chair"
                      ></i>
                    ))}
                    {Array.from({ length: availableChairs }).map((_, index) => (
                      <i
                        key={`available-${index}`}
                        className="fa-solid fa-chair frontpage-chair-icon frontpage-available-chair"
                      ></i>
                    ))}
                  </>
                ) : (
                  <span>No chairs</span>
                )}
              </div>
              <div className="frontpage-chair-status">
                {totalChairs > 0 && (
                  <span>
                    {totalBookedChairs} booked, {availableChairs} available
                  </span>
                )}
              </div>
            </>
          )}
          {(customerName || phoneNumber || whatsappNumber) && (
            <div className="frontpage-selected-customer">
              {customerName && <p>Customer: {customerName}</p>}
              {phoneNumber && (
                <p>
                  Phone: {selectedISDCode}
                  {phoneNumber}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="frontpage-cart-section">
          <table className="frontpage-cart-table">
            <thead>
              <tr>
                <th>T.No.</th>
                <th>Item Details</th>
                <th>Qty</th>
                <th>Price</th>
                {showKitchenColumn && <th>Kitchen</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* FIXED: Filter out undefined/invalid items to prevent render errors */}
              {cartItems.filter(item => item && item.id).length === 0 ? (
                <tr>
                  <td colSpan={showKitchenColumn ? 6 : 5} className="frontpage-empty-cart">
                    Cart is empty.
                  </td>
                </tr>
              ) : (
                cartItems.filter(item => item && item.id).map((item, index) => (
                  <React.Fragment key={item.id}>
                    <tr>
                      <td>{tableNumber !== "N/A" ? tableNumber : index + 1}</td>
                      <td>
                        <div className="frontpage-cart-item-details">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="frontpage-cart-item-image"
                            onError={(e) => (e.target.src = "/static/images/default-item.jpg")}
                            onClick={() => handleCartItemClick(item)}
                          />
                          <span className="frontpage-cart-item-link" onClick={() => handleCartItemClick(item)}>
                            {item.item_name || item.name} {item.selectedSize && `(${item.selectedSize})`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="frontpage-cart-quantity-input"
                          value={item.quantity || 1}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value, "item")}
                          min="1"
                        />
                      </td>
                      <td>
                        {item.isCombo && item.originalBasePrice ? (
                          <>
                            <span className="strikethroughStyle">{formatPrice(item.originalBasePrice * item.quantity)}</span> {getPriceDisplay(item, true)}
                          </>
                        ) : item.originalBasePrice ? (
                          <>
                            <span className="strikethroughStyle">{formatPrice(getOriginalMainItemTotal(item))}</span> {getPriceDisplay(item, true)}
                          </>
                        ) : (
                          getPriceDisplay(item, true)
                        )}
                      </td>
                      {showKitchenColumn && <td>{item.kitchen || "Main Kitchen"}</td>}
                      <td>
                        <button className="frontpage-remove-btn" onClick={() => removeFromCart(item)}>
                          <i className="bi bi-x"></i>
                        </button>
                      </td>
                    </tr>
                    {/* Render sub-rows ONLY if NOT standalone addon/combo */}
                    {!item.isStandaloneAddon && !item.isStandaloneCombo && (
                      <>
                        {item.isCombo && item.comboItems && item.comboItems.map((comboItem, cIndex) => (
                          <tr key={`${item.id}-comboitem-${cIndex}`}>
                            <td></td>
                            <td>
                              <div className="frontpage-cart-item-details">
                                <img
                                  src={comboItem.image || "/placeholder.svg"}
                                  alt={comboItem.name}
                                  className="frontpage-cart-item-image"
                                  onError={(e) => (e.target.src = "/static/images/default-item.jpg")}
                                />
                                <span className="frontpage-cart-item-addon">{comboItem.name}</span>
                              </div>
                            </td>
                            <td>{item.quantity}</td>
                            <td>{getPriceDisplay(item, false, null, null, true)}</td>
                            {showKitchenColumn && <td>{comboItem.kitchen || "Main Kitchen"}</td>}
                            <td></td>
                          </tr>
                        ))}
                        {item.icePreference === "with_ice" && (
                          <tr>
                            <td></td>
                            <td>
                              <div className="frontpage-cart-item-option">Ice</div>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="frontpage-cart-quantity-input"
                                value={item.quantity || 1}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value, "item")}
                                min="1"
                              />
                            </td>
                            <td>{formatPrice((item.icePrice || 0) * (item.quantity || 1))}</td>
                            {showKitchenColumn && <td></td>}
                            <td>
                              <button
                                className="frontpage-remove-btn"
                                onClick={() => handleItemUpdate({ ...item, icePreference: "without_ice", icePrice: 0 })}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </td>
                          </tr>
                        )}
                        {item.isSpicy && (
                          <tr>
                            <td></td>
                            <td>
                              <div className="frontpage-cart-item-option">Spicy</div>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="frontpage-cart-quantity-input"
                                value={item.quantity || 1}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value, "item")}
                                min="1"
                              />
                            </td>
                            <td>{formatPrice((item.spicyPrice || 0) * (item.quantity || 1))}</td>
                            {showKitchenColumn && <td></td>}
                            <td>
                              <button
                                className="frontpage-remove-btn"
                                onClick={() => handleItemUpdate({ ...item, isSpicy: false, spicyPrice: 0 })}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </td>
                          </tr>
                        )}
                        {item.customVariantsDetails &&
                          Object.entries(item.customVariantsDetails).map(([variantName, variant]) => (
                            <tr key={`${item.id}-custom-${variantName}`}>
                              <td></td>
                              <td>
                                <div className="frontpage-cart-item-option">
                                  {variant.heading}: {variant.name}
                                </div>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="frontpage-cart-quantity-input"
                                  value={item.customVariantsQuantities?.[variantName] || 1}
                                  onChange={(e) =>
                                    handleQuantityChange(item.id, e.target.value, "customVariant", variantName)
                                  }
                                  min="1"
                                />
                              </td>
                              <td>{formatPrice((variant.price || 0) * (Number(item.customVariantsQuantities?.[variantName] || 1)) * (Number(item.quantity || 1)))}</td>
                              {showKitchenColumn && <td></td>}
                              <td>
                                <button
                                  className="frontpage-remove-btn"
                                  onClick={() => removeCustomVariant(item.id, variantName)}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        {item.addonQuantities &&
                          Object.entries(item.addonQuantities).map(
                            ([addonName, qty]) =>
                              Number(qty) > 0 && (
                                <React.Fragment key={`${item.id}-addon-${addonName}`}>
                                  <tr>
                                    <td></td>
                                    <td>
                                      <div className="frontpage-cart-item-details">
                                        <img
                                          src={item.addonImages ? item.addonImages[addonName] || "/static/images/default-addon-image.jpg" : "/static/images/default-addon-image.jpg"}
                                          alt={addonName}
                                          className="frontpage-cart-item-image"
                                          onError={(e) => (e.target.src = "/static/images/default-addon-image.jpg")}
                                        />
                                        <span className="frontpage-cart-item-addon">
                                          {addonName} ({item.addonVariants ? item.addonVariants[addonName]?.size || "M" : "M"})
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        className="frontpage-cart-quantity-input"
                                        value={qty}
                                        onChange={(e) => handleQuantityChange(item.id, e.target.value, "addon", addonName)}
                                        min="1"
                                      />
                                    </td>
                                    <td>{getPriceDisplay(item, false, addonName)}</td>
                                    {showKitchenColumn && (
                                      <td>{item.addonVariants ? item.addonVariants[addonName]?.kitchen || "Main Kitchen" : "Main Kitchen"}</td>
                                    )}
                                    <td>
                                      <button
                                        className="frontpage-remove-btn"
                                        onClick={() => removeAddonOrCombo(item.id, "addon", addonName)}
                                      >
                                        <i className="bi bi-x"></i>
                                      </button>
                                    </td>
                                  </tr>
                                  {item.addonVariants?.[addonName]?.cold === 'with_ice' && (
                                    <tr>
                                      <td></td>
                                      <td>
                                        <div className="frontpage-cart-item-option">{addonName} (Ice)</div>
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="frontpage-cart-quantity-input"
                                          value={qty}
                                          onChange={(e) =>
                                            handleQuantityChange(item.id, e.target.value, "addon", addonName)
                                          }
                                          min="1"
                                        />
                                      </td>
                                      <td>{formatPrice((item.addonIcePrices?.[addonName] || 0) * Number(qty || 1))}</td>
                                      {showKitchenColumn && <td></td>}
                                      <td>
                                        <button
                                          className="frontpage-remove-btn"
                                          onClick={() => {
                                            const updatedVariants = {
                                              ...item.addonVariants,
                                              [addonName]: { ...item.addonVariants[addonName], cold: 'without_ice' },
                                            }
                                            handleItemUpdate({
                                              ...item,
                                              addonVariants: updatedVariants,
                                              addonIcePrices: { ...item.addonIcePrices, [addonName]: 0 },
                                            })
                                          }}
                                        >
                                          <i className="bi bi-x"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  )}
                                  {item.addonVariants?.[addonName]?.spicy && (
                                    <tr>
                                      <td></td>
                                      <td>
                                        <div className="frontpage-cart-item-option">{addonName} (Spicy)</div>
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="frontpage-cart-quantity-input"
                                          value={qty}
                                          onChange={(e) =>
                                            handleQuantityChange(item.id, e.target.value, "addon", addonName)
                                          }
                                          min="1"
                                        />
                                      </td>
                                      <td>{formatPrice((item.addonSpicyPrices?.[addonName] || 0) * Number(qty || 1))}</td>
                                      {showKitchenColumn && <td></td>}
                                      <td>
                                        <button
                                          className="frontpage-remove-btn"
                                          onClick={() => {
                                            const updatedVariants = {
                                              ...item.addonVariants,
                                              [addonName]: { ...item.addonVariants[addonName], spicy: false },
                                            }
                                            handleItemUpdate({
                                              ...item,
                                              addonVariants: updatedVariants,
                                              addonSpicyPrices: { ...item.addonSpicyPrices, [addonName]: 0 },
                                            })
                                          }}
                                        >
                                          <i className="bi bi-x"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  )}
                                  {item.addonVariants?.[addonName]?.sugar &&
                                    item.addonVariants[addonName].sugar !== "medium" && (
                                      <tr>
                                        <td></td>
                                        <td>
                                          <div className="frontpage-cart-item-option">
                                            {addonName} (Sugar:{" "}
                                            {item.addonVariants[addonName].sugar.charAt(0).toUpperCase() +
                                              item.addonVariants[addonName].sugar.slice(1)}
                                            )
                                          </div>
                                        </td>
                                        <td>
                                          <input
                                            type="number"
                                            className="frontpage-cart-quantity-input"
                                            value={qty}
                                            onChange={(e) =>
                                              handleQuantityChange(item.id, e.target.value, "addon", addonName)
                                            }
                                            min="1"
                                          />
                                        </td>
                                        <td>{formatPrice(0)}</td> {/* UPDATED: Use formatPrice */}
                                        {showKitchenColumn && <td></td>}
                                        <td>
                                          <button
                                            className="frontpage-remove-btn"
                                            onClick={() => {
                                              const updatedVariants = {
                                                ...item.addonVariants,
                                                [addonName]: { ...item.addonVariants[addonName], sugar: "medium" },
                                              }
                                              handleItemUpdate({
                                                ...item,
                                                addonVariants: updatedVariants,
                                              })
                                            }}
                                          >
                                            <i className="bi bi-x"></i>
                                          </button>
                                        </td>
                                      </tr>
                                    )}
                                  {item.addonCustomVariantsDetails?.[addonName] &&
                                    Object.entries(item.addonCustomVariantsDetails[addonName]).map(
                                      ([variantName, variant]) => (
                                        <tr key={`${item.id}-addon-${addonName}-custom-${variantName}`}>
                                          <td></td>
                                          <td>
                                            <div className="frontpage-cart-item-option">
                                              {addonName} - {variant.heading}: {variant.name}
                                            </div>
                                          </td>
                                          <td>
                                            <input
                                              type="number"
                                              className="frontpage-cart-quantity-input"
                                              value={qty}
                                              onChange={(e) =>
                                                handleQuantityChange(item.id, e.target.value, "addon", addonName)
                                              }
                                              min="1"
                                            />
                                          </td>
                                          <td>{formatPrice((variant.price || 0) * Number(qty || 1))}</td>
                                          {showKitchenColumn && <td></td>}
                                          <td>
                                            <button
                                              className="frontpage-remove-btn"
                                              onClick={() => {
                                                const updatedDetails = { ...item.addonCustomVariantsDetails }
                                                delete updatedDetails[addonName][variantName]
                                                if (Object.keys(updatedDetails[addonName]).length === 0) {
                                                  delete updatedDetails[addonName]
                                                }
                                                handleItemUpdate({ ...item, addonCustomVariantsDetails: updatedDetails })
                                              }}
                                            >
                                              <i className="bi bi-x"></i>
                                            </button>
                                          </td>
                                        </tr>
                                      ),
                                    )}
                                </React.Fragment>
                              ),
                          )}
                        {item.comboQuantities &&
                          Object.entries(item.comboQuantities).map(
                            ([comboName, qty]) =>
                              Number(qty) > 0 && (
                                <React.Fragment key={`${item.id}-combo-${comboName}`}>
                                  <tr>
                                    <td></td>
                                    <td>
                                      <div className="frontpage-cart-item-details">
                                        <img
                                          src={item.comboImages ? item.comboImages[comboName] || "/static/images/default-combo-image.jpg" : "/static/images/default-combo-image.jpg"}
                                          alt={comboName}
                                          className="frontpage-cart-item-image"
                                          onError={(e) => (e.target.src = "/static/images/default-combo-image.jpg")}
                                        />
                                        <span className="frontpage-cart-item-addon">
                                          {comboName} ({item.comboVariants ? item.comboVariants[comboName]?.size || "M" : "M"})
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        className="frontpage-cart-quantity-input"
                                        value={qty}
                                        onChange={(e) => handleQuantityChange(item.id, e.target.value, "combo", comboName)}
                                        min="1"
                                      />
                                    </td>
                                    <td>{getPriceDisplay(item, false, null, comboName)}</td>
                                    {showKitchenColumn && (
                                      <td>{item.comboVariants ? item.comboVariants[comboName]?.kitchen || "Main Kitchen" : "Main Kitchen"}</td>
                                    )}
                                    <td>
                                      <button
                                        className="frontpage-remove-btn"
                                        onClick={() => removeAddonOrCombo(item.id, "combo", comboName)}
                                      >
                                        <i className="bi bi-x"></i>
                                      </button>
                                    </td>
                                  </tr>
                                  {item.comboVariants?.[comboName]?.cold === 'with_ice' && (
                                    <tr>
                                      <td></td>
                                      <td>
                                        <div className="frontpage-cart-item-option">{comboName} (Ice)</div>
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="frontpage-cart-quantity-input"
                                          value={qty}
                                          onChange={(e) =>
                                            handleQuantityChange(item.id, e.target.value, "combo", comboName)
                                          }
                                          min="1"
                                        />
                                      </td>
                                      <td>{formatPrice((item.comboIcePrices?.[comboName] || 0) * Number(qty || 1))}</td>
                                      {showKitchenColumn && <td></td>}
                                      <td>
                                        <button
                                          className="frontpage-remove-btn"
                                          onClick={() => {
                                            const updatedVariants = {
                                              ...item.comboVariants,
                                              [comboName]: { ...item.comboVariants[comboName], cold: 'without_ice' },
                                            }
                                            handleItemUpdate({
                                              ...item,
                                              comboVariants: updatedVariants,
                                              comboIcePrices: { ...item.comboIcePrices, [comboName]: 0 },
                                            })
                                          }}
                                        >
                                          <i className="bi bi-x"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  )}
                                  {item.comboVariants?.[comboName]?.spicy && (
                                    <tr>
                                      <td></td>
                                      <td>
                                        <div className="frontpage-cart-item-option">{comboName} (Spicy)</div>
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="frontpage-cart-quantity-input"
                                          value={qty}
                                          onChange={(e) =>
                                            handleQuantityChange(item.id, e.target.value, "combo", comboName)
                                          }
                                          min="1"
                                        />
                                      </td>
                                      <td>{formatPrice((item.comboSpicyPrices?.[comboName] || 0) * Number(qty || 1))}</td>
                                      {showKitchenColumn && <td></td>}
                                      <td>
                                        <button
                                          className="frontpage-remove-btn"
                                          onClick={() => {
                                            const updatedVariants = {
                                              ...item.comboVariants,
                                              [comboName]: { ...item.comboVariants[comboName], spicy: false },
                                            }
                                            handleItemUpdate({
                                              ...item,
                                              comboVariants: updatedVariants,
                                              comboSpicyPrices: { ...item.comboSpicyPrices, [comboName]: 0 },
                                            })
                                          }}
                                        >
                                          <i className="bi bi-x"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  )}
                                  {item.comboVariants?.[comboName]?.sugar &&
                                    item.comboVariants[comboName].sugar !== "medium" && (
                                      <tr>
                                        <td></td>
                                        <td>
                                          <div className="frontpage-cart-item-option">
                                            {comboName} (Sugar:{" "}
                                            {item.comboVariants[comboName].sugar.charAt(0).toUpperCase() +
                                              item.comboVariants[comboName].sugar.slice(1)}
                                            )
                                          </div>
                                        </td>
                                        <td>
                                          <input
                                            type="number"
                                            className="frontpage-cart-quantity-input"
                                            value={qty}
                                            onChange={(e) =>
                                              handleQuantityChange(item.id, e.target.value, "combo", comboName)
                                            }
                                            min="1"
                                          />
                                        </td>
                                        <td>{formatPrice(0)}</td> {/* UPDATED: Use formatPrice */}
                                        {showKitchenColumn && <td></td>}
                                        <td>
                                          <button
                                            className="frontpage-remove-btn"
                                            onClick={() => {
                                              const updatedVariants = {
                                                ...item.comboVariants,
                                                [comboName]: { ...item.comboVariants[comboName], sugar: "medium" },
                                              }
                                              handleItemUpdate({
                                                ...item,
                                                comboVariants: updatedVariants,
                                              })
                                            }}
                                          >
                                            <i className="bi bi-x"></i>
                                          </button>
                                        </td>
                                      </tr>
                                    )}
                                  {item.comboCustomVariantsDetails?.[comboName] &&
                                    Object.entries(item.comboCustomVariantsDetails[comboName]).map(
                                      ([variantName, variant]) => (
                                        <tr key={`${item.id}-combo-${comboName}-custom-${variantName}`}>
                                          <td></td>
                                          <td>
                                            <div className="frontpage-cart-item-option">
                                              {comboName} - {variant.heading}: {variant.name}
                                            </div>
                                          </td>
                                          <td>
                                            <input
                                              type="number"
                                              className="frontpage-cart-quantity-input"
                                              value={qty}
                                              onChange={(e) =>
                                                handleQuantityChange(item.id, e.target.value, "combo", comboName)
                                              }
                                              min="1"
                                            />
                                          </td>
                                          <td>{formatPrice((variant.price || 0) * Number(qty || 1))}</td>
                                          {showKitchenColumn && <td></td>}
                                          <td>
                                            <button
                                              className="frontpage-remove-btn"
                                              onClick={() => {
                                                const updatedDetails = { ...item.comboCustomVariantsDetails }
                                                delete updatedDetails[comboName][variantName]
                                                if (Object.keys(updatedDetails[comboName]).length === 0) {
                                                  delete updatedDetails[comboName]
                                                }
                                                handleItemUpdate({ ...item, comboCustomVariantsDetails: updatedDetails })
                                              }}
                                            >
                                              <i className="bi bi-x"></i>
                                            </button>
                                          </td>
                                        </tr>
                                      ),
                                    )}
                                </React.Fragment>
                              ),
                          )}
                      </>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="frontpage-billing-summary">
          <div className="frontpage-summary-row">
            <span>TOTAL QUANTITY:</span>
            <span>{cartItems.reduce((total, item) => total + (item?.quantity || 0), 0)}</span>
          </div>
          {cartItems.filter(item => item && item.originalBasePrice).map(item => (
            <div className="frontpage-summary-row" key={item.id}>
              <span>{item.name}:</span>
              <span>
                <span className="strikethroughStyle">{formatPrice(item.originalBasePrice * item.quantity)}</span> {getPriceDisplay(item, true)}
              </span>
            </div>
          ))}
          <div className="frontpage-summary-row">
            <span>Subtotal:</span>
            <span>{formatPrice(subtotal)}</span> {/* UPDATED: Use formatPrice */}
          </div>
          {Object.entries(vatByRate).map(([rate, amt]) => (
            <div key={rate} className="frontpage-summary-row vat">
              <span>VAT {rate}%:</span>
              <span>{formatPrice(amt)}</span>
            </div>
          ))}
          <div className="frontpage-summary-row vat">
            <span>Total VAT:</span>
            <span>{formatPrice(totalVat)}</span> {/* Show 0 if no VAT */}
          </div>
          <div className="frontpage-summary-row total">
            <span>Grand Total:</span>
            <span>{formatPrice(total)}</span> {/* UPDATED: Use formatPrice */}
          </div>
        </div>
        <div className="frontpage-action-buttons">
          <button className="frontpage-action-btn frontpage-btn-save" onClick={saveOrder}>
            SAVE
          </button>
          <button className="frontpage-action-btn frontpage-btn-cancel" onClick={cancelCart}>
            CANCEL
          </button>
          <button className="frontpage-action-btn frontpage-btn-pay" onClick={() => setShowPaymentModal(true)}>
            PAY
          </button>
        </div>
      </div>
      {warningMessage && (
        <div className={`frontpage-alert frontpage-alert-${warningType}`}>
          <span>{warningMessage}</span>
          {isConfirmation ? (
            <div>
              <button className="frontpage-alert-button" onClick={handleConfirmYes}>
                Pay
              </button>
              <button className="frontpage-alert-button" onClick={handleConfirmNo}>
                Pay Later
              </button>
            </div>
          ) : (
            <button className="frontpage-alert-button" onClick={handleWarningOk}>
              OK
            </button>
          )}
        </div>
      )}
      {showPaymentModal && (
        <div className="frontpage-modal-overlay">
          <div className="frontpage-modal-content">
            <div className="frontpage-modal-header">
              <h3 className="frontpage-modal-title">Select Payment Method</h3>
              <button className="frontpage-modal-close" onClick={() => setShowPaymentModal(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="frontpage-modal-body">
              <div className="frontpage-payment-options">
                <button className="frontpage-payment-btn frontpage-cash" onClick={() => handlePaymentSelection("CASH")}>
                  CASH
                </button>
                <button className="frontpage-payment-btn frontpage-card" onClick={() => handlePaymentSelection("CARD")}>
                  CARD
                </button>
                <button className="frontpage-payment-btn frontpage-upi" onClick={() => handlePaymentSelection("UPI")}>
                  UPI
                </button>
              </div>
            </div>
            <div className="frontpage-modal-footer">
              <button className="frontpage-modal-btn frontpage-cancel" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showGroupModal && (
        <div className="frontpage-modal-overlay">
          <div className="frontpage-modal-content">
            <div className="frontpage-modal-header">
              <h3 className="frontpage-modal-title">Add New Customer Group</h3>
              <button className="frontpage-modal-close" onClick={() => setShowGroupModal(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="frontpage-modal-body">
              <input
                type="text"
                className="frontpage-customer-input"
                placeholder="Enter Group Name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="frontpage-modal-footer">
              <button className="frontpage-modal-btn frontpage-save" onClick={handleCreateGroup}>
                Save
              </button>
              <button className="frontpage-modal-btn frontpage-cancel" onClick={() => setShowGroupModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedItem && (
        <FoodDetails
          item={selectedItem}
          cartItem={selectedCartItem}
          onClose={() => {
            setSelectedItem(null)
            setSelectedCartItem(null)
          }}
          onUpdate={handleItemUpdate}
        />
      )}
      {/* ── STYLES (Add these to your CSS file or inline if needed) ── */}
      <style jsx>{`
        /* Searchable Select Styles */
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
        /* Customer Input Group */
        .frontpage-input-group {
          position: relative;
          margin-bottom: 16px;
        }
        .frontpage-input-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: bold;
          color: #333;
        }
        .frontpage-customer-input {
          height: 42px;
          padding: 0 12px;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .frontpage-customer-input:focus {
          outline: none;
          border-color: #0056b3;
          box-shadow: 0 0 0 3px rgba(0,123,255,.2);
        }
        /* NEW: Copy Suggestion Styles (from CreateCustomerPage) */
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
        /* Phone Input Group Styles (for WhatsApp too) */
        .frontpage-phone-input-group {
          display: flex;
          height: 42px;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .frontpage-phone-prefix { position: relative; }
        .frontpage-isd-button {
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
        .frontpage-isd-button:hover { background: #f1f3f5; }
        .frontpage-isd-code-dropdown {
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
        .frontpage-isd-code-dropdown li {
          padding: 8px 14px;
          cursor: pointer;
          font-size: 13px;
        }
        .frontpage-isd-code-dropdown li:hover { background: #f8f9fa; }
        .frontpage-phone-input {
          flex: 1;
          padding: 0 12px;
          font-size: 13px;
          border: none;
        }
        .frontpage-phone-input:focus { outline: none; }
        .strikethroughStyle {
          text-decoration: line-through;
          color: #888;
        }
      `}</style>
    </div>
  )
}
export default FrontPage;