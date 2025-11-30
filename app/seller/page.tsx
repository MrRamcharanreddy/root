'use client';

import Link from 'next/link';
import { Package, ShoppingBag, Users, TrendingUp, ArrowRight, BarChart3, LogOut, DollarSign, Calendar, Star, Eye, Activity } from 'lucide-react';
import { useOrderStore } from '@/lib/orderStore';
import { useProductStore } from '@/lib/productStore';
import { useAuthStore } from '@/lib/authStore';
import { useVisitorStore } from '@/lib/visitorStore';
import SellerRoute from '@/components/SellerRoute';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

function SellerDashboardContent() {
  const orders = useOrderStore((state) => state.getAllOrders());
  const products = useProductStore((state) => state.getAllProducts());
  const isSeller = useAuthStore((state) => state.isSeller);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const visitorStore = useVisitorStore();
  const [mounted, setMounted] = useState(false);
  const [visitorStats, setVisitorStats] = useState({
    total: 0,
    today: 0,
    online: 0,
    pageViews: 0,
  });

  useEffect(() => {
    setMounted(true);
    // Update visitor stats
    const updateStats = () => {
      setVisitorStats({
        total: visitorStore.getTotalVisitors(),
        today: visitorStore.getTodayVisitors(),
        online: visitorStore.getCurrentOnline(),
        pageViews: visitorStore.getPageViews(),
      });
    };
    updateStats();
    // Update every 5 seconds for real-time feel
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [visitorStore]);

  // Auth check is handled by SellerRoute component wrapper
  // No need to check here as it causes double redirects

  // Calculate analytics
  const analytics = useMemo(() => {
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    // Revenue by day (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      return {
        date: format(date, 'MMM d'),
        revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
        orders: dayOrders.length,
      };
    });

    // Best selling products
    const productSales: { [key: string]: { product: any; quantity: number; revenue: number } } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            product: products.find(p => p.id === item.id),
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      });
    });

    const bestSellers = Object.values(productSales)
      .filter(p => p.product)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Revenue by payment method
    const cardRevenue = orders
      .filter(o => o.paymentMethod === 'card')
      .reduce((sum, order) => sum + order.total, 0);
    const codRevenue = orders
      .filter(o => o.paymentMethod === 'cod')
      .reduce((sum, order) => sum + order.total, 0);

    // Average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Today's stats
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= todayStart && orderDate <= todayEnd;
    });
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      totalRevenue,
      totalOrders,
      last7Days,
      bestSellers,
      cardRevenue,
      codRevenue,
      averageOrderValue,
      todayOrders: todayOrders.length,
      todayRevenue,
    };
  }, [orders, products]);

  const {
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    totalRevenue,
    totalOrders,
    last7Days,
    bestSellers,
    cardRevenue,
    codRevenue,
    averageOrderValue,
    todayOrders,
    todayRevenue,
  } = analytics;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Seller Dashboard</h1>
          <p className="text-gray-600">Manage your e-commerce business</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Today: ${todayRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-primary-600">{totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Today: {todayOrders}</p>
            </div>
            <Package className="w-10 h-10 text-primary-600 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Average Order Value</p>
              <p className="text-3xl font-bold text-blue-600">${averageOrderValue.toFixed(2)}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>
        {mounted && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Visitors</p>
                  <p className="text-3xl font-bold text-purple-600">{visitorStats.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Today: {visitorStats.today.toLocaleString()}</p>
                </div>
                <Users className="w-10 h-10 text-purple-600 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Currently Online</p>
                  <p className="text-3xl font-bold text-orange-600">{visitorStats.online}</p>
                  <p className="text-xs text-gray-500 mt-1">Page Views: {visitorStats.pageViews.toLocaleString()}</p>
                </div>
                <Activity className="w-10 h-10 text-orange-600 opacity-50" />
              </div>
            </div>
          </>
        )}
        {!mounted && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Visitors</p>
                  <p className="text-3xl font-bold text-purple-600">-</p>
                  <p className="text-xs text-gray-500 mt-1">Loading...</p>
                </div>
                <Users className="w-10 h-10 text-purple-600 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Currently Online</p>
                  <p className="text-3xl font-bold text-orange-600">-</p>
                  <p className="text-xs text-gray-500 mt-1">Loading...</p>
                </div>
                <Activity className="w-10 h-10 text-orange-600 opacity-50" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Visitor Analytics Section */}
      {mounted && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-purple-600" />
            Website Visitor Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Visitors</p>
              <p className="text-2xl font-bold text-purple-600">{visitorStats.total.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Today&apos;s Visitors</p>
              <p className="text-2xl font-bold text-blue-600">{visitorStats.today.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Unique today</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Currently Online</p>
              <p className="text-2xl font-bold text-orange-600">{visitorStats.online}</p>
              <p className="text-xs text-gray-500 mt-1">Active now</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Page Views</p>
              <p className="text-2xl font-bold text-green-600">{visitorStats.pageViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">All pages</p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
            Revenue (Last 7 Days)
          </h2>
          <div className="space-y-4">
            {last7Days.map((day, index) => {
              const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 1);
              const height = (day.revenue / maxRevenue) * 100;
              return (
                <div key={index} className="flex items-end space-x-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">{day.date}</span>
                      <span className="text-sm text-gray-600">${day.revenue.toFixed(2)}</span>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="absolute bottom-0 left-0 bg-primary-600 rounded transition-all duration-500"
                        style={{ width: `${height}%`, height: '100%' }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{day.orders} orders</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Best Selling Products
          </h2>
          {bestSellers.length > 0 ? (
            <div className="space-y-4">
              {bestSellers.map((item, index) => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">${item.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No sales data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Status & Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
            Order Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Pending</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-semibold w-12 text-right">{pendingOrders}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Processing</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${totalOrders > 0 ? (processingOrders / totalOrders) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-semibold w-12 text-right">{processingOrders}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Shipped</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${totalOrders > 0 ? (shippedOrders / totalOrders) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-semibold w-12 text-right">{shippedOrders}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Delivered</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-semibold w-12 text-right">{deliveredOrders}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
            Payment Methods
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-semibold">Card Payment</span>
                <span className="text-lg font-bold text-primary-600">${cardRevenue.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${totalRevenue > 0 ? (cardRevenue / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-semibold">Cash on Delivery</span>
                <span className="text-lg font-bold text-green-600">${codRevenue.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${totalRevenue > 0 ? (codRevenue / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/seller/orders"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-primary-600" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
          <h3 className="text-xl font-bold mb-2">Manage Orders</h3>
          <p className="text-gray-600 text-sm">
            View, pack, and ship customer orders
          </p>
        </Link>

        <Link
          href="/seller/products"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between mb-4">
            <ShoppingBag className="w-8 h-8 text-primary-600" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
          <h3 className="text-xl font-bold mb-2">Manage Products</h3>
          <p className="text-gray-600 text-sm">
            Add, edit, and remove products from your catalog
          </p>
        </Link>

        <Link
          href="/seller/coupons"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-primary-600" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
          <h3 className="text-xl font-bold mb-2">Manage Coupons</h3>
          <p className="text-gray-600 text-sm">
            Create and manage discount coupons
          </p>
        </Link>
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Orders</h2>
            <Link
              href="/seller/orders"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold">Order {order.id}</p>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName} • ${order.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'shipped'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {order.status}
                  </span>
                  <Link
                    href={`/seller/orders/${order.id}`}
                    className="text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
          <p className="text-gray-600 mb-6">
            Start receiving orders and they&apos;ll appear here.
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            View Products
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SellerDashboardPage() {
  return (
    <SellerRoute>
      <SellerDashboardContent />
    </SellerRoute>
  );
}

