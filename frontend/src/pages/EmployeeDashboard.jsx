import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function EmployeeDashboard({ handleLogout }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token, user } = useAuth();
    const userName = user?.name || 'Employee';

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
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-800">Employee Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {userName}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-6">My Profile</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <p className="mt-1 text-lg text-gray-900">{profile?.name}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="mt-1 text-lg text-gray-900">{profile?.email}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Position</label>
                            <p className="mt-1 text-lg text-gray-900">{profile?.position || 'Not specified'}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <p className="mt-1 text-lg text-gray-900">{profile?.department || 'Not specified'}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Salary</label>
                            <p className="mt-1 text-lg text-gray-900">
                                {profile?.salary ? `$${profile.salary}` : 'Not specified'}
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Join Date</label>
                            <p className="mt-1 text-lg text-gray-900">
                                {profile?.join_date ? new Date(profile.join_date).toLocaleDateString() : 'Not specified'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmployeeDashboard;