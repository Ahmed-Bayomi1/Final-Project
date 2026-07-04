import { useMemo, useState } from 'react';
import './SearchUser.css';

// Replace with real data (e.g. from API)
const MEDICINES = [
    {
        id: 1,
        name: 'Amoxicillin 500mg',
        description: 'Broad-spectrum antibiotic for...',
        category: 'Antibiotics',
        pharmacy: 'El-Shifa Pharmacy',
        pharmacyType: 'blue',
        price: 45,
        stock: 120,
        status: 'in_stock',
    },
    {
        id: 2,
        name: 'Paracetamol 1g',
        description: 'Pain relief and fever reduction',
        category: 'Analgesics',
        pharmacy: 'El-Shifa Pharmacy',
        pharmacyType: 'blue',
        price: 12,
        stock: 340,
        status: 'in_stock',
    },
    {
        id: 3,
        name: 'Omeprazole 20mg',
        description: 'Proton pump inhibitor for acid...',
        category: 'Gastro',
        pharmacy: 'El-Shifa Pharmacy',
        pharmacyType: 'blue',
        price: 78,
        stock: 88,
        status: 'in_stock',
    },
    {
        id: 4,
        name: 'Metformin 850mg',
        description: 'First-line medication for type ...',
        category: 'Diabetes',
        pharmacy: 'El-Shifa Pharmacy',
        pharmacyType: 'blue',
        price: 55,
        stock: 0,
        status: 'out_of_stock',
    },
    {
        id: 5,
        name: 'Atorvastatin 40mg',
        description: 'Cholesterol-lowering statin th...',
        category: 'Cardiology',
        pharmacy: 'El-Shifa Pharmacy',
        pharmacyType: 'blue',
        price: 132,
        stock: 60,
        status: 'in_stock',
    },
    {
        id: 6,
        name: 'Cetirizine 10mg',
        description: 'Antihistamine for allergy relief',
        category: 'Antihistamines',
        pharmacy: 'El-Shifa Pharmacy',
        pharmacyType: 'blue',
        price: 28,
        stock: 210,
        status: 'in_stock',
    },
];

const CATEGORIES = [
    'All',
    'Antibiotics',
    'Analgesics',
    'Gastro',
    'Cardiology',
    'Diabetes',
    'Antihistamines',
];

function StatusPill({ status }) {
    return status === 'in_stock' ? (
        <span className="search-user__status search-user__status--in-stock">
            <span aria-hidden="true">✓</span> In Stock
        </span>
    ) : (
        <span className="search-user__status search-user__status--out-of-stock">
            <span aria-hidden="true">⊘</span> Out of Stock
        </span>
    );
}

function MedicineRow({ medicine }) {
    const available = medicine.status === 'in_stock';
    return (
        <tr className="search-user__row">
            <td data-label="Medicine">
                <div className="search-user__medicine-cell">
                    <span className="search-user__medicine-name">{medicine.name}</span>
                    <span className="search-user__medicine-desc">{medicine.description}</span>
                </div>
            </td>
            <td data-label="Category">
                <span className="search-user__category-badge">{medicine.category}</span>
            </td>
            <td data-label="Pharmacy">
                <span
                    className={`search-user__pharmacy-badge search-user__pharmacy-badge--${medicine.pharmacyType}`}
                >
                    <span className="search-user__pharmacy-icon">🏬</span>
                    {medicine.pharmacy}
                </span>
            </td>
            <td data-label="Price">
                <span className="search-user__price">{medicine.price} EGP</span>
            </td>
            <td data-label="Stock">
                <span
                    className={`search-user__stock ${
                        medicine.stock === 0 ? 'search-user__stock--zero' : ''
                    }`}
                >
                    {medicine.stock}
                </span>
            </td>
            <td data-label="Status">
                <StatusPill status={medicine.status} />
            </td>
            <td data-label="Action">
                {available ? (
                    <button type="button" className="search-user__reserve-button">
                        Reserve
                    </button>
                ) : (
                    <button type="button" className="search-user__unavailable-button" disabled>
                        Unavailable
                    </button>
                )}
            </td>
        </tr>
    );
}

export default function SearchUser() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [availability, setAvailability] = useState('all');

    const pharmacyCount = useMemo(
        () => new Set(MEDICINES.map((m) => m.pharmacy)).size,
        []
    );

    const filtered = useMemo(() => {
        return MEDICINES.filter((m) => {
            const matchesQuery =
                query.trim() === '' ||
                m.name.toLowerCase().includes(query.toLowerCase()) ||
                m.category.toLowerCase().includes(query.toLowerCase()) ||
                m.pharmacy.toLowerCase().includes(query.toLowerCase());

            const matchesCategory = category === 'All' || m.category === category;

            const matchesAvailability =
                availability === 'all' ||
                (availability === 'in_stock' && m.status === 'in_stock') ||
                (availability === 'out_of_stock' && m.status === 'out_of_stock');

            return matchesQuery && matchesCategory && matchesAvailability;
        });
    }, [query, category, availability]);

    return (
        <div className="search-user">
            <div className="search-user__container">
                <header className="search-user__header">
                    <h1 className="search-user__title">Medicine Search</h1>
                    <p className="search-user__subtitle">
                        Compare medicines across {pharmacyCount} pharmacies · {MEDICINES.length} listings
                    </p>
                </header>

                <div className="search-user__controls">
                    <div className="search-user__search-box">
                        <span className="search-user__search-icon" aria-hidden="true">🔍</span>
                        <input
                            type="text"
                            className="search-user__search-input"
                            placeholder="Search by medicine name, category, or pharmacy..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="search-user__availability-select"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                    >
                        <option value="all">All Availability</option>
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>
                </div>

                <div className="search-user__categories">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            className={`search-user__category-pill ${
                                category === cat ? 'search-user__category-pill--active' : ''
                            }`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="search-user__table-card">
                    <table className="search-user__table">
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Category</th>
                                <th>Pharmacy</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((medicine) => (
                                <MedicineRow key={medicine.id} medicine={medicine} />
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className="search-user__empty">No medicines match your search.</div>
                    )}
                </div>
            </div>
        </div>
    );
}