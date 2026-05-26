import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
	AlertTriangle,
	Ambulance,
	ArrowUpRight,
	BarChart3,
	Calendar,
	CheckCircle,
	Clock3,
	Flame,
	Loader,
	MapPin,
	RefreshCw,
	Shield,
	Wrench,
	Users,
	Building2,
	Layers,
	Activity,
	PieChart,
	TrendingUp,
	CircleDot
} from 'lucide-react';

const incidentsApi = `${import.meta.env.VITE_API_URL}/incidents`;

const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const severityMeta = {
	CRITICAL: { label: 'Critical', color: '#991B1B', soft: 'bg-red-50 text-red-700 border-red-100' },
	HIGH: { label: 'High', color: '#EA580C', soft: 'bg-orange-50 text-orange-700 border-orange-100' },
	MEDIUM: { label: 'Medium', color: '#D97706', soft: 'bg-amber-50 text-amber-700 border-amber-100' },
	LOW: { label: 'Low', color: '#15803D', soft: 'bg-green-50 text-green-700 border-green-100' }
};

const statusMeta = {
	OPEN: { label: 'Open', color: '#DC2626', soft: 'bg-red-50 text-red-700 border-red-100' },
	IN_PROGRESS: { label: 'In Progress', color: '#D97706', soft: 'bg-amber-50 text-amber-700 border-amber-100' },
	RESOLVED: { label: 'Resolved', color: '#2563EB', soft: 'bg-blue-50 text-blue-700 border-blue-100' },
	CLOSED: { label: 'Closed', color: '#16A34A', soft: 'bg-green-50 text-green-700 border-green-100' }
};

const typeMeta = {
	FIRE: { label: 'Fire', icon: Flame, color: '#DC2626' },
	MEDICAL: { label: 'Medical', icon: Ambulance, color: '#2563EB' },
	SECURITY: { label: 'Security', icon: Shield, color: '#7C3AED' },
	MAINTENANCE: { label: 'Maintenance', icon: Wrench, color: '#D97706' },
	SAFETY: { label: 'Safety', icon: AlertTriangle, color: '#0F766E' },
	OTHER: { label: 'Other', icon: CircleDot, color: '#475569' }
};

const PAGE_SIZE = 50;

function formatDate(dateValue) {
	if (!dateValue) return '-';
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) return '-';
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

function formatDateTime(dateValue) {
	if (!dateValue) return '-';
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) return '-';
	return date.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

function toDateKey(dateValue) {
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) return '';
	return date.toISOString().slice(0, 10);
}

function getStatusLabel(status) {
	return statusMeta[status]?.label || status || 'Unknown';
}

function getSeverityLabel(severity) {
	return severityMeta[severity]?.label || severity || 'Unknown';
}

