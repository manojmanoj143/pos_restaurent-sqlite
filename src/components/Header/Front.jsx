// FrontPage.jsx (Merged version: New code base with detailed addon/combo billing rendering from old code, fixed dynamic baseUrl, preserved statuses, all issues resolved)
"use client"
import React, { useEffect, useState, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import FoodDetails from "./FoodDetails"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import { Card, Button } from 'react-bootstrap';
import "./front.css"

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
  const [deliveryAddress, setDeliveryAddress] = useState({
    building_name: "",
    flat_villa_no: "",
    location: "",
  })
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [email, setEmail] = useState("")
  const [orderId, setOrderId] = useState(null)
  const [bookedTables, setBookedTables] = useState([])
  const [bookedChairs, setBookedChairs] = useState({})
  const [vatRate, setVatRate] = useState(0.1)
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
        location: savedAddress.location || "",
      })
      setWhatsappNumber(initialWhatsappNumber || existingOrder?.whatsappNumber || "")
      setEmail(initialEmail || existingOrder?.email || "")
      setIsPhoneNumberSet(!!(initialPhoneNumber || existingOrder?.phoneNumber))
      setCartItems(initialCartItems || existingOrder?.cartItems || [])
      setBillCartItems(initialCartItems || existingOrder?.cartItems || [])
      setOrderId(existingOrder?.orderId || null)
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
            image: combo.items[0]?.data.image ? `${baseUrl}${combo.items[0].data.image}` : "/static/images/default-combo.jpg",
            basePrice: Number(combo.total_price) || 0,
            offer_price: Number(combo.offer_price) || 0,
            offer_start_time: combo.offer_start_time,
            offer_end_time: combo.offer_end_time,
            isCombo: true,
            comboItems: combo.items.map((citem) => ({
              name: citem.data.item_name || citem.data.name1,
              description: citem.data.description || '',
              price: Number(citem.price) || 0,
              image: citem.data.image ? `${baseUrl}${citem.data.image}` : citem.data.addon_image ? `${baseUrl}${citem.data.addon_image}` : citem.data.combo_image ? `${baseUrl}${citem.data.combo_image}` : "https://via.placeholder.com/80",
              kitchen: citem.data.kitchen || "Main Kitchen",
            })),
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
        const response = await axios.get(`${baseUrl}/api/customers`)
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
        const response = await axios.get(`${baseUrl}/api/customer-groups`)
        setCustomerGroups(response.data)
      } catch (error) {
        console.error("Error fetching customer groups:", error)
        setWarningMessage("Failed to load customer groups. Please try again.")
        setWarningType("warning")
      }
    }
    fetchGroups()
  }, [baseUrl])

  // Fetch VAT rate
  useEffect(() => {
    const fetchVat = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/get-vat`);
        setVatRate(response.data.vat / 100 || 0.1);
      } catch (error) {
        console.error('Failed to fetch VAT:', error);
      }
    };
    fetchVat();
  }, [baseUrl]);

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

  const handleItemClick = (item) => {
    const existingCartItem = cartItems.find((cartItem) => cartItem.item_name === item.name)
    setSelectedItem(item)
    setSelectedCartItem(existingCartItem || null)
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

  const handleItemUpdate = (updatedItem) => {
    // FIXED: Prioritize updating by ID if provided (for edits, preserves status)
    let existingItemIndex = -1;
    if (updatedItem.id) {
      existingItemIndex = cartItems.findIndex((cartItem) => cartItem.id === updatedItem.id);
    }
    if (existingItemIndex === -1 && !updatedItem.isCombo) {
      // Fallback to name + size match for new items
      const menuItem = menuItems.find((item) => item.name === updatedItem.item_name)
      const hasSizeVariant = menuItem?.size?.enabled || false
      const updatedSelectedSize = hasSizeVariant ? updatedItem.variants?.size?.selected : null
      existingItemIndex = cartItems.findIndex(
        (cartItem) =>
          cartItem.item_name === updatedItem.item_name &&
          (hasSizeVariant ? cartItem.selectedSize === updatedSelectedSize : cartItem.selectedSize === null),
      )
    }
    if (updatedItem.isCombo) {
      const hasOffer = hasActiveOffer(updatedItem);
      const finalPrice = hasOffer ? updatedItem.offer_price || 0 : updatedItem.basePrice || 0;
      const cartItem = {
        id: existingItemIndex !== -1 ? cartItems[existingItemIndex].id : uuidv4(),
        name: updatedItem.name,
        item_name: updatedItem.name,
        quantity: updatedItem.quantity || 1,
        originalBasePrice: hasOffer ? updatedItem.basePrice || 0 : null,
        basePrice: finalPrice,
        totalPrice: finalPrice * (updatedItem.quantity || 1),
        isCombo: true,
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
    // FIXED: Handle addons and combos without recreation errors
    const addonVariants = {}
    const addonImages = {}
    const addonPrices = {}
    const addonSizePrices = {}
    const addonIcePrices = {}
    const addonSpicyPrices = {}
    const addonCustomVariantsDetails = updatedItem.addonCustomVariantsDetails || {}
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
      const totalAddonPrice = addonSizePrice + addonIcePrice + addonSpicyPrice + customVariantsPrice
      addonVariants[addonName] = {
        ...variants,
        size: addonSize,
        cold: addonCold,
        spicy: addonSpicy,
        kitchen: addon?.kitchen || "Main Kitchen",
        sugar: variants.sugar || "medium",
      }
      addonImages[addonName] = addon?.addon_image || "/static/images/default-addon-image.jpg"
      addonPrices[addonName] = totalAddonPrice
      addonSizePrices[addonName] = addonSizePrice
      addonIcePrices[addonName] = addonIcePrice
      addonSpicyPrices[addonName] = addonSpicyPrice
    })
    const comboVariants = {}
    const comboImages = {}
    const comboPrices = {}
    const comboSizePrices = {}
    const comboIcePrices = {}
    const comboSpicyPrices = {}
    const comboCustomVariantsDetails = updatedItem.comboCustomVariantsDetails || {}
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
      const totalComboPrice = comboSizePrice + comboIcePrice + comboSpicyPrice + customVariantsPrice
      comboVariants[comboName] = {
        ...variants,
        size: comboSize,
        cold: comboCold,
        spicy: comboSpicy,
        kitchen: combo?.kitchen || "Main Kitchen",
        sugar: variants.sugar || "medium",
      }
      comboImages[comboName] = combo?.combo_image || "/static/images/default-combo-image.jpg"
      comboPrices[comboName] = totalComboPrice
      comboSizePrices[comboName] = comboSizePrice
      comboIcePrices[comboName] = comboIcePrice
      comboSpicyPrices[comboName] = comboSpicyPrice
    })
    const customVariantsDetails = {}
    const customVariantsQuantities = {}
    let customVariantsTotalPrice = 0
    if (updatedItem.selectedCustomVariants && menuItem?.custom_variants) {
      menuItem.custom_variants.forEach((variant) => {
        if (variant.enabled) {
          variant.subheadings.forEach((sub) => {
            if (updatedItem.selectedCustomVariants[sub.name]) {
              customVariantsDetails[sub.name] = { name: sub.name, price: sub.price || 0, heading: variant.heading }
              customVariantsQuantities[sub.name] = updatedItem.customVariantsQuantities?.[sub.name] || 1
              customVariantsTotalPrice += (sub.price || 0) * (updatedItem.customVariantsQuantities?.[sub.name] || 1)
            }
          })
        }
      })
    }
    const cartItem = {
      ...updatedItem,
      id: existingItemIndex !== -1 ? cartItems[existingItemIndex].id : uuidv4(),
      name: updatedItem.item_name || "Unnamed Item",
      item_name: updatedItem.item_name,
      quantity: updatedItem.quantity || 1,
      originalBasePrice: hasOffer ? originalBasePrice : null,
      basePrice: finalBasePrice,
      icePrice: updatedItem.icePrice || 0,
      spicyPrice: updatedItem.spicyPrice || 0,
      totalPrice: updatedItem.totalPrice || 0,
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
            updatedItem = {
              ...updatedItem,
              quantity: newQty,
              totalPrice: (updatedItem.basePrice || 0) * newQty,
            }
            return updatedItem;
          }
          if (type === "item") {
            const customVariantsTotalPrice = Object.entries(updatedItem.customVariantsDetails || {}).reduce(
              (sum, [variantName, variant]) =>
                sum + (variant.price || 0) * (updatedItem.customVariantsQuantities?.[variantName] || 1),
              0,
            )
            updatedItem = {
              ...updatedItem,
              quantity: newQty,
              totalPrice:
                ((updatedItem.basePrice || 0) + (updatedItem.icePrice || 0) + (updatedItem.spicyPrice || 0) + customVariantsTotalPrice) *
                newQty,
            }
          } else if (type === "addon" && name) {
            updatedItem = {
              ...updatedItem,
              addonQuantities: { ...updatedItem.addonQuantities, [name]: newQty },
            }
          } else if (type === "combo" && name) {
            updatedItem = {
              ...updatedItem,
              comboQuantities: { ...updatedItem.comboQuantities, [name]: newQty },
            }
          } else if (type === "customVariant" && name) {
            const customVariantsTotalPrice = Object.entries(updatedItem.customVariantsDetails || {}).reduce(
              (sum, [variantName, variant]) =>
                sum +
                (variant.price || 0) *
                (variantName === name ? newQty : updatedItem.customVariantsQuantities?.[variantName] || 1),
              0,
            )
            updatedItem = {
              ...updatedItem,
              customVariantsQuantities: { ...updatedItem.customVariantsQuantities, [name]: newQty },
              totalPrice:
                ((updatedItem.basePrice || 0) + (updatedItem.icePrice || 0) + (updatedItem.spicyPrice || 0) + customVariantsTotalPrice) *
                updatedItem.quantity,
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
      return sum + price * qty
    }, 0)
  }

  const getCombosTotal = (item) => {
    if (!item.comboQuantities || !item.comboPrices) return 0
    return Object.entries(item.comboQuantities).reduce((sum, [comboName, qty]) => {
      const price = item.comboPrices[comboName] || 0
      return sum + price * qty
    }, 0)
  }

  const getCustomVariantsTotal = (item) => {
    if (!item.customVariantsDetails || !item.customVariantsQuantities) return 0
    return Object.entries(item.customVariantsDetails).reduce((sum, [variantName, variant]) => {
      const qty = item.customVariantsQuantities[variantName] || 1
      return sum + (variant.price || 0) * qty
    }, 0)
  }

  const getMainItemTotal = (item) => {
    if (item.isCombo) {
      return (item.basePrice || 0) * (item.quantity || 1)
    }
    const mainItemPrice = (item.basePrice || 0) + (item.icePrice || 0) + (item.spicyPrice || 0) + getCustomVariantsTotal(item)
    return mainItemPrice * (item.quantity || 1)
  }

  const getOriginalMainItemTotal = (item) => {
    if (item.originalBasePrice) {
      const mainItemPrice = (item.originalBasePrice || 0) + (item.icePrice || 0) + (item.spicyPrice || 0) + getCustomVariantsTotal(item)
      return mainItemPrice * (item.quantity || 1)
    }
    return getMainItemTotal(item)
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
            const { [name]: _, ...remainingAddons } = updatedItem.addonQuantities || {}
            const { [name]: __, ...remainingAddonVariants } = updatedItem.addonVariants || {}
            const { [name]: ___, ...remainingAddonPrices } = updatedItem.addonPrices || {}
            const { [name]: ____, ...remainingAddonImages } = updatedItem.addonImages || {}
            const { [name]: _____, ...remainingAddonSizePrices } = updatedItem.addonSizePrices || {}
            const { [name]: ______, ...remainingAddonIcePrices } = updatedItem.addonIcePrices || {}
            const { [name]: _______, ...remainingAddonSpicyPrices } = updatedItem.addonSpicyPrices || {}
            updatedItem = {
              ...updatedItem,
              addonQuantities: remainingAddons,
              addonVariants: remainingAddonVariants,
              addonPrices: remainingAddonPrices,
              addonSizePrices: remainingAddonSizePrices,
              addonIcePrices: remainingAddonIcePrices,
              addonSpicyPrices: remainingAddonSpicyPrices,
              addonImages: remainingAddonImages,
              addonCustomVariantsDetails: { ...updatedItem.addonCustomVariantsDetails, [name]: {} },
            }
          } else if (type === "combo") {
            const { [name]: _, ...remainingCombos } = updatedItem.comboQuantities || {}
            const { [name]: __, ...remainingComboVariants } = updatedItem.comboVariants || {}
            const { [name]: ___, ...remainingComboPrices } = updatedItem.comboPrices || {}
            const { [name]: ____, ...remainingComboImages } = updatedItem.comboImages || {}
            const { [name]: _____, ...remainingComboSizePrices } = updatedItem.comboSizePrices || {}
            const { [name]: ______, ...remainingComboIcePrices } = updatedItem.comboIcePrices || {}
            const { [name]: _______, ...remainingComboSpicyPrices } = updatedItem.comboSpicyPrices || {}
            updatedItem = {
              ...updatedItem,
              comboQuantities: remainingCombos,
              comboVariants: remainingComboVariants,
              comboPrices: remainingComboPrices,
              comboSizePrices: remainingComboSizePrices,
              comboIcePrices: remainingComboIcePrices,
              comboSpicyPrices: remainingComboSpicyPrices,
              comboImages: remainingComboImages,
              selectedCombos: updatedItem.selectedCombos.filter((combo) => combo.name1 !== name),
              comboCustomVariantsDetails: { ...updatedItem.comboCustomVariantsDetails, [name]: {} },
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
          return {
            ...cartItem,
            selectedCustomVariants: remainingCustomVariants,
            customVariantsDetails: remainingCustomVariantsDetails,
            customVariantsQuantities: remainingCustomVariantsQuantities,
            totalPrice:
              ((cartItem.basePrice || 0) + (cartItem.icePrice || 0) + (cartItem.spicyPrice || 0) + customVariantsTotalPrice) *
              (cartItem.quantity || 1),
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

  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => {
      if (item.isCombo) {
        return sum + (item.totalPrice || 0)
      }
      const mainItemPrice = (item.basePrice || 0) + (item.icePrice || 0) + (item.spicyPrice || 0) + getCustomVariantsTotal(item)
      const mainItemTotal = mainItemPrice * (item.quantity || 1)
      const addonsTotal = getAddonsTotal(item)
      const combosTotal = getCombosTotal(item)
      return sum + mainItemTotal + addonsTotal + combosTotal
    }, 0)
  }

  const calculateOriginalSubtotal = (items) => {
    return items.reduce((sum, item) => {
      let mainItemPrice = (item.basePrice || 0) + (item.icePrice || 0) + (item.spicyPrice || 0) + getCustomVariantsTotal(item)
      if (item.originalBasePrice) {
        mainItemPrice = (item.originalBasePrice || 0) + (item.icePrice || 0) + (item.spicyPrice || 0) + getCustomVariantsTotal(item)
      }
      const mainItemTotal = mainItemPrice * (item.quantity || 1)
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
    const subtotal = calculateSubtotal(billCartItems)
    if (isNaN(subtotal) || subtotal === 0) {
      setWarningMessage("Invalid total amount. Please check your cart items.")
      setWarningType("warning")
      return
    }
    const paymentDetails = {
      mode_of_payment: method,
      amount: Number(subtotal.toFixed(2)),
    }
    const { chairsBooked } = location.state || {}
    const billDetails = {
      customer: customerName.trim() || "N/A",
      phoneNumber: phoneNumber ? `${selectedISDCode}${phoneNumber}` : "N/A",
      tableNumber: tableNumber || "N/A",
      chairsBooked: chairsBooked,
      deliveryAddress: deliveryAddress,
      whatsappNumber: whatsappNumber || "N/A",
      email: email || "N/A",
      items: billCartItems.map((item) => ({
        item_name: item.item_name || item.name,
        basePrice: item.basePrice || 0,
        originalBasePrice: item.originalBasePrice || null,
        icePreference: item.icePreference,
        ice_price: item.icePrice || 0,
        isSpicy: item.isSpicy,
        spicy_price: item.spicyPrice || 0,
        quantity: item.quantity || 1,
        amount: (item.totalPrice || 0).toFixed(2),
        addons: Object.entries(item.addonQuantities || {}).map(([addonName, qty]) => ({
          name1: addonName,
          addon_image: item.addonImages?.[addonName] || "/static/images/default-addon-image.jpg",
          addon_size_price: Number(item.addonSizePrices?.[addonName] || 0),
          addon_ice_price: Number(item.addonIcePrices?.[addonName] || 0),
          addon_spicy_price: Number(item.addonSpicyPrices?.[addonName] || 0),
          addon_price: Number(item.addonPrices?.[addonName] || item.addonVariants?.[addonName]?.price || 0),
          addon_quantity: qty,
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
          combo_quantity: qty,
          custom_variants: item.comboCustomVariantsDetails?.[comboName] || {},
        })),
        kitchen: item.kitchen,
        selectedSize: item.selectedSize || null,
        ingredients: item.ingredients || [],
        selectedCustomVariants: item.selectedCustomVariants || {},
        customVariantsDetails: item.customVariantsDetails || {},
        customVariantsQuantities: item.customVariantsQuantities || {},
        image: item.image || "/static/images/default-item.jpg",
        kitchenStatuses: item.kitchenStatuses || {},
      })),
      totalAmount: Number(subtotal.toFixed(2)),
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
          await axios.put(`${baseUrl}/api/activeorders/${orderId}`, { paid: true });
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
    const validItems = billCartItems.filter((item) => item.quantity > 0)
    if (validItems.length !== billCartItems.length) {
      setWarningMessage("All items must have a quantity greater than zero.")
      setWarningType("warning")
      throw new Error("Invalid item quantities")
    }
    const subtotal = calculateSubtotal(billCartItems)
    const payload = {
      customer: customerName.trim() || "N/A",
      phoneNumber: phoneNumber ? `${selectedISDCode}${phoneNumber}` : "N/A",
      tableNumber: tableNumber || "N/A",
      chairsBooked: chairsBooked,
      deliveryAddress: deliveryAddress,
      whatsappNumber: whatsappNumber || "N/A",
      email: email || "N/A",
      items: validItems.map((item) => ({
        item_name: item.item_name || item.name || "Unnamed Item",
        basePrice: Number(item.basePrice) || 0,
        originalBasePrice: item.originalBasePrice || null,
        icePreference: item.icePreference,
        ice_price: Number(item.icePrice) || 0,
        isSpicy: item.isSpicy,
        spicy_price: Number(item.spicyPrice) || 0,
        quantity: Number(item.quantity) || 1,
        amount: Number(item.totalPrice.toFixed(2)) || 0,
        addons: Object.entries(item.addonQuantities || {}).map(([addonName, qty]) => ({
          name1: addonName,
          addon_image: item.addonImages?.[addonName] || "/static/images/default-addon-image.jpg",
          addon_size_price: Number(item.addonSizePrices?.[addonName] || 0),
          addon_ice_price: Number(item.addonIcePrices?.[addonName] || 0),
          addon_spicy_price: Number(item.addonSpicyPrices?.[addonName] || 0),
          addon_price: Number(item.addonPrices?.[addonName] || item.addonVariants?.[addonName]?.price || 0),
          addon_quantity: qty,
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
          combo_quantity: qty,
          custom_variants: item.comboCustomVariantsDetails?.[comboName] || {},
        })),
        kitchen: item.kitchen,
        selectedSize: item.selectedSize || null,
        ingredients: item.ingredients || [],
        selectedCustomVariants: item.selectedCustomVariants || {},
        customVariantsDetails: item.customVariantsDetails || {},
        customVariantsQuantities: item.customVariantsQuantities || {},
        image: item.image || "/static/images/default-item.jpg",
        kitchenStatuses: item.kitchenStatuses || {},
      })),
      total: Number(subtotal.toFixed(2)),
      userId: user.email,
      payment_terms: [{ due_date: new Date().toISOString().split("T")[0], payment_terms: "Immediate" }],
      payments: [paymentDetails],
      orderType: orderType || "Dine In",
      status: "Pending",
    }
    try {
      // FIXED: Use dynamic baseUrl for sales save
      const response = await axios.post(`${baseUrl}/api/sales`, payload)
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
        building_name: deliveryAddress.building_name || "",
        flat_villa_no: deliveryAddress.flat_villa_no || "",
        location: deliveryAddress.location || "",
        whatsapp_number: whatsappNumber || "",
        email: email || "",
        customer_group: selectedGroupId || null,
      }
      // FIXED: Use dynamic baseUrl for customer create
      const response = await axios.post(`${baseUrl}/api/customers`, customerData)
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
        building_name: deliveryAddress.building_name || "",
        flat_villa_no: deliveryAddress.flat_villa_no || "",
        location: deliveryAddress.location || "",
        whatsapp_number: whatsappNumber || "",
        email: email || "",
        customer_group: selectedGroupId || null,
      }
      // FIXED: Use dynamic baseUrl for customer update
      await axios.put(`${baseUrl}/api/customers/${id}`, customerData)
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
      setDeliveryAddress({ building_name: "", flat_villa_no: "", location: "" })
      setWhatsappNumber("")
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
      setDeliveryAddress({ building_name: "", flat_villa_no: "", location: "" })
      setWhatsappNumber("")
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
          location: existingCustomer.location || "",
        })
        setWhatsappNumber(existingCustomer.whatsapp_number || "")
        setEmail(existingCustomer.email || "")
        setSelectedGroupId(existingCustomer.customer_group || "")
        setIsPhoneNumberSet(true)
      } else {
        setIsPhoneNumberSet(false)
      }
    }
  }

  const handleISDCodeSelect = (code) => {
    setSelectedISDCode(code)
    setShowISDCodeDropdown(false)
  }

  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.customer_name)
    const fullPhone = customer.phone_number || ""
    const code = isdCodes.find((isd) => fullPhone.startsWith(isd.code))?.code || "+91"
    setSelectedISDCode(code)
    setPhoneNumber(fullPhone.replace(code, ""))
    setDeliveryAddress({
      building_name: customer.building_name || "",
      flat_villa_no: customer.flat_villa_no || "",
      location: customer.location || "",
    })
    setWhatsappNumber(customer.whatsapp_number || "")
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
        building_name: deliveryAddress.building_name || "",
        flat_villa_no: deliveryAddress.flat_villa_no || "",
        location: deliveryAddress.location || "",
        whatsapp_number: whatsappNumber || "",
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
      const response = await axios.post(`${baseUrl}/api/customer-groups`, { group_name: newGroupName.trim() })
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
      customerName: customerName || "N/A",
      tableNumber: tableNumber || "N/A",
      chairsBooked: Array.isArray(chairsBooked) ? chairsBooked : [],
      phoneNumber: phoneNumber ? `${selectedISDCode}${phoneNumber}` : "N/A",
      deliveryAddress: deliveryAddress || { building_name: "", flat_villa_no: "", location: "" },
      whatsappNumber: whatsappNumber || "N/A",
      email: email || "N/A",
      cartItems: cartItems.map((item) => ({
        id: item.id || uuidv4(),
        item_name: item.item_name || item.name,
        name: item.name || item.item_name,
        image: item.image || "/static/images/default-item.jpg",
        quantity: Number(item.quantity) || 1,
        basePrice: Number(item.basePrice) || 0,
        originalBasePrice: item.originalBasePrice || null,
        totalPrice: Number(item.totalPrice) || (Number(item.basePrice) * (Number(item.quantity) || 1)) || 0,
        addonQuantities: item.addonQuantities || {},
        addonVariants: item.addonVariants || {},
        addonPrices: item.addonPrices || {},
        addonSizePrices: item.addonSizePrices || {},
        addonIcePrices: item.addonIcePrices || {},
        addonSpicyPrices: item.addonSpicyPrices || {},
        addonImages: item.addonImages || {},
        comboQuantities: item.comboQuantities || {},
        comboVariants: item.comboVariants || {},
        comboPrices: item.comboPrices || {},
        comboSizePrices: item.comboSizePrices || {},
        comboIcePrices: item.comboIcePrices || {},
        comboSpicyPrices: item.comboSpicyPrices || {},
        comboImages: item.comboImages || {},
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
      })),
      timestamp: new Date().toISOString(),
      orderType: orderType || "Dine In",
      status: "Pending",
      paid: false,
    }
    try {
      // FIXED: Use dynamic baseUrl for kitchen save
      const kitchenResponse = await axios.post(`${baseUrl}/api/kitchen-saved`, newOrder)
      if (!kitchenResponse.data.success) {
        throw new Error(kitchenResponse.data.error || "Failed to notify kitchen")
      }
      console.log("Order sent to kitchen:", kitchenResponse.data.order_id)
      let message = "Order saved successfully!";
      if (orderId) {
        // FIXED: Use dynamic baseUrl for order update
        const updateResponse = await axios.put(`${baseUrl}/api/activeorders/${orderId}`, newOrder)
        if (updateResponse.status === 200) {
          console.log("Order updated successfully")
          message = "Order updated successfully!";
        }
      } else {
        // FIXED: Use dynamic baseUrl for order save
        const response = await axios.post(`${baseUrl}/api/activeorders`, newOrder)
        if (response.status === 201) {
          console.log("Order saved successfully")
          setOrderId(response.data.orderId)
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

  const handleDeliveryAddressChange = (field, value) => {
    setDeliveryAddress((prev) => ({ ...prev, [field]: value.trimStart() }))
  }

  const handleWhatsappNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 10) setWhatsappNumber(value)
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
  const subtotal = calculateSubtotal(cartItems)
  const vat = subtotal * vatRate
  const total = subtotal + vat
  const showKitchenColumn = orderType === "Dine In"
  const visibleCategories = categories.slice(startIndex, startIndex + 5)

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
          <div className={`frontpage-menu-grid ${selectedCategory === "Combos Offer" ? "combo-grid" : ""}`}>
            {filteredItems.map((item) => (
              item.isCombo ? (
                <div key={item.id} className="combo-offer-wrapper">
                  <Card className="posterStyle">
                    <h4 className="restaurantNameStyle">{item.name}</h4>
                    {hasActiveOffer(item) && (
                      <p className="poster-offer-period">
                        Offer Period: {new Date(item.offer_start_time).toLocaleString()} to {new Date(item.offer_end_time).toLocaleString()}
                      </p>
                    )}
                    <div className="addon-row">
                      {item.comboItems?.map((comboItem, index) => (
                        <div className="bubble addon" key={index}>
                          <div className="circle">
                            <img className="offerImageStyle" src={comboItem.image} alt={comboItem.name} />
                          </div>
                          ₹{comboItem.price}
                          <br />
                          {comboItem.name}
                        </div>
                      )) || <div>No combo items</div>}
                    </div>
                    <p className="offerPriceStylePoster">
                      Total:
                      {hasActiveOffer(item) ? (
                        <>
                          <span className="strikethroughStyle">₹{item.basePrice}</span>
                          <span className="poster-offer-price">₹{item.offer_price}</span>
                        </>
                      ) : (
                        `₹${item.basePrice}`
                      )}
                    </p>
                    {hasActiveOffer(item) && <p className="limitedOfferStyle">LIMITED TIME OFFER!</p>}
                    <Button variant="primary" className="poster-add-to-cart-btn" onClick={() => handleItemUpdate({ ...item, quantity: 1 })}>
                      Add to Cart
                    </Button>
                  </Card>
                </div>
              ) : (
                <div key={item.id} className="frontpage-menu-card" onClick={() => handleItemClick(item)}>
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="frontpage-menu-card-image" />
                  <div className="frontpage-menu-card-content">
                    <h5 className="frontpage-menu-card-name">{item.name}</h5>
                    <p className="frontpage-menu-card-price">
                      ₹{(hasActiveOffer(item) ? item.offer_price : item.basePrice).toFixed(2)}
                    </p>
                    {hasActiveOffer(item) && <span className="frontpage-offer-badge">Offer</span>}
                  </div>
                </div>
              )
            ))}
          </div>
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
                  type="text"
                  className="frontpage-customer-input"
                  placeholder="Enter Location"
                  value={deliveryAddress.location}
                  onChange={(e) => handleDeliveryAddressChange("location", e.target.value)}
                />
                <input
                  type="text"
                  className="frontpage-customer-input"
                  placeholder="Enter WhatsApp Number"
                  value={whatsappNumber}
                  onChange={handleWhatsappNumberChange}
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
          {(customerName || phoneNumber) && (
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
              {cartItems.length === 0 ? (
                <tr>
                  <td colSpan={showKitchenColumn ? 6 : 5} className="frontpage-empty-cart">
                    Cart is empty.
                  </td>
                </tr>
              ) : (
                cartItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <tr>
                      <td>{tableNumber || index + 1}</td>
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
                            <span className="strikethroughStyle">₹{(item.originalBasePrice * item.quantity).toFixed(2)}</span> ₹{(item.basePrice * item.quantity).toFixed(2)}
                          </>
                        ) : item.originalBasePrice ? (
                          <>
                            <span className="strikethroughStyle">₹{getOriginalMainItemTotal(item).toFixed(2)}</span> ₹{getMainItemTotal(item).toFixed(2)}
                          </>
                        ) : (
                          `₹${getMainItemTotal(item).toFixed(2)}`
                        )}
                      </td>
                      {showKitchenColumn && <td>{item.kitchen || "Main Kitchen"}</td>}
                      <td>
                        <button className="frontpage-remove-btn" onClick={() => removeFromCart(item)}>
                          <i className="bi bi-x"></i>
                        </button>
                      </td>
                    </tr>
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
                        <td>₹{((comboItem.price || 0) * item.quantity).toFixed(2)}</td>
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
                        <td>₹{((item.icePrice || 0) * item.quantity).toFixed(2)}</td>
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
                        <td>₹{((item.spicyPrice || 0) * item.quantity).toFixed(2)}</td>
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
                          <td>₹{((variant.price || 0) * (item.customVariantsQuantities?.[variantName] || 1)).toFixed(2)}</td>
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
                          qty > 0 && (
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
                                <td>₹{((item.addonPrices ? item.addonPrices[addonName] : 0) * qty).toFixed(2)}</td>
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
                              {item.addonVariants && item.addonVariants[addonName] && item.addonVariants[addonName].cold === 'with_ice' && (
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
                                  <td>₹{((item.addonIcePrices ? item.addonIcePrices[addonName] : 0) * qty).toFixed(2)}</td>
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
                              {item.addonVariants && item.addonVariants[addonName] && item.addonVariants[addonName].spicy && (
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
                                  <td>₹{((item.addonSpicyPrices ? item.addonSpicyPrices[addonName] : 0) * qty).toFixed(2)}</td>
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
                              {item.addonVariants && item.addonVariants[addonName] && item.addonVariants[addonName].sugar &&
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
                                    <td>₹0.00</td>
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
                                      <td>₹{((variant.price || 0) * qty).toFixed(2)}</td>
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
                          qty > 0 && (
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
                                <td>₹{((item.comboPrices ? item.comboPrices[comboName] : 0) * qty).toFixed(2)}</td>
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
                              {item.comboVariants && item.comboVariants[comboName] && item.comboVariants[comboName].cold === 'with_ice' && (
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
                                  <td>₹{((item.comboIcePrices ? item.comboIcePrices[comboName] : 0) * qty).toFixed(2)}</td>
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
                              {item.comboVariants && item.comboVariants[comboName] && item.comboVariants[comboName].spicy && (
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
                                  <td>₹{((item.comboSpicyPrices ? item.comboSpicyPrices[comboName] : 0) * qty).toFixed(2)}</td>
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
                              {item.comboVariants && item.comboVariants[comboName] && item.comboVariants[comboName].sugar &&
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
                                    <td>₹0.00</td>
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
                                      <td>₹{((variant.price || 0) * qty).toFixed(2)}</td>
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
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="frontpage-billing-summary">
          <div className="frontpage-summary-row">
            <span>TOTAL QUANTITY:</span>
            <span>{cartItems.reduce((total, item) => total + (item.quantity || 0), 0)}</span>
          </div>
          {cartItems.filter(item => item.originalBasePrice).map(item => (
            <div className="frontpage-summary-row" key={item.id}>
              <span>{item.name}:</span>
              <span>
                <span className="strikethroughStyle">₹{(item.originalBasePrice * item.quantity).toFixed(2)}</span> ₹{(item.basePrice * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="frontpage-summary-row">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="frontpage-summary-row vat">
            <span>VAT ({vatRate * 100}%):</span>
            <span>₹{vat.toFixed(2)}</span>
          </div>
          <div className="frontpage-summary-row total">
            <span>Grand Total:</span>
            <span>₹{total.toFixed(2)}</span>
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
    </div>
  )
}

export default FrontPage;