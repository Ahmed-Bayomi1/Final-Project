import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './ProfileUser.css';

// Transform nested Supabase reservation data into format expected by UI
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
        rating: 0,
    };
}

// Extract initials from full name
function getInitials(name) {
    if (!name) return '';
    return name
        .split(' ')
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join('');
}

function StatusBadge({ status }) {
    return (
        <span className={`profile-user__status profile-user__status--${status}`}>
            {status}
        </span>
    );
}

function StarRating({ rating = 0, onRate }) {
    return (
        <div className="profile-user__stars" aria-label="Rate this order">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className="profile-user__star"
                    onClick={() => onRate?.(star)}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                    {star <= rating ? '★' : '☆'}
                </button>
            ))}
        </div>
    );
}

function ReservationCard({ reservation }) {
    const [rating, setRating] = useState(reservation.rating);
    const showStars = reservation.status === 'collected';

    return (
        <div className="profile-user__reservation-card">
            <div className="profile-user__reservation-main">
                <h3 className="profile-user__medicine-name">{reservation.medicine}</h3>
                <div className="profile-user__reservation-meta">
                    <span
                        className={`profile-user__pharmacy-badge profile-user__pharmacy-badge--${reservation.pharmacyType}`}
                    >
                        <span className="profile-user__pharmacy-icon">🏬</span>
                        {reservation.pharmacy}
                    </span>
                    <span className="profile-user__meta-text">
                        {reservation.date} · {reservation.id}
                    </span>
                </div>
            </div>

            <div className="profile-user__reservation-side">
                <span className="profile-user__price">{reservation.price} EGP</span>
                <StatusBadge status={reservation.status} />
                {showStars && <StarRating rating={rating} onRate={setRating} />}
            </div>
        </div>
    );
}

export default function ProfileUser() {
    const [user, setUser] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchUserData() {
            try {
                setLoading(true);
                setError(null);

                // Get current authenticated user
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
                if (authError || !authUser) {
                    setError('Not authenticated');
                    setUser(null);
                    setReservations([]);
                    return;
                }

                // Fetch user profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profileError) {
                    throw profileError;
                }

                // Format user data
                const formattedUser = {
                    name: profileData.full_name || 'User',
                    initials: getInitials(profileData.full_name),
                    phone: profileData.phone_number || '',
                    address: profileData.address || '',
                    nid: profileData.national_id || '',
                };
                setUser(formattedUser);

                // Fetch user's reservations with pharmacy and medicine details
                const { data: reservationData, error: reservationError } = await supabase
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
                    .eq('user_id', authUser.id)
                    .order('reservation_date', { ascending: false });

                if (reservationError) {
                    throw reservationError;
                }

                // Transform data for UI
                const transformedReservations = (reservationData || []).map(transformReservation);
                setReservations(transformedReservations);
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(err.message || 'Failed to load profile');
                setUser(null);
                setReservations([]);
            } finally {
                setLoading(false);
            }
        }

        fetchUserData();
    }, []);

    if (loading) {
        return (
            <div className="profile-user">
                <div className="profile-user__container">
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="profile-user">
                <div className="profile-user__container">
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                        Error: {error || 'Failed to load profile'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-user">
            <div className="profile-user__container">
                <div className="profile-user__header-card">
                    <div className="profile-user__identity">
                        <div className="profile-user__avatar">{user.initials}</div>
                        <div className="profile-user__identity-text">
                            <h2 className="profile-user__name">{user.name}</h2>
                            <p className="profile-user__contact">
                                {user.phone} · {user.address}
                            </p>
                            <p className="profile-user__nid">NID: {user.nid}•••</p>
                        </div>
                    </div>

                    <button type="button" className="profile-user__edit-button">
                        <span aria-hidden="true">✎</span> Edit Profile
                    </button>
                </div>

                <h2 className="profile-user__section-title">Reservation History</h2>

                <div className="profile-user__reservations">
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