    import React, { useState, useMemo } from "react";
    import { Search, Plus, AlertTriangle, Trash2, Check, Building2, MapPin } from "lucide-react";
    import "./PharmacyManagement.css";

    const INITIAL_PHARMACIES = [
    {
        id: 1,
        name: "El-Shifa Pharmacy",
        license: "PHR-2024-001",
        owner: "Dr. Tarek Nasser",
        governorate: "Cairo",
        street: "15 Heliopolis Ave",
        medicines: 7,
        status: "active",
    },
    {
        id: 2,
        name: "Al-Amal Drug Store",
        license: "PHR-2024-002",
        owner: "Dr. Rana Kamal",
        governorate: "Alexandria",
        street: "3 Stanley Blvd",
        medicines: 7,
        status: "active",
    },
    {
        id: 3,
        name: "Cure Medical Pharmacy",
        license: "PHR-2024-003",
        owner: "Dr. Ahmed Farid",
        governorate: "Giza",
        street: "22 Mohandiseen",
        medicines: 4,
        status: "pending",
    },
    ];

    function StatusPill({ status }) {
    const isActive = status === "active";
    return (
        <span className={`pm-status-pill ${isActive ? "pm-status-active" : "pm-status-pending"}`}>
        {isActive ? "active" : "pending"}
        </span>
    );
    }

    export default function PharmacyManagement() {
    const [pharmacies, setPharmacies] = useState(INITIAL_PHARMACIES);
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return pharmacies;
        return pharmacies.filter(
        (p) =>
            p.name.toLowerCase().includes(q) ||
            p.license.toLowerCase().includes(q) ||
            p.owner.toLowerCase().includes(q) ||
            p.governorate.toLowerCase().includes(q)
        );
    }, [pharmacies, query]);

    const pendingCount = pharmacies.filter((p) => p.status === "pending").length;

    function approvePharmacy(id) {
        setPharmacies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "active" } : p))
        );
    }

    function deletePharmacy(id) {
        setPharmacies((prev) => prev.filter((p) => p.id !== id));
    }

    return (
        <div className="pm-page">
        <div className="pm-inner">
            {/* Header */}
            <div className="pm-header">
            <div>
                <h1 className="pm-title">Pharmacy Management</h1>
                <p className="pm-subtitle">
                {pharmacies.length} pharmac{pharmacies.length !== 1 ? "ies" : "y"}
                {pendingCount > 0 && ` · ${pendingCount} pending approval`}
                </p>
            </div>
            <button className="pm-btn-primary">
                <Plus className="pm-icon" />
                Register Pharmacy
            </button>
            </div>

            {/* Pending approval banner */}
            {pendingCount > 0 && (
            <div className="pm-alert">
                <AlertTriangle className="pm-icon" />
                <span>
                {pendingCount} pharmacy application{pendingCount !== 1 ? "s" : ""} awaiting approval
                </span>
            </div>
            )}

            {/* Card container */}
            <div className="pm-card">
            {/* Search */}
            <div className="pm-search-wrap">
                <div className="pm-search">
                <Search className="pm-search-icon" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search pharmacies..."
                    className="pm-search-input"
                />
                </div>
            </div>

            {/* Desktop / tablet table */}
            <div className="pm-table-wrap">
                <table className="pm-table">
                <thead>
                    <tr>
                    <th>Pharmacy name</th>
                    <th>License no.</th>
                    <th>Owner</th>
                    <th>Governorate</th>
                    <th>Street</th>
                    <th className="pm-align-right">Medicines</th>
                    <th>Status</th>
                    <th className="pm-align-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((p) => (
                    <tr key={p.id}>
                        <td>
                        <div className="pm-name-cell">
                            <div className="pm-icon-badge">
                            <Building2 className="pm-badge-icon" />
                            </div>
                            <span className="pm-name">{p.name}</span>
                        </div>
                        </td>
                        <td className="pm-mono">{p.license}</td>
                        <td>{p.owner}</td>
                        <td className="pm-link-text">{p.governorate}</td>
                        <td className="pm-link-text pm-truncate">{p.street}</td>
                        <td className="pm-align-right pm-medicines">{p.medicines}</td>
                        <td>
                        <StatusPill status={p.status} />
                        </td>
                        <td>
                        <div className="pm-actions">
                            {p.status === "pending" && (
                            <button
                                className="pm-btn-approve"
                                onClick={() => approvePharmacy(p.id)}
                            >
                                <Check className="pm-icon-sm" />
                                Approve
                            </button>
                            )}
                            <button
                            aria-label={`Delete ${p.name}`}
                            className="pm-icon-btn pm-icon-btn--danger"
                            onClick={() => deletePharmacy(p.id)}
                            >
                            <Trash2 className="pm-icon-sm" />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                    {filtered.length === 0 && (
                    <tr>
                        <td colSpan={8} className="pm-empty">
                        No pharmacies match your search.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>

            {/* Mobile card list */}
            <div className="pm-cards">
                {filtered.map((p) => (
                <div key={p.id} className="pm-mobile-card">
                    <div className="pm-mobile-card__top">
                    <div className="pm-name-cell">
                        <div className="pm-icon-badge">
                        <Building2 className="pm-badge-icon" />
                        </div>
                        <div>
                        <p className="pm-name">{p.name}</p>
                        <p className="pm-mono pm-mobile-license">{p.license}</p>
                        </div>
                    </div>
                    <StatusPill status={p.status} />
                    </div>

                    <div className="pm-mobile-grid">
                    <div className="pm-mobile-field">Owner: {p.owner}</div>
                    <div className="pm-mobile-field pm-link-text">{p.governorate}</div>
                    <div className="pm-mobile-field pm-mobile-field--full pm-link-text">
                        <MapPin className="pm-mobile-field-icon" />
                        <span className="pm-truncate">{p.street}</span>
                    </div>
                    </div>

                    <div className="pm-mobile-footer">
                    <span className="pm-mobile-medicines">
                        <strong>{p.medicines}</strong> medicines
                    </span>
                    <div className="pm-actions">
                        {p.status === "pending" && (
                        <button
                            className="pm-btn-approve"
                            onClick={() => approvePharmacy(p.id)}
                        >
                            <Check className="pm-icon-sm" />
                            Approve
                        </button>
                        )}
                        <button
                        aria-label={`Delete ${p.name}`}
                        className="pm-icon-btn pm-icon-btn--danger"
                        onClick={() => deletePharmacy(p.id)}
                        >
                        <Trash2 className="pm-icon-sm" />
                        </button>
                    </div>
                    </div>
                </div>
                ))}
                {filtered.length === 0 && (
                <div className="pm-empty pm-empty--mobile">No pharmacies match your search.</div>
                )}
            </div>
            </div>
        </div>
        </div>
    );
    }