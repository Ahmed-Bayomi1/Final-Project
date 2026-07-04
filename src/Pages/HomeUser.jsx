import { useMemo, useState } from 'react';
import './HomeUser.css';

// Replace with real data (e.g. from API / auth context)
const USER_NAME = 'Sara';

const STATS = {
    reservations: 3,
    pendingPickups: 1,
    collected: 2,
};

const CATEGORIES = [
    'All',
    'Antibiotics',
    'Analgesics',
    'Gastro',
    'Cardiology',
    'Diabetes',
    'Antihistamines',
];

const MEDICINES = [
    {
        id: 1,
        name: 'Amoxicillin 500mg',
        category: 'Antibiotics',
        description: 'Broad-spectrum antibiotic for bacterial infections',
        pharmacy: 'El-Shifa Pharmacy',
        price: 45,
        status: 'in_stock',
    },
    {
        id: 2,
        name: 'Paracetamol 1g',
        category: 'Analgesics',
        description: 'Pain relief and fever reduction',
        pharmacy: 'El-Shifa Pharmacy',
        price: 12,
        status: 'in_stock',
    },
    {
        id: 3,
        name: 'Omeprazole 20mg',
        category: 'Gastro',
        description: 'Proton pump inhibitor for acid reflux',
        pharmacy: 'El-Shifa Pharmacy',
        price: 78,
        status: 'in_stock',
    },
    {
        id: 4,
        name: 'Metformin 850mg',
        category: 'Diabetes',
        description: 'First-line medication for type 2 diabetes',
        pharmacy: 'El-Shifa Pharmacy',
        price: 55,
        status: 'out_of_stock',
    },
    {
        id: 5,
        name: 'Atorvastatin 40mg',
        category: 'Cardiology',
        description: 'Cholesterol-lowering statin therapy',
        pharmacy: 'El-Shifa Pharmacy',
        price: 132,
        status: 'in_stock',
    },
    {
        id: 6,
        name: 'Cetirizine 10mg',
        category: 'Antihistamines',
        description: 'Non-drowsy allergy relief',
        pharmacy: 'El-Shifa Pharmacy',
        price: 28,
        status: 'low_stock',
    },
];

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function StatCard({ label, value, icon, variant, note }) {
    return (
        <div className="home-user__stat-card">
            <div className="home-user__stat-top">
                <span className="home-user__stat-label">{label}</span>
                <span className={`home-user__stat-icon home-user__stat-icon--${variant}`}>
                    {icon}
                </span>
            </div>
            <span className="home-user__stat-value">{value}</span>
            {note && <span className="home-user__stat-note">{note}</span>}
        </div>
    );
}

function StatusBadge({ status }) {
    if (status === 'in_stock') {
        return (
            <span className="home-user__status home-user__status--in-stock">
                <span aria-hidden="true">✓</span> In Stock
            </span>
        );
    }
    if (status === 'low_stock') {
        return (
            <span className="home-user__status home-user__status--low-stock">
                <span aria-hidden="true">⚠</span> Low Stock
            </span>
        );
    }
    return (
        <span className="home-user__status home-user__status--out-of-stock">
            <span aria-hidden="true">⊘</span> Out of Stock
        </span>
    );
}

function MedicineCard({ medicine }) {
    const available = medicine.status !== 'out_of_stock';

    return (
        <div className="home-user__medicine-card">
            <div className="home-user__medicine-top">
                <div>
                    <h3 className="home-user__medicine-name">{medicine.name}</h3>
                    <span className="home-user__medicine-category">{medicine.category}</span>
                </div>
                <StatusBadge status={medicine.status} />
            </div>

            <p className="home-user__medicine-desc">{medicine.description}</p>

            <span className="home-user__pharmacy-badge">
                <span className="home-user__pharmacy-icon">🏬</span>
                {medicine.pharmacy}
            </span>

            <div className="home-user__medicine-bottom">
                <span className="home-user__medicine-price">
                    {medicine.price} <span className="home-user__medicine-currency">EGP</span>
                </span>
                {available ? (
                    <button type="button" className="home-user__reserve-button">
                        Reserve
                    </button>
                ) : (
                    <button type="button" className="home-user__unavailable-button" disabled>
                        Unavailable
                    </button>
                )}
            </div>
        </div>
    );
}

export default function HomeUser() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');

    const filtered = useMemo(() => {
        return MEDICINES.filter((m) => {
            const matchesQuery =
                query.trim() === '' || m.name.toLowerCase().includes(query.toLowerCase());
            const matchesCategory = category === 'All' || m.category === category;
            return matchesQuery && matchesCategory;
        });
    }, [query, category]);

    return (
        <div className="home-user">
            <div className="home-user__container">
                <section className="home-user__hero">
                    <p className="home-user__greeting">
                        {getGreeting()}, {USER_NAME} 👋
                    </p>
                    <h1 className="home-user__hero-title">Find your medicine</h1>

                    <div className="home-user__search-box">
                        <span className="home-user__search-icon" aria-hidden="true">🔍</span>
                        <input
                            type="text"
                            className="home-user__search-input"
                            placeholder="Search medicines across all pharmacies..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </section>

                <div className="home-user__stats">
                    <StatCard
                        label="MY RESERVATIONS"
                        value={STATS.reservations}
                        icon="📋"
                        variant="reservations"
                    />
                    <StatCard
                        label="PENDING PICKUPS"
                        value={STATS.pendingPickups}
                        icon="🕐"
                        variant="pending"
                        note="Show pickup code at pharmacy"
                    />
                    <StatCard
                        label="COLLECTED"
                        value={STATS.collected}
                        icon="✓"
                        variant="collected"
                    />
                </div>

                <div className="home-user__categories">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            className={`home-user__category-pill ${
                                category === cat ? 'home-user__category-pill--active' : ''
                            }`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="home-user__section-header">
                    <h2 className="home-user__section-title">Available Medicines</h2>
                    <a href="/user/search" className="home-user__view-all">
                        View all <span aria-hidden="true">›</span>
                    </a>
                </div>

                <div className="home-user__medicines-grid">
                    {filtered.map((medicine) => (
                        <MedicineCard key={medicine.id} medicine={medicine} />
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="home-user__empty">No medicines match your search.</div>
                )}
            </div>
        </div>
    );
}