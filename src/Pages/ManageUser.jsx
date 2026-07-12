    import React, { useEffect, useMemo, useState } from "react";
    import { Search, Filter, Download, Eye, Trash2, MapPin, Phone } from "lucide-react";
    import { supabase } from "../supabaseClient";
    import "./ManageUser.css";

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
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const fetchUsers = async () => {
        try {
        setLoading(true);
        const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        const userIds = (profilesData || []).map((user) => user.id).filter(Boolean);
        let reservationCounts = {};

        if (userIds.length > 0) {
            const { data: reservationsData, error: reservationsError } = await supabase
            .from("reservations")
            .select("user_id")
            .in("user_id", userIds);

            if (reservationsError) throw reservationsError;

            reservationCounts = (reservationsData || []).reduce((acc, reservation) => {
            acc[reservation.user_id] = (acc[reservation.user_id] || 0) + 1;
            return acc;
            }, {});
        }

        const mappedUsers = (profilesData || []).map((user) => ({
            id: user.id,
            name: user.full_name || user.name || user.phone || "Unknown user",
            nid: user.national_id || user.nid || "",
            phone: user.phone || user.phone_number || "N/A",
            dob: user.date_of_birth || user.dob || user.birth_date || "N/A",
            address: user.address || "",
            reservations: reservationCounts[user.id] || 0,
            status: user.status || "active",
            email: user.email || user.phone || "N/A",
            joinDate: user.created_at || "",
            raw: user,
        }));

        setUsers(mappedUsers);
        } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

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
        // Replace with a real Supabase update mutation when status persistence is required.
        console.log("Toggle status for user:", id);
        setUsers((prev) =>
        prev.map((u) =>
            u.id === id
            ? { ...u, status: u.status === "active" ? "suspended" : "active" }
            : u
        )
        );
    }

    function openUserModal(user) {
        setSelectedUser(user);
        setIsViewModalOpen(true);
    }

    async function handleDeleteUser(id) {
        const confirmed = window.confirm("Are you sure you want to delete this user?");
        if (!confirmed) return;

        try {
        const { error } = await supabase.from("profiles").delete().eq("id", id);
        if (error) throw error;
        await fetchUsers();
        } catch (err) {
        console.error("Error deleting user:", err);
        }
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
                {loading ? "Loading users..." : `${filtered.length} registered user${filtered.length !== 1 ? "s" : ""}`}
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
                    {loading ? (
                    <tr>
                        <td colSpan={8} className="mu-empty">
                        Loading users...
                        </td>
                    </tr>
                    ) : (
                    filtered.map((u, i) => (
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
                        <td>{u.phone || "N/A"}</td>
                        <td>{u.dob && u.dob !== "N/A" ? u.dob : "N/A"}</td>
                        <td className="mu-truncate">{u.address}</td>
                        <td className="mu-align-right mu-reservations">{u.reservations}</td>
                        <td>
                        <StatusPill status={u.status} />
                        </td>
                        <td>
                        <div className="mu-actions">
                            <button
                            aria-label={`View ${u.name}`}
                            className="mu-icon-btn mu-icon-btn--view"
                            onClick={() => openUserModal(u)}
                            >
                            <Eye className="icon" />
                            </button>
                            <button
                            onClick={() => handleDeleteUser(u.id)}
                            aria-label={`Delete ${u.name}`}
                            className="mu-icon-btn mu-icon-btn--danger"
                            >
                            <Trash2 className="icon" />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                    )}
                    {!loading && filtered.length === 0 && (
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
                {loading ? (
                <div className="mu-empty mu-empty--mobile">Loading users...</div>
                ) : (
                filtered.map((u, i) => (
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
                        {u.phone || "N/A"}
                    </div>
                    <div className="mu-mobile-field">DOB: {u.dob && u.dob !== "N/A" ? u.dob : "N/A"}</div>
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
                        <button
                        aria-label={`View ${u.name}`}
                        className="mu-icon-btn mu-icon-btn--view"
                        onClick={() => openUserModal(u)}
                        >
                        <Eye className="icon" />
                        </button>
                        <button
                        onClick={() => handleDeleteUser(u.id)}
                        aria-label={`Delete ${u.name}`}
                        className="mu-icon-btn mu-icon-btn--danger"
                        >
                        <Trash2 className="icon" />
                        </button>
                    </div>
                    </div>
                </div>
                ))
                )}
                {!loading && filtered.length === 0 && <div className="mu-empty mu-empty--mobile">No users match your search.</div>}
            </div>
            </div>

            {isViewModalOpen && selectedUser && (
            <div className="mu-modal-backdrop" onClick={() => setIsViewModalOpen(false)}>
                <div className="mu-modal" onClick={(event) => event.stopPropagation()}>
                <div className="mu-modal-header">
                    <div>
                    <h2 className="mu-modal-title">User Details</h2>
                    <p className="mu-modal-subtitle">Full information for the selected user.</p>
                    </div>
                    <button
                    type="button"
                    className="mu-icon-btn mu-icon-btn--danger"
                    onClick={() => setIsViewModalOpen(false)}
                    >
                    ✕
                    </button>
                </div>

                <div className="mu-modal-grid">
                    <div className="mu-modal-field">
                    <span>Name</span>
                    <strong>{selectedUser.name}</strong>
                    </div>
                    <div className="mu-modal-field">
                    <span>NID</span>
                    <strong>{selectedUser.nid || "N/A"}</strong>
                    </div>
                    <div className="mu-modal-field">
                    <span>Phone</span>
                    <strong>{selectedUser.phone || "N/A"}</strong>
                    </div>
                    <div className="mu-modal-field">
                    <span>Date of Birth</span>
                    <strong>{selectedUser.dob && selectedUser.dob !== "N/A" ? selectedUser.dob : "N/A"}</strong>
                    </div>
                    <div className="mu-modal-field">
                    <span>Address</span>
                    <strong>{selectedUser.address || "N/A"}</strong>
                    </div>
                    <div className="mu-modal-field">
                    <span>Email</span>
                    <strong>{selectedUser.email || "N/A"}</strong>
                    </div>
                    <div className="mu-modal-field">
                    <span>Reservations</span>
                    <strong>{selectedUser.reservations}</strong>
                    </div>
                    <div className="mu-modal-field">
                    <span>Status</span>
                    <strong>{selectedUser.status}</strong>
                    </div>
                </div>
                </div>
            </div>
            )}
        </div>
        </div>
    );
    }