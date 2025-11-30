'use client';

import { useState, FormEvent } from 'react';
import { useNewsletterStore } from '@/lib/newsletterStore';
import { Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface NewsletterProps {
  variant?: 'default' | 'compact';
}

export default function Newsletter({ variant = 'default' }: NewsletterProps) {
  const subscribe = useNewsletterStore((state) => state.subscribe);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    const result = subscribe(email.trim(), name.trim() || undefined);
    
    if (result) {
      setSubmitted(true);
      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
      setName('');
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      toast.error('You are already subscribed!');
    }
    
    setLoading(false);
  };

  if (variant === 'compact') {
    return (
      <div className="bg-primary-600 text-white rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Mail className="w-6 h-6" />
          <h3 className="text-xl font-bold">Subscribe to Our Newsletter</h3>
        </div>
        <p className="text-primary-100 mb-4">
          Get exclusive deals, new product updates, and special offers delivered to your inbox.
        </p>
        {submitted ? (
          <div className="flex items-center space-x-2 text-green-200">
            <CheckCircle className="w-5 h-5" />
            <span>Thank you for subscribing!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Mail className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stay Updated with Our Newsletter
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Subscribe to get exclusive deals, new product launches, and special offers delivered 
            straight to your inbox. Join thousands of happy customers!
          </p>
          {submitted ? (
            <div className="bg-green-500 rounded-lg p-6 flex items-center justify-center space-x-3">
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg font-semibold">Thank you for subscribing!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="flex-1 px-6 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-6 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {loading ? 'Subscribing...' : 'Subscribe Now'}
              </button>
              <p className="text-sm text-primary-200">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

