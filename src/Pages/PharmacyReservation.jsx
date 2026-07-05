    import { useState, useMemo } from "react";
    import "./PharmacyReservation.css";

    // Mock data — replace with real API calls once the backend endpoint is ready.
    const INITIAL_RESERVATIONS = [
    {
        id: 1,
        pickupCode: "RX-4821",
        medicine: "Amoxicillin 500mg",
        patient: "Sara Ahmed",
        phone: "01012345678",
        date: "2026-06-23",
        price: 45,
        status: "pending",
    },
    {
        id: 2,
        pickupCode: "RX-7104",
        medicine: "Cetirizine 10mg",
        patient: "Sara Ahmed",
        phone: "01012345678",
        date: "2026-06-22",
        price: 28,
        status: "collected",
    },
    {
        id: 3,
        pickupCode: "RX-5567",
        medicine: "Atorvastatin 40mg",
        patient: "Khaled Mostafa",
        phone: "01234567890",
        date: "2026-06-23",
        price: 132,
        status: "pending",
    },
    ];

    const STATUS_LABEL = {
    pending: "pending",
    ready: "ready",
    collected: "collected",
    };

    // Defines what action button (if any) shows for each status, and what status it moves to.
    const NEXT_STATUS = {
    pending: { label: "Mark Ready", next: "ready" },
    ready: { label: "Mark Collected", next: "collected" },
    collected: null,
    };

    function Icon({ type }) {
    switch (type) {
        case "clock":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
            </svg>
        );
        case "box":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
            <path d="M4.5 7.5L12 12l7.5-4.5" />
            <line x1="12" y1="12" x2="12" y2="21" />
            </svg>
        );
        case "check":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l2.5 2.5L16 9.5" />
            </svg>
        );
        case "search":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.2" y2="16.2" />
            </svg>
        );
        default:
        return null;
    }
    }

    function PharmacyReservation() {
    const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
    const [searchTerm, setSearchTerm] = useState("");

    const counts = useMemo(
        () => ({
        pending: reservations.filter((r) => r.status === "pending").length,
        ready: reservations.filter((r) => r.status === "ready").length,
        collected: reservations.filter((r) => r.status === "collected").length,
        }),
        [reservations]
    );

    const filteredReservations = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return reservations;
        return reservations.filter(
        (r) =>
            r.pickupCode.toLowerCase().includes(term) ||
            r.patient.toLowerCase().includes(term) ||
            r.medicine.toLowerCase().includes(term)
        );
    }, [reservations, searchTerm]);

    const advanceStatus = (id) => {
        setReservations((prev) =>
        prev.map((r) => {
            if (r.id !== id) return r;
            const step = NEXT_STATUS[r.status];
            return step ? { ...r, status: step.next } : r;
        })
        );
    };

    return (
        <div className="pharmacy-reservation">
        <header className="pharmacy-reservation__header">
            <h1 className="pharmacy-reservation__title">Reservations</h1>
            <p className="pharmacy-reservation__subtitle">
            {counts.pending + counts.ready} active reservations
            </p>
        </header>

        <section className="pharmacy-reservation__stats">
            <div className="pharmacy-reservation__stat-card">
            <div className="pharmacy-reservation__stat-top">
                <span className="pharmacy-reservation__stat-label">Pending</span>
                <span className="pharmacy-reservation__stat-icon pharmacy-reservation__stat-icon--amber">
                <Icon type="clock" />
                </span>
            </div>
            <div className="pharmacy-reservation__stat-value">{counts.pending}</div>
            </div>

            <div className="pharmacy-reservation__stat-card">
            <div className="pharmacy-reservation__stat-top">
                <span className="pharmacy-reservation__stat-label">Ready</span>
                <span className="pharmacy-reservation__stat-icon pharmacy-reservation__stat-icon--blue">
                <Icon type="box" />
                </span>
            </div>
            <div className="pharmacy-reservation__stat-value">{counts.ready}</div>
            </div>

            <div className="pharmacy-reservation__stat-card">
            <div className="pharmacy-reservation__stat-top">
                <span className="pharmacy-reservation__stat-label">Collected</span>
                <span className="pharmacy-reservation__stat-icon pharmacy-reservation__stat-icon--green">
                <Icon type="check" />
                </span>
            </div>
            <div className="pharmacy-reservation__stat-value">{counts.collected}</div>
            </div>
        </section>

        <section className="pharmacy-reservation__panel">
            <div className="pharmacy-reservation__search-wrap">
            <span className="pharmacy-reservation__search-icon">
                <Icon type="search" />
            </span>
            <input
                type="text"
                className="pharmacy-reservation__search-input"
                placeholder="Search by pickup code, patient name, or medicine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>

            {/* Desktop / tablet table */}
            <div className="pharmacy-reservation__table-wrap">
            <table className="pharmacy-reservation__table">
                <thead>
                <tr>
                    <th>Pickup Code</th>
                    <th>Medicine</th>
                    <th>Patient</th>
                    <th>Phone</th>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {filteredReservations.map((r) => {
                    const step = NEXT_STATUS[r.status];
                    return (
                    <tr key={r.id}>
                        <td className="pharmacy-reservation__code">{r.pickupCode}</td>
                        <td className="pharmacy-reservation__medicine">{r.medicine}</td>
                        <td className="pharmacy-reservation__patient">{r.patient}</td>
                        <td className="pharmacy-reservation__phone">{r.phone}</td>
                        <td className="pharmacy-reservation__date">{r.date}</td>
                        <td className="pharmacy-reservation__price">{r.price} EGP</td>
                        <td>
                        <span
                            className={`pharmacy-reservation__status pharmacy-reservation__status--${r.status}`}
                        >
                            {STATUS_LABEL[r.status]}
                        </span>
                        </td>
                        <td>
                        {step && (
                            <button
                            type="button"
                            className="pharmacy-reservation__action-btn"
                            onClick={() => advanceStatus(r.id)}
                            >
                            {step.label}
                            </button>
                        )}
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>

            {filteredReservations.length === 0 && (
                <p className="pharmacy-reservation__empty">
                No reservations match "{searchTerm}".
                </p>
            )}
            </div>

            {/* Mobile stacked cards */}
            <div className="pharmacy-reservation__cards">
            {filteredReservations.map((r) => {
                const step = NEXT_STATUS[r.status];
                return (
                <div key={r.id} className="pharmacy-reservation__card">
                    <div className="pharmacy-reservation__card-top">
                    <span className="pharmacy-reservation__code">{r.pickupCode}</span>
                    <span
                        className={`pharmacy-reservation__status pharmacy-reservation__status--${r.status}`}
                    >
                        {STATUS_LABEL[r.status]}
                    </span>
                    </div>

                    <div className="pharmacy-reservation__medicine">{r.medicine}</div>

                    <div className="pharmacy-reservation__card-grid">
                    <div>
                        <span className="pharmacy-reservation__card-label">Patient</span>
                        <span>{r.patient}</span>
                    </div>
                    <div>
                        <span className="pharmacy-reservation__card-label">Phone</span>
                        <span>{r.phone}</span>
                    </div>
                    <div>
                        <span className="pharmacy-reservation__card-label">Date</span>
                        <span>{r.date}</span>
                    </div>
                    <div>
                        <span className="pharmacy-reservation__card-label">Price</span>
                        <span className="pharmacy-reservation__price">{r.price} EGP</span>
                    </div>
                    </div>

                    {step && (
                    <button
                        type="button"
                        className="pharmacy-reservation__action-btn pharmacy-reservation__action-btn--full"
                        onClick={() => advanceStatus(r.id)}
                    >
                        {step.label}
                    </button>
                    )}
                </div>
                );
            })}

            {filteredReservations.length === 0 && (
                <p className="pharmacy-reservation__empty">
                No reservations match "{searchTerm}".
                </p>
            )}
            </div>
        </section>
        </div>
    );
    }

    export default PharmacyReservation;