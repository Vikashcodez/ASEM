import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Filter,
  X,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  EyeOff,
  Loader,
  Server,
  Activity,
  Calendar,
  Hash,
  FileText,
  Copy,
  Check,
  Download,
  Upload,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Terminal as TerminalIcon,
  Code,
  Info
} from 'lucide-react';

const terminalsApi = `${import.meta.env.VITE_API_URL}/terminals`;

function Terminals() {
  // State Management
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table or grid
  const [showFilters, setShowFilters] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  
  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sort_by: 'created_at',
    sort_order: 'DESC'
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // UI States
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form Data
  const [formData, setFormData] = useState({
    terminal_name: '',
    terminal_code: '',
    description: '',
    is_active: true
  });

  // Statistics
  const [stats, setStats] = useState({
    total_terminals: 0,
    active_terminals: 0,
    inactive_terminals: 0,
    unique_codes: 0,
    terminals_with_description: 0
  });

  useEffect(() => {
    fetchTerminals();
    fetchStats();
  }, []);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/stats/terminals`, getAuthConfig());
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchTerminals = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.search) params.search = filters.search;
      if (filters.status !== 'all') params.is_active = filters.status === 'active';
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;
      
      const response = await axios.get(terminalsApi, { params, ...getAuthConfig() });
      setTerminals(response.data.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to fetch terminals' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const applyFilters = async () => {
    await fetchTerminals();
    setShowFilters(false);
  };

  const resetFilters = async () => {
    setFilters({
      search: '',
      status: 'all',
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
    setCurrentPage(1);
    await fetchTerminals();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      terminal_name: '',
      terminal_code: '',
      description: '',
      is_active: true
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.terminal_name.trim()) {
      setMessage({ type: 'error', text: 'Terminal name is required' });
      return;
    }
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const payload = {
        terminal_name: formData.terminal_name.trim(),
        terminal_code: formData.terminal_code.trim() || undefined,
        description: formData.description || null,
        is_active: formData.is_active
      };
      
      if (editingId) {
        await axios.put(`${terminalsApi}/${editingId}`, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Terminal updated successfully' });
      } else {
        await axios.post(terminalsApi, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Terminal created successfully' });
      }
      
      resetForm();
      await fetchTerminals();
      await fetchStats();
      setActiveTab('list');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save terminal' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (terminal) => {
    setEditingId(terminal.id);
    setFormData({
      terminal_name: terminal.terminal_name,
      terminal_code: terminal.terminal_code || '',
      description: terminal.description || '',
      is_active: terminal.is_active
    });
    setActiveTab('form');
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete terminal "${name}"?`)) return;
    
    try {
      setDeletingId(id);
      await axios.delete(`${terminalsApi}/${id}`, getAuthConfig());
      setMessage({ type: 'success', text: 'Terminal deleted successfully' });
      await fetchTerminals();
      await fetchStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete terminal' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (terminal) => {
    try {
      setTogglingId(terminal.id);
      const action = terminal.is_active ? 'deactivate' : 'activate';
      await axios.patch(`${terminalsApi}/${terminal.id}/${action}`, {}, getAuthConfig());
      setMessage({ type: 'success', text: `Terminal ${action}d successfully` });
      await fetchTerminals();
      await fetchStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update status' });
    } finally {
      setTogglingId(null);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = terminals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(terminals.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] via-[#132D5E] to-[#1A3A6E] p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TerminalIcon className="w-5 h-5 text-blue-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                    Infrastructure Management
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-2">Terminal Management</h1>
                <p className="text-blue-100 max-w-2xl">
                  Manage terminals, locations, and operational points across your organization
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Server className="w-5 h-5 mb-2 text-blue-300" />
                  <div className="text-2xl font-bold">{stats.total_terminals}</div>
                  <div className="text-xs text-blue-200 mt-1">Total</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Activity className="w-5 h-5 mb-2 text-green-300" />
                  <div className="text-2xl font-bold">{stats.active_terminals}</div>
                  <div className="text-xs text-blue-200 mt-1">Active</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <EyeOff className="w-5 h-5 mb-2 text-gray-300" />
                  <div className="text-2xl font-bold">{stats.inactive_terminals}</div>
                  <div className="text-xs text-blue-200 mt-1">Inactive</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Hash className="w-5 h-5 mb-2 text-yellow-300" />
                  <div className="text-2xl font-bold">{stats.unique_codes}</div>
                  <div className="text-xs text-blue-200 mt-1">Unique Codes</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <FileText className="w-5 h-5 mb-2 text-purple-300" />
                  <div className="text-2xl font-bold">{stats.terminals_with_description}</div>
                  <div className="text-xs text-blue-200 mt-1">Described</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1">
            <button
              onClick={() => {
                setActiveTab('list');
                setMessage({ type: '', text: '' });
              }}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'list' 
                  ? 'bg-[#0B1D3A] text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Server className="w-4 h-4" />
              Terminal Directory
              {terminals.length > 0 && activeTab !== 'list' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {terminals.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                resetForm();
                setActiveTab('form');
              }}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'form' 
                  ? 'bg-[#0B1D3A] text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              {editingId ? 'Edit Terminal' : 'Add Terminal'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`mb-6 rounded-xl p-4 flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="flex-1 text-sm">{message.text}</p>
            <button onClick={() => setMessage({ type: '', text: '' })}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Section */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Terminal' : 'Add New Terminal'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingId ? 'Update terminal information' : 'Create a new terminal location or operational point'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Terminal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="terminal_name"
                      value={formData.terminal_name}
                      onChange={handleInputChange}
                      placeholder="e.g., International Terminal, Cargo Terminal"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Unique name for this terminal location
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Terminal Code
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="terminal_code"
                        value={formData.terminal_code}
                        onChange={handleInputChange}
                        placeholder="e.g., T1, INTL, CARGO"
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Optional unique code (auto-generated if left empty)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Describe the terminal's purpose, location, facilities..."
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100 resize-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      Terminal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B1D3A]"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700">
                            {formData.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </div>
                      
                      <div className="border-t border-blue-200 pt-3">
                        <p className="text-xs text-gray-500">
                          <strong>Note:</strong> Inactive terminals won't be available for operations or assignments.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {!editingId && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Quick Tip
                      </h4>
                      <p className="text-xs text-gray-500">
                        Terminal codes are automatically generated from the terminal name if not provided.
                        This ensures unique identification across the system.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#0B1D3A] text-white rounded-xl text-sm font-semibold hover:bg-[#132D5E] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingId ? 'Update Terminal' : 'Create Terminal'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    if (!editingId) setActiveTab('list');
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List Section */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Filters Bar */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Terminal Directory</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage all terminal locations and operational points
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* View Toggle */}
                  <div className="flex rounded-lg border border-gray-200 p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'table' ? 'bg-[#0B1D3A] text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'grid' ? 'bg-[#0B1D3A] text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </button>
                </div>
              </div>

              <div className={`mt-4 ${showFilters ? 'block' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search terminals..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  
                  <select
                    value={filters.sort_by}
                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="created_at">Sort by Created Date</option>
                    <option value="terminal_name">Sort by Name</option>
                    <option value="terminal_code">Sort by Code</option>
                    <option value="updated_at">Sort by Updated Date</option>
                  </select>
                  
                  <select
                    value={filters.sort_order}
                    onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="DESC">Descending</option>
                    <option value="ASC">Ascending</option>
                  </select>
                </div>
                
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-[#0B1D3A] text-white rounded-lg text-sm font-semibold"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader className="w-8 h-8 animate-spin text-[#0B1D3A]" />
                <p className="mt-3 text-gray-500">Loading terminals...</p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-gray-50 rounded-full p-4 mb-4">
                  <Server className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No terminals found</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {filters.search || filters.status !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Add your first terminal to get started'}
                </p>
                {(filters.search || filters.status !== 'all') && (
                  <button onClick={resetFilters} className="text-[#0B1D3A] text-sm font-semibold">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              /* Table View */
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">Terminal</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">Code</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">Created</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {currentItems.map((terminal) => (
                      <tr key={terminal.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{terminal.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${terminal.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="font-semibold text-gray-900">{terminal.terminal_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {terminal.terminal_code ? (
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                                {terminal.terminal_code}
                              </code>
                              <button
                                onClick={() => copyToClipboard(terminal.terminal_code)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {copiedCode === terminal.terminal_code ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {terminal.description || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            terminal.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {terminal.is_active ? (
                              <Activity className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            {terminal.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {terminal.created_at?.split(' ')[0] || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(terminal)}
                              className="p-2 text-gray-600 hover:text-[#0B1D3A] hover:bg-gray-100 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(terminal)}
                              disabled={togglingId === terminal.id}
                              className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                terminal.is_active 
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' 
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              }`}
                              title={terminal.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {togglingId === terminal.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(terminal.id, terminal.terminal_name)}
                              disabled={deletingId === terminal.id}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === terminal.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid View */
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentItems.map((terminal) => (
                    <div
                      key={terminal.id}
                      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <div className="bg-gradient-to-r from-[#0B1D3A] to-[#1A3A6E] p-4">
                        <div className="flex items-center justify-between">
                          <TerminalIcon className="w-8 h-8 text-white/80" />
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            terminal.is_active 
                              ? 'bg-green-500/20 text-green-200' 
                              : 'bg-gray-500/20 text-gray-200'
                          }`}>
                            {terminal.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-lg mt-3 truncate">
                          {terminal.terminal_name}
                        </h3>
                        {terminal.terminal_code && (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-white/70 text-xs font-mono">
                              {terminal.terminal_code}
                            </code>
                            <button
                              onClick={() => copyToClipboard(terminal.terminal_code)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedCode === terminal.terminal_code ? (
                                <Check className="w-3 h-3 text-green-300" />
                              ) : (
                                <Copy className="w-3 h-3 text-white/50 hover:text-white/70" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                          {terminal.description || 'No description provided'}
                        </p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {terminal.created_at?.split(' ')[0] || '-'}
                            </span>
                            <span className="font-mono">ID: {terminal.id}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(terminal)}
                              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(terminal)}
                              disabled={togglingId === terminal.id}
                              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                                terminal.is_active 
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                                  : 'text-green-700 bg-green-50 hover:bg-green-100'
                              }`}
                            >
                              {togglingId === terminal.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <Power className="w-3 h-3" />
                              )}
                              {terminal.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDelete(terminal.id, terminal.terminal_name)}
                              disabled={deletingId === terminal.id}
                              className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {deletingId === terminal.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {!loading && terminals.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, terminals.length)} of {terminals.length} terminals
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#0B1D3A] text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Terminals;