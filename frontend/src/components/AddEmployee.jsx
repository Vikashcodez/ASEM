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
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader,
  Users,
  Calendar,
  Activity,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  UserPlus,
  Download,
  Upload,
  Key,
  Lock,
  Shield,
  Briefcase,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const employeesApi = `${import.meta.env.VITE_API_URL}/employees`;
const rolesApi = `${import.meta.env.VITE_API_URL}/roles`;

function Employees() {
  // State Management
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: ''
  });
  
  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    role_id: '',
    from_date: '',
    to_date: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // UI States
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form Data
  const [formData, setFormData] = useState({
    role_id: '',
    first_name: '',
    last_name: '',
    contact_number: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: ''
    },
    join_date: '',
    is_active: true
  });

  // Statistics
  const [stats, setStats] = useState({
    total_employees: 0,
    active_employees: 0,
    inactive_employees: 0,
    roles_occupied: 0,
    joined_this_month: 0
  });

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/stats/employees`, getAuthConfig());
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(rolesApi, getAuthConfig());
      setRoles(response.data.data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.search) params.search = filters.search;
      if (filters.status !== 'all') params.is_active = filters.status === 'active';
      if (filters.role_id) params.role_id = filters.role_id;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      
      const response = await axios.get(employeesApi, { params, ...getAuthConfig() });
      setEmployees(response.data.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to fetch employees' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const applyFilters = async () => {
    await fetchEmployees();
    setShowFilters(false);
  };

  const resetFilters = async () => {
    setFilters({
      search: '',
      status: 'all',
      role_id: '',
      from_date: '',
      to_date: ''
    });
    setCurrentPage(1);
    await fetchEmployees();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      role_id: '',
      first_name: '',
      last_name: '',
      contact_number: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip_code: '',
        country: ''
      },
      join_date: '',
      is_active: true
    });
    setEditingId(null);
    setSelectedEmployee(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      setMessage({ type: 'error', text: 'First name, last name, and email are required' });
      return;
    }
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const payload = {
        role_id: formData.role_id || null,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        contact_number: formData.contact_number || null,
        email: formData.email.trim(),
        address: formData.address,
        join_date: formData.join_date || null,
        is_active: formData.is_active
      };
      
      if (editingId) {
        await axios.put(`${employeesApi}/${editingId}`, payload, getAuthConfig());
        setMessage({ type: 'success', text: 'Employee updated successfully' });
      } else {
        const response = await axios.post(`${employeesApi}/register`, payload, getAuthConfig());
        setMessage({ 
          type: 'success', 
          text: response.data.message || 'Employee registered successfully' 
        });
      }
      
      resetForm();
      await fetchEmployees();
      await fetchStats();
      setActiveTab('list');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save employee' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setFormData({
      role_id: employee.role_id || '',
      first_name: employee.first_name,
      last_name: employee.last_name,
      contact_number: employee.contact_number || '',
      email: employee.email,
      address: employee.address || {
        street: '', city: '', state: '', zip_code: '', country: ''
      },
      join_date: employee.join_date?.split('T')[0] || '',
      is_active: employee.is_active
    });
    setSelectedEmployee(employee);
    setActiveTab('form');
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete employee "${name}"?`)) return;
    
    try {
      setDeletingId(id);
      await axios.delete(`${employeesApi}/${id}`, getAuthConfig());
      setMessage({ type: 'success', text: 'Employee deleted successfully' });
      await fetchEmployees();
      await fetchStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete employee' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      setTogglingId(employee.id);
      const action = employee.is_active ? 'deactivate' : 'activate';
      await axios.patch(`${employeesApi}/${employee.id}/${action}`, {}, getAuthConfig());
      setMessage({ type: 'success', text: `Employee ${action}d successfully` });
      await fetchEmployees();
      await fetchStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update status' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleResetPassword = async (id, name) => {
    if (!window.confirm(`Reset password for "${name}" to default "welcome"?`)) return;
    
    try {
      setResettingId(id);
      const response = await axios.post(`${employeesApi}/${id}/reset-password`, {}, getAuthConfig());
      setMessage({ type: 'success', text: response.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reset password' });
    } finally {
      setResettingId(null);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordData.current_password || !passwordData.new_password) {
      setMessage({ type: 'error', text: 'Both passwords are required' });
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    
    try {
      await axios.post(
        `${employeesApi}/${passwordAction.id}/change-password`,
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        },
        getAuthConfig()
      );
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', new_password: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = employees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(employees.length / itemsPerPage);

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'No Role';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] via-[#132D5E] to-[#1A3A6E] p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                    Human Resources
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-2">Employee Management</h1>
                <p className="text-blue-100 max-w-2xl">
                  Manage employee records, roles, and account settings
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold">{stats.total_employees}</div>
                  <div className="text-xs text-blue-200 mt-1">Total</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <UserCheck className="w-5 h-5 mb-2 text-green-300" />
                  <div className="text-2xl font-bold">{stats.active_employees}</div>
                  <div className="text-xs text-blue-200 mt-1">Active</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <UserX className="w-5 h-5 mb-2 text-gray-300" />
                  <div className="text-2xl font-bold">{stats.inactive_employees}</div>
                  <div className="text-xs text-blue-200 mt-1">Inactive</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Briefcase className="w-5 h-5 mb-2 text-yellow-300" />
                  <div className="text-2xl font-bold">{stats.roles_occupied}</div>
                  <div className="text-xs text-blue-200 mt-1">Roles</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <CalendarIcon className="w-5 h-5 mb-2 text-purple-300" />
                  <div className="text-2xl font-bold">{stats.joined_this_month}</div>
                  <div className="text-xs text-blue-200 mt-1">New (Month)</div>
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
              Employee Directory
              {employees.length > 0 && activeTab !== 'list' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {employees.length}
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
              <UserPlus className="w-4 h-4" />
              {editingId ? 'Edit Employee' : 'Add Employee'}
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

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="submit" className="flex-1 bg-[#0B1D3A] text-white rounded-lg py-2">
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 border border-gray-300 rounded-lg py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Form Section */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingId ? 'Update employee information' : 'Register a new employee with default password "welcome"'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0B1D3A] focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0B1D3A] focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0B1D3A] focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleInputChange}
                        className="w-full pl-10 rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0B1D3A] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role_id"
                      value={formData.role_id}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0B1D3A] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Join Date
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        name="join_date"
                        value={formData.join_date}
                        onChange={handleInputChange}
                        className="w-full pl-10 rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0B1D3A] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Address Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0B1D3A] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        name="address.zip_code"
                        value={formData.address.zip_code}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-[#0B1D3A] focus:ring-[#0B1D3A]"
                      />
                      <span className="text-sm font-medium text-gray-700">Active Employee</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#0B1D3A] text-white rounded-lg text-sm font-semibold hover:bg-[#132D5E] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId ? <RefreshCw className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {editingId ? 'Update Employee' : 'Register Employee'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    if (!editingId) setActiveTab('list');
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
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
                  <h2 className="text-xl font-bold text-gray-900">Employee Directory</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage and monitor all employees in the system
                  </p>
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>

              <div className={`mt-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search employees..."
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
                    value={filters.role_id}
                    onChange={(e) => handleFilterChange('role_id', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Roles</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  
                  <input
                    type="date"
                    value={filters.from_date}
                    onChange={(e) => handleFilterChange('from_date', e.target.value)}
                    placeholder="From Date"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  
                  <input
                    type="date"
                    value={filters.to_date}
                    onChange={(e) => handleFilterChange('to_date', e.target.value)}
                    placeholder="To Date"
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

            {/* Employee Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader className="w-8 h-8 animate-spin text-[#0B1D3A]" />
                  <p className="mt-3 text-gray-500">Loading employees...</p>
                </div>
              ) : currentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="bg-gray-50 rounded-full p-4 mb-4">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No employees found</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {Object.values(filters).some(v => v) 
                      ? 'Try adjusting your filters' 
                      : 'Add your first employee to get started'}
                  </p>
                  {(Object.values(filters).some(v => v)) && (
                    <button onClick={resetFilters} className="text-[#0B1D3A] text-sm font-semibold">
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">Employee</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">Join Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {currentItems.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B1D3A] to-[#1A3A6E] flex items-center justify-center text-white font-semibold">
                              {employee.first_name[0]}{employee.last_name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{employee.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{employee.contact_number || '-'}</p>
                          {employee.address?.city && (
                            <p className="text-xs text-gray-400">{employee.address.city}, {employee.address.country}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                            <Briefcase className="w-3 h-3" />
                            {employee.role_name || 'No Role'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {employee.join_date || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            employee.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {employee.is_active ? (
                              <Activity className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(employee)}
                              className="p-2 text-gray-600 hover:text-[#0B1D3A] hover:bg-gray-100 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setPasswordAction(employee);
                                setShowPasswordModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                              title="Change Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(employee.id, `${employee.first_name} ${employee.last_name}`)}
                              disabled={resettingId === employee.id}
                              className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all disabled:opacity-50"
                              title="Reset to Default Password"
                            >
                              {resettingId === employee.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleToggleStatus(employee)}
                              disabled={togglingId === employee.id}
                              className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                employee.is_active 
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' 
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              }`}
                              title={employee.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {togglingId === employee.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(employee.id, `${employee.first_name} ${employee.last_name}`)}
                              disabled={deletingId === employee.id}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === employee.id ? (
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

            {/* Pagination */}
            {!loading && employees.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, employees.length)} of {employees.length} employees
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
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

export default Employees;