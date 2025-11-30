'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useCartStore } from '@/lib/store';
import { useOrderStore } from '@/lib/orderStore';
import { useUserAuthStore } from '@/lib/userAuthStore';
import { useCouponStore } from '@/lib/couponStore';
import { useCurrencyStore } from '@/lib/currencyStore';
import { useAddressStore } from '@/lib/addressStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, CreditCard, MapPin, Shield, CheckCircle, Banknote, Tag, X, Smartphone, Plus, Home, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import { ShippingAddress } from '@/types';
import { logWarning, logError } from '@/lib/errorTracking';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const addOrder = useOrderStore((state) => state.addOrder);
  const getAllOrders = useOrderStore((state) => state.getAllOrders);
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const formatPrice = useCurrencyStore((state) => state.formatPrice);
  const { validateCoupon, activeCoupon, applyCoupon, removeCoupon } = useCouponStore();
  const { getUserAddresses, addAddress, getDefaultAddress, extractAddressesFromOrders, setDefaultAddress } = useAddressStore();
  
  // Get addresses for current user only
  const savedAddresses = currentUser ? getUserAddresses(currentUser.email) : [];
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'upi'>('card');
  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiIdError, setUpiIdError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [formData, setFormData] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  // Fix hydration mismatch by only setting user data after client-side hydration
  useEffect(() => {
    setMounted(true);
    
    if (!currentUser) {
      return; // Don't extract addresses if user is not logged in
    }
    
    // CRITICAL SECURITY FIX: Validate user data before processing
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('current-user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.email !== currentUser.email) {
            logWarning('User mismatch in checkout! Redirecting to login.', {
              path: '/checkout',
              currentUserEmail: currentUser?.email,
            });
            router.push('/login');
            return;
          }
        } catch (e) {
          logWarning('Invalid user data in checkout! Redirecting to login.', {
            path: '/checkout',
          });
          router.push('/login');
          return;
        }
      }
    }
    
    // Extract addresses from past orders (only for current user)
    const allOrders = getAllOrders();
    // Filter orders by current user's email - SECURITY: Only show current user's orders
    const userOrders = allOrders.filter(order => {
      const orderEmail = order.shippingAddress?.email?.toLowerCase();
      const userEmail = currentUser.email.toLowerCase();
      return orderEmail === userEmail;
    });
    
    if (userOrders.length > 0) {
      extractAddressesFromOrders(userOrders, currentUser.email);
    }
    
    // Load default address or first saved address for current user
    const defaultAddr = getDefaultAddress(currentUser.email);
    if (defaultAddr) {
      setFormData({
        firstName: defaultAddr.firstName,
        lastName: defaultAddr.lastName,
        email: defaultAddr.email,
        phone: defaultAddr.phone,
        address: defaultAddr.address,
        city: defaultAddr.city,
        state: defaultAddr.state,
        zipCode: defaultAddr.zipCode,
        country: defaultAddr.country,
      });
      setSelectedAddressId(defaultAddr.id);
    } else {
      // If no saved address, use user data
      setFormData(prev => ({
        ...prev,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone || prev.phone,
      }));
    }
  }, [currentUser, getAllOrders, extractAddressesFromOrders, getDefaultAddress, router]);

  const total = getTotalPrice();
  const totalItems = getTotalItems();
  // Free shipping rules:
  // 1. 2+ items: Always free
  // 2. 1 item with prepaid payment (card/upi): Free
  // 3. 1 item with COD: 
  //    - India: ₹149 (≈$1.80 USD)
  //    - Other countries: $9.99
  // Check if India: by country selection or by currency (INR)
  const isIndia = formData.country === 'IN' || formData.country === 'India' || selectedCurrency === 'INR';
  // ₹149 at rate 83 = $1.795 USD
  const baseShipping = isIndia ? 1.795 : 9.99;
  const shipping = totalItems >= 2 || (totalItems === 1 && (paymentMethod === 'card' || paymentMethod === 'upi')) ? 0 : baseShipping;
  
  // Calculate discount (validate against cart total before shipping)
  const discount = activeCoupon
    ? (() => {
        const validation = validateCoupon(activeCoupon.code, total);
        return validation.valid ? validation.discount : 0;
      })()
    : 0;
  
  const finalTotal = Math.max(0, total + shipping - discount);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const validation = validateCoupon(couponCode.trim(), total);
    if (validation.valid) {
      applyCoupon(couponCode.trim());
      setCouponCode('');
      setCouponError('');
      toast.success(`Coupon &quot;${couponCode.trim()}&quot; applied!`);
    } else {
      setCouponError(validation.error || 'Invalid coupon code');
      toast.error(validation.error || 'Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    toast.success('Coupon removed');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phone || !formData.address || !formData.city || 
        !formData.state || !formData.zipCode || !formData.country) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate UPI ID if UPI payment is selected
    if (paymentMethod === 'upi') {
      const trimmedUpiId = upiId.trim();
      if (!trimmedUpiId) {
        toast.error('Please enter your UPI ID');
        setUpiIdError('UPI ID is required');
        return;
      }
      // Validate UPI ID format
      if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(trimmedUpiId)) {
        toast.error('Please enter a valid UPI ID (e.g., yourname@paytm, yourname@ybl)');
        setUpiIdError('Please enter a valid UPI ID');
        return;
      }
    }

    setLoading(true);

    try {
      if (paymentMethod === 'cod') {
        // Cash on Delivery - Create order directly
        const order = addOrder(items, formData, finalTotal, undefined, 'cod');
        // Save address for future use (only if user is logged in)
        if (currentUser) {
          addAddress(formData, currentUser.email);
        }
        toast.success('Order placed successfully! Pay on delivery.');
        clearCart();
        router.push(`/order-success?order_id=${order.id}&payment_method=cod`);
      } else if (paymentMethod === 'upi') {
        // UPI Payment - Create order with UPI payment method
        // In a real implementation, you would integrate with a UPI payment gateway
        // For now, we'll create the order and redirect to success page
        const order = addOrder(items, formData, finalTotal, `upi_${Date.now()}`, 'upi');
        // Save address for future use (only if user is logged in)
        if (currentUser) {
          addAddress(formData, currentUser.email);
        }
        toast.success(`Order placed successfully! UPI payment will be processed for ${upiId.trim()}`);
        clearCart();
        router.push(`/order-success?order_id=${order.id}&payment_method=upi&upi_id=${encodeURIComponent(upiId.trim())}`);
      } else {
        // Card payment - Use Stripe
        if (!stripe || !elements) {
          toast.error('Payment system not ready');
          setLoading(false);
          return;
        }

        // Create payment intent
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(finalTotal * 100), // Convert to cents (use discounted total)
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            shippingAddress: formData,
          }),
        });

        // Safely parse JSON response
        let paymentData;
        try {
          paymentData = await response.json();
        } catch (parseError) {
          logError(parseError instanceof Error ? parseError : new Error('Failed to parse payment response'), {
            path: '/checkout',
            action: 'createPaymentIntent',
          });
          toast.error('Failed to process payment. Please try again.');
          setLoading(false);
          return;
        }

        const { clientSecret, error } = paymentData || {};

        if (error) {
          toast.error(error);
          setLoading(false);
          return;
        }

        // Confirm payment
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast.error('Card element not found');
          setLoading(false);
          return;
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                address: {
                  line1: formData.address,
                  city: formData.city,
                  state: formData.state,
                  postal_code: formData.zipCode,
                  country: formData.country,
                },
              },
            },
          }
        );

        if (confirmError) {
          toast.error(confirmError.message || 'Payment failed');
          setLoading(false);
        } else if (paymentIntent?.status === 'succeeded') {
          // Create order
          const order = addOrder(items, formData, finalTotal, paymentIntent.id, 'card');
          // Save address for future use (only if user is logged in)
          if (currentUser) {
            addAddress(formData, currentUser.email);
          }
          toast.success('Payment successful!');
          clearCart();
          router.push(`/order-success?order_id=${order.id}&payment_intent=${paymentIntent.id}`);
        }
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Unknown order error'), {
        path: '/checkout',
        action: 'createOrder',
      });
      toast.error('An error occurred');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <MapPin className="w-6 h-6 mr-2 text-primary-600" />
          Shipping Information
        </h2>
        
        {/* Saved Addresses */}
        {savedAddresses.length > 0 && !showNewAddressForm && (
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3">Select Saved Address</label>
            <div className="space-y-3 mb-4">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => {
                    setFormData({
                      firstName: addr.firstName,
                      lastName: addr.lastName,
                      email: addr.email,
                      phone: addr.phone,
                      address: addr.address,
                      city: addr.city,
                      state: addr.state,
                      zipCode: addr.zipCode,
                      country: addr.country,
                    });
                    setSelectedAddressId(addr.id);
                    setShowNewAddressForm(false);
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedAddressId === addr.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                        selectedAddressId === addr.id ? 'border-primary-600' : 'border-gray-300'
                      }`}>
                        {selectedAddressId === addr.id && (
                          <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {addr.label === 'Home' ? (
                            <Home className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Building className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="font-semibold text-gray-900">{addr.label || 'Address'}</span>
                          {addr.isDefault && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">
                          {addr.firstName} {addr.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {addr.address}, {addr.city}, {addr.state} {addr.zipCode}
                        </p>
                        <p className="text-sm text-gray-600">
                          {addr.country} • {addr.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowNewAddressForm(true);
                setSelectedAddressId(null);
                if (currentUser) {
                  setFormData({
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName,
                    email: currentUser.email,
                    phone: currentUser.phone || '',
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: '',
                  });
                } else {
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: '',
                  });
                }
              }}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>
        )}

        {/* New Address Form or Form when no saved addresses */}
        {(showNewAddressForm || savedAddresses.length === 0) && (
          <>
            {savedAddresses.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">New Address</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAddressForm(false);
                    if (currentUser) {
                      const defaultAddr = getDefaultAddress(currentUser.email);
                      if (defaultAddr) {
                        setFormData({
                          firstName: defaultAddr.firstName,
                          lastName: defaultAddr.lastName,
                          email: defaultAddr.email,
                          phone: defaultAddr.phone,
                          address: defaultAddr.address,
                          city: defaultAddr.city,
                          state: defaultAddr.state,
                          zipCode: defaultAddr.zipCode,
                          country: defaultAddr.country,
                        });
                        setSelectedAddressId(defaultAddr.id);
                      }
                    }
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back to Saved Addresses
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email from your account</p>
            </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">
              Address *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              State/Province *
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              ZIP/Postal Code *
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Country *
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            >
              <option value="">Select Country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="IN">India</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="JP">Japan</option>
              <option value="SG">Singapore</option>
              <option value="AE">United Arab Emirates</option>
            </select>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <CreditCard className="w-6 h-6 mr-2 text-primary-600" />
          Payment Method
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('card');
              setUpiId('');
              setUpiIdError('');
            }}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'card'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'card' ? 'border-primary-600' : 'border-gray-300'
              }`}>
                {paymentMethod === 'card' && (
                  <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                )}
              </div>
              <CreditCard className="w-6 h-6 text-gray-700" />
              <div className="text-left">
                <p className="font-semibold">Credit/Debit Card</p>
                <p className="text-sm text-gray-600">Pay securely with Stripe</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPaymentMethod('upi');
              setUpiId('');
              setUpiIdError('');
            }}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'upi'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'upi' ? 'border-primary-600' : 'border-gray-300'
              }`}>
                {paymentMethod === 'upi' && (
                  <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                )}
              </div>
              <Smartphone className="w-6 h-6 text-gray-700" />
              <div className="text-left">
                <p className="font-semibold">UPI Payment</p>
                <p className="text-sm text-gray-600">Pay via UPI apps</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPaymentMethod('cod');
              setUpiId('');
              setUpiIdError('');
            }}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'cod'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'cod' ? 'border-primary-600' : 'border-gray-300'
              }`}>
                {paymentMethod === 'cod' && (
                  <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                )}
              </div>
              <Banknote className="w-6 h-6 text-gray-700" />
              <div className="text-left">
                <p className="font-semibold">Cash on Delivery</p>
                <p className="text-sm text-gray-600">Pay when you receive</p>
              </div>
            </div>
          </button>
        </div>

        {paymentMethod === 'upi' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">UPI Payment</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Complete your payment using any UPI app (Google Pay, PhonePe, Paytm, etc.)
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="mb-4">
                    <label htmlFor="upiId" className="block text-sm font-semibold text-gray-700 mb-2">
                      Enter Your UPI ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="upiId"
                      value={upiId}
                      onChange={(e) => {
                        setUpiId(e.target.value);
                        setUpiIdError('');
                      }}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        // Basic UPI ID validation (format: name@paytm, name@ybl, name@phonepe, etc.)
                        if (value && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value)) {
                          setUpiIdError('Please enter a valid UPI ID (e.g., yourname@paytm, yourname@ybl)');
                        } else {
                          setUpiIdError('');
                        }
                      }}
                      placeholder="yourname@paytm or yourname@ybl"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all ${
                        upiIdError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {upiIdError && (
                      <p className="mt-1 text-xs text-red-600">{upiIdError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Examples: yourname@paytm, yourname@ybl, yourname@phonepe
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Payment Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    <li>Enter your UPI ID above</li>
                    <li>Click Place Order to proceed</li>
                    <li>You will be redirected to complete UPI payment</li>
                    <li>Your order will be confirmed after successful payment</li>
                  </ol>
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800 font-semibold">
                      ℹ️ Note: UPI payment does not require QR code scanning. Enter your UPI ID to proceed.
                    </p>
                  </div>
                </div>
                {totalItems === 1 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-green-800">
                          🎉 FREE SHIPPING with Prepaid Payment!
                        </p>
                        <p className="text-xs text-green-700 mt-0.5">
                          You save {isIndia ? '₹149' : formatPrice(baseShipping)} on shipping with Card/UPI payment
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'card' && mounted && (
          <>
            <div className="border rounded-lg p-4 mb-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            {totalItems === 1 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-800 mb-1">
                      🎉 FREE SHIPPING with Prepaid Payment!
                    </p>
                    <p className="text-xs text-green-700">
                      You save {isIndia ? '₹149' : formatPrice(baseShipping)} on shipping with Card/UPI payment
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 mb-1">Secure Payment</p>
                <p className="text-xs text-green-700">
                  Your payment information is encrypted and secure. We never store your card details.
                  Powered by Stripe, trusted by millions worldwide.
                </p>
              </div>
            </div>
          </>
        )}
        {paymentMethod === 'card' && !mounted && (
          <div className="border rounded-lg p-4 mb-4 bg-gray-50 animate-pulse">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        )}

        {paymentMethod === 'cod' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <Banknote className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">Cash on Delivery</p>
              <p className="text-xs text-blue-700">
                Pay with cash when your order arrives. Please have exact change ready. 
                Delivery charges may apply.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
        
        {/* Coupon Code */}
        <div className="mb-6">
          {activeCoupon ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Coupon Applied</p>
                    <p className="text-sm text-green-700">{activeCoupon.code}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-green-700 mt-2">
                {activeCoupon.discountType === 'percentage'
                  ? `${activeCoupon.discountValue}% off`
                  : <>{formatPrice(activeCoupon.discountValue)} off</>}
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Have a coupon code?</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError('');
                  }}
                  placeholder="Enter coupon code"
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Tag className="w-4 h-4" />
                  <span>Apply</span>
                </button>
              </div>
              {couponError && (
                <p className="text-red-600 text-sm mt-2">{couponError}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {shipping === 0 ? (
                'Free'
              ) : isIndia ? (
                <span>₹149</span>
              ) : (
                <span>{formatPrice(shipping)}</span>
              )}
            </span>
          </div>
          {totalItems < 2 && paymentMethod === 'cod' && (
            <p className="text-xs text-gray-500 italic">
              {isIndia 
                ? `Add ${2 - totalItems} more item${2 - totalItems > 1 ? 's' : ''} for free shipping, or choose prepaid payment for free shipping (Save ₹149!)`
                : `Add ${2 - totalItems} more item${2 - totalItems > 1 ? 's' : ''} for free shipping, or choose prepaid payment for free shipping`
              }
            </p>
          )}
          {totalItems === 1 && (paymentMethod === 'card' || paymentMethod === 'upi') && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-3 mt-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-800">
                    🎉 FREE SHIPPING with Prepaid Payment!
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    You saved {isIndia ? '₹149' : formatPrice(baseShipping)} on shipping by choosing Card/UPI payment
                  </p>
                </div>
              </div>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="border-t pt-4 flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>{formatPrice(finalTotal)}</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || (paymentMethod === 'card' && (!stripe || !mounted))}
          className="w-full bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-4"
        >
          {paymentMethod === 'card' ? (
            <>
              <Lock className="w-5 h-5" />
              <span>{loading ? 'Processing...' : <>Pay {formatPrice(finalTotal)}</>}</span>
            </>
          ) : paymentMethod === 'upi' ? (
            <>
              <Smartphone className="w-5 h-5" />
              <span>{loading ? 'Placing Order...' : <>Place Order - Pay {formatPrice(finalTotal)} via UPI</>}</span>
            </>
          ) : (
            <>
              <Banknote className="w-5 h-5" />
              <span>{loading ? 'Placing Order...' : <>Place Order - Pay {formatPrice(finalTotal)} on Delivery</>}</span>
            </>
          )}
        </button>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>7-Day Replacement</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Money-Back Guarantee</span>
          </div>
        </div>
      </div>
    </form>
  );
}

function CheckoutPageContent() {
  const { items } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600">Your cart is empty. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Checkout</h1>
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutPageContent />
    </ProtectedRoute>
  );
}

