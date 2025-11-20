import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from 'xlsx'; // NEW: Import XLSX for browser compatibility
import {
  Container,
  Table,
  Card,
  Row,
  Col,
  Spinner,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./salespage.css";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaPrint, FaEnvelope, FaArrowLeft, FaFilePdf, FaFileExcel } from "react-icons/fa";
// Check if running in Electron environment
const isElectron = window && window.process && window.process.type;
const ipcRenderer = isElectron ? window.require("electron").ipcRenderer : null;
// Default print settings (used when no active settings fetched)
const defaultPrintSettings = {
  restaurantName: "Restaurant",
  street: "Kyle, calicut",
  city: "680003",
  pincode: "",
  phone: "9891608030",
  gstin: "32AAGCM5345G1Z4",
  thankYouMessage: "Thank You",
  poweredBy: "manoj"
};
const SalesPage = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true); // Start loading true
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");
  const [filterInvoiceNo, setFilterInvoiceNo] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterItem, setFilterItem] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterDeliveryPerson, setFilterDeliveryPerson] = useState(""); // NEW: Delivery Person filter state
  const [itemOptions, setItemOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [userList, setUserList] = useState([]);
  const [deliveryPersonOptions, setDeliveryPersonOptions] = useState([]); // NEW: Unique delivery persons from sales data
  const [itemSearch, setItemSearch] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [filterOrderType, setFilterOrderType] = useState("");
  // NEW: Offer filter states
  const [filterOffer, setFilterOffer] = useState("");
  const [offerOptions, setOfferOptions] = useState([]); // Unique offer descriptions from sales data
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const navigate = useNavigate();
  const [printSettings, setPrintSettings] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  // NEW: Add baseUrl state, initialize to null to indicate it hasn't been fetched
  const [baseUrl, setBaseUrl] = useState(null);
  // NEW: Add settings state for currency - Persistent across sessions and fetches
  const [settings, setSettings] = useState({
    currency: 'INR', // Default - will be overridden by fetch
    currencyPrecision: 2,
    language: 'en-IN',
    dateFormat: 'yyyy-long-mm-dd', // Default to match cash.jsx
    timeFormat: 'HH:mm:ss', // Default to match cash.jsx
    timeZone: 'Asia/Dubai', // Default
  });
  // NEW: Add currentTime state for real-time updates (like in cash.jsx)
  const [currentTime, setCurrentTime] = useState(new Date());
  const [columnOrder, setColumnOrder] = useState([
    { key: "invoice_no", label: "Invoice No", align: "left" },
    { key: "customer", label: "Customer", align: "left" },
    { key: "date", label: "Date", align: "center" },
    { key: "time", label: "Time", align: "center" },
    { key: "phoneNumber", label: "Phone Number", align: "center" },
    { key: "orderType", label: "Order Type", align: "center" },
    { key: "total", label: "Total", align: "right" },
    { key: "vat_amount", label: "VAT Amount", align: "right" },
    { key: "grand_total", label: "Grand Total", align: "right" },
    { key: "actions", label: "Actions", align: "center" },
  ]);
  // NEW: Column management states
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(0);
  // NEW: All possible columns (excluding actions)
  const possibleColumns = [
    { key: "invoice_no", label: "Invoice No", align: "left" },
    { key: "customer", label: "Customer", align: "left" },
    { key: "date", label: "Date", align: "center" },
    { key: "time", label: "Time", align: "center" },
    { key: "phoneNumber", label: "Phone Number", align: "center" },
    { key: "whatsappNumber", label: "WhatsApp Number", align: "center" },
    { key: "email", label: "Email", align: "left" },
    { key: "tableNumber", label: "Table Number", align: "center" },
    { key: "chairsBooked", label: "Chairs Booked", align: "center" },
    { key: "deliveryAddress", label: "Delivery Address", align: "left" },
    { key: "orderType", label: "Order Type", align: "center" },
    { key: "status", label: "Status", align: "center" },
    { key: "orderNo", label: "Order No", align: "center" },
    { key: "deliveryPersonName", label: "Delivery Person", align: "left" },
    { key: "userId", label: "User ID", align: "left" },
    { key: "payments_mode", label: "Payment Mode", align: "center" },
    { key: "due_date", label: "Due Date", align: "center" },
    { key: "total", label: "Total", align: "right" },
    { key: "vat_amount", label: "VAT Amount", align: "right" },
    { key: "grand_total", label: "Grand Total", align: "right" },
  ];
  // NEW: Update current time every second (like in cash.jsx)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  // NEW: useEffect to fetch network config and set baseUrl
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // This one URL can be static as it's the entry point for config
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:8000`);
        } else {
          setBaseUrl(""); // Server mode, use relative paths
        }
      } catch (error) {
        console.error("Failed to fetch config, defaulting to local:", error);
        setBaseUrl(""); // Default to relative/local if config fails
      }
    };
    fetchConfig();
  }, []);
  // NEW: Extract unique offer descriptions from sales data after fetching
  const extractOfferOptions = (sales) => {
    const offers = [];
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (item.is_combo_offer && item.offer_description) {
          offers.push(item.offer_description);
        }
      });
    });
    const uniqueOffers = [...new Set(offers)].sort(); // Sort alphabetically
    setOfferOptions(uniqueOffers);
  };
  // NEW: Extract unique delivery persons from sales data after fetching
  const extractDeliveryPersonOptions = (sales) => {
    const persons = [...new Set(sales.map((sale) => sale.deliveryPersonName).filter(Boolean))].sort();
    setDeliveryPersonOptions(persons);
  };
  // NEW: This useEffect now depends on `baseUrl`
  // It will run once `baseUrl` is set (from null to a string)
  useEffect(() => {
    // Wait until baseUrl is fetched
    if (baseUrl === null) {
      return;
    }
    const API_URL = baseUrl;
    // NEW: Fetch settings for currency - Persistent and re-fetch on changes
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/settings`);
        if (response.data) {
          // Merge with existing state to ensure defaults are preserved
          setSettings((prevSettings) => ({
            ...prevSettings,
            ...response.data,
            // Ensure defaults for missing fields
            currency: response.data.currency || 'INR',
            currencyPrecision: parseInt(response.data.currencyPrecision) || 2,
            language: response.data.language || 'en-IN',
            dateFormat: response.data.dateFormat || 'yyyy-long-mm-dd',
            timeFormat: response.data.timeFormat || 'HH:mm:ss',
            timeZone: response.data.timeZone || 'Asia/Dubai',
          }));
          // Also store in localStorage for persistence across refreshes
          localStorage.setItem('systemSettings', JSON.stringify(response.data));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        // On error, load from localStorage if available
        const stored = localStorage.getItem('systemSettings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings((prevSettings) => ({
            ...prevSettings,
            ...parsed,
            currency: parsed.currency || 'INR',
            currencyPrecision: parseInt(parsed.currencyPrecision) || 2,
            language: parsed.language || 'en-IN',
            dateFormat: parsed.dateFormat || 'yyyy-long-mm-dd',
            timeFormat: parsed.timeFormat || 'HH:mm:ss',
            timeZone: parsed.timeZone || 'Asia/Dubai',
          }));
        }
        // Keep default otherwise
      }
    };
    // --- Define all fetch functions inside this useEffect ---
    // So they can access the correct `API_URL` (which is the `baseUrl`)
    const fetchPrintSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/print_settings/active`);
        setPrintSettings(response.data);
      } catch (err) {
        console.error("Failed to fetch active print settings:", err);
        setPrintSettings(defaultPrintSettings);
      }
    };
    const fetchLogo = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/logo`);
        if (response.data.logo) {
          setLogoUrl(API_URL + response.data.logo);
        }
      } catch (err) {
        console.error("Failed to fetch logo for preview:", err);
        setLogoUrl(null);
      }
    };
    const fetchSalesData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/sales`); // Use API_URL
        const cleanedData = cleanData(response.data);
        setSalesData(cleanedData);
        console.log(
          "Order Types in Sales Data:",
          [...new Set(cleanedData.map((sale) => sale.orderType || "N/A"))]
        );
      } catch (err) {
        setError("Error fetching sales data: " + err.message);
      }
    };
    const fetchItemOptions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/items`); // Use API_URL
        if (response.data && Array.isArray(response.data)) {
          const items = response.data.map((item) => ({
            name: item.item_name,
            type: "Item",
            category: item.item_group || "N/A",
          }));
          const addons = response.data
            .flatMap((item) => item.addons || [])
            .map((addon) => ({
              name: addon.name1 || "",
              type: "Addon",
            }));
          const combos = response.data
            .flatMap((item) => item.combos || [])
            .map((combo) => ({
              name: combo.name1 || "",
              type: "Combo",
            }));
          const allOptions = [...items, ...addons, ...combos];
          const uniqueOptions = Array.from(
            new Map(allOptions.map((option) => [option.name, option])).values()
          );
          setItemOptions(uniqueOptions);
        }
      } catch (error) {
        console.error("Error fetching item options:", error);
      }
    };
    const fetchCategoryOptions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/items`); // Use API_URL
        if (response.data && Array.isArray(response.data)) {
          const categories = [...new Set(response.data.map((item) => item.item_group))].filter(
            (category) => category
          );
          setCategoryOptions(categories);
        }
      } catch (error) {
        console.error("Error fetching category options:", error);
      }
    };
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/users`); // Use API_URL
        if (response.data && Array.isArray(response.data)) {
          const bearers = response.data.filter((user) => user.role.toLowerCase() === "bearer");
          setUserList(bearers);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    // --- Main data fetching function ---
    const fetchAllData = async () => {
      // Set loading to true now that we are starting to fetch
      setLoading(true);
      try {
        await Promise.all([
          fetchSalesData(),
          fetchItemOptions(),
          fetchCategoryOptions(),
          fetchUsers(),
          fetchPrintSettings(),
          fetchLogo(),
          fetchSettings(), // NEW: Fetch settings for currency - First to ensure formatter is ready
        ]);
      } catch (err) {
        setError("Error fetching data: " + err.message);
      } finally {
        // Set loading to false after all fetches are done
        setLoading(false);
      }
    };
    fetchAllData();
  }, [baseUrl]); // This effect now runs when `baseUrl` changes
  // NEW: Extract offer options after salesData is updated
  useEffect(() => {
    if (salesData.length > 0) {
      extractOfferOptions(salesData);
      extractDeliveryPersonOptions(salesData); // NEW: Extract delivery persons
    }
  }, [salesData]);
  // NEW: Listen for settings changes (e.g., from SystemSettings) and re-fetch if needed
  useEffect(() => {
    const handleSettingsUpdate = () => {
      // Re-fetch settings to ensure latest from server/localStorage
      const API_URL = baseUrl || '';
      if (API_URL) {
        const fetchSettings = async () => {
          try {
            const response = await axios.get(`${API_URL}/api/settings`);
            if (response.data) {
              // Merge with existing state to ensure defaults are preserved
              setSettings((prevSettings) => ({
                ...prevSettings,
                ...response.data,
                // Ensure defaults for missing fields
                currency: response.data.currency || 'INR',
                currencyPrecision: parseInt(response.data.currencyPrecision) || 2,
                language: response.data.language || 'en-IN',
                dateFormat: response.data.dateFormat || 'yyyy-long-mm-dd',
                timeFormat: response.data.timeFormat || 'HH:mm:ss',
                timeZone: response.data.timeZone || 'Asia/Dubai',
              }));
              // Also store in localStorage for persistence across refreshes
              localStorage.setItem('systemSettings', JSON.stringify(response.data));
            }
          } catch (err) {
            console.error('Error fetching settings:', err);
            // On error, load from localStorage if available
            const stored = localStorage.getItem('systemSettings');
            if (stored) {
              const parsed = JSON.parse(stored);
              setSettings((prevSettings) => ({
                ...prevSettings,
                ...parsed,
                currency: parsed.currency || 'INR',
                currencyPrecision: parseInt(parsed.currencyPrecision) || 2,
                language: parsed.language || 'en-IN',
                dateFormat: parsed.dateFormat || 'yyyy-long-mm-dd',
                timeFormat: parsed.timeFormat || 'HH:mm:ss',
                timeZone: parsed.timeZone || 'Asia/Dubai',
              }));
            }
            // Keep default otherwise
          }
        };
        fetchSettings();
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('systemSettings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings((prevSettings) => ({
            ...prevSettings,
            ...parsed,
            currency: parsed.currency || 'INR',
            currencyPrecision: parseInt(parsed.currencyPrecision) || 2,
            language: parsed.language || 'en-IN',
            dateFormat: parsed.dateFormat || 'yyyy-long-mm-dd',
            timeFormat: parsed.timeFormat || 'HH:mm:ss',
            timeZone: parsed.timeZone || 'Asia/Dubai',
          }));
        }
      }
    };
    // Listen for custom events if SystemSettings dispatches them, or just re-fetch on interval
    const interval = setInterval(handleSettingsUpdate, 5000); // Poll every 5s for changes
    return () => clearInterval(interval);
  }, [baseUrl]);
  // NEW: Column management functions
  const addColumn = () => {
    const fieldKey = selectedFieldToAdd;
    if (!fieldKey) return;
    const field = possibleColumns.find(p => p.key === fieldKey);
    if (!field || columnOrder.some(c => c.key === field.key)) return;
    const pos = parseInt(selectedPosition);
    const newOrder = [...columnOrder];
    newOrder.splice(pos, 0, field);
    setColumnOrder(newOrder);
    setSelectedFieldToAdd('');
    setSelectedPosition(0);
    setWarningMessage(`Column "${field.label}" added successfully.`);
    setWarningType("success");
  };
  const removeColumn = (index) => {
    const newOrder = [...columnOrder];
    const removed = newOrder.splice(index, 1)[0];
    // If actions removed, add it back at the end
    if (removed && removed.key === "actions") {
      newOrder.push(removed);
    }
    setColumnOrder(newOrder);
    setWarningMessage(`Column "${removed.label}" removed successfully.`);
    setWarningType("warning");
  };
  // NEW: Currency formatter (same as cash.jsx) - Memoized for performance, now accepts optional params
  const getCurrencyFormatter = React.useCallback((invoiceCurrency = null, invoicePrecision = null) => {
    const locale = settings.language || 'en-IN'; // Use en-IN for INR defaults
    const currency = invoiceCurrency || settings.currency || 'INR'; // Default to INR as per request
    const precision = invoicePrecision !== null ? parseInt(invoicePrecision) : parseInt(settings.currencyPrecision) || 2;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  }, [settings.language, settings.currency, settings.currencyPrecision]);
  // UPDATED: Date formatter (matching cash.jsx) - Now handles both Date objects and strings
  const getFormattedDate = (dateInput, dateFormat = settings.dateFormat, timeZone = settings.timeZone) => {
    if (!dateInput) return '';
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return dateInput || ''; // Fallback
    }
    if (isNaN(date.getTime())) return dateInput || ''; // Fallback
    const tzOptions = { timeZone: timeZone || 'UTC' };
    const numericFormatter = new Intl.DateTimeFormat('en', { ...tzOptions, year: 'numeric', month: '2-digit', day: 'numeric' });
    const parts = numericFormatter.formatToParts(date);
    const year = parts.find((p) => p.type === 'year')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';
    switch (dateFormat) {
      case 'dd-mm-yyyy':
        return `${day.padStart(2, '0')}-${month}-${year}`;
      case 'mm-dd-yyyy':
        return `${month}-${day.padStart(2, '0')}-${year}`;
      case 'yyyy-mm-dd':
        return `${year}-${month}-${day.padStart(2, '0')}`;
      case 'dd/mm/yyyy':
        return `${day.padStart(2, '0')}/${month}/${year}`;
      case 'mm/dd/yyyy':
        return `${month}/${day.padStart(2, '0')}/${year}`;
      case 'yyyy/mm/dd':
        return `${year}/${month}/${day.padStart(2, '0')}`;
      case 'yyyy-long-mm-dd':
        return date.toLocaleDateString('en-US', {
          ...tzOptions,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      default:
        return date.toLocaleDateString('en-US', { ...tzOptions, year: 'numeric', month: 'long', day: 'numeric' });
    }
  };
  // UPDATED: Time formatter (matching cash.jsx) - Now handles both Date objects and strings
  const getFormattedTime = (timeInput, timeFormat = settings.timeFormat, timeZone = settings.timeZone) => {
    if (!timeInput) return '';
    let date;
    if (timeInput instanceof Date) {
      date = timeInput;
    } else if (typeof timeInput === 'string') {
      // Assume timeInput is like 'HH:mm:ss' or 'HH:mm'
      const [timePart, period] = timeInput.trim().split(' ');
      let fullDateStr;
      if (period && (period.toUpperCase() === 'AM' || period.toUpperCase() === 'PM')) {
        // Handle AM/PM if present
        let [hours, minutes, seconds = '00'] = timePart.split(':');
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        if (period.toUpperCase() === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
        fullDateStr = `2023-01-01T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds}:00.000Z`;
      } else {
        fullDateStr = `2023-01-01T${timeInput}:00.000Z`;
      }
      date = new Date(fullDateStr);
    } else {
      return timeInput || ''; // Fallback
    }
    if (isNaN(date.getTime())) return timeInput || ''; // Fallback
    const tzOptions = { timeZone: timeZone || 'UTC' };
    const hasSeconds = timeFormat.includes(':ss') || timeFormat.includes('ss');
    const is12Hour = timeFormat.includes(' a') || timeFormat.startsWith('hh');
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      ...(hasSeconds && { second: '2-digit' }),
      hour12: is12Hour,
      ...tzOptions,
    };
    return date.toLocaleTimeString('en-US', options);
  };
  // NEW: Helper to format delivery address in the specified order (single line for UI) - Matching Cash.jsx
  const formatDeliveryAddress = (deliveryAddress) => {
    if (!deliveryAddress) return null;
    const parts = [
      deliveryAddress.flat_villa_no || "",
      deliveryAddress.building_name || "",
      deliveryAddress.field3 || "",
      deliveryAddress.field2 || "",
      deliveryAddress.field1 || "",
      deliveryAddress.country || ""
    ].filter(part => part.trim() !== ""); // Filter out empty parts
    return parts.length > 0 ? parts.join(", ") : null;
  };
  // NEW: Helper to format delivery address for print (multi-line HTML) - Matching Cash.jsx
  const getPrintDeliveryAddressHtml = (deliveryAddress) => {
    if (!deliveryAddress) return null;
    const lines = [];
    // Line 1: flat_villa_no + building_name
    const line1 = [deliveryAddress.flat_villa_no, deliveryAddress.building_name].filter(Boolean).join(', ');
    if (line1) lines.push(line1);
    // Line 2: field3 + field2
    const line2 = [deliveryAddress.field3, deliveryAddress.field2].filter(Boolean).join(', ');
    if (line2) lines.push(line2);
    // Line 3: field1 + country
    const line3 = [deliveryAddress.field1, deliveryAddress.country].filter(Boolean).join(', ');
    if (line3) lines.push(line3);
    return lines.length > 0 ? lines.join('<br>') : null;
  };
  // NEW: Check if delivery address is available - Matching Cash.jsx
  const hasDeliveryAddress = (sale) => {
    if (!sale?.deliveryAddress) return false;
    return (
      sale.deliveryAddress.building_name ||
      sale.deliveryAddress.flat_villa_no ||
      sale.deliveryAddress.country ||
      sale.deliveryAddress.field1 ||
      sale.deliveryAddress.field2 ||
      sale.deliveryAddress.field3
    );
  };
  const cleanData = (data) => {
    if (!Array.isArray(data)) return [];
    const validOrderTypes = ["Dine In", "Takeaway", "Online Delivery"];
    const cleaned = data
      .filter((sale) => {
        const isValid =
          sale.items &&
          sale.items.length > 0 &&
          !isNaN(sale.grand_total) &&
          sale.grand_total !== null &&
          !isNaN(sale.total) &&
          sale.total !== null &&
          sale.invoice_no;
        if (isValid && sale.orderType && !validOrderTypes.includes(sale.orderType)) {
          console.warn(
            `Invalid orderType found: ${sale.orderType} for invoice ${sale.invoice_no}`
          );
        }
        return isValid;
      })
      .map((sale) => ({
        ...sale,
        chairsBooked: Array.isArray(sale.chairsBooked) ? sale.chairsBooked : [],
        orderType: sale.orderType || "N/A",
        userId: sale.userId || "N/A",
        // FIXED: Ensure date and time are formatted using current settings on load, but preserve original for historical display if needed
        date: getFormattedDate(sale.date),
        time: getFormattedTime(sale.time),
        // FIXED: For historical invoices, ensure invoice_currency defaults to 'INR' if not set (as per old data assumption)
        invoice_currency: sale.invoice_currency || 'INR', // Default to INR for old invoices without currency field
        invoice_currency_precision: sale.invoice_currency_precision || 2, // Default precision
        // NEW: Ensure deliveryAddress is preserved and structured correctly (fallback to empty object if missing)
        deliveryAddress: sale.deliveryAddress || {
          building_name: "",
          flat_villa_no: "",
          country: "",
          field1: "",
          field2: "",
          field3: "",
        },
      }));
    const invoiceNos = cleaned.map((sale) => sale.invoice_no);
    const duplicates = invoiceNos.filter(
      (no, index) => invoiceNos.indexOf(no) !== index
    );
    if (duplicates.length > 0) {
      console.warn("Duplicate invoice numbers found:", [...new Set(duplicates)]);
    }
    return cleaned;
  };
  const handleInvoiceClick = (invoiceId, sale) => {
    if (selectedInvoice === invoiceId) {
      setSelectedInvoice(null);
      setShowModal(false);
    } else {
      setSelectedInvoice(invoiceId);
      setInvoiceDetails(sale);
      setShowModal(true);
    }
  };
  // UPDATED: calculateItemPrices - Prioritize basePrice over amount for historical accuracy (matches Cash.jsx)
  const calculateItemPrices = (item) => {
    // FIXED: Prioritize basePrice to show correct item price (e.g., 300 instead of inflated amount)
    const baseAmount = parseFloat(item.basePrice) || parseFloat(item.amount) || 0;
    const addonTotal =
      item.addons && item.addons.length > 0
        ? item.addons.reduce(
          (sum, addon) =>
            sum +
            (parseFloat(addon.addon_price) || 0) * (addon.addon_quantity || 1),
          0
        )
        : 0;
    const comboTotal =
      item.selectedCombos && item.selectedCombos.length > 0
        ? item.selectedCombos.reduce(
          (sum, combo) =>
            sum +
            (parseFloat(combo.combo_price) || 0) * (combo.combo_quantity || 1),
          0
        )
        : 0;
    // Note: The user's original `calculateItemPrices` function returned `icePrice` and `spicyPrice`
    // but they weren't defined. I'm keeping the original logic, which also seems to be
    // used in `generatePrintableContent` without issue.
    // If these are needed, they should be calculated here.
    // For now, I will match the provided code.
    const totalAmount = baseAmount * (item.quantity || 1) + addonTotal + comboTotal;
    return { baseAmount, addonTotal, comboTotal, totalAmount };
  };
  // UPDATED: Get display name for item, with special handling for combo offers
  const getItemDisplayName = (item) => {
    if (item.is_combo_offer) {
      return `OFFER: ${item.offer_description || item.item_name}`;
    }
    return `${item.item_name}${item.selectedSize ? ` (${item.selectedSize})` : ""}`;
  };
  const formatTotal = (value) => {
    return Number(value).toFixed(2);
  };
  // UPDATED: Compute subtotal from item totals for consistency (matches Cash.jsx computed style)
  const calculateSubtotal = (sale) => {
    return sale.items.reduce((sum, item) => {
      const { totalAmount } = calculateItemPrices(item);
      return sum + totalAmount;
    }, 0);
  };
  // NEW: VAT breakdown helper (matching Cash.jsx) - Uses item.taxBreakdown if available
  const getVatByRate = (sale) => {
    const byRate = {};
    sale.items.forEach((item) => {
      if (item.taxBreakdown) {
        Object.entries(item.taxBreakdown).forEach(([rate, amt]) => {
          byRate[rate] = (byRate[rate] || 0) + parseFloat(amt || 0);
        });
      }
    });
    return byRate;
  };
  const calculateVAT = (sale) => {
    return parseFloat(sale.vat_amount) || 0;
  };
  // FIXED: Updated to compute grand total as subtotal + VAT for consistency (fixes display mismatch like 310 + 16 = 326 instead of using sale.grand_total=342)
  const calculateGrandTotal = (sale) => {
    return calculateSubtotal(sale) + calculateVAT(sale);
  };
  // FIXED: Format currency using invoice-specific formatter if available - Ensure historical invoices use their original currency
  const formatCurrency = (value, sale = null) => {
    if (sale && sale.invoice_currency) {
      // Use invoice-specific currency and precision for historical accuracy
      const formatter = getCurrencyFormatter(sale.invoice_currency, sale.invoice_currency_precision);
      return formatter.format(Number(value));
    }
    // Fallback to current settings for new invoices
    const formatter = getCurrencyFormatter();
    return formatter.format(Number(value));
  };
  // UPDATED: Generate printable receipt content - Now uses currentTime for date/time (like cash.jsx)
  // CORRECTED: Standardized padding, line-height, font-size to exactly match Cash.jsx for alignment
  // NEW: Handle combo offer display name
  // UPDATED: Full delivery address handling - multi-line HTML matching Cash.jsx
  // NEW: Added orderNo and deliveryPersonName display for Online Delivery in print
  // UPDATED: Added VAT breakdown rows (matching Cash.jsx)
  // FIXED: Use computed grandTotal = subtotal + vatAmount for consistency
  const generatePrintableContent = (sale, isPreview = false) => {
    if (!sale) return "";
    const subtotal = calculateSubtotal(sale);
    const vatAmount = calculateVAT(sale);
    const grandTotal = subtotal + vatAmount; // FIXED: Computed for consistency
    // FIXED: Calculate VAT rate for display (matching cash.jsx)
    const vatRate = subtotal > 0 ? (vatAmount / subtotal) : 0;
    // FIXED: Use invoice-specific formatter for historical accuracy in print
    const invoiceCurrency = sale.invoice_currency || settings.currency || 'INR';
    const invoicePrecision = sale.invoice_currency_precision || settings.currencyPrecision || 2;
    const formatter = getCurrencyFormatter(invoiceCurrency, invoicePrecision);
    // UPDATED: Full delivery address handling matching Cash.jsx
    const deliveryAddressHtml = getPrintDeliveryAddressHtml(sale.deliveryAddress);
    const hasDeliveryAddressFlag = hasDeliveryAddress(sale);
    const borderStyle = isPreview ? "border: none;" : "border: 1px solid #000000;";
    const effectivePrintSettings = printSettings || defaultPrintSettings;
    const restaurantName = effectivePrintSettings.restaurantName;
    const street = effectivePrintSettings.street;
    const city = effectivePrintSettings.city;
    const pincode = effectivePrintSettings.pincode;
    const address = `${street}${street ? ', ' : ''}${city}${pincode ? `, ${pincode}` : ''}`;
    const phone = effectivePrintSettings.phone;
    const gstin = effectivePrintSettings.gstin;
    const thankYouMessage = effectivePrintSettings.thankYouMessage;
    const poweredBy = effectivePrintSettings.poweredBy ? `Powered by ${effectivePrintSettings.poweredBy}` : "Powered by manoj";
    // FIXED: Use sale.date and sale.time (already formatted in cleanData) for historical accuracy
    const formattedDate = sale.date;
    const formattedTime = sale.time;
    // FIXED: Change returned calculation - ensure non-negative (matching cash.jsx behavior)
    const cashPayment = sale.payments?.[0];
    let cashGivenDisplay = "";
    if (cashPayment?.mode_of_payment === "CASH" && cashPayment?.amount) {
      const cashGiven = Number(cashPayment.amount);
      const changeReturned = Math.max(0, cashGiven - grandTotal); // FIXED: Non-negative change
      cashGivenDisplay = `
        <tr>
          <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Cash Given</td>
          <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
          <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(cashGiven)}</td>
        </tr>
        <tr>
          <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Change Returned</td>
          <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
          <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(changeReturned)}</td>
        </tr>
      `;
    }
    const offerRows = sale.items.filter(item => item.originalBasePrice).map(item => `
      <tr>
        <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${item.item_name}:</td>
        <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;"><span style="text-decoration: line-through;">${formatter.format((item.originalBasePrice * item.quantity))}</span> ${formatter.format((item.basePrice * item.quantity))}</td>
      </tr>
    `).join('');
    // NEW: VAT breakdown rows (matching Cash.jsx)
    const vatByRate = getVatByRate(sale);
    const vatRows = Object.entries(vatByRate).map(([rate, amt]) => `
      <tr>
        <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">VAT (${rate}%):</td>
        <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(amt)}</td>
      </tr>
    `).join('');
    // Fix for missing variables `icePrice` and `spicyPrice` from user's original `calculateItemPrices`
    // We'll look for them on the item object directly as `generatePrintableContent` does.
    // NEW: Updated item row to use getItemDisplayName which handles combo offers
    // NEW: Added orderNo and deliveryPersonName for Online Delivery
    const orderNoDisplay = sale.orderType === "Online Delivery" && sale.orderNo ? `
      <tr>
        <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Order No</td>
        <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
        <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${sale.orderNo}</td>
      </tr>
    ` : "";
    const deliveryPersonDisplay = sale.orderType === "Online Delivery" && sale.deliveryPersonName ? `
      <tr>
        <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Delivery Person</td>
        <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
        <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${sale.deliveryPersonName}</td>
      </tr>
    ` : "";
    return `
      <div style="font-family: Arial, sans-serif; width: 88mm; font-size: 12px; padding: 10px; color: #000000; ${borderStyle} box-sizing: border-box; line-height: 1.2;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
          ${logoUrl ? `<div style="flex: 0 0 auto;"><img src="${logoUrl}" alt="Logo" style="width: 30px; height: 30px; object-fit: contain; border-radius: 3px;"/></div>` : ''}
          <div style="flex: 1; text-align: right; font-family: Arial, sans-serif; font-size: 12px;">
            <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #000000;">${restaurantName}</h3>
            <p style="margin: 2px 0;">${address}</p>
            <p style="margin: 2px 0;">Phone: ${phone}</p>
            <p style="margin: 2px 0;">GSTIN: ${gstin}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px;">
          <tbody>
            <tr>
              <td style="width: 50%; text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Invoice No</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="width: 50%; text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; white-space: nowrap;">${sale.invoice_no}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Customer</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.customer || "N/A"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Phone</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.phoneNumber || "N/A"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Email</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.email || "N/A"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">WhatsApp</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.whatsappNumber || "N/A"}</td>
            </tr>
            ${
              sale.tableNumber && sale.tableNumber !== "N/A"
                ? `
                  <tr>
                    <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Table</td>
                    <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
                    <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.tableNumber}</td>
                  </tr>
                `
                : ""
            }
            ${orderNoDisplay}
            ${deliveryPersonDisplay}
            ${
              hasDeliveryAddressFlag && deliveryAddressHtml
                ? `
                  <tr>
                    <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; vertical-align: top;">Delivery Address</td>
                    <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
                    <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; white-space: pre-line; word-break: break-all;">${deliveryAddressHtml}</td>
                  </tr>
                `
                : ""
            }
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Payment Mode</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.payments?.[0]?.mode_of_payment || "CASH"}</td>
            </tr>
            ${cashGivenDisplay}
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Date</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; white-space: nowrap;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Time</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; white-space: nowrap;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Bearer</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.userId || "N/A"}</td>
            </tr>
          </tbody>
        </table>
        <table style="width: 100%; margin-bottom: 10px; border-collapse: collapse; border: 1px solid #000000; table-layout: fixed;">
          <thead>
            <tr style="border-bottom: 1px dashed #000000;">
              <th style="text-align: left; width: 40%; padding: 4px 8px; border: none; font-size: 12px; font-weight: bold;">Item</th>
              <th style="text-align: center; width: 15%; padding: 4px 8px; border: none; font-size: 12px; font-weight: bold;">Qty</th>
              <th style="text-align: right; width: 20%; padding: 4px 8px; border: none; font-size: 12px; font-weight: bold;">Price</th>
              <th style="text-align: right; width: 25%; padding: 4px 8px; border: none; font-size: 12px; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items
              .map((item) => {
                // Get baseAmount from calculateItemPrices
                const { baseAmount } = calculateItemPrices(item);
                // Get icePrice and spicyPrice from item object as they are not in calculateItemPrices
                const icePrice = parseFloat(item.ice_price) || 0;
                const spicyPrice = parseFloat(item.spicy_price) || 0;
                // NEW: Use updated display name for combo offers
                const displayName = getItemDisplayName(item);
                return `
                  <tr>
                    <td style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px; vertical-align: top;">${displayName}</td>
                    <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${item.quantity}</td>
                    <td style="text-align: right; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${formatter.format(baseAmount)}</td>
                    <td style="text-align: right; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${formatter.format(baseAmount * item.quantity)}</td>
                  </tr>
                  ${
                    item.icePreference === "with_ice" && icePrice > 0
                      ? `
                        <tr>
                          <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ Ice</td>
                          <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${item.quantity}</td>
                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(icePrice)}</td>
                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(icePrice * item.quantity)}</td>
                        </tr>
                      `
                      : ""
                  }
                  ${
                    item.isSpicy && spicyPrice > 0
                      ? `
                        <tr>
                          <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ Spicy</td>
                          <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${item.quantity}</td>
                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(spicyPrice)}</td>
                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(spicyPrice * item.quantity)}</td>
                        </tr>
                      `
                      : ""
                  }
                  ${
                    item.customVariantsDetails && Object.keys(item.customVariantsDetails).length > 0
                      ? Object.entries(item.customVariantsDetails)
                        .map(
                          ([variantName, variant]) => `
                            <tr>
                              <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ ${variant.heading}: ${variant.name}</td>
                              <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${item.customVariantsQuantities?.[variantName] || 1}</td>
                              <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(variant.price)}</td>
                              <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(variant.price * (item.customVariantsQuantities?.[variantName] || 1))}</td>
                            </tr>
                          `
                        )
                        .join("")
                      : ""
                  }
                  ${
                    item.addons && item.addons.length > 0
                      ? item.addons
                        .map(
                          (addon) =>
                            addon.addon_quantity > 0
                              ? `
                                <tr>
                                  <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ Addon: ${addon.addon_name}${addon.size ? ` (${addon.size})` : ""}</td>
                                  <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${addon.addon_quantity}</td>
                                  <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(addon.addon_price)}</td>
                                  <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(addon.addon_price * addon.addon_quantity)}</td>
                                </tr>
                                ${
                                  addon.isSpicy && addon.spicy_price > 0
                                    ? `
                                      <tr>
                                        <td style="text-align: left; padding: 2px 8px 2px 24px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px; color: #999; vertical-align: top;">+ Spicy</td>
                                        <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${addon.addon_quantity}</td>
                                        <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format(addon.spicy_price)}</td>
                                        <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format(addon.spicy_price * addon.addon_quantity)}</td>
                                      </tr>
                                    `
                                    : ""
                                }
                              `
                              : ""
                        )
                        .join("")
                      : ""
                  }
                  ${
                    item.selectedCombos && item.selectedCombos.length > 0
                      ? item.selectedCombos
                        .map(
                          (combo) =>
                            combo.combo_quantity > 0
                              ? `
                                <tr>
                                  <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ Combo: ${combo.name1}${combo.size ? ` (${combo.size})` : ""}</td>
                                  <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${combo.combo_quantity}</td>
                                  <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(combo.combo_price)}</td>
                                  <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(combo.combo_price * combo.combo_quantity)}</td>
                                </tr>
                                ${
                                  combo.isSpicy && combo.spicy_price > 0
                                    ? `
                                      <tr>
                                        <td style="text-align: left; padding: 2px 8px 2px 24px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px; color: #999; vertical-align: top;">+ Spicy</td>
                                        <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${combo.combo_quantity}</td>
                                        <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format(combo.spicy_price)}</td>
                                        <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format(combo.spicy_price * combo.combo_quantity)}</td>
                                      </tr>
                                    `
                                    : ""
                                }
                              `
                              : ""
                        )
                        .join("")
                      : ""
                  }
                `;
              })
              .join("")}
          </tbody>
        </table>
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px;">
          <tbody>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Total Quantity:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
            </tr>
            ${offerRows}
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; font-weight: bold;">Subtotal:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; font-weight: bold;">${formatter.format(subtotal)}</td>
            </tr>
            ${vatRows}
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Total VAT:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(vatAmount)}</td>
            </tr>
            <tr style="font-weight: bold; border-top: 2px solid #000;">
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 14px;">Grand Total:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 14px;">${formatter.format(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
        <div style="text-align: center; margin-top: 15px;">
          <p style="margin: 2px 0; font-size: 12px;">${thankYouMessage}</p>
          <p style="margin: 2px 0; font-size: 10px;">${poweredBy}</p>
        </div>
      </div>
    `;
  };
  // NEW: Generate printable report content for the entire filtered sales table (similar to SalesReport)
  const generateReportPrintableContent = (filteredSales, filterDescription = "All Sales Data") => {
    if (filteredSales.length === 0) return "";
    const effectivePrintSettings = printSettings || defaultPrintSettings;
    const restaurantName = effectivePrintSettings.restaurantName;
    const street = effectivePrintSettings.street;
    const city = effectivePrintSettings.city;
    const pincode = effectivePrintSettings.pincode;
    const address = `${street}${street ? ', ' : ''}${city}${pincode ? `, ${pincode}` : ''}`;
    const phone = effectivePrintSettings.phone;
    const gstin = effectivePrintSettings.gstin;
    const thankYouMessage = effectivePrintSettings.thankYouMessage;
    const poweredBy = effectivePrintSettings.poweredBy ? `Powered by ${effectivePrintSettings.poweredBy}` : "Powered by manoj";
    // Compute aggregates for print
    const { currencyTotals } = calculateAggregates(filteredSales, false, null);
    let rows = filteredSales.map((sale) => {
      const amounts = {
        subtotal: calculateSubtotal(sale),
        vat: calculateVAT(sale),
        grand: calculateGrandTotal(sale), // FIXED: Now uses computed grand total
      };
      return `
        <tr style="border-bottom: 1px solid #d3d3d3;">
          <td style="text-align: left; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${sale.invoice_no}</td>
          <td style="text-align: left; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${sale.customer || "N/A"}</td>
          <td style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${sale.date}</td>
          <td style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${sale.time}</td>
          <td style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${sale.payments?.[0]?.mode_of_payment || "CASH"}</td>
          <td style="text-align: right; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${formatCurrency(amounts.subtotal, sale)}</td>
          <td style="text-align: right; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${formatCurrency(amounts.vat, sale)}</td>
          <td style="text-align: right; padding: 8px; font-size: 12px;">${formatCurrency(amounts.grand, sale)}</td>
        </tr>
      `;
    }).join("");
    let tfoot = '';
    currencyTotals.forEach((totals, currency) => {
      const formatter = getCurrencyFormatter(currency, totals.precision);
      tfoot += `
        <tr style="border-top: 2px solid #000000;">
          <td colspan="5" style="text-align: right; padding: 8px; font-size: 12px; font-weight: bold;">${currency} Subtotal:</td>
          <td style="text-align: right; padding: 8px; font-size: 12px; font-weight: bold;">${formatter.format(totals.subtotal)}</td>
          <td style="text-align: right; padding: 8px; font-size: 12px; font-weight: bold;">${formatter.format(totals.vat)}</td>
          <td style="text-align: right; padding: 8px; font-size: 12px; font-weight: bold;">${formatter.format(totals.grand)}</td>
        </tr>
      `;
    });
    return `
      <div style="font-family: Arial, sans-serif; width: 210mm; font-size: 12px; padding: 20px; color: #000000; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #000000; padding-bottom: 10px;">
          ${logoUrl ? `<div style="flex: 0 0 auto;"><img src="${logoUrl}" alt="Logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 3px;"/></div>` : ''}
          <div style="flex: 1; text-align: right; font-family: Arial, sans-serif; font-size: 12px;">
            <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #000000;">${restaurantName}</h3>
            <p style="margin: 2px 0;">${address}</p>
            <p style="margin: 2px 0;">Phone: ${phone}</p>
            <p style="margin: 2px 0;">GSTIN: ${gstin}</p>
          </div>
        </div>
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0; font-size: 14px; text-align: center;">Sales Report - ${filterDescription}</h4>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f0f0f0; border-bottom: 2px solid #000000;">
              <th style="text-align: left; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Invoice No</th>
              <th style="text-align: left; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Customer</th>
              <th style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Date</th>
              <th style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Time</th>
              <th style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Mode of Payment</th>
              <th style="text-align: right; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Total</th>
              <th style="text-align: right; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">VAT</th>
              <th style="text-align: right; padding: 8px; font-size: 12px;">Grand Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            ${tfoot}
          </tfoot>
        </table>
        <div style="text-align: center; margin-top: 20px; border-top: 2px solid #000000; padding-top: 10px;">
          <p style="margin: 4px 0; font-size: 12px;">${thankYouMessage}</p>
          <p style="margin: 4px 0; font-size: 12px;">${poweredBy}</p>
        </div>
      </div>
    `;
  };
  // NEW: Helper to get filter description for report title
  const getFilterDescription = () => {
    const filters = [];
    if (fromDate) filters.push(`From ${getFormattedDate(fromDate, 'dd-MM-yyyy')}`);
    if (toDate) filters.push(`To ${getFormattedDate(toDate, 'dd-MM-yyyy')}`);
    if (filterStartTime) filters.push(`Start Time: ${filterStartTime}`);
    if (filterEndTime) filters.push(`End Time: ${filterEndTime}`);
    if (filterInvoiceNo) filters.push(`Invoice: ${filterInvoiceNo}`);
    if (filterCustomer) filters.push(`Customer: ${filterCustomer}`);
    if (filterPhone) filters.push(`Phone: ${filterPhone}`);
    if (filterItem) filters.push(`Item: ${filterItem}`);
    if (filterCategory) filters.push(`Category: ${filterCategory}`);
    if (filterOffer) filters.push(`Offer: ${filterOffer}`);
    if (filterDeliveryPerson) filters.push(`Delivery Person: ${filterDeliveryPerson}`);
    if (filterUser) filters.push(`User: ${filterUser}`);
    if (filterOrderType) filters.push(`Order Type: ${filterOrderType}`);
    return filters.length > 0 ? filters.join(', ') : 'All Sales Data';
  };
  // UPDATED: Export to Excel - Now uses imported XLSX, triggers download/save to system
  const handleExportExcel = () => {
    const wsData = filteredSales.map((sale) => {
      const amounts = {
        subtotal: calculateSubtotal(sale),
        vat: calculateVAT(sale),
        grand: calculateGrandTotal(sale), // FIXED: Uses computed grand total
      };
      return {
        'Invoice No': sale.invoice_no,
        'Customer': sale.customer || 'N/A',
        'Date': sale.date,
        'Time': sale.time,
        'Phone Number': sale.phoneNumber || 'N/A',
        'Order Type': sale.orderType || 'N/A',
        'Total': amounts.subtotal,
        'VAT Amount': amounts.vat,
        'Grand Total': amounts.grand,
        'Payment Mode': sale.payments?.[0]?.mode_of_payment || 'CASH',
      };
    });
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');
    const filterDesc = getFilterDescription().replace(/[, ]/g, '_');
    const fileName = `Sales_Report_${filterDesc}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName); // This triggers download/save to user's system
    setWarningMessage(`Excel exported successfully as ${fileName}!`);
    setWarningType("success");
  };
  // NEW: Export to PDF (similar to SalesReport)
  const handleExportPDF = () => {
    const filterDesc = getFilterDescription();
    const content = generateReportPrintableContent(filteredSales, filterDesc);
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Sales Report PDF</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 10mm; size: A4; }
            }
            body { margin: 0; font-family: Arial, sans-serif; }
            .print-preview-content {
              width: 210mm;
              font-size: 12px;
              padding: 20px;
              color: #000000;
              box-sizing: border-box;
            }
            .print-preview-content table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #000000;
            }
            .print-preview-content th,
            .print-preview-content td {
              padding: 8px;
              border-right: 1px solid #000000;
            }
            .print-preview-content th {
              background: #f0f0f0;
            }
          </style>
        </head>
        <body onload="window.print(); window.close()">
          ${content}
        </body>
      </html>
    `);
    win.document.close();
  };
  // NEW: Aggregate calculation helper (simplified from SalesReport for totals)
  const calculateAggregates = (sales) => {
    const currencyTotals = new Map();
    sales.forEach((sale) => {
      const amounts = {
        subtotal: calculateSubtotal(sale),
        vat: calculateVAT(sale),
        grand: calculateGrandTotal(sale), // FIXED: Uses computed grand total
      };
      const currency = sale.invoice_currency || settings.currency || 'INR';
      const precision = sale.invoice_currency_precision || settings.currencyPrecision || 2;
      if (!currencyTotals.has(currency)) {
        currencyTotals.set(currency, { subtotal: 0, vat: 0, grand: 0, precision });
      }
      const totals = currencyTotals.get(currency);
      totals.subtotal += amounts.subtotal;
      totals.vat += amounts.vat;
      totals.grand += amounts.grand;
    });
    return { currencyTotals: new Map([...currencyTotals.entries()]) };
  };
  const handlePrint = (sale) => {
    const content = generatePrintableContent(sale);
    if (isElectron && ipcRenderer) {
      ipcRenderer.send("open-print-preview", content);
      ipcRenderer.once("print-preview-response", (event, response) => {
        if (!response.success) {
          setWarningMessage("Print preview failed: " + response.error);
          setWarningType("warning");
        }
      });
    } else {
      const win = window.open("", "_blank");
      win.document.write(`
        <html>
          <head>
            <title>Receipt - Invoice ${sale.invoice_no}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 0; size: 88mm auto; }
              }
              body { margin: 0; font-family: Arial, sans-serif; }
              .print-preview-content {
                width: 88mm;
                font-size: 12px;
                padding: 10px;
                color: #000000;
                box-sizing: border-box;
                line-height: 1.2;
              }
              .print-preview-content table {
                width: 100%;
                border-collapse: collapse;
              }
              .print-preview-content th,
              .print-preview-content td {
                padding: 4px 8px;
                border: 1px solid #000000;
              }
              .print-preview-content th {
                background: #f8f9fa;
              }
            </style>
          </head>
          <body onload="window.print(); window.close()">
            ${content}
          </body>
        </html>
      `);
      win.document.close();
    }
  };
  const handleEmail = async (sale) => {
    // NEW: Check if baseUrl is set
    if (baseUrl === null) {
      setWarningMessage("System is not ready, please wait.");
      setWarningType("warning");
      return;
    }
    const htmlContent = generatePrintableContent(sale);
    const emailData = {
      to: sale.email || "manojmanoj.k@gmail.com",
      subject: `Invoice ${sale.invoice_no} - Restaurant`,
      html: htmlContent,
    };
    try {
      const response = await axios.post(
        `${baseUrl}/api/send-email`, // NEW: Use baseUrl
        emailData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.data.success) {
        setWarningMessage("Invoice emailed successfully!");
        setWarningType("success");
      } else {
        setWarningMessage("Failed to send email: " + response.data.message);
        setWarningType("warning");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setWarningMessage(
        "Error sending email: " +
        (error.response?.data?.message || error.message)
      );
      setWarningType("warning");
    }
  };
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    return parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
  };
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  };
  const isTimeInRange = (saleTime, startTime, endTime) => {
    if (!startTime && !endTime) return true;
    const saleMinutes = timeToMinutes(saleTime);
    const startMinutes = startTime ? timeToMinutes(startTime) : -Infinity;
    const endMinutes = endTime ? timeToMinutes(endTime) + 59 : Infinity; // Include full end hour
    return saleMinutes >= startMinutes && saleMinutes <= endMinutes;
  };
  const normalizeOrderType = (orderType) => {
    if (!orderType) return "";
    const normalized = orderType.trim().toLowerCase();
    const orderTypeMap = {
      "dine in": "Dine In",
      "dine-in": "Dine In",
      takeaway: "Takeaway",
      "take away": "Takeaway",
      "online delivery": "Online Delivery",
      delivery: "Online Delivery",
    };
    return orderTypeMap[normalized] || orderType;
  };
  const hourlyTimes = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });
  const handleItemSearch = (e) => {
    setItemSearch(e.target.value);
    setShowItemDropdown(true);
  };
  const handleItemSelect = (name) => {
    setFilterItem(name);
    setItemSearch(name);
    setShowItemDropdown(false);
  };
  const handleItemInputBlur = () => {
    setTimeout(() => setShowItemDropdown(false), 200);
  };
  const filteredItemOptions = itemOptions.filter((option) =>
    option.name.toLowerCase().includes(itemSearch.toLowerCase())
  );
  const filteredSales = salesData.filter((sale) => {
    const saleDate = parseDate(sale.date);
    const from = fromDate ? new Date(fromDate.setHours(0, 0, 0, 0)) : null; // Start of day
    const to = toDate ? new Date(toDate.setHours(23, 59, 59, 999)) : null; // End of day
    const dateMatch =
      (!from && !to) ||
      (from && !to && saleDate && saleDate >= from) ||
      (!from && to && saleDate && saleDate <= to) || // Handle only 'To Date'
      (from && to && saleDate && saleDate >= from && saleDate <= to);
    const timeMatch = isTimeInRange(sale.time, filterStartTime, filterEndTime);
    const invoiceMatch = filterInvoiceNo
      ? sale.invoice_no.toLowerCase().includes(filterInvoiceNo.toLowerCase())
      : true;
    const customerMatch = filterCustomer
      ? sale.customer?.toLowerCase().includes(filterCustomer.toLowerCase())
      : true;
    const phoneMatch = filterPhone
      ? sale.phoneNumber?.toLowerCase().includes(filterPhone.toLowerCase())
      : true;
    const itemMatch = filterItem
      ? sale.items.some((item) => {
        const itemNameMatch = item.item_name
          .toLowerCase()
          .includes(filterItem.toLowerCase());
        const addonMatch =
          item.addons &&
          item.addons.some((addon) =>
            addon.addon_name.toLowerCase().includes(filterItem.toLowerCase())
          );
        const comboMatch =
          item.selectedCombos &&
          item.selectedCombos.some((combo) =>
            combo.name1.toLowerCase().includes(filterItem.toLowerCase())
          );
        return itemNameMatch || addonMatch || comboMatch;
      })
      : true;
    const categoryMatch = filterCategory
      ? sale.items.some((item) => {
        const itemCategory = itemOptions.find(
          (option) => option.name === item.item_name
        )?.category;
        return itemCategory === filterCategory;
      })
      : true;
    const userMatch = filterUser
      ? sale.userId === filterUser
      : true;
    const orderTypeMatch = filterOrderType
      ? normalizeOrderType(sale.orderType).toLowerCase() ===
      normalizeOrderType(filterOrderType).toLowerCase()
      : true;
    // NEW: Offer match logic - Check if any item in the sale has is_combo_offer: true and offer_description matches filterOffer
    const offerMatch = filterOffer
      ? sale.items.some((item) => item.is_combo_offer && item.offer_description === filterOffer)
      : true;
    // NEW: Delivery Person match logic
    const deliveryPersonMatch = filterDeliveryPerson
      ? sale.deliveryPersonName === filterDeliveryPerson
      : true;
    return (
      dateMatch &&
      timeMatch &&
      invoiceMatch &&
      customerMatch &&
      phoneMatch &&
      itemMatch &&
      categoryMatch &&
      userMatch &&
      orderTypeMatch &&
      offerMatch && // NEW: Include offer filter
      deliveryPersonMatch // NEW: Include delivery person filter
    );
  });
  // NEW: Updated back button logic
  const handleBack = () => {
    navigate(-1); // This will go back to the previous page in history
  };
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
    e.target.classList.add("dragging");
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    const target = e.target.closest("th");
    if(target) {
      target.classList.add("drag-over");
    }
  };
  const handleDragLeave = (e) => {
    const target = e.target.closest("th");
    if(target) {
      target.classList.remove("drag-over");
    }
  };
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const newOrder = [...columnOrder];
    const [draggedColumn] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);
    setColumnOrder(newOrder);
    document.querySelectorAll(".table-header th").forEach((th) => {
      th.classList.remove("drag-over");
      th.classList.remove("dragging");
    });
  };
  const handleDragEnd = (e) => {
    document.querySelectorAll(".table-header th").forEach((th) => {
      th.classList.remove("drag-over");
      th.classList.remove("dragging");
    });
  };
  // NEW: Get formatter instance (memoized to avoid recreating on every render)
  const formatter = getCurrencyFormatter();
  // UPDATED: For modal, compute formatted delivery address
  const formattedDeliveryAddress = invoiceDetails ? formatDeliveryAddress(invoiceDetails.deliveryAddress) : null;
  // NEW: Helper to get grand total style - green if Delivered
  const getGrandTotalStyle = (sale) => {
    return sale.status === 'Delivered' ? { color: 'green', fontWeight: 'bold' } : {};
  };
  if (loading || baseUrl === null) // Show loading while fetching config or data
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" style={{ color: "#3498db" }} />
        <p>Loading...</p>
      </Container>
    );
  if (error) return <div className="alert alert-danger m-4">{error}</div>;
  // This check should only happen after loading is false
  if (salesData.length === 0)
    return (
      <Container className="sales-page-container mt-4">
        <div className="mb-4 d-flex justify-content-between">
          <Button variant="outline-primary" onClick={handleBack} className="back-btn">
            <FaArrowLeft /> Back
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowColumnModal(true)} className="back-btn">
            Manage Columns
          </Button>
        </div>
        <div className="text-center mt-5" style={{ color: "#000000" }}>
          No sales data available.
        </div>
      </Container>
    );
  return (
    <Container className="mt-4 sales-page-container">
      {warningMessage && (
        <div
          className={`alert alert-${warningType} text-center alert-dismissible fade show`}
          role="alert"
        >
          {warningMessage}
          <button
            type="button"
            className="btn btn-primary ms-3"
            onClick={() => setWarningMessage("")}
          >
            OK
          </button>
        </div>
      )}
      <div className="mb-4 d-flex justify-content-between flex-wrap gap-2">
        <Button variant="outline-primary" onClick={handleBack} className="back-btn">
          <FaArrowLeft /> Back
        </Button>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handleExportExcel} className="back-btn">
            <FaFileExcel /> Export Excel
          </Button>
          <Button variant="danger" onClick={handleExportPDF} className="back-btn">
            <FaFilePdf /> Export PDF
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowColumnModal(true)} className="back-btn">
            Manage Columns
          </Button>
        </div>
      </div>
      <Form.Group className="mb-4 filter-group d-flex flex-wrap gap-3">
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">From Date:</Form.Label>
          <DatePicker
            selected={fromDate}
            onChange={(date) => setFromDate(date)}
            dateFormat="dd-MM-yyyy"
            className="form-control shadow-sm"
          />
        </div>
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">To Date:</Form.Label>
          <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            dateFormat="dd-MM-yyyy"
            className="form-control shadow-sm"
            minDate={fromDate}
          />
        </div>
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">Start Time:</Form.Label>
          <Form.Select
            value={filterStartTime}
            onChange={(e) => setFilterStartTime(e.target.value)}
            className="form-control shadow-sm time-dropdown"
          >
            <option value="">Select Start Time</option>
            {hourlyTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">End Time:</Form.Label>
          <Form.Select
            value={filterEndTime}
            onChange={(e) => setFilterEndTime(e.target.value)}
            className="form-control shadow-sm time-dropdown"
          >
            <option value="">Select End Time</option>
            {hourlyTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">Invoice No:</Form.Label>
          <Form.Control
            type="text"
            value={filterInvoiceNo}
            onChange={(e) => setFilterInvoiceNo(e.target.value)}
            placeholder="Filter by invoice no"
            className="shadow-sm"
          />
        </div>
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">Customer Name:</Form.Label>
          <Form.Control
            type="text"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            placeholder="Filter by customer"
            className="shadow-sm"
          />
        </div>
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">Phone Number:</Form.Label>
          <Form.Control
            type="text"
            value={filterPhone}
            onChange={(e) => setFilterPhone(e.target.value)}
            placeholder="Filter by phone"
            className="shadow-sm"
          />
        </div>
        <div className="filter-item position-relative" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">Item Name:</Form.Label>
          <Form.Control
            type="text"
            value={itemSearch}
            onChange={handleItemSearch}
            onFocus={() => setShowItemDropdown(true)}
            onBlur={handleItemInputBlur}
            placeholder="Filter by item name"
            className="shadow-sm"
          />
          {showItemDropdown && (
            <div className="item-dropdown">
              {filteredItemOptions.length > 0 ? (
                filteredItemOptions.map((option, index) => (
                  <div
                    key={index}
                    className="item-option"
                    onMouseDown={() => handleItemSelect(option.name)}
                  >
                    {option.name} ({option.type})
                  </div>
                ))
              ) : (
                <div className="item-option">No items found</div>
              )}
            </div>
          )}
        </div>
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">Category:</Form.Label>
          <Form.Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="form-control shadow-sm"
          >
            <option value="">All Categories</option>
            {categoryOptions.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </Form.Select>
        </div>
        {/* NEW: Offer Name Filter Dropdown */}
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">Offer Name:</Form.Label>
          <Form.Select
            value={filterOffer}
            onChange={(e) => setFilterOffer(e.target.value)}
            className="form-control shadow-sm"
          >
            <option value="">All Offers</option>
            {offerOptions.map((offer, index) => (
              <option key={index} value={offer}>
                {offer}
              </option>
            ))}
          </Form.Select>
        </div>
        {/* NEW: Delivery Person Filter Dropdown */}
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">Delivery Person:</Form.Label>
          <Form.Select
            value={filterDeliveryPerson}
            onChange={(e) => setFilterDeliveryPerson(e.target.value)}
            className="form-control shadow-sm"
          >
            <option value="">All Delivery Persons</option>
            {deliveryPersonOptions.map((person, index) => (
              <option key={index} value={person}>
                {person}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">Bearer:</Form.Label>
          <Form.Select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="form-control shadow-sm"
          >
            <option value="">All Bearers</option>
            {userList.map((user, index) => (
              <option key={index} value={user.email}>
                {user.firstName || user.email}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="filter-item" style={{ minWidth: '180px', maxWidth: '200px', flex: '1 1 auto' }}>
          <Form.Label className="fw-bold">Order Type:</Form.Label>
          <Form.Select
            value={filterOrderType}
            onChange={(e) => setFilterOrderType(e.target.value)}
            className="form-control shadow-sm"
          >
            <option value="">All Order Types</option>
            <option value="Dine In">Dine In</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Online Delivery">Online Delivery</option>
          </Form.Select>
        </div>
      </Form.Group>
      <Row>
        <Col>
          <Card className="shadow-lg sales-card">
            <Card.Body>
              <Card.Title className="text-primary fw-bold mb-4">
                {fromDate ||
                  toDate ||
                  filterStartTime ||
                  filterEndTime ||
                  filterInvoiceNo ||
                  filterCustomer ||
                  filterPhone ||
                  filterItem ||
                  filterCategory ||
                  filterOffer ||
                  filterDeliveryPerson || // NEW: Include delivery person in title check
                  filterUser ||
                  filterOrderType
                  ? "Filtered Sales Data"
                  : "All Sales Data"}
              </Card.Title>
              {filteredSales.length === 0 ? (
                <div className="text-center" style={{ color: "#000000" }}>
                  No sales match the selected filters.
                </div>
              ) : (
                <Table responsive bordered striped hover className="sales-table">
                  <thead className="table-header">
                    <tr>
                      {columnOrder.map((col, index) => (
                        <th
                          key={col.key}
                          style={{ textAlign: col.align }}
                          draggable={col.key !== "actions"}
                          onDragStart={(e) =>
                            col.key !== "actions" && handleDragStart(e, index)
                          }
                          onDragOver={(e) => col.key !== "actions" && handleDragOver(e)}
                          onDragLeave={(e) => col.key !== "actions" && handleDragLeave(e)}
                          onDrop={(e) => col.key !== "actions" && handleDrop(e, index)}
                          onDragEnd={(e) => col.key !== "actions" && handleDragEnd(e)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (col.key === "actions") return;
                            // UPDATED: No confirm, directly remove and show warning
                            removeColumn(index);
                          }}
                          className={col.key !== "actions" ? "draggable-header" : ""}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr
                        key={sale._id}
                        onClick={() => handleInvoiceClick(sale._id, sale)}
                        className="table-row"
                        style={{ cursor: "pointer" }}
                      >
                        {columnOrder.map((col) => (
                          <td key={col.key} style={{ textAlign: col.align }}>
                            {col.key === "invoice_no" && sale.invoice_no}
                            {col.key === "customer" && sale.customer}
                            {col.key === "date" && sale.date}
                            {col.key === "time" && sale.time}
                            {col.key === "phoneNumber" && (sale.phoneNumber || "N/A")}
                            {col.key === "whatsappNumber" && (sale.whatsappNumber || "N/A")}
                            {col.key === "email" && (sale.email || "N/A")}
                            {col.key === "tableNumber" && (sale.tableNumber || "N/A")}
                            {col.key === "chairsBooked" && (Array.isArray(sale.chairsBooked) ? sale.chairsBooked.length : 0)}
                            {col.key === "deliveryAddress" && (formatDeliveryAddress(sale.deliveryAddress) || "N/A")}
                            {col.key === "orderType" && (sale.orderType || "N/A")}
                            {col.key === "status" && <span style={{ color: sale.status === 'Delivered' ? 'green' : 'inherit' }}>{sale.status || "N/A"}</span>}
                            {col.key === "orderNo" && (sale.orderNo || "N/A")}
                            {col.key === "deliveryPersonName" && (sale.deliveryPersonName || "N/A")}
                            {col.key === "userId" && (sale.userId || "N/A")}
                            {col.key === "payments_mode" && (sale.payments?.[0]?.mode_of_payment || "N/A")}
                            {col.key === "due_date" && (sale.payment_terms?.[0]?.due_date || "N/A")}
                            {col.key === "total" && formatCurrency(calculateSubtotal(sale), sale)} {/* FIXED: Pass sale for historical currency */}
                            {col.key === "vat_amount" && formatCurrency(calculateVAT(sale), sale)} {/* FIXED: Pass sale */}
                            {col.key === "grand_total" &&
                              <span style={getGrandTotalStyle(sale)}>
                                {formatCurrency(calculateGrandTotal(sale), sale)} {/* FIXED: Now uses computed grand total, green if Delivered */}
                              </span>
                            }
                            {col.key === "actions" && (
                              <div className="d-flex flex-column flex-sm-row gap-1">
                                <Button
                                  size="sm"
                                  className="action-btn flex-fill"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(sale);
                                  }}
                                >
                                  <FaPrint /> Print
                                </Button>
                                <Button
                                  size="sm"
                                  className="action-btn flex-fill"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEmail(sale);
                                  }}
                                >
                                  <FaEnvelope /> Email
                                </Button>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* UPDATED: Modal now mirrors Cash.jsx structure - Detailed table with delivery address, items, totals */}
      {/* NEW: Added orderNo and deliveryPersonName rows for Online Delivery */}
      {/* UPDATED: Grand total green if Delivered */}
      {/* UPDATED: Added VAT breakdown rows matching Cash.jsx */}
      {/* FIXED: Grand total now computed as subtotal + VAT for consistency */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Invoice Details - {invoiceDetails?.invoice_no}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {invoiceDetails && (
            <div>
              {/* UPDATED: Email input like Cash.jsx (pre-filled, editable) */}
              <div className="mb-3">
                <label className="form-label fw-bold">Email Receipt To:</label>
                <input
                  type="email"
                  className="form-control"
                  value={invoiceDetails.email || ""}
                  onChange={(e) => {
                    // Optional: Update local state if needed, but for now just display
                  }}
                  placeholder="Enter email address"
                />
              </div>
              {/* UPDATED: Customer info table matching Cash.jsx */}
              <table className="table table-bordered mb-3">
                <tbody>
                  <tr>
                    <td style={{ width: "50%", textAlign: "left" }}>
                      <strong>Invoice No:</strong>
                    </td>
                    <td style={{ width: "50%", textAlign: "right", whiteSpace: "nowrap" }}>{invoiceDetails.invoice_no}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Customer:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{invoiceDetails.customer}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Phone:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{invoiceDetails.phoneNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Email:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{invoiceDetails.email}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>WhatsApp:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{invoiceDetails.whatsappNumber}</td>
                  </tr>
                  {invoiceDetails.tableNumber && invoiceDetails.tableNumber !== "N/A" && (
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Table:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{invoiceDetails.tableNumber}</td>
                    </tr>
                  )}
                  {/* NEW: Order No for Online Delivery */}
                  {invoiceDetails.orderType === "Online Delivery" && invoiceDetails.orderNo && (
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Order No:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{invoiceDetails.orderNo}</td>
                    </tr>
                  )}
                  {/* NEW: Delivery Person Name for Online Delivery */}
                  {invoiceDetails.orderType === "Online Delivery" && invoiceDetails.deliveryPersonName && (
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Delivery Person:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{invoiceDetails.deliveryPersonName}</td>
                    </tr>
                  )}
                  {/* NEW: Delivery address row matching Cash.jsx */}
                  {hasDeliveryAddress(invoiceDetails) && formattedDeliveryAddress && (
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Delivery Address:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{formattedDeliveryAddress}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Payment Mode:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{invoiceDetails.payments?.[0]?.mode_of_payment || "CASH"}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Date:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{getFormattedDate(currentTime, settings.dateFormat)}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Time:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{getFormattedTime(currentTime, settings.timeFormat)}</td>
                  </tr>
                </tbody>
              </table>
              {/* UPDATED: Items table matching Cash.jsx */}
              <h5 className="mb-3">Items:</h5>
              <div className="table-responsive">
                <table className="table table-striped table-bordered" style={{ fontSize: "13px", color: "black", fontWeight: "bold" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>T.No.</th>
                      <th>Item Details</th>
                      <th style={{ width: "80px" }}>Qty</th>
                      <th style={{ width: "80px" }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceDetails.items.map((item, index) => {
                      const { baseAmount, icePrice = parseFloat(item.ice_price) || 0, spicyPrice = parseFloat(item.spicy_price) || 0 } = calculateItemPrices(item);
                      return (
                        <React.Fragment key={index}>
                          <tr>
                            <td>{invoiceDetails.tableNumber || "N/A"}</td>
                            <td>
                              <strong>{getItemDisplayName(item)}</strong>
                            </td>
                            <td>{item.quantity}</td>
                            <td>
                              {item.originalBasePrice ? (
                                <>
                                  <span style={{ textDecoration: "line-through" }}>{formatCurrency(item.originalBasePrice, invoiceDetails)}</span> {formatCurrency(baseAmount, invoiceDetails)}
                                </>
                              ) : (
                                formatCurrency(baseAmount, invoiceDetails)
                              )}
                            </td>
                          </tr>
                          {item.isCombo && item.comboItems && item.comboItems.map((comboItem, cIndex) => (
                            <tr key={`${index}-combo-${cIndex}`}>
                              <td></td>
                              <td>
                                <div style={{ fontSize: "12px", color: "#666" }}>+ {comboItem.name}</div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(comboItem.price, invoiceDetails)}</td>
                            </tr>
                          ))}
                          {item.icePreference === "with_ice" && icePrice > 0 && (
                            <tr>
                              <td></td>
                              <td>
                                <div style={{ fontSize: "12px", color: "#666" }}>+ Ice ({formatCurrency(icePrice, invoiceDetails)})</div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(icePrice * item.quantity, invoiceDetails)}</td>
                            </tr>
                          )}
                          {item.isSpicy && spicyPrice > 0 && (
                            <tr>
                              <td></td>
                              <td>
                                <div style={{ fontSize: "12px", color: "#666" }}>+ Spicy ({formatCurrency(spicyPrice, invoiceDetails)})</div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(spicyPrice * item.quantity, invoiceDetails)}</td>
                            </tr>
                          )}
                          {item.customVariantsDetails &&
                            Object.keys(item.customVariantsDetails).length > 0 &&
                            Object.entries(item.customVariantsDetails).map(([variantName, variant], idx) => (
                              <tr key={`${index}-custom-${idx}`}>
                                <td></td>
                                <td>
                                  <div style={{ color: "#888", fontSize: "12px" }}>
                                    + {variant.heading}: {variant.name} ({formatCurrency(variant.price, invoiceDetails)})
                                  </div>
                                </td>
                                <td>{item.customVariantsQuantities?.[variantName] || 1}</td>
                                <td>{formatCurrency(variant.price * (item.customVariantsQuantities?.[variantName] || 1), invoiceDetails)}</td>
                              </tr>
                            ))}
                          {item.addons &&
                            item.addons.map(
                              (addon, idx) =>
                                addon.addon_quantity > 0 && (
                                  <React.Fragment key={`${index}-addon-${idx}`}>
                                    <tr>
                                      <td></td>
                                      <td>
                                        <div style={{ color: "#2ecc71", fontSize: "12px" }}>
                                          + Addon: {addon.addon_name}{addon.size ? ` (${addon.size})` : ""}
                                        </div>
                                      </td>
                                      <td>{addon.addon_quantity}</td>
                                      <td>{formatCurrency(addon.addon_price * addon.addon_quantity, invoiceDetails)}</td>
                                    </tr>
                                    {addon.isSpicy && addon.spicy_price > 0 && (
                                      <tr>
                                        <td></td>
                                        <td>
                                          <div style={{ color: "#888", fontSize: "12px" }}>
                                            + Spicy ({formatCurrency(addon.spicy_price, invoiceDetails)})
                                          </div>
                                        </td>
                                        <td>{addon.addon_quantity}</td>
                                        <td>{formatCurrency(addon.spicy_price * addon.addon_quantity, invoiceDetails)}</td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )
                            )}
                          {item.combos &&
                            item.combos.map(
                              (combo, idx) =>
                                combo.combo_quantity > 0 && (
                                  <React.Fragment key={`${index}-combo-${idx}`}>
                                    <tr>
                                      <td></td>
                                      <td>
                                        <div style={{ color: "#e74c3c", fontSize: "12px" }}>
                                          + Combo: {combo.name1}{combo.size ? ` (${combo.size})` : ""}
                                        </div>
                                      </td>
                                      <td>{combo.combo_quantity}</td>
                                      <td>{formatCurrency(combo.combo_price * combo.combo_quantity, invoiceDetails)}</td>
                                    </tr>
                                    {combo.isSpicy && combo.spicy_price > 0 && (
                                      <tr>
                                        <td></td>
                                        <td>
                                          <div style={{ color: "#888", fontSize: "12px" }}>
                                            + Spicy ({formatCurrency(combo.spicy_price, invoiceDetails)})
                                          </div>
                                        </td>
                                        <td>{combo.combo_quantity}</td>
                                        <td>{formatCurrency(combo.spicy_price * combo.combo_quantity, invoiceDetails)}</td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )
                            )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* UPDATED: Totals matching Cash.jsx - Added VAT breakdown */}
              {/* FIXED: Grand total computed as subtotal + VAT */}
              <div className="mt-3">
                <p>
                  <strong>Total Quantity:</strong> {invoiceDetails.items.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
                <p>
                  <strong>Subtotal:</strong> {formatCurrency(calculateSubtotal(invoiceDetails), invoiceDetails)}
                </p>
                {Object.entries(getVatByRate(invoiceDetails)).map(([rate, amt]) => (
                  <p key={rate}>
                    <strong>VAT {rate}%:</strong> {formatCurrency(amt, invoiceDetails)}
                  </p>
                ))}
                <p>
                  <strong>Total VAT:</strong> {formatCurrency(calculateVAT(invoiceDetails), invoiceDetails)}
                </p>
                <p style={getGrandTotalStyle(invoiceDetails)}>
                  <strong>Grand Total:</strong> {formatCurrency(calculateGrandTotal(invoiceDetails), invoiceDetails)}
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {invoiceDetails && (
            <>
              <Button variant="info" onClick={() => handleEmail(invoiceDetails)}>
                <FaEnvelope /> Send Email
              </Button>
              <Button variant="primary" onClick={() => handlePrint(invoiceDetails)}>
                <FaPrint /> Print Preview
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
      {/* NEW: Column Management Modal - UPDATED: Added stylish classes */}
      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} className="column-modal" centered size="md">
        <Modal.Header closeButton className="bg-secondary text-white">
          <Modal.Title>Manage Table Columns</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
          <div className="mb-3 p-3 bg-white rounded shadow-sm">
            <h6 className="fw-bold text-primary mb-2">Add New Column</h6>
            <Form.Group className="mb-2">
              <Form.Label className="fw-bold">Select Field to Add</Form.Label>
              <Form.Select value={selectedFieldToAdd} onChange={(e) => setSelectedFieldToAdd(e.target.value)}>
                <option value="">Choose a field...</option>
                {possibleColumns
                  .filter((p) => !columnOrder.some((c) => c.key === p.key))
                  .map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fw-bold">Insert Position</Form.Label>
              <Form.Select value={selectedPosition} onChange={(e) => setSelectedPosition(Number(e.target.value))}>
                {Array.from({ length: columnOrder.length + 1 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === columnOrder.length ? 'At the end' : `Before "${columnOrder[i].label}"`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button variant="primary" onClick={addColumn} disabled={!selectedFieldToAdd} className="mt-2 w-100">
              Add Column
            </Button>
          </div>
          <hr />
          <div className="p-3 bg-white rounded shadow-sm">
            <h6 className="fw-bold text-primary mb-2">Current Columns (Double-click headers in table to remove)</h6>
            {columnOrder.map((col, index) => (
              <div key={col.key} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded bg-light">
                <span className="fw-medium">{col.label} ({col.align})</span>
                <Button size="sm" variant="danger" onClick={() => removeColumn(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowColumnModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
export default SalesPage;