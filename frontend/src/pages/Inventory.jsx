import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Search, Filter, AlertTriangle, Package, DollarSign, Archive, X } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '', name: '', category: '', supplier: '', description: '', price: 0, stock: 0, reorderPoint: 10
  });

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Derived state
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter ? product.category === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const metrics = useMemo(() => {
    return {
      total: products.length,
      value: products.reduce((acc, p) => acc + (p.price * p.stock), 0),
      lowStock: products.filter(p => p.stock <= p.reorderPoint && p.stock > 0).length,
      outOfStock: products.filter(p => p.stock === 0).length,
    };
  }, [products]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const openAddModal = () => {
    setFormData({ sku: '', name: '', category: '', supplier: '', description: '', price: 0, stock: 0, reorderPoint: 10 });
    setIsAddModalOpen(true);
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      supplier: product.supplier || '',
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      reorderPoint: product.reorderPoint
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (product) => {
    setCurrentProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', formData);
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert(error.response?.data?.message || 'Error adding product');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/${currentProduct._id}`, formData);
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/products/${currentProduct._id}`);
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-textMain">Inventory Management</h1>
        <button 
          onClick={openAddModal}
          className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-textMuted">Total Products</p>
            <h3 className="text-2xl font-bold text-textMain">{metrics.total}</h3>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-textMuted">Total Value</p>
            <h3 className="text-2xl font-bold text-textMain">${metrics.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-textMuted">Low Stock</p>
            <h3 className="text-2xl font-bold text-textMain">{metrics.lowStock}</h3>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <Archive size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-textMuted">Out of Stock</p>
            <h3 className="text-2xl font-bold text-textMain">{metrics.outOfStock}</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Filter size={18} />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain appearance-none bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-textMuted text-sm">
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium">Product Name</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Supplier</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-textMuted">Loading products...</td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-textMuted">No products found matching your criteria.</td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-textMuted font-mono text-sm">{product.sku}</td>
                    <td className="p-4 text-textMain font-medium">{product.name}</td>
                    <td className="p-4 text-textMuted text-sm">{product.category}</td>
                    <td className="p-4 text-textMuted text-sm">{product.supplier || '-'}</td>
                    <td className="p-4 text-textMain text-sm">${product.price.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        product.stock === 0 ? 'bg-red-50 text-red-600 border border-red-200' :
                        product.stock <= product.reorderPoint 
                          ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => openEditModal(product)} className="p-1.5 text-textMuted hover:text-primary transition-colors bg-white border border-slate-200 shadow-sm rounded-md hover:bg-slate-50">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => openDeleteModal(product)} className="p-1.5 text-textMuted hover:text-red-500 transition-colors bg-white border border-slate-200 shadow-sm rounded-md hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white">
            <p className="text-sm text-textMuted">
              Showing <span className="font-medium text-textMain">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-textMain">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-medium text-textMain">{filteredProducts.length}</span> results
            </p>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md text-textMain hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md text-textMain hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals overlay */}
      {(isAddModalOpen || isEditModalOpen || isDeleteModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          
          {/* Add / Edit Form Modal */}
          {(isAddModalOpen || isEditModalOpen) && (
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-textMain">{isAddModalOpen ? 'Add New Product' : 'Edit Product'}</h2>
                <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="text-textMuted hover:text-textMain transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-textMain mb-1">SKU</label>
                    <input required type="text" name="sku" value={formData.sku} onChange={handleInputChange} disabled={isEditModalOpen} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain disabled:bg-slate-100 disabled:text-textMuted" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMain mb-1">Product Name</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMain mb-1">Category</label>
                    <input required type="text" name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMain mb-1">Supplier</label>
                    <input required type="text" name="supplier" value={formData.supplier} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-textMain mb-1">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMain mb-1">Unit Price ($)</label>
                    <input required type="number" step="0.01" min="0" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMain mb-1">Current Stock</label>
                    <input required type="number" min="0" name="stock" value={formData.stock} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMain mb-1">Min. Threshold</label>
                    <input required type="number" min="0" name="reorderPoint" value={formData.reorderPoint} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-textMain bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primaryHover transition-colors">
                    {isAddModalOpen ? 'Add Product' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && (
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-textMain text-center mb-2">Delete Product</h3>
                <p className="text-sm text-textMuted text-center mb-6">
                  Are you sure you want to delete <strong>{currentProduct?.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-textMain bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
};

export default Inventory;
