    import { useEffect, useMemo, useState } from "react";
    import { supabase } from "../supabaseClient";
    import "./Analytics.css";

    const PHARMACY_INFO = { name: "El-Shifa Pharmacy", period: "Last 7 days" };

    const CATEGORY_COLORS = {
    Antibiotics: "#2f5bff",
    Analgesics: "#12805c",
    Gastro: "#d97706",
    Diabetes: "#7c3aed",
    Cardiology: "#e5484d",
    Antihistamines: "#0d9488",
    General: "#64748b",
    };

    function inferCategory(medicineName) {
    const name = String(medicineName || "").toLowerCase();

    if (name.includes("anti") || name.includes("antibiotic") || name.includes("bact")) {
        return "Antibiotics";
    }
    if (name.includes("pain") || name.includes("paracetamol") || name.includes("ibuprofen") || name.includes("analges")) {
        return "Analgesics";
    }
    if (name.includes("gastro") || name.includes("acid") || name.includes("antacid") || name.includes("digest")) {
        return "Gastro";
    }
    if (name.includes("diab") || name.includes("glucose") || name.includes("sugar")) {
        return "Diabetes";
    }
    if (name.includes("card") || name.includes("heart") || name.includes("cholest") || name.includes("blood")) {
        return "Cardiology";
    }
    if (name.includes("hist") || name.includes("allergy") || name.includes("cetir")) {
        return "Antihistamines";
    }

    return "General";
    }

    function Icon({ type }) {
    switch (type) {
        case "trend":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
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
        case "check":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l2.5 2.5L16 9.5" />
            </svg>
        );
        case "pulse":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h4l2 7 4-14 2 7h6" />
            </svg>
        );
        default:
        return null;
    }
    }

    // Builds a smooth SVG path through a series of points using simple cubic bezier segments.
    function buildSmoothPath(points) {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const midX = (p0.x + p1.x) / 2;
        d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
    }

    function ReservationTrendChart({ data }) {
    const width = 640;
    const height = 260;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values, 1);
    const tickCount = 4;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, index) => {
        const step = maxValue / tickCount;
        return Math.round(step * index);
    });

    if (!data.length) {
        return <p className="analytics__empty">No trend data yet.</p>;
    }

    const points = data.map((d, i) => ({
        x: padding.left + (i / (data.length - 1)) * chartW,
        y: padding.top + chartH - (d.value / maxValue) * chartH,
        ...d,
    }));

    const linePath = buildSmoothPath(points);

    return (
        <svg
        className="analytics__line-chart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        >
        {/* Gridlines */}
        {yTicks.map((tick) => {
            const y = padding.top + chartH - (tick / maxValue) * chartH;
            return (
            <g key={tick}>
                <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                className="analytics__grid-line"
                />
                <text x={padding.left - 10} y={y + 4} className="analytics__axis-label" textAnchor="end">
                {tick}
                </text>
            </g>
            );
        })}

        {/* Line */}
        <path d={linePath} className="analytics__line-path" fill="none" />

        {/* Points + x labels */}
        {points.map((p) => (
            <g key={p.day}>
            <circle cx={p.x} cy={p.y} r="5" className="analytics__line-dot" />
            <text
                x={p.x}
                y={height - 6}
                className="analytics__axis-label"
                textAnchor="middle"
            >
                {p.day}
            </text>
            </g>
        ))}
        </svg>
    );
    }

    function DonutChart({ data }) {
    const size = 200;
    const radius = 80;
    const strokeWidth = 34;
    const circumference = 2 * Math.PI * radius;
    const total = data.reduce((sum, d) => sum + d.count, 0);

    if (!data.length || total === 0) {
        return <p className="analytics__empty">No inventory data yet.</p>;
    }

    let offsetSoFar = 0;
    const segments = data.map((d) => {
        const fraction = d.count / total;
        const dash = fraction * circumference;
        const gap = circumference - dash;
        const segment = {
        ...d,
        dashArray: `${dash} ${gap}`,
        dashOffset: -offsetSoFar,
        };
        offsetSoFar += dash;
        return segment;
    });

    return (
        <svg
        className="analytics__donut-chart"
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments.map((seg) => (
            <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
            />
            ))}
        </g>
        </svg>
    );
    }

    function Analytics() {
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        totalReservations: 0,
        fulfillmentRate: 0,
        avgDailyOrders: 0,
    });
    const [trendData, setTrendData] = useState([]);
    const [categoryDistribution, setCategoryDistribution] = useState([]);
    const [mostReservedMedicines, setMostReservedMedicines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
        try {
            setLoading(true);

            const { data: reservationsData, error: reservationsError } = await supabase
            .from("reservations")
            .select(`
                id,
                reservation_date,
                created_at,
                status,
                total_amount,
                reservation_items(quantity_requested, subtotal, medicines(name))
            `)
            .order("reservation_date", { ascending: false });

            if (reservationsError) throw reservationsError;

            const reservations = reservationsData || [];
            const completedStatuses = ["collected", "completed", "fulfilled"];
            const totalReservations = reservations.length;
            const fulfilledCount = reservations.filter((reservation) =>
            completedStatuses.includes(String(reservation.status || "").toLowerCase())
            ).length;
            const fulfillmentRate = totalReservations > 0 ? Math.round((fulfilledCount / totalReservations) * 100) : 0;

            const revenue = reservations.reduce((sum, reservation) => {
            const candidateAmount = Number(reservation.total_amount ?? 0);
            if (candidateAmount > 0) return sum + candidateAmount;

            const itemSubtotal = (reservation.reservation_items || []).reduce(
                (subSum, item) => subSum + Number(item.subtotal || 0),
                0
            );
            return sum + itemSubtotal;
            }, 0);

            const today = new Date();
            const trendMap = new Map();
            for (let i = 6; i >= 0; i -= 1) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const key = date.toISOString().slice(0, 10);
            const label = date.toLocaleDateString("en-US", { weekday: "short" });
            trendMap.set(key, { day: label, value: 0 });
            }

            reservations.forEach((reservation) => {
            const rawDate = reservation.reservation_date || reservation.created_at;
            if (!rawDate) return;
            const date = new Date(rawDate);
            if (Number.isNaN(date.getTime())) return;
            const key = date.toISOString().slice(0, 10);
            if (trendMap.has(key)) {
                trendMap.set(key, { day: trendMap.get(key).day, value: trendMap.get(key).value + 1 });
            }
            });

            const trendSeries = Array.from(trendMap.values());

            const { data: inventoryData, error: inventoryError } = await supabase
            .from("pharmacy_medicines")
            .select("*, medicines(name)");

            if (inventoryError) throw inventoryError;

            const inventoryItems = inventoryData || [];
            const categoryCounts = new Map();
            inventoryItems.forEach((item) => {
            const medicineName = item.medicines?.name || item.medicine_id || "";
            const category = inferCategory(medicineName);
            categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
            });

            const distribution = Array.from(categoryCounts.entries()).map(([label, count]) => ({
            label,
            count,
            color: CATEGORY_COLORS[label] || "#64748b",
            }));

            const medicineCounts = new Map();
            reservations.forEach((reservation) => {
            const items = reservation.reservation_items || [];
            items.forEach((item) => {
                const name = item.medicines?.name || "Unknown medicine";
                medicineCounts.set(name, (medicineCounts.get(name) || 0) + (Number(item.quantity_requested) || 1));
            });
            });

            const topMedicines = Array.from(medicineCounts.entries())
            .map(([name, count]) => ({ id: name, name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);

            setMetrics({
            totalRevenue: revenue,
            totalReservations,
            fulfillmentRate,
            avgDailyOrders: totalReservations > 0 ? Number((totalReservations / 7).toFixed(1)) : 0,
            });
            setTrendData(trendSeries);
            setCategoryDistribution(distribution);
            setMostReservedMedicines(topMedicines);
        } catch (err) {
            console.error("Error fetching analytics data:", err);
            setMetrics({
            totalRevenue: 0,
            totalReservations: 0,
            fulfillmentRate: 0,
            avgDailyOrders: 0,
            });
            setTrendData([]);
            setCategoryDistribution([]);
            setMostReservedMedicines([]);
        } finally {
            setLoading(false);
        }
        };

        fetchAnalyticsData();
    }, []);

    const stats = [
        {
        id: "revenue",
        label: "Total Revenue",
        value: loading ? "Loading..." : `${metrics.totalRevenue.toLocaleString()} EGP`,
        change: "+Live data",
        icon: "trend",
        tone: "blue",
        },
        {
        id: "reservations",
        label: "Total Reservations",
        value: loading ? "Loading..." : metrics.totalReservations,
        icon: "clipboard",
        tone: "green",
        },
        {
        id: "fulfillment",
        label: "Fulfillment Rate",
        value: loading ? "Loading..." : `${metrics.fulfillmentRate}%`,
        icon: "check",
        tone: "purple",
        },
        {
        id: "avgOrders",
        label: "Avg. Daily Orders",
        value: loading ? "Loading..." : metrics.avgDailyOrders,
        icon: "pulse",
        tone: "amber",
        },
    ];

    const maxReserved = useMemo(
        () => Math.max(...mostReservedMedicines.map((m) => m.count), 1),
        [mostReservedMedicines]
    );

    return (
        <div className="analytics">
        <header className="analytics__header">
            <h1 className="analytics__title">Analytics</h1>
            <p className="analytics__subtitle">
            {PHARMACY_INFO.name} · {PHARMACY_INFO.period}
            </p>
        </header>

        <section className="analytics__stats">
            {stats.map((stat) => (
            <div key={stat.id} className="analytics__stat-card">
                <div className="analytics__stat-top">
                <span className="analytics__stat-label">{stat.label}</span>
                <span className={`analytics__stat-icon analytics__stat-icon--${stat.tone}`}>
                    <Icon type={stat.icon} />
                </span>
                </div>
                <div className="analytics__stat-value">{stat.value}</div>
                {stat.change && (
                <div className="analytics__stat-change">↑ {stat.change}</div>
                )}
            </div>
            ))}
        </section>

        <section className="analytics__panels">
            <div className="analytics__panel">
            <h2 className="analytics__panel-title">Reservation Trends (Last 7 Days)</h2>
            {loading ? (
                <p className="analytics__empty">Loading reservation trends...</p>
            ) : (
                <ReservationTrendChart data={trendData} />
            )}
            </div>

            <div className="analytics__panel">
            <h2 className="analytics__panel-title">Inventory Distribution by Category</h2>
            <div className="analytics__donut-row">
                {loading ? (
                <p className="analytics__empty">Loading inventory distribution...</p>
                ) : (
                <>
                    <DonutChart data={categoryDistribution} />
                    <ul className="analytics__legend">
                    {categoryDistribution.map((cat) => (
                        <li key={cat.label} className="analytics__legend-item">
                        <span
                            className="analytics__legend-dot"
                            style={{ backgroundColor: cat.color }}
                        />
                        <span className="analytics__legend-label">{cat.label}</span>
                        <span className="analytics__legend-count">{cat.count}</span>
                        </li>
                    ))}
                    </ul>
                </>
                )}
            </div>
            </div>
        </section>

        <section className="analytics__panel analytics__panel--full">
            <h2 className="analytics__panel-title">Most Reserved Medicines</h2>
            <div className="analytics__ranked-list">
            {loading ? (
                <p className="analytics__empty">Loading reserved medicines...</p>
            ) : mostReservedMedicines.length > 0 ? (
                mostReservedMedicines.map((med, index) => (
                <div key={med.id} className="analytics__ranked-row">
                    <span className="analytics__ranked-index">{index + 1}</span>
                    <span className="analytics__ranked-name">{med.name}</span>
                    <div className="analytics__ranked-track">
                    <div
                        className="analytics__ranked-fill"
                        style={{ width: `${(med.count / maxReserved) * 100}%` }}
                    />
                    </div>
                    <span className="analytics__ranked-count">{med.count}</span>
                </div>
                ))
            ) : (
                <p className="analytics__empty">No reservation history yet.</p>
            )}
            </div>
        </section>
        </div>
    );
    }

    export default Analytics;