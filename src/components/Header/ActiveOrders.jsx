import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { FaArrowLeft, FaSyncAlt, FaCheck } from "react-icons/fa";
import "./ActiveOrders.css";

function ActiveOrders() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tables, setTables] = useState([]);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [pendingAction, setPendingAction] = useState(null);
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState(null);
  const [filterType, setFilterType] = useState("Dine In");
  const [baseUrl, setBaseUrl] = useState(""); // Dynamic base URL for client/server mode

  const navigate = useNavigate();
  const vatRate = 0.10;

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

  const fetchData = async () => {
    try {
      const ordersResponse = await axios.get(`${baseUrl}/api/activeorders`);
      console.log("Fetched orders from server in ActiveOrders:", ordersResponse.data);
      const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];

      const sanitizedOrders = orders.map((order) => ({
        ...order,
        orderNo: order.orderNo || "N/A",
        chairsBooked: Array.isArray(order.chairsBooked) ? order.chairsBooked : [],
        cartItems: Array.isArray(order.cartItems)
          ? order.cartItems.map((item) => ({
              ...item,
              originalBasePrice: item.originalBasePrice || null,
              served: item.served !== undefined ? item.served : false,
              servedQuantity: item.servedQuantity || (item.served ? (item.quantity || 1) : 0),
            }))
          : [],
        pickedUpTime: order.pickedUpTime || null,
        paid: order.paid || false,
      }));

      setSavedOrders(sanitizedOrders);
      localStorage.setItem("savedOrders", JSON.stringify(sanitizedOrders));
      // Suppressed UI warning message as per request
    } catch (err) {
      console.error("Failed to fetch data in ActiveOrders:", err);
      // Suppressed UI warning message as per request - do not setWarningMessage
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/employees`);
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      // Suppressed UI warning message as per request
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/tables`);
      setTables(response.data.message || []);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
      // Suppressed UI warning message as per request
    }
  };

  useEffect(() => {
    fetchData();
    fetchEmployees();
    fetchTables();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [baseUrl]); // Re-fetch after baseUrl is set

  const getFloor = (tableNumber) => {
    const table = tables.find((t) => String(t.table_number) === String(tableNumber));
    return table ? table.floor : "N/A";
  };

  const handleRefresh = () => {
    fetchData();
    // Suppressed UI warning message as per request
    // setWarningMessage("Orders refreshed!");
    // setWarningType("success");
  };

  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage("");
    setWarningType("warning");
    setIsConfirmation(false);
  };

  const handleConfirmYes = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage("");
    setWarningType("warning");
    setIsConfirmation(false);
  };

  const handleConfirmNo = () => {
    setWarningMessage("");
    setWarningType("warning");
    setPendingAction(null);
    setIsConfirmation(false);
  };

  const handleDeleteOrder = (orderId, tableNumber, orderNo) => {
    setWarningMessage(`Are you sure you want to delete order ${orderNo || "N/A"}?`);
    setWarningType("warning");
    setIsConfirmation(true);
    setPendingAction(() =>
      async () => {
        try {
          await axios.delete(`${baseUrl}/api/activeorders/${orderId}`);
          let bookedTables = JSON.parse(localStorage.getItem("bookedTables")) || [];
          const updatedBookedTables = bookedTables.filter((tableNum) => tableNum !== tableNumber);
          localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));
          let bookedChairs = JSON.parse(localStorage.getItem("bookedChairs")) || {};
          delete bookedChairs[tableNumber];
          localStorage.setItem("bookedChairs", JSON.stringify(bookedChairs));
          const updatedOrders = savedOrders.filter((order) => order.orderId !== orderId);
          setSavedOrders(updatedOrders);
          localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
          // Suppressed UI warning message as per request
          // setWarningMessage(`Order ${orderNo || "N/A"} deleted successfully!`);
          // setWarningType("success");
        } catch (err) {
          console.error("Failed to delete order:", err);
          // Suppressed UI warning message as per request
        }
      }
    );
  };

  const handleDeleteItem = async (orderId, itemId) => {
    try {
      await axios.delete(`${baseUrl}/api/activeorders/${orderId}/items/${itemId}`);
      fetchData();
      // Suppressed UI warning message as per request
    } catch (err) {
      console.error("Failed to delete item:", err);
      // Suppressed UI warning message as per request
    }
  };

  const handleDeleteAllCompleted = () => {
    setWarningMessage("Are you sure you want to delete all completed orders?");
    setWarningType("warning");
    setIsConfirmation(true);
    setPendingAction(() =>
      async () => {
        try {
          const filteredCompleted = completedFiltered;
          for (const order of filteredCompleted) {
            await axios.delete(`${baseUrl}/api/activeorders/${order.orderId}`);
            let bookedTables = JSON.parse(localStorage.getItem("bookedTables")) || [];
            const updatedBookedTables = bookedTables.filter((tableNum) => tableNum !== order.tableNumber);
            localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));
            let bookedChairs = JSON.parse(localStorage.getItem("bookedChairs")) || {};
            delete bookedChairs[order.tableNumber];
            localStorage.setItem("bookedChairs", JSON.stringify(bookedChairs));
          }
          fetchData();
          // Suppressed UI warning message as per request
        } catch (err) {
          console.error("Failed to delete completed orders:", err);
          // Suppressed UI warning message as per request
        }
      }
    );
  };

  const handleCompleted = async (orderId) => {
    const order = savedOrders.find((o) => o.orderId === orderId);
    if (!order) return;

    const allItemsCompleted = order.cartItems.every((item) => (item.servedQuantity || 0) >= (item.quantity || 1));

    if (order.paid && allItemsCompleted) {
      setWarningMessage("Are you sure you want to mark this order as completed and delete it?");
      setWarningType("warning");
      setIsConfirmation(true);
      setPendingAction(() =>
        async () => {
          try {
            await axios.delete(`${baseUrl}/api/activeorders/${orderId}`);
            let bookedTables = JSON.parse(localStorage.getItem("bookedTables")) || [];
            const updatedBookedTables = bookedTables.filter((tableNum) => tableNum !== order.tableNumber);
            localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));
            let bookedChairs = JSON.parse(localStorage.getItem("bookedChairs")) || {};
            delete bookedChairs[order.tableNumber];
            localStorage.setItem("bookedChairs", JSON.stringify(bookedChairs));
            const updatedOrders = savedOrders.filter((o) => o.orderId !== orderId);
            setSavedOrders(updatedOrders);
            localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
            // Suppressed UI warning message as per request
          } catch (err) {
            console.error("Failed to complete order:", err);
            // Suppressed UI warning message as per request
          }
        }
      );
    } else {
      // Suppressed UI warning message as per request
    }
  };

  const checkAllItemsPickedUp = (order) => {
    if (!order.cartItems || order.cartItems.length === 0) return false;
    const allPickedUp = order.cartItems.every((item) => {
      const requiredKitchens = item.requiredKitchens || [];
      if (requiredKitchens.length === 0) return true;
      if (!item.kitchenStatuses) return false;
      return requiredKitchens.every((kitchen) => item.kitchenStatuses[kitchen] === "PickedUp");
    });
    console.log(`Check if all items picked up for order ${order.orderNo}: ${allPickedUp}`);
    return allPickedUp;
  };

  const handleAssignDeliveryPerson = (orderId, deliveryPersonId) => {
    const order = savedOrders.find((o) => o.orderId === orderId);
    if (!order) {
      console.error("Order not found.");
      // Suppressed UI warning message as per request
      return;
    }

    if (order.orderType !== "Online Delivery") {
      console.error("Delivery person can only be assigned to Online Delivery orders.");
      // Suppressed UI warning message as per request
      return;
    }

    if (!checkAllItemsPickedUp(order)) {
      console.error(`Cannot assign delivery person to order ${order.orderNo}. All items, addons, and combos must be marked as Picked Up in the Kitchen page.`);
      // Suppressed UI warning message as per request
      return;
    }

    setSelectedOrderId(orderId);
    setSelectedDeliveryPersonId(deliveryPersonId);
    setShowDeliveryPopup(true);
  };

  const confirmDeliveryAssignment = async () => {
    try {
      const order = savedOrders.find((o) => o.orderId === selectedOrderId);
      if (!order) {
        console.error("Order not found.");
        // Suppressed UI warning message as per request
        setShowDeliveryPopup(false);
        return;
      }

      if (!checkAllItemsPickedUp(order)) {
        console.error(`Cannot assign delivery person to order ${order.orderNo}. All items, addons, and combos must be marked as Picked Up in the Kitchen page.`);
        // Suppressed UI warning message as per request
        setShowDeliveryPopup(false);
        return;
      }

      await axios.put(`${baseUrl}/api/activeorders/${selectedOrderId}`, {
        deliveryPersonId: selectedDeliveryPersonId,
        cartItems: order.cartItems,
      });

      const updatedOrders = savedOrders.filter((o) => o.orderId !== selectedOrderId);
      setSavedOrders(updatedOrders);
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
      // Suppressed UI warning message as per request
      setShowDeliveryPopup(false);
      setSelectedOrderId(null);
      setSelectedDeliveryPersonId(null);
    } catch (err) {
      console.error("Failed to assign delivery person:", err);
      // Suppressed UI warning message as per request
      setShowDeliveryPopup(false);
    }
  };

  const cancelDeliveryPopup = () => {
    setShowDeliveryPopup(false);
    setSelectedOrderId(null);
    setSelectedDeliveryPersonId(null);
  };

  const updateOrder = async (orderId, updatedOrder) => {
    try {
      const response = await axios.put(`${baseUrl}/api/activeorders/${orderId}`, updatedOrder);
      const updatedOrders = savedOrders.map((order) =>
        order.orderId === orderId ? { ...order, ...response.data.order } : order
      );
      setSavedOrders(updatedOrders);
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
      // Suppressed UI warning message as per request
    } catch (err) {
      console.error("Failed to update order:", err);
      // Suppressed UI warning message as per request
    }
  };

  const inferOrderType = (order) => {
    if (order.tableNumber && order.tableNumber !== "N/A") return "Dine In";
    else if (
      order.deliveryAddress &&
      (order.deliveryAddress.building_name || order.deliveryAddress.flat_villa_no || order.deliveryAddress.location)
    )
      return "Online Delivery";
    else return "Take Away";
  };

  const handleSelectOrder = (order) => {
    if (!order.cartItems || order.cartItems.length === 0) {
      console.error("This order has no items.");
      // Suppressed UI warning message as per request
      setIsConfirmation(false);
      return;
    }

    const baseURL = baseUrl || "http://localhost:8000";
    const cacheBuster = `?t=${new Date().getTime()}`;

    const formattedCartItems = order.cartItems.map((item) => {
      const formattedItem = {
        ...item,
        id: item.id || uuidv4(),
        item_name: item.item_name || item.name,
        name: item.name || item.item_name,
        quantity: Number(item.quantity) || 1,
        basePrice: Number(item.basePrice) || (Number(item.totalPrice) / (Number(item.quantity) || 1)) || 0,
        originalBasePrice: item.originalBasePrice || null,
        totalPrice: Number(item.totalPrice) || (Number(item.basePrice) * (Number(item.quantity) || 1)) || 0,
        selectedSize: item.selectedSize || "M",
        icePreference: item.icePreference || "without_ice",
        isSpicy: item.isSpicy || false,
        sugarLevel: item.sugarLevel || "medium",
        kitchen: item.kitchen || "Main Kitchen",
        addonQuantities: item.addonQuantities || {},
        addonVariants: item.addonVariants || {},
        comboQuantities: item.comboQuantities || {},
        comboVariants: item.comboVariants || {},
        selectedCombos: item.selectedCombos || [],
        ingredients: item.ingredients || [],
        requiredKitchens: item.requiredKitchens || [],
        kitchenStatuses: item.kitchenStatuses || {},
        served: item.served || false,
        servedQuantity: item.servedQuantity || 0,
      };

      // Reconstruct addon details from addons array if not already objects
      if (Array.isArray(item.addons)) {
        const addonQuantities = {};
        const addonVariants = {};
        const addonPrices = {};
        const addonSizePrices = {};
        const addonIcePrices = {};
        const addonSpicyPrices = {};
        const addonImages = {};
        const addonCustomVariantsDetails = {};

        item.addons.forEach((addon) => {
          const addonName = addon.name1;
          addonQuantities[addonName] = addon.addon_quantity || 1;
          addonVariants[addonName] = {
            size: addon.size || "M",
            cold: addon.cold || "without_ice",
            spicy: addon.isSpicy || false,
            sugar: addon.sugar || "medium",
            kitchen: addon.kitchen || "Main Kitchen",
          };
          let addonPrice = Number(addon.addon_price) || 0;
          if (addonPrice === 0 && addon.addon_total_price) {
            addonPrice = Number(addon.addon_total_price) / (addon.addon_quantity || 1);
          } else if (addonPrice === 0 && addon.base_price) {
            addonPrice = Number(addon.base_price);
          } else if (addonPrice === 0) {
            addonPrice = Number(addon.addon_size_price) || 0;
          }
          addonPrices[addonName] = addonPrice;
          const customVariantsPrice = Object.values(addon.custom_variants || {}).reduce((sum, v) => sum + (Number(v.price) || 0), 0);
          addonSizePrices[addonName] = Number(addon.addon_size_price) || (addonPrice - (Number(addon.addon_ice_price) || 0) - (Number(addon.addon_spicy_price) || 0) - customVariantsPrice) || 0;
          addonIcePrices[addonName] = Number(addon.addon_ice_price) || 0;
          addonSpicyPrices[addonName] = Number(addon.addon_spicy_price) || 0;
          addonImages[addonName] = (addon.addon_image
            ? addon.addon_image.startsWith("http")
              ? addon.addon_image
              : `${baseURL}${addon.addon_image}`
            : "/static/images/default-addon-image.jpg") + cacheBuster;
          addonCustomVariantsDetails[addonName] = addon.custom_variants || {};
        });

        formattedItem.addonQuantities = addonQuantities;
        formattedItem.addonVariants = addonVariants;
        formattedItem.addonPrices = addonPrices;
        formattedItem.addonSizePrices = addonSizePrices;
        formattedItem.addonIcePrices = addonIcePrices;
        formattedItem.addonSpicyPrices = addonSpicyPrices;
        formattedItem.addonImages = addonImages;
        formattedItem.addonCustomVariantsDetails = addonCustomVariantsDetails;
      } else {
        formattedItem.addonImages = formattedItem.addonImages || {};
        Object.keys(formattedItem.addonQuantities || {}).forEach((addonName) => {
          if (!formattedItem.addonImages[addonName]) {
            formattedItem.addonImages[addonName] = "/static/images/default-addon-image.jpg" + cacheBuster;
          }
        });
      }

      // Reconstruct combo details from selectedCombos array if not already objects
      if (Array.isArray(item.selectedCombos)) {
        const comboQuantities = {};
        const comboVariants = {};
        const comboPrices = {};
        const comboSizePrices = {};
        const comboIcePrices = {};
        const comboSpicyPrices = {};
        const comboImages = {};
        const comboCustomVariantsDetails = {};

        item.selectedCombos.forEach((combo) => {
          const comboName = combo.name1;
          comboQuantities[comboName] = Number(combo.combo_quantity) || 1;
          comboVariants[comboName] = {
            size: combo.size || "M",
            cold: combo.cold || "without_ice",
            spicy: combo.isSpicy || false,
            sugar: combo.sugar || "medium",
            kitchen: combo.kitchen || "Main Kitchen",
          };
          let comboPrice = Number(combo.combo_price) || 0;
          if (comboPrice === 0 && combo.combo_total_price) {
            comboPrice = Number(combo.combo_total_price) / (Number(combo.combo_quantity) || 1);
          } else if (comboPrice === 0 && combo.base_price) {
            comboPrice = Number(combo.base_price);
          } else if (comboPrice === 0 && combo.combo_size_price) {
            comboPrice = Number(combo.combo_size_price);
          } else if (comboPrice === 0 && item.basePrice) {
            comboPrice = Number(item.basePrice) / (item.comboQuantities ? Object.keys(item.comboQuantities).length : 1);
          }
          if (comboPrice === 0) {
            console.warn(`Warning: No valid price found for combo ${comboName}. Setting default to 0.00. Check backend data.`);
            comboPrice = 0;
          }
          comboPrices[comboName] = comboPrice;
          const customVariantsPrice = Object.values(combo.custom_variants || {}).reduce((sum, v) => sum + (Number(v.price) || 0), 0);
          comboSizePrices[comboName] = Number(combo.combo_size_price) || (comboPrice - (Number(combo.combo_ice_price) || 0) - (Number(combo.combo_spicy_price) || 0) - customVariantsPrice) || 0;
          comboIcePrices[comboName] = Number(combo.combo_ice_price) || 0;
          comboSpicyPrices[comboName] = Number(combo.combo_spicy_price) || 0;
          comboImages[comboName] = (combo.combo_image
            ? combo.combo_image.startsWith("http")
              ? combo.combo_image
              : `${baseURL}${combo.combo_image}`
            : "/static/images/default-combo-image.jpg") + cacheBuster;
          comboCustomVariantsDetails[comboName] = combo.custom_variants || {};
        });

        formattedItem.comboQuantities = comboQuantities;
        formattedItem.comboVariants = comboVariants;
        formattedItem.comboPrices = comboPrices;
        formattedItem.comboSizePrices = comboSizePrices;
        formattedItem.comboIcePrices = comboIcePrices;
        formattedItem.comboSpicyPrices = comboSpicyPrices;
        formattedItem.comboImages = comboImages;
        formattedItem.comboCustomVariantsDetails = comboCustomVariantsDetails;
        formattedItem.selectedCombos = item.selectedCombos;
      } else {
        formattedItem.comboImages = formattedItem.comboImages || {};
        Object.keys(formattedItem.comboQuantities || {}).forEach((comboName) => {
          if (!formattedItem.comboImages[comboName]) {
            formattedItem.comboImages[comboName] = "/static/images/default-combo-image.jpg" + cacheBuster;
          }
        });
      }

      // Custom variants for main item
      formattedItem.selectedCustomVariants = item.selectedCustomVariants || {};
      formattedItem.customVariantsDetails = item.customVariantsDetails || {};
      formattedItem.customVariantsQuantities = item.customVariantsQuantities || {};

      // For combo offers
      if (item.isCombo) {
        formattedItem.isCombo = true;
        formattedItem.comboItems = item.comboItems || [];
      }

      // Format comboItems images for combo offers
      if (item.isCombo && Array.isArray(item.comboItems)) {
        formattedItem.comboItems = item.comboItems.map((comboItem) => ({
          ...comboItem,
          image: (comboItem.image
            ? comboItem.image.startsWith("http")
              ? comboItem.image
              : `${baseURL}${comboItem.image}`
            : "/static/images/default-combo-image.jpg") + cacheBuster,
        }));
      }

      formattedItem.image = (item.image
        ? item.image.startsWith("http")
          ? item.image
          : `${baseURL}${item.image}`
        : "/static/images/default-item.jpg") + cacheBuster;

      // Recalculate totalPrice for consistency
      let itemSubtotal = formattedItem.basePrice * formattedItem.quantity;
      let addonTotal = 0;
      if (formattedItem.addonPrices && formattedItem.addonQuantities) {
        Object.keys(formattedItem.addonPrices).forEach((key) => {
          const price = formattedItem.addonPrices[key];
          const qty = formattedItem.addonQuantities[key] || 0;
          addonTotal += price * qty;
        });
      }
      itemSubtotal += addonTotal;
      let comboTotal = 0;
      if (formattedItem.comboPrices && formattedItem.comboQuantities) {
        Object.keys(formattedItem.comboPrices).forEach((key) => {
          const price = formattedItem.comboPrices[key];
          const qty = formattedItem.comboQuantities[key] || 0;
          comboTotal += price * qty;
        });
      }
      itemSubtotal += comboTotal;
      formattedItem.totalPrice = itemSubtotal;

      return formattedItem;
    });

    const orderType = order.orderType || inferOrderType(order);
    const phoneNumber = order.phoneNumber?.replace(/^\+\d+/, "") || "";

    // Suppressed UI warning message as per request
    // setWarningMessage(
    //   `You selected order ${order.orderNo} for ${
    //     orderType === "Online Delivery" ? "Customer " + order.customerName : "Table " + (order.tableNumber || "N/A")
    //   }`
    // );
    // setWarningType("success");

    // Directly navigate since warning is suppressed
    navigate("/frontpage", {
      state: {
        tableNumber: order.tableNumber || "N/A",
        phoneNumber: phoneNumber,
        customerName: order.customerName || "",
        existingOrder: { ...order, cartItems: formattedCartItems },
        cartItems: formattedCartItems,
        deliveryAddress: order.deliveryAddress || { building_name: "", flat_villa_no: "", location: "" },
        whatsappNumber: "",
        email: "",
        orderType: orderType,
        chairsBooked: Array.isArray(order.chairsBooked) ? order.chairsBooked : [],
        deliveryPersonId: order.deliveryPersonId || "",
        pickedUpTime: order.pickedUpTime || null,
        orderId: order.orderId,
        orderNo: order.orderNo,
      },
    });
  };

  const handleBack = () => {
    navigate("/frontpage");
  };

  const toggleItems = (index) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const renderIngredients = (ingredients) => {
    if (!ingredients || ingredients.length === 0) return "No ingredients";
    return (
      <ul className="active-orders-ingredients-list">
        {ingredients.map((ing, idx) => (
          <li key={idx}>
            {ing.name}: {ing.custom_weight || ing.weight || "N/A"}g (₹{ing.calculated_price || ing.base_price || 0})
          </li>
        ))}
      </ul>
    );
  };

  const getPickedUpTick = (item, kitchen) => {
    if (!item.kitchenStatuses || !kitchen) return null;
    return item.kitchenStatuses[kitchen] === "PickedUp" ? <FaCheck style={{ color: 'green', marginLeft: '5px' }} /> : null;
  };

  const renderAddons = (addonQuantities, addonVariants, addonPrices, item) => {
    if (!addonQuantities || Object.keys(addonQuantities).length === 0) return null;
    return (
      <ul className="active-orders-addons-list">
        {Object.entries(addonQuantities)
          .filter(([_, qty]) => qty > 0)
          .map(([addonName, qty], idx) => {
            const addon = addonVariants?.[addonName] || {};
            const price = addonPrices?.[addonName] || 0;
            const kitchen = addon.kitchen || "Unknown";
            const tick = getPickedUpTick(item, kitchen);
            return (
              <li key={idx}>
                + Addon: {addonName} x{qty} (₹{price.toFixed(2)}, Kitchen: {kitchen})
                {tick}
              </li>
            );
          })}
      </ul>
    );
  };

  const renderCombos = (comboQuantities, comboVariants, comboPrices, item) => {
    if (!comboQuantities || Object.keys(comboQuantities).length === 0) return null;
    return (
      <ul className="active-orders-combos-list">
        {Object.entries(comboQuantities)
          .filter(([_, qty]) => qty > 0)
          .map(([comboName, qty], idx) => {
            const combo = comboVariants?.[comboName] || {};
            const price = comboPrices?.[comboName] || 0;
            const kitchen = combo.kitchen || "Unknown";
            const tick = getPickedUpTick(item, kitchen);
            return (
              <li key={idx}>
                <strong>+ Combo: </strong>
                {comboName} ({combo.size || "M"}) x{qty} (₹{price.toFixed(2)}
                {combo.spicy ? " (Spicy)" : ""}, Kitchen: {kitchen})
                {tick}
              </li>
            );
          })}
      </ul>
    );
  };

  const calculateOrderTotal = (cartItems) => {
    if (!Array.isArray(cartItems)) return "0.00";
    return cartItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0).toFixed(2);
  };

  const calculateGrandTotal = (cartItems) => {
    if (!Array.isArray(cartItems)) return "0.00";
    const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
    const vat = subtotal * vatRate;
    return (subtotal + vat).toFixed(2);
  };

  const getItemStatus = (item) => {
    if (!item.kitchenStatuses) return item.status || "Pending";
    const statuses = Object.values(item.kitchenStatuses);
    if (statuses.every((status) => status === "PickedUp")) return "PickedUp";
    else if (statuses.every((status) => status === "Prepared" || status === "PickedUp")) return "Prepared";
    else if (statuses.includes("Preparing")) return "Preparing";
    else return "Pending";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return { backgroundColor: "#fff1f0", color: "#721c24" };
      case "Preparing":
        return { backgroundColor: "#fff3cd", color: "#856404" };
      case "Prepared":
        return { backgroundColor: "#d4edda", color: "#155724" };
      case "PickedUp":
        return { backgroundColor: "#e7f3ff", color: "#004085" };
      default:
        return {};
    }
  };

  const formatDeliveryAddress = (deliveryAddress) => {
    if (!deliveryAddress) return "Not provided";
    const { building_name, flat_villa_no, location } = deliveryAddress;
    const parts = [flat_villa_no, building_name, location].filter((part) => part != null && String(part).trim() !== "");
    return parts.length > 0 ? parts.join(", ") : "Not provided";
  };

  const formatChairsBooked = (chairsBooked) => {
    if (!Array.isArray(chairsBooked) || chairsBooked.length === 0) return "None";
    return chairsBooked.join(", ");
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const getDeliveryPersonName = (deliveryPersonId) => {
    const employee = employees.find((emp) => emp.employeeId === deliveryPersonId);
    return employee ? `${employee.name} (ID: ${employee.employeeId})` : "Not assigned";
  };

  const orderCounts = {
    "Dine In": savedOrders.filter((order) => (order.orderType || inferOrderType(order)) === "Dine In").length,
    "Take Away": savedOrders.filter((order) => (order.orderType || inferOrderType(order)) === "Take Away").length,
    "Online Delivery": savedOrders.filter((order) => (order.orderType || inferOrderType(order)) === "Online Delivery").length,
  };

  const filteredOrders = savedOrders.filter((order) => {
    const orderType = order.orderType || inferOrderType(order);
    return orderType === filterType;
  });

  const unservedFiltered = filteredOrders.filter((order) => {
    const allItemsCompleted = order.cartItems.every((item) => (item.servedQuantity || 0) >= (item.quantity || 1));
    return !(order.paid && allItemsCompleted);
  });

  const completedFiltered = filteredOrders.filter((order) => {
    const allItemsCompleted = order.cartItems.every((item) => (item.servedQuantity || 0) >= (item.quantity || 1));
    return order.paid && allItemsCompleted;
  });

  const handleServiceChange = async (orderId, itemId, isServed) => {
    try {
      const order = savedOrders.find((o) => o.orderId === orderId);
      const item = order.cartItems.find((i) => i.id === itemId);
      if (!item) return;

      const newServedQty = isServed ? (item.quantity || 1) : 0;
      console.log(`Updating servedQuantity for item ${itemId}: ${newServedQty} (isServed: ${isServed})`);

      const response = await axios.post(`${baseUrl}/api/activeorders/${orderId}/items/${itemId}/mark-served`, { servedQuantity: newServedQty });

      if (response.data.success) {
        const updatedOrders = savedOrders.map((o) =>
          o.orderId === orderId
            ? {
                ...o,
                cartItems: o.cartItems.map((i) =>
                  i.id === itemId ? { ...i, servedQuantity: newServedQty, served: isServed } : i
                ),
              }
            : o
        );
        setSavedOrders(updatedOrders);
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
        // Suppressed UI warning message as per request
      }
    } catch (err) {
      console.error("Failed to update service status:", err);
      // Suppressed UI warning message as per request
    }
  };

  const handlePaymentChange = async (orderId, isPaid) => {
    try {
      const response = await axios.put(`${baseUrl}/api/activeorders/${orderId}`, { paid: isPaid });
      const updatedOrders = savedOrders.map((order) =>
        order.orderId === orderId ? { ...order, paid: isPaid } : order
      );
      setSavedOrders(updatedOrders);
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
      // Suppressed UI warning message as per request
    } catch (err) {
      console.error("Failed to update payment status:", err);
      // Suppressed UI warning message as per request
    }
  };

  const renderOrderTable = (orders, tableTitle) => {
    const isOnlineDelivery = filterType === "Online Delivery";
    return (
      <div className="active-orders-table-wrapper">
        <h2>{tableTitle}</h2>
        {tableTitle === "Completed Orders" && orders.length > 0 && (
          <button className="active-orders-btn active-orders-btn-danger" onClick={handleDeleteAllCompleted}>
            Clear All Completed Orders
          </button>
        )}
        {orders.length > 0 ? (
          <div className="active-orders-table-responsive">
            <table className="active-orders-table active-orders-table-striped active-orders-table-bordered">
              <thead>
                {isOnlineDelivery ? (
                  <tr>
                    <th>Order No</th>
                    <th>Delivery Address</th>
                    <th>Customer</th>
                    <th>Order Type</th>
                    <th>Phone</th>
                    <th>Timestamp</th>
                    <th>Total (₹)</th>
                    <th>Grand Total (₹)</th>
                    <th>Payment Status</th>
                    <th>Delivery Person</th>
                    <th>Picked Up Time</th>
                    <th>Items</th>
                    <th>Actions</th>
                    <th>Completed</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Order No</th>
                    <th>Table</th>
                    <th>Customer</th>
                    <th>Order Type</th>
                    <th>Phone</th>
                    <th>Chairs</th>
                    <th>Timestamp</th>
                    <th>Total (₹)</th>
                    <th>Grand Total (₹)</th>
                    <th>Payment Status</th>
                    <th>Items</th>
                    <th>Actions</th>
                    <th>Completed</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const isAllPickedUp = checkAllItemsPickedUp(order);
                  const isCompleted = tableTitle === "Completed Orders";
                  const allItemsCompleted = order.cartItems.every((item) => (item.servedQuantity || 0) >= (item.quantity || 1));
                  const canComplete = order.paid && allItemsCompleted;
                  return (
                    <tr key={order.orderId}>
                      <td style={isAllPickedUp ? { color: "green", fontWeight: "bold" } : {}}>
                        {order.orderNo || "N/A"}
                      </td>
                      {isOnlineDelivery ? (
                        <>
                          <td>{formatDeliveryAddress(order.deliveryAddress)}</td>
                          <td>{order.customerName || "Guest"}</td>
                          <td>{order.orderType || inferOrderType(order)}</td>
                          <td>{order.phoneNumber || "Not provided"}</td>
                          <td>{formatTimestamp(order.timestamp)}</td>
                          <td>{calculateOrderTotal(order.cartItems)}</td>
                          <td>{calculateGrandTotal(order.cartItems)}</td>
                          <td>
                            <select
                              value={order.paid ? "Paid" : "Unpaid"}
                              onChange={(e) => handlePaymentChange(order.orderId, e.target.value === "Paid")}
                              className="active-orders-select"
                            >
                              <option value="Unpaid">Unpaid</option>
                              <option value="Paid">Paid</option>
                            </select>
                          </td>
                          <td>
                            {order.deliveryPersonId ? (
                              <span>{getDeliveryPersonName(order.deliveryPersonId)}</span>
                            ) : (
                              <select
                                className="active-orders-select"
                                value={order.deliveryPersonId || ""}
                                onChange={(e) => handleAssignDeliveryPerson(order.orderId, e.target.value)}
                              >
                                <option value="">Select Delivery Person</option>
                                {employees
                                  .filter((emp) => emp.role.toLowerCase() === "delivery boy")
                                  .map((employee) => (
                                    <option key={employee.employeeId} value={employee.employeeId}>
                                      {employee.name} (ID: {employee.employeeId})
                                    </option>
                                  ))}
                              </select>
                            )}
                          </td>
                          <td>{formatTimestamp(order.pickedUpTime)}</td>
                        </>
                      ) : (
                        <>
                          <td>{order.tableNumber ? `Table ${order.tableNumber} (Floor ${getFloor(order.tableNumber)})` : "N/A"}</td>
                          <td>{order.customerName || "Guest"}</td>
                          <td>{order.orderType || inferOrderType(order)}</td>
                          <td>{order.phoneNumber || "Not provided"}</td>
                          <td>{formatChairsBooked(order.chairsBooked)}</td>
                          <td>{formatTimestamp(order.timestamp)}</td>
                          <td>{calculateOrderTotal(order.cartItems)}</td>
                          <td>{calculateGrandTotal(order.cartItems)}</td>
                          <td>
                            <select
                              value={order.paid ? "Paid" : "Unpaid"}
                              onChange={(e) => handlePaymentChange(order.orderId, e.target.value === "Paid")}
                              className="active-orders-select"
                            >
                              <option value="Unpaid">Unpaid</option>
                              <option value="Paid">Paid</option>
                            </select>
                          </td>
                        </>
                      )}
                      <td>
                        {order.cartItems && order.cartItems.length > 0 ? (
                          <div>
                            <div className="active-orders-item-header" onClick={() => toggleItems(`${filterType}-${index}`)}>
                              <strong>{order.cartItems[0].name || order.cartItems[0].item_name}</strong>
                              <span>{expandedItems[`${filterType}-${index}`] ? "▼" : "▶"}</span>
                            </div>
                            {expandedItems[`${filterType}-${index}`] && (
                              <ul className="active-orders-list-group">
                                {order.cartItems.map((item, itemIndex) => {
                                  const itemStatus = getItemStatus(item);
                                  const remainingQty = Math.max(0, (item.quantity || 1) - (item.servedQuantity || 0));
                                  const mainKitchen = item.kitchen || "Main Kitchen";
                                  const mainTick = getPickedUpTick(item, mainKitchen);
                                  return (
                                    <li
                                      key={itemIndex}
                                      className={`active-orders-list-group-item status-${itemStatus.toLowerCase()}`}
                                    >
                                      <strong>{item.name || item.item_name}</strong> x{item.quantity} (Served: {item.servedQuantity || 0}, Pending: {remainingQty})
                                      {mainTick}
                                      <div>Price: {item.originalBasePrice ? <span style={{ textDecoration: "line-through" }}>₹{item.originalBasePrice.toFixed(2)}</span> : ""} ₹{item.basePrice.toFixed(2)}</div>
                                      <div>Size: {item.selectedSize || "M"}</div>
                                      <div>Ice: {item.icePreference || "without_ice"}</div>
                                      <div>Spicy: {item.isSpicy ? "Yes" : "No"}</div>
                                      <div>Kitchen: {item.kitchen || "Main Kitchen"}</div>
                                      <div>Status: {itemStatus}{itemStatus === "PickedUp" ? " (All Done)" : ""}</div>
                                      {renderAddons(item.addonQuantities, item.addonVariants, item.addonPrices, item)}
                                      {renderCombos(item.comboQuantities, item.comboVariants, item.comboPrices, item)}
                                      <div>
                                        <strong>Ingredients:</strong> {renderIngredients(item.ingredients)}
                                      </div>
                                      {item.kitchenStatuses && (
                                        <div>
                                          <strong>Kitchen Statuses:</strong>
                                          <ul className="active-orders-kitchen-statuses">
                                            {Object.entries(item.kitchenStatuses).map(([kitchen, status], idx) => (
                                              <li key={idx}>
                                                {kitchen}: {status}
                                                {status === "PickedUp" && <FaCheck style={{ color: 'green', marginLeft: '5px' }} />}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {!isCompleted && (
                                        <select
                                          value={item.servedQuantity >= (item.quantity || 1) ? "Served" : "Unserved"}
                                          onChange={(e) => handleServiceChange(order.orderId, item.id, e.target.value === "Served")}
                                          className="active-orders-select"
                                          disabled={!checkAllItemsPickedUpForItem(item)}
                                        >
                                          <option value="Unserved">Unserved (Pending: {remainingQty})</option>
                                          <option value="Served">Served (All)</option>
                                        </select>
                                      )}
                                      {isCompleted && (
                                        <button
                                          className="active-orders-btn active-orders-btn-danger active-orders-btn-sm"
                                          onClick={() => handleDeleteItem(order.orderId, item.id)}
                                        >
                                          Delete Item
                                        </button>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <div>No items</div>
                        )}
                      </td>
                      <td>
                        <button className="active-orders-btn active-orders-btn-primary active-orders-btn-sm" onClick={() => handleSelectOrder(order)}>
                          Select
                        </button>
                        <button
                          className="active-orders-btn active-orders-btn-danger active-orders-btn-sm"
                          onClick={() => handleDeleteOrder(order.orderId, order.tableNumber, order.orderNo)}
                        >
                          Delete Order
                        </button>
                      </td>
                      <td>
                        <button
                          className={`active-orders-btn active-orders-btn-sm ${canComplete ? "active-orders-btn-success" : "active-orders-btn-secondary"}`}
                          onClick={() => canComplete && handleCompleted(order.orderId)}
                          disabled={!canComplete}
                        >
                          Completed
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="active-orders-text-center">
            <p>No {tableTitle.toLowerCase()} orders found.</p>
          </div>
        )}
      </div>
    );
  };

  function checkAllItemsPickedUpForItem(item) {
    if (!item.kitchenStatuses) return false;
    return Object.values(item.kitchenStatuses).every((status) => status === "PickedUp");
  }

  return (
    <div className="active-orders-container">
      {warningMessage && (
        <div
          className={`active-orders-alert active-orders-alert-${
            warningType === "success" ? "success" : "warning"
          }`}
        >
          {warningMessage}
          {isConfirmation ? (
            <div className="active-orders-alert-buttons">
              <button className="active-orders-btn active-orders-btn-success" onClick={handleConfirmYes}>
                Yes
              </button>
              <button className="active-orders-btn active-orders-btn-danger" onClick={handleConfirmNo}>
                No
              </button>
            </div>
          ) : (
            <button className="active-orders-btn active-orders-btn-primary" onClick={handleWarningOk}>
              OK
            </button>
          )}
        </div>
      )}
      {showDeliveryPopup && (
        <div className="active-orders-modal-overlay">
          <div className="active-orders-modal-content">
            <p>Assign {getDeliveryPersonName(selectedDeliveryPersonId)} to the order?</p>
            <div>
              <button className="active-orders-btn active-orders-btn-success" onClick={confirmDeliveryAssignment}>
                Confirm
              </button>
              <button className="active-orders-btn active-orders-btn-danger" onClick={cancelDeliveryPopup}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="active-orders-header">
        <FaArrowLeft
          className="active-orders-back-button"
          onClick={handleBack}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === "Enter" && handleBack()}
        />
        <h1>Active Orders</h1>
        <button className="active-orders-btn active-orders-btn-primary active-orders-refresh-btn" onClick={handleRefresh}>
          <FaSyncAlt style={{ marginRight: "5px" }} />
          Refresh
        </button>
      </div>
      <div className="active-orders-filter-buttons">
        <button
          className={`active-orders-btn ${
            filterType === "Dine In" ? "active-orders-btn-success" : "active-orders-btn-primary"
          }`}
          onClick={() => setFilterType("Dine In")}
        >
          Dine In ({orderCounts["Dine In"]})
        </button>
        <button
          className={`active-orders-btn ${
            filterType === "Take Away" ? "active-orders-btn-success" : "active-orders-btn-primary"
          }`}
          onClick={() => setFilterType("Take Away")}
        >
          Take Away ({orderCounts["Take Away"]})
        </button>
        <button
          className={`active-orders-btn ${
            filterType === "Online Delivery" ? "active-orders-btn-success" : "active-orders-btn-primary"
          }`}
          onClick={() => setFilterType("Online Delivery")}
        >
          Online Delivery ({orderCounts["Online Delivery"]})
        </button>
      </div>
      {renderOrderTable(unservedFiltered, "Unserved Orders")}
      {renderOrderTable(completedFiltered, "Completed Orders")}
    </div>
  );
}

export default ActiveOrders;