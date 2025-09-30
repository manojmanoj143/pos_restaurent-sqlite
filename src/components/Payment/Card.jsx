import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
import "./card.css";

// Check if running in Electron environment
const isElectron = window && window.process && window.process.type;
const ipcRenderer = isElectron ? window.require("electron").ipcRenderer : null;

function Card() {
  const [transactionNumber, setTransactionNumber] = useState("");
  const [errors, setErrors] = useState({});
  const [billDetails, setBillDetails] = useState(null);
  const [cardData, setCardData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [pendingAction, setPendingAction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [printSettings, setPrintSettings] = useState(null);
  const [vatRate, setVatRate] = useState(0.1);
  const API_URL = 'http://localhost:8000';

  // Fetch VAT rate
  useEffect(() => {
    const fetchVat = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/get-vat`);
        setVatRate(response.data.vat / 100);
      } catch (error) {
        console.error('Failed to fetch VAT:', error);
      }
    };
    fetchVat();
  }, []);

  // Fetch active print settings
  const fetchActivePrintSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/print_settings/active`);
      if (!response.ok) {
        throw new Error(`Failed to fetch active print settings: ${response.statusText}`);
      }
      const data = await response.json();
      setPrintSettings(data);
    } catch (err) {
      console.error("Error fetching active print settings:", err.message);
      // Use defaults if fetch fails
      setPrintSettings({
        restaurantName: "My Restaurant",
        street: "123 Store Street",
        city: "City",
        pincode: "",
        phone: "+91 123-456-7890",
        gstin: "12ABCDE3456F7Z8",
        thankYouMessage: "Thank You! Visit Again!",
        poweredBy: "MyRestaurant",
      });
    }
  };

  // Initialize bill details from location state or use hardcoded data
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    fetchActivePrintSettings();
    if (location.state?.billDetails) {
      const formattedBillDetails = {
        ...location.state.billDetails,
        invoice_no: location.state.billDetails.invoice_no || `INV-${Date.now()}`,
        totalAmount: Number(location.state.billDetails.totalAmount) || 0,
        customerName: location.state.billDetails.customerName || "Manoj",
        phoneNumber: location.state.billDetails.phoneNumber || "+918921083090",
        email: location.state.billDetails.email || "manoj.k88680@gmail.com",
        whatsappNumber: location.state.billDetails.whatsappNumber || "+918921083090",
        tableNumber: location.state.billDetails.tableNumber || "N/A",
        deliveryAddress: location.state.billDetails.deliveryAddress || {
          building_name: "23rw",
          flat_villa_no: "1123",
          location: "sdfdfg",
        },
        date: location.state.billDetails.date || new Date().toISOString().split("T")[0],
        time:
          location.state.billDetails.time ||
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        payments: location.state.billDetails.payments || [{ mode_of_payment: "CARD" }],
        items: location.state.billDetails.items.map((item) => ({
          ...item,
          item_name: item.item_name || item.name || "Unnamed Item",
          quantity: Number(item.quantity) || 1,
          basePrice: Number(item.basePrice) || Number(item.price) || 0,
          totalPrice: Number(item.totalPrice) || Number(item.basePrice) * Number(item.quantity) || 0,
          selectedSize: item.selectedSize || null,
          icePreference: item.icePreference || "without_ice",
          icePrice: Number(item.icePrice) || 0,
          isSpicy: item.isSpicy || false,
          spicyPrice: item.isSpicy ? Number(item.spicyPrice) || 20.00 : 0,
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
          addons: item.addonQuantities
            ? Object.entries(item.addonQuantities)
                .filter(([_, qty]) => Number(qty) > 0)
                .map(([name, qty]) => ({
                  addon_name: name,
                  addon_quantity: Number(qty) || 0,
                  addon_price: Number(item.addonSizePrices?.[name]) || Number(item.addonPrices?.[name]) || 0,
                  addon_total_price: Number(item.addonPrices?.[name]) || 0,
                  size: item.addonVariants?.[name]?.size || "M",
                  isSpicy: item.addonVariants?.[name]?.spicy || false,
                  spicyPrice: Number(item.addonSpicyPrices?.[name]) || 0,
                  kitchen: item.addonVariants?.[name]?.kitchen || "Main Kitchen",
                  addon_image: item.addonImages?.[name] || "/static/images/default-addon-image.jpg",
                }))
            : item.addons || [],
          combos: item.comboQuantities
            ? Object.entries(item.comboQuantities)
                .filter(([_, qty]) => Number(qty) > 0)
                .map(([name, qty]) => ({
                  name1: name,
                  combo_price: Number(item.comboSizePrices?.[name]) || Number(item.comboPrices?.[name]) || 0,
                  combo_total_price: Number(item.comboPrices?.[name]) || 0,
                  size: item.comboVariants?.[name]?.size || "M",
                  combo_quantity: Number(qty) || 1,
                  isSpicy: item.comboVariants?.[name]?.spicy || false,
                  spicyPrice: Number(item.comboSpicyPrices?.[name]) || 0,
                  kitchen: item.comboVariants?.[name]?.kitchen || "Main Kitchen",
                  combo_image: item.comboImages?.[name] || "/static/images/default-combo-image.jpg",
                }))
            : item.combos || item.selectedCombos || [],
        })),
      };
      setBillDetails(formattedBillDetails);
      setEmailAddress(formattedBillDetails.email);
    } else {
      const hardcodedBillDetails = {
        invoice_no: `INV-${Date.now()}`,
        customerName: "Manoj",
        phoneNumber: "+918921083090",
        email: "manoj.k88680@gmail.com",
        whatsappNumber: "+918921083090",
        tableNumber: "N/A",
        deliveryAddress: {
          building_name: "23rw",
          flat_villa_no: "1123",
          location: "sdfdfg",
        },
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        payments: [{ mode_of_payment: "CARD" }],
        items: [
          {
            item_name: "Chicken Burger",
            basePrice: 100.00,
            quantity: 1,
            selectedSize: "S",
            icePreference: "without_ice",
            icePrice: 0,
            isSpicy: false,
            spicyPrice: 0,
            kitchen: "journal kitchen",
            addons: [
              { addon_name: "Patty", addon_quantity: 1, addon_price: 50.00, size: "M", isSpicy: true, spicyPrice: 20.00, kitchen: "journal kitchen" },
              { addon_name: "Buffalo Sauce", addon_quantity: 1, addon_price: 50.00, size: "M", isSpicy: true, spicyPrice: 20.00, kitchen: "journal kitchen" },
            ],
            combos: [
              { name1: "Burger & Fries", combo_price: 120.00, size: "S", combo_quantity: 1, isSpicy: true, spicyPrice: 30.00, kitchen: "journal kitchen" },
            ],
            customVariantsDetails: {},
            customVariantsQuantities: {},
          },
          {
            item_name: "ice",
            basePrice: 15.00,
            quantity: 1,
            selectedSize: "S",
            icePreference: "with_ice",
            icePrice: 0,
            isSpicy: false,
            spicyPrice: 0,
            kitchen: "Juice Counter",
            addons: [],
            combos: [],
            customVariantsDetails: {
              flavour: { heading: "flavour", name: "vennila", price: 30.00 },
            },
            customVariantsQuantities: { flavour: 1 },
          },
          {
            item_name: "Watermelon",
            basePrice: 40.00,
            quantity: 1,
            selectedSize: "M",
            icePreference: "without_ice",
            icePrice: 0,
            isSpicy: false,
            spicyPrice: 0,
            kitchen: "Juice Counter",
            addons: [],
            combos: [],
            customVariantsDetails: {},
            customVariantsQuantities: {},
          },
        ],
      };
      setBillDetails(hardcodedBillDetails);
      setEmailAddress(hardcodedBillDetails.email);
    }
  }, [location]);

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

  // Focus input when billDetails is loaded
  useEffect(() => {
    if (billDetails && inputRef.current) {
      inputRef.current.focus();
    }
  }, [billDetails]);

  // Calculate item prices including addons, combos, and custom variants
  const calculateItemPrices = (item) => {
    const basePrice = Number(item.basePrice) || 0;
    const icePrice = item.icePreference === "with_ice" ? Number(item.icePrice) || 0 : 0;
    const spicyPrice = item.isSpicy ? Number(item.spicyPrice) || 0 : 0;
    const addonTotal =
      item.addons?.length > 0
        ? item.addons.reduce(
            (sum, addon) =>
              sum +
              (Number(addon.addon_price) || 0) * (addon.addon_quantity || 0) +
              (addon.isSpicy ? (Number(addon.spicyPrice) || 0) * (addon.addon_quantity || 0) : 0),
            0
          )
        : 0;
    const comboTotal =
      item.combos?.length > 0
        ? item.combos.reduce(
            (sum, combo) =>
              sum +
              (Number(combo.combo_price) || 0) * (combo.combo_quantity || 1) +
              (combo.isSpicy ? (Number(combo.spicyPrice) || 0) * (combo.combo_quantity || 1) : 0),
            0
          )
        : 0;
    const customVariantsTotal = item.customVariantsDetails
      ? Object.values(item.customVariantsDetails).reduce(
          (sum, variant) => sum + (Number(variant.price) || 0) * (item.customVariantsQuantities?.[variant.name] || 1),
          0
        )
      : 0;
    const totalAmount = (basePrice + icePrice + spicyPrice + customVariantsTotal) * (item.quantity || 1) + addonTotal + comboTotal;
    return { basePrice, icePrice, spicyPrice, addonTotal, comboTotal, customVariantsTotal, totalAmount };
  };

  // Get display name for items
  const getItemDisplayName = (item) => {
    const sizeDisplay = item.selectedSize ? ` (${item.selectedSize})` : "";
    return `${item.item_name}${sizeDisplay}`;
  };

  // Calculate subtotal for all items
  const calculateSubtotal = () => {
    if (!billDetails?.items) return 0;
    return billDetails.items.reduce((sum, item) => {
      const { totalAmount } = calculateItemPrices(item);
      return sum + totalAmount;
    }, 0);
  };

  // Calculate VAT
  const calculateVAT = () => {
    return Number(calculateSubtotal() * vatRate);
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return Number(calculateSubtotal() + calculateVAT());
  };

  // Parse card swipe data
  const parseCardData = (swipeData) => {
    const track1Match = swipeData.match(/%B(\d{16})\^([^/]+)\/(.+)\^(\d{4})/);
    if (track1Match) {
      return {
        cardNumber: track1Match[1],
        lastName: track1Match[2],
        firstName: track1Match[3],
        expiry: track1Match[4],
      };
    }
    return null;
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

  // Handle transaction number input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setTransactionNumber(value);
    if (value.startsWith("%B") && value.endsWith("?")) {
      const parsedData = parseCardData(value);
      if (parsedData) {
        setCardData(parsedData);
        setTransactionNumber(parsedData.cardNumber);
        processPayment(parsedData);
      } else {
        setErrors({ transactionNumber: "Invalid card swipe data." });
      }
    } else {
      setErrors({});
    }
  };

  // Process card payment
  const processPayment = (cardData) => {
    setIsLoading(true);
    setError(null);
    console.log("Processing payment with card:", cardData);
    console.log("Amount:", calculateGrandTotal().toFixed(2));
    setTimeout(() => {
      setWarningMessage(
        `Payment of ₹${calculateGrandTotal().toFixed(2)} successful with card ending ${cardData.cardNumber.slice(-4)}`
      );
      setWarningType("success");
      setPendingAction(() => () => {
        setShowModal(true);
      });
      setIsLoading(false);
    }, 1000);
  };

  // Simulate card swipe for testing
  const simulateCardSwipe = () => {
    const fakeSwipeData = "%B1234567890123456^DOE/JOHN^25051011000?";
    setTransactionNumber(fakeSwipeData);
    const parsedData = parseCardData(fakeSwipeData);
    if (parsedData) {
      setCardData(parsedData);
      setTransactionNumber(parsedData.cardNumber);
      processPayment(parsedData);
    }
  };

  // Validate transaction number
  const validateFields = () => {
    let newErrors = {};
    if (!transactionNumber || !/^[a-zA-Z0-9]{6,20}$/.test(transactionNumber)) {
      newErrors.transactionNumber = "Enter a valid transaction number (6-20 characters).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle card payment submission
  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (validateFields()) {
      if (cardData) {
        processPayment(cardData);
      } else {
        setIsLoading(true);
        setError(null);
        console.log("Manual payment with transaction number:", transactionNumber);
        setTimeout(() => {
          setWarningMessage(`Card Payment Confirmed! Transaction Number: ${transactionNumber}`);
          setWarningType("success");
          setPendingAction(() => () => {
            setShowModal(true);
          });
          setIsLoading(false);
        }, 1000);
      }
    }
  };

  // Navigate back to main page
  const handleBack = () => {
    navigate("/frontpage");
  };

  // Format numbers for display
  const formatTotal = (amount) => {
    const num = Number(amount);
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  // Generate printable receipt content
  const generatePrintableContent = (isPreview = false) => {
    if (!billDetails || !printSettings) return "";
    const subtotal = calculateSubtotal();
    const vatAmount = calculateVAT();
    const grandTotal = calculateGrandTotal();
    const hasDeliveryAddress =
      billDetails.deliveryAddress &&
      (billDetails.deliveryAddress.building_name ||
        billDetails.deliveryAddress.flat_villa_no ||
        billDetails.deliveryAddress.location);
    const deliveryAddress = hasDeliveryAddress
      ? `${billDetails.deliveryAddress.building_name || ""}, ${billDetails.deliveryAddress.flat_villa_no || ""}, ${billDetails.deliveryAddress.location || ""}`
      : null;
    const borderStyle = isPreview ? "border: none;" : "border: 1px solid #000000;";
    const cardDetailsDisplay = cardData
      ? `
          <tr style="margin-bottom: 5px;">
            <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Card Number</td>
            <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
            <td style="width: 50%; text-align: right; padding: 2px; border: none; line-height: 1.5; white-space: nowrap;">**** **** **** ${cardData.cardNumber.slice(-4)}</td>
          </tr>
          <tr style="margin-bottom: 5px;">
            <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Transaction Number</td>
            <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
            <td style="width: 50%; text-align: right; padding: 2px; border: none; line-height: 1.5; white-space: nowrap;">${transactionNumber}</td>
          </tr>
        `
      : `
          <tr style="margin-bottom: 5px;">
            <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Transaction Number</td>
            <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
            <td style="width: 50%; text-align: right; padding: 2px; border: none; line-height: 1.5; white-space: nowrap;">${transactionNumber}</td>
          </tr>
        `;
    const addressDisplay = `${printSettings.street ? `${printSettings.street}, ` : ''}${printSettings.city || ''}${printSettings.pincode ? ` - ${printSettings.pincode}` : ''}`;
    const offerRows = billDetails.items.filter(item => item.originalBasePrice).map(item => `
      <tr>
        <td style="text-align: left; padding: 2px; border: none; line-height: 1.5; font-size: 15px;">${item.item_name}:</td>
        <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; font-size: 15px;"><span style="text-decoration: line-through;">₹${(item.originalBasePrice * item.quantity).toFixed(2)}</span> ₹${(item.basePrice * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');
    return `
      <div style="font-family: Arial, sans-serif; width: 88mm; font-size: 12px; padding: 10px; color: #000000; ${borderStyle} box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 16px; color: #000000;">${printSettings.restaurantName || 'My Restaurant'}</h3>
          <p style="margin: 2px 0;">${addressDisplay}</p>
          <p style="margin: 2px 0;">Phone: ${printSettings.phone || '+91 123-456-7890'}</p>
          <p style="margin: 2px 0;">GSTIN: ${printSettings.gstin || '12ABCDE3456F7Z8'}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px;">
          <tbody>
            <tr style="margin-bottom: 5px;">
              <td style="width: 50%; text-align: left; padding: 2px; border: none; line-height: 1.5;">Invoice No</td>
              <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
              <td style="width: 50%; text-align: right; padding: 2px; border: none; line-height: 1.5; white-space: nowrap;">${billDetails.invoice_no}</td>
            </tr>
            <tr style="margin-bottom: 5px;">
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Customer</td>
              <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; word-break: break-all;">${billDetails.customerName || "N/A"}</td>
            </tr>
            <tr style="margin-bottom: 5px;">
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Phone</td>
              <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; word-break: break-all;">${billDetails.phoneNumber || "N/A"}</td>
            </tr>
            <tr style="margin-bottom: 5px;">
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Email</td>
              <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; word-break: break-all;">${billDetails.email || "N/A"}</td>
            </tr>
            <tr style="margin-bottom: 5px;">
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">WhatsApp</td>
              <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; word-break: break-all;">${billDetails.whatsappNumber || "N/A"}</td>
            </tr>
            ${
              billDetails.tableNumber && billDetails.tableNumber !== "N/A"
                ? `
                  <tr style="margin-bottom: 5px;">
                    <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Table</td>
                    <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
                    <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; word-break: break-all;">${billDetails.tableNumber}</td>
                  </tr>
                `
                : ""
            }
            ${
              hasDeliveryAddress
                ? `
                  <tr style="margin-bottom: 5px;">
                    <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Delivery Address</td>
                    <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
                    <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; word-break: break-all;">${deliveryAddress}</td>
                  </tr>
                `
                : ""
            }
            <tr style="margin-bottom: 5px;">
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Payment Mode</td>
              <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; word-break: break-all;">${billDetails.payments?.[0]?.mode_of_payment || "CARD"}</td>
            </tr>
            ${cardDetailsDisplay}
            <tr style="margin-bottom: 5px;">
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Date</td>
              <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; white-space: nowrap;">${billDetails.date}</td>
            </tr>
            <tr style="margin-bottom: 5px;">
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5;">Time</td>
              <td style="text-align: center; padding: 2px; border: none; line-height: 1.5;">:</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; white-space: nowrap;">${billDetails.time}</td>
            </tr>
          </tbody>
        </table>
        <table style="width: 100%; margin-bottom: 10px; border-collapse: collapse; border: 1px solid #000000; table-layout: fixed;">
          <thead>
            <tr style="border-bottom: 1px dashed #000000;">
              <th style="text-align: left; width: 40%; padding: 4px;">Item</th>
              <th style="text-align: center; width: 15%; padding: 4px;">Qty</th>
              <th style="text-align: right; width: 20%; padding: 4px;">Price</th>
              <th style="text-align: right; width: 25%; padding: 4px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${billDetails.items
              .map((item) => {
                const { basePrice, icePrice, spicyPrice } = calculateItemPrices(item);
                return `
                  <tr>
                    <td style="text-align: left; padding: 4px;">${getItemDisplayName(item)}</td>
                    <td style="text-align: center; padding: 4px;">${item.quantity}</td>
                    <td style="text-align: right; padding: 4px;">₹${formatTotal(basePrice)}</td>
                    <td style="text-align: right; padding: 4px;">₹${formatTotal(basePrice * item.quantity)}</td>
                  </tr>
                  ${
                    item.icePreference === "with_ice" && icePrice > 0
                      ? `
                        <tr>
                          <td style="text-align: left; padding-left: 10px; padding: 4px;">+ Ice</td>
                          <td style="text-align: center; padding: 4px;">${item.quantity}</td>
                          <td style="text-align: right; padding: 4px;">₹${formatTotal(icePrice)}</td>
                          <td style="text-align: right; padding: 4px;">₹${formatTotal(icePrice * item.quantity)}</td>
                        </tr>
                      `
                      : ""
                  }
                  ${
                    item.isSpicy && spicyPrice > 0
                      ? `
                        <tr>
                          <td style="text-align: left; padding-left: 10px; padding: 4px;">+ Spicy</td>
                          <td style="text-align: center; padding: 4px;">${item.quantity}</td>
                          <td style="text-align: right; padding: 4px;">₹${formatTotal(spicyPrice)}</td>
                          <td style="text-align: right; padding: 4px;">₹${formatTotal(spicyPrice * item.quantity)}</td>
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
                              <td style="text-align: left; padding-left: 10px; padding: 4px;">+ ${variant.heading}: ${variant.name}</td>
                              <td style="text-align: center; padding: 4px;">${item.customVariantsQuantities?.[variantName] || 1}</td>
                              <td style="text-align: right; padding: 4px;">₹${formatTotal(variant.price)}</td>
                              <td style="text-align: right; padding: 4px;">₹${formatTotal(variant.price * (item.customVariantsQuantities?.[variantName] || 1))}</td>
                            </tr>
                          `
                          )
                          .join("")
                      : ""
                  }
                  ${
                    item.addons?.length > 0
                      ? item.addons
                          .map(
                            (addon) =>
                              addon.addon_quantity > 0
                                ? `
                                  <tr>
                                    <td style="text-align: left; padding-left: 10px; padding: 4px;">+ Addon: ${addon.addon_name}${addon.size ? ` (${addon.size})` : ""}</td>
                                    <td style="text-align: center; padding: 4px;">${addon.addon_quantity}</td>
                                    <td style="text-align: right; padding: 4px;">₹${formatTotal(addon.addon_price)}</td>
                                    <td style="text-align: right; padding: 4px;">₹${formatTotal(addon.addon_price * addon.addon_quantity)}</td>
                                  </tr>
                                  ${
                                    addon.isSpicy && addon.spicyPrice > 0
                                      ? `
                                        <tr>
                                          <td style="text-align: left; padding-left: 15px; padding: 4px;">+ Spicy</td>
                                          <td style="text-align: center; padding: 4px;">${addon.addon_quantity}</td>
                                          <td style="text-align: right; padding: 4px;">₹${formatTotal(addon.spicyPrice)}</td>
                                          <td style="text-align: right; padding: 4px;">₹${formatTotal(addon.spicyPrice * addon.addon_quantity)}</td>
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
                    item.combos?.length > 0
                      ? item.combos
                          .map(
                            (combo) =>
                              combo.combo_quantity > 0
                                ? `
                                  <tr>
                                    <td style="text-align: left; padding-left: 10px; padding: 4px;">+ Combo: ${combo.name1}${combo.size ? ` (${combo.size})` : ""}</td>
                                    <td style="text-align: center; padding: 4px;">${combo.combo_quantity}</td>
                                    <td style="text-align: right; padding: 4px;">₹${formatTotal(combo.combo_price)}</td>
                                    <td style="text-align: right; padding: 4px;">₹${formatTotal(combo.combo_price * combo.combo_quantity)}</td>
                                  </tr>
                                  ${
                                    combo.isSpicy && combo.spicyPrice > 0
                                      ? `
                                        <tr>
                                          <td style="text-align: left; padding-left: 15px; padding: 4px;">+ Spicy</td>
                                          <td style="text-align: center; padding: 4px;">${combo.combo_quantity}</td>
                                          <td style="text-align: right; padding: 4px;">₹${formatTotal(combo.spicyPrice)}</td>
                                          <td style="text-align: right; padding: 4px;">₹${formatTotal(combo.spicyPrice * combo.combo_quantity)}</td>
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
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5; font-size: 15px;">Total Quantity:</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; font-size: 15px;">${billDetails.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
            </tr>
            ${offerRows}
            <tr>
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5; font-size: 15px;">Subtotal:</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; font-size: 15px;">₹${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5; font-size: 15px;">VAT (${vatRate * 100}%):</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; font-size: 15px;">₹${vatAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 2px; border: none; line-height: 1.5; font-size: 15px;">Grand Total:</td>
              <td style="text-align: right; padding: 2px; border: none; line-height: 1.5; font-size: 15px;">₹${grandTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <div style="text-align: center; margin-top: 15px;">
          <p style="margin: 2px 0;">${printSettings.thankYouMessage || 'Thank You! Visit Again!'}</p>
          <p style="margin: 2px 0;">Powered by ${printSettings.poweredBy || 'MyRestaurant'}</p>
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
      subject: `Receipt from ${printSettings?.restaurantName || 'My Restaurant'} - ${billDetails?.invoice_no || "N/A"}`,
      html: generatePrintableContent(),
    };
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/send-email`, emailContent, {
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

  // Handle modal close with navigation
  const handleModalClose = () => {
    setShowModal(false);
    navigate("/frontpage");
  };

  // Check if delivery address is available
  const hasDeliveryAddress =
    billDetails?.deliveryAddress &&
    (billDetails.deliveryAddress.building_name ||
      billDetails.deliveryAddress.flat_villa_no ||
      billDetails.deliveryAddress.location);

  return (
    <div className="card-container">
      {warningMessage && (
        <div className={`alert alert-${warningType} text-center alert-dismissible fade show`} role="alert">
          {warningMessage}
          <button type="button" className="btn btn-primary ms-3" onClick={handleWarningOk}>
            OK
          </button>
        </div>
      )}
      <button className="card-back-btn" onClick={handleBack} disabled={isLoading}>
        <i className="bi bi-arrow-left-circle-fill"></i> Back to Main
      </button>
      {error && <div className="card-error text-danger text-center my-3">{error}</div>}
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 col-sm-10">
            <div className="card shadow-lg border-0 rounded-3">
              <div className="card-header bg-primary text-white text-center py-3">
                <h3 className="mb-0">Card Payment</h3>
              </div>
              <div className="card-body p-4">
                {billDetails ? (
                  <div className="mb-4">
                    <div className="customer-info mb-4">
                      <h5 className="fw-bold">
                        Customer: <span className="text-primary">{billDetails.customerName}</span>
                      </h5>
                      <p>
                        <strong>Phone:</strong> {billDetails.phoneNumber}
                      </p>
                      <p>
                        <strong>Email:</strong> {billDetails.email}
                      </p>
                      <p>
                        <strong>Location:</strong>{" "}
                        {billDetails.tableNumber !== "N/A"
                          ? `Table ${billDetails.tableNumber}`
                          : `${billDetails.deliveryAddress?.building_name || ""}, ${billDetails.deliveryAddress?.flat_villa_no || ""}, ${billDetails.deliveryAddress?.location || "N/A"}`}
                      </p>
                    </div>
                    <h6 className="fw-bold mb-3">Items Ordered:</h6>
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
                                  <td>₹{formatTotal(basePrice)}</td>
                                </tr>
                                {item.icePreference === "with_ice" && icePrice > 0 && (
                                  <tr className="sub-item">
                                    <td></td>
                                    <td>
                                      <div style={{ color: "#888", fontSize: "12px" }}>
                                        + Ice (₹{formatTotal(icePrice)})
                                      </div>
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>₹{formatTotal(icePrice)}</td>
                                  </tr>
                                )}
                                {item.isSpicy && spicyPrice > 0 && (
                                  <tr className="sub-item">
                                    <td></td>
                                    <td>
                                      <div style={{ color: "#888", fontSize: "12px" }}>
                                        + Spicy (₹{formatTotal(spicyPrice)})
                                      </div>
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>₹{formatTotal(spicyPrice)}</td>
                                  </tr>
                                )}
                                {item.customVariantsDetails &&
                                  Object.keys(item.customVariantsDetails).length > 0 &&
                                  Object.entries(item.customVariantsDetails).map(([variantName, variant], idx) => (
                                    <tr className="sub-item" key={`${index}-custom-${idx}`}>
                                      <td></td>
                                      <td>
                                        <div style={{ color: "#888", fontSize: "12px" }}>
                                          + {variant.heading}: {variant.name} (₹{formatTotal(variant.price)})
                                        </div>
                                      </td>
                                      <td>{item.customVariantsQuantities?.[variantName] || 1}</td>
                                      <td>₹{formatTotal(variant.price)}</td>
                                    </tr>
                                  ))}
                                {item.addons?.map(
                                  (addon, idx) =>
                                    addon.addon_quantity > 0 && (
                                      <React.Fragment key={`${index}-addon-${idx}`}>
                                        <tr className="sub-item">
                                          <td></td>
                                          <td>
                                            <div style={{ color: "#2ecc71", fontSize: "12px" }}>
                                              + Addon: {addon.addon_name}{addon.size ? ` (${addon.size})` : ""}
                                            </div>
                                          </td>
                                          <td>{addon.addon_quantity}</td>
                                          <td>₹{formatTotal(addon.addon_price)}</td>
                                        </tr>
                                        {addon.isSpicy && addon.spicyPrice > 0 && (
                                          <tr className="sub-item">
                                            <td></td>
                                            <td>
                                              <div style={{ color: "#888", fontSize: "12px" }}>
                                                + Spicy (₹{formatTotal(addon.spicyPrice)})
                                              </div>
                                            </td>
                                            <td>{addon.addon_quantity}</td>
                                            <td>₹{formatTotal(addon.spicyPrice * addon.addon_quantity)}</td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    )
                                )}
                                {item.combos?.map(
                                  (combo, idx) =>
                                    combo.combo_quantity > 0 && (
                                      <React.Fragment key={`${index}-combo-${idx}`}>
                                        <tr className="sub-item">
                                          <td></td>
                                          <td>
                                            <div style={{ color: "#e74c3c", fontSize: "12px" }}>
                                              + Combo: {combo.name1}{combo.size ? ` (${combo.size})` : ""}
                                            </div>
                                          </td>
                                          <td>{combo.combo_quantity}</td>
                                          <td>₹{formatTotal(combo.combo_price)}</td>
                                        </tr>
                                        {combo.isSpicy && combo.spicyPrice > 0 && (
                                          <tr className="sub-item">
                                            <td></td>
                                            <td>
                                              <div style={{ color: "#888", fontSize: "12px" }}>
                                                + Spicy (₹{formatTotal(combo.spicyPrice)})
                                              </div>
                                            </td>
                                            <td>{combo.combo_quantity}</td>
                                            <td>₹{formatTotal(combo.spicyPrice * combo.combo_quantity)}</td>
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
                    <div className="totals-section p-3 bg-light rounded">
                      <div className="row">
                        <div className="col-6 text-start">Total Quantity:</div>
                        <div className="col-6 text-end">
                          {billDetails.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                        </div>
                        {billDetails.items.filter(item => item.originalBasePrice).map(item => (
                          <React.Fragment key={item.item_name}>
                            <div className="col-6 text-start">{item.item_name}:</div>
                            <div className="col-6 text-end">
                              <span style={{ textDecoration: 'line-through' }}>₹{(item.originalBasePrice * item.quantity).toFixed(2)}</span> ₹{(item.basePrice * item.quantity).toFixed(2)}
                            </div>
                          </React.Fragment>
                        ))}
                        <div className="col-6 text-start">Subtotal:</div>
                        <div className="col-6 text-end">₹{formatTotal(calculateSubtotal())}</div>
                        <div className="col-6 text-start">VAT ({vatRate * 100}%):</div>
                        <div className="col-6 text-end">₹{formatTotal(calculateVAT())}</div>
                        <div className="col-6 text-start fw-bold">Grand Total:</div>
                        <div className="col-6 text-end fw-bold">₹{formatTotal(calculateGrandTotal())}</div>
                      </div>
                    </div>
                    <form onSubmit={handleCardSubmit}>
                      <div className="mb-4">
                        <label htmlFor="transactionNumber" className="form-label fw-bold">
                          Swipe Card or Enter Transaction Number
                        </label>
                        <input
                          type="text"
                          id="transactionNumber"
                          ref={inputRef}
                          className={`form-control ${errors.transactionNumber ? "is-invalid" : ""}`}
                          placeholder="Swipe card or enter transaction number"
                          value={transactionNumber}
                          onChange={handleInputChange}
                          maxLength="50"
                          disabled={isLoading}
                          required
                        />
                        {errors.transactionNumber && (
                          <div className="invalid-feedback">{errors.transactionNumber}</div>
                        )}
                        {cardData && (
                          <div className="mt-2 text-success">
                            Card Detected: **** **** **** {cardData.cardNumber?.slice(-4)} (Expiry: {cardData.expiry?.slice(0, 2)}/{cardData.expiry?.slice(2)})
                          </div>
                        )}
                      </div>
                      <div className="mb-4 text-center">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={simulateCardSwipe}
                          disabled={isLoading}
                        >
                          Simulate Card Swipe (Test)
                        </button>
                      </div>
                      <div className="text-center">
                        <button
                          type="submit"
                          className="btn btn-success w-100 py-2"
                          disabled={isLoading}
                        >
                          {isLoading ? "Processing..." : "Confirm Card Payment"}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-exclamation-circle text-warning fs-1"></i>
                    <p className="mt-3">No bill details available.</p>
                    <button
                      className="btn btn-outline-primary"
                      onClick={handleBack}
                      disabled={isLoading}
                    >
                      Back to Frontpage
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
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
                  {hasDeliveryAddress && (
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Delivery Address:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {`${billDetails.deliveryAddress.building_name || ""}, ${billDetails.deliveryAddress.flat_villa_no || ""}, ${billDetails.deliveryAddress.location || ""}`}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Payment Mode:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {billDetails.payments?.[0]?.mode_of_payment || "CARD"}
                    </td>
                  </tr>
                  {cardData && (
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Card Number:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        **** **** **** {cardData.cardNumber?.slice(-4)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Transaction Number:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{transactionNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Date:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{billDetails.date}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Time:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{billDetails.time}</td>
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
                                  <span className="strikethroughStyle">₹{formatTotal(item.originalBasePrice)}</span> ₹{formatTotal(basePrice)}
                                </>
                              ) : (
                                `₹${formatTotal(basePrice)}`
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
                              <td>₹{formatTotal(comboItem.price)}</td>
                            </tr>
                          ))}
                          {item.icePreference === "with_ice" && icePrice > 0 && (
                            <tr>
                              <td></td>
                              <td>
                                <div style={{ fontSize: "12px" }}>+ Ice (₹{formatTotal(icePrice)})</div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>₹{formatTotal(icePrice)}</td>
                            </tr>
                          )}
                          {item.isSpicy && spicyPrice > 0 && (
                            <tr>
                              <td></td>
                              <td>
                                <div style={{ fontSize: "12px" }}>+ Spicy (₹{formatTotal(spicyPrice)})</div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>₹{formatTotal(spicyPrice)}</td>
                            </tr>
                          )}
                          {item.customVariantsDetails &&
                            Object.keys(item.customVariantsDetails).length > 0 &&
                            Object.entries(item.customVariantsDetails).map(([variantName, variant], idx) => (
                              <tr key={`${index}-custom-${idx}`}>
                                <td></td>
                                <td>
                                  <div style={{ color: "#888", fontSize: "12px" }}>
                                    + {variant.heading}: {variant.name} (₹{formatTotal(variant.price)})
                                  </div>
                                </td>
                                <td>{item.customVariantsQuantities?.[variantName] || 1}</td>
                                <td>₹{formatTotal(variant.price)}</td>
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
                                      <td>₹{formatTotal(addon.addon_price)}</td>
                                    </tr>
                                    {addon.isSpicy && addon.spicyPrice > 0 && (
                                      <tr>
                                        <td></td>
                                        <td>
                                          <div style={{ color: "#888", fontSize: "12px" }}>
                                            + Spicy (₹{formatTotal(addon.spicyPrice)})
                                          </div>
                                        </td>
                                        <td>{addon.addon_quantity}</td>
                                        <td>₹{formatTotal(addon.spicyPrice * addon.addon_quantity)}</td>
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
                                      <td>₹{formatTotal(combo.combo_price)}</td>
                                    </tr>
                                    {combo.isSpicy && combo.spicyPrice > 0 && (
                                      <tr>
                                        <td></td>
                                        <td>
                                          <div style={{ color: "#888", fontSize: "12px" }}>
                                            + Spicy (₹{formatTotal(combo.spicyPrice)})
                                          </div>
                                        </td>
                                        <td>{combo.combo_quantity}</td>
                                        <td>₹{formatTotal(combo.spicyPrice * combo.combo_quantity)}</td>
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
                  <strong>Subtotal:</strong> ₹{calculateSubtotal().toFixed(2)}
                </p>
                <p>
                  <strong>VAT ({vatRate * 100}%):</strong> ₹{calculateVAT().toFixed(2)}
                </p>
                <p>
                  <strong>Grand Total:</strong> ₹{calculateGrandTotal().toFixed(2)}
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
  );
}
export default Card;