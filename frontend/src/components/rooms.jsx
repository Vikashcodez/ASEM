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
  DoorOpen,
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
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Check,
  Home,
  Layers,
  Clock,
  BarChart3,
  MapPin
} from 'lucide-react';

const roomsApi = `${import.meta.env.VITE_API_URL}/rooms`;
const terminalsApi = `${import.meta.env.VITE_API_URL}/terminals`;
const blocksApi = `${import.meta.env.VITE_API_URL}/blocks`;
const floorsApi = `${import.meta.env.VITE_API_URL}/floors`;

function Rooms() {
  // State Management
  const [rooms, setRooms] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [floors, setFloors] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);
  const [filteredFloors, setFilteredFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [occupancyData, setOccupancyData] = useState({
    occupancy_change: '',
    new_occupancy: ''
  });
  
  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    terminal_id: '',
    block_id: '',
    floor_id: '',
    room_type: '',
    room_status: '',
    min_capacity: '',
    max_capacity: '',
    occupancy_status: '',
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
    block_id: '',
    floor_id: '',
    room_name: '',
    room_code: '',
    room_type: '',
    max_capacity: 0,
    current_occupancy: 0,
    room_status: 'AVAILABLE',
    description: '',
    is_active: true
  });

  // Statistics
  const [stats, setStats] = useState({
    total_rooms: 0,
    active_rooms: 0,
    inactive_rooms: 0,
    unique_room_types: 0,
    terminals_with_rooms: 0,
    blocks_with_rooms: 0,
    floors_with_rooms: 0,
    total_capacity: 0,
    total_occupancy: 0,
    avg_capacity: 0,
    available_rooms: 0,
    occupied_rooms: 0,
    partially_occupied_rooms: 0,
    maintenance_rooms: 0,
    overall_occupancy_rate: 0
  });

  // Room Types
  const [roomTypes, setRoomTypes] = useState([]);
  
  // Status Summary
  const [statusSummary, setStatusSummary] = useState([]);

  useEffect(() => {
    fetchRooms();
    fetchTerminals();
    fetchStats();
    fetchRoomTypes();
    fetchStatusSummary();
  }, []);

  useEffect(() => {
    if (filters.terminal_id) {
      fetchBlocksByTerminal(filters.terminal_id);
      fetchFloorsByTerminal(filters.terminal_id);
    } else {
      setFilteredBlocks([]);
      setFilteredFloors([]);
    }
  }, [filters.terminal_id]);

  useEffect(() => {
    if (filters.block_id) {
      fetchFloorsByBlock(filters.block_id);
    }
  }, [filters.block_id]);

  useEffect(() => {
    if (formData.terminal_id) {
      fetchBlocksByTerminal(formData.terminal_id);
      fetchFloorsByTerminal(formData.terminal_id);
    } else {
      setFilteredBlocks([]);
      setFilteredFloors([]);
    }
  }, [formData.terminal_id]);

  useEffect(() => {
    if (formData.block_id) {
      fetchFloorsByBlock(formData.block_id);
    } else if (formData.terminal_id) {
      fetchFloorsByTerminal(formData.terminal_id);
    } else {
      setFilteredFloors([]);
    }
  }, [formData.block_id]);

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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/rooms/stats`, getAuthConfig());
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/rooms/types/all`, getAuthConfig());
      setRoomTypes(response.data.data);
    } catch (err) {
      console.error('Error fetching room types:', err);
    }
  };

  const fetchStatusSummary = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/rooms/status/summary`, getAuthConfig());
      setStatusSummary(response.data.data);
    } catch (err) {
      console.error('Error fetching status summary:', err);
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

  const fetchFloorsByTerminal = async (terminalId) => {
    try {
      const response = await axios.get(`${floorsApi}?terminal_id=${terminalId}`, getAuthConfig());
      setFilteredFloors(response.data.data || []);
    } catch (err) {
      console.error('Error fetching floors:', err);
    }
  };

  const fetchFloorsByBlock = async (blockId) => {
    try {
      const response = await axios.get(`${floorsApi}?block_id=${blockId}`, getAuthConfig());
      setFilteredFloors(response.data.data || []);
    } catch (err) {
      console.error('Error fetching floors:', err);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.search) params.search = filters.search;
      if (filters.status !== 'all') params.is_active = filters.status === 'active';
      if (filters.terminal_id) params.terminal_id = filters.terminal_id;
      if (filters.block_id) params.block_id = filters.block_id;
      if (filters.floor_id) params.floor_id = filters.floor_id;
      if (filters.room_type) params.room_type = filters.room_type;
      if (filters.room_status) params.room_status = filters.room_status;
      if (filters.min_capacity) params.min_capacity = filters.min_capacity;
      if (filters.max_capacity) params.max_capacity = filters.max_capacity;
      if (filters.occupancy_status) params.occupancy_status = filters.occupancy_status;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;
      
      const response = await axios.get(roomsApi, { params, ...getAuthConfig() });
      setRooms(response.data.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to fetch rooms' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const applyFilters = async () => {
    await fetchRooms();
    setShowFilters(false);
  };

  const resetFilters = async () => {
    setFilters({
      search: '',
      status: 'all',
      terminal_id: '',
      block_id: '',
      floor_id: '',
      room_type: '',
      room_status: '',
      min_capacity: '',
      max_capacity: '',
      occupancy_status: '',
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
    setCurrentPage(1);
    await fetchRooms();
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
      floor_id: '',
      room_name: '',
      room_code: '',
      room_type: '',
      max_capacity: 0,
      current_occupancy: 0,
      room_status: 'AVAILABLE',
      description: '',
      is_active: true
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.room_name.trim()) {
      setMessage({ type: 'error', text: 'Room name is required' });
      return;
    }
    
    if (formData.current_occupancy > formData.max_capacity) {
      setMessage({ type: 'error', text: 'Current occupancy cannot exceed maximum capacity' });
      return;
    }
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const payload = {
        terminal_id: formData.terminal_id || null,
        block_id: formData.block_id || null,
        floor_id: formData.floor_id || null,
        room_name: formData.room_name.trim(),
        room_code: formData.room_code || undefined,
        room_type: formData.room_type || null,
        max_capacity: parseInt(formData.max_capacity) || 0,
        current_occupancy: parseInt(formData.current_occupancy) || 0,
        room_status: formData.room_status,
        description: formData.description || null,
        is_active: formData.is_active
      };
      
      if (editingId) {
        await axios.put(`${roomsApi}/${editingId}`, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Room updated successfully' });
      } else {
        await axios.post(roomsApi, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Room created successfully' });
      }
      
      resetForm();
      await fetchRooms();
      await fetchStats();
      await fetchRoomTypes();
      await fetchStatusSummary();
      setActiveTab('list');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save room' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (room) => {
    setEditingId(room.id);
    setFormData({
      terminal_id: room.terminal_id || '',
      block_id: room.block_id || '',
      floor_id: room.floor_id || '',
      room_name: room.room_name,
      room_code: room.room_code || '',
      room_type: room.room_type || '',
      max_capacity: room.max_capacity,
      current_occupancy: room.current_occupancy,
      room_status: room.room_status,
      description: room.description || '',
      is_active: room.is_active
    });
    if (room.terminal_id) {
      fetchBlocksByTerminal(room.terminal_id);
      fetchFloorsByTerminal(room.terminal_id);
    }
    if (room.block_id) {
      fetchFloorsByBlock(room.block_id);
    }
    setActiveTab('form');
  };

  const handleDelete = async (id, name, code) => {
    if (!window.confirm(`Are you sure you want to delete room "${name}" (${code})?`)) return;
    
    try {
      setDeletingId(id);
      await axios.delete(`${roomsApi}/${id}`, getAuthConfig());
      setMessage({ type: 'success', text: 'Room deleted successfully' });
      await fetchRooms();
      await fetchStats();
      await fetchRoomTypes();
      await fetchStatusSummary();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete room' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (room) => {
    try {
      setTogglingId(room.id);
      const action = room.is_active ? 'deactivate' : 'activate';
      await axios.patch(`${roomsApi}/${room.id}/${action}`, {}, getAuthConfig());
      setMessage({ type: 'success', text: `Room ${action}d successfully` });
      await fetchRooms();
      await fetchStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update status' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleUpdateOccupancy = async (e) => {
    e.preventDefault();
    
    if (!occupancyData.occupancy_change && !occupancyData.new_occupancy) {
      setMessage({ type: 'error', text: 'Please provide occupancy change or new occupancy value' });
      return;
    }
    
    try {
      const payload = {};
      if (occupancyData.occupancy_change) {
        payload.occupancy_change = parseInt(occupancyData.occupancy_change);
      }
      if (occupancyData.new_occupancy) {
        payload.new_occupancy = parseInt(occupancyData.new_occupancy);
      }
      
      await axios.patch(`${roomsApi}/${selectedRoom.id}/occupancy`, payload, getAuthConfig());
      setMessage({ type: 'success', text: 'Room occupancy updated successfully' });
      setShowOccupancyModal(false);
      setOccupancyData({ occupancy_change: '', new_occupancy: '' });
      await fetchRooms();
      await fetchStats();
      await fetchStatusSummary();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update occupancy' });
    }
  };

  const getRoomStatusColor = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200';
      case 'OCCUPIED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PARTIALLY_OCCUPIED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MAINTENANCE': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getRoomStatusIcon = (status) => {
    switch(status) {
      case 'AVAILABLE': return <Check className="w-3 h-3" />;
      case 'OCCUPIED': return <UserCheck className="w-3 h-3" />;
      case 'PARTIALLY_OCCUPIED': return <Users className="w-3 h-3" />;
      case 'MAINTENANCE': return <AlertTriangle className="w-3 h-3" />;
      default: return <DoorOpen className="w-3 h-3" />;
    }
  };

  const getOccupancyPercentage = (current, max) => {
    if (max === 0) return 0;
    return (current / max * 100).toFixed(1);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = rooms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(rooms.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] via-[#132D5E] to-[#1A3A6E] p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DoorOpen className="w-5 h-5 text-blue-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                    Facility Management
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-2">Room Management</h1>
                <p className="text-blue-100 max-w-2xl">
                  Manage rooms, occupancy, and space utilization across your facilities
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <DoorOpen className="w-5 h-5 mb-2 text-blue-300" />
                  <div className="text-2xl font-bold">{stats.total_rooms}</div>
                  <div className="text-xs text-blue-200 mt-1">Total Rooms</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Users className="w-5 h-5 mb-2 text-green-300" />
                  <div className="text-2xl font-bold">{stats.total_capacity}</div>
                  <div className="text-xs text-blue-200 mt-1">Total Capacity</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Activity className="w-5 h-5 mb-2 text-yellow-300" />
                  <div className="text-2xl font-bold">{stats.overall_occupancy_rate}%</div>
                  <div className="text-xs text-blue-200 mt-1">Occupancy Rate</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <CheckCircle className="w-5 h-5 mb-2 text-purple-300" />
                  <div className="text-2xl font-bold">{stats.available_rooms}</div>
                  <div className="text-xs text-blue-200 mt-1">Available</div>
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
              Room Directory
              {rooms.length > 0 && activeTab !== 'list' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {rooms.length}
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
              {editingId ? 'Edit Room' : 'Add Room'}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'analytics' 
                  ? 'bg-[#0B1D3A] text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
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

        {/* Occupancy Modal */}
        {showOccupancyModal && selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Update Room Occupancy</h3>
                <button onClick={() => setShowOccupancyModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">{selectedRoom.room_name}</p>
                <p className="text-xs text-gray-500">{selectedRoom.room_code}</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Current: <strong>{selectedRoom.current_occupancy}</strong> / {selectedRoom.max_capacity}</span>
                  <span>Available: <strong>{selectedRoom.max_capacity - selectedRoom.current_occupancy}</strong></span>
                </div>
              </div>
              <form onSubmit={handleUpdateOccupancy}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Change Occupancy By</label>
                    <input
                      type="number"
                      value={occupancyData.occupancy_change}
                      onChange={(e) => setOccupancyData(prev => ({ ...prev, occupancy_change: e.target.value, new_occupancy: '' }))}
                      placeholder="e.g., 5 or -3"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Positive to add, negative to remove</p>
                  </div>
                  <div className="text-center text-gray-500 text-sm">OR</div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Set New Occupancy</label>
                    <input
                      type="number"
                      value={occupancyData.new_occupancy}
                      onChange={(e) => setOccupancyData(prev => ({ ...prev, new_occupancy: e.target.value, occupancy_change: '' }))}
                      placeholder={`0 - ${selectedRoom.max_capacity}`}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="submit" className="flex-1 bg-[#0B1D3A] text-white rounded-lg py-2">
                    Update Occupancy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOccupancyModal(false)}
                    className="flex-1 border border-gray-300 rounded-lg py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <DoorOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.total_rooms}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Total Rooms</h3>
                <p className="text-xs text-gray-500 mt-1">{stats.active_rooms} active, {stats.inactive_rooms} inactive</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.total_occupancy}/{stats.total_capacity}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Occupancy</h3>
                <p className="text-xs text-gray-500 mt-1">{stats.overall_occupancy_rate}% utilization rate</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Tag className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.unique_room_types}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Room Types</h3>
                <p className="text-xs text-gray-500 mt-1">Different room categories</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Building2 className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.terminals_with_rooms}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Active Terminals</h3>
                <p className="text-xs text-gray-500 mt-1">With rooms configured</p>
              </div>
            </div>

            {/* Status Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Room Status Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statusSummary.map((status) => (
                  <div key={status.room_status} className={`p-4 rounded-xl border ${getRoomStatusColor(status.room_status)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getRoomStatusIcon(status.room_status)}
                        <span className="font-semibold">{status.room_status.replace('_', ' ')}</span>
                      </div>
                      <span className="text-2xl font-bold">{status.count}</span>
                    </div>
                    <div className="text-sm">
                      <div>Capacity: {status.total_capacity || 0}</div>
                      <div>Occupied: {status.current_occupancy || 0}</div>
                      <div>Avg Capacity: {status.avg_capacity || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Types Distribution */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Room Types Distribution
              </h3>
              <div className="space-y-4">
                {roomTypes.map((type) => (
                  <div key={type.room_type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{type.room_type}</span>
                      <span className="text-gray-600">{type.count} rooms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#0B1D3A] to-[#1A3A6E] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(type.count / stats.total_rooms) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {roomTypes.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No room types defined yet</p>
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
                {editingId ? 'Edit Room' : 'Add New Room'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingId ? 'Update room information' : 'Create a new room within a floor'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Room Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="room_name"
                      value={formData.room_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Conference Room A, Office 101"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Room Code
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="room_code"
                        value={formData.room_code}
                        onChange={handleInputChange}
                        placeholder="e.g., CONF-A-101, OFF-101"
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Unique room identifier (auto-generated if empty)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Room Type
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="room_type"
                        value={formData.room_type}
                        onChange={handleInputChange}
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">Select Type</option>
                        <option value="Conference">Conference Room</option>
                        <option value="Meeting">Meeting Room</option>
                        <option value="Office">Office</option>
                        <option value="Training">Training Room</option>
                        <option value="Lounge">Lounge</option>
                        <option value="Storage">Storage</option>
                        <option value="Utility">Utility Room</option>
                        <option value="Restroom">Restroom</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Max Capacity
                      </label>
                      <input
                        type="number"
                        name="max_capacity"
                        value={formData.max_capacity}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Occupancy
                      </label>
                      <input
                        type="number"
                        name="current_occupancy"
                        value={formData.current_occupancy}
                        onChange={handleInputChange}
                        min="0"
                        max={formData.max_capacity}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Room Status
                    </label>
                    <select
                      name="room_status"
                      value={formData.room_status}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="PARTIALLY_OCCUPIED">Partially Occupied</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-5">
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
                        <option value="">Select Terminal</option>
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
                      Block
                    </label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="block_id"
                        value={formData.block_id}
                        onChange={handleInputChange}
                        disabled={!formData.terminal_id}
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100"
                      >
                        <option value="">Select Block</option>
                        {filteredBlocks.map(block => (
                          <option key={block.id} value={block.id}>
                            {block.block_name} {block.block_code && `(${block.block_code})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Floor
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="floor_id"
                        value={formData.floor_id}
                        onChange={handleInputChange}
                        disabled={!formData.terminal_id}
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100"
                      >
                        <option value="">Select Floor</option>
                        {filteredFloors.map(floor => (
                          <option key={floor.id} value={floor.id}>
                            {floor.floor_name} (Level {floor.floor_number})
                          </option>
                        ))}
                      </select>
                    </div>
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
                      placeholder="Describe the room, amenities, features..."
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100 resize-none"
                    />
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
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
                        <strong>Note:</strong> Room status automatically updates based on occupancy levels.
                      </p>
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
                      {editingId ? 'Update Room' : 'Create Room'}
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
                  <h2 className="text-xl font-bold text-gray-900">Room Directory</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage all rooms and monitor occupancy across your facilities
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search rooms..."
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
                    value={filters.room_type}
                    onChange={(e) => handleFilterChange('room_type', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Room Types</option>
                    {roomTypes.map(type => (
                      <option key={type.room_type} value={type.room_type}>
                        {type.room_type} ({type.count})
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.room_status}
                    onChange={(e) => handleFilterChange('room_status', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Room Status</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="PARTIALLY_OCCUPIED">Partially Occupied</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                  
                  <select
                    value={filters.occupancy_status}
                    onChange={(e) => handleFilterChange('occupancy_status', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Occupancy</option>
                    <option value="EMPTY">Empty</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="FULL">Full</option>
                  </select>
                  
                  <input
                    type="number"
                    value={filters.min_capacity}
                    onChange={(e) => handleFilterChange('min_capacity', e.target.value)}
                    placeholder="Min Capacity"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  
                  <input
                    type="number"
                    value={filters.max_capacity}
                    onChange={(e) => handleFilterChange('max_capacity', e.target.value)}
                    placeholder="Max Capacity"
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

            {/* Rooms Table View */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader className="w-8 h-8 animate-spin text-[#0B1D3A]" />
                <p className="mt-3 text-gray-500">Loading rooms...</p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-gray-50 rounded-full p-4 mb-4">
                  <DoorOpen className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No rooms found</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {filters.search || filters.status !== 'all' || filters.terminal_id || filters.room_type
                    ? 'Try adjusting your filters' 
                    : 'Add your first room to get started'}
                </p>
                {(filters.search || filters.status !== 'all' || filters.terminal_id || filters.room_type) && (
                  <button onClick={resetFilters} className="text-[#0B1D3A] text-sm font-semibold">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Room</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Occupancy</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {currentItems.map((room) => (
                      <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1D3A] text-white">
                              <DoorOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">{room.room_name}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${room.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                  {room.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-mono text-gray-500">{room.room_code}</p>
                              {room.description && (
                                <p className="mt-2 max-w-md text-xs text-gray-500 line-clamp-2">{room.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-gray-600">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-medium text-gray-800">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span>{room.terminal_name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 pl-6 text-xs text-gray-500">
                              <Layers className="w-3.5 h-3.5 text-gray-400" />
                              <span>{room.block_name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 pl-12 text-xs text-gray-500">
                              <Home className="w-3.5 h-3.5 text-gray-400" />
                              <span>{room.floor_name ? `${room.floor_name} (Level ${room.floor_number})` : '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top min-w-[180px]">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">{room.current_occupancy} / {room.max_capacity}</span>
                            <span className="font-semibold text-gray-900">{room.occupancy_percentage}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                room.occupancy_percentage >= 90 ? 'bg-red-500' :
                                room.occupancy_percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${room.occupancy_percentage}%` }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>Available: {room.available_capacity}</span>
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${getRoomStatusColor(room.room_status)}">
                              {getRoomStatusIcon(room.room_status)}
                              {room.room_status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${getRoomStatusColor(room.room_status)}`}>
                            {getRoomStatusIcon(room.room_status)}
                            {room.room_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{room.created_at?.split(' ')[0] || '-'}</span>
                          </div>
                          <p className="mt-2 text-xs font-mono text-gray-500">ID: {room.id}</p>
                        </td>
                        <td className="px-4 py-4 align-top text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedRoom(room);
                                setShowOccupancyModal(true);
                              }}
                              className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                            >
                              <Users className="w-3 h-3" />
                              Update Occupancy
                            </button>
                            <button
                              onClick={() => handleEdit(room)}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(room)}
                              disabled={togglingId === room.id}
                              className={`px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${room.is_active ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-green-700 bg-green-50 hover:bg-green-100'}`}
                            >
                              {togglingId === room.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <Power className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(room.id, room.room_name, room.room_code)}
                              disabled={deletingId === room.id}
                              className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {deletingId === room.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
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
            {!loading && rooms.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, rooms.length)} of {rooms.length} rooms
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

export default Rooms;