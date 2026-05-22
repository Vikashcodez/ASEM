import React, { useState } from 'react';
import AddEmployee from '../components/AddEmployee';
import EmployeeList from '../components/EmployeeList';

function AdminDashboard({ handleLogout }) {
    const [activeTab, setActiveTab] = useState('add');
    const userName = localStorage.getItem('userName');

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                            <div className="ml-10 flex space-x-4">
                                <button
                                    onClick={() => setActiveTab('add')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        activeTab === 'add'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Add Employee
                                </button>
                                <button
                                    onClick={() => setActiveTab('list')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        activeTab === 'list'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Employee List
                                </button>
                            </div>
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

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {activeTab === 'add' && <AddEmployee />}
                {activeTab === 'list' && <EmployeeList />}
            </div>
        </div>
    );
}

export default AdminDashboard;