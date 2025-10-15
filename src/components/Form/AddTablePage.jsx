// AddTablePage.jsx (full corrected code)
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function AddTablePage() {
  const [tableNumber, setTableNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [numberOfChairs, setNumberOfChairs] = useState("");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [tables, setTables] = useState([]);
  const [uniqueFloors, setUniqueFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Clear selection when floor changes
  useEffect(() => {
    setSelectedTableNumber(null);
  }, [selectedFloor]);

  // Format floor for display
  const formatFloor = (f) => {
    if (f.toLowerCase() === "ground floor") return "Ground Floor";
    return `Floor ${f}`;
  };

  // Default chair positions based on table type
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

  // Fetch tables from backend
  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        let fetchedTables = data.message || [];
        // Handle tables without floor by assigning "Ground Floor" and default type to "Round"
        fetchedTables = fetchedTables.map(t => ({
          ...t,
          floor: t.floor ? t.floor.trim() : "Ground Floor",
          type: t.type ? t.type : "Round"
        }));
        // Initialize chairs if missing
        for (const t of fetchedTables) {
          if (!t.chairs || t.chairs.length !== t.number_of_chairs) {
            t.chairs = getDefaultChairPositions(t.type, t.number_of_chairs);
            updateTableChairs(t.floor, t.table_number, t.chairs).catch(err => console.error("Failed to init chairs:", err));
          }
        }
        setTables(fetchedTables);
        const floors = [...new Set(fetchedTables.map(t => t.floor))].sort();
        setUniqueFloors(floors);
        if (floors.length > 0 && !selectedFloor) {
          setSelectedFloor(floors[0]);
        } else if (selectedFloor && !floors.includes(selectedFloor)) {
          setSelectedFloor(floors.length > 0 ? floors[0] : "");
        }
      } else {
        throw new Error(data.error || "Failed to fetch tables");
      }
    } catch (err) {
      console.error("Error fetching tables:", err);
      setMessage(err.message);
      setMessageType('error');
    }
  };

  // Run fetchTables on component mount
  useEffect(() => {
    fetchTables();
  }, []);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Reset form fields when modal opens
  const openModal = () => {
    setTableNumber("");
    setFloor("");
    setNumberOfChairs("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);
    const inputFloor = floor.trim();
    const trimmedTableNumber = tableNumber.trim();
    const trimmedChairs = numberOfChairs.trim();
    if (!trimmedTableNumber || !inputFloor || !trimmedChairs) {
      setMessage("Please fill in Table Number, Floor, and Number of Chairs.");
      setMessageType('error');
      return;
    }
    let normalizedFloor = inputFloor;
    if (inputFloor.toLowerCase() === "ground" || inputFloor.toLowerCase() === "ground floor" || inputFloor === "0") {
      normalizedFloor = "Ground Floor";
    }
    const tableData = {
      table_number: trimmedTableNumber,
      floor: normalizedFloor,
      number_of_chairs: parseInt(trimmedChairs),
      type: "Round", // Default type
      x: 0,
      y: 0,
    };
    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(tableData),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${text}`);
      }
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }
      setMessage(data.message);
      setMessageType('success');
      setSelectedFloor(normalizedFloor); // Switch to the floor of the newly added table
      setTableNumber("");
      setFloor("");
      setNumberOfChairs("");
      setShowModal(false);
      fetchTables(); // Refresh table list
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
      console.error("Error adding table:", err);
    }
  };

  // Delete table function - now includes floor
  const handleDelete = async (tableNumber, floor) => {
    try {
      const response = await fetch(`/api/tables/${tableNumber}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ floor }),  // Include floor in body for floor-specific delete
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${text}`);
      }
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }
      setMessage(data.message);
      setMessageType('success');
      fetchTables(); // Refresh table list after deletion
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
      console.error("Error deleting table:", err);
    }
  };

  // Update table position - now includes floor
  const updateTablePosition = async (tableNumber, floor, x, y) => {
    try {
      const response = await fetch(`/api/tables/${tableNumber}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ floor, x: Math.round(x), y: Math.round(y) }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update position");
      }
      // Optionally setMessage(data.message, 'success');
      // Local update after successful backend update
      setTables(prevTables => prevTables.map(t => 
        t.table_number === tableNumber && t.floor === floor ? { ...t, x: Math.round(x), y: Math.round(y) } : t
      ));
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
      console.error("Error updating position:", err);
    }
  };

  // Update table chairs - now includes floor
  const updateTableChairs = async (floor, tableNumber, chairs) => {
    try {
      const response = await fetch(`/api/tables/${tableNumber}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ floor, chairs }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update chairs");
      }
      // Optionally setMessage(data.message, 'success');
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
      console.error("Error updating chairs:", err);
    }
  };

  // Update table type - now includes floor
  const updateTableType = async (tableNumber, floor, newType, currentX, currentY) => {
    try {
      const selectedTable = tables.find((t) => t.table_number === tableNumber && t.floor === floor);
      if (!selectedTable) throw new Error("Table not found");
      const newChairs = getDefaultChairPositions(newType, selectedTable.number_of_chairs);
      const tableData = {
        floor,
        number_of_chairs: selectedTable.number_of_chairs,
        type: newType,
        x: Math.round(currentX),
        y: Math.round(currentY),
        chairs: newChairs,
      };
      const response = await fetch(`/api/tables/${tableNumber}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(tableData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update type");
      }
      setMessage(data.message);
      setMessageType('success');
      // Do not fetchTables here to keep the local change
      // Local update
      setTables(prevTables => prevTables.map(t => 
        t.table_number === tableNumber && t.floor === floor ? { ...t, type: newType, chairs: newChairs } : t
      ));
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
      // Revert local update on error
      fetchTables();
      console.error("Error updating type:", err);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      height: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "stretch",
      padding: 0,
      margin: 0,
      overflow: "hidden",
    },
    messageBar: {
      width: "100%",
      padding: "10px",
      textAlign: "center",
    },
    content: {
      display: "flex",
      flexDirection: "row",
      flex: 1,
      overflow: "hidden",
    },
    leftSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "450px",
      padding: "30px",
      boxSizing: "border-box",
      overflowY: "auto",
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
    addButton: {
      padding: "12px 24px",
      backgroundColor: "#2ecc71",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "1.1rem",
      fontWeight: "600",
      transition: "background-color 0.3s ease",
      marginBottom: "20px",
    },
    addButtonHover: {
      backgroundColor: "#27ae60",
    },
    deleteButton: {
      padding: "6px 12px",
      backgroundColor: "#e74c3c",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.95rem",
      transition: "background-color 0.3s ease",
    },
    deleteButtonHover: {
      backgroundColor: "#c0392b",
    },
    error: {
      color: "#e74c3c",
      backgroundColor: "#fceaea",
      padding: "10px",
      borderRadius: "5px",
      textAlign: "center",
    },
    success: {
      color: "#27ae60",
      backgroundColor: "#eafaf1",
      padding: "10px",
      borderRadius: "5px",
      textAlign: "center",
    },
    tableContainer: {
      marginTop: "20px",
      maxWidth: "700px",
      width: "100%",
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      border: "1px solid #ecf0f1",
    },
    th: {
      backgroundColor: "#3498db",
      color: "white",
      padding: "12px",
      border: "1px solid #2980b9",
      textAlign: "left",
      fontWeight: "600",
    },
    td: {
      padding: "12px",
      border: "1px solid #ecf0f1",
      textAlign: "left",
      color: "#2c3e50",
    },
    noTables: {
      color: "#7f8c8d",
      fontStyle: "italic",
      textAlign: "center",
      marginTop: "20px",
    },
    floorPlan: {
      flex: 1,
      height: "100%",
      backgroundColor: "#ffffff",
      borderLeft: "2px solid #ccc",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
    floorSelect: {
      marginBottom: "20px",
      padding: "10px",
      fontSize: "1rem",
      width: "100%",
      maxWidth: "450px",
    },
    sidebar: {
      position: "absolute",
      right: 0,
      top: 0,
      width: "150px",
      height: "100%",
      backgroundColor: "#f9f9f9",
      padding: "15px",
      boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
      zIndex: 5,
      overflowY: "auto",
    },
    sidebarHeading: {
      textAlign: "center",
      marginBottom: "15px",
      fontSize: "1.2rem",
      color: "#2c3e50",
    },
    typeButton: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "60px",
      height: "50px",
      margin: "5px 2.5px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      fontSize: "0.8rem",
    },
    typeButtonSelected: {
      backgroundColor: "#e67e22",
      color: "white",
    },
    typeButtonNormal: {
      backgroundColor: "white",
      color: "#2c3e50",
    },
    typeIcon: {
      marginBottom: "3px",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "#fff",
      padding: "30px",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      maxWidth: "400px",
      width: "90%",
      maxHeight: "80vh",
      overflowY: "auto",
    },
    modalHeading: {
      marginBottom: "20px",
      fontSize: "1.8rem",
      color: "#2c3e50",
      textAlign: "center",
    },
    modalFormGroup: {
      display: "flex",
      flexDirection: "column",
      marginBottom: "15px",
    },
    modalLabel: {
      marginBottom: "8px",
      fontWeight: "600",
      color: "#34495e",
      fontSize: "1rem",
    },
    modalInput: {
      padding: "10px",
      border: "1px solid #ddd",
      borderRadius: "5px",
      fontSize: "0.95rem",
      outline: "none",
      transition: "border-color 0.3s ease",
    },
    modalInputFocus: {
      borderColor: "#3498db",
      boxShadow: "0 0 5px rgba(52, 152, 219, 0.3)",
    },
    modalButtons: {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
      marginTop: "20px",
    },
    modalSaveButton: {
      padding: "10px 20px",
      backgroundColor: "#2ecc71",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "1rem",
      transition: "background-color 0.3s ease",
    },
    modalSaveButtonHover: {
      backgroundColor: "#27ae60",
    },
    modalCancelButton: {
      padding: "10px 20px",
      backgroundColor: "#95a5a6",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "1rem",
      transition: "background-color 0.3s ease",
    },
    modalCancelButtonHover: {
      backgroundColor: "#7f8c8d",
    },
  };

  const ChairItem = ({ index, initialPosition, onSavePosition, tableCenter }) => {
    const [pos, setPos] = useState(initialPosition);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const ref = useRef(null);

    useEffect(() => {
      setPos(initialPosition);
    }, [initialPosition]);

    const handleMouseDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setDragging(true);
      }
    };

    useEffect(() => {
      const handleMouseMove = (e) => {
        if (dragging && ref.current) {
          const parent = ref.current.parentNode;
          const parentRect = parent.getBoundingClientRect();
          let newX = e.clientX - parentRect.left - offset.x;
          let newY = e.clientY - parentRect.top - offset.y;
          // Constrain to around the table center (circular boundary)
          const dx = newX - tableCenter.x;
          const dy = newY - tableCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 150; // Adjustable max distance from center
          if (dist > maxDist) {
            const angle = Math.atan2(dy, dx);
            newX = tableCenter.x + maxDist * Math.cos(angle);
            newY = tableCenter.y + maxDist * Math.sin(angle);
          }
          setPos({ x: newX, y: newY });
        }
      };
      const handleMouseUp = () => {
        setDragging(false);
        onSavePosition(index, pos);
      };
      if (dragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [dragging, offset, tableCenter, onSavePosition, pos]);

    return (
      <div
        ref={ref}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          transform: "translate(-50%, -50%)",
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: "transparent",
          border: "2px solid black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#000",
          fontSize: "12px",
          fontWeight: "bold",
          cursor: "move",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
      >
        {index + 1}
      </div>
    );
  };

  const TableItem = ({ table, onSavePosition, onSelect }) => {
    const [pos, setPos] = useState({ x: table.x || 0, y: table.y || 0 });
    const [localChairPositions, setLocalChairPositions] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const ref = useRef(null);
    const centerX = 120;
    const centerY = 140;
    const radius = 80;
    const chairSize = 24;

    useEffect(() => {
      setPos({ x: table.x || 0, y: table.y || 0 });
    }, [table.x, table.y]);

    useEffect(() => {
      let initPositions;
      if (table.chairs) {
        initPositions = table.chairs;
      } else {
        initPositions = getDefaultChairPositions(table.type, table.number_of_chairs, centerX, centerY, radius, chairSize);
      }
      setLocalChairPositions(initPositions);
    }, [table.type, table.number_of_chairs, table.chairs]);

    useEffect(() => {
      const handleMouseMove = (e) => {
        if (dragging && ref.current) {
          const ele = ref.current;
          const parentRect = ele.parentNode.getBoundingClientRect();
          const tableWidth = 240;
          const tableHeight = 280;
          const newX = e.clientX - parentRect.left - offset.x;
          const newY = e.clientY - parentRect.top - offset.y;
          const boundedX = Math.max(0, Math.min(parentRect.width - tableWidth, newX));
          const boundedY = Math.max(0, Math.min(parentRect.height - tableHeight, newY));
          setPos({ x: boundedX, y: boundedY });
        }
      };
      const handleMouseUp = (e) => {
        setDragging(false);
        if (ref.current) {
          const ele = ref.current;
          const parentRect = ele.parentNode.getBoundingClientRect();
          const tableWidth = 240;
          const tableHeight = 280;
          const newX = e.clientX - parentRect.left - offset.x;
          const newY = e.clientY - parentRect.top - offset.y;
          const boundedX = Math.max(0, Math.min(parentRect.width - tableWidth, newX));
          const boundedY = Math.max(0, Math.min(parentRect.height - tableHeight, newY));
          setPos({ x: boundedX, y: boundedY });
          onSavePosition(table.table_number, table.floor, boundedX, boundedY);  // Pass floor
        }
      };
      if (dragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [dragging, offset, table.table_number, table.floor, onSavePosition]);

    const handleMouseDown = (e) => {
      e.preventDefault();
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setDragging(true);
      }
    };

    const handleDoubleClick = (e) => {
      e.stopPropagation();
      onSelect(table.table_number, table.floor);  // Pass floor for selection
    };

    const handleSaveChairPosition = (index, newPos) => {
      const newPositions = [...localChairPositions];
      newPositions[index] = newPos;
      setLocalChairPositions(newPositions);
      updateTableChairs(table.floor, table.table_number, newPositions);  // Pass floor
      // Update local tables state to reflect saved chairs
      setTables(prevTables => prevTables.map(t => 
        t.table_number === table.table_number && t.floor === table.floor ? { ...t, chairs: newPositions } : t  // Floor-specific update
      ));
    };

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

    return (
      <div
        ref={ref}
        style={{
          position: "absolute",
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: "240px",
          height: "280px",
          background: "transparent",
          cursor: "move",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", top: 20, left: 0, width: "100%", height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 240, height: 220 }}>
              <div
                style={{
                  position: "absolute",
                  left: centerX,
                  top: centerY,
                  transform: "translate(-50%, -50%)",
                  width: tableWidth,
                  height: tableHeight,
                  borderRadius: tableBorderRadius,
                  backgroundColor: "transparent",
                  border: "2px solid black",
                }}
              />
              {localChairPositions.map((chairPos, i) => (
                <ChairItem
                  key={i}
                  index={i}
                  initialPosition={chairPos}
                  onSavePosition={handleSaveChairPosition}
                  tableCenter={{ x: centerX, y: centerY }}
                />
              ))}
            </div>
          </div>
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

  const filteredTables = tables.filter((table) => table.floor === selectedFloor);

  const selectedTable = tables.find((t) => t.table_number === selectedTableNumber && t.floor === selectedFloor);  // Floor-specific selection

  const tableTypes = ["Round", "Square", "Rectangle", "Long", "Oval", "Bar"];

  const getTypeIcon = (type) => {
    let iconStyle = {
      width: 25,
      height: 25,
      border: "1px solid black",
      background: "transparent",
    };
    switch (type) {
      case "Round":
        iconStyle.borderRadius = "50%";
        break;
      case "Square":
        iconStyle.borderRadius = "0";
        break;
      case "Rectangle":
        iconStyle.width = 35;
        iconStyle.height = 18;
        iconStyle.borderRadius = "0";
        break;
      case "Long":
        iconStyle.width = 45;
        iconStyle.height = 13;
        iconStyle.borderRadius = "0";
        break;
      case "Oval":
        iconStyle.width = 35;
        iconStyle.height = 18;
        iconStyle.borderRadius = "50%";
        break;
      case "Bar":
        iconStyle.width = 13;
        iconStyle.height = 45;
        iconStyle.borderRadius = "0";
        break;
      default:
        break;
    }
    return <div style={iconStyle} />;
  };

  const handleChangeType = (newType) => {
    if (!selectedTableNumber || !selectedTable || !selectedFloor) return;  // Ensure floor is selected
    if (newType === selectedTable.type) {
      setMessage(`The table is already of type ${newType}. No changes to update.`);
      setMessageType('error');
      return;
    }
    // Optimistic update - floor-specific
    const newChairs = getDefaultChairPositions(newType, selectedTable.number_of_chairs);
    setTables(prevTables => prevTables.map(t => 
      t.table_number === selectedTableNumber && t.floor === selectedFloor
        ? { ...t, type: newType, chairs: newChairs } 
        : t
    ));
    // Call server with floor
    updateTableType(selectedTableNumber, selectedFloor, newType, selectedTable.x || 0, selectedTable.y || 0);
  };

  return (
    <div style={styles.container}>
      <i
        className="fas fa-arrow-left"
        style={styles.backButton}
        onClick={() => navigate("/admin")}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === "Enter" && navigate("/admin")}
        onMouseOver={(e) => (e.target.style.color = styles.backButtonHover.color)}
        onMouseOut={(e) => (e.target.style.color = styles.backButton.color)}
      ></i>
      <div style={styles.messageBar}>
        {message && <div style={messageType === 'error' ? styles.error : styles.success}>{message}</div>}
      </div>
      <div style={styles.content}>
        <div style={styles.leftSection}>
          <h1 style={styles.heading}>Add New Table</h1>
          <button
            style={styles.addButton}
            onClick={openModal}
            onMouseOver={(e) => (e.target.style.backgroundColor = styles.addButtonHover.backgroundColor)}
            onMouseOut={(e) => (e.target.style.backgroundColor = styles.addButton.backgroundColor)}
          >
            Add Table
          </button>
          <div style={styles.tableContainer}>
            {uniqueFloors.length > 0 && (
              <select
                style={styles.floorSelect}
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
              >
                {uniqueFloors.map((f) => (
                  <option key={f} value={f}>
                    {formatFloor(f)}
                  </option>
                ))}
              </select>
            )}
            <h2 style={{ ...styles.heading, fontSize: "1.8rem" }}>
              Added Tables{selectedFloor ? ` on ${formatFloor(selectedFloor)}` : ""}
            </h2>
            {filteredTables.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Floor</th>
                    <th style={styles.th}>Table Number</th>
                    <th style={styles.th}>Number of Chairs</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTables.map((table, index) => (
                    <tr key={`${table.floor}-${table.table_number}-${index}`}>  {/* Unique key with floor */}
                      <td style={styles.td}>{formatFloor(table.floor)}</td>
                      <td style={styles.td}>{table.table_number}</td>
                      <td style={styles.td}>{table.number_of_chairs}</td>
                      <td style={styles.td}>
                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDelete(table.table_number, table.floor)}  // Pass floor
                          onMouseOver={(e) =>
                            (e.target.style.backgroundColor = styles.deleteButtonHover.backgroundColor)
                          }
                          onMouseOut={(e) =>
                            (e.target.style.backgroundColor = styles.deleteButton.backgroundColor)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={styles.noTables}>
                {selectedFloor ? `No tables added on ${formatFloor(selectedFloor)} yet.` : "No tables added yet."}
              </p>
            )}
          </div>
        </div>
        <div style={styles.floorPlan}>
          {tables
            .filter((table) => table.floor === selectedFloor)
            .map((table) => (
              <TableItem 
                key={`${table.floor}-${table.table_number}`}  // Unique key with floor
                table={table} 
                onSavePosition={updateTablePosition} 
                onSelect={(tn, fl) => setSelectedTableNumber(tn)}  // Set only table_number, floor is selectedFloor
              />
            ))}
          {selectedTableNumber && selectedTable && (
            <div style={styles.sidebar}>
              <h3 style={styles.sidebarHeading}>Table Types</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "5px" }}>
                {tableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleChangeType(type)}
                    style={{
                      ...styles.typeButton,
                      ...(selectedTable.type === type ? styles.typeButtonSelected : styles.typeButtonNormal),
                    }}
                  >
                    <div style={styles.typeIcon}>{getTypeIcon(type)}</div>
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalHeading}>Add New Table</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.modalFormGroup}>
                <label htmlFor="floor" style={styles.modalLabel}>
                  Floor:
                </label>
                <input
                  list="floors"
                  type="text"
                  id="floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="Enter or select floor (e.g., ground, 1, 2)"
                  style={styles.modalInput}
                  onFocus={(e) => Object.assign(e.target.style, styles.modalInputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.modalInput)}
                  required
                />
                <datalist id="floors">
                  {uniqueFloors.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
              <div style={styles.modalFormGroup}>
                <label htmlFor="tableNumber" style={styles.modalLabel}>
                  Table Number:
                </label>
                <input
                  type="text"
                  id="tableNumber"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter table number"
                  style={styles.modalInput}
                  onFocus={(e) => Object.assign(e.target.style, styles.modalInputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.modalInput)}
                  required
                />
              </div>
              <div style={styles.modalFormGroup}>
                <label htmlFor="numberOfChairs" style={styles.modalLabel}>
                  Number of Chairs:
                </label>
                <input
                  type="number"
                  id="numberOfChairs"
                  value={numberOfChairs}
                  onChange={(e) => setNumberOfChairs(e.target.value)}
                  placeholder="Enter number of chairs"
                  min="0"
                  style={styles.modalInput}
                  onFocus={(e) => Object.assign(e.target.style, styles.modalInputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.modalInput)}
                  required
                />
              </div>
              <div style={styles.modalButtons}>
                <button
                  type="button"
                  style={styles.modalCancelButton}
                  onClick={closeModal}
                  onMouseOver={(e) => (e.target.style.backgroundColor = styles.modalCancelButtonHover.backgroundColor)}
                  onMouseOut={(e) => (e.target.style.backgroundColor = styles.modalCancelButton.backgroundColor)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSaveButton}
                  onMouseOver={(e) => (e.target.style.backgroundColor = styles.modalSaveButtonHover.backgroundColor)}
                  onMouseOut={(e) => (e.target.style.backgroundColor = styles.modalSaveButton.backgroundColor)}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddTablePage;