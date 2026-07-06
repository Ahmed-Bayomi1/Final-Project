    import "./Overview.css";

    // Mock data — replace with live Supabase queries once the admin API is wired up
    const STAT_CARDS = [
    {
        id: "users",
        label: "TOTAL USERS",
        value: "1,847",
        trend: "12% this month",
        trendDirection: "up",
        color: "blue",
        icon: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="6.5" r="2.25" stroke="currentColor" strokeWidth="1.6" />
            <path d="M2.75 16c0-2.4 2-4 4.25-4s4.25 1.6 4.25 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="13.5" cy="6.5" r="1.85" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12.4 8.7c1.85.2 3.35 1.65 3.35 3.55" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        ),
    },
    {
        id: "pharmacies",
        label: "TOTAL PHARMACIES",
        value: "3",
        trend: "1 pending",
        trendDirection: "neutral",
        color: "green",
        icon: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7 6.5h6M7 9.5h6M7 12.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        ),
    },
    {
        id: "medicines",
        label: "TOTAL MEDICINES",
        value: "18",
        trend: null,
        trendDirection: null,
        color: "purple",
        icon: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
            d="M8 12L12 8M9 5.5L10.2 4.3a2.6 2.6 0 013.7 3.7L12.6 9.2M11 14.5L9.8 15.7a2.6 2.6 0 01-3.7-3.7L7.4 10.8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            />
        </svg>
        ),
    },
    {
        id: "reservations",
        label: "TOTAL RESERVATIONS",
        value: "7",
        trend: "8% vs yesterday",
        trendDirection: "up",
        color: "amber",
        icon: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="3.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 3.5V3a1 1 0 011-1h2a1 1 0 011 1v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M7.5 9h5M7.5 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        ),
    },
    ];

    const RECENT_ACTIVITY = [
    {
        id: "act-1",
        type: "user",
        title: "New user registered",
        subtitle: "Amira Saeed",
        time: "2 min ago",
    },
    {
        id: "act-2",
        type: "pharmacy",
        title: "Pharmacy approved",
        subtitle: "Al-Amal Drug Store",
        time: "18 min ago",
    },
    {
        id: "act-3",
        type: "reservation",
        title: "Reservation completed",
        subtitle: "RX-8823",
        time: "34 min ago",
    },
    {
        id: "act-4",
        type: "user",
        title: "User account suspended",
        subtitle: "Nour Ibrahim",
        time: "1 hr ago",
    },
    {
        id: "act-5",
        type: "pharmacy",
        title: "New pharmacy application",
        subtitle: "Al-Hayat Pharmacy",
        time: "2 hr ago",
    },
    ];

    const ACTIVITY_ICONS = {
    user: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.5 16c0-2.7 2.4-4.5 5.5-4.5s5.5 1.8 5.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    ),
    pharmacy: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 6.5h6M7 9.5h6M7 12.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    ),
    reservation: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 7.5L10 4l7 3.5-7 3.5-7-3.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M3 7.5V13l7 3.5 7-3.5V7.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
    ),
    };

    const RESERVATIONS_BY_CATEGORY = [
    { id: "analgesics", name: "Analgesics", orders: 312 },
    { id: "antibiotics", name: "Antibiotics", orders: 198 },
    { id: "cardiology", name: "Cardiology", orders: 145 },
    { id: "gastro", name: "Gastro", orders: 88 },
    { id: "diabetes", name: "Diabetes", orders: 64 },
    ];

    const maxOrders = Math.max(...RESERVATIONS_BY_CATEGORY.map((c) => c.orders));

    const SYSTEM_HEALTH_DATE = "June 25, 2026";

    export default function Overview() {
    return (
        <div className="overview">
        <header className="overview__header">
            <h1 className="overview__title">Platform Overview</h1>
            <p className="overview__subtitle">System health as of {SYSTEM_HEALTH_DATE}</p>
        </header>

        <div className="overview__stats">
            {STAT_CARDS.map((card) => (
            <div className="overview__stat-card" key={card.id}>
                <div className="overview__stat-header">
                <span className="overview__stat-label">{card.label}</span>
                <span className={`overview__stat-icon overview__stat-icon--${card.color}`}>{card.icon}</span>
                </div>
                <div className="overview__stat-value">{card.value}</div>
                {card.trend && (
                <div
                    className={`overview__stat-trend${
                    card.trendDirection === "up" ? " overview__stat-trend--up" : ""
                    }`}
                >
                    {card.trendDirection === "up" && <span className="overview__stat-trend-arrow">↑</span>}
                    {card.trend}
                </div>
                )}
            </div>
            ))}
        </div>

        <div className="overview__panels">
            <section className="overview__panel">
            <h2 className="overview__panel-title">Recent Activity</h2>
            <ul className="overview__activity-list">
                {RECENT_ACTIVITY.map((activity) => (
                <li className="overview__activity-item" key={activity.id}>
                    <span className={`overview__activity-icon overview__activity-icon--${activity.type}`}>
                    {ACTIVITY_ICONS[activity.type]}
                    </span>
                    <span className="overview__activity-content">
                    <span className="overview__activity-title">{activity.title}</span>
                    <span className="overview__activity-subtitle">{activity.subtitle}</span>
                    </span>
                    <span className="overview__activity-time">{activity.time}</span>
                </li>
                ))}
            </ul>
            </section>

            <section className="overview__panel">
            <h2 className="overview__panel-title">Reservations by Category</h2>
            <ul className="overview__category-list">
                {RESERVATIONS_BY_CATEGORY.map((category) => (
                <li className="overview__category-item" key={category.id}>
                    <div className="overview__category-header">
                    <span className="overview__category-name">{category.name}</span>
                    <span className="overview__category-count">{category.orders} orders</span>
                    </div>
                    <div className="overview__category-bar">
                    <div
                        className="overview__category-bar-fill"
                        style={{ width: `${(category.orders / maxOrders) * 100}%` }}
                    />
                    </div>
                </li>
                ))}
            </ul>
            </section>
        </div>
        </div>
    );
    }