'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { Trash2, ShoppingBag, CreditCard, Truck } from 'lucide-react';
import { shippingAddressSchema } from '@/lib/validations';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [shippingCharge, setShippingCharge] = useState(0);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    const unsubShipping = onSnapshot(doc(db, 'settings', 'shipping'), (snap) => {
      setShippingCharge(snap.exists() ? (snap.data().amount ?? 0) : 0);
    });
    const unsubSocial = onSnapshot(doc(db, 'settings', 'social'), (snap) => {
      const mobile: string = snap.exists() ? (snap.data().mobile ?? '') : '';
      setWhatsappNumber(mobile.replace(/\D/g, ''));
    });
    return () => { unsubShipping(); unsubSocial(); };
  }, []);

  const [shippingForm, setShippingForm] = useState({
    customerName: '',
    phone: '',
    line1: user?.shippingAddress?.line1 || '',
    line2: user?.shippingAddress?.line2 || '',
    city: user?.shippingAddress?.city || '',
    country: user?.shippingAddress?.country || 'Bangladesh',
  });

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationError(null);

    // Validate shipping fields using Zod
    const result = shippingAddressSchema.safeParse(shippingForm);
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    const orderTotal = cartTotal + shippingCharge * 100;
    const shippingLabel = shippingCharge === 0 ? 'Complimentary' : formatPrice(shippingCharge * 100);
    const whatsappMessage = `New order from Glimore Life Style:\n\nCustomer: ${result.data.customerName}\nPhone: ${result.data.phone}\nEmail: ${user?.email || 'guest@glimore.style'}\n\nShipping Address:\n${result.data.line1}${result.data.line2 ? `, ${result.data.line2}` : ''}, ${result.data.city}, ${result.data.country}\n\nOrder items:\n${cart
      .map(
        (item) => `${item.title} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`
      )
      .join('\n')}\n\nSubtotal: ${formatPrice(cartTotal)}\nShipping: ${shippingLabel}\nEstimated Total: ${formatPrice(orderTotal)}`;

    if (whatsappNumber) {
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank');
    }

    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          customerEmail: user?.email || 'guest@glimore.style',
          customerId: user?.uid || 'guest-user',
          shippingAddress: result.data,
        }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      // Redirect immediately to Stripe Checkout (or simulated landing URL)
      if (session.url) {
        clearCart(); // Clear local state before redirecting
        window.location.href = session.url;
      }
    } catch (err: any) {
      setValidationError(err.message || 'Checkout connection error.');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="inline-flex p-5 rounded-full bg-zinc-950 border border-white/5 text-zinc-500">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-['Montserrat'] text-2xl font-semibold tracking-wider text-white">YOUR CART IS EMPTY</h2>
        <p className="text-zinc-500 text-xs tracking-wider max-w-sm mx-auto font-light">
          You have not added any designer pieces to your active order yet. Explore our latest lookbooks to begin.
        </p>
        <Link 
          href="/products" 
          className="px-8 py-3.5 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-90 inline-block transition-opacity"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-['Montserrat'] text-3xl font-bold tracking-widest text-white mb-10 text-left border-b border-white/5 pb-4">
        YOUR BAG
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* LEFT: Cart List (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <div
              key={`${item.productId}::${item.variant || ''}`}
              className="flex flex-col sm:flex-row gap-6 glass p-5 border border-white/5 items-center justify-between text-left"
            >
              {/* Product Info Frame */}
              <div className="flex gap-4 items-center flex-grow w-full">
                <div className="relative aspect-[3/4] h-20 w-16 overflow-hidden bg-zinc-950 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="text-[9px] tracking-wider text-zinc-500 uppercase">{item.vendorName}</span>
                  <h3 className="font-['Montserrat'] text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                    {item.title}
                  </h3>
                  {item.variant && (
                    <span className="inline-block text-[9px] px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary uppercase tracking-wider font-semibold">
                      {item.variant}
                    </span>
                  )}
                  <p className="text-xs text-primary font-medium">{formatPrice(item.price)}</p>
                </div>
              </div>

              {/* Adjust Amount controls */}
              <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
                <div className="flex border border-white/10 bg-black">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                    className="px-3 py-1.5 text-zinc-500 hover:text-white text-xs"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-[10px] text-white flex items-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                    className="px-3 py-1.5 text-zinc-500 hover:text-white text-xs"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId, item.variant)}
                  className="text-zinc-500 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: Shipping Form & Summary (1 Col) */}
        <div className="space-y-6">
          <form onSubmit={handleCheckout} className="glass p-6 border border-white/5 space-y-6 text-left">
            <h3 className="font-['Montserrat'] text-sm font-semibold tracking-wider text-white border-b border-white/5 pb-3">
              Order Summary
            </h3>

            {/* Contact fields */}
            <div className="space-y-4">
              <span className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold block">Contact Details</span>
              <div className="space-y-3">
                <input
                  type="text"
                  name="customerName"
                  placeholder="Full Name"
                  value={shippingForm.customerName}
                  onChange={handleInputChange}
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={shippingForm.phone}
                  onChange={handleInputChange}
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                  required
                />
              </div>
            </div>

            {/* Address fields */}
            <div className="space-y-4">
              <span className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold block">Shipping Destination</span>
              
              <div className="space-y-3">
                <input 
                  type="text" 
                  name="line1"
                  placeholder="Address Line 1"
                  value={shippingForm.line1}
                  onChange={handleInputChange}
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                  required
                />
                <input 
                  type="text" 
                  name="line2"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={shippingForm.line2}
                  onChange={handleInputChange}
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                />
            
                <div className="grid grid-cols-2 gap-3">
                   <input 
                    type="text" 
                    name="city"
                    placeholder="City"
                    value={shippingForm.city}
                    onChange={handleInputChange}
                    className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                    required
                  />
                  <input 
                    type="text" 
                    name="country"
                    placeholder="Country"
                    value={shippingForm.country}
                    onChange={handleInputChange}
                    className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5" />

            {/* Calculations */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />Shipping Charge</span>
                {shippingCharge === 0
                  ? <span className="text-green-400 uppercase font-semibold text-[10px]">Complimentary</span>
                  : <span className="text-white font-semibold">{formatPrice(shippingCharge * 100)}</span>
                }
              </div>
              <div className="h-[1px] w-full bg-white/5" />
              <div className="flex justify-between text-white font-semibold text-sm pt-1">
                <span className="font-['Montserrat'] tracking-wider">Estimated Total</span>
                <span className="text-primary">{formatPrice(cartTotal + shippingCharge * 100)}</span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">CASH ON DELIVERY</span>
            </div>

            {/* Error messaging */}
            {validationError && (
              <p className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 p-2.5 font-medium tracking-wide">
                ⚠ {validationError}
              </p>
            )}

            {/* Checkout Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-95 transition-all dark-gold-border rounded-none flex justify-center items-center gap-2"
            >
              <CreditCard className="h-4 w-4" /> {loading ? 'Fulfilling secure route...' : 'BUY NOW'}
            </button>
            <span className="text-[12px] text-zinc-200 leading-normal text-center block mt-2">
              Estimated delivery time is 2–5 business days, depending on your location.
            </span>
            <span className="text-[12px] text-zinc-200 leading-normal text-center block mt-2">
              for any inquiries, please contact us on WhatsApp at <a href={`https://wa.me/${whatsappNumber}`} className="text-primary underline">{whatsappNumber}</a> 
            </span>
          </form>
        </div>

      </div>
    </div>
  );
}
