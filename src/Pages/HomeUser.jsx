import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import ReservationModal from '../components/ReservationModal';
import './HomeUser.css';

const CATEGORIES = [
    'All',
    'Antibiotics',
    'Analgesics',
    'Gastro',
    'Cardiology',
    'Diabetes',
    'Antihistamines',
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

function MedicineCard({ medicineItem, onReserveClick }) {
    // Determine status based on quantity
    let status = 'out_of_stock';
    if (medicineItem.quantity_in_stock > 10) {
        status = 'in_stock';
    } else if (medicineItem.quantity_in_stock > 0) {
        status = 'low_stock';
    }

    const available = status !== 'out_of_stock';

    return (
        <div className="home-user__medicine-card">
            <div className="home-user__medicine-top">
                <div>
                    <h3 className="home-user__medicine-name">
                        {medicineItem.medicines.name}
                    </h3>
                    <span className="home-user__medicine-category">
                        {medicineItem.medicines.dosage}
                    </span>
                </div>
                <StatusBadge status={status} />
            </div>

            <p className="home-user__medicine-desc">
                {medicineItem.medicines.description}
            </p>

            <span className="home-user__pharmacy-badge">
                <span className="home-user__pharmacy-icon">🏬</span>
                {medicineItem.pharmacies.name}
            </span>

            <div className="home-user__medicine-bottom">
                <span className="home-user__medicine-price">
                    {medicineItem.price_per_unit.toFixed(2)}
                    <span className="home-user__medicine-currency">EGP</span>
                </span>
                {available ? (
                    <button
                        type="button"
                        className="home-user__reserve-button"
                        onClick={() => onReserveClick(medicineItem)}
                    >
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
    const { user } = useOutletContext() || {};

    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Reservation statistics
    const [reservationStats, setReservationStats] = useState({
        total: 0,
        pendingPickups: 0,
        collected: 0,
    });

    // Fetch inventory data with joins
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch pharmacy_medicines with joins
                const { data: inventoryData, error: inventoryError } = await supabase
                    .from('pharmacy_medicines')
                    .select(`
                        id,
                        pharmacy_id,
                        medicine_id,
                        quantity_in_stock,
                        price_per_unit,
                        is_available,
                        pharmacies(id, name, address),
                        medicines(id, name, dosage, description, requires_prescription, unit)
                    `)
                    .eq('is_available', true)
                    .gt('quantity_in_stock', 0)
                    .limit(12);

                if (inventoryError) throw inventoryError;
                setMedicines(inventoryData || []);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to load medicines.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch reservation statistics for authenticated user
    useEffect(() => {
        const fetchReservationStats = async () => {
            try {
                // Get current authenticated user
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
                if (authError || !authUser) {
                    // User not authenticated, set stats to 0
                    setReservationStats({ total: 0, pendingPickups: 0, collected: 0 });
                    return;
                }

                // Fetch user's reservations
                const { data: reservations, error: fetchError } = await supabase
                    .from('reservations')
                    .select('id, status')
                    .eq('user_id', authUser.id);

                if (fetchError) {
                    console.error('Error fetching reservation stats:', fetchError);
                    setReservationStats({ total: 0, pendingPickups: 0, collected: 0 });
                    return;
                }

                // Compute statistics
                const reservationList = reservations || [];
                const stats = {
                    total: reservationList.length,
                    pendingPickups: reservationList.filter(r => 
                        ['pending', 'confirmed', 'ready'].includes(r.status)
                    ).length,
                    collected: reservationList.filter(r => r.status === 'collected').length,
                };

                setReservationStats(stats);
            } catch (err) {
                console.error('Fetch reservation stats error:', err);
                setReservationStats({ total: 0, pendingPickups: 0, collected: 0 });
            }
        };

        fetchReservationStats();
    }, []);

    // Filter medicines
    const filtered = useMemo(() => {
        return medicines.filter((item) => {
            const matchesQuery =
                query.trim() === '' ||
                item.medicines.name.toLowerCase().includes(query.toLowerCase());
            return matchesQuery;
        });
    }, [query, medicines]);

    // Handle reserve button click
    const handleReserveClick = (medicineItem) => {
        if (!user) {
            alert('Please log in to make a reservation.');
            return;
        }
        setSelectedMedicine(medicineItem);
        setShowModal(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedMedicine(null);
    };

    // Handle successful reservation
    const handleReservationSuccess = (message) => {
        setSuccessMessage(message);
        setShowModal(false);
        setSelectedMedicine(null);
        
        // Clear success message after 4 seconds
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    const userName = user?.full_name || 'User';

    return (
        <div className="home-user">
            <div className="home-user__container">
                <section className="home-user__hero">
                    <p className="home-user__greeting">
                        {getGreeting()}, {userName} 👋
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
                        value={reservationStats.total}
                        icon="📋"
                        variant="reservations"
                    />
                    <StatCard
                        label="PENDING PICKUPS"
                        value={reservationStats.pendingPickups}
                        icon="🕐"
                        variant="pending"
                        note="Show pickup code at pharmacy"
                    />
                    <StatCard
                        label="COLLECTED"
                        value={reservationStats.collected}
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

                {successMessage && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        fontWeight: '500',
                        backgroundColor: '#f0f9ff',
                        color: '#1e7e34',
                        borderLeft: '4px solid #1e7e34',
                        animation: 'slideIn 0.3s ease-out'
                    }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>✓</span>
                        <span>{successMessage}</span>
                    </div>
                )}

                <div className="home-user__section-header">
                    <h2 className="home-user__section-title">Available Medicines</h2>
                    <a href="/search" className="home-user__view-all">
                        View all <span aria-hidden="true">›</span>
                    </a>
                </div>

                {loading && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px 20px',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #e0e0e0',
                            borderTopColor: '#667eea',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
                            Loading medicines...
                        </p>
                    </div>
                )}

                {!loading && error && (
                    <div style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        fontWeight: '500',
                        backgroundColor: '#fff1f0',
                        color: '#d9534f',
                        borderLeft: '4px solid #d9534f'
                    }}>
                        {error}
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="home-user__medicines-grid">
                        {filtered.map((medicineItem) => (
                            <MedicineCard
                                key={medicineItem.id}
                                medicineItem={medicineItem}
                                onReserveClick={handleReserveClick}
                            />
                        ))}
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="home-user__empty">No medicines match your search.</div>
                )}

                {showModal && selectedMedicine && (
                    <ReservationModal
                        medicineItem={selectedMedicine}
                        user={user}
                        onClose={handleCloseModal}
                        onSuccess={handleReservationSuccess}
                    />
                )}
            </div>

            <style>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}