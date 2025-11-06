import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Table,
  Card,
  Row,
  Col,
  Spinner,
  Button,
  Form,
} from "react-bootstrap";
// import "bootstrap/dist/css/bootstrap.min.css"; // Removed: Assuming react-bootstrap handles this
// import "./salesreport.css"; // Removed: Will add inline styles
import { useNavigate } from "react-router-dom";
// import DatePicker from "react-datepicker"; // Removed: Will use native input
// import "react-datepicker/dist/react-datepicker.css"; // Removed
// import { FaArrowLeft, FaPrint, FaFilePdf, FaFileExcel } from "react-icons/fa"; // Removed: Will use inline SVGs
// import * as XLSX from 'xlsx'; // Removed: Will remove Excel export functionality
// --- SVG Icons ---
// Using heroicons as simple inline SVG replacements
const IconArrowLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: '1.25em', height: '1.25em', verticalAlign: '-0.25em', marginRight: '0.25em' }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
    />
  </svg>
);
const IconPrint = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: '1.25em', height: '1.25em', verticalAlign: '-0.25em', marginRight: '0.25em' }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.23a1.125 1.125 0 01-1.12-1.227L6.34 18m11.318 0h1.061A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.279A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0M19.5 4.5c0-1.242-1.008-2.25-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v.75A2.25 2.25 0 006.75 7.5h10.5A2.25 2.25 0 0019.5 5.25v-.75z"
    />
  </svg>
);
const IconFilePdf = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: '1.25em', height: '1.25em', verticalAlign: '-0.25em', marginRight: '0.25em' }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625a1.875 1.875 0 00-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V11.25a1.875 1.875 0 00-1.875-1.875v-1.5c0-1.035-.84-1.875-1.875-1.875H8.25z"
    />
  </svg>
);
// --- End SVG Icons ---
const SalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");
  const [filterInvoiceNo, setFilterInvoiceNo] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterItem, setFilterItem] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedFilterType, setSelectedFilterType] = useState("date");
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
  const navigate = useNavigate();
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
  // NEW: This useEffect now depends on `baseUrl`
  // It will run once `baseUrl` is set (from null to a string)
  useEffect(() => {
    // Wait until baseUrl is fetched
    if (baseUrl === null) {
      return;
    }
    const API_URL = baseUrl || 'http://localhost:8000';
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
        // Use default if fetch fails
        const defaultPrintSettings = {
          restaurantName: "My Restaurant",
          street: "123 Store Street",
          city: "City",
          pincode: "",
          phone: "+91 123-456-7890",
          gstin: "12ABCDE3456F7Z8",
          thankYouMessage: "Thank You! Visit Again!",
          poweredBy: "MyRestaurant"
        };
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
        setLogoUrl(null); // Ensure null if fetch fails
      }
    };
    const fetchSalesData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/sales`);
        const cleanedData = cleanData(response.data);
        setSalesData(cleanedData);
      } catch (err) {
        setError("Error fetching sales data: " + err.message);
      }
    };
    // --- Main data fetching function ---
    const fetchAllData = async () => {
      // Set loading to true now that we are starting to fetch
      setLoading(true);
      try {
        await Promise.all([
          fetchSalesData(),
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
  // NEW: Listen for settings changes (e.g., from SystemSettings) and re-fetch if needed
  useEffect(() => {
    const handleSettingsUpdate = () => {
      // Re-fetch settings to ensure latest from server/localStorage
      const API_URL = baseUrl || 'http://localhost:8000';
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
      if (API_URL) {
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
  // Clean and validate sales data (updated to include currency handling like salespage)
  const cleanData = (data) => {
    if (!Array.isArray(data)) return [];
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
        return isValid;
      })
      .map((sale) => ({
        ...sale,
        // FIXED: Ensure date and time are formatted using current settings on load, but preserve original for historical display if needed
        date: getFormattedDate(sale.date),
        time: getFormattedTime(sale.time),
        // FIXED: For historical invoices, ensure invoice_currency defaults to 'INR' if not set (as per old data assumption)
        invoice_currency: sale.invoice_currency || 'INR', // Default to INR for old invoices without currency field
        invoice_currency_precision: sale.invoice_currency_precision || 2, // Default precision
      }));
    return cleaned;
  };
  // Fixed calculateItemPrices to properly handle quantity for addons and combos
  const calculateItemPrices = (item) => {
    const baseAmount = parseFloat(item.amount) || parseFloat(item.basePrice) || 0;
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
    const unitTotal = baseAmount + addonTotal + comboTotal;
    const totalAmount = unitTotal * (item.quantity || 1);
    return { baseAmount, addonTotal, comboTotal, unitTotal, totalAmount };
  };
  // Get contribution for a specific item/addon/combo in a sale
  const getItemContribution = (sale, filterItem) => {
    let subtotal = 0;
    let quantity = 0;
    const lowerFilter = filterItem.toLowerCase();
    sale.items.forEach((item) => {
      // Main item match
      if (item.item_name && item.item_name.toLowerCase() === lowerFilter) {
        const prices = calculateItemPrices(item);
        subtotal += prices.totalAmount;
        quantity += item.quantity || 0;
      }
      // Addon matches
      if (item.addons && item.addons.length > 0) {
        item.addons.forEach((addon) => {
          if (addon.addon_name && addon.addon_name.toLowerCase() === lowerFilter) {
            const addonContrib = (parseFloat(addon.addon_price) || 0) * (addon.addon_quantity || 1);
            subtotal += addonContrib * (item.quantity || 1);
            quantity += (addon.addon_quantity || 0) * (item.quantity || 1);
          }
        });
      }
      // Combo matches (using name1 as per receipt code)
      if (item.selectedCombos && item.selectedCombos.length > 0) {
        item.selectedCombos.forEach((combo) => {
          if (combo.name1 && combo.name1.toLowerCase() === lowerFilter) {
            const comboContrib = (parseFloat(combo.combo_price) || 0) * (combo.combo_quantity || 1);
            subtotal += comboContrib * (item.quantity || 1);
            quantity += (combo.combo_quantity || 0) * (item.quantity || 1);
          }
        });
      }
    });
    return { subtotal, quantity };
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
  // Use backend's total for subtotal
  const calculateSubtotal = (sale) => {
    return parseFloat(sale.total) || 0;
  };
  // Use backend's vat_amount for VAT
  const calculateVAT = (sale) => {
    return parseFloat(sale.vat_amount) || 0;
  };
  // Use backend's grand_total for grand total
  const calculateGrandTotal = (sale) => {
    return parseFloat(sale.grand_total) || 0;
  };
  // Get amounts for a sale (full or item-specific) - UPDATED to use invoice VAT amount
  const getSaleAmounts = (sale, isItemFilter, filterItem) => {
    if (isItemFilter && filterItem) {
      const contrib = getItemContribution(sale, filterItem);
      const sub = contrib.subtotal;
      // FIXED: For item-wise, prorate VAT based on item's contribution to subtotal (using sale's vat_amount)
      const totalSub = calculateSubtotal(sale);
      const proratedVat = totalSub > 0 ? (sub / totalSub) * calculateVAT(sale) : 0;
      const grand = sub + proratedVat;
      return { subtotal: sub, vat: proratedVat, grand, quantity: contrib.quantity };
    } else {
      return {
        subtotal: calculateSubtotal(sale),
        vat: calculateVAT(sale),
        grand: calculateGrandTotal(sale),
        quantity: null,
      };
    }
  };
  // Parse date string to Date object (assuming backend date is yyyy-MM-dd)
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    return parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
  };
  // Convert time string to minutes for comparison
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  };
  // Check if sale time is within the selected range
  const isTimeInRange = (saleTime, startTime, endTime) => {
    if (!startTime && !endTime) return true;
    const saleMinutes = timeToMinutes(saleTime);
    const startMinutes = startTime ? timeToMinutes(startTime) : -Infinity;
    const endMinutes = endTime ? timeToMinutes(endTime) + 59 : Infinity;
    return saleMinutes >= startMinutes && saleMinutes <= endMinutes;
  };
  // Generate hourly time slots for dropdowns
  const hourlyTimes = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });
  // Get unique customers for dropdown
  const uniqueCustomers = [
    ...new Set(salesData.map((sale) => sale.customer).filter(Boolean)),
  ];
  // Get unique items, addons, and combos for dropdown (fixed to use name1 for combos)
  const uniqueItems = [
    ...new Set(
      salesData.flatMap((sale) =>
        sale.items.flatMap((item) => [
          item.item_name,
          ...(item.addons || []).map((addon) => addon.addon_name).filter(Boolean),
          ...(item.selectedCombos || []).map((combo) => combo.name1).filter(Boolean),
        ])
      )
    ),
  ].sort();
  // Months for dropdown
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  // Validate year input
  const validateYear = (year) => {
    const yearNum = parseInt(year);
    return (
      year.length === 4 &&
      !isNaN(yearNum) &&
      yearNum >= 1900 &&
      yearNum <= new Date().getFullYear()
    );
  };
  // Check if current filter is item-wise
  const isItemFilter = selectedFilterType === "item" && filterItem;
  // Filter sales data based on user inputs (apply all set filters) - fixed item match to use name1 for combos
  const filteredSales = salesData.filter((sale) => {
    const saleDate = parseDate(sale.date);
   
    // Convert filter dates (which are Date objects) to start/end of day for comparison
    const from = fromDate ? new Date(fromDate.setHours(0, 0, 0, 0)) : null;
    const to = toDate ? new Date(toDate.setHours(23, 59, 59, 999)) : null;
    const dateMatch =
      (!from && !to) ||
      (from && !to && saleDate && saleDate >= from) ||
      (!from && to && saleDate && saleDate <= to) ||
      (from && to && saleDate && saleDate >= from && saleDate <= to);
    const monthMatch =
      filterMonth && filterYear && validateYear(filterYear)
        ? saleDate &&
          saleDate.getMonth() === months.indexOf(filterMonth) &&
          saleDate.getFullYear() === parseInt(filterYear)
        : true;
    const yearMatch =
      filterYear && validateYear(filterYear)
        ? saleDate && saleDate.getFullYear() === parseInt(filterYear)
        : true;
    const customerMatch = filterCustomer
      ? sale.customer?.toLowerCase() === filterCustomer.toLowerCase()
      : true;
    const itemMatch = filterItem
      ? sale.items.some((item) =>
          item.item_name.toLowerCase() === filterItem.toLowerCase() ||
          (item.addons || []).some((addon) =>
            addon.addon_name?.toLowerCase() === filterItem.toLowerCase()
          ) ||
          (item.selectedCombos || []).some((combo) =>
            combo.name1?.toLowerCase() === filterItem.toLowerCase()
          )
        )
      : true;
    const timeMatch = isTimeInRange(sale.time, filterStartTime, filterEndTime);
    const invoiceMatch = filterInvoiceNo
      ? sale.invoice_no.toLowerCase().includes(filterInvoiceNo.toLowerCase())
      : true;
    const phoneMatch = filterPhone
      ? sale.phoneNumber?.toLowerCase().includes(filterPhone.toLowerCase())
      : true;
    return (
      dateMatch &&
      monthMatch &&
      yearMatch &&
      customerMatch &&
      itemMatch &&
      timeMatch &&
      invoiceMatch &&
      phoneMatch
    );
  });
  // UPDATED: Calculate aggregates per currency (since mixed currencies)
  const calculateAggregates = (sales, isItemFilter, filterItem) => {
    const currencyTotals = new Map();
    let totalQuantity = 0;
    let totalRecords = 0;
    sales.forEach((sale) => {
      const amounts = getSaleAmounts(sale, isItemFilter, filterItem);
      const currency = sale.invoice_currency || settings.currency || 'INR';
      const precision = sale.invoice_currency_precision || settings.currencyPrecision || 2;
      if (!currencyTotals.has(currency)) {
        currencyTotals.set(currency, { subtotal: 0, vat: 0, grand: 0, precision });
      }
      const totals = currencyTotals.get(currency);
      totals.subtotal += amounts.subtotal;
      totals.vat += amounts.vat;
      totals.grand += amounts.grand;
      if (isItemFilter) {
        totalQuantity += amounts.quantity || 0;
        totalRecords += 1; // Count sales containing the item
      }
    });
    return { currencyTotals: new Map([...currencyTotals.entries()]), totalQuantity, totalRecords };
  };
  const { currencyTotals, totalQuantity, totalRecords } = calculateAggregates(filteredSales, isItemFilter, filterItem);
  // Handle warning message dismissal
  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage("");
    setWarningType("warning");
  };
  // *** UPDATED THIS FUNCTION ***
  // Navigate back to the previous page in history
  const handleBack = () => {
    navigate(-1);
  };
  // UPDATED: Generate HTML content for printing or PDF export - Now handles per-sale currency
  const generatePrintableContent = (sales, filterType) => {
    if (sales.length === 0) return "";
    const effectivePrintSettings = printSettings || {
      restaurantName: "My Restaurant",
      street: "123 Store Street",
      city: "City",
      pincode: "",
      phone: "+91 123-456-7890",
      gstin: "12ABCDE3456F7Z8",
      thankYouMessage: "Thank You! Visit Again!",
      poweredBy: "MyRestaurant"
    };
    const restaurantName = effectivePrintSettings.restaurantName;
    const street = effectivePrintSettings.street;
    const city = effectivePrintSettings.city;
    const pincode = effectivePrintSettings.pincode;
    const address = `${street}${street ? ', ' : ''}${city}${pincode ? `, ${pincode}` : ''}`;
    const phone = effectivePrintSettings.phone;
    const gstin = effectivePrintSettings.gstin;
    const thankYouMessage = effectivePrintSettings.thankYouMessage;
    const poweredBy = effectivePrintSettings.poweredBy ? `Powered by ${effectivePrintSettings.poweredBy}` : "Powered by MyRestaurant";
    let filterDescription;
    let isItemFilt = false;
    let filtItem = "";
    if (filterType === "customer") {
      filterDescription = `Customer: ${filterCustomer || "All"}`;
    } else if (filterType === "date") {
      const from = fromDate ? fromDate.toLocaleDateString('en-GB') : "Any";
      const to = toDate ? toDate.toLocaleDateString('en-GB') : "Any";
      filterDescription = `Date Range: ${from} to ${to}${
        filterStartTime || filterEndTime
          ? `, Time: ${filterStartTime || "Start"} to ${
              filterEndTime || "End"
            }`
          : ""
      }`;
    } else if (filterType === "month") {
      filterDescription = `Month: ${filterMonth} ${filterYear}`;
    } else if (filterType === "year") {
      filterDescription = `Year: ${filterYear}`;
    } else if (filterType === "item") {
      filterDescription = `Item: ${filterItem || "All"}`;
      isItemFilt = true;
      filtItem = filterItem;
    } else {
      filterDescription = "All Sales";
    }
    // Compute aggregates for print (per currency)
    const { currencyTotals: printCurrencyTotals, totalQuantity: printTotalQuantity, totalRecords: printTotalRecords } = calculateAggregates(sales, isItemFilt, filtItem);
    let rows = sales
      .map(
        (sale) => {
          const amounts = getSaleAmounts(sale, isItemFilt, filtItem);
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
        }
      )
      .join("");
    let tfoot = '';
    // FIXED: Correct Map.forEach usage - (value, key) order, not destructuring value as array
    printCurrencyTotals.forEach((totals, currency) => {
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
    if (isItemFilt) {
      tfoot = `
        <tr style="border-top: 1px solid #000000;">
          <td colspan="8" style="text-align: left; padding: 8px; font-size: 12px; font-weight: bold;">Total Records: ${printTotalRecords}, Total Quantity Sold: ${printTotalQuantity}</td>
        </tr>
        ${tfoot}
      `;
    }
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
          ${tfoot}
        </table>
        <div style="text-align: center; margin-top: 20px; border-top: 2px solid #000000; padding-top: 10px;">
          <p style="margin: 4px 0; font-size: 12px;">${thankYouMessage}</p>
          <p style="margin: 4px 0; font-size: 12px;">${poweredBy}</p>
        </div>
      </div>
    `;
  };
  // Handle print action
  const handlePrint = () => {
    const content = generatePrintableContent(filteredSales, selectedFilterType);
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 10mm; size: A4; }
            }
            body { margin: 0; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
          ${content}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
  };
  // Handle PDF export (triggers print dialog for PDF saving)
  const handleExportPDF = () => {
    const content = generatePrintableContent(filteredSales, selectedFilterType);
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 10mm; size: A4; }
            }
            body { margin: 0; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
          ${content}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
  };
  // Handle Excel export using SheetJS - This functionality is removed
  const handleExportExcel = () => {
     setWarningMessage("Excel export is currently unavailable.");
     setWarningType("warning");
  };
  // Render loading, error, or empty states
  if (loading || baseUrl === null)
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" style={{ color: "#3498db" }} />
        <p>Loading...</p>
      </Container>
    );
  if (error) return <div className="alert alert-danger m-4">{error}</div>;
  if (salesData.length === 0)
    return (
      <div className="text-center mt-5" style={{ color: "#000000" }}>
        No sales data available.
      </div>
    );
  // Helper function to format Date object to "YYYY-MM-DD" for input
  const formatDateForInput = (date) => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };
  return (
    <>
      {/* Inline styles to replace ./salesreport.css */}
      <style>{`
        .sales-page-container {
          min-height: 100vh;
          background-color: #f8f9fa;
        }
        .sidebar {
          position: sticky;
          top: 20px;
          height: calc(100vh - 40px);
          overflow-y: auto;
          background-color: #ffffff;
          border-right: 1px solid #dee2e6;
          padding: 20px;
        }
        .time-dropdown {
          max-height: 200px;
          overflow-y: auto;
        }
        .sales-table {
          border-radius: 8px;
          overflow: hidden;
        }
        .table-header {
          background-color: #3498db;
          color: #ffffff;
        }
        .table-row:hover {
          background-color: #f1f1f1 !important;
        }
        .back-btn, .print-btn, .export-excel-btn, .export-pdf-btn {
          border-radius: 8px;
          padding: 10px 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5em;
        }
        .currency-total-row {
          background-color: #e9ecef;
          font-weight: bold;
        }
      `}</style>
      <Container
        fluid
        className="mt-4 sales-page-container"
      >
        {warningMessage && (
          <div
            className={`alert alert-${warningType} text-center alert-dismissible fade show`}
            role="alert"
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1050,
              minWidth: "300px",
            }}
          >
            {warningMessage}
            <button
              type="button"
              className="btn btn-primary ms-3"
              onClick={handleWarningOk}
              aria-label="Close warning"
            >
              OK
            </button>
          </div>
        )}
        <Row>
          {/* Sidebar for Filters */}
          <Col
            md={3}
            className="sidebar"
          >
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title
                  className="text-primary fw-bold mb-4"
                  style={{ fontSize: "1.5rem" }}
                >
                  Filters
                </Card.Title>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Filter Type</Form.Label>
                  <Form.Select
                    value={selectedFilterType}
                    onChange={(e) => setSelectedFilterType(e.target.value)}
                    className="shadow-sm"
                    aria-label="Select filter type"
                  >
                    <option value="default">Select Filter</option>
                    <option value="date">Date-wise</option>
                    <option value="month">Month-wise</option>
                    <option value="year">Year-wise</option>
                    <option value="customer">Customer-wise</option>
                    <option value="item">Item-wise</option>
                  </Form.Select>
                </Form.Group>
                {selectedFilterType === "date" && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">From Date:</Form.Label>
                      {/* Replaced DatePicker with Form.Control type="date" */}
                      <Form.Control
                        type="date"
                        value={formatDateForInput(fromDate)}
                        onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : null)}
                        className="form-control shadow-sm"
                        aria-label="Select start date"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">To Date:</Form.Label>
                      {/* Replaced DatePicker with Form.Control type="date" */}
                      <Form.Control
                        type="date"
                        value={formatDateForInput(toDate)}
                        onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : null)}
                        min={formatDateForInput(fromDate)}
                        className="form-control shadow-sm"
                        aria-label="Select end date"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">From Time:</Form.Label>
                      <Form.Select
                        value={filterStartTime}
                        onChange={(e) => setFilterStartTime(e.target.value)}
                        className="form-control shadow-sm time-dropdown"
                        aria-label="Select start time"
                      >
                        <option value="">Select Start Time</option>
                        {hourlyTimes.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">To Time:</Form.Label>
                      <Form.Select
                        value={filterEndTime}
                        onChange={(e) => setFilterEndTime(e.target.value)}
                        className="form-control shadow-sm time-dropdown"
                        aria-label="Select end time"
                      >
                        <option value="">Select End Time</option>
                        {hourlyTimes.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </>
                )}
                {selectedFilterType === "month" && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Month</Form.Label>
                      <Form.Select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="shadow-sm"
                        aria-label="Select month"
                      >
                        <option value="">Select Month</option>
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Year</Form.Label>
                      <Form.Control
                        type="text"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        placeholder="Enter year (e.g., 2025)"
                        className="shadow-sm"
                        aria-label="Yearly"
                        maxLength="4"
                        pattern="\d{4}"
                      />
                    </Form.Group>
                  </>
                )}
                {selectedFilterType === "year" && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Year</Form.Label>
                    <Form.Control
                      type="text"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      placeholder="Enter year (e.g., 2025)"
                      className="shadow-sm"
                      aria-label="Yearly"
                      maxLength="4"
                      pattern="\d{4}"
                    />
                  </Form.Group>
                )}
                {selectedFilterType === "customer" && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Customer</Form.Label>
                    <Form.Select
                      value={filterCustomer}
                      onChange={(e) => setFilterCustomer(e.target.value)}
                      className="shadow-sm"
                      aria-label="Select customer"
                    >
                      <option value="">Select Customer</option>
                      {uniqueCustomers.map((customer) => (
                        <option key={customer} value={customer}>
                          {customer}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
                {selectedFilterType === "item" && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Item</Form.Label>
                    <Form.Select
                      value={filterItem}
                      onChange={(e) => setFilterItem(e.target.value)}
                      className="shadow-sm"
                      aria-label="Select item"
                    >
                      <option value="">Select Item</option>
                      {uniqueItems.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Invoice No:</Form.Label>
                  <Form.Control
                    type="text"
                    value={filterInvoiceNo}
                    onChange={(e) => setFilterInvoiceNo(e.target.value)}
                    placeholder="Filter by invoice no"
                    className="shadow-sm"
                    aria-label="Filter by invoice number"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Phone Number:</Form.Label>
                  <Form.Control
                    type="text"
                    value={filterPhone}
                    onChange={(e) => setFilterPhone(e.target.value)}
                    placeholder="Filter by phone"
                    className="shadow-sm"
                    aria-label="Filter by phone number"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
          {/* Main Content */}
          <Col md={9} style={{ padding: "20px" }}>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <Button
                variant="outline-primary"
                onClick={handleBack}
                className="back-btn"
                aria-label="Previous page"
              >
                <IconArrowLeft /> Back
              </Button>
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="primary"
                  onClick={handlePrint}
                  className="print-btn"
                  aria-label="Print"
                >
                  <IconPrint /> Print Report
                </Button>
                {/* <Button
                  variant="success"
                  onClick={handleExportExcel}
                  className="export-excel-btn"
                  aria-label="Export to Excel"
                >
                  <FaFileExcel /> Export Excel
                </Button> */}
                <Button
                  variant="danger"
                  onClick={handleExportPDF}
                  className="export-pdf-btn"
                  aria-label="Export to PDF"
                >
                  <IconFilePdf /> Export PDF
                </Button>
              </div>
            </div>
            <Card
              className="shadow-lg sales-card border-0"
              style={{ borderRadius: "12px" }}
            >
              <Card.Body>
                <Card.Title
                  className="text-primary fw-bold mb-4"
                  style={{ fontSize: "1.75rem" }}
                >
                  {selectedFilterType === "customer" && filterCustomer
                    ? `Customer-wise Sales Report: ${filterCustomer}`
                    : selectedFilterType === "item" && filterItem
                    ? `Item-wise Sales Report: ${filterItem}`
                    : selectedFilterType === "date"
                    ? `Date-wise Sales Report`
                    : selectedFilterType === "month" && filterMonth && filterYear
                    ? `Month-wise Sales Report: ${filterMonth} ${filterYear}`
                    : selectedFilterType === "year" && filterYear
                    ? `Year-wise Sales Report: ${filterYear}`
                    : "All Sales Report"}
                </Card.Title>
                {filteredSales.length === 0 ? (
                  <div className="text-center" style={{ color: "#000000" }}>
                    No sales match the selected filters.
                  </div>
                ) : (
                  <>
                    <Table
                      responsive
                      striped
                      hover
                      className="sales-table"
                    >
                      <thead
                        className="table-header"
                      >
                        <tr>
                          <th style={{ textAlign: "left", padding: "12px" }}>
                            Invoice No
                          </th>
                          <th style={{ textAlign: "left", padding: "12px" }}>
                            Customer
                          </th>
                          <th style={{ textAlign: "center", padding: "12px" }}>Date</th>
                          <th style={{ textAlign: "center", padding: "12px" }}>Time</th>
                          <th style={{ textAlign: "center", padding: "12px" }}>
                            Mode of Payment
                          </th>
                          <th style={{ textAlign: "right", padding: "12px" }}>
                            Total
                          </th>
                          <th style={{ textAlign: "right", padding: "12px" }}>
                            VAT
                          </th>
                          <th style={{ textAlign: "right", padding: "12px" }}>
                            Grand Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((sale) => {
                          const amounts = getSaleAmounts(sale, isItemFilter, filterItem);
                          return (
                            <tr
                              key={sale.invoice_no}
                              className="table-row"
                            >
                              <td style={{ textAlign: "left", padding: "12px" }}>
                                {sale.invoice_no}
                              </td>
                              <td style={{ textAlign: "left", padding: "12px" }}>
                                {sale.customer || "N/A"}
                              </td>
                              <td style={{ textAlign: "center", padding: "12px" }}>
                                {sale.date}
                              </td>
                              <td style={{ textAlign: "center", padding: "12px" }}>
                                {sale.time}
                              </td>
                              <td style={{ textAlign: "center", padding: "12px" }}>
                                {sale.payments?.[0]?.mode_of_payment || "CASH"}
                              </td>
                              <td style={{ textAlign: "right", padding: "12px" }}>
                                {formatCurrency(amounts.subtotal, sale)}
                              </td>
                              <td style={{ textAlign: "right", padding: "12px" }}>
                                {formatCurrency(amounts.vat, sale)}
                              </td>
                              <td style={{ textAlign: "right", padding: "12px" }}>
                                {formatCurrency(amounts.grand, sale)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        {isItemFilter && (
                          <tr>
                            <td
                              colSpan="8"
                              style={{
                                textAlign: "left",
                                padding: "12px",
                                fontWeight: "bold",
                                backgroundColor: "#f8f9fa",
                              }}
                            >
                              Total Records: {totalRecords}, Total Quantity Sold: {totalQuantity}
                            </td>
                          </tr>
                        )}
                        {Array.from(currencyTotals.entries()).map(([currency, totals]) => (
                          <tr key={currency} className="currency-total-row">
                            <td
                              colSpan={isItemFilter ? "5" : "5"}
                              style={{
                                textAlign: "right",
                                padding: "12px",
                                fontWeight: "bold",
                                backgroundColor: "#e9ecef",
                              }}
                            >
                              {currency} Grand Total:
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                padding: "12px",
                                fontWeight: "bold",
                                backgroundColor: "#e9ecef",
                              }}
                            >
                              {getCurrencyFormatter(currency, totals.precision).format(totals.subtotal)}
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                padding: "12px",
                                fontWeight: "bold",
                                backgroundColor: "#e9ecef",
                              }}
                            >
                              {getCurrencyFormatter(currency, totals.precision).format(totals.vat)}
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                padding: "12px",
                                fontWeight: "bold",
                                backgroundColor: "#e9ecef",
                              }}
                            >
                              {getCurrencyFormatter(currency, totals.precision).format(totals.grand)}
                            </td>
                          </tr>
                        ))}
                      </tfoot>
                    </Table>
                    {isItemFilter && (
                      <div className="summary mt-3 p-3 bg-light rounded">
                        <h5 className="text-primary">Item Summary</h5>
                        <div className="row">
                          <div className="col-md-3">
                            <strong>Total Records:</strong> {totalRecords}
                          </div>
                          <div className="col-md-3">
                            <strong>Total Quantity Sold:</strong> {totalQuantity}
                          </div>
                        </div>
                        <div className="row mt-2">
                          {Array.from(currencyTotals.entries()).map(([currency, totals]) => (
                            <div key={currency} className="col-md-4 mb-2">
                              <strong>{currency}:</strong> Subtotal {getCurrencyFormatter(currency, totals.precision).format(totals.subtotal)}, VAT {getCurrencyFormatter(currency, totals.precision).format(totals.vat)}, Grand Total {getCurrencyFormatter(currency, totals.precision).format(totals.grand)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};
export default SalesReport;