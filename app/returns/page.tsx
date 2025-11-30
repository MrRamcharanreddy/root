import { RotateCcw, Clock, Package } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Returns & Refunds</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <RotateCcw className="w-8 h-8 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold">Replacement Policy</h2>
          </div>
          <p className="text-gray-700 mb-4">
            We want you to be completely satisfied with your purchase. If you&apos;re not happy with your order,
            we offer replacements within 7 days of delivery.
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            <h3 className="font-semibold mb-3">To be eligible for a replacement:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Items must be unopened and in their original packaging</li>
              <li>Replacement request must be made within 7 days of delivery</li>
              <li>Items must be in the same condition as received</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Clock className="w-8 h-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-bold">Processing Time</h2>
            </div>
            <p className="text-gray-700">
              Once we receive your returned items, refunds are typically processed within 5-7 business days.
              You&apos;ll receive an email confirmation once your refund has been processed.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Package className="w-8 h-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-bold">Return Shipping</h2>
            </div>
            <p className="text-gray-700">
              Return shipping costs are the responsibility of the customer unless the item was defective
              or incorrect. We&apos;ll provide a prepaid return label for eligible returns.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">How to Return an Item</h2>
          <ol className="space-y-4">
            <li className="flex items-start">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                1
              </span>
              <div>
                <h3 className="font-semibold mb-1">Contact Us</h3>
                <p className="text-gray-700">Email us at returns@roots2global.com with your order number and reason for return.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                2
              </span>
              <div>
                <h3 className="font-semibold mb-1">Get Authorization</h3>
                <p className="text-gray-700">We&apos;ll review your request and provide return authorization and instructions.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                3
              </span>
              <div>
                <h3 className="font-semibold mb-1">Ship Your Return</h3>
                <p className="text-gray-700">Package the items securely and ship them to the address provided.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                4
              </span>
              <div>
                <h3 className="font-semibold mb-1">Receive Refund</h3>
                <p className="text-gray-700">Once we receive and inspect your return, we&apos;ll process your refund.</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

