import React from 'react';

function EmployeeProfile({ profile, userName }) {
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

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8" style={{ border: '1px solid #EEF0F4' }}>
                <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A6E 100%)' }}>
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(30%, -50%)' }} />
                </div>
                <div className="relative px-8 pb-6 pt-14">
                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 -mt-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg shrink-0" style={{ background: '#1A3A6E' }}>
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="pt-4 flex-1">
                            <h3 className="text-2xl font-bold text-gray-900">{profile?.name || '—'}</h3>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #EEF0F4' }}>
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
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

                <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #EEF0F4' }}>
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
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
                                <p className="text-base font-semibold text-gray-900 mt-1">{formatAddress(profile?.address)}</p>
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
        </>
    );
}

export default EmployeeProfile;