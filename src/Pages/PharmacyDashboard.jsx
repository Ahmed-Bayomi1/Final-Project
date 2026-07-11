    import { useEffect, useState } from "react";
    import { supabase } from "../supabaseClient";
    import "./PharmacyDashboard.css";

    const PHARMACY_INFO = {
    name: "El-Shifa Pharmacy",
    city: "Cairo",
    lastUpdated: "today",
    };

    const RECENT_RESERVATIONS = [
    { id: 1, medicine: "Amoxicillin 500mg", patient: "Sara Ahmed", rx: "RX-4821", status: "pending" },
    { id: 2, medicine: "Cetirizine 10mg", patient: "Mona Fathy", rx: "RX-7104", status: "collected" },
    { id: 3, medicine: "Atorvastatin 40mg", patient: "Khaled Mostafa", rx: "RX-5567", status: "pending" },
    ];

    // Minimal inline icon set — swap for an icon library if the project adopts one.
    function StatIcon({ type }) {
    switch (type) {
        case "pill":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="10.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)" />
            <line x1="8.5" y1="15.5" x2="12" y2="12" />
            </svg>
        );
        case "check":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l2.5 2.5L16 9.5" />
            </svg>
        );
        case "warning":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4L2.5 20h19L12 4z" />
            <line x1="12" y1="10.5" x2="12" y2="14.5" />
            <circle cx="12" cy="17" r="0.6" fill="currentColor" />
            </svg>
        );
        case "clipboard":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <rect x="9" y="2.5" width="6" height="3" rx="1" />
            <line x1="8.5" y1="10.5" x2="15.5" y2="10.5" />
            <line x1="8.5" y1="14.5" x2="15.5" y2="14.5" />
            </svg>
        );
        case "box":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
            <path d="M4.5 7.5L12 12l7.5-4.5" />
            <line x1="12" y1="12" x2="12" y2="21" />
            </svg>
        );
        default:
        return null;
    }
    }

    function PharmacyDashboard() {
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalMedicines: 0,
        inStockCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalValue: 0,
    });

    useEffect(() => {
        const fetchInventory = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from("pharmacy_medicines").select("*");

            if (error) throw error;

            const items = data || [];
            const totalMedicines = items.length;
            const lowStockCount = items.filter(
            (item) => Number(item.quantity_in_stock) > 0 && Number(item.quantity_in_stock) < 10
            ).length;
            const outOfStockCount = items.filter(
            (item) => Number(item.quantity_in_stock) === 0
            ).length;
            const inStockCount = totalMedicines - lowStockCount - outOfStockCount;
            const totalValue = items.reduce(
            (sum, item) => sum + Number(item.price_per_unit || 0) * Number(item.quantity_in_stock || 0),
            0
            );

            setInventoryItems(items);
            setMetrics({
            totalMedicines,
            inStockCount,
            lowStockCount,
            outOfStockCount,
            totalValue,
            });
        } catch (err) {
            console.error("Error fetching pharmacy inventory:", err);
            setInventoryItems([]);
            setMetrics({
            totalMedicines: 0,
            inStockCount: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            totalValue: 0,
            });
        } finally {
            setLoading(false);
        }
        };

        fetchInventory();
    }, []);

    const stats = [
        { id: "total", label: "Total Medicines", value: loading ? "Loading..." : metrics.totalMedicines, icon: "pill", tone: "blue" },
        { id: "inStock", label: "In Stock", value: loading ? "Loading..." : metrics.inStockCount, icon: "check", tone: "green" },
        { id: "lowStock", label: "Low Stock Items", value: loading ? "Loading..." : metrics.lowStockCount, sublabel: "≤ 10 units", icon: "warning", tone: "amber" },
        { id: "outOfStock", label: "Out of Stock", value: loading ? "Loading..." : metrics.outOfStockCount, icon: "clipboard", tone: "purple" },
    ];

    const inventoryStatus = [
        { id: "inStock", label: "In Stock", count: loading ? 0 : metrics.inStockCount, total: loading ? 1 : metrics.totalMedicines || 1, tone: "green" },
        { id: "lowStock", label: "Low Stock", count: loading ? 0 : metrics.lowStockCount, total: loading ? 1 : metrics.totalMedicines || 1, tone: "amber" },
        { id: "outOfStock", label: "Out of Stock", count: loading ? 0 : metrics.outOfStockCount, total: loading ? 1 : metrics.totalMedicines || 1, tone: "red" },
    ];

    const lowStockAlert = inventoryItems.find(
        (item) => Number(item.quantity_in_stock) > 0 && Number(item.quantity_in_stock) < 10
    );

    return (
        <div className="pharmacy-dashboard">
        <header className="pharmacy-dashboard__header">
            <h1 className="pharmacy-dashboard__title">Dashboard Overview</h1>
            <p className="pharmacy-dashboard__subtitle">
            {PHARMACY_INFO.name} · {PHARMACY_INFO.city} · Last updated {PHARMACY_INFO.lastUpdated}
            </p>
        </header>

        <section className="pharmacy-dashboard__stats">
            {stats.map((stat) => (
            <div key={stat.id} className="pharmacy-dashboard__stat-card">
                <div className="pharmacy-dashboard__stat-top">
                <span className="pharmacy-dashboard__stat-label">{stat.label}</span>
                <span
                    className={`pharmacy-dashboard__stat-icon pharmacy-dashboard__stat-icon--${stat.tone}`}
                >
                    <StatIcon type={stat.icon} />
                </span>
                </div>
                <div className="pharmacy-dashboard__stat-value">{stat.value}</div>
                {stat.sublabel && (
                <div className="pharmacy-dashboard__stat-sublabel">{stat.sublabel}</div>
                )}
            </div>
            ))}
        </section>

        {lowStockAlert && (
            <section className="pharmacy-dashboard__alert" role="alert">
            <span className="pharmacy-dashboard__alert-icon">
                <StatIcon type="warning" />
            </span>
            <div>
                <p className="pharmacy-dashboard__alert-title">Low stock alert</p>
                <p className="pharmacy-dashboard__alert-message">
                {lowStockAlert.medicine_id || "A medicine"} is running low.
                </p>
            </div>
            </section>
        )}

        <section className="pharmacy-dashboard__panels">
            <div className="pharmacy-dashboard__panel">
            <h2 className="pharmacy-dashboard__panel-title">Inventory Status</h2>

            <div className="pharmacy-dashboard__bars">
                {inventoryStatus.map((row) => (
                <div key={row.id} className="pharmacy-dashboard__bar-row">
                    <div className="pharmacy-dashboard__bar-labels">
                    <span className="pharmacy-dashboard__bar-label">{row.label}</span>
                    <span className="pharmacy-dashboard__bar-count">{row.count} items</span>
                    </div>
                    <div className="pharmacy-dashboard__bar-track">
                    <div
                        className={`pharmacy-dashboard__bar-fill pharmacy-dashboard__bar-fill--${row.tone}`}
                        style={{ width: `${(row.count / row.total) * 100}%` }}
                    />
                    </div>
                </div>
                ))}
            </div>
            </div>

            <div className="pharmacy-dashboard__panel">
            <h2 className="pharmacy-dashboard__panel-title">Recent Reservations</h2>

            <ul className="pharmacy-dashboard__reservations">
                {RECENT_RESERVATIONS.map((res) => (
                <li key={res.id} className="pharmacy-dashboard__reservation">
                    <span className="pharmacy-dashboard__reservation-icon">
                    <StatIcon type="box" />
                    </span>
                    <div className="pharmacy-dashboard__reservation-info">
                    <p className="pharmacy-dashboard__reservation-medicine">{res.medicine}</p>
                    <p className="pharmacy-dashboard__reservation-meta">
                        {res.patient} · {res.rx}
                    </p>
                    </div>
                    <span
                    className={`pharmacy-dashboard__status pharmacy-dashboard__status--${res.status}`}
                    >
                    {res.status}
                    </span>
                </li>
                ))}
            </ul>
            </div>
        </section>
        </div>
    );
    }

    export default PharmacyDashboard;