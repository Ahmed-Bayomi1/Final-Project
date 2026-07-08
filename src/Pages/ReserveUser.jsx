import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './ReserveUser.css';

function getStats(reservations) {
    return {
        pending: reservations.filter((r) => r.status === 'pending').length,
        ready: reservations.filter((r) => r.status === 'ready').length,
        collected: reservations.filter((r) => r.status === 'collected').length,
    };
}

// Transform nested Supabase data into format expected by UI
function transformReservation(data) {
    const medicines = data.reservation_items.map(item => 
        `${item.medicines.name} ${item.medicines.dosage}`
    ).join(', ');
    
    const totalPrice = data.reservation_items.reduce((sum, item) => 
        sum + (item.subtotal || item.quantity_requested * item.unit_price), 0
    );

    return {
        id: data.id,
        medicine: medicines,
        pharmacy: data.pharmacies?.name || 'Unknown Pharmacy',
        pharmacyType: 'blue', // Default color, can be customized based on pharmacy category
        date: new Date(data.reservation_date).toISOString().split('T')[0],
        price: totalPrice,
        status: data.status,
    };
}

function StatCard({ label, value, icon, variant }) {
    return (
        <div className="reserve-user__stat-card">
            <div className="reserve-user__stat-top">
                <span className="reserve-user__stat-label">{label}</span>
                <span className={`reserve-user__stat-icon reserve-user__stat-icon--${variant}`}>
                    {icon}
                </span>
            </div>
            <span className="reserve-user__stat-value">{value}</span>
        </div>
    );
}

function StatusBadge({ status }) {
    const labels = {
        pending: 'pending',
        ready: 'ready for pickup',
        collected: 'collected',
    };
    return (
        <span className={`reserve-user__badge reserve-user__badge--${status}`}>
            {labels[status]}
        </span>
    );
}

function ReservationCard({ reservation }) {
    return (
        <div className="reserve-user__card">
            <div className="reserve-user__card-main">
                <div className="reserve-user__name-row">
                    <h3 className="reserve-user__medicine-name">{reservation.medicine}</h3>
                    <StatusBadge status={reservation.status} />
                </div>

                <span
                    className={`reserve-user__pharmacy-badge reserve-user__pharmacy-badge--${reservation.pharmacyType}`}
                >
                    <span className="reserve-user__pharmacy-icon">🏬</span>
                    {reservation.pharmacy}
                </span>

                <span className="reserve-user__date">{reservation.date}</span>
            </div>

            <div className="reserve-user__card-side">
                <span className="reserve-user__price">{reservation.price} EGP</span>

                {reservation.status === 'pending' ? (
                    <div className="reserve-user__pickup-box">
                        <span className="reserve-user__pickup-label">PICKUP CODE</span>
                        <span className="reserve-user__pickup-code">{reservation.id}</span>
                    </div>
                ) : reservation.status === 'collected' ? (
                    <span className="reserve-user__collected-pill">
                        <span aria-hidden="true">✓</span> Collected
                    </span>
                ) : null}
            </div>
        </div>
    );
}

export default function ReserveUser() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchReservations() {
            try {
                setLoading(true);
                setError(null);

                // Get current authenticated user
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    setError('Not authenticated');
                    setReservations([]);
                    return;
                }

                // Fetch reservations with pharmacy and medicine details
                const { data, error: fetchError } = await supabase
                    .from('reservations')
                    .select(`
                        *,
                        pharmacies(name),
                        reservation_items(
                            quantity_requested,
                            unit_price,
                            subtotal,
                            medicines(name, dosage)
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('reservation_date', { ascending: false });

                if (fetchError) {
                    throw fetchError;
                }

                // Transform data for UI
                const transformedData = (data || []).map(transformReservation);
                setReservations(transformedData);
            } catch (err) {
                console.error('Error fetching reservations:', err);
                setError(err.message || 'Failed to load reservations');
                setReservations([]);
            } finally {
                setLoading(false);
            }
        }

        fetchReservations();
    }, []);

    const stats = getStats(reservations);

    if (loading) {
        return (
            <div className="reserve-user">
                <div className="reserve-user__container">
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Loading reservations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reserve-user">
                <div className="reserve-user__container">
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reserve-user">
            <div className="reserve-user__container">
                <header className="reserve-user__header">
                    <h1 className="reserve-user__title">My Reservations</h1>
                    <p className="reserve-user__subtitle">
                        {reservations.length} total reservations
                    </p>
                </header>

                <div className="reserve-user__stats">
                    <StatCard label="PENDING" value={stats.pending} icon="🕐" variant="pending" />
                    <StatCard label="READY FOR PICKUP" value={stats.ready} icon="📦" variant="ready" />
                    <StatCard label="COLLECTED" value={stats.collected} icon="✓" variant="collected" />
                </div>

                <div className="reserve-user__list">
                    {reservations.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                            No reservations yet
                        </p>
                    ) : (
                        reservations.map((reservation) => (
                            <ReservationCard key={reservation.id} reservation={reservation} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}