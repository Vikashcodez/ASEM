import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  CheckCircle,
  X,
  Building2,
  Activity,
  DoorOpen,
  Users,
  Grid,
  RefreshCw,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Bed,
  MapPin
} from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

const RoomAllocation = () => {
  const { token, user } = useAuth();
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomHierarchy, setRoomHierarchy] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deallocatingId, setDeallocatingId] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    incident_id: '',
    terminal_id: '',
    block_id: '',
    floor_id: '',
    room_id: '',
    no_of_people: 1,
    note: '',
    allocated_by: ''
  });

  const getAuthConfig = () => {
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const getCurrentEmployeeId = () => {
    return user?.id || user?.employee_id || null;
  };

  const showError = (fallback, error) => {
    setMessage({ type: 'error', text: error?.response?.data?.message || fallback });
  };

  const fetchActiveIncidents = async () => {
    try {
      setLoadingIncidents(true);
      const response = await axios.get(`${API_BASE_URL}/incidents/active`, getAuthConfig());
      setActiveIncidents(response.data?.data || []);
    } catch (error) {
      showError('Failed to fetch active incidents', error);
    } finally {
      setLoadingIncidents(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms/available/all`, getAuthConfig());
      setRooms(response.data?.data || []);
    } catch (error) {
      showError('Failed to fetch available rooms', error);
    }
  };

  const fetchRoomHierarchy = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms/hierarchy`, getAuthConfig());
      setRoomHierarchy(response.data?.data || []);
    } catch (error) {
      showError('Failed to fetch room hierarchy', error);
    }
  };

  const fetchAllocations = async () => {
    try {
      setLoadingAllocations(true);
      const response = await axios.get(`${API_BASE_URL}/room-allocations/active`, getAuthConfig());
      setAllocations(response.data?.data || []);
    } catch (error) {
      showError('Failed to fetch active allocations', error);
    } finally {
      setLoadingAllocations(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchActiveIncidents(), fetchRooms(), fetchRoomHierarchy(), fetchAllocations()]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const openAllocationModal = (incident) => {
    const currentEmployeeId = getCurrentEmployeeId();
    setSelectedIncident(incident);
    setFormData({
      incident_id: incident.id,
      terminal_id: '',
      block_id: '',
      floor_id: '',
      room_id: '',
      no_of_people: 1,
      note: '',
      allocated_by: currentEmployeeId || ''
    });
    setShowModal(true);
  };

  const closeAllocationModal = () => {
    setShowModal(false);
    setSelectedIncident(null);
    setFormData({
      incident_id: '',
      terminal_id: '',
      block_id: '',
      floor_id: '',
      room_id: '',
      no_of_people: 1,
      note: '',
      allocated_by: ''
    });
  };

  const handleAllocateRoom = async (event) => {
    event.preventDefault();

    if (!formData.room_id) {
      setMessage({ type: 'error', text: 'Please select a room' });
      return;
    }

    if (!formData.terminal_id || !formData.block_id || !formData.floor_id) {
      setMessage({ type: 'error', text: 'Please select terminal, block, and floor first' });
      return;
    }

    const peopleCount = Number(formData.no_of_people) || 0;
    if (peopleCount <= 0) {
      setMessage({ type: 'error', text: 'Number of people must be at least 1' });
      return;
    }

    if (maxAllocatablePeople !== null && peopleCount > maxAllocatablePeople) {
      setMessage({ type: 'error', text: `People count cannot exceed available capacity (${maxAllocatablePeople})` });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        incident_id: Number(formData.incident_id),
        room_id: Number(formData.room_id),
        no_of_people: peopleCount,
        note: formData.note || null,
        allocated_by: formData.allocated_by || null
      };

      await axios.post(`${API_BASE_URL}/room-allocations`, payload, getAuthConfig());
      setMessage({ type: 'success', text: 'Room allocated successfully' });
      closeAllocationModal();
      await refreshAll();
    } catch (error) {
      showError('Failed to allocate room', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeallocate = async (allocationId) => {
    const shouldDeallocate = window.confirm('Are you sure you want to deallocate this room?');
    if (!shouldDeallocate) return;

    try {
      setDeallocatingId(allocationId);
      await axios.patch(
        `${API_BASE_URL}/room-allocations/${allocationId}/deallocate`,
        { deallocated_by: getCurrentEmployeeId() || null },
        getAuthConfig()
      );
      setMessage({ type: 'success', text: 'Room deallocated successfully' });
      await refreshAll();
    } catch (error) {
      showError('Failed to deallocate room', error);
    } finally {
      setDeallocatingId(null);
    }
  };

  const filteredIncidents = useMemo(() => {
    return activeIncidents.filter((incident) => {
      const searchBlob = `${incident.incident_code || ''} ${incident.incident_title || ''} ${incident.location_details || ''}`.toLowerCase();
      const matchesSearch = !searchText || searchBlob.includes(searchText.toLowerCase());
      const matchesSeverity = severityFilter === 'ALL' || incident.severity_level === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [activeIncidents, searchText, severityFilter]);

  const stats = useMemo(() => {
    const highSeverity = activeIncidents.filter((item) => item.severity_level === 'HIGH').length;
    const allocatedPeople = allocations.reduce((sum, item) => sum + (Number(item.no_of_people) || 0), 0);

    return {
      pendingIncidents: activeIncidents.length,
      activeAllocations: allocations.length,
      highSeverity,
      allocatedPeople
    };
  }, [activeIncidents, allocations]);

  const availableRoomsById = useMemo(() => {
    return rooms.reduce((accumulator, room) => {
      accumulator[String(room.id)] = room;
      return accumulator;
    }, {});
  }, [rooms]);

  const terminalOptions = useMemo(() => {
    return roomHierarchy.map((terminal) => ({
      id: String(terminal.terminal_id),
      name: terminal.terminal_name,
      blocks: terminal.blocks || []
    }));
  }, [roomHierarchy]);

  const blockOptions = useMemo(() => {
    const selectedTerminal = terminalOptions.find((terminal) => terminal.id === String(formData.terminal_id));
    if (!selectedTerminal) return [];
    return (selectedTerminal.blocks || []).map((block) => ({
      id: String(block.block_id),
      name: block.block_name,
      floors: block.floors || []
    }));
  }, [terminalOptions, formData.terminal_id]);

  const floorOptions = useMemo(() => {
    const selectedBlock = blockOptions.find((block) => block.id === String(formData.block_id));
    if (!selectedBlock) return [];
    return (selectedBlock.floors || []).map((floor) => ({
      id: String(floor.floor_id),
      name: floor.floor_name || `Level ${floor.floor_number}`,
      rooms: floor.rooms || []
    }));
  }, [blockOptions, formData.block_id]);

  const roomOptionsFlat = useMemo(() => {
    const selectedFloor = floorOptions.find((floor) => floor.id === String(formData.floor_id));
    if (!selectedFloor) return [];

    return (selectedFloor.rooms || [])
      .map((room) => {
        const availableRoom = availableRoomsById[String(room.room_id)];
        if (!availableRoom) return null;

        const availableCapacity = Number(availableRoom.available_capacity) || 0;
        if (availableCapacity <= 0) return null;

        return {
          id: String(room.room_id),
          label: `${room.room_name} (${room.room_code || 'No Code'}) - Capacity Left: ${availableCapacity}`,
          availableCapacity
        };
      })
      .filter(Boolean);
  }, [floorOptions, formData.floor_id, availableRoomsById]);

  const selectedRoom = useMemo(() => {
    if (!formData.room_id) return null;
    return availableRoomsById[String(formData.room_id)] || null;
  }, [formData.room_id, availableRoomsById]);

  const maxAllocatablePeople = selectedRoom ? Number(selectedRoom.available_capacity) || 0 : null;

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
                  <Building2 className="w-5 h-5 text-blue-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                    Emergency Operations
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-2">Incident Room Allocation</h1>
                <p className="text-blue-100 max-w-2xl">
                  Assign available rooms to active incidents and monitor ongoing allocations.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <AlertTriangle className="w-5 h-5 mb-2 text-red-300" />
                  <div className="text-2xl font-bold">{stats.pendingIncidents}</div>
                  <div className="text-xs text-blue-200 mt-1">Pending Incidents</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <DoorOpen className="w-5 h-5 mb-2 text-green-300" />
                  <div className="text-2xl font-bold">{stats.activeAllocations}</div>
                  <div className="text-xs text-blue-200 mt-1">Active Allocations</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Activity className="w-5 h-5 mb-2 text-yellow-300" />
                  <div className="text-2xl font-bold">{stats.highSeverity}</div>
                  <div className="text-xs text-blue-200 mt-1">High Severity</div>
                </div>
                <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Users className="w-5 h-5 mb-2 text-purple-300" />
                  <div className="text-2xl font-bold">{stats.allocatedPeople}</div>
                  <div className="text-xs text-blue-200 mt-1">People Allocated</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'pending' ? 'bg-[#0B1D3A] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-4 h-4" />
              Pending Allocation
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'active' ? 'bg-[#0B1D3A] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Bed className="w-4 h-4" />
              Active Rooms
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

        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search by code, title, or location"
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
                <div className="p-10 text-center text-gray-500">Loading active incidents...</div>
              ) : filteredIncidents.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No incidents pending room allocation.</div>
              ) : (
                <>
                  <div className="hidden lg:flex bg-gray-50 border-b border-gray-200 px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="w-[28%]">Incident</div>
                    <div className="w-[14%]">Severity</div>
                    <div className="w-[28%]">Location</div>
                    <div className="w-[18%]">Reported By</div>
                    <div className="w-[12%] text-right">Action</div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {filteredIncidents.map((incident) => (
                      <div key={incident.id} className="px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="lg:w-[28%] min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                              {incident.incident_code || 'N/A'}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{incident.incident_title}</p>
                          <p className="text-xs text-gray-500 truncate">{incident.incident_type || 'General'}</p>
                        </div>

                        <div className="lg:w-[14%]">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${severityPillClass(incident.severity_level)}`}>
                            {incident.severity_level || 'LOW'}
                          </span>
                        </div>

                        <div className="lg:w-[28%] text-sm text-gray-600 flex items-start gap-2 min-w-0">
                          <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{incident.location_details || 'No location details'}</span>
                        </div>

                        <div className="lg:w-[18%] text-sm text-gray-600 truncate">
                          {incident.reported_by_name || 'Unknown'}
                        </div>

                        <div className="lg:w-[12%] lg:text-right">
                          <button
                            onClick={() => openAllocationModal(incident)}
                            className="px-3 py-2 rounded-xl bg-[#0B1D3A] text-white text-xs font-semibold hover:bg-[#132D5E] transition-colors inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Allocate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-4">
            {loadingAllocations ? (
              <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center text-gray-500">
                Loading active allocations...
              </div>
            ) : allocations.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center text-gray-500">
                No active room allocations.
              </div>
            ) : (
              allocations.map((allocation) => (
                <div key={allocation.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                          {allocation.incident_code || 'N/A'}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${severityPillClass(allocation.severity_level)}`}>
                          {allocation.severity_level || 'LOW'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{allocation.incident_title || 'Incident'}</h3>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-700">Room:</span>{' '}
                        {allocation.room_name || allocation.room_number || allocation.room_code || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-700">People:</span> {allocation.no_of_people || 0}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {allocation.allocated_at ? new Date(allocation.allocated_at).toLocaleString() : 'N/A'}
                      </p>
                      {allocation.note && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Note:</span> {allocation.note}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeallocate(allocation.id)}
                      disabled={deallocatingId === allocation.id}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      {deallocatingId === allocation.id ? 'Deallocating...' : 'Deallocate'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showModal && selectedIncident && (
          <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full border border-gray-200 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Allocate Room</h2>
                <button onClick={closeAllocationModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-600">Incident</p>
                  <p className="font-semibold text-gray-900">{selectedIncident.incident_code} - {selectedIncident.incident_title}</p>
                </div>

                <form onSubmit={handleAllocateRoom} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Terminal</label>
                    <select
                      value={formData.terminal_id}
                      onChange={(event) => {
                        const terminalId = event.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          terminal_id: terminalId,
                          block_id: '',
                          floor_id: '',
                          room_id: ''
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      required
                    >
                      <option value="">Select terminal</option>
                      {terminalOptions.map((terminal) => (
                        <option key={terminal.id} value={terminal.id}>{terminal.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Block</label>
                    <select
                      value={formData.block_id}
                      onChange={(event) => {
                        const blockId = event.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          block_id: blockId,
                          floor_id: '',
                          room_id: ''
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      required
                      disabled={!formData.terminal_id}
                    >
                      <option value="">Select block</option>
                      {blockOptions.map((block) => (
                        <option key={block.id} value={block.id}>{block.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Floor</label>
                    <select
                      value={formData.floor_id}
                      onChange={(event) => {
                        const floorId = event.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          floor_id: floorId,
                          room_id: ''
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      required
                      disabled={!formData.block_id}
                    >
                      <option value="">Select floor</option>
                      {floorOptions.map((floor) => (
                        <option key={floor.id} value={floor.id}>{floor.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Room</label>
                    <select
                      value={formData.room_id}
                      onChange={(event) => {
                        const roomId = event.target.value;
                        const availableRoom = availableRoomsById[String(roomId)];
                        const maxCapacity = Number(availableRoom?.available_capacity) || 1;

                        setFormData((prev) => ({
                          ...prev,
                          room_id: roomId,
                          no_of_people: String(Math.min(Number(prev.no_of_people) || 1, maxCapacity))
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      required
                      disabled={!formData.floor_id}
                    >
                      <option value="">Select available room</option>
                      {roomOptionsFlat.map((roomOption) => (
                        <option key={roomOption.id} value={roomOption.id}>
                          {roomOption.label}
                        </option>
                      ))}
                    </select>
                    {formData.floor_id && roomOptionsFlat.length === 0 && (
                      <p className="mt-2 text-xs text-red-500">
                        No available rooms found for selected floor.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of People</label>
                    <input
                      type="number"
                      min="1"
                      max={maxAllocatablePeople || undefined}
                      value={formData.no_of_people}
                      onChange={(event) => {
                        const typedValue = Number(event.target.value) || 1;
                        const boundedValue = maxAllocatablePeople
                          ? Math.min(typedValue, maxAllocatablePeople)
                          : typedValue;

                        setFormData((prev) => ({ ...prev, no_of_people: String(boundedValue) }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                      required
                    />
                    {maxAllocatablePeople !== null && (
                      <p className="mt-2 text-xs text-gray-500">
                        Maximum allocatable people for this room: {maxAllocatablePeople}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Note</label>
                    <textarea
                      rows={3}
                      value={formData.note}
                      onChange={(event) => setFormData((prev) => ({ ...prev, note: event.target.value }))}
                      placeholder="Optional additional details"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeAllocationModal}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B1D3A] text-white text-sm font-semibold hover:bg-[#132D5E] disabled:opacity-60"
                    >
                      {saving ? 'Allocating...' : 'Allocate Room'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomAllocation;
