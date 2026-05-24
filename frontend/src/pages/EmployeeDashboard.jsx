import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import EmployeeProfile from '../components/EmployeeProfile';
import Terminals from '../components/terminals';
import Blocks from '../components/blocks';
import Floors from '../components/floors';
import Rooms from '../components/rooms';
import RoomAvailability from '../components/RoomsAvaiblity';
import Availability from '../components/RoomsAvaiblity';

function EmployeeDashboard({ handleLogout }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [buildingManagementOpen, setBuildingManagementOpen] = useState(true);
    const { token, user } = useAuth();
    const userName = user?.name || 'Employee';

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
        if (item.id === activeTab) {
            return true;
        }

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

    // Professional Loading State
    if (loading) {
        return (
            <div className="flex min-h-screen" style={{ background: '#F8F9FC' }}>
                <aside className="w-72 fixed h-full" style={{ background: '#0B1D3A' }} />
                <main className="flex-1 ml-72 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="3"/>
                            <path d="M12 2a10 10 0 0110 10" stroke="#0B1D3A" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        <p className="text-sm font-medium text-gray-500 tracking-wide">Loading Secure Profile...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen" style={{ background: '#F8F9FC' }}>
            
            {/* Sidebar */}
            <aside className="w-72 flex flex-col fixed h-full" style={{ background: '#0B1D3A' }}>
                
                {/* Sidebar Header */}
                <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.7 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-sm tracking-wide">AES Platform</h1>
                        <p className="text-[11px] font-medium tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Employee Portal</p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="px-3 pt-2 pb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Navigation
                    </p>
                    
                    {navItems.map((item) => {
                        const isBuildingManagement = item.id === 'building-management';
                        const isParentActive = isBuildingManagement && hasActiveDescendant(item);

                        return (
                            <div key={item.id} className="space-y-1">
                                <button
                                    type="button"
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group"
                                    style={{
                                        color: activeTab === item.id || isParentActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                        background: activeTab === item.id || isParentActive ? 'rgba(255,255,255,0.08)' : 'transparent'
                                    }}
                                    onClick={() => {
                                        if (isBuildingManagement) {
                                            setBuildingManagementOpen((current) => !current);
                                            return;
                                        }

                                        setActiveTab(item.id);
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeTab !== item.id && !isParentActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                        if (activeTab !== item.id && !isParentActive) e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== item.id && !isParentActive) e.currentTarget.style.background = 'transparent';
                                        if (activeTab !== item.id && !isParentActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                                    }}
                                >
                                    {activeTab === item.id || isParentActive ? (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-white" />
                                    ) : null}
                                    <span className="relative z-10">{item.icon}</span>
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {isBuildingManagement && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${buildingManagementOpen ? 'rotate-180' : ''}`}>
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    )}
                                </button>

                                {isBuildingManagement && buildingManagementOpen && item.children && (
                                    <div className="ml-4 pl-4 space-y-1 border-l border-white/10">
                                        {item.children.map((child) => {
                                            const childHasActiveDescendant = hasActiveDescendant(child);

                                            return (
                                                <div key={child.id} className="space-y-1">
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative group"
                                                        style={{
                                                            color: childHasActiveDescendant ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                                            background: childHasActiveDescendant ? 'rgba(255,255,255,0.08)' : 'transparent'
                                                        }}
                                                        onClick={() => setActiveTab(child.id)}
                                                        onMouseEnter={(e) => {
                                                            if (!childHasActiveDescendant) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                                            if (!childHasActiveDescendant) e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!childHasActiveDescendant) e.currentTarget.style.background = 'transparent';
                                                            if (!childHasActiveDescendant) e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                                                        }}
                                                    >
                                                        {childHasActiveDescendant && (
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white" />
                                                        )}
                                                        <span className="relative z-10">{child.icon}</span>
                                                        <span>{child.label}</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#1A3A6E' }}>
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{userName}</p>
                            <p className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile?.name || userName}</p>
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
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-72 flex flex-col min-h-screen">
                {activeTab === 'profile' ? (
                    <>
                        {/* Top Header Bar */}
                        <header className="h-20 bg-white flex items-center justify-between px-8 sticky top-0 z-10" style={{ borderBottom: '1px solid #EEF0F4', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">My Profile</h2>
                                <p className="text-sm text-gray-400 mt-0.5">View your personal information and details</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-700">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </header>

                        {/* Page Content */}
                        <div className="flex-1 p-8">
                            <EmployeeProfile profile={profile} userName={userName} />
                        </div>
                    </>
                ) : activeTab === 'terminals' ? (
                    <div className="flex-1">
                        <Terminals />
                    </div>
                ) : activeTab === 'blocks' ? (
                    <div className="flex-1">
                        <Blocks />
                    </div>
                ) : activeTab === 'floors' ? (
                    <div className="flex-1">
                        <Floors />
                    </div>
                ) : activeTab === 'rooms' ? (
                    <div className="flex-1">
                        <Rooms />
                    </div>
                ) : activeTab === 'room-availability' ? (
                    <div className="flex-1">
                        <RoomAvailability />
                    </div>
                ) : null}
            </main>
        </div>
    );
}

export default EmployeeDashboard;