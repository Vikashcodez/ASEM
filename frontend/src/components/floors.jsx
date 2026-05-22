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
  ChevronLeft,
  ChevronRight,
  Building2,
  Tag,
  Link as LinkIcon,
  TrendingUp,
  PieChart,
  MapPin,
  ArrowUp,
  ArrowDown,
  Home,
  Database,
  BarChart3
} from 'lucide-react';

const floorsApi = `${import.meta.env.VITE_API_URL}/floors`;
const terminalsApi = `${import.meta.env.VITE_API_URL}/terminals`;
const blocksApi = `${import.meta.env.VITE_API_URL}/blocks`;

function Floors() {
  // State Management
  const [floors, setFloors] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [hierarchyData, setHierarchyData] = useState([]);
  
  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    terminal_id: '',
    block_id: '',
    min_floor: '',
    max_floor: '',
    sort_by: 'floor_number',
    sort_order: 'ASC'
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // UI States
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form Data
  const [formData, setFormData] = useState({
    terminal_id: '',
    block_id: '',
    floor_name: '',
    floor_number: '',
    description: '',
    is_active: true
  });

  // Statistics
  const [stats, setStats] = useState({
    total_floors: 0,
    active_floors: 0,
    inactive_floors: 0,
    terminals_with_floors: 0,
    blocks_with_floors: 0,
    floors_in_blocks: 0,
    floors_direct_in_terminals: 0,
    lowest_floor: 0,
    highest_floor: 0,
    avg_floor_number: 0,
    floors_with_description: 0
  });

  useEffect(() => {
    fetchFloors();
    fetchTerminals();
    fetchStats();
    fetchHierarchy();
  }, []);

  useEffect(() => {
    if (filters.terminal_id) {
      fetchBlocksByTerminal(filters.terminal_id);
    } else {
      setFilteredBlocks([]);
    }
  }, [filters.terminal_id]);

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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/floors/stats`, getAuthConfig());
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchHierarchy = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/floors/hierarchy/floors`, getAuthConfig());
      setHierarchyData(response.data.data);
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
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

  const fetchBlocksByTerminal = async (terminalId) => {
    try {
      const response = await axios.get(`${blocksApi}?terminal_id=${terminalId}`, getAuthConfig());
      setFilteredBlocks(response.data.data || []);
    } catch (err) {
      console.error('Error fetching blocks:', err);
    }
  };

  const fetchFloors = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.search) params.search = filters.search;
      if (filters.status !== 'all') params.is_active = filters.status === 'active';
      if (filters.terminal_id) params.terminal_id = filters.terminal_id;
      if (filters.block_id) params.block_id = filters.block_id;
      if (filters.min_floor) params.min_floor = filters.min_floor;
      if (filters.max_floor) params.max_floor = filters.max_floor;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;
      
      const response = await axios.get(floorsApi, { params, ...getAuthConfig() });
      setFloors(response.data.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to fetch floors' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const applyFilters = async () => {
    await fetchFloors();
    setShowFilters(false);
  };

  const resetFilters = async () => {
    setFilters({
      search: '',
      status: 'all',
      terminal_id: '',
      block_id: '',
      min_floor: '',
      max_floor: '',
      sort_by: 'floor_number',
      sort_order: 'ASC'
    });
    setCurrentPage(1);
    await fetchFloors();
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
      block_id: '',
      floor_name: '',
      floor_number: '',
      description: '',
      is_active: true
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.floor_name.trim()) {
      setMessage({ type: 'error', text: 'Floor name is required' });
      return;
    }
    
    if (!formData.floor_number && formData.floor_number !== 0) {
      setMessage({ type: 'error', text: 'Floor number is required' });
      return;
    }
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const payload = {
        terminal_id: formData.terminal_id || null,
        block_id: formData.block_id || null,
        floor_name: formData.floor_name.trim(),
        floor_number: parseInt(formData.floor_number),
        description: formData.description || null,
        is_active: formData.is_active
      };
      
      if (editingId) {
        await axios.put(`${floorsApi}/${editingId}`, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Floor updated successfully' });
      } else {
        await axios.post(floorsApi, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Floor created successfully' });
      }
      
      resetForm();
      await fetchFloors();
      await fetchStats();
      await fetchHierarchy();
      setActiveTab('list');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save floor' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (floor) => {
    setEditingId(floor.id);
    setFormData({
      terminal_id: floor.terminal_id || '',
      block_id: floor.block_id || '',
      floor_name: floor.floor_name,
      floor_number: floor.floor_number,
      description: floor.description || '',
      is_active: floor.is_active
    });
    if (floor.terminal_id) {
      fetchBlocksByTerminal(floor.terminal_id);
    }
    setActiveTab('form');
  };

  const handleDelete = async (id, name, number) => {
    if (!window.confirm(`Are you sure you want to delete floor "${name}" (Level ${number})?`)) return;
    
    try {
      setDeletingId(id);
      await axios.delete(`${floorsApi}/${id}`, getAuthConfig());
      setMessage({ type: 'success', text: 'Floor deleted successfully' });
      await fetchFloors();
      await fetchStats();
      await fetchHierarchy();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete floor' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (floor) => {
    try {
      setTogglingId(floor.id);
      const action = floor.is_active ? 'deactivate' : 'activate';
      await axios.patch(`${floorsApi}/${floor.id}/${action}`, {}, getAuthConfig());
      setMessage({ type: 'success', text: `Floor ${action}d successfully` });
      await fetchFloors();
      await fetchStats();
      await fetchHierarchy();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update status' });
    } finally {
      setTogglingId(null);
    }
  };

  const getFloorIcon = (floorNumber) => {
    if (floorNumber < 0) return <ArrowDown className="w-4 h-4" />;
    if (floorNumber === 0) return <Home className="w-4 h-4" />;
    return <ArrowUp className="w-4 h-4" />;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = floors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(floors.length / itemsPerPage);

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
                <h1 className="text-4xl font-bold mb-2">Floor Management</h1>
                <p className="text-blue-100 max-w-2xl">
                  Manage floors, levels, and stories within terminals and blocks
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Layers className="w-5 h-5 mb-2 text-blue-300" />
                  <div className="text-2xl font-bold">{stats.total_floors}</div>
                  <div className="text-xs text-blue-200 mt-1">Total Floors</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Activity className="w-5 h-5 mb-2 text-green-300" />
                  <div className="text-2xl font-bold">{stats.active_floors}</div>
                  <div className="text-xs text-blue-200 mt-1">Active</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Building2 className="w-5 h-5 mb-2 text-yellow-300" />
                  <div className="text-2xl font-bold">{stats.terminals_with_floors}</div>
                  <div className="text-xs text-blue-200 mt-1">Terminals</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <TrendingUp className="w-5 h-5 mb-2 text-purple-300" />
                  <div className="text-2xl font-bold">{stats.avg_floor_number}</div>
                  <div className="text-xs text-blue-200 mt-1">Avg Level</div>
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
              Floor Directory
              {floors.length > 0 && activeTab !== 'list' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {floors.length}
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
              {editingId ? 'Edit Floor' : 'Add Floor'}
            </button>
            <button
              onClick={() => {
                setActiveTab('analytics');
                fetchHierarchy();
              }}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'analytics' 
                  ? 'bg-[#0B1D3A] text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics & Hierarchy
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

        {/* Analytics & Hierarchy Section */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.total_floors}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Total Floors</h3>
                <p className="text-xs text-gray-500 mt-1">Across all locations</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <PieChart className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.total_floors > 0 
                      ? ((stats.active_floors / stats.total_floors) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Active Rate</h3>
                <p className="text-xs text-gray-500 mt-1">{stats.active_floors} active floors</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.floors_in_blocks}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Floors in Blocks</h3>
                <p className="text-xs text-gray-500 mt-1">Organized within blocks</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <MapPin className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.floors_direct_in_terminals}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Direct Floors</h3>
                <p className="text-xs text-gray-500 mt-1">In terminals without blocks</p>
              </div>
            </div>

            {/* Floor Range Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Floor Level Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">Lowest Floor</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.lowest_floor !== undefined ? `Level ${stats.lowest_floor}` : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">Highest Floor</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.highest_floor !== undefined ? `Level ${stats.highest_floor}` : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">Average Level</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.avg_floor_number || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Hierarchy View */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Complete Floor Hierarchy
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Terminals ➔ Blocks ➔ Floors structure
                </p>
              </div>
              <div className="p-6">
                {hierarchyData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hierarchy data available
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Terminal</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Direct Floors</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Blocks & Floors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {hierarchyData.map((terminal) => (
                          <tr key={terminal.terminal_id} className="align-top hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[#0B1D3A] text-white">
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-900">{terminal.terminal_name}</h4>
                                    {terminal.terminal_code && (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        {terminal.terminal_code}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">Terminal ID: {terminal.terminal_id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              {terminal.direct_floors && terminal.direct_floors.length > 0 ? (
                                <div className="space-y-2">
                                  {terminal.direct_floors.map((floor) => (
                                    <div
                                      key={floor.id}
                                      className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 ${
                                        floor.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          {getFloorIcon(floor.floor_number)}
                                          <span className="font-medium text-gray-900">Level {floor.floor_number}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{floor.floor_name}</p>
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                                        floor.is_active ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {floor.is_active ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">No direct floors</span>
                              )}
                            </td>
                            <td className="px-6 py-5">
                              {terminal.blocks && terminal.blocks.length > 0 ? (
                                <div className="space-y-3">
                                  {terminal.blocks.map((block) => (
                                    <div key={block.block_id} className="rounded-lg border border-gray-200 p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Layers className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium text-gray-800">{block.block_name}</span>
                                        {block.block_code && (
                                          <span className="text-xs text-gray-500">({block.block_code})</span>
                                        )}
                                      </div>
                                      {block.floors && block.floors.length > 0 ? (
                                        <div className="space-y-2">
                                          {block.floors.map((floor) => (
                                            <div
                                              key={floor.id}
                                              className={`flex items-center justify-between gap-3 rounded border px-3 py-2 ${
                                                floor.is_active ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                {getFloorIcon(floor.floor_number)}
                                                <span className="text-sm font-medium text-gray-900">Level {floor.floor_number}</span>
                                              </div>
                                              <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${
                                                floor.is_active ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                                              }`}>
                                                {floor.floor_name}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-500">No floors configured</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">No blocks configured</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Section */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Floor' : 'Add New Floor'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingId ? 'Update floor information' : 'Create a new floor level within a terminal or block'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Floor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="floor_name"
                      value={formData.floor_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Departure Level, Concourse Level, Basement"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Floor Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="floor_number"
                      value={formData.floor_number}
                      onChange={handleInputChange}
                      placeholder="e.g., 0 for Ground, 1, 2, -1 for Basement"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use negative numbers for basement levels, 0 for ground level
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
                        onChange={(e) => {
                          const terminalId = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            terminal_id: terminalId,
                            block_id: ''
                          }));
                          if (terminalId) {
                            fetchBlocksByTerminal(terminalId);
                          } else {
                            setFilteredBlocks([]);
                          }
                        }}
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
                      Block (Optional)
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="block_id"
                        value={formData.block_id}
                        onChange={handleInputChange}
                        disabled={!formData.terminal_id}
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Block (Optional)</option>
                        {filteredBlocks.map(block => (
                          <option key={block.id} value={block.id}>
                            {block.block_name} {block.block_code && `(${block.block_code})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!formData.terminal_id && (
                      <p className="text-xs text-amber-600 mt-1">
                        Select a terminal first to see available blocks
                      </p>
                    )}
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
                      placeholder="Describe the floor's purpose, facilities, accessibility features..."
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100 resize-none"
                    />
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      Floor Information
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
                            <strong>Location:</strong> {terminals.find(t => t.id === parseInt(formData.terminal_id))?.terminal_name}
                            {formData.block_id && ` > ${filteredBlocks.find(b => b.id === parseInt(formData.block_id))?.block_name}`}
                          </p>
                        </div>
                      )}
                      
                      <div className="border-t border-blue-200 pt-3">
                        <p className="text-xs text-gray-500">
                          <strong>Note:</strong> Floor numbers must be unique within the same terminal or block.
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
                      {editingId ? 'Update Floor' : 'Create Floor'}
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
                  <h2 className="text-xl font-bold text-gray-900">Floor Directory</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage all floors and levels across terminals and blocks
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
                      placeholder="Search floors..."
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
                    value={filters.block_id}
                    onChange={(e) => handleFilterChange('block_id', e.target.value)}
                    disabled={!filters.terminal_id}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                  >
                    <option value="">All Blocks</option>
                    {filteredBlocks.map(block => (
                      <option key={block.id} value={block.id}>
                        {block.block_name}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    value={filters.min_floor}
                    onChange={(e) => handleFilterChange('min_floor', e.target.value)}
                    placeholder="Min Floor Level"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  
                  <input
                    type="number"
                    value={filters.max_floor}
                    onChange={(e) => handleFilterChange('max_floor', e.target.value)}
                    placeholder="Max Floor Level"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
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

            {/* Floors Table View */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader className="w-8 h-8 animate-spin text-[#0B1D3A]" />
                <p className="mt-3 text-gray-500">Loading floors...</p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-gray-50 rounded-full p-4 mb-4">
                  <Layers className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No floors found</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {filters.search || filters.status !== 'all' || filters.terminal_id || filters.block_id
                    ? 'Try adjusting your filters' 
                    : 'Add your first floor to get started'}
                </p>
                {(filters.search || filters.status !== 'all' || filters.terminal_id || filters.block_id) && (
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
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Floor</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {currentItems.map((floor) => (
                      <tr key={floor.id} className="hover:bg-gray-50 transition-colors align-top">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-2 rounded-lg ${floor.terminal_name ? 'bg-[#0B1D3A] text-white' : 'bg-gray-700 text-white'}`}>
                              {getFloorIcon(floor.floor_number)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Level {floor.floor_number}</p>
                              <p className="text-sm text-gray-500">{floor.floor_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm text-gray-700">
                            {floor.terminal_name ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>{floor.terminal_name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">No Terminal</span>
                            )}
                            {floor.block_name ? (
                              <div className="flex items-center gap-2 ml-4">
                                <Tag className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-600">{floor.block_name}</span>
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="max-w-md line-clamp-2">
                            {floor.description || 'No description provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {floor.created_at?.split(' ')[0] || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            floor.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${floor.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {floor.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(floor)}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(floor)}
                              disabled={togglingId === floor.id}
                              className={`p-2 rounded-lg transition-all disabled:opacity-50 ${floor.is_active ? 'text-amber-700 hover:bg-amber-50' : 'text-green-700 hover:bg-green-50'}`}
                              title={floor.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {togglingId === floor.id ? <Loader className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(floor.id, floor.floor_name, floor.floor_number)}
                              disabled={deletingId === floor.id}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === floor.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
            {!loading && floors.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, floors.length)} of {floors.length} floors
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

export default Floors;