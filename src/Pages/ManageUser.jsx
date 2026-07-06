    import React, { useState, useMemo } from "react";
    import { Search, Filter, Download, Eye, X, Check, MapPin, Phone } from "lucide-react";
    import "./ManageUser.css";

    const INITIAL_USERS = [
    {
        id: 1,
        name: "Sara Ahmed",
        nid: "29801234567890",
        phone: "01012345678",
        dob: "1998-03-14",
        address: "12 El-Nasr St, Cairo",
        reservations: 8,
        status: "active",
    },
    {
        id: 2,
        name: "Mohamed Hassan",
        nid: "30012345678901",
        phone: "01098765432",
        dob: "2000-07-22",
        address: "45 Tahrir Sq, Cairo",
        reservations: 3,
        status: "active",
    },
    {
        id: 3,
        name: "Nour Ibrahim",
        nid: "29512345678901",
        phone: "01155443322",
        dob: "1995-11-05",
        address: "7 Corniche, Alexandria",
        reservations: 1,
        status: "suspended",
    },
    {
        id: 4,
        name: "Khaled Mostafa",
        nid: "29001234567890",
        phone: "01234567890",
        dob: "1990-01-30",
        address: "88 Port Said Rd, Ismailia",
        reservations: 12,
        status: "active",
    },
    ];

    function maskNid(nid) {
    return nid.slice(0, 8) + "\u2022".repeat(6);
    }

    function initials(name) {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }

    const AVATAR_CLASSES = ["avatar-indigo", "avatar-blue", "avatar-violet", "avatar-sky"];

    function StatusPill({ status }) {
    const isActive = status === "active";
    return (
        <span className={`status-pill ${isActive ? "status-active" : "status-suspended"}`}>
        {isActive ? "active" : "suspended"}
        </span>
    );
    }

    export default function ManageUser() {
    const [users, setUsers] = useState(INITIAL_USERS);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [filterOpen, setFilterOpen] = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return users.filter((u) => {
        const matchesQuery =
            !q ||
            u.name.toLowerCase().includes(q) ||
            u.nid.includes(q) ||
            u.phone.includes(q);
        const matchesStatus = statusFilter === "all" || u.status === statusFilter;
        return matchesQuery && matchesStatus;
        });
    }, [users, query, statusFilter]);

    function toggleStatus(id) {
        setUsers((prev) =>
        prev.map((u) =>
            u.id === id
            ? { ...u, status: u.status === "active" ? "suspended" : "active" }
            : u
        )
        );
    }

    function handleExport() {
        const header = ["Name", "NID", "Phone", "DOB", "Address", "Reservations", "Status"];
        const rows = filtered.map((u) => [
        u.name,
        u.nid,
        u.phone,
        u.dob,
        u.address,
        u.reservations,
        u.status,
        ]);
        const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="manage-user">
        <div className="manage-user__inner">
            {/* Header */}
            <div className="mu-header">
            <div>
                <h1 className="mu-title">User Management</h1>
                <p className="mu-subtitle">
                {filtered.length} registered user{filtered.length !== 1 ? "s" : ""}
                </p>
            </div>
            <div className="mu-header-actions">
                <button onClick={handleExport} className="btn btn-outline">
                <Download className="icon" />
                Export
                </button>
                <div className="mu-filter-wrap">
                <button
                    onClick={() => setFilterOpen((o) => !o)}
                    className="btn btn-outline"
                >
                    <Filter className="icon" />
                    Filter
                </button>
                {filterOpen && (
                    <div className="mu-filter-menu">
                    {["all", "active", "suspended"].map((opt) => (
                        <button
                        key={opt}
                        onClick={() => {
                            setStatusFilter(opt);
                            setFilterOpen(false);
                        }}
                        className={`mu-filter-option ${
                            statusFilter === opt ? "mu-filter-option--active" : ""
                        }`}
                        >
                        {opt}
                        </button>
                    ))}
                    </div>
                )}
                </div>
            </div>
            </div>

            {/* Card container */}
            <div className="mu-card">
            {/* Search */}
            <div className="mu-search-wrap">
                <div className="mu-search">
                <Search className="mu-search-icon" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, NID, or phone..."
                    className="mu-search-input"
                />
                </div>
            </div>

            {/* Desktop / tablet table */}
            <div className="mu-table-wrap">
                <table className="mu-table">
                <thead>
                    <tr>
                    <th>User</th>
                    <th>NID</th>
                    <th>Phone</th>
                    <th>Date of birth</th>
                    <th>Address</th>
                    <th className="mu-align-right">Reservations</th>
                    <th>Status</th>
                    <th className="mu-align-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((u, i) => (
                    <tr key={u.id}>
                        <td>
                        <div className="mu-user-cell">
                            <div className={`mu-avatar ${AVATAR_CLASSES[i % AVATAR_CLASSES.length]}`}>
                            {initials(u.name)}
                            </div>
                            <span className="mu-user-name">{u.name}</span>
                        </div>
                        </td>
                        <td className="mu-mono">{maskNid(u.nid)}</td>
                        <td>{u.phone}</td>
                        <td>{u.dob}</td>
                        <td className="mu-truncate">{u.address}</td>
                        <td className="mu-align-right mu-reservations">{u.reservations}</td>
                        <td>
                        <StatusPill status={u.status} />
                        </td>
                        <td>
                        <div className="mu-actions">
                            <button aria-label={`View ${u.name}`} className="mu-icon-btn mu-icon-btn--view">
                            <Eye className="icon" />
                            </button>
                            <button
                            onClick={() => toggleStatus(u.id)}
                            aria-label={
                                u.status === "active" ? `Suspend ${u.name}` : `Reactivate ${u.name}`
                            }
                            className={`mu-icon-btn ${
                                u.status === "active" ? "mu-icon-btn--danger" : "mu-icon-btn--success"
                            }`}
                            >
                            {u.status === "active" ? (
                                <X className="icon" />
                            ) : (
                                <Check className="icon" />
                            )}
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                    {filtered.length === 0 && (
                    <tr>
                        <td colSpan={8} className="mu-empty">
                        No users match your search.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>

            {/* Mobile card list */}
            <div className="mu-cards">
                {filtered.map((u, i) => (
                <div key={u.id} className="mu-mobile-card">
                    <div className="mu-mobile-card__top">
                    <div className="mu-user-cell">
                        <div className={`mu-avatar mu-avatar--lg ${AVATAR_CLASSES[i % AVATAR_CLASSES.length]}`}>
                        {initials(u.name)}
                        </div>
                        <div>
                        <p className="mu-user-name">{u.name}</p>
                        <p className="mu-mono mu-mobile-nid">{maskNid(u.nid)}</p>
                        </div>
                    </div>
                    <StatusPill status={u.status} />
                    </div>

                    <div className="mu-mobile-grid">
                    <div className="mu-mobile-field">
                        <Phone className="mu-mobile-field-icon" />
                        {u.phone}
                    </div>
                    <div className="mu-mobile-field">DOB: {u.dob}</div>
                    <div className="mu-mobile-field mu-mobile-field--full">
                        <MapPin className="mu-mobile-field-icon" />
                        <span className="mu-truncate">{u.address}</span>
                    </div>
                    </div>

                    <div className="mu-mobile-footer">
                    <span className="mu-mobile-reservations">
                        <strong>{u.reservations}</strong> reservations
                    </span>
                    <div className="mu-actions">
                        <button aria-label={`View ${u.name}`} className="mu-icon-btn mu-icon-btn--view">
                        <Eye className="icon" />
                        </button>
                        <button
                        onClick={() => toggleStatus(u.id)}
                        aria-label={
                            u.status === "active" ? `Suspend ${u.name}` : `Reactivate ${u.name}`
                        }
                        className={`mu-icon-btn ${
                            u.status === "active" ? "mu-icon-btn--danger" : "mu-icon-btn--success"
                        }`}
                        >
                        {u.status === "active" ? (
                            <X className="icon" />
                        ) : (
                            <Check className="icon" />
                        )}
                        </button>
                    </div>
                    </div>
                </div>
                ))}
                {filtered.length === 0 && <div className="mu-empty mu-empty--mobile">No users match your search.</div>}
            </div>
            </div>
        </div>
        </div>
    );
    }