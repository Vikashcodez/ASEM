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
  Grid,
  Layers,
  Activity,
  Calendar,
  Hash,
  FileText,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Building2,
  Tag,
  Type,
  Link as LinkIcon,
  Server,
} from 'lucide-react';

const blocksApi = `${import.meta.env.VITE_API_URL}/blocks`;
const terminalsApi = `${import.meta.env.VITE_API_URL}/terminals`;

function Blocks() {
  // State Management
  const [blocks, setBlocks] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  
  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    terminal_id: '',
    block_type: '',
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
    terminal_id: '',
    block_name: '',
    block_code: '',
    block_type: '',
    description: '',
    is_active: true
  });

  // Statistics
  const [stats, setStats] = useState({
    total_blocks: 0,
    active_blocks: 0,
    inactive_blocks: 0,
    unique_types: 0,
    terminals_with_blocks: 0,
    linked_blocks: 0,
    blocks_with_description: 0
  });

  // Block Types
  const [blockTypes, setBlockTypes] = useState([]);

  useEffect(() => {
    fetchBlocks();
    fetchTerminals();
    fetchStats();
    fetchBlockTypes();
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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/blocks/stats`, getAuthConfig());
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchBlockTypes = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/blocks/types/all`, getAuthConfig());
      setBlockTypes(response.data.data);
    } catch (err) {
      console.error('Error fetching block types:', err);
    }
  };

  const fetchTerminals = async () => {
    try {
      const response = await axios.get(terminalsApi, getAuthConfig());
      setTerminals(response.data.data || []);
    } catch (err) {
      console.error('Error fetching terminals:', err);
    }
  };

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.search) params.search = filters.search;
      if (filters.status !== 'all') params.is_active = filters.status === 'active';
      if (filters.terminal_id) params.terminal_id = filters.terminal_id;
      if (filters.block_type) params.block_type = filters.block_type;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;
      
      const response = await axios.get(blocksApi, { params, ...getAuthConfig() });
      setBlocks(response.data.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to fetch blocks' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const applyFilters = async () => {
    await fetchBlocks();
    setShowFilters(false);
  };

  const resetFilters = async () => {
    setFilters({
      search: '',
      status: 'all',
      terminal_id: '',
      block_type: '',
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
    setCurrentPage(1);
    await fetchBlocks();
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
      terminal_id: '',
      block_name: '',
      block_code: '',
      block_type: '',
      description: '',
      is_active: true
    });
    setEditingId(null);
    setSelectedTerminal(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.block_name.trim()) {
      setMessage({ type: 'error', text: 'Block name is required' });
      return;
    }
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const payload = {
        terminal_id: formData.terminal_id || null,
        block_name: formData.block_name.trim(),
        block_code: formData.block_code.trim() || undefined,
        block_type: formData.block_type || null,
        description: formData.description || null,
        is_active: formData.is_active
      };
      
      if (editingId) {
        await axios.put(`${blocksApi}/${editingId}`, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Block updated successfully' });
      } else {
        await axios.post(blocksApi, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Block created successfully' });
      }
      
      resetForm();
      await fetchBlocks();
      await fetchStats();
      await fetchBlockTypes();
      setActiveTab('list');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save block' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (block) => {
    setEditingId(block.id);
    setFormData({
      terminal_id: block.terminal_id || '',
      block_name: block.block_name,
      block_code: block.block_code || '',
      block_type: block.block_type || '',
      description: block.description || '',
      is_active: block.is_active
    });
    setSelectedTerminal(block);
    setActiveTab('form');
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete block "${name}"?`)) return;
    
    try {
      setDeletingId(id);
      await axios.delete(`${blocksApi}/${id}`, getAuthConfig());
      setMessage({ type: 'success', text: 'Block deleted successfully' });
      await fetchBlocks();
      await fetchStats();
      await fetchBlockTypes();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete block' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (block) => {
    try {
      setTogglingId(block.id);
      const action = block.is_active ? 'deactivate' : 'activate';
      await axios.patch(`${blocksApi}/${block.id}/${action}`, {}, getAuthConfig());
      setMessage({ type: 'success', text: `Block ${action}d successfully` });
      await fetchBlocks();
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

  const getTerminalName = (terminalId) => {
    const terminal = terminals.find(t => t.id === terminalId);
    return terminal ? terminal.terminal_name : 'No Terminal';
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = blocks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(blocks.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] via-[#132D5E] to-[#1A3A6E] p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-blue-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                    Infrastructure Management
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-2">Block Management</h1>
                <p className="text-blue-100 max-w-2xl">
                  Manage blocks, sections, and zones within terminals across your organization
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Layers className="w-5 h-5 mb-2 text-blue-300" />
                  <div className="text-2xl font-bold">{stats.total_blocks}</div>
                  <div className="text-xs text-blue-200 mt-1">Total Blocks</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Activity className="w-5 h-5 mb-2 text-green-300" />
                  <div className="text-2xl font-bold">{stats.active_blocks}</div>
                  <div className="text-xs text-blue-200 mt-1">Active</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Tag className="w-5 h-5 mb-2 text-yellow-300" />
                  <div className="text-2xl font-bold">{stats.unique_types}</div>
                  <div className="text-xs text-blue-200 mt-1">Block Types</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Building2 className="w-5 h-5 mb-2 text-purple-300" />
                  <div className="text-2xl font-bold">{stats.terminals_with_blocks}</div>
                  <div className="text-xs text-blue-200 mt-1">Terminals</div>
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
              <Grid className="w-4 h-4" />
              Block Directory
              {blocks.length > 0 && activeTab !== 'list' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {blocks.length}
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
              {editingId ? 'Edit Block' : 'Add Block'}
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
                {editingId ? 'Edit Block' : 'Add New Block'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingId ? 'Update block information' : 'Create a new block, section, or zone within a terminal'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Block Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="block_name"
                      value={formData.block_name}
                      onChange={handleInputChange}
                      placeholder="e.g., North Wing, Gate A1, Security Zone"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Unique name for this block or section
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Block Code
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="block_code"
                        value={formData.block_code}
                        onChange={handleInputChange}
                        placeholder="e.g., NW-01, A1, SEC-ZONE"
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Optional unique code (auto-generated if left empty)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Terminal
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="terminal_id"
                        value={formData.terminal_id}
                        onChange={handleInputChange}
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">Select Terminal (Optional)</option>
                        {terminals.map(terminal => (
                          <option key={terminal.id} value={terminal.id}>
                            {terminal.terminal_name} {terminal.terminal_code && `(${terminal.terminal_code})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Block Type
                    </label>
                    <div className="relative">
                      <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="block_type"
                        value={formData.block_type}
                        onChange={handleInputChange}
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">Select Type</option>
                        <option value="Passenger">Passenger Area</option>
                        <option value="Cargo">Cargo Area</option>
                        <option value="Gate">Gate</option>
                        <option value="Security">Security Zone</option>
                        <option value="Retail">Retail Area</option>
                        <option value="Baggage">Baggage Claim</option>
                        <option value="Customs">Customs Area</option>
                        <option value="Immigration">Immigration</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Administrative">Administrative</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="6"
                      placeholder="Describe the block's purpose, location, features, and any important notes..."
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100 resize-none"
                    />
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      Block Information
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
                      
                      {formData.terminal_id && (
                        <div className="border-t border-blue-200 pt-3">
                          <p className="text-xs text-blue-700">
                            <strong>Linked to:</strong> {getTerminalName(parseInt(formData.terminal_id))}
                          </p>
                        </div>
                      )}
                      
                      <div className="border-t border-blue-200 pt-3">
                        <p className="text-xs text-gray-500">
                          <strong>Note:</strong> Inactive blocks won't be available for operations or assignments.
                        </p>
                      </div>
                    </div>
                  </div>
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
                      {editingId ? 'Update Block' : 'Create Block'}
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
                  <h2 className="text-xl font-bold text-gray-900">Block Directory</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage all blocks, sections, and zones across terminals
                  </p>
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>

              <div className={`mt-4 ${showFilters ? 'block' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search blocks..."
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
                    value={filters.terminal_id}
                    onChange={(e) => handleFilterChange('terminal_id', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Terminals</option>
                    {terminals.map(terminal => (
                      <option key={terminal.id} value={terminal.id}>
                        {terminal.terminal_name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.block_type}
                    onChange={(e) => handleFilterChange('block_type', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Block Types</option>
                    {blockTypes.map(type => (
                      <option key={type.block_type} value={type.block_type}>
                        {type.block_type} ({type.count})
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.sort_by}
                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="created_at">Sort by Created Date</option>
                    <option value="block_name">Sort by Name</option>
                    <option value="block_code">Sort by Code</option>
                    <option value="block_type">Sort by Type</option>
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

            {/* Blocks Table View */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader className="w-8 h-8 animate-spin text-[#0B1D3A]" />
                <p className="mt-3 text-gray-500">Loading blocks...</p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-gray-50 rounded-full p-4 mb-4">
                  <Layers className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No blocks found</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {filters.search || filters.status !== 'all' || filters.terminal_id || filters.block_type
                    ? 'Try adjusting your filters' 
                    : 'Add your first block to get started'}
                </p>
                {(filters.search || filters.status !== 'all' || filters.terminal_id || filters.block_type) && (
                  <button onClick={resetFilters} className="text-[#0B1D3A] text-sm font-semibold">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Block</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Terminal</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {currentItems.map((block) => (
                      <tr key={block.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-2 rounded-lg ${block.terminal_name ? 'bg-[#0B1D3A] text-white' : 'bg-gray-700 text-white'}`}>
                              <Layers className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{block.block_name}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">{block.description || 'No description provided'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {block.block_code ? (
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">{block.block_code}</code>
                              <button onClick={() => copyToClipboard(block.block_code)} className="text-gray-400 hover:text-gray-700">
                                {copiedCode === block.block_code ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {block.terminal_name ? (
                              <span className="inline-flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                {block.terminal_name}
                              </span>
                            ) : (
                              <span className="text-gray-400">No Terminal</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {block.block_type ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                              <Tag className="w-3 h-3 text-gray-400" />
                              {block.block_type}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            block.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${block.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {block.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {block.created_at?.split(' ')[0] || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(block)}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(block)}
                              disabled={togglingId === block.id}
                              className={`p-2 rounded-lg transition-all disabled:opacity-50 ${block.is_active ? 'text-amber-700 hover:bg-amber-50' : 'text-green-700 hover:bg-green-50'}`}
                              title={block.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {togglingId === block.id ? <Loader className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(block.id, block.block_name)}
                              disabled={deletingId === block.id}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === block.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && blocks.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, blocks.length)} of {blocks.length} blocks
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

export default Blocks;