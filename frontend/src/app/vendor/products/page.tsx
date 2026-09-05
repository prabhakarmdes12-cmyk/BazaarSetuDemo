'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ProductCard from '@/components/ProductCard';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Product, CATEGORIES } from '@/types';
import { api } from '@/lib/api';

export default function VendorProductsPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', unit: 'kg', description: '', category: 'General' });
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Product[] }>('/api/products/vendor', token || undefined);
      if (res.success) setProducts(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token) loadProducts();
  }, [token, authLoading, loadProducts]);

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.price) return;
    setSaving(true);
    try {
      const res = await api.post<{ success: boolean; data: Product }>(
        '/api/products',
        { name: formData.name, price: parseFloat(formData.price), unit: formData.unit, description: formData.description, category: formData.category },
        token || undefined
      );
      if (res.success) {
        setProducts((prev) => [res.data, ...prev]);
        setFormData({ name: '', price: '', unit: 'kg', description: '', category: 'General' });
        setShowForm(false);
      }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await api.patch(`/api/products/${product.id}`, { isAvailable: !product.isAvailable }, token || undefined);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p)));
    } catch (err) { console.error(err); }
  };

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = filterCategory === 'All' ? products : products.filter((p) => p.category === filterCategory);

  return (
    <AppShell topNavTitle="Products" role="vendor">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-on-surface">{products.length} Products</h3>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary !py-2 !px-4 text-sm">
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {/* Quick add form */}
        {showForm && (
          <div className="card space-y-3">
            <input type="text" placeholder="Product name (e.g., Basmati Chawal)" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
            <div className="flex gap-2">
              <input type="number" placeholder="Price" value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field flex-1" />
              <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="input-field w-24">
                <option value="kg">kg</option><option value="g">g</option><option value="L">L</option>
                <option value="ml">ml</option><option value="pcs">pcs</option><option value="dozen">dozen</option><option value="pack">pack</option>
              </select>
            </div>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={handleAdd} disabled={saving || !formData.name.trim() || !formData.price} className="w-full btn-primary text-sm">
              {saving ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                filterCategory === cat ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant'
              }`}>{cat}</button>
          ))}
        </div>

        {/* Product list */}
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse !p-3"><div className="flex gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high" />
              <div className="flex-1 space-y-2"><div className="h-3 bg-surface-container-high rounded w-2/3" /><div className="h-3 bg-surface-container-high rounded w-1/3" /></div>
            </div></div>
          ))}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="inventory_2" size="xl" className="text-on-surface-variant mb-3" />
            <p className="text-on-surface-variant">Koi product nahi</p>
            <p className="text-on-surface-variant text-sm mt-1">Pehla product add karein</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((product) => (
              <div key={product.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <ProductCard product={product} compact />
                </div>
                <button onClick={() => toggleAvailability(product)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    product.isAvailable ? 'bg-secondary-container text-success' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>{product.isAvailable ? 'On' : 'Off'}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
