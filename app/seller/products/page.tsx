'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useProductStore } from '@/lib/productStore';
import SellerRoute from '@/components/SellerRoute';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, Package, Image as ImageIcon, Upload, X, Eye } from 'lucide-react';
import { Product } from '@/types';

function SellerProductsContent() {
  const { products, deleteProduct } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Product Management</h1>
          <p className="text-gray-600">Add, edit, and manage your products</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowAddModal(true);
          }}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative h-48 w-full bg-gray-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.bestSeller && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  Best Seller
                </div>
              )}
              {product.newArrival && (
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  New
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-primary-600">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">{product.category}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setShowAddModal(true);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No products found.</p>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { addProduct, updateProduct } = useProductStore();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    image: product?.image || '',
    images: product?.images?.join(', ') || '',
    category: product?.category || 'Savouries',
    inStock: product?.inStock ?? true,
    weight: product?.weight || '',
    ingredients: product?.ingredients?.join(', ') || '',
    rating: product?.rating || 0,
    reviewCount: product?.reviewCount || 0,
    bestSeller: product?.bestSeller || false,
    newArrival: product?.newArrival || false,
  });
  // Multi-currency prices
  const [prices, setPrices] = useState<Record<string, number>>(product?.prices || {
    USD: product?.price || 0,
    INR: 0,
    EUR: 0,
    GBP: 0,
    CAD: 0,
    AUD: 0,
    JPY: 0,
    AED: 0,
    SAR: 0,
  });
  // Discount
  const [discount, setDiscount] = useState<{
    type: 'percentage' | 'fixed';
    value: number;
    currency?: string;
  } | null>(product?.discount || null);
  const [showDiscount, setShowDiscount] = useState(!!product?.discount);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image || null);
  const [additionalImages, setAdditionalImages] = useState<string[]>(product?.images || []);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Update preview when image URL changes
  useEffect(() => {
    if (formData.image) {
      setImagePreview(formData.image);
    } else {
      setImagePreview(null);
    }
  }, [formData.image]);

  // Initialize additional images when editing
  useEffect(() => {
    if (product?.images) {
      setAdditionalImages(product.images);
    }
  }, [product]);

  // Initialize prices when editing
  useEffect(() => {
    if (product?.prices) {
      setPrices(product.prices);
    } else if (product?.price) {
      setPrices({ USD: product.price });
    }
  }, [product]);

  // Handle image file upload (convert to base64)
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, isMain: boolean = true) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isMain) {
          setFormData({ ...formData, image: base64String });
          setImagePreview(base64String);
        } else {
          setAdditionalImages([...additionalImages, base64String]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL input for images
  const handleImageUrlChange = (url: string, isMain: boolean = true) => {
    if (isMain) {
      setFormData({ ...formData, image: url });
      setImagePreview(url);
    } else {
      // For additional images, add to the array
      if (url && !additionalImages.includes(url)) {
        const updatedImages = [...additionalImages, url];
        setAdditionalImages(updatedImages);
        setFormData({ ...formData, images: updatedImages.join(', ') });
        setNewImageUrl(''); // Clear input after adding
      }
    }
  };

  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    const newImages = additionalImages.filter((_, i) => i !== index);
    setAdditionalImages(newImages);
    setFormData({ ...formData, images: newImages.join(', ') });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Filter out zero prices (keep only set prices)
    const filteredPrices: Record<string, number> = {};
    Object.entries(prices).forEach(([currency, price]) => {
      if (price > 0) {
        filteredPrices[currency] = price;
      }
    });
    // Always include USD price
    if (formData.price > 0) {
      filteredPrices.USD = formData.price;
    }
    
    const productData = {
      ...formData,
      prices: Object.keys(filteredPrices).length > 0 ? filteredPrices : undefined,
      discount: showDiscount && discount && discount.value > 0 ? discount : undefined,
      images: additionalImages.length > 0 ? additionalImages : (formData.images ? formData.images.split(',').map(img => img.trim()).filter(Boolean) : undefined),
      ingredients: formData.ingredients ? formData.ingredients.split(',').map(ing => ing.trim()).filter(Boolean) : undefined,
      rating: formData.rating || undefined,
      reviewCount: formData.reviewCount || undefined,
    };

    if (product) {
      updateProduct(product.id, productData);
    } else {
      addProduct(productData);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                placeholder="Enter a detailed description of the product. Include information about taste, ingredients, origin, and any special features..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-y"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length} characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Base Price (USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => {
                  const newPrice = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, price: newPrice });
                  // Update USD price in prices object
                  setPrices({ ...prices, USD: newPrice });
                }}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">This is the default/fallback price</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              >
                <option value="Millet Laddus">Millet Laddus</option>
                <option value="Millet Flours">Millet Flours</option>
                <option value="Dry Flesh">Dry Flesh</option>
                <option value="Sweet">Sweet</option>
                <option value="Savouries">Savouries</option>
                <option value="Pickels">Pickels</option>
              </select>
            </div>

            {/* Multi-Currency Prices */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Prices by Currency (Fixed Prices - No Conversion)</label>
              <p className="text-xs text-gray-500 mb-3">Set fixed prices for each currency. These prices will be shown directly without conversion.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'AED', 'SAR'].map((currency) => (
                  <div key={currency}>
                    <label className="block text-xs text-gray-600 mb-1">{currency}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={prices[currency] || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setPrices({ ...prices, [currency]: value });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">💡 Tip: Set market-specific prices for better control and no exchange rate fluctuations</p>
            </div>

            {/* Discount Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="enableDiscount"
                  checked={showDiscount}
                  onChange={(e) => {
                    setShowDiscount(e.target.checked);
                    if (!e.target.checked) {
                      setDiscount(null);
                    } else if (!discount) {
                      setDiscount({ type: 'percentage', value: 0 });
                    }
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor="enableDiscount" className="text-sm font-semibold">Enable Discount</label>
              </div>
              
              {showDiscount && discount && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Discount Type *</label>
                      <select
                        value={discount.type}
                        onChange={(e) => setDiscount({ ...discount, type: e.target.value as 'percentage' | 'fixed' })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Discount Value {discount.type === 'percentage' ? '(%)' : '(Amount)'} *
                      </label>
                      <input
                        type="number"
                        step={discount.type === 'percentage' ? '1' : '0.01'}
                        min="0"
                        max={discount.type === 'percentage' ? '100' : undefined}
                        value={discount.value}
                        onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm"
                        placeholder={discount.type === 'percentage' ? '10' : '5.00'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Currency (Optional)</label>
                      <select
                        value={discount.currency || ''}
                        onChange={(e) => setDiscount({ ...discount, currency: e.target.value || undefined })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm"
                      >
                        <option value="">All Currencies</option>
                        {['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'AED', 'SAR'].map((curr) => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Leave empty to apply to all currencies</p>
                    </div>
                  </div>
                  {discount.type === 'percentage' && discount.value > 0 && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      Example: If original price is ₹100, discounted price will be ₹{100 - discount.value}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Image */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Main Product Image *</label>
              <div className="space-y-3">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative w-full h-64 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized
                      onError={() => setImagePreview(null)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, image: '' });
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowImagePreview(imagePreview)}
                      className="absolute top-2 left-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Upload Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* File Upload */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Upload Image File</label>
                    <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-600 hover:bg-primary-50 transition-colors">
                      <Upload className="w-5 h-5 mr-2 text-gray-600" />
                      <span className="text-sm font-semibold">Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG, WebP)</p>
                  </div>
                  
                  {/* URL Input */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Or Enter Image URL</label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        if (e.target.value) {
                          setImagePreview(e.target.value);
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Images */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Additional Product Images</label>
              <div className="space-y-3">
                {/* Image Gallery Preview */}
                {additionalImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {additionalImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={img}
                            alt={`Additional ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowImagePreview(img)}
                            className="absolute top-1 left-1 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add More Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* File Upload */}
                  <div>
                    <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-600 hover:bg-primary-50 transition-colors">
                      <Upload className="w-5 h-5 mr-2 text-gray-600" />
                      <span className="text-sm font-semibold">Add Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {/* URL Input */}
                  <div>
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://example.com/image2.jpg"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newImageUrl.trim()) {
                          e.preventDefault();
                          handleImageUrlChange(newImageUrl.trim(), false);
                        }
                      }}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">Press Enter to add URL</p>
                      {newImageUrl && (
                        <button
                          type="button"
                          onClick={() => handleImageUrlChange(newImageUrl.trim(), false)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Weight</label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="200g"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Ingredients (comma-separated)</label>
              <input
                type="text"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                placeholder="Peanuts, Salt, Spices"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Rating (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Review Count</label>
              <input
                type="number"
                min="0"
                value={formData.reviewCount}
                onChange={(e) => setFormData({ ...formData, reviewCount: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-semibold">In Stock</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.bestSeller}
                  onChange={(e) => setFormData({ ...formData, bestSeller: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-semibold">Best Seller</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.newArrival}
                  onChange={(e) => setFormData({ ...formData, newArrival: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-semibold">New Arrival</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowImagePreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImagePreview(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-200 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <Image
                src={showImagePreview}
                alt="Preview"
                fill
                className="object-contain rounded-lg"
                sizes="90vw"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellerProductsPage() {
  return (
    <SellerRoute>
      <SellerProductsContent />
    </SellerRoute>
  );
}

