import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
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
  Activity,
  Calendar,
  Hash,
  FileText,
  ChevronLeft,
  ChevronRight,
  Tag,
  Link as LinkIcon,
  TrendingUp,
  PieChart,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Check,
  Clock,
  BarChart3,
  MapPin,
  Phone,
  AlertOctagon,
  Flame,
  Ambulance,
  Shield,
  Wrench,
  Eye
} from 'lucide-react';

const incidentsApi = `${import.meta.env.VITE_API_URL}/incidents`;
const employeesApi = `${import.meta.env.VITE_API_URL}/employees`;

function Incidents() {
  // State Management
  const [incidents, setIncidents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    incident_status: '',
    severity_level: '',
    incident_type: '',
    room_id: '',
    reported_by: '',
    from_date: '',
    to_date: '',
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
    incident_type: '',
    incident_title: '',
    location_details: '',
    description: '',
    severity_level: 'MEDIUM',
    incident_status: 'OPEN',
    reported_by: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    total_incidents: 0,
    open_incidents: 0,
    in_progress_incidents: 0,
    resolved_incidents: 0,
    closed_incidents: 0,
    low_severity: 0,
    medium_severity: 0,
    high_severity: 0,
    critical_severity: 0,
    total_people_affected: 0,
    avg_resolution_hours: 0
  });

  // Incident Types Summary
  const [incidentTypes, setIncidentTypes] = useState([]);
  
  // Status Summary
  const [statusSummary, setStatusSummary] = useState([]);

  useEffect(() => {
    fetchIncidents();
    fetchEmployees();
    fetchStats();
    fetchIncidentTypes();
    fetchStatusSummary();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchIncidents();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [filters.search, filters.incident_status, filters.severity_level, filters.incident_type, filters.room_id, currentPage]);

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
      const response = await axios.get(`${incidentsApi}/statistics`, getAuthConfig());
      setStats(response.data.data.overview);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchIncidentTypes = async () => {
    try {
      const response = await axios.get(`${incidentsApi}/types/summary`, getAuthConfig());
      setIncidentTypes(response.data.data || []);
    } catch (err) {
      console.error('Error fetching incident types:', err);
    }
  };

  const fetchStatusSummary = async () => {
    try {
      const response = await axios.get(`${incidentsApi}/status/summary`, getAuthConfig());
      setStatusSummary(response.data.data || []);
    } catch (err) {
      console.error('Error fetching status summary:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(employeesApi, getAuthConfig());
      setEmployees(response.data.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await axios.get(incidentsApi, { params, ...getAuthConfig() });
      setIncidents(response.data.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to fetch incidents' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const applyFilters = async () => {
    setCurrentPage(1);
    await fetchIncidents();
    setShowFilters(false);
  };

  const resetFilters = async () => {
    setFilters({
      search: '',
      incident_status: '',
      severity_level: '',
      incident_type: '',
      room_id: '',
      reported_by: '',
      from_date: '',
      to_date: '',
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
    setCurrentPage(1);
    await fetchIncidents();
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
      incident_type: '',
      incident_title: '',
      location_details: '',
      description: '',
      severity_level: 'MEDIUM',
      incident_status: 'OPEN',
      reported_by: ''
    });
    setEditingId(null);
  };

  const { user } = useAuth();

  // ref for title input so we can focus without scrolling
  const titleRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'form') {
      // focus the title input but prevent automatic scrolling
      try {
        requestAnimationFrame(() => {
          titleRef.current?.focus?.({ preventScroll: true });
        });
      } catch (e) {
        // older browsers may not support preventScroll option
        requestAnimationFrame(() => {
          titleRef.current?.focus?.();
        });
      }
    }
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.incident_type) {
      setMessage({ type: 'error', text: 'Incident type is required' });
      return;
    }
    
    if (!formData.incident_title) {
      setMessage({ type: 'error', text: 'Incident title is required' });
      return;
    }
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const payload = {
        incident_type: formData.incident_type,
        incident_title: formData.incident_title.trim(),
        location_details: formData.location_details || null,
        description: formData.description || null,
        severity_level: formData.severity_level,
        incident_status: formData.incident_status,
        // reported_by taken from authenticated user
        reported_by: user?.id ? Number(user.id) : null
      };
      
      if (editingId) {
        await axios.put(`${incidentsApi}/${editingId}`, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Incident updated successfully' });
      } else {
        await axios.post(incidentsApi, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Incident reported successfully' });
      }
      
      resetForm();
      await fetchIncidents();
      await fetchStats();
      await fetchIncidentTypes();
      await fetchStatusSummary();
      setActiveTab('list');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save incident' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (incident) => {
    setEditingId(incident.id);
    setFormData({
      incident_type: incident.incident_type,
      incident_title: incident.incident_title,
      location_details: incident.location_details || '',
      description: incident.description || '',
      severity_level: incident.severity_level,
      incident_status: incident.incident_status,
      reported_by: incident.reported_by || ''
    });
    setActiveTab('form');
  };

  const handleDelete = async (id, title, code) => {
    if (!window.confirm(`Are you sure you want to delete incident "${title}" (${code})?`)) return;
    
    try {
      setDeletingId(id);
      await axios.delete(`${incidentsApi}/${id}`, getAuthConfig());
      setMessage({ type: 'success', text: 'Incident deleted successfully' });
      await fetchIncidents();
      await fetchStats();
      await fetchIncidentTypes();
      await fetchStatusSummary();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete incident' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleReleaseIncident = async (id) => {
    if (!window.confirm('Are you sure you want to release this incident?')) return;

    try {
      setTogglingId(id);
      await axios.put(
        `${incidentsApi}/${id}/release`,
        {
          release_notes: 'Incident released from incident management',
          closed_by: user?.id ? Number(user.id) : null
        },
        getAuthConfig()
      );
      setMessage({ type: 'success', text: 'Incident released successfully' });
      await fetchIncidents();
      await fetchStats();
      await fetchStatusSummary();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to release incident' });
    } finally {
      setTogglingId(null);
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'LOW': return <CheckCircle className="w-3 h-3" />;
      case 'MEDIUM': return <AlertCircle className="w-3 h-3" />;
      case 'HIGH': return <AlertTriangle className="w-3 h-3" />;
      case 'CRITICAL': return <AlertOctagon className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return 'bg-red-100 text-red-800 border-red-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RESOLVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CLOSED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'OPEN': return <AlertCircle className="w-3 h-3" />;
      case 'IN_PROGRESS': return <Clock className="w-3 h-3" />;
      case 'RESOLVED': return <CheckCircle className="w-3 h-3" />;
      case 'CLOSED': return <Check className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getIncidentTypeIcon = (type) => {
    const icons = {
      'FIRE': <Flame className="w-4 h-4" />,
      'MEDICAL': <Ambulance className="w-4 h-4" />,
      'SECURITY': <Shield className="w-4 h-4" />,
      'MAINTENANCE': <Wrench className="w-4 h-4" />,
      'SAFETY': <AlertTriangle className="w-4 h-4" />,
      'OTHER': <AlertCircle className="w-4 h-4" />
    };
    return icons[type] || <AlertCircle className="w-4 h-4" />;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = incidents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(incidents.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] via-[#132D5E] to-[#1A3A6E] p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    Safety & Security
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-2">Incident Management</h1>
                <p className="text-red-100 max-w-2xl">
                  Track, manage, and resolve facility incidents with real-time monitoring
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <AlertTriangle className="w-5 h-5 mb-2 text-red-300" />
                  <div className="text-2xl font-bold">{stats.total_incidents}</div>
                  <div className="text-xs text-white/80 mt-1">Total Incidents</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Clock className="w-5 h-5 mb-2 text-yellow-300" />
                  <div className="text-2xl font-bold">{stats.open_incidents}</div>
                  <div className="text-xs text-white/80 mt-1">Open Cases</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Users className="w-5 h-5 mb-2 text-blue-300" />
                  <div className="text-2xl font-bold">{stats.total_people_affected}</div>
                  <div className="text-xs text-white/80 mt-1">People Allocated</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <CheckCircle className="w-5 h-5 mb-2 text-green-300" />
                  <div className="text-2xl font-bold">{stats.resolved_incidents}</div>
                  <div className="text-xs text-white/80 mt-1">Resolved</div>
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
              Incidents List
              {incidents.length > 0 && activeTab !== 'list' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {incidents.length}
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
              {editingId ? 'Edit Incident' : 'Report Incident'}
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

        {/* Analytics Section */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.total_incidents}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Total Incidents</h3>
                <p className="text-xs text-gray-500 mt-1">All reported incidents</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.open_incidents + stats.in_progress_incidents}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Active Cases</h3>
                <p className="text-xs text-gray-500 mt-1">Open + In Progress</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.total_people_affected}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">People Allocated</h3>
                <p className="text-xs text-gray-500 mt-1">Total impacted individuals</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{Math.round(stats.avg_resolution_hours || 0)}h</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Avg Resolution Time</h3>
                <p className="text-xs text-gray-500 mt-1">Average hours to resolve</p>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Severity Distribution
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Critical</span>
                    <span className="text-gray-600">{stats.critical_severity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#0B1D3A] to-[#1A3A6E] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.critical_severity / stats.total_incidents) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">High</span>
                    <span className="text-gray-600">{stats.high_severity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.high_severity / stats.total_incidents) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Medium</span>
                    <span className="text-gray-600">{stats.medium_severity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.medium_severity / stats.total_incidents) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Low</span>
                    <span className="text-gray-600">{stats.low_severity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.low_severity / stats.total_incidents) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Incident Types Distribution */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Incident Types Distribution
              </h3>
              <div className="space-y-4">
                {incidentTypes.map((type) => (
                  <div key={type.incident_type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 flex items-center gap-2">
                        {getIncidentTypeIcon(type.incident_type)}
                        {type.incident_type}
                      </span>
                      <span className="text-gray-600">{type.count} incidents</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-600 to-red-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(type.count / stats.total_incidents) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {incidentTypes.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No incident data available</p>
                )}
              </div>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusSummary.map((status) => (
                <div key={status.incident_status} className={`p-4 rounded-xl border ${getStatusColor(status.incident_status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.incident_status)}
                      <span className="font-semibold">{status.incident_status.replace('_', ' ')}</span>
                    </div>
                    <span className="text-2xl font-bold">{status.count}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {status.total_people_affected > 0 && <div>Affected: {status.total_people_affected}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Section */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Incident' : 'Report New Incident'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingId ? 'Update incident details' : 'Document a new facility incident'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Incident Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="incident_type"
                        value={formData.incident_type}
                        onChange={handleInputChange}
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      >
                        <option value="">Select Type</option>
                        <option value="FIRE">🔥 Fire</option>
                        <option value="MEDICAL">🚑 Medical Emergency</option>
                        <option value="SECURITY">👮 Security Incident</option>
                        <option value="MAINTENANCE">🔧 Maintenance Issue</option>
                        <option value="SAFETY">⚠️ Safety Hazard</option>
                        <option value="OTHER">📋 Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Incident Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="incident_title"
                      value={formData.incident_title}
                      onChange={handleInputChange}
                      placeholder="e.g., Fire alarm triggered, Medical emergency"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      ref={titleRef}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location Details
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="location_details"
                        value={formData.location_details}
                        onChange={handleInputChange}
                        placeholder="Specific area, room corner, floor section..."
                        className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Severity Level
                    </label>
                    <select
                      name="severity_level"
                      value={formData.severity_level}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Status
                    </label>
                    <select
                      name="incident_status"
                      value={formData.incident_status}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    >
                      <option value="OPEN">Open - Initial Report</option>
                      <option value="IN_PROGRESS">In Progress - Being Addressed</option>
                      <option value="RESOLVED">Resolved - Action Taken</option>
                      <option value="CLOSED">Closed - Case Closed</option>
                    </select>
                  </div>
                  
                  {/* Reported By is set from authenticated user; field removed from UI */}
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="6"
                      placeholder="Detailed description of the incident, actions taken, witness statements..."
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 resize-none"
                    />
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
                      {editingId ? <RefreshCw className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {editingId ? 'Update Incident' : 'Report Incident'}
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
                  <h2 className="text-xl font-bold text-gray-900">Incidents Directory</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Track and manage all reported incidents across your facilities
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
                      placeholder="Search incidents..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  
                  <select
                    value={filters.incident_status}
                    onChange={(e) => handleFilterChange('incident_status', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  
                  <select
                    value={filters.severity_level}
                    onChange={(e) => handleFilterChange('severity_level', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Severity</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  
                  <select
                    value={filters.incident_type}
                    onChange={(e) => handleFilterChange('incident_type', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="FIRE">Fire</option>
                    <option value="MEDICAL">Medical</option>
                    <option value="SECURITY">Security</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="SAFETY">Safety</option>
                    <option value="OTHER">Other</option>
                  </select>
                  
                  <input
                    type="date"
                    value={filters.from_date}
                    onChange={(e) => handleFilterChange('from_date', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="From Date"
                  />
                  
                  <input
                    type="date"
                    value={filters.to_date}
                    onChange={(e) => handleFilterChange('to_date', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="To Date"
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

            {/* Incidents Table View */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader className="w-8 h-8 animate-spin text-red-600" />
                <p className="mt-3 text-gray-500">Loading incidents...</p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-gray-50 rounded-full p-4 mb-4">
                  <AlertTriangle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No incidents found</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {filters.search || filters.incident_status || filters.severity_level || filters.incident_type
                    ? 'Try adjusting your filters' 
                    : 'Report your first incident to get started'}
                </p>
                {(filters.search || filters.incident_status || filters.severity_level || filters.incident_type) && (
                  <button onClick={resetFilters} className="text-red-600 text-sm font-semibold">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Incident</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reported</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {currentItems.map((incident) => (
                      <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
                              {getIncidentTypeIcon(incident.incident_type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">{incident.incident_title}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${incident.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                  {incident.is_active ? 'Active' : 'Archived'}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-mono text-gray-500">{incident.incident_code}</p>
                              {incident.description && (
                                <p className="mt-2 max-w-md text-xs text-gray-500 line-clamp-2">{incident.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${getSeverityColor(incident.severity_level)}`}>
                            {getSeverityIcon(incident.severity_level)}
                            {incident.severity_level}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${getStatusColor(incident.incident_status)}`}>
                            {getStatusIcon(incident.incident_status)}
                            {incident.incident_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{incident.created_at?.split(' ')[0] || '-'}</span>
                          </div>
                          {incident.reported_by_details && (
                            <p className="mt-1 text-xs text-gray-500">
                              By: {incident.reported_by_details.employee_name}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedIncident(incident);
                                setShowDetailsModal(true);
                              }}
                              className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            <button
                              onClick={() => handleReleaseIncident(incident.id)}
                              disabled={togglingId === incident.id || incident.incident_status === 'CLOSED'}
                              className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              {togglingId === incident.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(incident)}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(incident.id, incident.incident_title, incident.incident_code)}
                              disabled={deletingId === incident.id}
                              className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {deletingId === incident.id ? (
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
            {!loading && incidents.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, incidents.length)} of {incidents.length} incidents
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

      {/* Incident Details Modal */}
      {showDetailsModal && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  {getIncidentTypeIcon(selectedIncident.incident_type)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedIncident.incident_title}</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedIncident.incident_code}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Incident Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium flex items-center gap-1">
                          {getIncidentTypeIcon(selectedIncident.incident_type)}
                          {selectedIncident.incident_type}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Severity:</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${getSeverityColor(selectedIncident.severity_level)}`}>
                          {getSeverityIcon(selectedIncident.severity_level)}
                          {selectedIncident.severity_level}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(selectedIncident.incident_status)}`}>
                          {getStatusIcon(selectedIncident.incident_status)}
                          {selectedIncident.incident_status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location Information
                    </h3>
                    <div className="space-y-2">
                      {selectedIncident.location_details && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Specific Location:</span>
                          <span className="font-medium text-right">{selectedIncident.location_details}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Report Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Reported By:</span>
                        <span className="font-medium">{selectedIncident.reported_by_details?.employee_name || 'System'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Reported At:</span>
                        <span className="font-medium">{new Date(selectedIncident.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Updated:</span>
                        <span className="font-medium">{new Date(selectedIncident.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedIncident.description || 'No description provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Incidents;