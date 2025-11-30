'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'How long does shipping take?',
    answer: 'Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business days. International orders typically take 10-15 business days.',
  },
  {
    question: 'Do you ship internationally?',
    answer: 'Yes! We ship worldwide. International shipping rates are calculated at checkout based on your location.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, and other payment methods through our secure Stripe payment gateway.',
  },
  {
    question: 'How do I track my order?',
    answer: 'Once your order ships, you&apos;ll receive an email with a tracking number. You can use this to track your package&apos;s journey to your doorstep.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer replacements within 7 days of delivery for unopened items in their original packaging. Please contact us at returns@roots2global.com to initiate a replacement.',
  },
  {
    question: 'Are your products authentic?',
    answer: 'Absolutely! All our products are authentic Taste of Indian Desi, sourced directly from trusted suppliers who maintain traditional recipes and quality standards.',
  },
  {
    question: 'Do you offer free shipping?',
    answer: 'Yes! We offer free standard shipping on orders over $50. International orders may have different thresholds.',
  },
  {
    question: 'How should I store the snacks?',
    answer: 'Our snacks should be stored in a cool, dry place. Once opened, reseal the package or transfer to an airtight container to maintain freshness.',
  },
  {
    question: 'Can I cancel my order?',
    answer: 'Orders can be cancelled within 24 hours of placement if they haven&apos;t been processed yet. Please contact us immediately if you need to cancel.',
  },
  {
    question: 'Are your products suitable for vegetarians?',
    answer: 'Most of our products are vegetarian-friendly. Please check the ingredients list on each product page for specific dietary information.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Frequently Asked Questions</h1>
        <p className="text-center text-gray-600 mb-12">
          Find answers to common questions about our products, shipping, and services.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-lg pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-primary-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-primary-600 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-700 mb-6">
            Can&apos;t find the answer you&apos;re looking for? Please get in touch with our friendly team.
          </p>
          <a
            href="/contact"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}

