import { Award, Heart, Globe, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          {/* Company Name - Highlighted */}
          <div className="mb-6">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-primary-600 via-yellow-500 to-primary-600 bg-clip-text text-transparent animate-pulse">
              Roots2Global
            </h1>
          </div>
          
          {/* Tagline - Prominently Displayed */}
          <div className="inline-block bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 px-8 py-4 rounded-full shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300">
            <p className="text-2xl md:text-3xl font-bold text-white tracking-wide">
              Taste of Indian Desi
            </p>
          </div>
          
          <p className="text-xl text-gray-600 mt-4">
            Bringing authentic Indian flavors to the world
          </p>
        </div>

        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            <span className="font-bold text-primary-600 text-xl">Roots2Global</span> was born from a passion for authentic Indian flavors and a commitment 
            to sharing the rich culinary heritage of <span className="font-semibold text-orange-600">Taste of Indian Desi</span> with the world. We believe 
            that great snacks should be accessible to everyone, regardless of where they are.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Our journey began with a simple mission: to bring the finest Indian snacks to 
            global markets while maintaining the traditional recipes and quality that make 
            Taste of Indian Desi special. Every product we offer is carefully selected and crafted 
            to ensure authenticity and excellence.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            We work directly with trusted suppliers who share our values of quality, 
            sustainability, and authenticity. From masala peanuts to traditional mixtures, 
            each snack tells a story of tradition, craftsmanship, and flavor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Quality First</h3>
            <p className="text-gray-700">
              We never compromise on quality. Every product undergoes rigorous quality checks 
              to ensure it meets our high standards before reaching your doorstep.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Authentic Taste</h3>
            <p className="text-gray-700">
              Our recipes are rooted in tradition. We preserve the authentic flavors that 
              have been passed down through generations, ensuring every bite is genuine.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Global Reach</h3>
            <p className="text-gray-700">
              We deliver worldwide, bringing the taste of India to snack lovers across 
              the globe. No matter where you are, authentic Taste of Indian Desi are just a click away.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Customer Focused</h3>
            <p className="text-gray-700">
              Your satisfaction is our priority. We&apos;re committed to providing exceptional 
              service and ensuring your shopping experience is smooth and enjoyable.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Our Promise</h2>
          <p className="text-gray-700 text-lg">
            At Roots2Global, we promise to deliver authentic, high-quality Taste of Indian Desi 
            with exceptional service. Every order is handled with care, and we&apos;re here 
            to ensure you have the best possible experience.
          </p>
        </div>
      </div>
    </div>
  );
}

