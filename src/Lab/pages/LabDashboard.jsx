import AuthImage from "../../components/AuthImage";
import React, { useState, useEffect } from "react";
import LabSidebar from "../components/LabSidebar";
import { useNavigate } from "react-router-dom";
import { Menu, ClipboardList, Clock, CheckCircle, Plus, Search, FileText, FlaskConical, CreditCard, User, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getLabDashboardStatsApi, fetchLabRequestsApi, updateLabPaymentStatusApi } from "../../services/LabAllApi";
import { BASE_URL } from "../../services/baseURL";

export default function LabDashboard() {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [stats, setStats] = useState({
        pending: { total: 0, High: 0, Medium: 0, Low: 0 },
        inProcess: { total: 0, High: 0, Medium: 0, Low: 0 },
        completedRequests: 0
    });
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Image Preview State
    const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
    const [viewImageUrl, setViewImageUrl] = useState(null);

    const getImageUrl = (path) => {
        if (!path) return "";
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;

        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        if (finalPath.startsWith('uploads/') || finalPath.startsWith('Uploads/')) {
            // Already includes uploads/, do not prepend
        } else {
            finalPath = `uploads/${finalPath}`;
        }

        return `${BASE_URL}/${finalPath}`;
    };

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    useEffect(() => {
        fetchRequests();
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const statsResult = await getLabDashboardStatsApi();
            if (statsResult.status === 200) {
                setStats(statsResult.data.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    }

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Fetch only Pending requests, page 1, limit 6 for dashboard
            const requestsResult = await fetchLabRequestsApi("Pending", 1, 6, "");
            if (requestsResult.status === 200) {
                setRequests(requestsResult.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            {/* Sidebar */}
            <LabSidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={toggleSidebar}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Main Content Area */}
            <main
                className={`flex-1 min-h-screen transition-all duration-300 ease-in-out p-6 lg:p-10
            ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
        `}
            >
                {/* Mobile Header */}
                <div className="lg:hidden mb-6 flex justify-between items-center">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-lg bg-slate-900 text-white shadow-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Shifa Clinic</h1>
                    <div className="w-10"></div>
                </div>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Lab Dashboard</h1>
                        <p className="text-gray-500 mt-1">Manage lab requests and reports</p>
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Pending Requests */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-gray-500 text-sm font-medium">Pending Requests</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.pending?.total || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                                <Clock size={20} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-gray-50">
                            <div className="text-center">
                                <span className="block text-xs font-bold text-red-600 bg-red-50 rounded py-0.5">High</span>
                                <span className="text-sm font-bold text-slate-700">{stats.pending?.High || 0}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-bold text-amber-600 bg-amber-50 rounded py-0.5">Med</span>
                                <span className="text-sm font-bold text-slate-700">{stats.pending?.Medium || 0}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-bold text-blue-600 bg-blue-50 rounded py-0.5">Low</span>
                                <span className="text-sm font-bold text-slate-700">{stats.pending?.Low || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* In Process Requests */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-gray-500 text-sm font-medium">In Process</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.inProcess?.total || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                                <FlaskConical size={20} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-gray-50">
                            <div className="text-center">
                                <span className="block text-xs font-bold text-red-600 bg-red-50 rounded py-0.5">High</span>
                                <span className="text-sm font-bold text-slate-700">{stats.inProcess?.High || 0}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-bold text-amber-600 bg-amber-50 rounded py-0.5">Med</span>
                                <span className="text-sm font-bold text-slate-700">{stats.inProcess?.Medium || 0}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-bold text-blue-600 bg-blue-50 rounded py-0.5">Low</span>
                                <span className="text-sm font-bold text-slate-700">{stats.inProcess?.Low || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Requests Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex flex-col items-start justify-center">
                            <h3 className="font-semibold text-xl text-slate-900">Pending Lab Requests</h3>
                            <p className="text-sm text-gray-400">Manage pending tests</p>
                        </div>

                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                className="pl-9 pr-4 py-2 w-full md:w-64 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6]"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 text-left">
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Referred By</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-[#14B8A6] shrink-0 border border-teal-100 overflow-hidden cursor-pointer"
                                                onClick={() => {
                                                    if (req.profilePhoto) {
                                                        setViewImageUrl(getImageUrl(req.profilePhoto));
                                                        setShowImagePreviewModal(true);
                                                    }
                                                }}
                                            >
                                                {req.profilePhoto ? (
                                                    <AuthImage
                                                        src={getImageUrl(req.profilePhoto)}
                                                        alt={req.patientName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User size={20} />
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-bold text-slate-900 text-base">{req.patientName}</span>
                                                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100/50 uppercase tracking-wide">
                                                        #{req.patientId || req.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                {req.paymentStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {req.referredBy}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {req.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {req.priority}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {requests.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No pending requests found.
                            </div>
                        )}
                    </div>
                </div>
            </main>
            {/* Image Preview Modal */}
            {showImagePreviewModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowImagePreviewModal(false)}>
                    <div className="relative animate-in zoom-in-50 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white shadow-2xl relative">
                            <AuthImage
                                src={viewImageUrl}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            onClick={() => setShowImagePreviewModal(false)}
                            className="absolute top-0 right-0 bg-white/90 hover:bg-white text-slate-900 rounded-full p-2 shadow-lg transition-colors transform translate-x-1/4 -translate-y-1/4"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
