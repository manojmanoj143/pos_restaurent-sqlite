import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./table.css";
import UserContext from "../../Context/UserContext";
import { v4 as uuidv4 } from "uuid";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center mt-5 text-danger">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message || "Unknown error occurred."}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Table() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const { setCartItems } = useContext(UserContext);
  const navigate = useNavigate();
  const vatRate = 0.10; // Consistent with FrontPage.jsx
  const [bookedTables, setBookedTables] = useState(() => {
    const saved = localStorage.getItem("bookedTables");
    return saved ? JSON.parse(saved) : [];
  });
  const [bookedChairs, setBookedChairs] = useState(() => {
    const saved = localStorage.getItem("bookedChairs");
    return saved ? JSON.parse(saved) : {};
  });
  const [reservations, setReservations] = useState(() => {
    const saved = localStorage.getItem("reservations");
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      const validReservations = parsed.filter((res) => {
        const isValid =
          res &&
          res.tableNumber &&
          res.customerName &&
          res.phoneNumber &&
          res.email &&
          res.date &&
          res.startTime &&
          res.endTime &&
          Array.isArray(res.chairs) &&
          typeof res.startTime === "string" &&
          typeof res.endTime === "string" &&
          res.startTime.match(/^\d{2}:\d{2}$/) &&
          res.endTime.match(/^\d{2}:\d{2}$/);
        if (!isValid) {
          console.warn("Invalid reservation filtered out:", res);
        }
        return isValid;
      });
      return validReservations;
    } catch (e) {
      console.error("Error parsing reservations from localStorage:", e);
      return [];
    }
  });
  const [verifiedReservations, setVerifiedReservations] = useState(() => {
    const saved = localStorage.getItem("verifiedReservations");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedChairs, setSelectedChairs] = useState({});
  const [uniqueFloors, setUniqueFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState("");
  // Verification states
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [verifyPhoneNumber, setVerifyPhoneNumber] = useState("");
  const [bookedGroups, setBookedGroups] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [scale, setScale] = useState(1);
  const floorPlanRef = useRef(null);
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const orderTableNumbers = [
      ...new Set(savedOrders.map((order) => order.tableNumber).filter(Boolean)),
    ];
    const currentBookedTables =
      JSON.parse(localStorage.getItem("bookedTables")) || [];
    const updatedBookedTables = currentBookedTables.filter((tableNum) =>
      orderTableNumbers.includes(tableNum)
    );
    setBookedTables(updatedBookedTables);
    localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));
    const updatedBookedChairs = {};
    savedOrders.forEach((order) => {
      const tableNum = order.tableNumber;
      const chairs = Array.isArray(order.chairsBooked) ? order.chairsBooked : [];
      if (tableNum) {
        if (!updatedBookedChairs[tableNum]) {
          updatedBookedChairs[tableNum] = [];
        }
        updatedBookedChairs[tableNum] = [
          ...new Set([...(updatedBookedChairs[tableNum] || []), ...chairs]),
        ];
      }
    });
    setBookedChairs(updatedBookedChairs);
    localStorage.setItem("bookedChairs", JSON.stringify(updatedBookedChairs));
    setBookedGroups(savedOrders.filter(order => order.cartItems && order.cartItems.length > 0));
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const fetchTables = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/tables", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const sortedTables = (data.message || []).sort(
          (a, b) => parseInt(a.table_number) - parseInt(b.table_number)
        );
        setTables(sortedTables);
        const floors = [...new Set(sortedTables.map(t => t.floor).filter(Boolean))].sort();
        setUniqueFloors(floors);
        if (floors.length > 0) {
          setSelectedFloor(floors[0]);
        }
        setLoading(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    fetchTables();
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const activeReservations = reservations.filter((res) => {
        if (!res.startTime || !res.endTime) {
          console.warn("Skipping invalid reservation in cleanup:", res);
          return false;
        }
        const [startHour, startMinute] = res.startTime.split(":").map(Number);
        const [endHour, endMinute] = res.endTime.split(":").map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        return res.date > currentDate || (res.date === currentDate && currentTime <= endTime);
      });
      const activeVerifiedReservations = verifiedReservations.filter((vr) => {
        const res = activeReservations.find((r) => r.id === vr.reservationId);
        return !!res;
      });
      setReservations(activeReservations);
      setVerifiedReservations(activeVerifiedReservations);
      localStorage.setItem("reservations", JSON.stringify(activeReservations));
      localStorage.setItem("verifiedReservations", JSON.stringify(activeVerifiedReservations));
    }, 60000);
    return () => clearInterval(interval);
  }, [reservations, verifiedReservations]);
  useEffect(() => {
    const filteredGroups = bookedGroups.filter(order => {
      const table = tables.find(t => String(t.table_number) === String(order.tableNumber));
      return table && table.floor === selectedFloor;
    });
    const total = filteredGroups.reduce((sum, order) => {
      const subtotal = calculateOrderSubtotal(order.cartItems);
      return sum + subtotal;
    }, 0);
    const vat = total * vatRate;
    const grandValue = total + vat;
    setGrandTotal(grandValue);
  }, [selectedFloor, tables, bookedGroups]);
  useEffect(() => {
    const updateScale = () => {
      if (floorPlanRef.current && tables.length > 0) {
        const filteredTables = tables.filter(table => table.floor === selectedFloor);
        if (filteredTables.length === 0) return;
        let maxX = 0, maxY = 0;
        filteredTables.forEach(table => {
          maxX = Math.max(maxX, (table.x || 0) + 240);
          maxY = Math.max(maxY, (table.y || 0) + 280);
        });
        const containerWidth = floorPlanRef.current.clientWidth;
        const containerHeight = floorPlanRef.current.clientHeight;
        const sX = containerWidth / maxX;
        const sY = containerHeight / maxY;
        setScale(Math.min(sX, sY, 1));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [selectedFloor, tables]);
  const getActiveReservations = (tableNumber, date) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    return reservations.filter((res) => {
      if (!res.startTime || !res.endTime) {
        console.warn("Invalid reservation data in getActiveReservations:", res);
        return false;
      }
      try {
        const [startHour, startMinute] = res.startTime.split(":").map(Number);
        const [endHour, endMinute] = res.endTime.split(":").map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        const preReservationTime = startTime - 60;
        return (
          String(res.tableNumber) === String(tableNumber) &&
          res.date === date &&
          (date > now.toISOString().split("T")[0] ||
            (date === now.toISOString().split("T")[0] &&
              currentTime >= preReservationTime &&
              currentTime <= endTime))
        );
      } catch (e) {
        console.warn("Error processing reservation:", res, e);
        return false;
      }
    });
  };
  const getReservedChairNumbers = (tableNumber, date) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    let reservedChairs = [];
    reservations.forEach((res) => {
      if (!res.startTime || !res.endTime) {
        console.warn("Skipping invalid reservation in getReservedChairNumbers:", res);
        return;
      }
      try {
        const [startHour, startMinute] = res.startTime.split(":").map(Number);
        const [endHour, endMinute] = res.endTime.split(":").map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        const preReservationTime = startTime - 60;
        if (
          String(res.tableNumber) === String(tableNumber) &&
          res.date === date &&
          (date > now.toISOString().split("T")[0] ||
            (date === now.toISOString().split("T")[0] &&
              currentTime >= preReservationTime &&
              currentTime <= endTime))
        ) {
          reservedChairs.push(...(Array.isArray(res.chairs) ? res.chairs : []));
        }
      } catch (e) {
        console.warn("Error processing reservation:", res, e);
      }
    });
    return reservedChairs;
  };
  const getAvailableChairNumbers = (tableNumber, totalChairs, date) => {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const bookedChairsNumbers = Array.isArray(bookedChairs[tableNumber]) ? bookedChairs[tableNumber] : [];
    const reservedChairNumbers = getReservedChairNumbers(tableNumber, date);
    const occupiedChairs = [...new Set([...bookedChairsNumbers, ...reservedChairNumbers])];
    const availableChairs = [];
    for (let i = 1; i <= totalChairs; i++) {
      if (!occupiedChairs.includes(i)) {
        availableChairs.push(i);
      }
    }
    return availableChairs;
  };
  const getChairStatus = (table, chairNumber, date) => {
    const tableNumber = parseInt(table.table_number);
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const booked = date === currentDate && Array.isArray(bookedChairs[tableNumber]) && bookedChairs[tableNumber].includes(chairNumber);
    const reserved = getReservedChairNumbers(tableNumber, date).includes(chairNumber);
    const available = getAvailableChairNumbers(tableNumber, table.number_of_chairs, date).includes(chairNumber);
    if (booked) return "booked";
    if (reserved) return "reserved";
    if (available) return "available";
    return "unknown";
  };
  const handleChairClick = (tableNumber, chairNumber, status) => {
    if (status === "reserved") {
      const reservation = reservations.find(
        (res) =>
          String(res.tableNumber) === String(tableNumber) &&
          Array.isArray(res.chairs) &&
          res.chairs.includes(chairNumber) &&
          res.date === new Date().toISOString().split("T")[0]
      );
      if (reservation) handleReservedChairClick(reservation);
    } else if (status === "booked") {
      const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
      const order = savedOrders.find(
        (order) =>
          String(order.tableNumber) === String(tableNumber) &&
          Array.isArray(order.chairsBooked) &&
          order.chairsBooked.includes(chairNumber)
      );
      if (order) handleViewOrder(tableNumber, order.chairsBooked);
    } else if (status === "available") {
      setSelectedChairs((prev) => {
        const updated = { ...prev };
        if (!updated[tableNumber]) {
          updated[tableNumber] = [];
        }
        if (updated[tableNumber].includes(chairNumber)) {
          updated[tableNumber] = updated[tableNumber].filter((c) => c !== chairNumber);
          if (updated[tableNumber].length === 0) {
            delete updated[tableNumber];
          }
        } else {
          updated[tableNumber] = [...new Set([...updated[tableNumber], chairNumber])];
        }
        return updated;
      });
    }
  };
  const calculateOrderSubtotal = (items) => {
    if (!Array.isArray(items)) {
      console.warn("Invalid cartItems in calculateOrderSubtotal:", items);
      return 0;
    }
    return items.reduce((sum, item) => {
      const mainItemPrice = (Number(item.basePrice) || 0) + (Number(item.icePrice) || 0) + (Number(item.spicyPrice) || 0);
      const customVariantsTotal = item.customVariantsDetails
        ? Object.entries(item.customVariantsDetails).reduce((sum, [variantName, variant]) => {
            const qty = item.customVariantsQuantities?.[variantName] || 1;
            return sum + (Number(variant.price) || 0) * qty;
          }, 0)
        : 0;
      const mainItemTotal = (mainItemPrice + customVariantsTotal) * (Number(item.quantity) || 1);
      const addonsTotal = item.addonQuantities
        ? Object.entries(item.addonQuantities).reduce((sum, [addonName, qty]) => {
            const price = Number(item.addonPrices?.[addonName]) || 0;
            return sum + price * qty;
          }, 0)
        : 0;
      const combosTotal = item.comboQuantities
        ? Object.entries(item.comboQuantities).reduce((sum, [comboName, qty]) => {
            const price = Number(item.comboPrices?.[comboName]) || 0;
            return sum + price * qty;
          }, 0)
        : 0;
      return sum + mainItemTotal + addonsTotal + combosTotal;
    }, 0);
  };
  const calculateOrderGrandTotal = (items) => {
    const subtotal = calculateOrderSubtotal(items);
    const vat = subtotal * vatRate;
    return subtotal + vat;
  };
  const handleViewOrder = (tableNumber, chairsBooked) => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const existingOrder = savedOrders.find(
      (order) =>
        String(order.tableNumber) === String(tableNumber) &&
        Array.isArray(order.chairsBooked) &&
        order.chairsBooked.some((chair) => chairsBooked.includes(chair))
    );
    if (!existingOrder) {
      setWarningMessage("No existing order found for this table and chairs.");
      return;
    }
    const formattedCartItems = existingOrder.cartItems.map((item) => ({
      ...item,
      id: item.id || uuidv4(),
      item_name: item.item_name || item.name,
      name: item.name || item.item_name,
      quantity: Number(item.quantity) || 1,
      basePrice: Number(item.basePrice) || (Number(item.totalPrice) / (Number(item.quantity) || 1)) || 0,
      totalPrice: Number(item.totalPrice) || (Number(item.basePrice) * (Number(item.quantity) || 1)) || 0,
      selectedSize: item.selectedSize || "M",
      icePreference: item.icePreference || "without_ice",
      icePrice: Number(item.icePrice) || 0,
      isSpicy: item.isSpicy || false,
      spicyPrice: Number(item.spicyPrice) || 0,
      kitchen: item.kitchen || "Main Kitchen",
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
      ingredients: item.ingredients || [],
      selectedCustomVariants: item.selectedCustomVariants || {},
      customVariantsDetails: item.customVariantsDetails || {},
      customVariantsQuantities: item.customVariantsQuantities || {},
      image: item.image || "/static/images/default-item.jpg",
    }));
    setCartItems(formattedCartItems);
    navigate(`/frontpage`, {
      state: {
        tableNumber: existingOrder.tableNumber,
        chairsBooked: existingOrder.chairsBooked,
        existingOrder: {
          ...existingOrder,
          cartItems: formattedCartItems,
          orderId: existingOrder.orderId || uuidv4(),
        },
        orderType: "Dine In",
        cartItems: formattedCartItems,
        phoneNumber: existingOrder.phoneNumber || "",
        customerName: existingOrder.customerName || "",
        deliveryAddress: existingOrder.deliveryAddress || { building_name: "", flat_villa_no: "", location: "" },
        whatsappNumber: existingOrder.whatsappNumber || "",
        email: existingOrder.email || "",
      },
    });
  };
  const handleBookTable = (tableNumber, chairsBooked) => {
    const updatedBookedChairs = { ...bookedChairs };
    if (!updatedBookedChairs[tableNumber]) {
      updatedBookedChairs[tableNumber] = [];
    }
    updatedBookedChairs[tableNumber] = [
      ...new Set([...updatedBookedChairs[tableNumber], ...chairsBooked]),
    ];
    setBookedChairs(updatedBookedChairs);
    localStorage.setItem("bookedChairs", JSON.stringify(updatedBookedChairs));
    const updatedBookedTables = [...new Set([...bookedTables, tableNumber])];
    setBookedTables(updatedBookedTables);
    localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const newOrder = {
      tableNumber,
      chairsBooked: Array.isArray(chairsBooked) ? chairsBooked : [],
      cartItems: [],
      timestamp: new Date().toISOString(),
      orderType: "Dine In",
      customerName: "",
      phoneNumber: "",
      email: "",
      whatsappNumber: "",
      deliveryAddress: { building_name: "", flat_villa_no: "", location: "" },
      orderId: uuidv4(),
    };
    savedOrders.push(newOrder);
    localStorage.setItem("savedOrders", JSON.stringify(savedOrders));
    setBookedGroups([...bookedGroups, newOrder]);
    setCartItems([]);
    setSelectedChairs({});
    navigate(`/frontpage`, {
      state: {
        tableNumber,
        chairsBooked,
        orderType: "Dine In",
        cartItems: [],
      },
    });
  };
  const handleReservedChairClick = (reservation) => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const reservationOrders = savedOrders.filter(
      (order) =>
        String(order.tableNumber) === String(reservation.tableNumber) &&
        Array.isArray(order.chairsBooked) &&
        order.chairsBooked.some((chair) => reservation.chairs.includes(chair))
    );
    if (reservationOrders.length > 0) {
      handleViewOrder(reservation.tableNumber, reservationOrders[0].chairsBooked);
    } else {
      const isVerified = verifiedReservations.some(
        (vr) => vr.reservationId === reservation.id
      );
      if (isVerified) {
        setCartItems([]);
        navigate(`/frontpage`, {
          state: {
            tableNumber: reservation.tableNumber,
            chairsBooked: Array.isArray(reservation.chairs) ? reservation.chairs : [],
            orderType: "Dine In",
            cartItems: [],
            customerName: reservation.customerName,
            phoneNumber: reservation.phoneNumber,
            email: reservation.email,
          },
        });
      } else {
        setSelectedReservation(reservation);
        setShowVerifyPopup(true);
        setSelectedCustomer("");
        setVerifyPhoneNumber("");
      }
    }
  };
  const handleVerifyCustomer = () => {
    if (!selectedReservation) return;
    if (
      selectedCustomer.trim() === selectedReservation.customerName &&
      verifyPhoneNumber === selectedReservation.phoneNumber
    ) {
      const updatedVerifiedReservations = [
        ...verifiedReservations,
        { reservationId: selectedReservation.id },
      ];
      setVerifiedReservations(updatedVerifiedReservations);
      localStorage.setItem(
        "verifiedReservations",
        JSON.stringify(updatedVerifiedReservations)
      );
      setShowVerifyPopup(false);
      setSelectedReservation(null);
      setCartItems([]);
      navigate(`/frontpage`, {
        state: {
          tableNumber: selectedReservation.tableNumber,
          chairsBooked: Array.isArray(selectedReservation.chairs) ? selectedReservation.chairs : [],
          orderType: "Dine In",
          cartItems: [],
          customerName: selectedReservation.customerName,
          phoneNumber: selectedReservation.phoneNumber,
          email: selectedReservation.email,
        },
      });
    } else {
      setWarningMessage("Verification failed. Please check the customer name and phone number.");
    }
  };
  const handleGoToOrder = () => {
    const tableNumbers = Object.keys(selectedChairs);
    if (tableNumbers.length !== 1) {
      setWarningMessage("Please select chairs from exactly one table.");
      return;
    }
    const tableNumber = tableNumbers[0];
    const chairsBooked = selectedChairs[tableNumber];
    handleBookTable(tableNumber, chairsBooked);
  };
  // Assume this function is called after payment success from another component or event
  const handlePaymentSuccess = (tableNumber, chairsPaid) => {
    // Remove the paid chairs from bookedChairs
    const updatedBookedChairs = { ...bookedChairs };
    if (updatedBookedChairs[tableNumber]) {
      updatedBookedChairs[tableNumber] = updatedBookedChairs[tableNumber].filter(
        (chair) => !chairsPaid.includes(chair)
      );
      if (updatedBookedChairs[tableNumber].length === 0) {
        delete updatedBookedChairs[tableNumber];
      }
    }
    setBookedChairs(updatedBookedChairs);
    localStorage.setItem("bookedChairs", JSON.stringify(updatedBookedChairs));
    // Remove from bookedTables if no chairs left
    if (!updatedBookedChairs[tableNumber]) {
      const updatedBookedTables = bookedTables.filter((t) => t !== tableNumber);
      setBookedTables(updatedBookedTables);
      localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));
    }
    // Remove the order from savedOrders
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const updatedSavedOrders = savedOrders.filter(
      (order) =>
        order.tableNumber !== tableNumber ||
        !order.chairsBooked.every((chair) => chairsPaid.includes(chair))
    );
    localStorage.setItem("savedOrders", JSON.stringify(updatedSavedOrders));
    setBookedGroups(updatedSavedOrders.filter(order => order.cartItems && order.cartItems.length > 0));
  };
  const totalSelectedChairs = Object.values(selectedChairs).reduce(
    (sum, chairs) => sum + (Array.isArray(chairs) ? chairs.length : 0),
    0
  );
  const styles = {
    container: {
      minHeight: "100vh",
      height: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "stretch",
      padding: 0,
      margin: 0,
      overflow: "hidden",
    },
    leftSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "300px",
      padding: "20px",
      boxSizing: "border-box",
      overflowY: "auto", // Changed to "auto" to allow scrolling if needed
    },
    backButton: {
      position: "absolute",
      left: "25px",
      top: "25px",
      fontSize: "1.8rem",
      cursor: "pointer",
      color: "#2c3e50",
      transition: "color 0.3s ease",
      zIndex: 10,
    },
    backButtonHover: {
      color: "#3498db",
    },
    heading: {
      marginBottom: "30px",
      fontSize: "2.5rem",
      color: "#2c3e50",
      textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
    },
    floorButtons: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      marginBottom: "20px",
    },
    floorButton: {
      padding: "10px",
      backgroundColor: "#3498db",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "1rem",
      transition: "background-color 0.3s ease",
    },
    floorButtonSelected: {
      backgroundColor: "#2980b9",
    },
    legend: {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
    bookedTablesSection: {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      marginTop: "20px",
      width: "100%",
    },
    reservedTablesSection: {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      marginTop: "20px",
      width: "100%",
    },
    grandTotal: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      marginTop: "20px",
      color: "#2c3e50",
      textAlign: "center",
    },
    floorPlan: {
      flex: 1,
      height: "100%",
      backgroundColor: "#ffffff",
      borderLeft: "2px solid #ccc",
      position: "relative",
      overflow: "auto", // Changed from "hidden" to "auto" to allow scrolling on small screens
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
  };
  // Default chair positions based on table type (copied from AddTablePage for fallback)
  const getDefaultChairPositions = (type, numChairs, centerX = 120, centerY = 140, radius = 80, chairSize = 24) => {
    const positions = [];
    if (type === "Round" || type === "Oval") {
      let rx = radius;
      let ry = radius;
      if (type === "Oval") {
        rx = radius * 1.2;
        ry = radius * 0.8;
      }
      for (let i = 0; i < numChairs; i++) {
        const angleDeg = (360 * i) / numChairs;
        const angleRad = (angleDeg * Math.PI) / 180;
        const chairX = centerX + rx * Math.cos(angleRad);
        const chairY = centerY + ry * Math.sin(angleRad);
        positions.push({ x: chairX, y: chairY });
      }
    } else if (type === "Square" || type === "Rectangle" || type === "Long") {
      let w = type === "Square" ? 80 : type === "Rectangle" ? 120 : 160;
      let h = type === "Square" ? 80 : type === "Rectangle" ? 60 : 40;
      const perimeter = 2 * (w + h);
      const spacing = perimeter / numChairs;
      let currentPos = 0;
      for (let i = 0; i < numChairs; i++) {
        let x, y;
        if (currentPos < w) {
          // Top side
          x = centerX - w / 2 + currentPos;
          y = centerY - h / 2 - chairSize / 2 - 10;
        } else if (currentPos < w + h) {
          // Right side
          x = centerX + w / 2 + chairSize / 2 + 10;
          y = centerY - h / 2 + (currentPos - w);
        } else if (currentPos < 2 * w + h) {
          // Bottom side
          x = centerX + w / 2 - (currentPos - w - h);
          y = centerY + h / 2 + chairSize / 2 + 10;
        } else {
          // Left side
          x = centerX - w / 2 - chairSize / 2 - 10;
          y = centerY + h / 2 - (currentPos - 2 * w - h);
        }
        positions.push({ x, y });
        currentPos += spacing;
      }
    } else if (type === "Bar") {
      const barWidth = 160;
      const spacing = barWidth / (numChairs + 1);
      for (let i = 1; i <= numChairs; i++) {
        const x = centerX - barWidth / 2 + i * spacing;
        const y = centerY + 20 / 2 + chairSize / 2 + 10; // Below the bar (tableHeight=20)
        positions.push({ x, y });
      }
    }
    return positions;
  };
  const TableItem = ({ table, onChairClick }) => {
    const currentDate = new Date().toISOString().split("T")[0];
    const centerX = 120;
    const centerY = 140;
    const radius = 80;
    const chairSize = 24;
    // Determine table dimensions and style based on type
    let tableWidth = 80;
    let tableHeight = 80;
    let tableBorderRadius = "50%";
    switch (table.type) {
      case "Round":
        tableBorderRadius = "50%";
        break;
      case "Square":
        tableBorderRadius = "0";
        break;
      case "Rectangle":
        tableWidth = 120;
        tableHeight = 60;
        tableBorderRadius = "0";
        break;
      case "Long":
        tableWidth = 160;
        tableHeight = 40;
        tableBorderRadius = "5px";
        break;
      case "Oval":
        tableWidth = 120;
        tableHeight = 60;
        tableBorderRadius = "50%";
        break;
      case "Bar":
        tableWidth = 160;
        tableHeight = 20;
        tableBorderRadius = "0";
        break;
      default:
        break;
    }
    // Use stored chair positions or fallback to default
    const chairPositions = table.chairs || getDefaultChairPositions(
      table.type || "Round",
      table.number_of_chairs,
      centerX,
      centerY,
      radius,
      chairSize
    );
    return (
      <div
        style={{
          position: "absolute",
          left: `${table.x || 0}px`,
          top: `${table.y || 0}px`,
          width: "240px",
          height: "280px",
          background: "transparent",
          userSelect: "none",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div
            style={{
              position: "absolute",
              left: centerX,
              top: centerY,
              transform: "translate(-50%, -50%)",
              width: tableWidth,
              height: tableHeight,
              borderRadius: tableBorderRadius,
              backgroundColor: "#8B4513",
            }}
          />
          {chairPositions.map((chairPos, i) => {
            const chairNumber = i + 1;
            const status = getChairStatus(table, chairNumber, currentDate);
            const isSelected = selectedChairs[table.table_number]?.includes(chairNumber) || false;
            return (
              <img
                key={i}
                src="/menuIcons/chair.svg"
                alt="Chair"
                className={`chair ${status} ${isSelected ? "selected" : ""}`}
                style={{
                  position: "absolute",
                  left: `${chairPos.x}px`,
                  top: `${chairPos.y}px`,
                  transform: "translate(-50%, -50%)",
                  width: 24,
                  height: 24,
                }}
                onClick={() => onChairClick(table.table_number, chairNumber, status)}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 0,
              width: "100%",
              textAlign: "center",
              fontSize: "1.2rem",
              color: "#2c3e50",
            }}
          >
            Table {table.table_number}
          </div>
        </div>
      </div>
    );
  };
  if (loading) return <div className="text-center mt-5">Loading tables...</div>;
  if (error)
    return <div className="text-center mt-5 text-danger">Error: {error}</div>;
  const filteredGroups = bookedGroups.filter(order => {
    const table = tables.find(t => String(t.table_number) === String(order.tableNumber));
    return table && table.floor === selectedFloor;
  });
  const currentDate = new Date().toISOString().split("T")[0];
  const filteredReservations = reservations.filter(res => {
    const table = tables.find(t => String(t.table_number) === String(res.tableNumber));
    if (!res.startTime || !res.endTime || !table || table.floor !== selectedFloor || res.date !== currentDate) return false;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMinute] = res.startTime.split(":").map(Number);
    const [endHour, endMinute] = res.endTime.split(":").map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    const preReservationTime = startTime - 60;
    return currentTime >= preReservationTime && currentTime <= endTime;
  });
  const filteredTables = tables.filter((table) => table.floor === selectedFloor);
  return (
    <ErrorBoundary>
      <div className="main-container" style={styles.container}>
        <i
          className="fas fa-arrow-left back-arrow"
          style={styles.backButton}
          onClick={() => navigate(-1)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === "Enter" && navigate(-1)}
          onMouseOver={(e) => (e.target.style.color = styles.backButtonHover.color)}
          onMouseOut={(e) => (e.target.style.color = styles.backButton.color)}
        ></i>
        {totalSelectedChairs > 0 && (
          <button
            style={{
              position: "absolute",
              right: "25px",
              top: "25px",
              zIndex: 10,
            }}
            className="btn btn-primary go-to-order-btn"
            onClick={handleGoToOrder}
          >
            Go to Order ({totalSelectedChairs} Chair{totalSelectedChairs > 1 ? "s" : ""})
          </button>
        )}
        <div className="left-section" style={styles.leftSection}>
          <h1 style={styles.heading}>Floor Plans</h1>
          <div style={styles.floorButtons}>
            {uniqueFloors.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFloor(f)}
                style={{
                  ...styles.floorButton,
                  ...(selectedFloor === f ? styles.floorButtonSelected : {}),
                }}
              >
                Floor {f}
              </button>
            ))}
          </div>
          <div style={styles.legend}>
            <h6 className="fw-bold mb-2">Chair Status</h6>
            <div className="d-flex align-items-center mb-1">
              <div className="color-box booked me-2"></div>
              <span className="small">Booked</span>
            </div>
            <div className="d-flex align-items-center mb-1">
              <div className="color-box reserved me-2"></div>
              <span className="small">Reserved</span>
            </div>
            <div className="d-flex align-items-center mb-1">
              <div className="color-box available me-2"></div>
              <span className="small">Available</span>
            </div>
            <div className="d-flex align-items-center">
              <div className="color-box selected me-2"></div>
              <span className="small">Selected</span>
            </div>
          </div>
          <div style={styles.bookedTablesSection}>
            <h6 className="fw-bold mb-2">Booked Tables</h6>
            {filteredGroups.sort((a, b) => a.tableNumber - b.tableNumber).map((order, index) => (
              <div key={index} className="mb-1">
                Table {order.tableNumber}: Chairs {order.chairsBooked?.sort((a, b) => a - b).join(', ') || 'None'} Grand Total: ₹{calculateOrderGrandTotal(order.cartItems).toFixed(2)}
              </div>
            ))}
            {filteredGroups.length === 0 && <div>No booked tables</div>}
          </div>
          <div style={styles.reservedTablesSection}>
            <h6 className="fw-bold mb-2">Reserved Tables (Today)</h6>
            {filteredReservations.sort((a, b) => a.tableNumber - b.tableNumber).map((res, index) => (
              <div key={index} className="mb-1">
                Table {res.tableNumber}: Chairs {res.chairs.sort((a, b) => a - b).join(', ')} from {res.startTime} to {res.endTime} - {res.customerName}
              </div>
            ))}
            {filteredReservations.length === 0 && <div>No reserved tables for today</div>}
          </div>
          <div style={styles.grandTotal}>Grand Total: ₹{grandTotal.toFixed(2)}</div>
        </div>
        <div className="floor-plan" style={styles.floorPlan} ref={floorPlanRef}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
            {filteredTables.map((table) => (
              <TableItem
                key={table.table_number}
                table={table}
                onChairClick={handleChairClick}
              />
            ))}
          </div>
        </div>
        {warningMessage && (
          <div className="alert alert-warning alert-dismissible fade show mx-3 mt-3" role="alert">
            {warningMessage}
            <button
              type="button"
              className="btn-close"
              onClick={() => setWarningMessage("")}
              aria-label="Close"
            ></button>
          </div>
        )}
        {showVerifyPopup && selectedReservation && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Verify Customer for Table {selectedReservation.tableNumber}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowVerifyPopup(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="customerName" className="form-label fw-bold">
                      Customer Name:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="customerName"
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label fw-bold">
                      Phone Number:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="phoneNumber"
                      value={verifyPhoneNumber}
                      onChange={(e) => setVerifyPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowVerifyPopup(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleVerifyCustomer}
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
export default Table;