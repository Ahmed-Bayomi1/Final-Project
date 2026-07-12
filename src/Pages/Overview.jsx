import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./Overview.css";

function formatActivityTime(value) {
    if (!value) return "Just now";

    const diffMs = Date.now() - new Date(value).getTime();
    const minutes = Math.max(1, Math.round(diffMs / 60000));

    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;

    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

function resolveCategory(medicine) {
    const explicitCategory = medicine?.category || medicine?.medicine_category || medicine?.category_name;
    if (explicitCategory) return String(explicitCategory);

    const name = String(medicine?.name || medicine?.generic_name || "").toLowerCase();

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

async function countRows(table, filters = []) {
    try {
        let query = supabase.from(table).select("*", { count: "exact", head: true });

        filters.forEach((filter) => {
            query = query.eq(filter.column, filter.value);
        });

        const { count, error } = await query;

        if (error) {
            if (error.message?.includes("does not exist") || error.message?.includes("column")) {
                return 0;
            }
            throw error;
        }

        return count ?? 0;
    } catch (error) {
        if (error?.message?.includes("does not exist") || error?.message?.includes("column")) {
            return 0;
        }
        throw error;
    }
}

async function fetchRecentActivity(table, type) {
    try {
        const { data, error } = await supabase
            .from(table)
            .select("*")
            .order("created_at", { ascending: false })
            .limit(2);

        if (error) {
            if (error.message?.includes("does not exist") || error.message?.includes("column")) {
                return [];
            }
            throw error;
        }

        return (data || []).map((row) => {
            const displayName = row.name || row.full_name || row.first_name || row.phone || row.business_name || "Unknown";

            return {
                id: `${type}-${row.id}`,
                type,
                title: type === "user" ? "New user activity" : type === "pharmacy" ? "Pharmacy activity" : "Reservation activity",
                subtitle: type === "user"
                    ? displayName
                    : type === "pharmacy"
                        ? displayName
                        : `Reservation ${row.id || "update"}`,
                time: formatActivityTime(row.created_at),
                created_at: row.created_at,
            };
        });
    } catch (error) {
        if (error?.message?.includes("does not exist") || error?.message?.includes("column")) {
            return [];
        }
        throw error;
    }
}

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

const SYSTEM_HEALTH_DATE = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
});