function IncidentDashboard() {
	const { token } = useAuth();
	const [reports, setReports] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState('');
	const [lastSyncedAt, setLastSyncedAt] = useState(null);

	const getAuthConfig = () => (
		token ? { headers: { Authorization: `Bearer ${token}` } } : {}
	);

	const fetchAllReports = async () => {
		const firstResponse = await axios.get(`${incidentsApi}/reports`, {
			...getAuthConfig(),
			params: { page: 1, limit: PAGE_SIZE }
		});

		const firstPageData = firstResponse.data?.data || [];
		const pagination = firstResponse.data?.pagination || {};
		const totalPages = pagination.totalPages || 1;

		if (totalPages <= 1) {
			return firstPageData;
		}

		const requests = [];
		for (let page = 2; page <= totalPages; page += 1) {
			requests.push(
				axios.get(`${incidentsApi}/reports`, {
					...getAuthConfig(),
					params: { page, limit: PAGE_SIZE }
				})
			);
		}

		const remainingResponses = await Promise.all(requests);
		const remainingData = remainingResponses.flatMap((response) => response.data?.data || []);

		return [...firstPageData, ...remainingData];
	};

	const loadReports = async ({ silent = false } = {}) => {
		try {
			if (!silent) setLoading(true);
			setRefreshing(true);
			setError('');
			const data = await fetchAllReports();
			setReports(data);
			setLastSyncedAt(new Date());
		} catch (err) {
			setError(err.response?.data?.message || 'Unable to load incident reports right now.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		loadReports();
	}, []);

	const sortedReports = [...reports].sort((left, right) => new Date(right.created_at) - new Date(left.created_at));
	const totalIncidents = sortedReports.length;
	const openIncidents = sortedReports.filter((incident) => incident.incident_status === 'OPEN').length;
	const activeIncidents = sortedReports.filter((incident) => ['OPEN', 'IN_PROGRESS'].includes(incident.incident_status)).length;
	const resolvedIncidents = sortedReports.filter((incident) => incident.incident_status === 'RESOLVED').length;
	const closedIncidents = sortedReports.filter((incident) => incident.incident_status === 'CLOSED').length;
	const criticalIncidents = sortedReports.filter((incident) => incident.severity_level === 'CRITICAL').length;
	const highIncidents = sortedReports.filter((incident) => incident.severity_level === 'HIGH').length;
	const totalPeople = sortedReports.reduce((sum, incident) => sum + (Number(incident.total_people) || 0), 0);
	const uniqueRooms = new Set(sortedReports.map((incident) => incident.room_id).filter(Boolean)).size;
	const averagePeople = totalIncidents ? (totalPeople / totalIncidents).toFixed(1) : '0.0';
	const completionRate = totalIncidents ? Math.round((closedIncidents / totalIncidents) * 100) : 0;

	const severityBreakdown = severityOrder.map((severity) => ({
		severity,
		count: sortedReports.filter((incident) => incident.severity_level === severity).length,
		...severityMeta[severity]
	}));

	const statusBreakdown = Object.keys(statusMeta).map((status) => ({
		status,
		count: sortedReports.filter((incident) => incident.incident_status === status).length,
		...statusMeta[status]
	}));

	const incidentTypeBreakdown = Object.entries(typeMeta).map(([type, meta]) => ({
		type,
		count: sortedReports.filter((incident) => incident.incident_type === type).length,
		...meta
	})).filter((entry) => entry.count > 0);

	const last7Days = Array.from({ length: 7 }, (_, index) => {
		const date = new Date();
		date.setDate(date.getDate() - (6 - index));
		const key = toDateKey(date);
		const count = sortedReports.filter((incident) => toDateKey(incident.created_at) === key).length;
		return {
			label: date.toLocaleDateString('en-US', { weekday: 'short' }),
			key,
			count
		};
	});

	const maxTrend = Math.max(...last7Days.map((item) => item.count), 1);

	const linePoints = last7Days
		.map((item, index) => {
			const x = (index / (last7Days.length - 1 || 1)) * 100;
			const y = 40 - ((item.count / maxTrend) * 28);
			return `${x},${y}`;
		})
		.join(' ');

	const areaPath = `M 0 40 ${last7Days
		.map((item, index) => {
			const x = (index / (last7Days.length - 1 || 1)) * 100;
			const y = 40 - ((item.count / maxTrend) * 28);
			return `L ${x} ${y}`;
		})
		.join(' ')} L 100 40 Z`;

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-6">
				<div className="rounded-3xl border border-slate-200 bg-white/90 px-8 py-10 shadow-xl shadow-slate-200/60 backdrop-blur">
					<div className="flex flex-col items-center gap-4 text-center">
						<Loader className="h-9 w-9 animate-spin text-[#0B1D3A]" />
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Incident Intelligence</p>
							<h2 className="mt-2 text-xl font-bold text-slate-900">Loading reports dashboard</h2>
							<p className="mt-1 text-sm text-slate-500">Preparing incident trends, severity mix, and recent activity.</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF2F7_100%)] text-slate-900">
			<div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
				<section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_32%),linear-gradient(135deg,#091A33_0%,#10284F_45%,#16396D_100%)] px-6 py-7 text-white shadow-[0_24px_80px_rgba(9,26,51,0.28)] sm:px-8 lg:px-10">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div className="max-w-3xl">
							<div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
								<Activity className="h-3.5 w-3.5" />
								Live Incident Reports
							</div>
							<h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
								Incident command center for airport operations
							</h1>
							<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
								Monitor incident volume, severity shifts, and closure momentum from a single high-clarity dashboard.
							</p>
							<div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-100/90">
								<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
									<Calendar className="h-4 w-4" />
									{lastSyncedAt ? `Updated ${formatDateTime(lastSyncedAt)}` : 'Waiting for sync'}
								</span>
								<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
									<Users className="h-4 w-4" />
									{totalPeople} people affected
								</span>
								<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
									<Building2 className="h-4 w-4" />
									{uniqueRooms} rooms involved
								</span>
							</div>
						</div>

						<button
							type="button"
							onClick={() => loadReports({ silent: true })}
							disabled={refreshing}
							className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
						>
							<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
							Refresh data
						</button>
					</div>
				</section>

				{error && (
					<div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
						{error}
					</div>
				)}

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{[
						{ label: 'Total incidents', value: totalIncidents, icon: AlertTriangle, tone: 'from-[#0B1D3A] to-[#16396D]' },
						{ label: 'Active cases', value: activeIncidents, icon: TrendingUp, tone: 'from-amber-500 to-orange-600' },
						{ label: 'Closed cases', value: closedIncidents, icon: CheckCircle, tone: 'from-emerald-500 to-green-600' },
						{ label: 'Avg. people affected', value: averagePeople, icon: Users, tone: 'from-sky-500 to-blue-600' }
					].map((item) => {
						const Icon = item.icon;
						return (
							<article key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-sm font-medium text-slate-500">{item.label}</p>
										<h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{item.value}</h3>
									</div>
									<div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-lg shadow-slate-300/50`}>
										<Icon className="h-5 w-5" />
									</div>
								</div>
							</article>
						);
					})}
				</section>

				<section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
					<article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Momentum</p>
								<h2 className="mt-2 text-2xl font-bold text-slate-900">Incident trend over the last 7 days</h2>
							</div>
							<div className="rounded-2xl bg-slate-50 px-4 py-2 text-right">
								<p className="text-xs uppercase tracking-[0.2em] text-slate-400">Closure rate</p>
								<p className="text-2xl font-black text-slate-900">{completionRate}%</p>
							</div>
						</div>

						<div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(180deg,#F8FBFF_0%,#EEF4FF_100%)] p-5">
							<div className="flex h-56 items-end gap-3">
								<div className="flex h-full flex-1 items-end">
									<svg viewBox="0 0 100 44" className="h-full w-full overflow-visible">
										<defs>
											<linearGradient id="incidentArea" x1="0" x2="0" y1="0" y2="1">
												<stop offset="0%" stopColor="#1A3A6E" stopOpacity="0.28" />
												<stop offset="100%" stopColor="#1A3A6E" stopOpacity="0.02" />
											</linearGradient>
											<linearGradient id="incidentLine" x1="0" x2="1" y1="0" y2="0">
												<stop offset="0%" stopColor="#0B1D3A" />
												<stop offset="100%" stopColor="#2563EB" />
											</linearGradient>
										</defs>
										<path d={areaPath} fill="url(#incidentArea)" />
										<polyline
											points={linePoints}
											fill="none"
											stroke="url(#incidentLine)"
											strokeWidth="2.8"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										{last7Days.map((item, index) => {
											const x = (index / (last7Days.length - 1 || 1)) * 100;
											const y = 40 - ((item.count / maxTrend) * 28);
											return <circle key={item.key} cx={x} cy={y} r="1.9" fill="#0B1D3A" />;
										})}
									</svg>
								</div>
							</div>

							<div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
								{last7Days.map((item) => (
									<div key={item.key} className="rounded-xl bg-white/70 px-2 py-2 shadow-sm">
										<p className="font-semibold text-slate-700">{item.label}</p>
										<p className="mt-1 text-slate-500">{item.count}</p>
									</div>
								))}
							</div>
						</div>

						<div className="mt-6 grid gap-4 md:grid-cols-3">
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Open</p>
								<p className="mt-2 text-2xl font-black text-slate-900">{openIncidents}</p>
								<p className="mt-1 text-sm text-slate-500">Awaiting action</p>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Resolved</p>
								<p className="mt-2 text-2xl font-black text-slate-900">{resolvedIncidents}</p>
								<p className="mt-1 text-sm text-slate-500">Actions completed</p>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Critical</p>
								<p className="mt-2 text-2xl font-black text-slate-900">{criticalIncidents}</p>
								<p className="mt-1 text-sm text-slate-500">Highest priority</p>
							</div>
						</div>
					</article>

					<article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Severity mix</p>
								<h2 className="mt-2 text-2xl font-bold text-slate-900">Operational risk distribution</h2>
							</div>
							<div className="rounded-2xl bg-slate-50 p-3 text-slate-500">
								<PieChart className="h-5 w-5" />
							</div>
						</div>

						<div className="mt-6 flex items-center justify-center">
							<div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-[conic-gradient(#991B1B_0%_18%,#EA580C_18%_46%,#D97706_46%_74%,#15803D_74%_100%)] p-4 shadow-inner">
								<div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
									<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Total</p>
									<p className="text-3xl font-black text-slate-900">{totalIncidents}</p>
								</div>
							</div>
						</div>

						<div className="mt-6 space-y-4">
							{severityBreakdown.map((item) => {
								const percentage = totalIncidents ? (item.count / totalIncidents) * 100 : 0;
								return (
									<div key={item.severity}>
										<div className="mb-2 flex items-center justify-between text-sm">
											<span className="font-semibold text-slate-700">{item.label}</span>
											<span className="text-slate-500">{item.count}</span>
										</div>
										<div className="h-2 overflow-hidden rounded-full bg-slate-100">
											<div
												className="h-full rounded-full transition-all duration-500"
												style={{ width: `${percentage}%`, backgroundColor: item.color }}
											/>
										</div>
									</div>
								);
							})}
						</div>

						<div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
								<BarChart3 className="h-4 w-4 text-slate-500" />
								Completion snapshot
							</div>
							<div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
								<div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-[#0B1D3A]" style={{ width: `${completionRate}%` }} />
							</div>
							<p className="mt-2 text-xs text-slate-500">Closed incidents: {closedIncidents} of {totalIncidents}</p>
						</div>
					</article>
				</section>

				<section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
					<article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Incident types</p>
								<h2 className="mt-2 text-2xl font-bold text-slate-900">What is being reported most often</h2>
							</div>
							<div className="rounded-2xl bg-slate-50 p-3 text-slate-500">
								<ArrowUpRight className="h-5 w-5" />
							</div>
						</div>

						<div className="mt-6 space-y-4">
							{incidentTypeBreakdown.length > 0 ? (
								incidentTypeBreakdown.map((item) => {
									const Icon = item.icon;
									const percentage = totalIncidents ? (item.count / totalIncidents) * 100 : 0;
									return (
										<div key={item.type} className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-sm">
											<div className="flex items-center justify-between gap-4">
												<div className="flex items-center gap-3">
													<div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: item.color }}>
														<Icon className="h-5 w-5" />
													</div>
													<div>
														<p className="font-semibold text-slate-900">{item.label}</p>
														<p className="text-sm text-slate-500">{item.count} reports</p>
													</div>
												</div>
												<p className="text-sm font-semibold text-slate-700">{percentage.toFixed(0)}%</p>
											</div>
											<div className="mt-4 h-2 rounded-full bg-slate-100">
												<div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
											</div>
										</div>
									);
								})
							) : (
								<div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
									No incident type data available yet.
								</div>
							)}
						</div>
					</article>

					<article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Status review</p>
								<h2 className="mt-2 text-2xl font-bold text-slate-900">Incident resolution flow</h2>
							</div>
							<div className="rounded-2xl bg-slate-50 p-3 text-slate-500">
								<Clock3 className="h-5 w-5" />
							</div>
						</div>

						<div className="mt-6 space-y-4">
							{statusBreakdown.map((item) => {
								const percentage = totalIncidents ? (item.count / totalIncidents) * 100 : 0;
								return (
									<div key={item.status} className={`rounded-2xl border p-4 ${item.soft}`}>
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-sm font-semibold">{item.label}</p>
												<p className="text-xs opacity-80">{item.count} incidents</p>
											</div>
											<span className="text-2xl font-black">{percentage.toFixed(0)}%</span>
										</div>
										<div className="mt-4 h-2 rounded-full bg-white/70">
											<div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
										</div>
									</div>
								);
							})}
						</div>

						<div className="mt-6 grid grid-cols-2 gap-4">
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Critical alerts</p>
								<p className="mt-2 text-2xl font-black text-slate-900">{criticalIncidents + highIncidents}</p>
								<p className="mt-1 text-sm text-slate-500">Requires attention</p>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Total people</p>
								<p className="mt-2 text-2xl font-black text-slate-900">{totalPeople}</p>
								<p className="mt-1 text-sm text-slate-500">Across all reports</p>
							</div>
						</div>
					</article>
				</section>

				<section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Recent reports</p>
							<h2 className="mt-2 text-2xl font-bold text-slate-900">Latest incidents from the floor</h2>
						</div>
						<p className="text-sm text-slate-500">Showing the most recent operational entries</p>
					</div>

					<div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
						<div className="grid grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
							<div className="col-span-4 sm:col-span-3">Incident</div>
							<div className="col-span-4 sm:col-span-3">Location</div>
							<div className="col-span-2">Severity</div>
							<div className="col-span-2">Status</div>
							<div className="col-span-2 hidden sm:block">Reported</div>
						</div>

						<div className="divide-y divide-slate-200 bg-white">
							{sortedReports.slice(0, 6).map((incident) => {
								const type = typeMeta[incident.incident_type] || typeMeta.OTHER;
								const TypeIcon = type.icon;
								return (
									<div key={incident.id} className="grid grid-cols-12 gap-4 px-4 py-4 text-sm hover:bg-slate-50/70">
										<div className="col-span-4 sm:col-span-3">
											<div className="flex items-start gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: type.color }}>
													<TypeIcon className="h-4 w-4" />
												</div>
												<div className="min-w-0">
													<p className="font-semibold text-slate-900">{incident.incident_title || 'Untitled incident'}</p>
													<p className="mt-1 truncate text-xs text-slate-500">{incident.incident_code}</p>
												</div>
											</div>
										</div>

										<div className="col-span-4 sm:col-span-3">
											<p className="font-medium text-slate-800">{incident.room_details?.room_name || 'Unknown room'}</p>
											<div className="mt-1 space-y-1 text-xs text-slate-500">
												<p className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {incident.room_details?.terminal_name || '-'}</p>
												<p className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> {incident.room_details?.block_name || '-'}</p>
												{incident.location_details && (
													<p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {incident.location_details}</p>
												)}
											</div>
										</div>

										<div className="col-span-2">
											<span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: severityMeta[incident.severity_level]?.color || '#CBD5E1', color: severityMeta[incident.severity_level]?.color || '#334155', background: '#fff' }}>
												{getSeverityLabel(incident.severity_level)}
											</span>
										</div>

										<div className="col-span-2">
											<span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: statusMeta[incident.incident_status]?.color || '#CBD5E1', color: statusMeta[incident.incident_status]?.color || '#334155', background: '#fff' }}>
												{getStatusLabel(incident.incident_status)}
											</span>
										</div>

										<div className="col-span-2 hidden sm:block">
											<p className="font-medium text-slate-800">{formatDate(incident.created_at)}</p>
											<p className="mt-1 text-xs text-slate-500">By {incident.reported_by_details?.employee_name || 'system'}</p>
										</div>
									</div>
								);
							})}

							{sortedReports.length === 0 && (
								<div className="px-6 py-12 text-center text-sm text-slate-500">
									No incident reports available yet.
								</div>
							)}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

export default IncidentDashboard;
