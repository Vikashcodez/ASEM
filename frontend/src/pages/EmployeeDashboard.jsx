import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import EmployeeProfile from '../components/EmployeeProfile';
import Terminals from '../components/terminals';
import Blocks from '../components/blocks';
import Floors from '../components/floors';
import Rooms from '../components/rooms';
import RoomAvailability from '../components/RoomsAvaiblity';
import IncidentDashboard from '../components/incidentDashboard';
import IncidentManagementSystem from '../components/IncidentManagement';
import IncidentRoomAllocation from '../components/incideintRoomAllocation';

function EmployeeDashboard({ handleLogout }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [buildingManagementOpen, setBuildingManagementOpen] = useState(true);
    const [incidentManagementOpen, setIncidentManagementOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const { token, user } = useAuth();
    const userName = user?.name || 'Employee';

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (mobileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileSidebarOpen]);

    // Close mobile sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const sidebar = document.getElementById('mobile-sidebar');
            const toggleBtn = document.getElementById('sidebar-toggle');
            if (mobileSidebarOpen && window.innerWidth < 1024 && sidebar && !sidebar.contains(event.target) && toggleBtn && !toggleBtn.contains(event.target)) {
                setMobileSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [mobileSidebarOpen]);

    const navItems = [
        {
            id: 'profile',
            label: 'My Profile',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
            )
        },
        {
            id: 'incident-management',
            label: 'Incident Management',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13l2-2 2 2" />
                    <path d="M12 11v6" />
                    <path d="M4 6h16" />
                    <path d="M6 6l1-2h10l1 2" />
                    <path d="M5 6l1 14h12l1-14" />
                </svg>
            ),
            children: [
                {
                    id: 'incident-reports',
                    label: 'Incident Reports',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19h16" />
                            <path d="M5 17V9" />
                            <path d="M9 17V5" />
                            <path d="M13 17v-7" />
                            <path d="M17 17v-3" />
                        </svg>
                    )
                },
                {
                    id: 'add-incidents',
                    label: 'Add Incidents',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14" />
                            <path d="M5 12h14" />
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
                        </svg>
                    )
                },
                {
                    id: 'incident-room-allocation',
                    label: 'Incident Room Allocation',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" />
                            <path d="M5 21V7l7-4 7 4v14" />
                            <path d="M9 21v-6h6v6" />
                        </svg>
                    )
                }
            ]
        },
        {
            id: 'building-management',
            label: 'Building Management',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16" />
                    <path d="M9 9h.01M9 12h.01M9 15h.01M15 9h.01M15 12h.01M15 15h.01" />
                </svg>
            ),
            children: [
                {
                    id: 'terminals',
                    label: 'Terminals',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19h16" />
                            <path d="M6 19V7l6-4 6 4v12" />
                            <path d="M10 19v-6h4v6" />
                        </svg>
                    )
                },
                {
                    id: 'blocks',
                    label: 'Block',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" />
                            <path d="M6 21V8l6-4 6 4v13" />
                            <path d="M9 11h.01M9 14h.01M15 11h.01M15 14h.01" />
                        </svg>
                    )
                },
                {
                    id: 'floors',
                    label: 'Floor',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 20h16" />
                            <path d="M7 20V8l5-4 5 4v12" />
                            <path d="M10 20v-5h4v5" />
                        </svg>
                    )
                },
                {
                    id: 'rooms',
                    label: 'Room',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" />
                            <path d="M5 21V7l7-4 7 4v14" />
                            <path d="M9 21v-6h6v6" />
                            <path d="M9 11h.01M15 11h.01" />
                        </svg>
                    )
                },
                {
                    id: 'room-availability',
                    label: 'Room Availability',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" />
                            <path d="M5 21V7l7-4 7 4v14" />
                            <path d="M9 21v-6h6v6" />
                            <path d="M8 12l2 2 4-4" />
                        </svg>
                    )
                }
            ]
        }
    ];

    const hasActiveDescendant = (item) => {
        if (item.id === activeTab) return true;
        return item.children?.some((child) => hasActiveDescendant(child)) || false;
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen" style={{ background: '#F8F9FC' }}>
                <div className="flex items-center justify-center w-full">
                    <div className="flex flex-col items-center gap-4">
                        <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="3"/>
                            <path d="M12 2a10 10 0 0110 10" stroke="#0B1D3A" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        <p className="text-sm font-medium text-gray-500 tracking-wide">Loading Secure Profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen" style={{ background: '#F8F9FC' }}>
            {/* Desktop Sidebar - Hidden on mobile, visible on lg screens */}
            <div
                className="hidden lg:block fixed left-0 top-0 h-full z-20 transition-all duration-300 ease-out"
                style={{ 
                    width: isSidebarExpanded ? '280px' : '80px',
                }}
                onMouseEnter={() => setIsSidebarExpanded(true)}
                onMouseLeave={() => setIsSidebarExpanded(false)}
            >
                <div className="h-full flex flex-col overflow-y-auto" style={{ background: '#0B1D3A' }}>
                    {/* Sidebar Header */}
                    <div className="p-4 flex items-center justify-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {isSidebarExpanded ? (
                            <div className="flex items-center gap-3 w-full">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.7 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-white font-bold text-sm tracking-wide">AES Platform</h1>
                                    <p className="text-[11px] font-medium tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Employee Portal</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.7 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1">
                        {navItems.map((item) => {
                            const isBuildingManagement = item.id === 'building-management';
                            const isIncidentManagement = item.id === 'incident-management';
                            const isParentActive = isBuildingManagement && hasActiveDescendant(item);
                            const isIncidentParentActive = isIncidentManagement && hasActiveDescendant(item);
                            const isExpandableParent = isBuildingManagement || isIncidentManagement;
                            const isParentExpanded = isBuildingManagement ? buildingManagementOpen : incidentManagementOpen;
                            const setParentExpanded = isBuildingManagement ? setBuildingManagementOpen : setIncidentManagementOpen;
                            const isAnyParentActive = isParentActive || isIncidentParentActive;

                            return (
                                <div key={item.id} className="space-y-1">
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group"
                                        style={{
                                            justifyContent: !isSidebarExpanded ? 'center' : 'flex-start',
                                            color: activeTab === item.id || isAnyParentActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                            background: activeTab === item.id || isAnyParentActive ? 'rgba(255,255,255,0.08)' : 'transparent'
                                        }}
                                        onClick={() => {
                                            if (isExpandableParent && isSidebarExpanded) {
                                                setParentExpanded(!isParentExpanded);
                                            } else if (!isExpandableParent) {
                                                setActiveTab(item.id);
                                            }
                                        }}
                                        title={!isSidebarExpanded ? item.label : ''}
                                    >
                                        {(activeTab === item.id || isAnyParentActive) && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-white" />
                                        )}
                                        <span className="relative z-10 flex-shrink-0">{item.icon}</span>
                                        {isSidebarExpanded && (
                                            <>
                                                <span className="flex-1 text-left">{item.label}</span>
                                                {isExpandableParent && (
                                                    <svg 
                                                        width="14" 
                                                        height="14" 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        strokeWidth="2" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        className={`transition-transform duration-200 ${isParentExpanded ? 'rotate-180' : ''}`}
                                                        style={{ flexShrink: 0 }}
                                                    >
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                )}
                                            </>
                                        )}
                                    </button>

                                    {isSidebarExpanded && isExpandableParent && isParentExpanded && item.children && (
                                        <div className="ml-4 pl-4 space-y-1 border-l border-white/10">
                                            {item.children.map((child) => (
                                                <button
                                                    key={child.id}
                                                    type="button"
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                                                    style={{
                                                        color: activeTab === child.id ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                                        background: activeTab === child.id ? 'rgba(255,255,255,0.08)' : 'transparent'
                                                    }}
                                                    onClick={() => setActiveTab(child.id)}
                                                >
                                                    {activeTab === child.id && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white" />
                                                    )}
                                                    <span className="relative z-10">{child.icon}</span>
                                                    <span>{child.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        {isSidebarExpanded ? (
                            <>
                                <div className="flex items-center gap-3 mb-4 px-2">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: '#1A3A6E' }}>
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{userName}</p>
                                        <p className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile?.role || 'Employee'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                                    style={{ 
                                        background: 'rgba(239,68,68,0.1)', 
                                        color: '#FCA5A5',
                                        border: '1px solid rgba(239,68,68,0.2)'
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                                    </svg>
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-center">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#1A3A6E' }}>
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center p-2 rounded-xl transition-all duration-200"
                                    style={{ 
                                        background: 'rgba(239,68,68,0.1)', 
                                        color: '#FCA5A5',
                                        border: '1px solid rgba(239,68,68,0.2)'
                                    }}
                                    title="Sign Out"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar Drawer */}
            <div
                id="mobile-sidebar"
                className={`fixed top-0 left-0 w-72 h-full z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
                    mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                style={{ background: '#0B1D3A' }}
            >
                <div className="flex flex-col h-full overflow-y-auto">
                    <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                                    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.7 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-sm tracking-wide">AES Platform</h1>
                                <p className="text-[11px] font-medium tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Employee Portal</p>
                            </div>
                        </div>
                        <button onClick={() => setMobileSidebarOpen(false)} className="text-white/50 hover:text-white p-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const isBuildingManagement = item.id === 'building-management';
                            const isIncidentManagement = item.id === 'incident-management';
                            const isParentActive = isBuildingManagement && hasActiveDescendant(item);
                            const isIncidentParentActive = isIncidentManagement && hasActiveDescendant(item);
                            const isExpandableParent = isBuildingManagement || isIncidentManagement;
                            const isParentExpanded = isBuildingManagement ? buildingManagementOpen : incidentManagementOpen;
                            const setParentExpanded = isBuildingManagement ? setBuildingManagementOpen : setIncidentManagementOpen;
                            const isAnyParentActive = isParentActive || isIncidentParentActive;

                            return (
                                <div key={item.id} className="space-y-1">
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative"
                                        style={{
                                            color: activeTab === item.id || isAnyParentActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                            background: activeTab === item.id || isAnyParentActive ? 'rgba(255,255,255,0.08)' : 'transparent'
                                        }}
                                        onClick={() => {
                                            if (isExpandableParent) {
                                                setParentExpanded(!isParentExpanded);
                                            } else {
                                                setActiveTab(item.id);
                                                setMobileSidebarOpen(false);
                                            }
                                        }}
                                    >
                                        {(activeTab === item.id || isAnyParentActive) && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-white" />
                                        )}
                                        <span className="relative z-10">{item.icon}</span>
                                        <span className="flex-1 text-left">{item.label}</span>
                                        {isExpandableParent && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 ${isParentExpanded ? 'rotate-180' : ''}`}>
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        )}
                                    </button>

                                    {isExpandableParent && isParentExpanded && item.children && (
                                        <div className="ml-4 pl-4 space-y-1 border-l border-white/10">
                                            {item.children.map((child) => (
                                                <button
                                                    key={child.id}
                                                    type="button"
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                                                    style={{
                                                        color: activeTab === child.id ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                                        background: activeTab === child.id ? 'rgba(255,255,255,0.08)' : 'transparent'
                                                    }}
                                                    onClick={() => {
                                                        setActiveTab(child.id);
                                                        setMobileSidebarOpen(false);
                                                    }}
                                                >
                                                    <span>{child.icon}</span>
                                                    <span>{child.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#1A3A6E' }}>
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{userName}</p>
                                <p className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile?.role || 'Employee'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                            style={{ 
                                background: 'rgba(239,68,68,0.1)', 
                                color: '#FCA5A5',
                                border: '1px solid rgba(239,68,68,0.2)'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {mobileSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300" 
                    onClick={() => setMobileSidebarOpen(false)} 
                />
            )}

            {/* Main Content - No margin on mobile, margin on desktop based on expanded state */}
            <main 
                className="flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ease-out"
                style={{ 
                    marginLeft: '0px'
                }}
            >
                {/* Only apply desktop margin via CSS class */}
                <style>{`
                    @media (min-width: 1024px) {
                        main {
                            margin-left: ${isSidebarExpanded ? '280px' : '80px'} !important;
                        }
                    }
                `}</style>

                {/* Header */}
                <header className="h-16 lg:h-20 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10 shadow-sm" style={{ borderBottom: '1px solid #EEF0F4' }}>
                    <div className="flex items-center gap-3">
                        <button
                            id="sidebar-toggle"
                            onClick={() => setMobileSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12h18M3 6h18M3 18h18" />
                            </svg>
                        </button>
                        
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                                {activeTab === 'profile' ? 'My Profile' : 
                                 activeTab === 'terminals' ? 'Terminals' :
                                 activeTab === 'blocks' ? 'Blocks' :
                                 activeTab === 'floors' ? 'Floors' :
                                 activeTab === 'rooms' ? 'Rooms' :
                                 activeTab === 'room-availability' ? 'Room Availability' :
                                 activeTab === 'incident-reports' ? 'Incident Reports' :
                                 activeTab === 'add-incidents' ? 'Add Incidents' :
                                 activeTab === 'incident-room-allocation' ? 'Incident Room Allocation' : 'Dashboard'}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                                {activeTab === 'profile' ? 'View your personal information and details' :
                                 activeTab === 'terminals' ? 'Manage building terminals' :
                                 activeTab === 'blocks' ? 'Manage building blocks' :
                                 activeTab === 'floors' ? 'Manage floors' :
                                 activeTab === 'rooms' ? 'Manage rooms' :
                                 activeTab === 'room-availability' ? 'Check room availability' :
                                 activeTab === 'incident-reports' ? 'View incident reports' :
                                 activeTab === 'add-incidents' ? 'Report new incidents' :
                                 activeTab === 'incident-room-allocation' ? 'Allocate rooms for active incidents' : ''}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs sm:text-sm font-medium text-gray-700">
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-400 hidden sm:block">
                                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#1A3A6E' }}>
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">
                    {activeTab === 'profile' ? (
                        <EmployeeProfile profile={profile} userName={userName} />
                    ) : activeTab === 'terminals' ? (
                        <Terminals />
                    ) : activeTab === 'blocks' ? (
                        <Blocks />
                    ) : activeTab === 'floors' ? (
                        <Floors />
                    ) : activeTab === 'rooms' ? (
                        <Rooms />
                    ) : activeTab === 'room-availability' ? (
                        <RoomAvailability />
                    ) : activeTab === 'incident-reports' ? (
                        <IncidentDashboard />
                    ) : activeTab === 'add-incidents' ? (
                        <IncidentManagementSystem />
                    ) : activeTab === 'incident-room-allocation' ? (
                        <IncidentRoomAllocation />
                    ) : null}
                    
                </div>
            </main>
        </div>
    );
}

export default EmployeeDashboard;