export default function Overview() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPharmacies: 0,
        pendingPharmacies: 0,
        totalMedicines: 0,
        totalReservations: 0,
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        const fetchOverviewData = async () => {
            try {
                setLoading(true);

                let totalUsers = 0;
                let totalPharmacies = 0;
                let pendingPharmacies = 0;
                let totalMedicines = 0;
                let totalReservations = 0;
                let usersActivity = [];
                let pharmacyActivity = [];
                let reservationActivity = [];

                try {
                    totalUsers = await countRows("profiles");
                } catch (error) {
                    console.error("Error fetching total users:", error.message || error);
                }

                try {
                    totalPharmacies = await countRows("pharmacies");
                } catch (error) {
                    console.error("Error fetching total pharmacies:", error.message || error);
                }

                try {
                    pendingPharmacies = await countRows("pharmacies", [{ column: "status", value: "pending" }]);
                } catch (error) {
                    console.error("Error fetching pending pharmacies:", error.message || error);
                }

                try {
                    totalMedicines = await countRows("medicines");
                } catch (error) {
                    console.error("Error fetching total medicines:", error.message || error);
                }

                try {
                    totalReservations = await countRows("reservations");
                } catch (error) {
                    console.error("Error fetching total reservations:", error.message || error);
                }

                try {
                    usersActivity = await fetchRecentActivity("profiles", "user");
                } catch (error) {
                    console.error("Error fetching recent activity users:", error.message || error);
                }

                try {
                    pharmacyActivity = await fetchRecentActivity("pharmacies", "pharmacy");
                } catch (error) {
                    console.error("Error fetching recent activity pharmacies:", error.message || error);
                }

                try {
                    reservationActivity = await fetchRecentActivity("reservations", "reservation");
                } catch (error) {
                    console.error("Error fetching recent activity reservations:", error.message || error);
                }

                if (ignore) return;

                const activityItems = [...usersActivity, ...pharmacyActivity, ...reservationActivity]
                    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                    .slice(0, 6);

                setStats({
                    totalUsers,
                    totalPharmacies,
                    pendingPharmacies,
                    totalMedicines,
                    totalReservations,
                });
                setRecentActivity(activityItems);
                setCategoryStats([]);
            } catch (error) {
                console.error("Error fetching overview data:", error.message || error);
                if (!ignore) {
                    setStats({
                        totalUsers: 0,
                        totalPharmacies: 0,
                        pendingPharmacies: 0,
                        totalMedicines: 0,
                        totalReservations: 0,
                    });
                    setRecentActivity([]);
                    setCategoryStats([]);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchOverviewData();

        return () => {
            ignore = true;
        };
    }, []);

    const statCards = [
        {
            id: "users",
            label: "TOTAL USERS",
            value: loading ? "—" : stats.totalUsers.toLocaleString(),
            trend: loading ? "Loading data" : stats.totalUsers > 0 ? "Live data" : "No users yet",
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
            value: loading ? "—" : stats.totalPharmacies.toLocaleString(),
            trend: loading ? "Loading data" : stats.pendingPharmacies > 0 ? `${stats.pendingPharmacies} pending` : "All approved",
            trendDirection: stats.pendingPharmacies > 0 ? "neutral" : "up",
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
            value: loading ? "—" : stats.totalMedicines.toLocaleString(),
            trend: loading ? "Loading data" : "Inventory synced",
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
            value: loading ? "—" : stats.totalReservations.toLocaleString(),
            trend: loading ? "Loading data" : stats.totalReservations > 0 ? "Live bookings" : "No bookings yet",
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

    const maxOrders = Math.max(...categoryStats.map((category) => category.orders), 1);

    return (
        <div className="overview">
            <header className="overview__header">
                <h1 className="overview__title">Platform Overview</h1>
                <p className="overview__subtitle">System health as of {SYSTEM_HEALTH_DATE}</p>
            </header>

            <div className="overview__stats">
                {statCards.map((card) => (
                    <div className="overview__stat-card" key={card.id}>
                        <div className="overview__stat-header">
                            <span className="overview__stat-label">{card.label}</span>
                            <span className={`overview__stat-icon overview__stat-icon--${card.color}`}>{card.icon}</span>
                        </div>
                        <div className="overview__stat-value">{card.value}</div>
                        {card.trend && (
                            <div
                                className={`overview__stat-trend${card.trendDirection === "up" ? " overview__stat-trend--up" : ""}`}
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
                    {loading ? (
                        <ul className="overview__activity-list">
                            {[0, 1, 2].map((item) => (
                                <li className="overview__activity-item" key={item}>
                                    <span className="overview__activity-icon overview__activity-icon--user">⏳</span>
                                    <span className="overview__activity-content">
                                        <span className="overview__activity-title">Loading activity…</span>
                                        <span className="overview__activity-subtitle">Please wait</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : recentActivity.length > 0 ? (
                        <ul className="overview__activity-list">
                            {recentActivity.map((activity) => (
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
                    ) : (
                        <p className="overview__activity-subtitle">No activity recorded yet.</p>
                    )}
                </section>

                <section className="overview__panel">
                    <h2 className="overview__panel-title">Reservations by Category</h2>
                    {loading ? (
                        <ul className="overview__category-list">
                            {[0, 1, 2].map((item) => (
                                <li className="overview__category-item" key={item}>
                                    <div className="overview__category-header">
                                        <span className="overview__category-name">Loading…</span>
                                        <span className="overview__category-count">—</span>
                                    </div>
                                    <div className="overview__category-bar">
                                        <div className="overview__category-bar-fill" style={{ width: "30%" }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : categoryStats.length > 0 ? (
                        <ul className="overview__category-list">
                            {categoryStats.map((category) => (
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
                    ) : (
                        <p className="overview__activity-subtitle">No reservation categories yet.</p>
                    )}
                </section>
            </div>
        </div>
    );
}