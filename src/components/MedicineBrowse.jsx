import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import ReservationModal from './ReservationModal';
import './MedicineBrowse.css';

export default function MedicineBrowse() {
    const { user } = useOutletContext() || {};
    
    const [medicines, setMedicines] = useState([]);
    const [filteredMedicines, setFilteredMedicines] = useState([]);
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPharmacy, setSelectedPharmacy] = useState('all');
    
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch inventory data with joins
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch pharmacies
                const { data: pharmaciesData, error: pharmaciesError } = await supabase
                    .from('pharmacies')
                    .select('id, name, address')
                    .eq('is_active', true);

                if (pharmaciesError) throw pharmaciesError;
                setPharmacies(pharmaciesData || []);

                // Fetch pharmacy_medicines with joins
                const { data: inventoryData, error: inventoryError } = await supabase
                    .from('pharmacy_medicines')
                    .select(`
                        id,
                        pharmacy_id,
                        medicine_id,
                        quantity_in_stock,
                        price_per_unit,
                        is_available,
                        pharmacies(id, name, address),
                        medicines(id, name, generic_name, dosage, description, requires_prescription, unit)
                    `)
                    .eq('is_available', true)
                    .gt('quantity_in_stock', 0);

                if (inventoryError) throw inventoryError;
                setMedicines(inventoryData || []);
                setFilteredMedicines(inventoryData || []);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to load medicines. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle search and filter
    useEffect(() => {
        let filtered = medicines;

        // Filter by pharmacy
        if (selectedPharmacy !== 'all') {
            filtered = filtered.filter(item => item.pharmacy_id === selectedPharmacy);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.medicines.name.toLowerCase().includes(term) ||
                item.medicines.generic_name?.toLowerCase().includes(term) ||
                item.medicines.dosage.toLowerCase().includes(term)
            );
        }

        setFilteredMedicines(filtered);
    }, [searchTerm, selectedPharmacy, medicines]);

    // Handle reserve button click
    const handleReserveClick = (medicineItem) => {
        setSelectedMedicine(medicineItem);
        setShowModal(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedMedicine(null);
    };

    // Handle successful reservation
    const handleReservationSuccess = (message) => {
        setSuccessMessage(message);
        setShowModal(false);
        setSelectedMedicine(null);
        
        // Clear success message after 4 seconds
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    if (!user) {
        return (
            <div className="medicine-browse">
                <div className="error-message">Please log in to browse medicines.</div>
            </div>
        );
    }

    return (
        <div className="medicine-browse">
            {/* Header */}
            <div className="medicine-browse__header">
                <h1>Browse Medicines</h1>
                <p>Find and reserve medicines from nearby pharmacies</p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="success-notification">
                    <span className="success-notification__icon">✓</span>
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="error-notification">
                    <span className="error-notification__icon">✕</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="medicine-browse__controls">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search by medicine name, generic name, or dosage..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-bar__input"
                    />
                    <span className="search-bar__icon">🔍</span>
                </div>

                <select
                    value={selectedPharmacy}
                    onChange={(e) => setSelectedPharmacy(e.target.value)}
                    className="pharmacy-filter"
                >
                    <option value="all">All Pharmacies</option>
                    {pharmacies.map(pharmacy => (
                        <option key={pharmacy.id} value={pharmacy.id}>
                            {pharmacy.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading medicines...</p>
                </div>
            )}

            {/* Medicines Grid */}
            {!loading && filteredMedicines.length > 0 && (
                <div className="medicines-grid">
                    {filteredMedicines.map(item => (
                        <div key={item.id} className="medicine-card">
                            {/* Prescription Badge */}
                            {item.medicines.requires_prescription && (
                                <div className="medicine-card__badge medicine-card__badge--prescription">
                                    Rx Required
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="medicine-card__header">
                                <h3 className="medicine-card__title">
                                    {item.medicines.name}
                                </h3>
                                {item.medicines.generic_name && (
                                    <p className="medicine-card__generic">
                                        {item.medicines.generic_name}
                                    </p>
                                )}
                            </div>

                            {/* Medicine Details */}
                            <div className="medicine-card__details">
                                <div className="detail-row">
                                    <span className="detail-label">Dosage:</span>
                                    <span className="detail-value">
                                        {item.medicines.dosage} {item.medicines.unit}
                                    </span>
                                </div>
                                {item.medicines.description && (
                                    <div className="detail-row">
                                        <p className="medicine-card__description">
                                            {item.medicines.description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Pharmacy Info */}
                            <div className="medicine-card__pharmacy">
                                <div className="pharmacy-info">
                                    <p className="pharmacy-name">📍 {item.pharmacies.name}</p>
                                    <p className="pharmacy-address">{item.pharmacies.address}</p>
                                </div>
                            </div>

                            {/* Stock & Price */}
                            <div className="medicine-card__footer">
                                <div className="price-stock">
                                    <div className="price">
                                        <p className="price__label">Price</p>
                                        <p className="price__value">${item.price_per_unit.toFixed(2)}</p>
                                    </div>
                                    <div className="stock">
                                        <p className="stock__label">In Stock</p>
                                        <p className={`stock__value ${item.quantity_in_stock < 10 ? 'stock__value--low' : ''}`}>
                                            {item.quantity_in_stock} {item.medicines.unit}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="reserve-btn"
                                    onClick={() => handleReserveClick(item)}
                                >
                                    Reserve Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {!loading && filteredMedicines.length === 0 && (
                <div className="no-results">
                    <p>🔍 No medicines found. Try adjusting your search or filters.</p>
                </div>
            )}

            {/* Reservation Modal */}
            {showModal && selectedMedicine && (
                <ReservationModal
                    medicineItem={selectedMedicine}
                    user={user}
                    onClose={handleCloseModal}
                    onSuccess={handleReservationSuccess}
                />
            )}
        </div>
    );
}
