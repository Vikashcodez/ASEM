// src/components/IncidentInvestigations/InvestigationManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Paperclip,
  Calendar,
  User,
  AlertCircle,
  X,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust to your backend URL

const InvestigationManager = () => {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({
    incident_id: '',
    investigation_description: '',
    reason_for_incident: '',
    total_damage_estimate: '',
    evidence_files: '',
    notes: '',
    investigator_id: ''
  });

  // Fetch investigations on component mount
  useEffect(() => {
    fetchInvestigations();
  }, []);

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/investigations`);
      setInvestigations(response.data.data);
    } catch (error) {
      console.error('Error fetching investigations:', error);
      showNotification('error', 'Failed to fetch investigations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/investigations`, formData);
      await fetchInvestigations();
      closeModal();
      showNotification('success', 'Investigation created successfully');
    } catch (error) {
      console.error('Error creating investigation:', error);
      showNotification('error', 'Failed to create investigation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/investigations/${selectedInvestigation.id}`, formData);
      await fetchInvestigations();
      closeModal();
      showNotification('success', 'Investigation updated successfully');
    } catch (error) {
      console.error('Error updating investigation:', error);
      showNotification('error', 'Failed to update investigation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this investigation?')) {
      setLoading(true);
      try {
        await axios.delete(`${API_BASE_URL}/investigations/${id}`);
        await fetchInvestigations();
        showNotification('success', 'Investigation deleted successfully');
      } catch (error) {
        console.error('Error deleting investigation:', error);
        showNotification('error', 'Failed to delete investigation');
      } finally {
        setLoading(false);
      }
    }
  };

  const openModal = (mode, investigation = null) => {
    setModalMode(mode);
    if (investigation) {
      setSelectedInvestigation(investigation);
      setFormData({
        incident_id: investigation.incident_id || '',
        investigation_description: investigation.investigation_description || '',
        reason_for_incident: investigation.reason_for_incident || '',
        total_damage_estimate: investigation.total_damage_estimate || '',
        evidence_files: investigation.evidence_files || '',
        notes: investigation.notes || '',
        investigator_id: investigation.investigator_id || ''
      });
    } else {
      setFormData({
        incident_id: '',
        investigation_description: '',
        reason_for_incident: '',
        total_damage_estimate: '',
        evidence_files: '',
        notes: '',
        investigator_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvestigation(null);
  };

  const showNotification = (type, message) => {
    // Implement your notification system (e.g., toast)
    alert(message); // Temporary - replace with proper toast notification
  };

  const filteredInvestigations = investigations.filter(inv =>
    inv.investigation_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.reason_for_incident?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.incident_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Incident Investigations</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and track all incident investigations
              </p>
            </div>
            <button
              onClick={() => openModal('create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Investigation
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search investigations by description, reason, or incident..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Investigations</p>
                <p className="text-2xl font-semibold text-gray-900">{investigations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <AlertCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Cases</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {investigations.filter(i => !i.resolved).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Investigations Grid */}
        {loading && !investigations.length ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvestigations.map((investigation) => (
              <div
                key={investigation.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                {/* Investigation Header */}
                <div className="p-6 cursor-pointer" onClick={() => toggleExpand(investigation.id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Investigation #{investigation.id}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Incident #{investigation.incident_id}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {investigation.investigation_description || 'No description provided'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {expandedId === investigation.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>{investigation.investigator_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(investigation.created_at).toLocaleDateString()}</span>
                    </div>
                    {investigation.total_damage_estimate && (
                      <div className="flex items-center">
                        <span className="font-medium">Damage:</span>
                        <span className="ml-1">{investigation.total_damage_estimate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === investigation.id && (
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Investigation Details</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Description</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {investigation.investigation_description || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Reason for Incident</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {investigation.reason_for_incident || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Evidence Files</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {investigation.evidence_files || 'No evidence files attached'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Total Damage Estimate</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {investigation.total_damage_estimate || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Notes</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                              {investigation.notes || 'No notes available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => openModal('view', investigation)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      <button
                        onClick={() => openModal('edit', investigation)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(investigation.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredInvestigations.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No investigations found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating a new investigation'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={modalMode === 'create' ? handleCreate : handleUpdate}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {modalMode === 'create' && 'Create New Investigation'}
                      {modalMode === 'edit' && 'Edit Investigation'}
                      {modalMode === 'view' && 'Investigation Details'}
                    </h3>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Incident ID *</label>
                      <input
                        type="number"
                        name="incident_id"
                        value={formData.incident_id}
                        onChange={handleInputChange}
                        required
                        disabled={modalMode === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Investigation Description</label>
                      <textarea
                        name="investigation_description"
                        rows="3"
                        value={formData.investigation_description}
                        onChange={handleInputChange}
                        disabled={modalMode === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason for Incident</label>
                      <textarea
                        name="reason_for_incident"
                        rows="2"
                        value={formData.reason_for_incident}
                        onChange={handleInputChange}
                        disabled={modalMode === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Damage Estimate</label>
                      <input
                        type="text"
                        name="total_damage_estimate"
                        value={formData.total_damage_estimate}
                        onChange={handleInputChange}
                        disabled={modalMode === 'view'}
                        placeholder="e.g., $5,000 USD"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Evidence Files</label>
                      <input
                        type="text"
                        name="evidence_files"
                        value={formData.evidence_files}
                        onChange={handleInputChange}
                        disabled={modalMode === 'view'}
                        placeholder="Comma-separated file paths or URLs"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        name="notes"
                        rows="3"
                        value={formData.notes}
                        onChange={handleInputChange}
                        disabled={modalMode === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Investigator ID</label>
                      <input
                        type="number"
                        name="investigator_id"
                        value={formData.investigator_id}
                        onChange={handleInputChange}
                        disabled={modalMode === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                {modalMode !== 'view' && (
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      {modalMode === 'create' ? 'Create' : 'Update'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationManager;