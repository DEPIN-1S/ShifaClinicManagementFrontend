import AuthImage from "../../components/AuthImage";
import React, { useState, useEffect } from "react";
import LabSidebar from "../components/LabSidebar";
import { useNavigate } from "react-router-dom";
import { Menu, Search, FileText, FlaskConical, Clock, ChevronRight, User, Stethoscope, Calendar, CreditCard, X, ChevronLeft, CheckCircle } from "lucide-react";
import { fetchLabRequestsApi, updateLabPaymentStatusApi } from "../../services/LabAllApi";
import { BASE_URL } from "../../services/baseURL";

export default function DoctorReferrals() {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Tabs State
    const [activeTab, setActiveTab] = useState("Pending");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

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

    const fetchReferrals = async () => {
        setLoading(true);
        try {
            const result = await fetchLabRequestsApi(activeTab, page, limit, searchQuery);
            if (result.status === 200) {
                setReferrals(result.data.data || []);
                setTotalPages(result.data.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching referrals:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReferrals();
    }, [activeTab, page, searchQuery]);



    const handleProcessReferral = (ref) => {
        navigate(`/lab/process-referral/${ref.id}`, { state: { referral: ref } });
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
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Stethoscope className="text-[#14B8A6]" size={32} />
                            Doctor Referrals
                        </h1>
                        <p className="text-gray-500 mt-1">Receive and manage tests referred by clinical staff</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 p-2 mb-8 shadow-sm flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search with name or phone number"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 text-gray-700 placeholder-gray-400 border-none"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
                    <button
                        onClick={() => { setActiveTab("Pending"); setPage(1); }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap
                        ${activeTab === "Pending"
                                ? "bg-white text-slate-900 shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-slate-700"}`}
                    >
                        <Clock size={16} className={activeTab === "Pending" ? "text-slate-900" : ""} />
                        Pending
                    </button>
                    <button
                        onClick={() => { setActiveTab("In Progress"); setPage(1); }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap
                        ${activeTab === "In Progress"
                                ? "bg-white text-slate-900 shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-slate-700"}`}
                    >
                        <FlaskConical size={16} className={activeTab === "In Progress" ? "text-slate-900" : ""} />
                        In Progress
                    </button>
                    <button
                        onClick={() => { setActiveTab("Completed"); setPage(1); }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap
                        ${activeTab === "Completed"
                                ? "bg-white text-slate-900 shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-slate-700"}`}
                    >
                        <CheckCircle size={16} className={activeTab === "Completed" ? "text-slate-900" : ""} />
                        Completed
                    </button>
                </div>

                {/* Referrals List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]"></div>
                        </div>
                    ) : referrals.length > 0 ? (
                        referrals.map((ref) => (
                            <div key={ref.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-[#14B8A6] shrink-0 border border-teal-100 overflow-hidden cursor-pointer"
                                        onClick={() => {
                                            if (ref.profilePhoto) {
                                                setViewImageUrl(getImageUrl(ref.profilePhoto));
                                                setShowImagePreviewModal(true);
                                            }
                                        }}
                                    >
                                        {ref.profilePhoto ? (
                                            <AuthImage
                                                src={getImageUrl(ref.profilePhoto)}
                                                alt={ref.patientName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User size={24} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                            {ref.patientName}
                                            {ref.isCardiodiabetic && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200">
                                                    CD
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100/50">
                                                #{ref.patientId || ref.id}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                <Clock size={12} />
                                                {ref.date || 'Today'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 px-0 md:px-8">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                        <CreditCard size={16} className="text-amber-500" />
                                        <span className="font-medium">Payment:</span>

                                        <span className={`text-[10px] font-bold uppercase ${ref.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {ref.paymentStatus || 'Pending'}
                                            {ref.paymentStatus === 'Paid' && ref.labAmount > 0 && <span className="ml-1 text-xs">({`₹${ref.labAmount}`})</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Stethoscope size={16} className="text-[#14B8A6]" />
                                        <span>Referred by:</span>
                                        <span className="font-medium text-slate-800">{ref.referredBy}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${(!ref.status || ref.status === 'Pending')
                                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                                        : ref.status === 'In Progress'
                                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                                            : ref.status === 'Completed'
                                                ? 'bg-teal-50 text-teal-700 border-teal-100'
                                                : 'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                        {ref.status || 'Pending'}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ref.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                        {ref.priority || 'Normal'}
                                    </span>
                                    <button
                                        onClick={() => handleProcessReferral(ref)}
                                        className="bg-[#14B8A6] text-white p-2.5 rounded-xl hover:bg-teal-600 transition-colors shadow-lg shadow-teal-900/10 active:scale-95 group-hover:scale-105"
                                        title="Process Referral"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
                            <FlaskConical size={48} className="mx-auto mb-4 opacity-20" />No doctor referrals found
                            <p className="text-lg"></p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && referrals.length > 0 && (
                    <div className="flex items-center justify-between mt-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-sm text-gray-500">
                            Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className={`p-2 rounded-lg border border-gray-200 transition-colors
                                            ${page === 1
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#14B8A6]'}`}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                                className={`p-2 rounded-lg border border-gray-200 transition-colors
                                            ${page === totalPages
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#14B8A6]'}`}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
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
            </main>
        </div >
    );
}
