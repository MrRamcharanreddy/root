'use client';

import { useState } from 'react';
import { useCouponStore, Coupon } from '@/lib/couponStore';
import SellerRoute from '@/components/SellerRoute';
import { Plus, Edit, Trash2, Tag, Calendar, DollarSign, Percent } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function SellerCouponsContent() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useCouponStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minPurchase: 0,
    maxDiscount: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 0,
    active: true,
  });

  const handleAddOrUpdate = () => {
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    if (formData.discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    const couponData = {
      code: formData.code.toUpperCase().trim(),
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      minPurchase: formData.minPurchase > 0 ? formData.minPurchase : undefined,
      maxDiscount: formData.maxDiscount > 0 ? formData.maxDiscount : undefined,
      validFrom: new Date(formData.validFrom).toISOString(),
      validUntil: new Date(formData.validUntil).toISOString(),
      usageLimit: formData.usageLimit > 0 ? formData.usageLimit : undefined,
      active: formData.active,
    };

    if (editingCoupon) {
      updateCoupon(editingCoupon.code, couponData);
      toast.success('Coupon updated successfully');
    } else {
      addCoupon(couponData);
      toast.success('Coupon created successfully');
    }

    setShowAddModal(false);
    setEditingCoupon(null);
    resetForm();
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchase: coupon.minPurchase || 0,
      maxDiscount: coupon.maxDiscount || 0,
      validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
      validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
      usageLimit: coupon.usageLimit || 0,
      active: coupon.active,
    });
    setShowAddModal(true);
  };

  const handleDelete = (code: string) => {
    if (confirm(`Are you sure you want to delete coupon "${code}"?`)) {
      deleteCoupon(code);
      toast.success('Coupon deleted successfully');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      minPurchase: 0,
      maxDiscount: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: 0,
      active: true,
    });
  };

  const activeCoupons = coupons.filter(c => c.active);
  const expiredCoupons = coupons.filter(c => new Date(c.validUntil) < new Date());

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Coupon Management</h1>
          <p className="text-gray-600">Create and manage discount coupons</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setShowAddModal(true);
          }}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Coupons</p>
              <p className="text-3xl font-bold text-primary-600">{coupons.length}</p>
            </div>
            <Tag className="w-10 h-10 text-primary-600 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Active Coupons</p>
              <p className="text-3xl font-bold text-green-600">{activeCoupons.length}</p>
            </div>
            <Tag className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Expired Coupons</p>
              <p className="text-3xl font-bold text-red-600">{expiredCoupons.length}</p>
            </div>
            <Tag className="w-10 h-10 text-red-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conditions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => {
                const isExpired = new Date(coupon.validUntil) < new Date();
                const isActive = coupon.active && !isExpired;
                return (
                  <tr key={coupon.code} className={!isActive ? 'opacity-60' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-primary-600" />
                        <span className="font-bold text-lg">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        {coupon.discountType === 'percentage' ? (
                          <Percent className="w-4 h-4 text-gray-400" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-semibold">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}%`
                            : `$${coupon.discountValue}`}
                        </span>
                        {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                          <span className="text-xs text-gray-500">
                            (max ${coupon.maxDiscount})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {coupon.minPurchase ? (
                          <p>Min: ${coupon.minPurchase}</p>
                        ) : (
                          <p className="text-gray-400">No minimum</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(coupon.validUntil), 'MMM d, yyyy')}</span>
                        </div>
                        {isExpired && (
                          <span className="text-xs text-red-600">Expired</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {coupon.usageLimit ? (
                          <span>
                            {coupon.usedCount} / {coupon.usageLimit}
                          </span>
                        ) : (
                          <span>{coupon.usedCount} / ∞</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isActive
                            ? 'bg-green-100 text-green-800'
                            : isExpired
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.code)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Discount Value *</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: Number(e.target.value) })
                    }
                    min="0"
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Minimum Purchase (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) =>
                      setFormData({ ...formData, minPurchase: Number(e.target.value) })
                    }
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Max Discount (optional)
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxDiscount: Number(e.target.value) })
                      }
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Valid From *</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Valid Until *</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Usage Limit (optional, 0 = unlimited)
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: Number(e.target.value) })
                  }
                  min="0"
                  placeholder="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label className="text-sm font-semibold">Active</label>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleAddOrUpdate}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellerCouponsPage() {
  return (
    <SellerRoute>
      <SellerCouponsContent />
    </SellerRoute>
  );
}

