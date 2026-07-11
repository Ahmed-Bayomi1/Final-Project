import { useState } from 'react';
import { supabase } from '../supabaseClient';

const CheckoutButton = () => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    const mockItems = [
      { name: 'Panadol Extra', price: 50, quantity: 2 },
      { name: 'Vitamin C 1000mg', price: 120, quantity: 1 },
    ];

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { items: mockItems },
      });

      if (error) {
        console.error(error);
        window.alert('Payment initiation failed. Please try again.');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      window.alert('Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      style={{
        background: loading ? '#7c8c9b' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
        color: '#fff',
        border: 'none',
        borderRadius: '999px',
        padding: '12px 22px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
        transition: 'all 0.2s ease',
      }}
    >
      {loading ? 'Redirecting...' : 'Proceed to Payment (Stripe)'}
    </button>
  );
};

export default CheckoutButton;

