import { Truck, Clock, Globe, Shield } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Shipping Information</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Truck className="w-8 h-8 text-primary-600 mr-3" />
              <h2 className="text-2xl font-bold">Shipping Options</h2>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li><strong>Standard Shipping:</strong> 5-7 business days - $9.99</li>
              <li><strong>Express Shipping:</strong> 2-3 business days - $19.99</li>
              <li><strong>Free Shipping:</strong> Worldwide</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Globe className="w-8 h-8 text-primary-600 mr-3" />
              <h2 className="text-2xl font-bold">International Shipping</h2>
            </div>
            <p className="text-gray-700 mb-3">
              We ship worldwide! International orders typically take 10-15 business days.
            </p>
            <p className="text-gray-700">
              International shipping rates vary by location and will be calculated at checkout.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Shipping Process</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-2">Order Processing</h3>
                <p className="text-gray-700">Orders are typically processed within 1-2 business days.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-2">Packaging</h3>
                <p className="text-gray-700">Your items are carefully packaged to ensure freshness and quality.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-2">Shipping</h3>
                <p className="text-gray-700">You&apos;ll receive a tracking number via email once your order ships.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-2">Delivery</h3>
                <p className="text-gray-700">Your order arrives at your doorstep, ready to enjoy!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold">Important Notes</h2>
          </div>
          <ul className="space-y-2 text-gray-700">
            <li>• All orders are shipped Monday-Friday (excluding holidays)</li>
            <li>• Delivery times are estimates and may vary</li>
            <li>• You&apos;ll receive email updates at each stage of shipping</li>
            <li>• For questions about your order, please contact our support team</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

