import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './ReservationModal.css';

export default function ReservationModal({ medicineItem, user, onClose, onSuccess }) {
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

    const maxQuantity = medicineItem.quantity_in_stock;
    const unitPrice = medicineItem.price_per_unit;
    const subtotal = (quantity * unitPrice).toFixed(2);

    // Handle quantity input
    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value) || 1;
        if (value > 0 && value <= maxQuantity) {
            setQuantity(value);
        }
    };

    // Increment quantity
    const incrementQuantity = () => {
        if (quantity < maxQuantity) {
            setQuantity(quantity + 1);
        }
    };

    // Decrement quantity
    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    // Handle Stripe checkout flow
    const handleConfirmReservation = async () => {
        try {
            setIsCheckoutLoading(true);
            setError('');

            if (!quantity || quantity < 1 || quantity > maxQuantity) {
                setError('Invalid quantity selected');
                return;
            }

            const parsedPrice = Number(String(unitPrice).replace(/[^0-9.-]+/g, ''));
            const checkoutItem = {
                name: medicineItem?.medicines?.name || 'Medicine',
                price: parsedPrice,
                quantity,
            };

            const { data, error: checkoutError } = await supabase.functions.invoke(
                'create-checkout-session',
                { body: { items: [checkoutItem] } }
            );

            if (checkoutError) {
                console.error(checkoutError);
                window.alert('Unable to start checkout. Please try again.');
                return;
            }

            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err.message || 'Failed to start checkout. Please try again.');
        } finally {
            setIsCheckoutLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="reservation-modal">
                {/* Modal Header */}
                <div className="modal-header">
                    <h2>Reserve Medicine</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {/* Medicine Summary */}
                    <div className="medicine-summary">
                        <div className="summary-item">
                            <label>Medicine Name</label>
                            <p className="summary-value">{medicineItem.medicines.name}</p>
                        </div>

                        {medicineItem.medicines.generic_name && (
                            <div className="summary-item">
                                <label>Generic Name</label>
                                <p className="summary-value">{medicineItem.medicines.generic_name}</p>
                            </div>
                        )}

                        <div className="summary-item">
                            <label>Dosage</label>
                            <p className="summary-value">
                                {medicineItem.medicines.dosage} {medicineItem.medicines.unit}
                            </p>
                        </div>

                        <div className="summary-item">
                            <label>Pharmacy</label>
                            <p className="summary-value">{medicineItem.pharmacies.name}</p>
                        </div>

                        <div className="summary-item">
                            <label>Unit Price</label>
                            <p className="summary-value">${unitPrice.toFixed(2)}</p>
                        </div>

                        {medicineItem.medicines.requires_prescription && (
                            <div className="prescription-warning">
                                <span className="warning-icon">⚠️</span>
                                <span>This medicine requires a prescription. Please have it ready.</span>
                            </div>
                        )}
                    </div>

                    {/* Quantity Selection */}
                    <div className="form-group">
                        <label htmlFor="quantity" className="form-label">
                            Quantity <span className="required">*</span>
                        </label>
                        <div className="quantity-selector">
                            <button
                                type="button"
                                className="qty-btn qty-btn--minus"
                                onClick={decrementQuantity}
                                disabled={quantity <= 1}
                            >
                                −
                            </button>
                            <input
                                type="number"
                                id="quantity"
                                className="qty-input"
                                value={quantity}
                                onChange={handleQuantityChange}
                                min="1"
                                max={maxQuantity}
                            />
                            <button
                                type="button"
                                className="qty-btn qty-btn--plus"
                                onClick={incrementQuantity}
                                disabled={quantity >= maxQuantity}
                            >
                                +
                            </button>
                        </div>
                        <p className="qty-hint">
                            Available: {maxQuantity} {medicineItem.medicines.unit}
                        </p>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label htmlFor="notes" className="form-label">
                            Special Notes (Optional)
                        </label>
                        <textarea
                            id="notes"
                            className="form-textarea"
                            placeholder="E.g., 'Please refrigerate' or 'Please call before delivery'"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            maxLength={500}
                            rows={3}
                        />
                        <p className="char-count">{notes.length}/500</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-box">
                            <span className="error-icon">✕</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Total Amount */}
                    <div className="total-summary">
                        <div className="total-row">
                            <span>Quantity:</span>
                            <span>{quantity} {medicineItem.medicines.unit}</span>
                        </div>
                        <div className="total-row">
                            <span>Unit Price:</span>
                            <span>${unitPrice.toFixed(2)}</span>
                        </div>
                        <div className="total-row total-row--final">
                            <span>Total Amount:</span>
                            <span>${subtotal}</span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={onClose}
                        disabled={isCheckoutLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={handleConfirmReservation}
                        disabled={isCheckoutLoading || !quantity}
                    >
                        {isCheckoutLoading ? 'Processing...' : 'Confirm Reservation'}
                    </button>
                </div>
            </div>
        </div>
    );
}
