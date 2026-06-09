import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

const InvestigationManager = () => {
  const { token, user } = useAuth();
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingInvestigations, setLoadingInvestigations] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    incident_id: '',
    investigation_description: '',
    reason_for_incident: '',
    total_damage_estimate: '',
    evidence_files: '',
    notes: ''
  });

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const getAuthConfig = () => (token ? { headers: { Authorization: `Bearer ${token}` } } : {});

  const getCurrentEmployeeId = () => user?.employee_id || user?.id || user?.user_id || '';

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const fetchActiveIncidents = async () => {
    try {
      setLoadingIncidents(true);
      const response = await axios.get(`${API_BASE_URL}/incidents/active/with-room-allocation`, getAuthConfig());
      setActiveIncidents(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching active incidents:', error);
      showMessage('error', error?.response?.data?.message || 'Failed to fetch active incidents');
    } finally {
      setLoadingIncidents(false);
    }
  };

  const fetchInvestigations = async () => {
    try {
      setLoadingInvestigations(true);
      const response = await axios.get(`${API_BASE_URL}/investigations`, getAuthConfig());
      setInvestigations(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching investigations:', error);
      showMessage('error', error?.response?.data?.message || 'Failed to fetch investigations');
    } finally {
      setLoadingInvestigations(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchActiveIncidents(), fetchInvestigations()]);
  };

  const openModal = (incident) => {
    const currentEmployeeId = getCurrentEmployeeId();
    setSelectedIncident(incident);
    setSelectedInvestigation(null);
    setFormData({
      incident_id: incident.id,
      investigation_description: '',
      reason_for_incident: '',
      total_damage_estimate: '',
      evidence_files: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIncident(null);
    setSelectedInvestigation(null);
    setFormData({
      incident_id: '',
      investigation_description: '',
      reason_for_incident: '',
      total_damage_estimate: '',
      evidence_files: '',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.incident_id) {
      showMessage('error', 'Incident is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        incident_id: Number(formData.incident_id),
        investigation_description: formData.investigation_description || null,
        reason_for_incident: formData.reason_for_incident || null,
        total_damage_estimate: formData.total_damage_estimate || null,
        evidence_files: formData.evidence_files || null,
        notes: formData.notes || null,
        investigator_id: getCurrentEmployeeId() ? Number(getCurrentEmployeeId()) : null
      };

      if (selectedInvestigation?.id) {
        await axios.put(`${API_BASE_URL}/investigations/${selectedInvestigation.id}`, payload, getAuthConfig());
        showMessage('success', 'Investigation updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/investigations`, payload, getAuthConfig());
        showMessage('success', 'Investigation created successfully');
      }

      closeModal();
      await fetchInvestigations();
    } catch (error) {
      console.error('Error creating investigation:', error);
      showMessage('error', error?.response?.data?.message || 'Failed to save investigation');
    } finally {
      setSaving(false);
    }
  };

  const filteredIncidents = useMemo(() => {
    return activeIncidents.filter((incident) => {
      const searchBlob = `${incident.incident_code || ''} ${incident.incident_title || ''} ${incident.location_details || ''} ${incident.reported_by_name || ''}`.toLowerCase();
      const matchesSearch = !searchTerm || searchBlob.includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'ALL' || incident.severity_level === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [activeIncidents, searchTerm, severityFilter]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const stats = useMemo(() => {
    return {
      activeIncidents: activeIncidents.length,
      totalInvestigations: investigations.length,
      highSeverity: activeIncidents.filter((incident) => incident.severity_level === 'HIGH').length,
      allocatedIncidents: activeIncidents.filter((incident) => incident.is_room_allocated).length,
    };
  }, [activeIncidents, investigations]);

  const severityPillClass = (severity) => {
    if (severity === 'HIGH') return 'bg-red-100 text-red-700 border-red-200';
    if (severity === 'MEDIUM') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] via-[#132D5E] to-[#1A3A6E] p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-5 h-5 text-blue-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                    Incident Response
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-2">Incident Investigations</h1>
                <p className="text-blue-100 max-w-2xl">
                  Review active incidents, inspect their room allocations, and open an investigation form from the incident list.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <AlertCircle className="w-5 h-5 mb-2 text-red-300" />
                  <div className="text-2xl font-bold">{stats.activeIncidents}</div>
                  <div className="text-xs text-blue-200 mt-1">Active Incidents</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <FileText className="w-5 h-5 mb-2 text-green-300" />
                  <div className="text-2xl font-bold">{stats.totalInvestigations}</div>
                  <div className="text-xs text-blue-200 mt-1">Total Investigations</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Clock className="w-5 h-5 mb-2 text-yellow-300" />
                  <div className="text-2xl font-bold">{stats.highSeverity}</div>
                  <div className="text-xs text-blue-200 mt-1">High Severity</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Building2 className="w-5 h-5 mb-2 text-purple-300" />
                  <div className="text-2xl font-bold">{stats.allocatedIncidents}</div>
                  <div className="text-xs text-blue-200 mt-1">Room Allocated</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-6 rounded-xl p-4 flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
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

        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1">
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 bg-[#0B1D3A] text-white shadow-md"
            >
              <Search className="w-4 h-4" />
              Active Incidents
            </button>
            <button
              onClick={refreshAll}
              className="px-6 py-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by code, title, location, or reporter"
                  className="w-full pl-10 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {loadingIncidents ? (
              <div className="p-10 text-center text-gray-500">
                <RefreshCw className="mx-auto mb-3 w-6 h-6 animate-spin" />
                Loading active incidents...
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No active incidents found for investigation.</div>
            ) : (
              <>
                <div className="hidden lg:flex bg-gray-50 border-b border-gray-200 px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <div className="w-[22%]">Incident</div>
                  <div className="w-[14%]">Severity</div>
                  <div className="w-[24%]">Location</div>
                  <div className="w-[16%]">Reported By</div>
                  <div className="w-[16%]">Room Allocation</div>
                  <div className="w-[8%] text-right">Action</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {filteredIncidents.map((incident) => {
                    const roomAllocations = Array.isArray(incident.room_allocations) ? incident.room_allocations : [];
                    const latestAllocation = roomAllocations[0] || null;

                    return (
                      <div key={incident.id} className="px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="lg:w-[22%] min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                              {incident.incident_code || 'N/A'}
                            </span>
                            {incident.is_room_allocated ? (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
                                Allocated
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{incident.incident_title || 'Untitled incident'}</p>
                          <p className="text-xs text-gray-500 truncate">{incident.incident_type || 'General'}</p>
                        </div>

                        <div className="lg:w-[14%]">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${severityPillClass(incident.severity_level)}`}>
                            {incident.severity_level || 'LOW'}
                          </span>
                        </div>

                        <div className="lg:w-[24%] text-sm text-gray-600 flex items-start gap-2 min-w-0">
                          <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{incident.location_details || 'No location details'}</span>
                        </div>

                        <div className="lg:w-[16%] text-sm text-gray-600 truncate">
                          {incident.reported_by_name || 'Unknown'}
                        </div>

                        <div className="lg:w-[16%] text-sm text-gray-600">
                          {latestAllocation ? (
                            <div>
                              <div className="font-medium text-gray-900">Room #{latestAllocation.room_id}</div>
                              <div className="text-xs text-gray-500">
                                {latestAllocation.no_of_people || 0} people · {latestAllocation.note || 'No note'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No allocation</span>
                          )}
                        </div>

                        <div className="lg:w-[8%] lg:text-right">
                          <button
                            type="button"
                            onClick={() => openModal(incident)}
                            className="px-3 py-2 rounded-xl bg-[#0B1D3A] text-white text-xs font-semibold hover:bg-[#132D5E] transition-colors inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Investigate
                          </button>
                        </div>

                        <div className="lg:hidden mt-2">
                          <button
                            onClick={() => toggleExpand(incident.id)}
                            className="text-xs font-semibold text-[#0B1D3A]"
                          >
                            {expandedId === incident.id ? 'Hide details' : 'Show details'}
                          </button>
                        </div>

                        {expandedId === incident.id && (
                          <div className="lg:hidden w-full rounded-xl bg-gray-50 border border-gray-200 p-4 mt-2 space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{incident.reported_by_name || 'Unknown'}</span>
                            </div>
                            {roomAllocations.length > 0 && (
                              <div>
                                <div className="font-medium text-gray-900 mb-1">Room Allocations</div>
                                <div className="space-y-2">
                                  {roomAllocations.map((allocation) => (
                                    <div key={allocation.allocation_id} className="rounded-lg bg-white border border-gray-200 p-3">
                                      <div className="text-xs text-gray-500">
                                        Room #{allocation.room_id} · {allocation.no_of_people || 0} people
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">{allocation.note || 'No note'}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Investigations</h2>
                <p className="text-sm text-gray-500">Latest investigation records in the system.</p>
              </div>
              {loadingInvestigations && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
            <div className="divide-y divide-gray-200">
              {investigations.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No investigations recorded yet.</div>
              ) : (
                investigations.slice(0, 5).map((investigation) => (
                  <div key={investigation.id} className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                            Investigation #{investigation.id}
                          </span>
                          <span className="text-xs text-gray-500">Incident #{investigation.incident_id}</span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-900">
                          {investigation.investigation_description || 'No investigation description provided'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {investigation.investigator_name || 'Unassigned'} · {investigation.created_at ? new Date(investigation.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleExpand(investigation.id)}
                        className="text-xs font-semibold text-[#0B1D3A]"
                      >
                        {expandedId === investigation.id ? 'Hide details' : 'View details'}
                      </button>
                    </div>

                    {expandedId === investigation.id && (
                      <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Reason</div>
                          <div className="text-gray-900">{investigation.reason_for_incident || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Damage Estimate</div>
                          <div className="text-gray-900">{investigation.total_damage_estimate || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Evidence Files</div>
                          <div className="text-gray-900 break-all">{investigation.evidence_files || 'None'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Notes</div>
                          <div className="text-gray-900 whitespace-pre-wrap">{investigation.notes || 'No notes available'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/70" onClick={closeModal}></div>
          <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
            <div className="relative z-[61] w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
              <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedInvestigation ? 'Edit Investigation' : 'Open Investigation'}
                    </h3>
                    <p className="text-xs text-gray-500">Fill in the investigation details for the selected incident.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-5 py-5 space-y-4 overflow-y-auto">
                  {selectedIncident && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{selectedIncident.incident_title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedIncident.incident_code} · {selectedIncident.location_details || 'No location details'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Reported by: {selectedIncident.reported_by_name || 'Unknown'}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Investigation Description</label>
                    <textarea
                      name="investigation_description"
                      rows="3"
                      value={formData.investigation_description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason for Incident</label>
                    <textarea
                      name="reason_for_incident"
                      rows="2"
                      value={formData.reason_for_incident}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Damage Estimate</label>
                    <input
                      type="text"
                      name="total_damage_estimate"
                      value={formData.total_damage_estimate}
                      onChange={handleInputChange}
                      placeholder="e.g., $5,000 USD"
                      className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Evidence Files</label>
                    <input
                      type="text"
                      name="evidence_files"
                      value={formData.evidence_files}
                      onChange={handleInputChange}
                      placeholder="Comma-separated file paths or URLs"
                      className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                </div>

                <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                    Save Investigation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationManager;