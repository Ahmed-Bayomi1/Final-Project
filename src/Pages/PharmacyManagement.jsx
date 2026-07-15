import React, { useState, useMemo, useEffect } from "react";
import { Search, Plus, AlertTriangle, Trash2, Check, Building2, MapPin } from "lucide-react";
import { supabase } from "../supabaseClient";
import "./PharmacyManagement.css";

function StatusPill({ status }) {
    const isActive = String(status || "").toLowerCase() === "active";
    return (
        <span className={`pm-status-pill ${isActive ? "pm-status-active" : "pm-status-pending"}`}>
            {isActive ? "active" : "pending"}
        </span>
    );
}

const initialFormData = {
    name: "",
    license: "",
    owner_name: "",
    governorate: "",
    street: "",
    phone: "",
    email: "",
    password: "",
};

export default function PharmacyManagement() {
    const [pharmacies, setPharmacies] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const fetchPharmacies = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("pharmacies")
                .select("*, pharmacy_medicines(id)");

            if (error) {
                throw error;
            }

            const pharmaciesWithCounts = (data || []).map((pharmacy) => ({
                ...pharmacy,
                medicine_count: pharmacy.pharmacy_medicines?.length ?? 0,
            }));

            setPharmacies(pharmaciesWithCounts);
        } catch (error) {
            console.error("Error fetching pharmacies:", error.message || error);
            setPharmacies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPharmacies();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return pharmacies;

        return pharmacies.filter((p) => {
            const searchText = [
                p.name,
                p.pharmacy_name,
                p.license,
                p.license_number,
                p.owner_name,
                p.owner,
                p.governorate,
                p.city,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchText.includes(q);
        });
    }, [pharmacies, query]);

    const totalPharmacies = pharmacies.length;
    const pendingCount = pharmacies.filter((p) => String(p.status || "").toLowerCase() === "pending").length;

    async function approvePharmacy(id) {
        try {
            const { error } = await supabase.from("pharmacies").update({ status: "active" }).eq("id", id);

            if (error) {
                throw error;
            }

            setToastMessage("Pharmacy approved successfully.");
            await fetchPharmacies();
        } catch (error) {
            console.error("Error approving pharmacy:", error.message || error);
            setToastMessage("Could not approve pharmacy.");
        }
    }

    async function deletePharmacy(id) {
        const confirmed = window.confirm("Are you sure you want to delete this pharmacy?");
        if (!confirmed) return;

        try {
            const { error } = await supabase.from("pharmacies").delete().eq("id", id);

            if (error) {
                throw error;
            }

            setToastMessage("Pharmacy deleted successfully.");
            await fetchPharmacies();
        } catch (error) {
            console.error("Error deleting pharmacy:", error.message || error);
            setToastMessage("Could not delete pharmacy.");
        }
    }

    function handleInputChange(event) {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    async function handleAddPharmacy(event) {
        event.preventDefault();

        try {
            setSubmitting(true);

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error("Your admin session is no longer active. Please sign in again.");
            }

            const payload = {
                name: formData.name.trim(),
                license_number: formData.license.trim(),
                owner_name: formData.owner_name.trim(),
                governorate: formData.governorate.trim(),
                street: formData.street.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                password: formData.password,
            };

            const { data, error } = await supabase.functions.invoke("create-pharmacy-user", {
                body: payload,
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (error) {
                throw error;
            }

            if (!data?.success || !data.pharmacy) {
                const message = data?.error?.message || data?.error || "Failed to register pharmacy account.";
                throw new Error(message);
            }

            setToastMessage("Pharmacy registered successfully.");
            setIsAddModalOpen(false);
            setFormData(initialFormData);
            await fetchPharmacies();
        } catch (error) {
            console.error("Error adding pharmacy:", error.message || error);
            setToastMessage(error.message || "Could not register pharmacy.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="pm-page">
        <div className="pm-inner">
            {/* Header */}
            <div className="pm-header">
            <div>
                <h1 className="pm-title">Pharmacy Management</h1>
                <p className="pm-subtitle">
                    {loading ? "Loading pharmacies..." : `${totalPharmacies} pharmac${totalPharmacies !== 1 ? "ies" : "y"}`}
                    {!loading && pendingCount > 0 && ` · ${pendingCount} pending approval`}
                </p>
            </div>
            <button className="pm-btn-primary" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="pm-icon" />
                Register Pharmacy
            </button>
            </div>

            {toastMessage && (
                <div className="pm-toast" role="status">
                    {toastMessage}
                </div>
            )}

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
                    {loading ? (
                        <tr>
                            <td colSpan={8} className="pm-empty">
                                Loading pharmacies...
                            </td>
                        </tr>
                    ) : (
                        filtered.map((p, index) => (
                            <tr key={`${p.id ?? "pharmacy"}-${index}`}>
                                <td>
                                    <div className="pm-name-cell">
                                        <div className="pm-icon-badge">
                                            <Building2 className="pm-badge-icon" />
                                        </div>
                                        <span className="pm-name">{p.name || p.pharmacy_name || "Unknown"}</span>
                                    </div>
                                </td>
                                <td className="pm-mono">{p.license || p.license_number || "N/A"}</td>
                                <td>{p.owner_name || p.owner || "N/A"}</td>
                                <td className="pm-link-text">{p.governorate || p.city || "N/A"}</td>
                                <td className="pm-link-text pm-truncate">{p.street || p.address || "N/A"}</td>
                                <td className="pm-align-right pm-medicines">{p.medicines || p.medicine_count || 0}</td>
                                <td>
                                    <StatusPill status={p.status} />
                                </td>
                                <td>
                                    <div className="pm-actions">
                                        {String(p.status || "").toLowerCase() === "pending" && (
                                            <button
                                                className="pm-btn-approve"
                                                onClick={() => approvePharmacy(p.id)}
                                            >
                                                <Check className="pm-icon-sm" />
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            aria-label={`Delete ${p.name || p.pharmacy_name || "pharmacy"}`}
                                            className="pm-icon-btn pm-icon-btn--danger"
                                            onClick={() => deletePharmacy(p.id)}
                                        >
                                            <Trash2 className="pm-icon-sm" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    {!loading && filtered.length === 0 && (
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
                {loading ? (
                    <div className="pm-empty pm-empty--mobile">Loading pharmacies...</div>
                ) : (
                    filtered.map((p, index) => (
                        <div key={`${p.id ?? "pharmacy"}-${index}`} className="pm-mobile-card">
                            <div className="pm-mobile-card__top">
                                <div className="pm-name-cell">
                                    <div className="pm-icon-badge">
                                        <Building2 className="pm-badge-icon" />
                                    </div>
                                    <div>
                                        <p className="pm-name">{p.name || p.pharmacy_name || "Unknown"}</p>
                                        <p className="pm-mono pm-mobile-license">{p.license || p.license_number || "N/A"}</p>
                                    </div>
                                </div>
                                <StatusPill status={p.status} />
                            </div>

                            <div className="pm-mobile-grid">
                                <div className="pm-mobile-field">Owner: {p.owner_name || p.owner || "N/A"}</div>
                                <div className="pm-mobile-field pm-link-text">{p.governorate || p.city || "N/A"}</div>
                                <div className="pm-mobile-field pm-mobile-field--full pm-link-text">
                                    <MapPin className="pm-mobile-field-icon" />
                                    <span className="pm-truncate">{p.street || p.address || "N/A"}</span>
                                </div>
                            </div>

                            <div className="pm-mobile-footer">
                                <span className="pm-mobile-medicines">
                                    <strong>{p.medicines || p.medicine_count || 0}</strong> medicines
                                </span>
                                <div className="pm-actions">
                                    {String(p.status || "").toLowerCase() === "pending" && (
                                        <button
                                            className="pm-btn-approve"
                                            onClick={() => approvePharmacy(p.id)}
                                        >
                                            <Check className="pm-icon-sm" />
                                            Approve
                                        </button>
                                    )}
                                    <button
                                        aria-label={`Delete ${p.name || p.pharmacy_name || "pharmacy"}`}
                                        className="pm-icon-btn pm-icon-btn--danger"
                                        onClick={() => deletePharmacy(p.id)}
                                    >
                                        <Trash2 className="pm-icon-sm" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {!loading && filtered.length === 0 && (
                    <div className="pm-empty pm-empty--mobile">No pharmacies match your search.</div>
                )}
            </div>
            </div>

            {isAddModalOpen && (
                <div className="pm-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
                    <div className="pm-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="pm-modal-header">
                            <div>
                                <h2 className="pm-modal-title">Add Pharmacy</h2>
                                <p className="pm-modal-subtitle">Create a new pharmacy entry in the registry.</p>
                            </div>
                            <button
                                type="button"
                                className="pm-icon-btn pm-icon-btn--danger"
                                onClick={() => setIsAddModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form className="pm-modal-form" onSubmit={handleAddPharmacy}>
                            <div className="pm-form-grid">
                                <label className="pm-form-field">
                                    <span>Pharmacy Name</span>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter pharmacy name"
                                        required
                                    />
                                </label>
                                <label className="pm-form-field">
                                    <span>License No.</span>
                                    <input
                                        name="license"
                                        value={formData.license}
                                        onChange={handleInputChange}
                                        placeholder="Enter license number"
                                        required
                                    />
                                </label>
                                <label className="pm-form-field">
                                    <span>Owner</span>
                                    <input
                                        name="owner_name"
                                        value={formData.owner_name}
                                        onChange={handleInputChange}
                                        placeholder="Enter owner name"
                                        required
                                    />
                                </label>
                                <label className="pm-form-field">
                                    <span>Governorate</span>
                                    <input
                                        name="governorate"
                                        value={formData.governorate}
                                        onChange={handleInputChange}
                                        placeholder="Enter governorate"
                                        required
                                    />
                                </label>
                                <label className="pm-form-field">
                                    <span>Street</span>
                                    <input
                                        name="street"
                                        value={formData.street}
                                        onChange={handleInputChange}
                                        placeholder="Enter street address"
                                        required
                                    />
                                </label>
                                <label className="pm-form-field">
                                    <span>Phone Number</span>
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </label>
                                <label className="pm-form-field">
                                    <span>Email</span>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter email address"
                                        required
                                    />
                                </label>
                                <label className="pm-form-field">
                                    <span>Password</span>
                                    <input
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Create account password"
                                        required
                                    />
                                </label>
                            </div>

                            <div className="pm-modal-actions">
                                <button
                                    type="button"
                                    className="pm-btn-secondary"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="pm-btn-primary" disabled={submitting}>
                                    {submitting ? "Saving..." : "Save Pharmacy"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
}