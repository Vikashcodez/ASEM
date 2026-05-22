import React, { useEffect, useState, useCallback } from 'react';
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
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader,
  Settings,
  Users,
  Calendar,
  Activity
} from 'lucide-react';

const rolesApi = `${import.meta.env.VITE_API_URL}/roles`;

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
  });

  useEffect(() => {
    fetchRoles();
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

  const fetchRoles = async (params = {}) => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const response = await axios.get(rolesApi, {
        params,
        ...getAuthConfig(),
      });
      setRoles(response.data.data || []);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to fetch roles' 
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const params = {};

    if (search.trim()) {
      params.search = search.trim();
    }

    if (statusFilter !== 'all') {
      params.is_active = statusFilter === 'active';
    }

    await fetchRoles(params);
  };

  const handleReset = async () => {
    setSearch('');
    setStatusFilter('all');
    setShowFilters(false);
    await fetchRoles();
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      is_active: true,
    });
    setEditingRoleId(null);
    setSelectedRole(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Role name is required' });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const payload = {
        name: formData.name.trim(),
        is_active: formData.is_active,
      };

      if (editingRoleId) {
        await axios.put(`${rolesApi}/${editingRoleId}`, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Role updated successfully' });
      } else {
        await axios.post(rolesApi, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Role created successfully' });
      }

      resetForm();
      await fetchRoles({
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter !== 'all' ? { is_active: statusFilter === 'active' } : {}),
      });
      setActiveTab('list');
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to save role' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRoleId(role.id);
    setFormData({
      name: role.name || '',
      is_active: Boolean(role.is_active),
    });
    setSelectedRole(role);
    setActiveTab('form');
    setMessage({ type: '', text: '' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete the role "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      setMessage({ type: '', text: '' });
      await axios.delete(`${rolesApi}/${id}`, getAuthConfig());
      setMessage({ type: 'success', text: 'Role deleted successfully' });
      await fetchRoles({
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter !== 'all' ? { is_active: statusFilter === 'active' } : {}),
      });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to delete role' 
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (role) => {
    try {
      setTogglingId(role.id);
      setMessage({ type: '', text: '' });
      const action = role.is_active ? 'deactivate' : 'activate';
      await axios.patch(`${rolesApi}/${role.id}/${action}`, {}, getAuthConfig());
      setMessage({ 
        type: 'success', 
        text: `Role ${role.is_active ? 'deactivated' : 'activated'} successfully` 
      });
      await fetchRoles({
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter !== 'all' ? { is_active: statusFilter === 'active' } : {}),
      });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update role status' 
      });
    } finally {
      setTogglingId(null);
    }
  };

  const roleCount = roles.length;
  const activeCount = roles.filter((role) => role.is_active).length;
  const inactiveCount = roleCount - activeCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] via-[#132D5E] to-[#1A3A6E] p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-blue-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                    System Configuration
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-2">Role Management</h1>
                <p className="text-blue-100 max-w-2xl">
                  Create, edit, activate, deactivate, and remove roles with complete CRUD operations
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Users className="w-5 h-5 mb-2 text-blue-200" />
                  <div className="text-2xl font-bold">{roleCount}</div>
                  <div className="text-xs text-blue-200 mt-1">Total Roles</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <CheckCircle className="w-5 h-5 mb-2 text-green-300" />
                  <div className="text-2xl font-bold">{activeCount}</div>
                  <div className="text-xs text-blue-200 mt-1">Active</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <EyeOff className="w-5 h-5 mb-2 text-gray-300" />
                  <div className="text-2xl font-bold">{inactiveCount}</div>
                  <div className="text-xs text-blue-200 mt-1">Inactive</div>
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
              <Users className="w-4 h-4" />
              Role Directory
              {roleCount > 0 && activeTab !== 'list' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {roleCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                resetForm();
                setActiveTab('form');
                setMessage({ type: '', text: '' });
              }}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'form' 
                  ? 'bg-[#0B1D3A] text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              {editingRoleId ? 'Edit Role' : 'Create New Role'}
            </button>
          </div>
        </div>

        {/* Message Alerts */}
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
            <button onClick={() => setMessage({ type: '', text: '' })} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Section */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRoleId ? 'Edit Role' : 'Create New Role'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingRoleId 
                  ? 'Update role details and permissions' 
                  : 'Add a new role to the system'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Administrator, Manager, Viewer"
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unique role name, 3-50 characters recommended
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Active Status</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Inactive roles cannot be assigned to users
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B1D3A]"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#0B1D3A] text-white rounded-xl text-sm font-semibold hover:bg-[#132D5E] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingRoleId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingRoleId ? 'Update Role' : 'Create Role'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      if (!editingRoleId) {
                        setActiveTab('list');
                      }
                    }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
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
                  <h2 className="text-xl font-bold text-gray-900">Role Directory</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage and monitor all roles in the system
                  </p>
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>

              <form onSubmit={handleSearch} className={`mt-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by role name..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100 bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                  
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0B1D3A] text-white rounded-xl text-sm font-semibold hover:bg-[#132D5E] transition-all flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Apply Filters
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader className="w-8 h-8 animate-spin text-[#0B1D3A]" />
                  <p className="mt-3 text-gray-500">Loading roles...</p>
                </div>
              ) : roles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="bg-gray-50 rounded-full p-4 mb-4">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No roles found</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {search || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Create your first role to get started'}
                  </p>
                  {(search || statusFilter !== 'all') && (
                    <button
                      onClick={handleReset}
                      className="text-[#0B1D3A] text-sm font-semibold hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Role Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Last Updated
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                          #{role.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${role.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="text-sm font-semibold text-gray-900">
                              {role.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            role.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {role.is_active ? (
                              <>
                                <Activity className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {role.created_at || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {role.updated_at || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(role)}
                              className="p-2 text-gray-600 hover:text-[#0B1D3A] hover:bg-gray-100 rounded-lg transition-all"
                              title="Edit role"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(role)}
                              disabled={togglingId === role.id}
                              className={`p-2 rounded-lg transition-all ${
                                role.is_active 
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' 
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              } disabled:opacity-50`}
                              title={role.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {togglingId === role.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(role.id, role.name)}
                              disabled={deletingId === role.id}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title="Delete role"
                            >
                              {deletingId === role.id ? (
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
              )}
            </div>

            {/* Footer Stats */}
            {!loading && roles.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{roles.length}</span> roles
                  </p>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-600">{activeCount} Active</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-gray-600">{inactiveCount} Inactive</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Roles;