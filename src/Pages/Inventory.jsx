    import { useState, useMemo } from "react";
    import "./Inventory.css";

    // Mock data — replace with real API calls once the backend endpoint is ready.
    const MEDICINES = [
    {
        id: 1,
        name: "Amoxicillin 500mg",
        description: "Broad-spectrum antibiotic...",
        category: "Antibiotics",
        price: 45,
        quantity: 120,
        status: "in-stock",
        lastUpdated: "2026-06-24",
    },
    {
        id: 2,
        name: "Paracetamol 1g",
        description: "Pain relief and fever reducer...",
        category: "Analgesics",
        price: 12,
        quantity: 340,
        status: "in-stock",
        lastUpdated: "2026-06-24",
    },
    {
        id: 3,
        name: "Omeprazole 20mg",
        description: "Proton pump inhibitor for...",
        category: "Gastro",
        price: 78,
        quantity: 88,
        status: "in-stock",
        lastUpdated: "2026-06-23",
    },
    {
        id: 4,
        name: "Metformin 850mg",
        description: "First-line medication for ty...",
        category: "Diabetes",
        price: 55,
        quantity: 0,
        status: "out-of-stock",
        lastUpdated: "2026-06-22",
    },
    {
        id: 5,
        name: "Atorvastatin 40mg",
        description: "Cholesterol-lowering stati...",
        category: "Cardiology",
        price: 132,
        quantity: 60,
        status: "in-stock",
        lastUpdated: "2026-06-24",
    },
    {
        id: 6,
        name: "Cetirizine 10mg",
        description: "Non-drowsy allergy relief",
        category: "Antihistamines",
        price: 28,
        quantity: 18,
        status: "low-stock",
        lastUpdated: "2026-06-23",
    },
    ];

    const STATUS_CONFIG = {
    "in-stock": { label: "In Stock", icon: "check" },
    "low-stock": { label: "Low Stock", icon: "warning" },
    "out-of-stock": { label: "Out of Stock", icon: "alert" },
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

    const totalItems = MEDICINES.length;
    const inStockCount = MEDICINES.filter((m) => m.status !== "out-of-stock").length;

    const filteredMedicines = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return MEDICINES;
        return MEDICINES.filter(
        (m) =>
            m.name.toLowerCase().includes(term) ||
            m.category.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    const handleAddMedicine = () => {
        // Hook this up to a modal / form once the create-medicine flow is ready.
    };

    const handleEdit = (id) => {
        // Hook this up to an edit modal / form once ready.
    };

    const handleDelete = (id) => {
        // Hook this up to a confirmation + delete API call once ready.
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
            onClick={handleAddMedicine}
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
            <div className="inventory__table-wrap">
            <table className="inventory__table">
                <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {filteredMedicines.map((med) => {
                    const status = STATUS_CONFIG[med.status];
                    return (
                    <tr key={med.id}>
                        <td>
                        <div className="inventory__med-name">{med.name}</div>
                        <div className="inventory__med-desc">{med.description}</div>
                        </td>
                        <td className="inventory__category">{med.category}</td>
                        <td className="inventory__price">{med.price} EGP</td>
                        <td className={`inventory__quantity inventory__quantity--${med.status}`}>
                        {med.quantity}
                        </td>
                        <td>
                        <span className={`inventory__status inventory__status--${med.status}`}>
                            <StatusIcon type={status.icon} />
                            {status.label}
                        </span>
                        </td>
                        <td className="inventory__updated">{med.lastUpdated}</td>
                        <td>
                        <div className="inventory__actions">
                            <button
                            type="button"
                            className="inventory__action-btn inventory__action-btn--edit"
                            aria-label={`Edit ${med.name}`}
                            onClick={() => handleEdit(med.id)}
                            >
                            <StatusIcon type="edit" />
                            </button>
                            <button
                            type="button"
                            className="inventory__action-btn inventory__action-btn--delete"
                            aria-label={`Delete ${med.name}`}
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

            {/* Mobile stacked cards */}
            <div className="inventory__cards">
            {filteredMedicines.map((med) => {
                const status = STATUS_CONFIG[med.status];
                return (
                <div key={med.id} className="inventory__card">
                    <div className="inventory__card-top">
                    <div>
                        <div className="inventory__med-name">{med.name}</div>
                        <div className="inventory__med-desc">{med.description}</div>
                    </div>
                    <span className={`inventory__status inventory__status--${med.status}`}>
                        <StatusIcon type={status.icon} />
                        {status.label}
                    </span>
                    </div>

                    <div className="inventory__card-grid">
                    <div>
                        <span className="inventory__card-label">Category</span>
                        <span className="inventory__category">{med.category}</span>
                    </div>
                    <div>
                        <span className="inventory__card-label">Price</span>
                        <span className="inventory__price">{med.price} EGP</span>
                    </div>
                    <div>
                        <span className="inventory__card-label">Quantity</span>
                        <span className={`inventory__quantity inventory__quantity--${med.status}`}>
                        {med.quantity}
                        </span>
                    </div>
                    <div>
                        <span className="inventory__card-label">Last Updated</span>
                        <span className="inventory__updated">{med.lastUpdated}</span>
                    </div>
                    </div>

                    <div className="inventory__actions inventory__actions--card">
                    <button
                        type="button"
                        className="inventory__action-btn inventory__action-btn--edit"
                        aria-label={`Edit ${med.name}`}
                        onClick={() => handleEdit(med.id)}
                    >
                        <StatusIcon type="edit" />
                        Edit
                    </button>
                    <button
                        type="button"
                        className="inventory__action-btn inventory__action-btn--delete"
                        aria-label={`Delete ${med.name}`}
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
        </div>
    );
    }

    export default Inventory;