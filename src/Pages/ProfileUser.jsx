import { useState } from 'react';
import './ProfileUser.css';

// Replace with real data (e.g. from API / auth context)
const USER = {
    name: 'Sara Ahmed',
    initials: 'SA',
    phone: '01012345678',
    address: '12 El-Nasr St, Cairo',
    nid: '298012345678',
};

const RESERVATIONS = [
    {
        id: 'RX-4821',
        medicine: 'Amoxicillin 500mg',
        pharmacy: 'El-Shifa Pharmacy',
        pharmacyType: 'blue',
        date: '2026-06-23',
        price: 45,
        status: 'pending',
        rating: 0,
    },
    {
        id: 'RX-7104',
        medicine: 'Cetirizine 10mg',
        pharmacy: 'El-Shifa Pharmacy',
        pharmacyType: 'blue',
        date: '2026-06-22',
        price: 28,
        status: 'collected',
        rating: 0,
    },
    {
        id: 'RX-2241',
        medicine: 'Ibuprofen 400mg',
        pharmacy: 'Al-Amal Drug Store',
        pharmacyType: 'green',
        date: '2026-06-20',
        price: 18,
        status: 'collected',
        rating: 0,
    },
];

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
    return (
        <div className="profile-user">
            <div className="profile-user__container">
                <div className="profile-user__header-card">
                    <div className="profile-user__identity">
                        <div className="profile-user__avatar">{USER.initials}</div>
                        <div className="profile-user__identity-text">
                            <h2 className="profile-user__name">{USER.name}</h2>
                            <p className="profile-user__contact">
                                {USER.phone} · {USER.address}
                            </p>
                            <p className="profile-user__nid">NID: {USER.nid}•••</p>
                        </div>
                    </div>

                    <button type="button" className="profile-user__edit-button">
                        <span aria-hidden="true">✎</span> Edit Profile
                    </button>
                </div>

                <h2 className="profile-user__section-title">Reservation History</h2>

                <div className="profile-user__reservations">
                    {RESERVATIONS.map((reservation) => (
                        <ReservationCard key={reservation.id} reservation={reservation} />
                    ))}
                </div>
            </div>
        </div>
    );
}