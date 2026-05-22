import React, { useState } from 'react';
import AddEmployee from '../components/AddEmployee';
import EmployeeList from '../components/EmployeeList';
import Roles from '../components/Roles';

function AdminDashboard({ handleLogout }) {
    const [activeTab, setActiveTab] = useState('add');
    const userName = localStorage.getItem('userName') || 'Admin';
    const userRole = localStorage.getItem('userRole') || 'Administrator';

    const navItems = [
        {
            id: 'add',
            label: 'Add Employee',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
            )
        },
        {
            id: 'list',
            label: 'Employee Directory',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                    <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
            )
        },
        {
            id: 'roles',
            label: 'Roles',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l7 4v6c0 5-3.5 9.74-7 10-3.5-.26-7-5-7-10V6l7-4z" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
            )
        }
    ];

    return (
        <div className="flex min-h-screen" style={{ background: '#F8F9FC' }}>
            
            {/* Sidebar */}
            <aside className="w-72 flex flex-col fixed h-full" style={{ background: '#0B1D3A' }}>
                
                {/* Sidebar Header - Logo */}
                <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.7 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-sm tracking-wide">AES Platform</h1>
                        <p className="text-[11px] font-medium tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Admin Portal</p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="px-3 pt-2 pb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Workforce Management
                    </p>
                    
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
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
                            {/* Active Indicator */}
                            {activeTab === item.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-white" />
                            )}
                            <span className="relative z-10">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Sidebar Footer - User Profile & Logout */}
                <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#1A3A6E' }}>
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{userName}</p>
                            <p className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{userRole}</p>
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
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                            {activeTab === 'add' ? 'Add New Employee' : activeTab === 'list' ? 'Employee Directory' : 'Roles'}
                        </h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {activeTab === 'add'
                                ? 'Fill in the details to register new personnel'
                                : activeTab === 'list'
                                    ? 'View and manage all registered personnel'
                                    : 'View the roles available in the system'}
                        </p>
                    </div>
                    
                    {/* Right side of header - Date/Breadcrumb */}
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
                    <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #EEF0F4' }}>
                        {activeTab === 'add' && <AddEmployee />}
                        {activeTab === 'list' && <EmployeeList />}
                        {activeTab === 'roles' && <Roles />}
                    </div>
                </div>

            </main>
        </div>
    );
}

export default AdminDashboard;