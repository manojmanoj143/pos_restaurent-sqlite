import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
// Check if running in Electron environment
const isElectron = window && window.process && window.process.type;
const ipcRenderer = isElectron ? window.require("electron").ipcRenderer : null;
function Cash() {
  const location = useLocation();
  const navigate = useNavigate();
  // State variables
  const [billDetails, setBillDetails] = useState(null);
  const [cashGiven, setCashGiven] = useState("");
  const [change, setChange] = useState(0);
  const [vatRate, setVatRate] = useState(0.2); // Default to 20% as per request
  const [showModal, setShowModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [pendingAction, setPendingAction] = useState(null);
  const [printSettings, setPrintSettings] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  // System settings state
  const [settings, setSettings] = useState({});
  // Current time state for real-time updates (like OpeningEntry)
  const [currentTime, setCurrentTime] = useState(new Date());
  const API_URL = 'http://localhost:8000';
  // Default print settings (used when no active settings fetched)
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
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  // Fetch logo for preview
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
  // Fetch system settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);
  // Dynamic date formatting based on system settings (local time only)
  const getFormattedDate = (date, dateFormat) => {
    if (!dateFormat) {
      // Default: yyyy longmonth dd
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    const numericFormatter = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: 'numeric' });
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
        // yyyy longmonth dd, e.g., 2025 October 29
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'dd-MMM-yy':
        // dd-MMM-yy, e.g., 30-Oct-25
        const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
        const dayStr = date.getDate().toString().padStart(2, '0');
        const yearShort = date.getFullYear().toString().slice(-2);
        return `${dayStr}-${monthShort}-${yearShort}`;
      default:
        // Fallback to yyyy longmonth dd
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };
  // Dynamic time formatting based on system settings (local time only, conditional seconds) - Fixed to match OpeningEntry logic
  const getFormattedTime = (date, timeFormat) => {
    if (!timeFormat) {
      // Default: 12-hour without seconds
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    const hasSeconds = timeFormat.includes(':ss') || timeFormat.includes('ss');
    const is12Hour = timeFormat.includes(' a') || timeFormat.startsWith('hh');
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      ...(hasSeconds && { second: '2-digit' }),
      hour12: is12Hour,
    };
    return date.toLocaleTimeString('en-US', options);
  };
  // Currency formatter for totals
  const getCurrencyFormatter = () => {
    const locale = settings.language || 'en-IN'; // Use en-IN for INR defaults
    const currency = settings.currency || 'INR'; // Default to INR as per request
    const precision = parseInt(settings.currencyPrecision) || 2;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  };
  // CSS Styles (Updated with improved design: modern gradients, shadows, transitions, responsive adjustments)
  const styles = `
    .cash-container {
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      position: relative;
    }
    .cash-back-btn {
      background: #ffffff;
      color: #2c3e50;
      border: 2px solid #3498db;
      padding: 10px 20px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 25px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      margin-bottom: 25px;
      position: absolute;
      top: 20px;
      left: 20px;
    }
    .cash-back-btn:hover {
      background: #3498db;
      color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
    }
    .cash-back-btn:disabled {
      background: #bdc3c7;
      border-color: #bdc3c7;
      color: #7f8c8d;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .cash-back-btn .fas {
      margin-right: 8px;
    }
    .cash-error {
      background: #fef1f1;
      color: #e74c3c;
      padding: 12px 20px;
      border-radius: 12px;
      margin: 70px 0 25px 0;
      box-shadow: 0 4px 15px rgba(231, 76, 60, 0.1);
      font-weight: 500;
      text-align: center;
      max-width: 600px;
      width: 100%;
      align-self: center;
    }
    .cash-content {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .cash-card {
      background: #ffffff;
      border: none;
      border-radius: 20px;
      width: 100%;
      max-width: 650px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.3s ease;
    }
    .cash-card:hover {
      transform: translateY(-5px);
    }
    .cash-header {
      background: linear-gradient(90deg, #2980b9 0%, #3498db 100%);
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 20px 20px 0 0;
    }
    .cash-header h3 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .cash-body {
      padding: 25px;
    }
    .cash-customer-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 15px;
      margin-bottom: 25px;
      box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
    }
    .cash-customer-info p {
      margin: 8px 0;
      font-size: 15px;
      color: #2c3e50;
    }
    .cash-items-title {
      font-size: 18px;
      margin-bottom: 20px;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 5px;
    }
    .cash-table-wrapper {
      overflow-x: auto;
      margin-bottom: 25px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }
    .cash-table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 15px;
      overflow: hidden;
    }
    .cash-table th,
    .cash-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #ecf0f1;
      font-size: 14px;
      color: #2c3e50;
    }
    .cash-table th {
      background: #ecf0f1;
      font-weight: 600;
      text-align: left;
      color: #34495e;
    }
    .cash-table td:nth-child(2),
    .cash-table th:nth-child(2) {
      text-align: center;
    }
    .cash-table td:nth-child(3),
    .cash-table th:nth-child(3),
    .cash-table td:nth-child(4),
    .cash-table th:nth-child(4) {
      text-align: right;
    }
    .cash-sub-item td {
      padding-left: 30px !important;
      color: #7f8c8d;
      font-size: 12px;
    }
    .grand-total-header {
      color: #e74c3c;
      font-weight: 600;
    }
    .grand-total {
      color: #e74c3c;
      font-weight: 600;
    }
    .cash-totals {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 15px;
      margin-bottom: 25px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }
    .cash-totals p {
      margin: 8px 0;
      font-size: 15px;
      display: flex;
      justify-content: space-between;
      color: #2c3e50;
    }
    .cash-input-section {
      margin-bottom: 25px;
    }
    .cash-input-section label {
      display: block;
      font-size: 15px;
      margin-bottom: 8px;
      font-weight: 500;
      color: #34495e;
    }
    .cash-input {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #ddd;
      border-radius: 10px;
      font-size: 15px;
      box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .cash-input:focus {
      border-color: #3498db;
      box-shadow: 0 0 8px rgba(52, 152, 219, 0.3);
      outline: none;
    }
    .cash-input:disabled {
      background: #ecf0f1;
      border-color: #bdc3c7;
      cursor: not-allowed;
    }
    .cash-change {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      margin-bottom: 25px;
      color: #27ae60;
      font-weight: 600;
    }
    .cash-change label {
      color: #34495e;
    }
    .cash-confirm {
      text-align: center;
    }
    .cash-confirm-btn {
      background: linear-gradient(90deg, #27ae60 0%, #2ecc71 100%);
      color: #ffffff;
      border: none;
      padding: 14px 25px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      box-shadow: 0 6px 20px rgba(39, 174, 96, 0.3);
      transition: all 0.3s ease;
    }
    .cash-confirm-btn:hover {
      background: linear-gradient(90deg, #3498db 0%, #3498db 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(23, 94, 153, 0.4);
    }
    .cash-confirm-btn:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .cash-empty {
      text-align: center;
      padding: 30px;
    }
    .cash-empty p {
      font-size: 18px;
      color: #7f8c8d;
      margin-bottom: 25px;
    }
    .cash-return-btn {
      background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
      color: #ffffff;
      border: none;
      padding: 12px 25px;
      border-radius: 25px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
      transition: all 0.3s ease;
    }
    .cash-return-btn:hover {
      background: linear-gradient(90deg, #2980b9 0%, #2471a3 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
    }
    .cash-return-btn:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .cash-modal-header {
      background: #3498db;
      color: #ffffff;
      border-radius: 15px 15px 0 0;
    }
    .cash-modal-input {
      border-radius: 10px;
      border: 2px solid #ddd;
      padding: 10px;
      transition: border-color 0.3s ease;
    }
    .cash-modal-input:focus {
      border-color: #3498db;
      box-shadow: 0 0 8px rgba(52, 152, 219, 0.3);
    }
    .cash-modal-footer {
      border-top: none;
      padding: 15px 25px;
    }
    .alert {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1050;
      min-width: 400px;
      min-height: 150px;
      max-width: 600px;
      background: #ffffff;
      border-radius: 15px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
      padding: 20px;
      font-size: 1.2rem;
      font-weight: 500;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .alert-warning {
      border: 2px solid #e74c3c;
      background: #fef1f1;
      color: #e74c3c;
    }
    .alert-success {
      border: 2px solid #27ae60;
      background: #e8f5e9;
      color: #27ae60;
    }
    .alert .btn {
      margin-top: 15px;
      padding: 8px 30px;
      font-size: 1rem;
      border-radius: 10px;
    }
    @media (max-width: 991px) {
      .cash-card {
        max-width: 100%;
      }
      .cash-table th,
      .cash-table td {
        font-size: 13px;
        padding: 10px;
      }
      .cash-header h3 {
        font-size: 20px;
      }
      .cash-back-btn {
        padding: 8px 16px;
        font-size: 14px;
      }
      .alert {
        min-width: 80%;
        max-width: 90%;
        min-height: 120px;
        font-size: 1.1rem;
      }
    }
    @media (max-width: 576px) {
      .cash-container {
        padding: 15px;
      }
      .cash-card {
        border-radius: 15px;
      }
      .cash-table th,
      .cash-table td {
        font-size: 12px;
        padding: 8px;
      }
      .cash-input {
        padding: 10px;
      }
      .cash-confirm-btn {
        padding: 12px;
        font-size: 14px;
      }
      .cash-return-btn {
        padding: 10px 20px;
        font-size: 13px;
      }
      .cash-totals p,
      .cash-customer-info p {
        font-size: 13px;
      }
      .cash-change {
        font-size: 14px;
      }
      .cash-header h3 {
        font-size: 18px;
      }
      .cash-back-btn {
        top: 15px;
        left: 15px;
      }
      .alert {
        min-width: 90%;
        max-width: 95%;
        min-height: 100px;
        font-size: 1rem;
      }
      .alert .btn {
        padding: 6px 20px;
        font-size: 0.9rem;
      }
    }
    .strikethroughStyle {
      text-decoration: line-through;
    }
  `;
  // Fetch active print settings
  useEffect(() => {
    const fetchPrintSettings = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/print_settings/active");
        setPrintSettings(response.data);
      } catch (err) {
        console.error("Failed to fetch active print settings:", err);
        // Use default if fetch fails
        setPrintSettings(defaultPrintSettings);
      }
    };
    fetchPrintSettings();
  }, []);
  // Fetch logo
  useEffect(() => {
    fetchLogo();
  }, []);
  // Initialize bill details from location state
  useEffect(() => {
    if (location.state?.billDetails) {
      const defaultTime = currentTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      const formattedBillDetails = {
        ...location.state.billDetails,
        subtotal: location.state.billDetails.subtotal || 0,
        vat_amount: location.state.billDetails.vat_amount || 0,
        totalAmount: location.state.billDetails.totalAmount || 0,
        invoice_no: location.state.billDetails.invoice_no || `INV-${Date.now()}`,
        customerName: location.state.billDetails.customerName || "N/A",
        phoneNumber: location.state.billDetails.phoneNumber || "N/A",
        email: location.state.billDetails.email || "N/A",
        whatsappNumber: location.state.billDetails.whatsappNumber || "N/A",
        tableNumber: location.state.billDetails.tableNumber || "N/A",
        deliveryAddress: location.state.billDetails.deliveryAddress || {
          building_name: "",
          flat_villa_no: "",
          country: "",
          field1: "",
          field2: "",
          field3: "",
        },
        date: location.state.billDetails.date || currentTime.toISOString().split("T")[0],
        time: location.state.billDetails.time || defaultTime,
        payments: location.state.billDetails.payments || [{ mode_of_payment: "CASH" }],
        items: location.state.billDetails.items.map((item) => ({
          ...item,
          item_name: item.item_name || item.name || "Unnamed Item",
          quantity: Number(item.quantity) || 1,
          basePrice: Number(item.basePrice) || 0,
          originalBasePrice: item.originalBasePrice || null,
          totalPrice: Number(item.totalPrice) || Number(item.basePrice) * Number(item.quantity) || 0,
          selectedSize: item.selectedSize || null,
          icePreference: item.icePreference || "without_ice",
          icePrice: Number(item.ice_price) || 0,
          isSpicy: item.isSpicy || false,
          spicyPrice: item.isSpicy ? Number(item.spicy_price) || 20.00 : 0,
          addonQuantities: item.addonQuantities || {},
          addonVariants: item.addonVariants || {},
          addonPrices: item.addonPrices || {},
          addonSizePrices: item.addonSizePrices || {},
          addonSpicyPrices: item.addonSpicyPrices || {},
          addonImages: item.addonImages || {},
          comboQuantities: item.comboQuantities || {},
          comboVariants: item.comboVariants || {},
          comboPrices: item.comboPrices || {},
          comboSizePrices: item.comboSizePrices || {},
          comboSpicyPrices: item.comboSpicyPrices || {},
          comboImages: item.comboImages || {},
          selectedCombos: item.selectedCombos || [],
          kitchen: item.kitchen || "Main Kitchen",
          ingredients: item.ingredients || [],
          selectedCustomVariants: item.selectedCustomVariants || {},
          customVariantsDetails: item.customVariantsDetails || {},
          customVariantsQuantities: item.customVariantsQuantities || {},
          addons:
            item.addons?.map((addon) => ({
              addon_name: addon.name1,
              addon_quantity: Number(addon.addon_quantity) || 0,
              addon_price: Number(addon.addon_price) || 0,
              addon_total_price: Number(addon.addon_total_price) || Number(addon.addon_price) * Number(addon.addon_quantity),
              size: addon.size || "M",
              isSpicy: addon.isSpicy || false,
              spicyPrice: Number(addon.spicyPrice) || 0,
              kitchen: addon.kitchen || "Main Kitchen",
              addon_image: addon.addon_image || "/static/images/default-addon-image.jpg",
            })) || [],
          combos:
            item.selectedCombos?.map((combo) => ({
              name1: combo.name1,
              combo_price: Number(combo.combo_price) || 0,
              combo_total_price: Number(combo.combo_total_price) || Number(combo.combo_price) * Number(combo.combo_quantity),
              size: combo.size || "M",
              combo_quantity: Number(combo.combo_quantity) || 1,
              isSpicy: combo.isSpicy || false,
              spicyPrice: Number(combo.spicyPrice) || 0,
              kitchen: combo.kitchen || "Main Kitchen",
              combo_image: combo.combo_image || "/static/images/default-combo-image.jpg",
            })) || [],
          isCombo: item.isCombo || false,
          comboItems: item.comboItems?.map((citem) => ({
            name: citem.name,
            description: citem.description || "",
            price: Number(citem.price) || 0,
            image: citem.image,
            kitchen: citem.kitchen,
          })) || [],
        })),
      };
      setBillDetails(formattedBillDetails);
      setEmailAddress(formattedBillDetails.email);
    }
  }, [location, currentTime]);
  // Fetch VAT rate - If API fails, keep default 20%
  useEffect(() => {
    const fetchVat = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/get-vat');
        setVatRate(response.data.vat / 100);
      } catch (error) {
        console.error('Failed to fetch VAT:', error);
        // Keep default 0.2 if fetch fails
      }
    };
    fetchVat();
  }, []);
  // Auto-close modal and navigate after 100 seconds
  useEffect(() => {
    let timer;
    if (showModal) {
      timer = setTimeout(() => {
        setShowModal(false);
        navigate("/frontpage");
      }, 100000);
    }
    return () => clearTimeout(timer);
  }, [showModal, navigate]);
  // Calculate item prices including addons, combos, custom variants, and extras
  const calculateItemPrices = (item) => {
    if (item.isCombo) {
      return {
        basePrice: Number(item.basePrice) || 0,
        icePrice: 0,
        spicyPrice: 0,
        addonTotal: 0,
        comboTotal: 0,
        customVariantsTotal: 0,
        totalAmount: (Number(item.basePrice) || 0) * item.quantity,
      };
    }
    const basePrice = Number(item.basePrice) || 0;
    const icePrice = item.icePreference === "with_ice" ? Number(item.icePrice) || 0 : 0;
    const spicyPrice = item.isSpicy ? Number(item.spicyPrice) || 0 : 0;
    const addonTotal =
      item.addons && item.addons.length > 0
        ? item.addons.reduce(
            (sum, addon) => sum + Number(addon.addon_total_price) * addon.addon_quantity,
            0
          )
        : 0;
    const comboTotal =
      item.combos && item.combos.length > 0
        ? item.combos.reduce(
            (sum, combo) => sum + Number(combo.combo_total_price) * combo.combo_quantity,
            0
          )
        : 0;
    const customVariantsTotal = item.customVariantsDetails
      ? Object.values(item.customVariantsDetails).reduce(
          (sum, variant) => sum + (Number(variant.price) || 0) * (item.customVariantsQuantities?.[variant.name] || 1),
          0
        ) * item.quantity
      : 0;
    const totalAmount = (basePrice + icePrice + spicyPrice + customVariantsTotal) * item.quantity + addonTotal + comboTotal;
    return { basePrice, icePrice, spicyPrice, addonTotal, comboTotal, customVariantsTotal, totalAmount };
  };
  // Get display name for items
  const getItemDisplayName = (item) => {
    const sizeDisplay = item.selectedSize ? ` (${item.selectedSize})` : "";
    return `${item.item_name}${sizeDisplay}`;
  };
  // FIXED: Use passed subtotal (excl total)
  const calculateSubtotal = () => {
    return billDetails?.subtotal || 0;
  };
  // FIXED: Aggregate VAT by rate from items.taxBreakdown
  const getVatByRate = () => {
    const byRate = {};
    billDetails?.items.forEach(item => {
      if (item.taxBreakdown) {
        Object.entries(item.taxBreakdown).forEach(([rate, amt]) => {
          byRate[rate] = (byRate[rate] || 0) + amt;
        });
      }
    });
    return byRate;
  };
  // FIXED: Use passed vat_amount
  const calculateVAT = () => {
    return billDetails?.vat_amount || 0;
  };
  // FIXED: Use passed totalAmount (incl)
  const calculateGrandTotal = () => {
    return billDetails?.totalAmount || 0;
  };
  // Parse bill date and time to Date object
  const parseBillDateTime = (dateStr, timeStr, timeZone) => {
    // Assume dateStr is 'YYYY-MM-DD', timeStr is 'HH:mm' or similar
    // Ensure timeStr is in HH:mm format (24-hour)
    let cleanTimeStr = timeStr;
    if (timeStr.includes(':')) {
      // If it has AM/PM, parse to 24-hour (simple check, assuming standard format)
      const [timePart, period] = timeStr.split(' ');
      if (period && (period.toUpperCase() === 'AM' || period.toUpperCase() === 'PM')) {
        let [hours, minutes] = timePart.split(':');
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        if (period.toUpperCase() === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
        cleanTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    const fullDateStr = `${dateStr}T${cleanTimeStr}:00.000Z`; // Add Z for UTC
    const date = new Date(fullDateStr);
    if (isNaN(date.getTime())) {
      // Fallback to current date/time
      return new Date();
    }
    return date;
  };
  // Handle cash input change
  const handleCashChange = (e) => {
    const givenAmount = e.target.value === "" ? "" : Number(e.target.value);
    setCashGiven(givenAmount);
    if (givenAmount !== "" && !isNaN(givenAmount)) {
      const grandTotal = calculateGrandTotal();
      setChange(givenAmount >= grandTotal ? Number(givenAmount - grandTotal) : 0);
    } else {
      setChange(0);
    }
  };
  // Handle warning modal OK button
  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage("");
    setWarningType("warning");
  };
  // Confirm payment and validate cash given
  const handlePaymentConfirm = () => {
    const grandTotal = calculateGrandTotal();
    const cashGivenNum = cashGiven === "" ? 0 : Number(cashGiven);
    if (cashGivenNum > 0 && cashGivenNum < grandTotal) {
      setWarningMessage(`Insufficient cash amount! Please provide at least ${getCurrencyFormatter().format(grandTotal)}`);
      setWarningType("warning");
      return;
    }
    setWarningMessage("Payment confirmed!");
    setWarningType("success");
    setPendingAction(() => () => {
      setShowModal(true);
    });
  };
  // Format numbers for display using currency formatter
  const formatCurrency = (amount) => {
    return getCurrencyFormatter().format(Number(amount));
  };
  // Helper to format delivery address in the specified order (single line for UI)
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
  // Helper to format delivery address for print (multi-line HTML)
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
  // Check if delivery address is available
  const hasDeliveryAddress = billDetails?.deliveryAddress &&
    (billDetails.deliveryAddress.building_name ||
      billDetails.deliveryAddress.flat_villa_no ||
      billDetails.deliveryAddress.country ||
      billDetails.deliveryAddress.field1 ||
      billDetails.deliveryAddress.field2 ||
      billDetails.deliveryAddress.field3);
  const formattedDeliveryAddress = formatDeliveryAddress(billDetails?.deliveryAddress);
  // Generate printable receipt content - Updated for better alignment, matching image style, proper currency display
  const generatePrintableContent = (isPreview = false) => {
    if (!billDetails) return "";
    const subtotal = calculateSubtotal();
    const vatAmount = calculateVAT();
    const grandTotal = calculateGrandTotal();
    // Use currentTime for date and time in receipt (real-time like OpeningEntry)
    const formattedDate = getFormattedDate(currentTime, settings.dateFormat);
    const formattedTime = getFormattedTime(currentTime, settings.timeFormat);
    const deliveryAddressHtml = getPrintDeliveryAddressHtml(billDetails.deliveryAddress);
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
    const poweredBy = effectivePrintSettings.poweredBy ? `Powered by ${effectivePrintSettings.poweredBy}` : "Powered by MyRestaurant";
    const formatter = getCurrencyFormatter(); // Use updated formatter for consistent currency display
    const cashGivenDisplay =
      cashGiven && !isNaN(cashGiven) && Number(cashGiven) > 0
        ? `
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Cash Given</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(cashGiven)}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Change Returned</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(change)}</td>
            </tr>
          `
        : "";
    const offerRows = billDetails.items.filter(item => item.originalBasePrice).map(item => {
      return `
        <tr>
          <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${item.item_name}:</td>
          <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;"><span style="text-decoration: line-through;">${formatter.format(item.originalBasePrice * item.quantity)}</span> ${formatter.format(item.basePrice * item.quantity)}</td>
        </tr>
      `;
    }).join('');
    const vatRows = Object.entries(getVatByRate()).map(([rate, amt]) => `
      <tr>
        <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">VAT (${rate}%):</td>
        <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(amt)}</td>
      </tr>
    `).join('');
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
              <td style="width: 50%; text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; white-space: nowrap;">${billDetails.invoice_no}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Customer</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${billDetails.customerName || "N/A"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Phone</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${billDetails.phoneNumber || "N/A"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Email</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${billDetails.email || "N/A"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">WhatsApp</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${billDetails.whatsappNumber || "N/A"}</td>
            </tr>
            ${
              billDetails.tableNumber && billDetails.tableNumber !== "N/A"
                ? `
                  <tr>
                    <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Table</td>
                    <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
                    <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${billDetails.tableNumber}</td>
                  </tr>
                `
                : ""
            }
            ${
              hasDeliveryAddress && deliveryAddressHtml
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
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${billDetails.payments?.[0]?.mode_of_payment || "CASH"}</td>
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
            ${billDetails.items
              .map((item) => {
                const { basePrice, icePrice, spicyPrice, addonTotal, comboTotal } = calculateItemPrices(item);
                return `
                  <tr>
                    <td style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px; vertical-align: top;">${getItemDisplayName(item)}</td>
                    <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${item.quantity}</td>
                    <td style="text-align: right; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${formatter.format(basePrice)}</td>
                    <td style="text-align: right; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${formatter.format(basePrice * item.quantity)}</td>
                  </tr>
                  ${
                    item.isCombo && item.comboItems && item.comboItems.length > 0
                      ? item.comboItems
                          .map(
                            (comboItem) => `
                              <tr>
                                <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ ${comboItem.name}</td>
                                <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${item.quantity}</td>
                                <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(comboItem.price)}</td>
                                <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(comboItem.price * item.quantity)}</td>
                              </tr>
                            `
                          )
                          .join("")
                      : ""
                  }
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
                                    addon.isSpicy && addon.spicyPrice > 0
                                      ? `
                                        <tr>
                                          <td style="text-align: left; padding: 2px 8px 2px 24px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px; color: #999; vertical-align: top;">+ Spicy</td>
                                          <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${addon.addon_quantity}</td>
                                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format(addon.spicyPrice)}</td>
                                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format(addon.spicyPrice * addon.addon_quantity)}</td>
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
                    item.combos && item.combos.length > 0
                      ? item.combos
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
                                    combo.isSpicy && combo.spicyPrice > 0
                                      ? `
                                        <tr>
                                          <td style="text-align: left; padding: 2px 8px 2px 24px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px; color: #999; vertical-align: top;">+ Spicy</td>
                                          <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${combo.combo_quantity}</td>
                                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format(combo.spicyPrice)}</td>
                                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format(combo.spicyPrice * combo.combo_quantity)}</td>
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
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${billDetails.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
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
  // Handle print functionality
  const handlePrint = async () => {
    const content = generatePrintableContent();
    setIsLoading(true);
    setError(null);
    try {
      if (isElectron && ipcRenderer) {
        ipcRenderer.send("open-print-preview", content);
        ipcRenderer.once("print-preview-response", (event, response) => {
          setIsLoading(false);
          if (response.success) {
            setShowModal(false);
            navigate("/frontpage");
          } else {
            setError("Failed to open print preview: " + response.error);
            setWarningMessage("Print preview failed: " + response.error);
            setWarningType("warning");
          }
        });
      } else {
        const win = window.open("", "_blank");
        win.document.write(`
          <html>
            <head>
              <title>Receipt - Invoice ${billDetails?.invoice_no || "N/A"}</title>
              <style>
                @media print {
                  body { margin: 0; }
                  @page { margin: 0; size: 88mm auto; }
                }
                body { margin: 0; }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `);
        win.document.close();
        win.focus();
        win.print();
        win.close();
        setIsLoading(false);
        setShowModal(false);
        navigate("/frontpage");
      }
    } catch (err) {
      setIsLoading(false);
      setError("Printing failed: " + err.message);
      setWarningMessage("Printing failed: " + err.message);
      setWarningType("warning");
    }
  };
  // Handle email functionality
  const handleEmail = async () => {
    if (!emailAddress || !emailAddress.includes("@")) {
      setWarningMessage("Please enter a valid email address!");
      setWarningType("warning");
      return;
    }
    const emailContent = {
      to: emailAddress,
      subject: `Receipt from My Restaurant - ${billDetails?.invoice_no || "N/A"}`,
      html: generatePrintableContent(),
    };
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post("http://localhost:8000/api/send-email", emailContent, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      });
      setIsLoading(false);
      if (response.data.success) {
        setWarningMessage("Receipt sent successfully to " + emailAddress);
        setWarningType("success");
        setPendingAction(() => () => {
          setShowModal(false);
          navigate("/frontpage");
        });
      } else {
        setError("Failed to send email: " + response.data.message);
        setWarningMessage("Failed to send email: " + response.data.message);
        setWarningType("warning");
      }
    } catch (err) {
      setIsLoading(false);
      setError("Email sending failed: " + (err.response?.data?.message || err.message));
      setWarningMessage("Email sending failed: " + (err.response?.data?.message || err.message));
      setWarningType("warning");
    }
  };
  // Navigate back to main page
  const handleBack = () => {
    navigate("/frontpage");
  };
  // Handle modal close with navigation to frontpage
  const handleModalClose = () => {
    setShowModal(false);
    navigate("/frontpage");
  };
  // Render receipt preview in UI (similar to printsettings) - Hidden in UI, shown only in print
  const renderReceiptPreview = () => {
    if (!billDetails) return null;
    const effectivePrintSettings = printSettings || defaultPrintSettings;
    // Use currentTime for preview
    const formattedDatePreview = getFormattedDate(currentTime, settings.dateFormat);
    const formattedTimePreview = getFormattedTime(currentTime, settings.timeFormat);
    const address = `${effectivePrintSettings.street || ''}${effectivePrintSettings.street ? ', ' : ''}${effectivePrintSettings.city || ''}${effectivePrintSettings.pincode ? `, ${effectivePrintSettings.pincode}` : ''}`;
    return (
      <div style={{ display: 'none' }}> {/* Hidden in UI */}
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>Receipt Preview</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Logo on the left */}
          {logoUrl && (
            <div style={{ flex: '0 0 auto' }}>
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  width: '50px',
                  height: '50px',
                  objectFit: 'contain',
                  borderRadius: '5px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none'; // Hide if error
                }}
              />
            </div>
          )}
          {/* Restaurant details on the right */}
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{effectivePrintSettings.restaurantName}</div>
            <div>{address}</div>
            <div style={{ margin: '2px 0' }}>Phone: {effectivePrintSettings.phone}</div>
            <div>GSTIN: {effectivePrintSettings.gstin}</div>
          </div>
        </div>
        <div style={{ marginTop: '10px', fontSize: '10px' }}>
          <p>Invoice: {billDetails.invoice_no}</p>
          <p>Customer: {billDetails.customerName}</p>
          <p>Date: {formattedDatePreview}</p>
          <p>Time: {formattedTimePreview}</p>
          <p>Total: {formatCurrency(calculateGrandTotal())}</p>
        </div>
        <div>
          <div style={{ textAlign: 'center', marginTop: '16px', fontWeight: 'bold', fontSize: '12px' }}>{effectivePrintSettings.thankYouMessage}</div>
          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '4px' }}>Powered by {effectivePrintSettings.poweredBy}</div>
        </div>
      </div>
    );
  };
  return (
    <>
      <style>{styles}</style>
      <div className="cash-container">
        {/* Warning message display */}
        {warningMessage && (
          <div className={`alert alert-${warningType} text-center alert-dismissible fade show`} role="alert">
            {warningMessage}
            <button type="button" className="btn btn-primary ms-3" onClick={handleWarningOk}>
              OK
            </button>
          </div>
        )}
        {/* Back button */}
        <button className="cash-back-btn" onClick={handleBack} disabled={isLoading}>
          <i className="fas fa-arrow-left"></i> Back to Main
        </button>
        {/* Error message display */}
        {error && <div className="cash-error">{error}</div>}
        <div className="cash-content">
          <div className="cash-card">
            <div className="cash-header">
              <h3>
                <i className="fas fa-money-bill-wave"></i> Cash Payment
              </h3>
            </div>
            <div className="cash-body">
              {billDetails ? (
                <div>
                  {/* Customer information */}
                  <div className="cash-customer-info">
                    <p>
                      <strong>Customer:</strong> {billDetails.customerName}
                    </p>
                    <p>
                      <strong>Phone:</strong> {billDetails.phoneNumber}
                    </p>
                    <p>
                      <strong>Email:</strong> {billDetails.email}
                    </p>
                    {billDetails.tableNumber && billDetails.tableNumber !== "N/A" && (
                      <p>
                        <strong>Table:</strong> {billDetails.tableNumber}
                      </p>
                    )}
                    {hasDeliveryAddress && formattedDeliveryAddress && (
                      <p>
                        <strong>Delivery Address:</strong> {formattedDeliveryAddress}
                      </p>
                    )}
                  </div>
                  <h6 className="cash-items-title">Items Ordered</h6>
                  <div className="cash-table-wrapper table-responsive">
                    <table
                      className="cash-table table border text-start"
                      style={{ fontSize: "13px", color: "black", fontWeight: "bold" }}
                    >
                      <thead>
                        <tr>
                          <th style={{ width: "50px" }}>T.No.</th>
                          <th>Item Details</th>
                          <th style={{ width: "80px" }}>Qty</th>
                          <th style={{ width: "80px" }}>Price</th>
                        </tr>
                      </thead>
                      <tbody className="text-start">
                        {billDetails.items.map((item, index) => {
                          const { basePrice, icePrice, spicyPrice } = calculateItemPrices(item);
                          return (
                            <React.Fragment key={index}>
                              <tr>
                                <td>{billDetails.tableNumber}</td>
                                <td>
                                  <strong>{getItemDisplayName(item)}</strong>
                                </td>
                                <td>{item.quantity}</td>
                                <td>
                                  {item.originalBasePrice ? (
                                    <>
                                      <span className="strikethroughStyle">{formatCurrency(item.originalBasePrice)}</span> {formatCurrency(basePrice)}
                                    </>
                                  ) : (
                                    formatCurrency(basePrice)
                                  )}
                                </td>
                              </tr>
                              {item.isCombo && item.comboItems && item.comboItems.map((comboItem, cIndex) => (
                                <tr className="cash-sub-item" key={`${index}-combo-${cIndex}`}>
                                  <td></td>
                                  <td>
                                    <div style={{ fontSize: "12px" }}>+ {comboItem.name}</div>
                                  </td>
                                  <td>{item.quantity}</td>
                                  <td>{formatCurrency(comboItem.price)}</td>
                                </tr>
                              ))}
                              {item.icePreference === "with_ice" && icePrice > 0 && (
                                <tr className="cash-sub-item">
                                  <td></td>
                                  <td>
                                    <div style={{ fontSize: "12px" }}>+ Ice ({formatCurrency(icePrice)})</div>
                                  </td>
                                  <td>{item.quantity}</td>
                                  <td>{formatCurrency(icePrice)}</td>
                                </tr>
                              )}
                              {item.isSpicy && spicyPrice > 0 && (
                                <tr className="cash-sub-item">
                                  <td></td>
                                  <td>
                                    <div style={{ fontSize: "12px" }}>+ Spicy ({formatCurrency(spicyPrice)})</div>
                                  </td>
                                  <td>{item.quantity}</td>
                                  <td>{formatCurrency(spicyPrice)}</td>
                                </tr>
                              )}
                              {item.customVariantsDetails &&
                                Object.keys(item.customVariantsDetails).length > 0 &&
                                Object.entries(item.customVariantsDetails).map(([variantName, variant], idx) => (
                                  <tr className="cash-sub-item" key={`${index}-custom-${idx}`}>
                                    <td></td>
                                    <td>
                                      <div style={{ fontSize: "12px" }}>
                                        + {variant.heading}: {variant.name} ({formatCurrency(variant.price)})
                                      </div>
                                    </td>
                                    <td>{item.customVariantsQuantities?.[variantName] || 1}</td>
                                    <td>{formatCurrency(variant.price)}</td>
                                  </tr>
                                ))}
                              {item.addons &&
                                item.addons.map(
                                  (addon, idx) =>
                                    addon.addon_quantity > 0 && (
                                      <React.Fragment key={`${index}-addon-${idx}`}>
                                        <tr className="cash-sub-item">
                                          <td></td>
                                          <td>
                                            <div style={{ fontSize: "12px" }}>
                                              + Addon: {addon.addon_name}
                                              {addon.size ? ` (${addon.size})` : ""}
                                            </div>
                                          </td>
                                          <td>{addon.addon_quantity}</td>
                                          <td>{formatCurrency(addon.addon_price)}</td>
                                        </tr>
                                        {addon.isSpicy && addon.spicyPrice > 0 && (
                                          <tr className="cash-sub-item">
                                            <td></td>
                                            <td>
                                              <div style={{ fontSize: "12px" }}>+ Spicy ({formatCurrency(addon.spicyPrice)})</div>
                                            </td>
                                            <td>{addon.addon_quantity}</td>
                                            <td>{formatCurrency(addon.spicyPrice)}</td>
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
                                        <tr className="cash-sub-item">
                                          <td></td>
                                          <td>
                                            <div style={{ fontSize: "12px" }}>
                                              + Combo: {combo.name1}
                                              {combo.size ? ` (${combo.size})` : ""}
                                            </div>
                                          </td>
                                          <td>{combo.combo_quantity}</td>
                                          <td>{formatCurrency(combo.combo_price)}</td>
                                        </tr>
                                        {combo.isSpicy && combo.spicyPrice > 0 && (
                                          <tr className="cash-sub-item">
                                            <td></td>
                                            <td>
                                              <div style={{ fontSize: "12px" }}>+ Spicy ({formatCurrency(combo.spicyPrice)})</div>
                                            </td>
                                            <td>{combo.combo_quantity}</td>
                                            <td>{formatCurrency(combo.spicyPrice)}</td>
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
                  {/* Totals section - FIXED: Use breakdown for VAT like FrontPage */}
                  <div className="cash-totals">
                    <p>
                      <strong>Total Quantity:</strong> {billDetails.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </p>
                    {billDetails.items.filter(item => item.originalBasePrice).map(item => (
                      <p key={item.item_name}>
                        <strong>{item.item_name}:</strong>{" "}
                        <span className="strikethroughStyle">{formatCurrency(item.originalBasePrice * item.quantity)}</span> {formatCurrency(item.basePrice * item.quantity)}
                      </p>
                    ))}
                    <p>
                      <strong>Subtotal:</strong> {formatCurrency(calculateSubtotal())}
                    </p>
                    {Object.entries(getVatByRate()).map(([rate, amt]) => (
                      <p key={rate}>
                        <strong>VAT {rate}%:</strong> {formatCurrency(amt)}
                      </p>
                    ))}
                    <p>
                      <strong>Total VAT:</strong> {formatCurrency(calculateVAT())}
                    </p>
                    <p>
                      <strong>Grand Total:</strong> <span className="grand-total">{formatCurrency(calculateGrandTotal())}</span>
                    </p>
                  </div>
                  {/* Receipt Preview Section - Hidden in UI, shown only in print */}
                  {renderReceiptPreview()}
                  {/* Cash input section */}
                  <div className="cash-input-section">
                    <label>Cash Given:</label>
                    <input
                      type="number"
                      className="cash-input"
                      placeholder="Enter amount"
                      value={cashGiven}
                      onChange={handleCashChange}
                      min="0"
                      step="0.01"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="cash-change">
                    <label>Change to Return:</label>
                    <span>{formatCurrency(change)}</span>
                  </div>
                  <div className="cash-confirm">
                    <button className="cash-confirm-btn" onClick={handlePaymentConfirm} disabled={isLoading}>
                      {isLoading ? "Processing..." : "Confirm Payment"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cash-empty">
                  <p>No payment details available</p>
                  <button className="cash-return-btn" onClick={handleBack} disabled={isLoading}>
                    Return to Main Page
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Modal for bill details and actions */}
        <Modal show={showModal} onHide={handleModalClose} size="lg" centered>
          <Modal.Header closeButton className="cash-modal-header">
            <Modal.Title>Bill Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <label className="form-label">Email Receipt To:</label>
              <input
                type="email"
                className="form-control cash-modal-input"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Enter email address"
                disabled={isLoading}
              />
            </div>
            {billDetails && (
              <div>
                <table className="table table-striped table-bordered">
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", textAlign: "left" }}>
                        <strong>Invoice No:</strong>
                      </td>
                      <td style={{ width: "50%", textAlign: "right", whiteSpace: "nowrap" }}>{billDetails.invoice_no}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Customer:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{billDetails.customerName}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Phone:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{billDetails.phoneNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Email:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{billDetails.email}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>WhatsApp:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{billDetails.whatsappNumber}</td>
                    </tr>
                    {billDetails.tableNumber && billDetails.tableNumber !== "N/A" && (
                      <tr>
                        <td style={{ textAlign: "left" }}>
                          <strong>Table:</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>{billDetails.tableNumber}</td>
                      </tr>
                    )}
                    {hasDeliveryAddress && formattedDeliveryAddress && (
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
                      <td style={{ textAlign: "right" }}>{billDetails.payments?.[0]?.mode_of_payment || "CASH"}</td>
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
                <h5>Items:</h5>
                <div className="table-responsive">
                  <table
                    className="table table-striped table-bordered"
                    style={{ fontSize: "13px", color: "black", fontWeight: "bold" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>T.No.</th>
                        <th>Item Details</th>
                        <th style={{ width: "80px" }}>Qty</th>
                        <th style={{ width: "80px" }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billDetails.items.map((item, index) => {
                        const { basePrice, icePrice, spicyPrice } = calculateItemPrices(item);
                        return (
                          <React.Fragment key={index}>
                            <tr>
                              <td>{billDetails.tableNumber}</td>
                              <td>
                                <strong>{getItemDisplayName(item)}</strong>
                              </td>
                              <td>{item.quantity}</td>
                              <td>
                                {item.originalBasePrice ? (
                                  <>
                                    <span className="strikethroughStyle">{formatCurrency(item.originalBasePrice)}</span> {formatCurrency(basePrice)}
                                  </>
                                ) : (
                                  formatCurrency(basePrice)
                                )}
                              </td>
                            </tr>
                            {item.isCombo && item.comboItems && item.comboItems.map((comboItem, cIndex) => (
                              <tr key={`${index}-combo-${cIndex}`}>
                                <td></td>
                                <td>
                                  <div style={{ fontSize: "12px" }}>+ {comboItem.name}</div>
                                </td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(comboItem.price)}</td>
                              </tr>
                            ))}
                            {item.icePreference === "with_ice" && icePrice > 0 && (
                              <tr>
                                <td></td>
                                <td>
                                  <div style={{ fontSize: "12px" }}>+ Ice ({formatCurrency(icePrice)})</div>
                                </td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(icePrice)}</td>
                              </tr>
                            )}
                            {item.isSpicy && spicyPrice > 0 && (
                              <tr>
                                <td></td>
                                <td>
                                  <div style={{ fontSize: "12px" }}>+ Spicy ({formatCurrency(spicyPrice)})</div>
                                </td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(spicyPrice)}</td>
                              </tr>
                            )}
                            {item.customVariantsDetails &&
                              Object.keys(item.customVariantsDetails).length > 0 &&
                              Object.entries(item.customVariantsDetails).map(([variantName, variant], idx) => (
                                <tr key={`${index}-custom-${idx}`}>
                                  <td></td>
                                  <td>
                                    <div style={{ color: "#888", fontSize: "12px" }}>
                                      + {variant.heading}: {variant.name} ({formatCurrency(variant.price)})
                                    </div>
                                  </td>
                                  <td>{item.customVariantsQuantities?.[variantName] || 1}</td>
                                  <td>{formatCurrency(variant.price)}</td>
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
                                        <td>{formatCurrency(addon.addon_price)}</td>
                                      </tr>
                                      {addon.isSpicy && addon.spicyPrice > 0 && (
                                        <tr>
                                          <td></td>
                                          <td>
                                            <div style={{ color: "#888", fontSize: "12px" }}>
                                              + Spicy ({formatCurrency(addon.spicyPrice)})
                                            </div>
                                          </td>
                                          <td>{addon.addon_quantity}</td>
                                          <td>{formatCurrency(addon.spicyPrice * addon.addon_quantity)}</td>
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
                                        <td>{formatCurrency(combo.combo_price)}</td>
                                      </tr>
                                      {combo.isSpicy && combo.spicyPrice > 0 && (
                                        <tr>
                                          <td></td>
                                          <td>
                                            <div style={{ color: "#888", fontSize: "12px" }}>
                                              + Spicy ({formatCurrency(combo.spicyPrice)})
                                            </div>
                                          </td>
                                          <td>{combo.combo_quantity}</td>
                                          <td>{formatCurrency(combo.spicyPrice * combo.combo_quantity)}</td>
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
                <div className="mt-3">
                  <p>
                    <strong>Subtotal:</strong> {formatCurrency(calculateSubtotal())}
                  </p>
                  {Object.entries(getVatByRate()).map(([rate, amt]) => (
                    <p key={rate}>
                      <strong>VAT {rate}%:</strong> {formatCurrency(amt)}
                    </p>
                  ))}
                  <p>
                    <strong>Total VAT:</strong> {formatCurrency(calculateVAT())}
                  </p>
                  <p>
                    <strong>Grand Total:</strong> {formatCurrency(calculateGrandTotal())}
                  </p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="cash-modal-footer">
            <Button variant="secondary" onClick={handleModalClose} disabled={isLoading}>
              Close
            </Button>
            <Button variant="info" onClick={handleEmail} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Email"}
            </Button>
            <Button variant="primary" onClick={handlePrint} disabled={isLoading}>
              {isLoading ? "Processing..." : "Print Preview"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}
export default Cash;