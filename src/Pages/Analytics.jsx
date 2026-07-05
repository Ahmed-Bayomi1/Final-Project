    import { useMemo } from "react";
    import "./Analytics.css";

    // Mock data — replace with real API calls once the backend endpoint is ready.
    const PHARMACY_INFO = { name: "El-Shifa Pharmacy", period: "Last 7 days" };

    const STATS = [
    { id: "revenue", label: "Total Revenue", value: "14,220 EGP", change: "+12% vs last week", icon: "trend", tone: "blue" },
    { id: "reservations", label: "Total Reservations", value: "3", icon: "clipboard", tone: "green" },
    { id: "fulfillment", label: "Fulfillment Rate", value: "94%", icon: "check", tone: "purple" },
    { id: "avgOrders", label: "Avg. Daily Orders", value: "18", icon: "pulse", tone: "amber" },
    ];

    const RESERVATION_TRENDS = [
    { day: "Mon", value: 12 },
    { day: "Tue", value: 18 },
    { day: "Wed", value: 8 },
    { day: "Thu", value: 22 },
    { day: "Fri", value: 30 },
    { day: "Sat", value: 19 },
    { day: "Sun", value: 14 },
    ];

    const CATEGORY_DISTRIBUTION = [
    { label: "Antibiotics", count: 2, color: "#2f5bff" },
    { label: "Analgesics", count: 1, color: "#12805c" },
    { label: "Gastro", count: 1, color: "#d97706" },
    { label: "Diabetes", count: 1, color: "#7c3aed" },
    { label: "Cardiology", count: 1, color: "#e5484d" },
    { label: "Antihistamines", count: 1, color: "#0d9488" },
    ];

    const MOST_RESERVED_MEDICINES = [
    { id: 1, name: "Amoxicillin 500mg", count: 24 },
    { id: 2, name: "Paracetamol 1g", count: 19 },
    { id: 3, name: "Cetirizine 10mg", count: 12 },
    { id: 4, name: "Atorvastatin 40mg", count: 8 },
    ];

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

    const maxValue = 32; // fixed scale to match the reference design's gridlines
    const yTicks = [0, 8, 16, 24, 32];

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
    const maxReserved = useMemo(
        () => Math.max(...MOST_RESERVED_MEDICINES.map((m) => m.count)),
        []
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
            {STATS.map((stat) => (
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
            <ReservationTrendChart data={RESERVATION_TRENDS} />
            </div>

            <div className="analytics__panel">
            <h2 className="analytics__panel-title">Inventory Distribution by Category</h2>
            <div className="analytics__donut-row">
                <DonutChart data={CATEGORY_DISTRIBUTION} />
                <ul className="analytics__legend">
                {CATEGORY_DISTRIBUTION.map((cat) => (
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
            </div>
            </div>
        </section>

        <section className="analytics__panel analytics__panel--full">
            <h2 className="analytics__panel-title">Most Reserved Medicines</h2>
            <div className="analytics__ranked-list">
            {MOST_RESERVED_MEDICINES.map((med, index) => (
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
            ))}
            </div>
        </section>
        </div>
    );
    }

    export default Analytics;