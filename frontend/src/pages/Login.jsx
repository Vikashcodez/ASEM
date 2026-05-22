import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: '#F8F9FC' }}>

            {/* Left Panel — Branding */}
            <div
                className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
                style={{
                    background: 'linear-gradient(145deg, #0B1D3A 0%, #132D5E 40%, #1A3A6E 100%)'
                }}
            >
                {/* Geometric decorations */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-[0.03]"
                    style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(-20%, 20%)' }} />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }} />

                {/* Top — Logo area */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.7 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
                            </svg>
                        </div>
                        <span className="text-white/70 text-sm font-medium tracking-wider uppercase">AES Platform</span>
                    </div>
                </div>

                {/* Center — Hero content */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            Emergency Response System
                        </div>
                        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                            Airport<br />
                            Emergency<br />
                            <span style={{ color: '#93B5FF' }}>System</span>
                        </h1>
                    </div>
                    <p className="text-base leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Real-time incident management, rapid response coordination, and comprehensive emergency oversight for airport operations.
                    </p>

                    {/* Stats */}
                    <div className="flex gap-10 pt-2">
                        <div>
                            <div className="text-2xl font-bold text-white">24/7</div>
                            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Active Monitoring</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">&lt;3s</div>
                            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Alert Dispatch</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">100%</div>
                            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Uptime SLA</div>
                        </div>
                    </div>
                </div>

                {/* Bottom — Security badge */}
                <div className="relative z-10 flex items-center gap-3 pt-8"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Secured with end-to-end encryption · SOC 2 Compliant
                    </span>
                </div>
            </div>

            {/* Right Panel — Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-[420px]">

                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: '#0B1D3A' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.7 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
                            </svg>
                        </div>
                        <span className="font-semibold text-gray-800">Airport Emergency System</span>
                    </div>

                    {/* Header */}
                    <div className="mb-9">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
                        <p className="text-gray-400 mt-2 text-sm">Enter your credentials to access the dashboard</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-6"
                            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-red-800">Authentication Failed</p>
                                <p className="text-xs text-red-600 mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center"
                                    style={{
                                        borderRight: focusedField === 'email' ? '1px solid #0B1D3A' : '1px solid #E5E7EB',
                                        borderRadius: '10px 0 0 10px',
                                        background: focusedField === 'email' ? '#F0F4FF' : '#FAFAFA',
                                        transition: 'all 0.2s ease'
                                    }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                        stroke={focusedField === 'email' ? '#0B1D3A' : '#9CA3AF'}
                                        strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full h-12 pl-12 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200"
                                    style={{
                                        background: focusedField === 'email' ? '#F0F4FF' : '#FAFAFA',
                                        border: focusedField === 'email' ? '1.5px solid #0B1D3A' : '1.5px solid #E5E7EB',
                                        borderRadius: '10px',
                                        boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(11,29,58,0.06)' : 'none'
                                    }}
                                    required
                                    placeholder="name@airport.gov"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center"
                                    style={{
                                        borderRight: focusedField === 'password' ? '1px solid #0B1D3A' : '1px solid #E5E7EB',
                                        borderRadius: '10px 0 0 10px',
                                        background: focusedField === 'password' ? '#F0F4FF' : '#FAFAFA',
                                        transition: 'all 0.2s ease'
                                    }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                        stroke={focusedField === 'password' ? '#0B1D3A' : '#9CA3AF'}
                                        strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full h-12 pl-12 pr-12 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200"
                                    style={{
                                        background: focusedField === 'password' ? '#F0F4FF' : '#FAFAFA',
                                        border: focusedField === 'password' ? '1.5px solid #0B1D3A' : '1.5px solid #E5E7EB',
                                        borderRadius: '10px',
                                        boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(11,29,58,0.06)' : 'none'
                                    }}
                                    required
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-4.5 h-4.5 rounded border-2 border-gray-300 peer-checked:border-[#0B1D3A] peer-checked:bg-[#0B1D3A] transition-all duration-200 flex items-center justify-center"
                                        style={{ width: '18px', height: '18px' }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Remember me</span>
                            </label>
                            <button type="button" className="text-sm font-medium text-[#0B1D3A] hover:text-[#1A3A6E] transition-colors">
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl text-white text-sm font-semibold tracking-wide transition-all duration-200 relative overflow-hidden"
                            style={{
                                background: loading ? '#94A3B8' : '#0B1D3A',
                                boxShadow: loading ? 'none' : '0 4px 14px rgba(11,29,58,0.25)'
                            }}
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#132D5E'; }}
                            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#0B1D3A'; }}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2.5">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3"/>
                                        <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                                    </svg>
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <span>Sign In</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                    </svg>
                                </div>
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    {/* <div className="mt-8 p-4 rounded-xl" style={{ background: '#F8F9FC', border: '1px solid #EEF0F4' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Demo Credentials</span>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Email</span>
                                <code className="text-gray-700 font-mono text-xs bg-white px-2 py-0.5 rounded border border-gray-200">admin@company.com</code>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Password</span>
                                <code className="text-gray-700 font-mono text-xs bg-white px-2 py-0.5 rounded border border-gray-200">Admin@123456</code>
                            </div>
                        </div>
                    </div> */}

                    {/* Footer */}
                    <p className="text-center text-xs text-gray-300 mt-8">
                        &copy; {new Date().getFullYear()} Airport Emergency System · Authorized access only
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;