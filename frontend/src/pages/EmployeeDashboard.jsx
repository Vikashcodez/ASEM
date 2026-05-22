import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function EmployeeDashboard({ handleLogout }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token, user } = useAuth();
    const userName = user?.name || 'Employee';
    const activeTab = 'profile'; // Static for this view

    const formatAddress = (address) => {
        if (!address) return 'Not specified';

        if (typeof address === 'string') return address;

        if (typeof address === 'object') {
            const parts = [
                address.street,
                address.city,
                address.state,
                address.zip_code,
                address.country
            ].filter(Boolean);

            return parts.length ? parts.join(', ') : 'Not specified';
        }

        return 'Not specified';
    };

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
            id: 'emergency',
            label: 'Emergency Protocols',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            )
        },
        {
            id: 'reports',
            label: 'Incident Reports',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
            )
        }
    ];

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
                    
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group"
                            style={{
                                color: activeTab === item.id ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                background: activeTab === item.id ? 'rgba(255,255,255,0.08)' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                if (activeTab !== item.id) e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== item.id) e.currentTarget.style.background = 'transparent';
                                if (activeTab !== item.id) e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                            }}
                        >
                            {activeTab === item.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-white" />
                            )}
                            <span className="relative z-10">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
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
                    
                    {/* Profile Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8" style={{ border: '1px solid #EEF0F4' }}>
                        <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A6E 100%)' }}>
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(30%, -50%)' }} />
                        </div>
                        <div className="relative px-8 pb-6 pt-14">
                            <div className="flex items-start gap-6">
                                <div className="w-24 h-24 -mt-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg shrink-0" style={{ background: '#1A3A6E' }}>
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="pt-4 flex-1">
                                    <h3 className="text-2xl font-bold text-gray-900">{profile?.name}</h3>
                                    <p className="text-gray-500 mt-0.5">{profile?.role || 'Designation'}</p>
                                </div>
                                <div className="pt-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Personal Information */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #EEF0F4' }}>
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                </svg>
                                Personal Information
                            </h4>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Full Name</p>
                                    <p className="text-base font-semibold text-gray-900 mt-1">{profile?.name || '—'}</p>
                                </div>
                                <div className="border-t" style={{ borderColor: '#EEF0F4' }} />
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email Address</p>
                                    <p className="text-base font-semibold text-gray-900 mt-1">{profile?.email || '—'}</p>
                                </div>
                                <div className="border-t" style={{ borderColor: '#EEF0F4' }} />
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Employee ID</p>
                                    <p className="text-base font-semibold text-gray-900 mt-1 font-mono">{profile?.id ? `EMP-${profile.id.toString().padStart(4, '0')}` : '—'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Employment Details */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #EEF0F4' }}>
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                                </svg>
                                Employment Details
                            </h4>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Designation</p>
                                    <p className="text-base font-semibold text-gray-900 mt-1">{profile?.role || 'Not specified'}</p>
                                </div>
                                <div className="border-t" style={{ borderColor: '#EEF0F4' }} />
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Department</p>
                                    <p className="text-base font-semibold text-gray-900 mt-1">{profile?.department || 'Not specified'}</p>
                                </div>
                                <div className="border-t" style={{ borderColor: '#EEF0F4' }} />
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Address</p>
                                        <p className="text-base font-semibold text-gray-900 mt-1">
                                                {formatAddress(profile?.address)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Join Date</p>
                                        <p className="text-base font-semibold text-gray-900 mt-1">
                                            {profile?.join_date ? new Date(profile.join_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
}

export default EmployeeDashboard;