    import { useState, useEffect, useMemo } from "react";
    import { supabase } from "../supabaseClient";
    import "./Inventory.css";

    const STATUS_CONFIG = {
    "in-stock": { label: "In Stock", icon: "check" },
    "low-stock": { label: "Low Stock", icon: "warning" },
    "out-of-stock": { label: "Out of Stock", icon: "alert" },
    };

    const getStatus = (quantity) => {
    if (quantity <= 0) return "out-of-stock";
    if (quantity < 20) return "low-stock";
    return "in-stock";
    };

    function StatusIcon({ type }) {
    switch (type) {
        case "check":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l2.5 2.5L16 9.5" />
            </svg>
        );
        case "warning":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4L2.5 20h19L12 4z" />
            <line x1="12" y1="10.5" x2="12" y2="14.5" />
            <circle cx="12" cy="17" r="0.6" fill="currentColor" />
            </svg>
        );
        case "alert":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12.5" />
            <circle cx="12" cy="16" r="0.6" fill="currentColor" />
            </svg>
        );
        case "search":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.2" y2="16.2" />
            </svg>
        );
        case "plus":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        );
        case "edit":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20h4l10-10-4-4L4 16v4z" />
            </svg>
        );
        case "trash":
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16" />
            <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
            <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
            </svg>
        );
        default:
        return null;
    }
    }

    function Inventory() {
    const [searchTerm, setSearchTerm] = useState("");
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [formData, setFormData] = useState({
        pharmacy_id: "",
        medicineName: "",
        dosage: "",
        unit: "",
        quantity_in_stock: 0,
        price_per_unit: "",
        expiry_date: "",
        is_available: true,
    });

    const fetchMedicines = async () => {
        try {
        setLoading(true);
        const { data, error } = await supabase
            .from("pharmacy_medicines")
            .select("*, medicines(name)")
            .order("id", { ascending: true });

        if (error) throw error;
        setMedicines(data || []);
        } catch (err) {
        console.error("Error fetching medicines:", err);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, []);


    const totalItems = medicines.length;
    const inStockCount = medicines.filter((m) => getStatus(m.quantity_in_stock) !== "out-of-stock").length;

    const filteredMedicines = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return medicines;
        return medicines.filter((m) => {
        const haystack = [
            m.medicine_id,
            m.pharmacy_id,
            m.quantity_in_stock,
            m.price_per_unit,
            m.is_available,
        ]
            .filter(Boolean)
            .join(" ")
            .toString()
            .toLowerCase();

        return haystack.includes(term);
        });
    }, [searchTerm, medicines]);

    const handleOpenModal = (medicine = null) => {
        const fallbackPharmacyId = medicines[0]?.pharmacy_id || "";

        if (medicine) {
        setEditingMedicine(medicine);
        setFormData({
            pharmacy_id: medicine.pharmacy_id || fallbackPharmacyId,
            medicineName: medicine.medicine_name || "",
            dosage: medicine.dosage || "",
            unit: medicine.unit || "",
            quantity_in_stock: medicine.quantity_in_stock ?? 0,
            price_per_unit: medicine.price_per_unit ?? "",
            expiry_date: medicine.expiry_date || "",
            is_available: medicine.is_available ?? true,
        });
        } else {
        setEditingMedicine(null);
        setFormData({
            pharmacy_id: fallbackPharmacyId,
            medicineName: "",
            dosage: "",
            unit: "",
            quantity_in_stock: 0,
            price_per_unit: "",
            expiry_date: "",
            is_available: true,
        });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMedicine(null);
        setFormData({
        pharmacy_id: "",
        medicineName: "",
        dosage: "",
        unit: "",
        quantity_in_stock: 0,
        price_per_unit: "",
        expiry_date: "",
        is_available: true,
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
        const trimmedMedicineName = formData.medicineName.trim();
        if (!trimmedMedicineName) {
            window.alert("Please enter a medicine name.");
            return;
        }

        const { data: existingMedicine, error: lookupError } = await supabase
            .from("medicines")
            .select("id")
            .ilike("name", trimmedMedicineName)
            .maybeSingle();

        if (lookupError) throw lookupError;

        let medicineId = existingMedicine?.id;

        if (!medicineId) {
            const { data: createdMedicine, error: createError } = await supabase
            .from("medicines")
            .insert({ name: trimmedMedicineName, dosage: formData.dosage || "N/A", unit: formData.unit || "N/A" })
            .select("id")
            .single();

            if (createError) throw createError;
            medicineId = createdMedicine?.id;
        }

        if (!medicineId) {
            throw new Error("Unable to resolve medicine ID.");
        }

        const payload = {
            pharmacy_id: formData.pharmacy_id,
            medicine_id: medicineId,
            quantity_in_stock: Number(formData.quantity_in_stock),
            price_per_unit: Number(formData.price_per_unit),
            expiry_date: formData.expiry_date || null,
            is_available: Boolean(formData.is_available),
        };

        if (editingMedicine) {
            const { error } = await supabase
            .from("pharmacy_medicines")
            .update(payload)
            .eq("id", editingMedicine.id);

            if (error) throw error;
        } else {
            const { error } = await supabase.from("pharmacy_medicines").insert(payload);
            if (error) throw error;
        }

        handleCloseModal();
        await fetchMedicines();
        } catch (err) {
        console.error("Save error:", err);
        window.alert("Failed to save medicine. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm("Delete this medicine record?");
        if (!confirmed) return;

        try {
        const { error } = await supabase.from("pharmacy_medicines").delete().eq("id", id);

        if (error) throw error;
        setMedicines((prev) => prev.filter((medicine) => medicine.id !== id));
        } catch (err) {
        console.error("Delete error:", err);
        window.alert("Failed to delete medicine. Please try again.");
        }
    };

    return (
        <div className="inventory">
        <header className="inventory__header">
            <div>
            <h1 className="inventory__title">Inventory</h1>
            <p className="inventory__subtitle">
                {totalItems} items · {inStockCount} in stock
            </p>
            </div>

            <button
            type="button"
            className="inventory__add-btn"
            onClick={() => handleOpenModal()}
            >
            <StatusIcon type="plus" />
            Add Medicine
            </button>
        </header>

        <section className="inventory__panel">
            <div className="inventory__search-wrap">
            <span className="inventory__search-icon">
                <StatusIcon type="search" />
            </span>
            <input
                type="text"
                className="inventory__search-input"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>

            {/* Desktop / tablet table */}
            {loading ? (
            <p className="inventory__empty">Loading medicines...</p>
            ) : (
            <div className="inventory__table-wrap">
            <table className="inventory__table">
                <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Availability</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {filteredMedicines.map((med) => {
                    const status = STATUS_CONFIG[getStatus(med.quantity_in_stock)];
                    return (
                    <tr key={med.id}>
                        <td>
                        <div className="inventory__med-name">{med.medicines?.name || med.medicine_id}</div>
                        </td>
                        <td className="inventory__price">{med.price_per_unit} EGP</td>
                        <td className={`inventory__quantity inventory__quantity--${getStatus(med.quantity_in_stock)}`}>
                        {med.quantity_in_stock}
                        </td>
                        <td>
                        <span className={`inventory__status inventory__status--${getStatus(med.quantity_in_stock)}`}>
                            <StatusIcon type={status.icon} />
                            {status.label}
                        </span>
                        </td>
                        <td className="inventory__updated">{med.is_available ? "Available" : "Unavailable"}</td>
                        <td>
                        <div className="inventory__actions">
                            <button
                            type="button"
                            className="inventory__action-btn inventory__action-btn--edit"
                            aria-label={`Edit ${med.medicine_id}`}
                            onClick={() => handleOpenModal(med)}
                            >
                            <StatusIcon type="edit" />
                            </button>
                            <button
                            type="button"
                            className="inventory__action-btn inventory__action-btn--delete"
                            aria-label={`Delete ${med.medicine_id}`}
                            onClick={() => handleDelete(med.id)}
                            >
                            <StatusIcon type="trash" />
                            </button>
                        </div>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>

            {filteredMedicines.length === 0 && (
                <p className="inventory__empty">No medicines match "{searchTerm}".</p>
            )}
            </div>
            )}

            {/* Mobile stacked cards */}
            <div className="inventory__cards">
            {filteredMedicines.map((med) => {
                const status = STATUS_CONFIG[getStatus(med.quantity_in_stock)];
                return (
                <div key={med.id} className="inventory__card">
                    <div className="inventory__card-top">
                    <div>
                        <div className="inventory__med-name">{med.medicines?.name || med.medicine_id}</div>
                    </div>
                    <span className={`inventory__status inventory__status--${getStatus(med.quantity_in_stock)}`}>
                        <StatusIcon type={status.icon} />
                        {status.label}
                    </span>
                    </div>

                    <div className="inventory__card-grid">
                    <div>
                        <span className="inventory__card-label">Pharmacy</span>
                        <span className="inventory__category">{med.pharmacy_id}</span>
                    </div>
                    <div>
                        <span className="inventory__card-label">Price</span>
                        <span className="inventory__price">{med.price_per_unit} EGP</span>
                    </div>
                    <div>
                        <span className="inventory__card-label">Quantity</span>
                        <span className={`inventory__quantity inventory__quantity--${getStatus(med.quantity_in_stock)}`}>
                        {med.quantity_in_stock}
                        </span>
                    </div>
                    <div>
                        <span className="inventory__card-label">Availability</span>
                        <span className="inventory__updated">{med.is_available ? "Available" : "Unavailable"}</span>
                    </div>
                    </div>

                    <div className="inventory__actions inventory__actions--card">
                    <button
                        type="button"
                        className="inventory__action-btn inventory__action-btn--edit"
                        aria-label={`Edit ${med.medicine_id}`}
                        onClick={() => handleOpenModal(med)}
                    >
                        <StatusIcon type="edit" />
                        Edit
                    </button>
                    <button
                        type="button"
                        className="inventory__action-btn inventory__action-btn--delete"
                        aria-label={`Delete ${med.medicine_id}`}
                        onClick={() => handleDelete(med.id)}
                    >
                        <StatusIcon type="trash" />
                        Delete
                    </button>
                    </div>
                </div>
                );
            })}

            {filteredMedicines.length === 0 && (
                <p className="inventory__empty">No medicines match "{searchTerm}".</p>
            )}
            </div>
        </section>

        {isModalOpen && (
            <div className="inventory__modal-overlay" role="dialog" aria-modal="true">
            <div className="inventory__modal-box">
                <h2 className="inventory__modal-title">
                {editingMedicine ? "Edit Medicine" : "Add Medicine"}
                </h2>
                <form onSubmit={handleSubmit} className="inventory__modal-form">
                <label className="inventory__modal-field">
                    <span>Medicine Name</span>
                    <input
                    type="text"
                    name="medicineName"
                    value={formData.medicineName}
                    onChange={handleChange}
                    placeholder="e.g. Amoxicillin"
                    required
                    />
                </label>
                <label className="inventory__modal-field">
                    <span>Dosage</span>
                    <input
                    type="text"
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleChange}
                    placeholder="e.g. 200mg"
                    />
                </label>
                <label className="inventory__modal-field">
                    <span>Unit</span>
                    <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="e.g. tablet"
                    />
                </label>
                <label className="inventory__modal-field">
                    <span>Price</span>
                    <input
                    type="number"
                    name="price_per_unit"
                    min="0"
                    step="0.01"
                    value={formData.price_per_unit}
                    onChange={handleChange}
                    required
                    />
                </label>
                <label className="inventory__modal-field">
                    <span>Stock</span>
                    <input
                    type="number"
                    name="quantity_in_stock"
                    min="0"
                    step="1"
                    value={formData.quantity_in_stock}
                    onChange={handleChange}
                    required
                    />
                </label>
                <label className="inventory__modal-field">
                    <span>Expiry Date</span>
                    <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    />
                </label>
                <label className="inventory__modal-field inventory__modal-field--checkbox">
                    <input
                    type="checkbox"
                    name="is_available"
                    checked={Boolean(formData.is_available)}
                    onChange={handleChange}
                    />
                    <span>Available</span>
                </label>

                <div className="inventory__modal-actions">
                    <button type="button" className="inventory__modal-cancel-btn" onClick={handleCloseModal}>
                    Cancel
                    </button>
                    <button type="submit" className="inventory__modal-save-btn">
                    Save
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}
        </div>
    );
    }

    export default Inventory;