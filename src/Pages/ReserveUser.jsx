import './ReserveUser.css';

// Replace with real data (e.g. from API / auth context)
const RESERVATIONS = [
    {
        id: 'RX-4821',
        medicine: 'Amoxicillin 500mg',
        pharmacy: 'El-Shifa Pharmacy',
        pharmacyType: 'blue',
        date: '2026-06-23',
        price: 45,
        status: 'pending',
    },
    {
        id: 'RX-7104',
        medicine: 'Cetirizine 10mg',
        pharmacy: 'El-Shifa Pharmacy',
        pharmacyType: 'blue',
        date: '2026-06-22',
        price: 28,
        status: 'collected',
    },
    {
        id: 'RX-2241',
        medicine: 'Ibuprofen 400mg',
        pharmacy: 'Al-Amal Drug Store',
        pharmacyType: 'green',
        date: '2026-06-20',
        price: 18,
        status: 'collected',
    },
];

function getStats(reservations) {
    return {
        pending: reservations.filter((r) => r.status === 'pending').length,
        ready: reservations.filter((r) => r.status === 'ready').length,
        collected: reservations.filter((r) => r.status === 'collected').length,
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
    const stats = getStats(RESERVATIONS);

    return (
        <div className="reserve-user">
            <div className="reserve-user__container">
                <header className="reserve-user__header">
                    <h1 className="reserve-user__title">My Reservations</h1>
                    <p className="reserve-user__subtitle">
                        {RESERVATIONS.length} total reservations
                    </p>
                </header>

                <div className="reserve-user__stats">
                    <StatCard label="PENDING" value={stats.pending} icon="🕐" variant="pending" />
                    <StatCard label="READY FOR PICKUP" value={stats.ready} icon="📦" variant="ready" />
                    <StatCard label="COLLECTED" value={stats.collected} icon="✓" variant="collected" />
                </div>

                <div className="reserve-user__list">
                    {RESERVATIONS.map((reservation) => (
                        <ReservationCard key={reservation.id} reservation={reservation} />
                    ))}
                </div>
            </div>
        </div>
    );
}