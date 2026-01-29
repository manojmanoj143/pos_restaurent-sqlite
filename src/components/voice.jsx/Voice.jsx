import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const Voice = () => {
    const [activeCards, setActiveCards] = useState([]); // Items speaking (Cards)
    const [tableItems, setTableItems] = useState([]);   // Items finished (Table)
    const [baseUrl, setBaseUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [voices, setVoices] = useState([]);
    const navigate = useNavigate();

    // Use a ref to track what has been announced. 
    const announcedItemsRef = useRef(new Set());

    // Load Voices & LocalStorage
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Initialize announced set from localStorage
        try {
            const stored = localStorage.getItem('voice_announced_ids');
            if (stored) {
                const ids = JSON.parse(stored);
                ids.forEach(id => announcedItemsRef.current.add(id));
            }
        } catch (e) {
            console.error("Failed to load local storage", e);
        }
    }, []);

    // Fetch config for baseUrl
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await axios.get("/api/network_info");
                const { config: appConfig } = response.data;
                if (appConfig.mode === "client") {
                    setBaseUrl(`http://${appConfig.server_ip}:8000`);
                } else {
                    setBaseUrl("");
                }
            } catch (err) {
                console.error("Failed to fetch config:", err);
                setBaseUrl("http://127.0.0.1:8000");
            }
        };
        fetchConfig();
    }, []);

    // Poll for active orders
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                if (!baseUrl && window.location.hostname !== 'localhost') return;
                const url = baseUrl ? `${baseUrl}/api/activeorders` : '/api/activeorders';
                const response = await axios.get(url);
                if (response.data && Array.isArray(response.data)) {
                    processOrders(response.data);
                }
            } catch (err) {
                console.error("Error fetching orders:", err);
            } finally {
                setLoading(false);
            }
        };

        const interval = setInterval(fetchOrders, 3000);
        fetchOrders();

        return () => clearInterval(interval);
    }, [baseUrl, audioEnabled, voices]);

    const processOrders = (orders) => {
        const now = Date.now();
        // EXTENDED: Keep items for 24 hours (effectively "don't delete")
        const retentionPeriod = 24 * 60 * 60 * 1000;
        const retentionTimeLimit = new Date(now - retentionPeriod);

        // Duration to show card. 
        const cardDisplayDuration = 12000; // 12 seconds

        const currentCards = [];
        const currentTable = [];

        orders.forEach(order => {
            if (!order.cartItems || !Array.isArray(order.cartItems)) return;

            order.cartItems.forEach(item => {
                if (item.kitchenStatuses) {
                    Object.entries(item.kitchenStatuses).forEach(([kitchen, status]) => {
                        if (status === 'PickedUp') {
                            let eventTime = null;

                            if (item.kitchenPickedUpAt && item.kitchenPickedUpAt[kitchen]) {
                                eventTime = new Date(item.kitchenPickedUpAt[kitchen]);
                            } else {
                                eventTime = new Date();
                            }

                            if (isNaN(eventTime.getTime())) {
                                eventTime = new Date();
                            }

                            const isTimestampFromBackend = item.kitchenPickedUpAt && item.kitchenPickedUpAt[kitchen];

                            // Filter: Only process if within valid window (24 hrs)
                            if (!isTimestampFromBackend || eventTime > retentionTimeLimit) {
                                const uniqueId = `${order.orderId}-${item.id}-${kitchen}-pickedup`;
                                const itemData = {
                                    uniqueId,
                                    orderNo: order.orderNo,
                                    orderType: order.orderType,
                                    itemName: item.name,
                                    kitchen: kitchen,
                                    eventTime: eventTime,
                                    isTimestampFromBackend
                                };

                                const timeSinceEvent = now - eventTime.getTime();
                                const alreadyAnnounced = announcedItemsRef.current.has(uniqueId);

                                // Card Logic: Show if within 12 seconds
                                if (timeSinceEvent < cardDisplayDuration) {
                                    currentCards.push(itemData);

                                    // Speak Logic (Only if enabled and NOT announced)
                                    if (audioEnabled && !alreadyAnnounced) {
                                        handleVoiceAnnouncement(uniqueId, order.orderNo, order.orderType || "Order");
                                    }

                                } else {
                                    currentTable.push(itemData);
                                }
                            }
                        }
                    });
                }
            });
        });

        // Sort Table: Newest Time First + OrderNo Descending
        currentTable.sort((a, b) => {
            const timeDiff = b.eventTime - a.eventTime;
            if (timeDiff !== 0) return timeDiff;
            const numA = parseInt(String(a.orderNo).replace(/\D/g, '')) || 0;
            const numB = parseInt(String(b.orderNo).replace(/\D/g, '')) || 0;
            return numB - numA;
        });

        setActiveCards(currentCards);
        setTableItems(currentTable);
    };

    const handleVoiceAnnouncement = (uniqueId, orderNo, orderType) => {
        // Mark as announced immediately
        if (!announcedItemsRef.current.has(uniqueId)) {
            console.log(`[Voice] Announcing: ${uniqueId}`);
            announcedItemsRef.current.add(uniqueId);

            try {
                const currentIds = Array.from(announcedItemsRef.current);
                const slicedIds = currentIds.slice(-100);
                localStorage.setItem('voice_announced_ids', JSON.stringify(slicedIds));
            } catch (e) {
                console.error("LS Error", e);
            }

            const text = `${orderType} Order Number ${orderNo}, is prepared`;

            speak(text);

            setTimeout(() => {
                speak(text);
            }, 3000);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);

            const femaleVoice = voices.find(v => v.name.includes("Microsoft Zira")) ||
                voices.find(v => v.name.includes("Google US English")) ||
                voices.find(v => v.name.includes("Samantha")) ||
                voices.find(v => v.name.toLowerCase().includes("female"));

            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }

            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            window.speechSynthesis.speak(utterance);
        }
    };

    const enableAudio = () => {
        setAudioEnabled(true);
        speak("Voice system enabled.");
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            style={{
                padding: "30px",
                background: "linear-gradient(135deg, #e3f2fd, #bbdefb)", // Same as ActiveOrders
                minHeight: "100vh",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                position: "relative",
                animation: "fadeIn 0.5s ease-in-out"
            }}
        >
            <style>{`
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
            70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
        }
      `}</style>

            {/* Header Container like ActiveOrders */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "25px",
                padding: "15px",
                background: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
            }}>
                {/* Back Button matching ActiveOrders FaArrowLeft style */}
                <FaArrowLeft
                    onClick={() => navigate(-1)}
                    style={{
                        fontSize: "30px",
                        cursor: "pointer",
                        color: "#3182ce",
                        transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = "#2b6cb0"; e.currentTarget.style.transform = "scale(1.2) rotate(-5deg)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = "#3182ce"; e.currentTarget.style.transform = "scale(1)"; }}
                    title="Back to previous page"
                />

                <h1 style={{
                    fontSize: "2.25rem",
                    fontWeight: 700,
                    color: "#2d3748",
                    margin: 0,
                    flexGrow: 1,
                    textAlign: "center"
                }}>
                    Ready For Pickup
                </h1>
                {/* Spacer to center title perfectly relative to back button */}
                <div style={{ width: "30px" }}></div>
            </div>

            {!audioEnabled && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                    <h2>Audio Permission Required</h2>
                    <button
                        onClick={enableAudio}
                        style={{
                            padding: '12px 24px',
                            fontSize: '18px',
                            background: 'linear-gradient(135deg, #38a169, #68d391)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginTop: '20px',
                            fontWeight: "500",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                    >
                        ENABLE VOICE NOTIFICATIONS
                    </button>
                </div>
            )}

            {loading && <p style={{ textAlign: "center", color: '#4a5568' }}>Loading...</p>}

            {/* SECTION 1: SPEAKING CARDS (New Items) */}
            <div style={{ minHeight: "20px", marginBottom: "30px" }}>
                {activeCards.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                        {activeCards.map((item) => (
                            <div
                                key={item.uniqueId}
                                style={{
                                    backgroundColor: "#c6f6d5", // Light Green (ActiveOrders 'Prepared' color)
                                    color: "#2f855a",
                                    border: "2px solid #2f855a",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    animation: "pulse 2s infinite"
                                }}
                            >
                                <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#2d3748", marginBottom: "5px", textTransform: "uppercase" }}>
                                    {item.orderType}
                                </div>
                                <div style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "10px", lineHeight: "1", color: "#2f855a" }}>
                                    #{item.orderNo}
                                </div>
                                <div style={{ fontSize: "1.4rem", fontWeight: "600", marginBottom: "5px", color: "#2d3748" }}>
                                    {item.itemName}
                                </div>
                                <div style={{ fontSize: "1rem", color: "#4a5568" }}>
                                    {item.kitchen} Kitchen
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "#718096", marginTop: "10px", fontStyle: "italic" }}>
                                    Speaking...
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION 2: TABLE LIST (Finished Speaking) */}

            {tableItems.length === 0 ? (
                <div style={{
                    textAlign: "center",
                    color: "#718096",
                    fontSize: "16px",
                    padding: "20px",
                    background: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
                }}>
                    No recently prepared items.
                </div>
            ) : (
                <div style={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                    background: "#ffffff",
                    overflow: "hidden"
                }}>
                    <h2 style={{
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        color: "#2d3748",
                        padding: "20px",
                        margin: 0,
                        textAlign: "center",
                        borderBottom: "1px solid #e2e8f0"
                    }}>
                        PREPARED ORDER LIST
                    </h2>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Order No</th>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Type</th>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Item</th>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Kitchen</th>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Ready Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableItems.map((item, index) => (
                                    <tr key={item.uniqueId} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f7fafc" }}>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", fontSize: "1.2rem", color: "#2f855a" }}>#{item.orderNo}</td>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", color: "#4a5568" }}>{item.orderType}</td>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", fontWeight: "600", color: "#2d3748" }}>{item.itemName}</td>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", color: "#4a5568" }}>{item.kitchen}</td>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", color: "#718096" }}>{formatTime(item.eventTime)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Voice;
