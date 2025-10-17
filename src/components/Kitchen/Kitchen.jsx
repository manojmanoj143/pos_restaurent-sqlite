import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
          <h3>Something went wrong in the Kitchen view.</h3>
          <p>{this.state.error?.message || "Unknown error"}</p>
          <button
            style={{
              padding: "6px 12px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Kitchen() {
  const navigate = useNavigate();
  const [savedOrders, setSavedOrders] = React.useState([]);
  const [selectedKitchen, setSelectedKitchen] = React.useState(null);
  const [showStatusPopup, setShowStatusPopup] = React.useState(false);
  const [showAllStatusPopup, setShowAllStatusPopup] = React.useState(false);
  const [pickedUpItems, setPickedUpItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [lastHourSearchDate, setLastHourSearchDate] = React.useState("");
  const [allStatusSearchDate, setAllStatusSearchDate] = React.useState("");
  const [selectedCustomers, setSelectedCustomers] = React.useState([]);
  const [itemDetailsCache, setItemDetailsCache] = React.useState({});
  const [baseUrl, setBaseUrl] = React.useState("");
  const currentYear = new Date().getFullYear().toString();

  // Helper to get fetched kitchen
  const getFetchedKitchen = (type, mainItemName, subName, fallback = null) => {
    const details = itemDetailsCache[mainItemName];
    if (!details || !subName) {
      console.log(`No details for ${mainItemName} or missing subName: ${subName}`);
      return fallback;
    }
    const list = type === "addon" ? details.addons : details.combos;
    const sub = list.find((s) => s.name1 === subName);
    const kitchen = sub ? sub.kitchen : fallback;
    console.log(`Fetched kitchen for ${type} ${mainItemName}/${subName}: ${kitchen}`);
    return kitchen;
  };

  // Retry logic with exponential backoff
  const retryRequest = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        console.error(`API call failed, retrying (${i + 1}/${retries})...`, error);
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  };

  // Fetch config for baseUrl
  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:8000`);
        } else {
          setBaseUrl("");
        }
        console.log("API configured for", appConfig.mode, "mode. Pointing to", baseUrl || "localhost");
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl("http://127.0.0.1:8000"); // Fallback to Vite proxy target
      }
    };
    fetchConfig();
  }, []);

  // Fetch active orders
  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await retryRequest(() =>
          axios.get(`${baseUrl}/api/activeorders`, { timeout: 8000 })
        );
        console.log("Fetched orders from server:", response.data);
        if (Array.isArray(response.data)) {
          const ordersWithStatuses = response.data.map((order) => ({
            ...order,
            cartItems: Array.isArray(order.cartItems)
              ? order.cartItems.map((item) => ({
                  ...item,
                  kitchenStatuses: item.kitchenStatuses || {},
                }))
              : [],
          }));
          setSavedOrders(ordersWithStatuses);
          setErrorMessage("");
        } else {
          console.error("Invalid orders response:", response.data);
          // Suppressed UI error message as per request
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        // Suppressed UI error message as per request - do not setErrorMessage
        let message = "Failed to fetch orders. Please try again later.";
        if (error.response?.status === 500) {
          message = "Server error occurred. Please contact support or try again.";
        } else if (error.code === "ECONNABORTED") {
          message = "Request timed out. Check your network or try again.";
        }
        // Do not setErrorMessage(message); // Suppressed
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000); // Increased to 60 seconds
    return () => clearInterval(interval);
  }, [baseUrl]);

  // Fetch historical picked-up items
  const fetchPickedUpItems = async () => {
    try {
      setLoading(true);
      const response = await retryRequest(() =>
        axios.get(`${baseUrl}/api/picked-up-items`, { timeout: 8000 })
      );
      console.log("Fetched picked-up items from server:", response.data);
      if (response.data.success && Array.isArray(response.data.pickedUpItems)) {
        setPickedUpItems(response.data.pickedUpItems);
        setErrorMessage("");
      } else {
        console.error("Invalid picked-up items response:", response.data);
        // Suppressed UI error message as per request
      }
    } catch (error) {
      console.error("Error fetching picked-up items:", error);
      // Suppressed UI error message as per request
      let message = "Failed to fetch picked-up items. Please try again later.";
      if (error.response?.status === 500) {
        message = "Server error occurred. Please contact support or try again.";
      } else if (error.code === "ECONNABORTED") {
        message = "Request timed out. Check your network or try again.";
      }
      // Do not setErrorMessage(message); // Suppressed
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPickedUpItems();
  }, [baseUrl]);

  // Fetch item details
  React.useEffect(() => {
    const fetchItemDetails = async () => {
      const itemsToFetch = savedOrders
        .filter((order) => Array.isArray(order.cartItems))
        .flatMap((order) => order.cartItems)
        .filter((item) => !itemDetailsCache[item.name]);
      for (const item of itemsToFetch) {
        try {
          const itemName = encodeURIComponent(item.name);
          const response = await retryRequest(() =>
            axios.get(`${baseUrl}/api/items/${itemName}`, { timeout: 8000 })
          );
          console.log(`Fetched details for item ${item.name}:`, response.data);
          if (response.data) {
            const fetchedData = {
              image: response.data.image || item.image || "/static/uploads/placeholder.png",
              addons: Array.isArray(response.data.addons)
                ? response.data.addons.map((addon) => ({
                    name1: addon.name1 || "Unknown",
                    addon_image: addon.addon_image || "/static/uploads/placeholder.png",
                    kitchen: addon.kitchen || "Unknown",
                  }))
                : [],
              combos: Array.isArray(response.data.combos)
                ? response.data.combos.map((combo) => ({
                    name1: combo.name1 || "Unknown",
                    combo_image: combo.combo_image || "/static/uploads/placeholder.png",
                    kitchen: combo.kitchen || "Unknown",
                    size: combo.size || "M",
                    spicy: combo.spicy || false,
                  }))
                : [],
            };
            setItemDetailsCache((prev) => ({
              ...prev,
              [item.name]: fetchedData,
            }));
          }
        } catch (error) {
          console.error(`Error fetching details for item ${item.name}:`, error);
          setItemDetailsCache((prev) => ({
            ...prev,
            [item.name]: {
              image: item.image || "/static/uploads/placeholder.png",
              addons: [],
              combos: [],
            },
          }));
        }
      }
    };
    if (savedOrders.length > 0) {
      fetchItemDetails();
    }
  }, [savedOrders, baseUrl]);

  // Derive kitchens
  const kitchens = [
    ...new Set(
      savedOrders
        .filter((order) => Array.isArray(order.cartItems))
        .flatMap((order) =>
          order.cartItems.reduce((acc, item) => {
            if (item.kitchen) acc.push(item.kitchen);
            if (item.addonQuantities) {
              Object.entries(item.addonQuantities).forEach(([addonName, qty]) => {
                if (qty > 0) {
                  const k = getFetchedKitchen("addon", item.name, addonName, item.addonVariants?.[addonName]?.kitchen);
                  if (k) acc.push(k);
                }
              });
            }
            if (item.comboQuantities) {
              Object.entries(item.comboQuantities).forEach(([comboName, qty]) => {
                if (qty > 0) {
                  const k = getFetchedKitchen("combo", item.name, comboName, item.comboVariants?.[comboName]?.kitchen);
                  if (k) acc.push(k);
                }
              });
            }
            return acc;
          }, [])
        )
        .filter((kitchen) => kitchen && typeof kitchen === "string")
    ),
  ];

  React.useEffect(() => {
    console.log("Derived kitchens from savedOrders:", savedOrders, kitchens);
    if (kitchens.length > 0 && (!selectedKitchen || !kitchens.includes(selectedKitchen))) {
      setSelectedKitchen(kitchens[0]);
    } else if (kitchens.length === 0 && selectedKitchen) {
      console.log("No kitchens available, retaining selectedKitchen:", selectedKitchen);
    }
  }, [kitchens, selectedKitchen]);

  // Filter orders for selected kitchen
  const filteredOrders = savedOrders
    .map((order) => {
      const relevantItems = Array.isArray(order.cartItems)
        ? order.cartItems
            .map((item) => {
              const filteredAddons = {};
              const filteredAddonVariants = {};
              const filteredAddonCustomVariantsDetails = {};
              if (item.addonQuantities && item.addonVariants) {
                Object.entries(item.addonQuantities).forEach(([addonName, qty]) => {
                  if (qty > 0) {
                    const addonKitchen = getFetchedKitchen(
                      "addon",
                      item.name,
                      addonName,
                      item.addonVariants[addonName]?.kitchen
                    );
                    if (addonKitchen === selectedKitchen) {
                      filteredAddons[addonName] = qty;
                      filteredAddonVariants[addonName] = {
                        ...item.addonVariants[addonName],
                        kitchen: addonKitchen,
                      };
                      filteredAddonCustomVariantsDetails[addonName] =
                        item.addonCustomVariantsDetails?.[addonName] || {};
                    }
                  }
                });
              }
              const filteredCombos = {};
              const filteredComboVariants = {};
              const filteredComboCustomVariantsDetails = {};
              if (item.comboQuantities && item.comboVariants) {
                Object.entries(item.comboQuantities).forEach(([comboName, qty]) => {
                  if (qty > 0) {
                    const comboKitchen = getFetchedKitchen(
                      "combo",
                      item.name,
                      comboName,
                      item.comboVariants[comboName]?.kitchen
                    );
                    if (comboKitchen === selectedKitchen) {
                      filteredCombos[comboName] = qty;
                      filteredComboVariants[comboName] = {
                        ...item.comboVariants[comboName],
                        kitchen: comboKitchen,
                      };
                      filteredComboCustomVariantsDetails[comboName] =
                        item.comboCustomVariantsDetails?.[comboName] || {};
                    }
                  }
                });
              }
              return {
                ...item,
                addonQuantities: filteredAddons,
                addonVariants: filteredAddonVariants,
                addonCustomVariantsDetails: filteredAddonCustomVariantsDetails,
                comboQuantities: filteredCombos,
                comboVariants: filteredComboVariants,
                comboCustomVariantsDetails: filteredComboCustomVariantsDetails,
                displayInKitchen:
                  item.kitchen === selectedKitchen ||
                  Object.keys(filteredAddons).length > 0 ||
                  Object.keys(filteredCombos).length > 0,
                kitchenStatuses: item.kitchenStatuses || {},
              };
            })
            .filter((item) => item.displayInKitchen)
        : [];
      return { ...order, cartItems: relevantItems };
    })
    .filter((order) => order.cartItems.length > 0);

  // Formatting helpers
  const formatItemVariants = (item) => {
    const variants = [];
    if (item.selectedSize) variants.push(`Size: ${item.selectedSize}`);
    if (item.icePreference === "with_ice") variants.push(`Ice: With Ice`);
    if (item.isSpicy === true) variants.push(`Spicy: Yes`);
    if (item.sugarLevel && item.sugarLevel !== "medium") {
      variants.push(
        `Sugar: ${item.sugarLevel.charAt(0).toUpperCase() + item.sugarLevel.slice(1)}`
      );
    }
    return variants.length > 0 ? `(${variants.join(", ")})` : "";
  };

  const formatCustomVariants = (customVariantsDetails) => {
    if (!customVariantsDetails) return "";
    const custom = Object.values(customVariantsDetails)
      .map((v) => `${v.heading}: ${v.name}`)
      .join(", ");
    return custom ? `Custom: ${custom}` : "";
  };

  const formatAddonVariants = (addonVariants) => {
    const variants = [];
    if (addonVariants?.size) {
      variants.push(`Size: ${addonVariants.size}`);
    }
    if (addonVariants?.spicy === true) {
      variants.push(`Spicy: Yes`);
    }
    if (addonVariants?.sugar && addonVariants.sugar !== "medium") {
      variants.push(
        `Sugar: ${addonVariants.sugar.charAt(0).toUpperCase() + addonVariants.sugar.slice(1)}`
      );
    }
    return variants.length > 0 ? `(${variants.join(", ")})` : "";
  };

  const formatAddonCustomVariants = (addonCustomVariantsDetails) => {
    if (!addonCustomVariantsDetails) return "";
    const custom = Object.values(addonCustomVariantsDetails)
      .map((v) => `${v.heading}: ${v.name}`)
      .join(", ");
    return custom ? `Custom: ${custom}` : "";
  };

  const formatComboVariants = (comboVariants) => {
    const variants = [];
    if (comboVariants?.size) {
      variants.push(`Size: ${comboVariants.size}`);
    }
    if (comboVariants?.spicy === true) {
      variants.push(`Spicy: Yes`);
    }
    if (comboVariants?.sugar && comboVariants.sugar !== "medium") {
      variants.push(
        `Sugar: ${comboVariants.sugar.charAt(0).toUpperCase() + comboVariants.sugar.slice(1)}`
      );
    }
    return variants.length > 0 ? `(${variants.join(", ")})` : "";
  };

  const formatComboCustomVariants = (comboCustomVariantsDetails) => {
    if (!comboCustomVariantsDetails) return "";
    const custom = Object.values(comboCustomVariantsDetails)
      .map((v) => `${v.heading}: ${v.name}`)
      .join(", ");
    return custom ? `Custom: ${custom}` : "";
  };

  // Popup data logic
  const getLastHourItems = () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let filteredItems = (pickedUpItems || []).filter((entry) => {
      const pickupTime = new Date(entry.pickupTime);
      return pickupTime >= oneHourAgo;
    });
    if (lastHourSearchDate) {
      const fullSearchDate = `${currentYear}-${lastHourSearchDate}`;
      const matchingItems = filteredItems.filter((entry) =>
        entry.pickupTime.startsWith(fullSearchDate)
      );
      const nonMatchingItems = filteredItems.filter(
        (entry) => !entry.pickupTime.startsWith(fullSearchDate)
      );
      return [
        ...matchingItems.sort((a, b) => new Date(b.pickupTime) - new Date(a.pickupTime)),
        ...nonMatchingItems.sort((a, b) => new Date(b.pickupTime) - new Date(a.pickupTime)),
      ];
    }
    return filteredItems.sort((a, b) => new Date(b.pickupTime) - new Date(a.pickupTime));
  };

  const getAllPickedUpItems = () => {
    let sortedItems = (pickedUpItems || []).slice();
    if (allStatusSearchDate) {
      const fullSearchDate = `${currentYear}-${allStatusSearchDate}`;
      const matchingItems = sortedItems.filter((entry) =>
        entry.pickupTime.startsWith(fullSearchDate)
      );
      const nonMatchingItems = sortedItems.filter(
        (entry) => !entry.pickupTime.startsWith(fullSearchDate)
      );
      return [
        ...matchingItems.sort((a, b) => new Date(b.pickupTime) - new Date(a.pickupTime)),
        ...nonMatchingItems.sort((a, b) => new Date(b.pickupTime) - new Date(a.pickupTime)),
      ];
    }
    return sortedItems.sort((a, b) => new Date(b.pickupTime) - new Date(a.pickupTime));
  };

  // Flattened sub-items for popup
  const getFlattenedSubItems = (entry) => {
    const allItems = Array.isArray(entry.items) ? entry.items : [entry];
    const subItems = [];
    allItems.forEach((item) => {
      subItems.push({
        id: `main-${item.id || Math.random()}`,
        type: "main",
        name: item.item_name || "Unknown Item",
        quantity: item.quantity || 1,
        category: item.category || "N/A",
        kitchen: item.kitchen || "N/A",
      });
      if (item.addons && Array.isArray(item.addons)) {
        item.addons.forEach((addon) => {
          if (addon.addon_quantity > 0) {
            subItems.push({
              id: `addon-${addon.name1 || Math.random()}`,
              type: "addon",
              name: `+ Addon: ${addon.name1}`,
              quantity: addon.addon_quantity,
              category: "Addon",
              kitchen: addon.kitchen || "N/A",
            });
          }
        });
      }
      if (item.selectedCombos && Array.isArray(item.selectedCombos)) {
        item.selectedCombos.forEach((combo) => {
          const comboQty = combo.combo_quantity || 1;
          if (comboQty > 0) {
            const spicy = combo.isSpicy ? " (Spicy)" : "";
            subItems.push({
              id: `combo-${combo.name1 || Math.random()}`,
              type: "combo",
              name: `+ Combo: ${combo.name1} (${combo.size || "M"})${spicy}`,
              quantity: comboQty,
              category: "Combo",
              kitchen: combo.kitchen || "N/A",
            });
          }
        });
      }
    });
    return subItems;
  };

  // Action handlers
  const handleMarkPrepared = async (orderId, itemId, kitchen) => {
    try {
      const response = await retryRequest(() =>
        axios.post(
          `${baseUrl}/api/activeorders/${orderId}/items/${itemId}/mark-prepared`,
          { kitchen },
          { headers: { "Content-Type": "application/json" }, timeout: 8000 }
        )
      );
      if (response.data.success) {
        setSavedOrders((prev) =>
          prev.map((order) =>
            order.orderId === orderId
              ? {
                  ...order,
                  cartItems: order.cartItems.map((item) =>
                    item.id === itemId
                      ? {
                          ...item,
                          kitchenStatuses: {
                            ...item.kitchenStatuses,
                            [kitchen]: response.data.status,
                          },
                        }
                      : item
                  ),
                }
              : order
          )
        );
      } else {
        console.error("Failed to mark as prepared:", response.data);
        // Suppressed UI error message as per request
      }
    } catch (error) {
      console.error("Error marking as prepared:", error);
      // Suppressed UI error message as per request
    }
  };

  const handlePickUp = async (orderId, itemId) => {
    try {
      setLoading(true);
      const order = savedOrders.find((o) => o.orderId === orderId);
      const pickedItem = order?.cartItems.find((item) => item.id === itemId);
      if (pickedItem && pickedItem.kitchenStatuses?.[selectedKitchen] === "Prepared") {
        const response = await retryRequest(() =>
          axios.post(
            `${baseUrl}/api/activeorders/${orderId}/items/${itemId}/mark-pickedup`,
            { kitchen: selectedKitchen },
            { headers: { "Content-Type": "application/json" }, timeout: 8000 }
          )
        );
        if (response.data.success) {
          setSavedOrders((prev) =>
            prev.map((order) =>
              order.orderId === orderId
                ? {
                    ...order,
                    cartItems: order.cartItems.map((item) =>
                      item.id === itemId
                        ? {
                            ...item,
                            kitchenStatuses: {
                              ...item.kitchenStatuses,
                              [selectedKitchen]: "PickedUp",
                            },
                          }
                        : item
                    ),
                  }
                : order
            )
          );
          await fetchPickedUpItems();
          console.log("Item marked as PickedUp, status preserved.");
        } else {
          console.error("Failed to mark as picked up:", response.data);
          // Suppressed UI error message as per request
        }
      } else {
        console.error("Item not in Prepared status");
        // Suppressed UI error message as per request
      }
    } catch (error) {
      console.error("Error marking as picked up:", error);
      // Suppressed UI error message as per request
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPickUp = async () => {
    try {
      setLoading(true);
      for (const orderId of selectedCustomers) {
        const order = savedOrders.find((o) => o.orderId === orderId);
        if (!order) continue;
        const itemsToPickUp = order.cartItems.filter(
          (item) =>
            item.kitchen === selectedKitchen ||
            Object.values(item.addonVariants || {}).some(
              (addon) => addon.kitchen === selectedKitchen && item.addonQuantities?.[addon.name1]
            ) ||
            Object.values(item.comboVariants || {}).some(
              (combo) => combo.kitchen === selectedKitchen && item.comboQuantities?.[combo.name1]
            )
        );
        for (const item of itemsToPickUp) {
          if (item.kitchenStatuses?.[selectedKitchen] === "Prepared") {
            await handlePickUp(orderId, item.id);
          } else {
            console.log(`Skipping item ${item.id} in order ${orderId} because status is ${item.kitchenStatuses?.[selectedKitchen] || 'Pending'}`);
          }
        }
      }
      setSelectedCustomers([]);
    } catch (error) {
      console.error("Error during bulk pickup:", error);
      // Suppressed UI error message as per request
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCheckboxChange = (orderId) => {
    setSelectedCustomers((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Style helpers
  const getRowStyle = (status) => {
    switch (status || "Pending") {
      case "Pending":
        return { backgroundColor: "#ffcccc", color: "#333" };
      case "Preparing":
        return { backgroundColor: "#fff3cd", color: "#333" };
      case "Prepared":
        return { backgroundColor: "#d4edda", color: "#333" };
      case "PickedUp":
        return { backgroundColor: "#41C2E1", color: "white" };
      default:
        return {};
    }
  };

  const getHighlightStyle = (pickupTime, searchDate) => {
    if (searchDate) {
      const fullSearchDate = `${currentYear}-${searchDate}`;
      if (pickupTime?.startsWith(fullSearchDate)) {
        return { backgroundColor: "#87CEEB" };
      }
    }
    return {};
  };

  const getCorrectImageUrl = (imagePath) => {
    if (!imagePath) return `${baseUrl}/api/images/placeholder.png`;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/")) return baseUrl + imagePath;
    return `${baseUrl}/api/images/${imagePath}`;
  };

  const getAddonComboImages = (item) => {
    const images = [];
    const itemDetails = itemDetailsCache[item.name] || {
      image: item.image || "/static/uploads/placeholder.png",
      addons: [],
      combos: [],
    };
    if (item.kitchen === selectedKitchen) {
      images.push({
        src: getCorrectImageUrl(item.image || itemDetails.image),
        label: item.name || "Item",
        type: "item",
        status: item.kitchenStatuses?.[selectedKitchen] || "Pending",
      });
    }
    Object.entries(item.addonQuantities || {})
      .filter(([addonName, qty]) => qty > 0)
      .forEach(([addonName]) => {
        const addon = itemDetails.addons.find((a) => a.name1 === addonName) || {};
        const addonImage =
          item.addonImages?.[addonName] ||
          addon.addon_image || "/static/uploads/placeholder.png";
        images.push({
          src: getCorrectImageUrl(addonImage),
          label: addonName || "Addon",
          type: "addon",
          status: item.kitchenStatuses?.[selectedKitchen] || "Pending",
        });
      });
    Object.entries(item.comboQuantities || {})
      .filter(([comboName, qty]) => qty > 0)
      .forEach(([comboName]) => {
        const combo = itemDetails.combos.find((c) => c.name1 === comboName) || {};
        const comboImage =
          item.comboImages?.[comboName] ||
          combo.combo_image || "/static/uploads/placeholder.png";
        images.push({
          src: getCorrectImageUrl(comboImage),
          label: comboName || "Combo",
          type: "combo",
          status: item.kitchenStatuses?.[selectedKitchen] || "Pending",
        });
      });
    return images;
  };

  return (
    <ErrorBoundary>
      <div style={{ marginTop: "24px", padding: "0 15px", position: "relative" }}>
        {loading && (
          <div style={{ textAlign: "center", fontSize: "18px" }}>Loading...</div>
        )}
        {errorMessage && (
          <div
            style={{
              backgroundColor: "#f8d7da",
              color: "#721c24",
              padding: "10px",
              marginBottom: "16px",
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            {errorMessage}
            <button
              style={{
                marginLeft: "10px",
                padding: "4px 8px",
                backgroundColor: "#721c24",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => {
                setErrorMessage("");
                fetchPickedUpItems();
              }}
            >
              Retry
            </button>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <button
            style={{
              padding: "6px 12px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <h3 style={{ textAlign: "center", flex: 1, margin: 0 }}>
            Kitchen Services
          </h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                padding: "6px 12px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => setShowStatusPopup(true)}
            >
              Status (Last 1 Hour)
            </button>
            <button
              style={{
                padding: "6px 12px",
                backgroundColor: "#ffc107",
                color: "black",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => setShowAllStatusPopup(true)}
            >
              All Status
            </button>
          </div>
        </div>
        <div style={{ display: "flex", marginBottom: "16px", gap: "12px" }}>
          {kitchens.length > 0 ? (
            kitchens.map((kitchen) => (
              <button
                key={kitchen}
                style={{
                  padding: "4px 8px",
                  backgroundColor: selectedKitchen === kitchen ? "#007bff" : "transparent",
                  color: selectedKitchen === kitchen ? "white" : "#007bff",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                onClick={() => setSelectedKitchen(kitchen)}
              >
                {kitchen}
              </button>
            ))
          ) : (
            <p style={{ fontSize: "16px" }}>No active kitchens</p>
          )}
        </div>
        <h5 style={{ marginBottom: "16px" }}>
          Current Orders - {selectedKitchen || "Select a Kitchen"}
        </h5>
        {filteredOrders.length === 0 ? (
          <p style={{ fontSize: "16px" }}>
            {selectedKitchen ? "No orders for this kitchen." : "Please select a kitchen."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ marginBottom: "16px", textAlign: "right" }}>
              <button
                style={{
                  padding: "6px 12px",
                  backgroundColor: selectedCustomers.length > 0 ? "#28a745" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: selectedCustomers.length > 0 ? "pointer" : "not-allowed",
                }}
                onClick={handleBulkPickUp}
                disabled={selectedCustomers.length === 0}
              >
                Mark Selected as Picked Up
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Customer</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Order No</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Order Type</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Table</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Item & Addons</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Combos</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Images</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Quantity</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Category</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Status</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) =>
                  order.cartItems.map((item, itemIndex) => (
                    <tr
                      key={`${order.orderId}-${item.id}`}
                      style={getRowStyle(item.kitchenStatuses?.[selectedKitchen])}
                    >
                      {itemIndex === 0 && (
                        <>
                          <td
                            rowSpan={order.cartItems.length}
                            style={{ border: "1px solid #ddd", padding: "8px", verticalAlign: "top" }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCustomers.includes(order.orderId)}
                              onChange={() => handleCustomerCheckboxChange(order.orderId)}
                              style={{ marginRight: "8px" }}
                            />
                            {order.customerName || "Unknown"}
                          </td>
                          <td
                            rowSpan={order.cartItems.length}
                            style={{ border: "1px solid #ddd", padding: "8px", verticalAlign: "top" }}
                          >
                            {order.orderNo || "N/A"}
                          </td>
                          <td
                            rowSpan={order.cartItems.length}
                            style={{ border: "1px solid #ddd", padding: "8px", verticalAlign: "top" }}
                          >
                            {order.orderType || "N/A"}
                          </td>
                          <td
                            rowSpan={order.cartItems.length}
                            style={{ border: "1px solid #ddd", padding: "8px", verticalAlign: "top" }}
                          >
                            {order.orderType === "Dine In" ? order.tableNumber || "N/A" : "-"}
                          </td>
                        </>
                      )}
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {item.kitchen === selectedKitchen && (
                          <div>
                            <strong>{item.name}</strong> {formatItemVariants(item)}{" "}
                            {formatCustomVariants(item.customVariantsDetails)}
                          </div>
                        )}
                        {Object.entries(item.addonQuantities || {}).map(([addonName, qty]) => (
                          qty > 0 && (
                            <div
                              key={addonName}
                              style={{ fontSize: "12px", color: "#555", marginLeft: "10px" }}
                            >
                              + Addon: {addonName} {formatAddonVariants(item.addonVariants[addonName])}{" "}
                              {formatAddonCustomVariants(item.addonCustomVariantsDetails?.[addonName])} x{qty}
                            </div>
                          )
                        ))}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {Object.entries(item.comboQuantities || {}).map(([comboName, qty]) => (
                          qty > 0 && (
                            <div
                              key={comboName}
                              style={{ fontSize: "12px", color: "#555", marginLeft: "10px" }}
                            >
                              + Combo: {comboName} {formatComboVariants(item.comboVariants[comboName])}{" "}
                              {formatComboCustomVariants(item.comboCustomVariantsDetails?.[comboName])} x{qty}
                            </div>
                          )
                        ))}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                          {getAddonComboImages(item).map((image, idx) => (
                            <div key={idx} style={{ position: "relative" }}>
                              <img
                                src={image.src}
                                style={{
                                  width: image.type === "item" ? "70px" : "50px",
                                  height: "50px",
                                  objectFit: "cover",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                }}
                                alt={image.label}
                                onError={(e) => (e.target.src = `${baseUrl}/api/images/placeholder.png`)}
                              />
                              <span
                                style={{
                                  position: "absolute",
                                  top: "-10px",
                                  left: "0",
                                  backgroundColor: "rgba(0,0,0,0.7)",
                                  color: "white",
                                  fontSize: "10px",
                                  padding: "2px 4px",
                                  borderRadius: "2px",
                                }}
                              >
                                {image.type}
                              </span>
                              {image.status === "PickedUp" && (
                                <span
                                  style={{
                                    position: "absolute",
                                    top: "2px",
                                    right: "2px",
                                    backgroundColor: "green",
                                    color: "white",
                                    fontSize: "12px",
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.quantity}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {item.category || "N/A"}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {item.kitchenStatuses?.[selectedKitchen] || "Pending"}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {item.displayInKitchen &&
                          item.kitchenStatuses?.[selectedKitchen] !== "Prepared" &&
                          item.kitchenStatuses?.[selectedKitchen] !== "PickedUp" && (
                            <button
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                              onClick={() => handleMarkPrepared(order.orderId, item.id, selectedKitchen)}
                            >
                              Mark as Prepared
                            </button>
                          )}
                        {item.kitchenStatuses?.[selectedKitchen] === "Prepared" && (
                          <button
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#28a745",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              marginLeft: "8px",
                            }}
                            onClick={() => handlePickUp(order.orderId, item.id)}
                          >
                            Mark as Picked Up
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {showStatusPopup && (
          <div
            style={{
              position: "fixed",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                width: "90%",
                maxWidth: "800px",
                maxHeight: "80%",
                overflowY: "auto",
              }}
            >
              <h3 style={{ marginBottom: "16px" }}>Last Hour Pickup Status</h3>
              <input
                type="month"
                value={lastHourSearchDate}
                onChange={(e) => setLastHourSearchDate(e.target.value)}
                style={{ marginBottom: "16px", padding: "4px" }}
              />
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Order No</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Customer</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Item</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Quantity</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Category</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Kitchen</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Pickup Time</th>
                  </tr>
                </thead>
                <tbody>
                  {getLastHourItems().map((entry, index) =>
                    getFlattenedSubItems(entry).map((subItem, subIndex) => (
                      <tr
                        key={`${index}-${subIndex}`}
                        style={getHighlightStyle(entry.pickupTime, lastHourSearchDate)}
                      >
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {entry.orderNo || "N/A"}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {entry.customerName || "Unknown"}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{subItem.name}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{subItem.quantity}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{subItem.category}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{subItem.kitchen}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {new Date(entry.pickupTime).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <button
                style={{
                  marginTop: "16px",
                  padding: "6px 12px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={() => setShowStatusPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {showAllStatusPopup && (
          <div
            style={{
              position: "fixed",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                width: "90%",
                maxWidth: "800px",
                maxHeight: "80%",
                overflowY: "auto",
              }}
            >
              <h3 style={{ marginBottom: "16px" }}>All Pickup Status</h3>
              <input
                type="month"
                value={allStatusSearchDate}
                onChange={(e) => setAllStatusSearchDate(e.target.value)}
                style={{ marginBottom: "16px", padding: "4px" }}
              />
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Order No</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Customer</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Item</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Quantity</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Category</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Kitchen</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>Pickup Time</th>
                  </tr>
                </thead>
                <tbody>
                  {getAllPickedUpItems().map((entry, index) =>
                    getFlattenedSubItems(entry).map((subItem, subIndex) => (
                      <tr
                        key={`${index}-${subIndex}`}
                        style={getHighlightStyle(entry.pickupTime, allStatusSearchDate)}
                      >
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {entry.orderNo || "N/A"}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {entry.customerName || "Unknown"}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{subItem.name}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{subItem.quantity}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{subItem.category}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{subItem.kitchen}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {new Date(entry.pickupTime).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <button
                style={{
                  marginTop: "16px",
                  padding: "6px 12px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={() => setShowAllStatusPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default Kitchen;