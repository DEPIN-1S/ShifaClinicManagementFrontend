import AuthImage, { AuthenticatedMedia } from "../../components/AuthImage";
import React, { useState, useEffect } from 'react';
import PharmacistSidebar from '../components/PharmacistSidebar';
import { Menu, Zap, Plus, Search, FileText, Calendar, User, Eye, Download, X, Loader2, Clock, CheckCircle, AlertCircle, Stethoscope, Phone, QrCode, Landmark, ArrowLeft, RotateCcw } from 'lucide-react';
import { SiGooglepay, SiPaytm, SiPhonepe, SiRazorpay } from 'react-icons/si';
import UploadPrescriptionModal from '../components/UploadPrescriptionModal';
import { getQuickPrescriptionsApi, dispenseQuickPrescriptionApi } from '../../services/PharmacistAllApi';
import { BASE_URL } from "../../services/baseURL";

const QuickPrescription = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // List State
    const [quickPrescriptions, setQuickPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("Pending");

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(6); // Default limit as per screenshot
    const [totalPages, setTotalPages] = useState(0);

    // Preview State
    const [previewFile, setPreviewFile] = useState(null);

    // Profile Image Preview State
    const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
    const [viewImageUrl, setViewImageUrl] = useState(null);
    const [dispensing, setDispensing] = useState(false);
    const [note, setNote] = useState("");
    const [dispenseLoading, setDispenseLoading] = useState(false); // Unified with dispensing state if needed

    // Payment Flow States
    const [showPaymentSelection, setShowPaymentSelection] = useState(false);
    const [showAmountEntry, setShowAmountEntry] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(""); // 'Online Payment', 'Cash', 'Combined Payment', 'PayLater'
    const [onlineAmount, setOnlineAmount] = useState("");
    const [cashAmount, setCashAmount] = useState("");
    const [isUpdateMode, setIsUpdateMode] = useState(false);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const calculateDetailedAge = (dob) => {
        if (!dob) return "--";
        const start = new Date(dob);
        const end = new Date();
        if (start > end) return "--";

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        if (days < 0) {
            months--;
            const prevMonthDate = new Date(end.getFullYear(), end.getMonth(), 0);
            days += prevMonthDate.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        if (months > 0) return `${months} Months`;
        return `${days} Days`;
    };

    const calculatePharmacyAmount = (details) => {
        if (!details) return 0;
        if (details.pharmacyAmount) return parseFloat(details.pharmacyAmount);

        let total = 0;
        if (details.razorPay) total += parseFloat(details.razorPay || 0);
        if (details.onlinePayment) total += parseFloat(details.onlinePayment || 0);
        if (details.cash) total += parseFloat(details.cash || 0);
        if (details.combined) {
            total += parseFloat(details.combined.cash || 0);
            total += parseFloat(details.combined.onlinePayment || 0);
        }

        // Fallback
        if (total === 0) {
            if (details.pharmacyCash) total += parseFloat(details.pharmacyCash || 0);
            if (details.pharmacyOnline) total += parseFloat(details.pharmacyOnline || 0);
        }
        return total;
    };

    const fetchQuickPrescriptions = async () => {
        setLoading(true);
        try {
            // Using activeTab to determine dispenseStatus ("Pending" or "Dispensed"/"Completed")
            // Assuming "Pending" status for Pending tab and "Dispensed" for Completed tab based on typical logic
            // Adjust dispenseStatus value if backend expects different string
            const status = activeTab === "Pending" ? "Pending" : "Dispensed";
            const result = await getQuickPrescriptionsApi(status, page, limit);
            if (result.status === 200) {
                setQuickPrescriptions(result.data.data || []);
                // Assuming backend returns totalPages or totalCount to calculate it.
                // If backend returns totalCount: setTotalPages(Math.ceil(result.data.totalCount / limit));
                // If backend returns totalPages directly:
                setTotalPages(result.data.totalPages || 0);
            }
        } catch (error) {
            console.error("Error fetching quick prescriptions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuickPrescriptions();
    }, [page, activeTab]); // Re-fetch on page or tab change

    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        return `${BASE_URL}/${finalPath}`;
    };

    const handleViewFile = (fileUrl, item, updateMode = false) => {
        setNote("");
        setIsUpdateMode(updateMode);
        setPreviewFile({
            url: getImageUrl(fileUrl),
            isPdf: fileUrl?.toLowerCase().endsWith('.pdf'),
            details: item
        });
        if (updateMode) {
            setShowPaymentSelection(true);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Completed":
            case "Dispensed":
                return "bg-green-50 text-green-600 border-green-100";
            case "Pending":
                return "bg-amber-50 text-amber-600 border-amber-100";
            default:
                return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const filteredPrescriptions = quickPrescriptions.filter(item => {
        const query = searchQuery.toLowerCase();
        // Check patient name, unique ID, or patientId (if populated differently)
        const patientName = item.patientName || item.Patient?.fullName || item.Visit?.Patient?.fullName || "";
        const patientId = item.patientUniqueId || item.Patient?.uniqueId || item.Visit?.Patient?.uniqueId || "";

        const nameMatch = patientName.toLowerCase().includes(query);
        const idMatch = patientId.toLowerCase().includes(query);
        const filenameMatch = item.fileName?.toLowerCase().includes(query);

        return (nameMatch || idMatch || filenameMatch);
    });

    const handleFinalDispense = async (forcedStatus = null) => {
        if (!previewFile?.details?.id) return;

        setDispensing(true);
        setDispenseLoading(true);
        try {
            const cashVal = Number(cashAmount) || 0;
            const onlineVal = Number(onlineAmount) || 0;
            let reqBody;
            if (paymentMethod === 'Cash') {
                reqBody = {
                    notes: note,
                    cash: cashVal,
                    paymentStatus: "Paid"
                };
            } else if (paymentMethod === 'Online Payment') {
                reqBody = {
                    notes: note,
                    onlinePayment: onlineVal,
                    paymentStatus: "Paid"
                };
            } else if (paymentMethod === 'Razorpay Payment') {
                reqBody = {
                    notes: note,
                    razorPay: onlineVal,
                    paymentStatus: "Paid"
                };
            } else {
                // Combined Payment
                reqBody = {
                    notes: note,
                    paymentStatus: "Paid",
                    combined: {
                        cash: cashVal,
                        onlinePayment: onlineVal
                    }
                };
            }

            const result = await dispenseQuickPrescriptionApi(previewFile.details.id, reqBody);
            if (result.status === 200) {
                setPreviewFile(null);
                setShowPaymentSelection(false);
                setShowAmountEntry(false);
                fetchQuickPrescriptions();
            } else {
                alert("Failed to dispense prescription. Please try again.");
            }
        } catch (error) {
            console.error("Dispense error", error);
            alert("An error occurred while dispensing.");
        } finally {
            setDispensing(false);
            setDispenseLoading(false);
        }
    };

    const handleDispenseClick = () => {
        setShowPaymentSelection(true);
    };

    const handleMethodSelect = (method) => {
        setPaymentMethod(method);
        let online = "";
        let cash = "";

        if (isUpdateMode && previewFile?.details) {
            const details = previewFile.details;
            const prevMode = details.pharmacyPaymentMode;

            const isMatch = (method === 'Combined Payment' && (prevMode === 'Combined' || prevMode === 'Combined Payment')) ||
                (method === 'Online Payment' && (prevMode === 'Online' || prevMode === 'Online Payment')) ||
                (method === 'Cash' && prevMode === 'Cash') ||
                (method === 'Razorpay Payment' && (prevMode?.toLowerCase() === 'razorpay' || prevMode?.toLowerCase() === 'razorpay payment'));

            if (isMatch) {
                if (details.combined) {
                    online = details.combined.onlinePayment || "0";
                    cash = details.combined.cash || "0";
                } else {
                    if (details.razorPay) online = details.razorPay;
                    else if (details.onlinePayment) online = details.onlinePayment;

                    if (details.cash) cash = details.cash;
                }
                // Fallbacks
                if (online === "0" && details.pharmacyOnline) online = details.pharmacyOnline;
                if (cash === "0" && details.pharmacyCash) cash = details.pharmacyCash;

                online = online.toString();
                cash = cash.toString();
            }
        }

        setOnlineAmount(online);
        setCashAmount(cash);
        setShowPaymentSelection(false);
        setShowAmountEntry(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            {/* Sidebar */}
            <PharmacistSidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={toggleSidebar}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Main Content */}
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
                            <Zap className="text-[#14B8A6]" size={36} />
                            Quick Prescriptions
                        </h1>
                        <p className="text-gray-500 mt-1">Manage and view quick prescription uploads</p>
                    </div>

                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 bg-[#14B8A6] hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-teal-900/10 transition-all transform hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} />
                        Upload Prescription
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl border border-gray-100 p-2 mb-8 shadow-sm max-w-2xl">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by patient name, ID or file name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 text-gray-700 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => { setActiveTab("Pending"); setPage(1); }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors
                        ${activeTab === "Pending"
                                ? "bg-white text-slate-900 shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-slate-700"}`}
                    >
                        <Clock size={16} className={activeTab === "Pending" ? "text-slate-900" : ""} />
                        Pending
                    </button>
                    <button
                        onClick={() => { setActiveTab("Completed"); setPage(1); }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors
                        ${activeTab === "Completed"
                                ? "bg-white text-slate-900 shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-slate-700"}`}
                    >
                        <CheckCircle size={16} className={activeTab === "Completed" ? "text-slate-900" : ""} />
                        Completed
                    </button>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-[#14B8A6]" size={40} />
                    </div>
                ) : filteredPrescriptions.length > 0 ? (
                    <div className="space-y-4">
                        {filteredPrescriptions.map((item) => {
                            const isPdf = item.fileType === 'application/pdf' || item.filePath?.toLowerCase().endsWith('.pdf');
                            // Prioritize Patient object as it contains the complete details (fullName, age, etc.)
                            const pName = item.Patient?.fullName || item.patientName || item.Visit?.Patient?.fullName || "Unknown Patient";
                            const pId = item.Patient?.uniqueId || item.patientUniqueId || item.Visit?.Patient?.uniqueId || "N/A";
                            const pSex = item.Patient?.sex || item.sex || item.Visit?.Patient?.sex || "--";
                            const pDob = item.Patient?.dateOfBirth || item.dateOfBirth || item.Visit?.Patient?.dateOfBirth;
                            const pProfile = item.Patient?.profilePhoto || item.profilePhoto || item.Visit?.Patient?.profilePhoto;
                            const fileUrl = getImageUrl(item.filePath);

                            return (
                                <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar or User Icon */}
                                        <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 overflow-hidden relative border border-gray-100 cursor-pointer"
                                            onClick={() => {
                                                if (pProfile) {
                                                    setViewImageUrl(getImageUrl(pProfile));
                                                    setShowImagePreviewModal(true);
                                                }
                                            }}
                                        >
                                            <User size={24} className="absolute z-0" />
                                            {pProfile && (
                                                <AuthImage
                                                    src={getImageUrl(pProfile)}
                                                    alt={pName}
                                                    className="w-full h-full object-cover relative z-10"
                                                    onError={(e) => { e.target.style.opacity = '0' }}
                                                />
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 text-lg">
                                                    {pName}
                                                </h3>
                                                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">
                                                    #{pId}
                                                </span>
                                                {item.isCardiodiabetic && (
                                                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-100 ml-1">
                                                        CD
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                {pSex}
                                                <span className="text-gray-300">•</span>
                                                {calculateDetailedAge(pDob)}
                                                <span className="text-gray-300 mx-2">|</span>
                                                <Calendar size={12} />
                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Unknown Date"}
                                                <span className="text-gray-300">•</span>
                                                <Clock size={12} />
                                                {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Action */}
                                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-8 w-full md:w-auto mt-4 md:mt-0">
                                        <div className="text-right">
                                            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border mb-1 ${getStatusColor(item.status || item.dispenseStatus || 'Pending')}`}>
                                                {(item.status === 'Dispensed' || item.dispenseStatus === 'Dispensed') ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                                {item.status || item.dispenseStatus || "Pending"}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewFile(item.filePath, item);
                                                }}
                                                className="px-4 py-2 rounded-lg border border-gray-200 text-slate-700 font-medium hover:bg-gray-50 hover:text-slate-900 transition-colors text-sm flex items-center gap-2"
                                            >
                                                <Eye size={18} />
                                                View Quick Prescription
                                            </button>
                                            {activeTab === "Completed" && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewFile(item.filePath, item, true);
                                                    }}
                                                    className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 font-medium hover:bg-amber-100 transition-colors text-sm flex items-center gap-2"
                                                >
                                                    <RotateCcw size={16} />
                                                    Update Payment
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700">No quick prescription to dispense today</h3>
                    </div>
                )
                }

                {/* Pagination Controls */}
                {
                    !loading && quickPrescriptions.length > 0 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className={`px-4 py-2 rounded-lg border ${page === 1 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-slate-600 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Previous
                            </button>
                            <span className="text-sm font-medium text-slate-600">
                                Page {page} of {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages || totalPages === 0}
                                className={`px-4 py-2 rounded-lg border ${page === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-slate-600 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Next
                            </button>
                        </div>
                    )
                }

                {/* Upload Modal (Reused) */}
                <UploadPrescriptionModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onUploadSuccess={() => {
                        fetchQuickPrescriptions();
                    }}
                />

                {/* File Preview Modal - Enhanced Style */}
                {
                    previewFile && (
                        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in zoom-in duration-200">
                            {showPaymentSelection ? (
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">Select Payment {isUpdateMode && `(₹${calculatePharmacyAmount(previewFile.details).toLocaleString('en-IN')})`}</h3>
                                            <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">Pharmacy Dispensing</p>
                                        </div>
                                        <button onClick={() => isUpdateMode ? setPreviewFile(null) : setShowPaymentSelection(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-4">

                                        <button
                                            onClick={() => handleMethodSelect('Online Payment')}
                                            className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && (previewFile.details?.pharmacyPaymentMode === 'Online Payment' || previewFile.details?.pharmacyPaymentMode === 'Online') ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800 text-lg">Online Payment</p>
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium tracking-tight">UPI, Cards & Net Banking</p>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <SiGooglepay size={22} className="text-[#4285F4] opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    <SiPaytm size={22} className="text-[#00B9F1] opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    <SiPhonepe size={22} className="text-[#5F259F] opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
                                                    <Landmark size={18} className="text-gray-400" title="Net Banking" />
                                                    <QrCode size={18} className="text-gray-400" />
                                                </div>
                                            </div>
                                            <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && (previewFile.details?.pharmacyPaymentMode === 'Online Payment' || previewFile.details?.pharmacyPaymentMode === 'Online') ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                                        </button>

                                        <button
                                            onClick={() => handleMethodSelect('Cash')}
                                            className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && previewFile.details?.pharmacyPaymentMode === 'Cash' ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
                                        >
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800 text-lg">Cash Payment</p>
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium tracking-tight">Physical currency payment</p>
                                            </div>
                                            <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && previewFile.details?.pharmacyPaymentMode === 'Cash' ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                                        </button>

                                        <button
                                            onClick={() => handleMethodSelect('Combined Payment')}
                                            className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && (previewFile.details?.pharmacyPaymentMode === 'Combined Payment' || previewFile.details?.pharmacyPaymentMode === 'Combined') ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
                                        >
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800 text-lg">Combined Payment</p>
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium tracking-tight">Split between Cash and Online</p>
                                            </div>
                                            <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && (previewFile.details?.pharmacyPaymentMode === 'Combined Payment' || previewFile.details?.pharmacyPaymentMode === 'Combined') ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                                        </button>

                                        <button
                                            onClick={() => handleMethodSelect('Razorpay Payment')}
                                            className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && (previewFile.details?.pharmacyPaymentMode?.toLowerCase() === 'razorpay' || previewFile.details?.pharmacyPaymentMode?.toLowerCase() === 'razorpay payment') ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
                                        >
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800 text-lg">Razorpay</p>
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium tracking-tight">Pay via Razorpay Gateway</p>
                                                <div className="mt-3">
                                                    <SiRazorpay size={22} className="text-[#3395FF]" />
                                                </div>
                                            </div>
                                            <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && (previewFile.details?.pharmacyPaymentMode?.toLowerCase() === 'razorpay' || previewFile.details?.pharmacyPaymentMode?.toLowerCase() === 'razorpay payment') ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                                        </button>

                                    </div>
                                </div>
                            ) : showAmountEntry ? (
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">Enter Amount {isUpdateMode && `(₹${(parseFloat(onlineAmount || 0) + parseFloat(cashAmount || 0)).toLocaleString('en-IN')})`}</h3>
                                            <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{paymentMethod}</p>
                                        </div>
                                        <button onClick={() => isUpdateMode ? setPreviewFile(null) : setShowAmountEntry(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        {paymentMethod === 'Combined Payment' ? (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700 font-poppins">Online Amount</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold font-poppins">₹</span>
                                                        <input
                                                            type="number"
                                                            autoFocus
                                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/10 focus:border-[#14B8A6] transition-all font-bold text-slate-800 font-poppins"
                                                            placeholder="0.00"
                                                            value={onlineAmount}
                                                            onChange={(e) => setOnlineAmount(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700 font-poppins">Cash Amount</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold font-poppins">₹</span>
                                                        <input
                                                            type="number"
                                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/10 focus:border-[#14B8A6] transition-all font-bold text-slate-800 font-poppins"
                                                            placeholder="0.00"
                                                            value={cashAmount}
                                                            onChange={(e) => setCashAmount(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 mt-2">
                                                    <div className="flex justify-between items-center text-slate-600 text-sm font-medium font-poppins">
                                                        <span>Total Amount</span>
                                                        <span className="text-lg font-bold text-[#14B8A6]">₹ {(parseFloat(onlineAmount || 0) + parseFloat(cashAmount || 0)).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 font-poppins">Total Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold font-poppins">₹</span>
                                                    <input
                                                        type="number"
                                                        autoFocus
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/10 focus:border-[#14B8A6] transition-all font-bold text-slate-800 font-poppins"
                                                        placeholder="0.00"
                                                        value={(paymentMethod === 'Online Payment' || paymentMethod === 'Razorpay Payment' || paymentMethod === 'Razorpay') ? onlineAmount : cashAmount}
                                                        onChange={(e) => {
                                                            if (paymentMethod === 'Online Payment' || paymentMethod === 'Razorpay Payment' || paymentMethod === 'Razorpay') setOnlineAmount(e.target.value);
                                                            else setCashAmount(e.target.value);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2 flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setShowAmountEntry(false);
                                                    setShowPaymentSelection(true);
                                                }}
                                                className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors font-poppins"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={() => handleFinalDispense()}
                                                disabled={dispenseLoading || (paymentMethod === 'Combined Payment' ? (!onlineAmount && !cashAmount) : ((paymentMethod === 'Online Payment' || paymentMethod === 'Razorpay Payment' || paymentMethod === 'Razorpay') ? !onlineAmount : !cashAmount))}
                                                className="flex-[2] py-3 bg-[#14B8A6] hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-900/10 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed font-poppins"
                                            >
                                                {dispenseLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                                                {isUpdateMode ? "Update Payment" : "Confirm Dispense"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                                    {/* Header */}
                                    <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-none bg-white rounded-t-2xl z-20">
                                        <div className="flex items-center gap-2 text-[#14B8A6]">
                                            <FileText size={24} />
                                            <h2 className="text-xl font-bold text-slate-900">Quick Prescription</h2>
                                        </div>
                                        <button onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    {/* Body - Scrollable */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                        {/* Patient Header Card */}
                                        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-[#14B8A6] overflow-hidden border-2 border-white shadow-sm">
                                                    {previewFile.details?.Patient?.profilePhoto || previewFile.details?.profilePhoto || previewFile.details?.Visit?.Patient?.profilePhoto ? (
                                                        <AuthImage
                                                            src={getImageUrl(previewFile.details.Patient?.profilePhoto || previewFile.details.profilePhoto || previewFile.details.Visit?.Patient?.profilePhoto)}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User size={32} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl font-bold text-slate-900">
                                                            {previewFile.details?.Patient?.fullName || previewFile.details?.patientName || "Unknown Patient"}
                                                        </h3>
                                                        {previewFile.details?.isCardiodiabetic && (
                                                            <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-100">
                                                                CD
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">
                                                            #{previewFile.details?.Patient?.uniqueId || previewFile.details?.patientUniqueId || "N/A"}
                                                        </span>
                                                        <p className="text-gray-500 text-sm">
                                                            {calculateDetailedAge(previewFile.details?.Patient?.dateOfBirth || previewFile.details?.dateOfBirth || previewFile.details?.Visit?.Patient?.dateOfBirth)}, {previewFile.details?.Patient?.sex || previewFile.details?.sex || previewFile.details?.Visit?.Patient?.sex || "--"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-medium">Uploaded On</p>
                                                    <p className="font-semibold text-slate-700">
                                                        {previewFile.details?.createdAt ? new Date(previewFile.details.createdAt).toLocaleDateString() : "--"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-medium">Contact</p>
                                                    <p className="font-semibold text-slate-700 flex items-center justify-end gap-1">
                                                        <Phone size={14} className="text-gray-400" /> {previewFile.details?.mobile || previewFile.details?.Patient?.mobile || previewFile.details?.Visit?.Patient?.mobile || "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>



                                        {/* File Content */}
                                        <div>
                                            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                <Zap size={18} className="text-gray-400" />
                                                Uploaded Prescription
                                            </h3>
                                            <div className="bg-gray-100 rounded-xl p-2 flex justify-center min-h-[300px]">
                                                <AuthenticatedMedia
                                                    src={previewFile.url}
                                                    fileName={previewFile.url}
                                                    fileType={previewFile.isPdf ? "application/pdf" : ""}
                                                    alt="Prescription"
                                                    title="PDF Preview"
                                                    frameClassName="w-full h-[600px] rounded border border-gray-200"
                                                    imageClassName="max-w-full object-contain rounded-lg"
                                                />
                                            </div>
                                        </div>

                                        {/* Pharmacist Notes */}
                                        <div>
                                            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                Pharmacist Notes (Optional)
                                            </h3>
                                            {(previewFile.details?.status === 'Dispensed' || previewFile.details?.dispenseStatus === 'Dispensed') ? (
                                                <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-slate-700 text-sm">
                                                    {previewFile.details?.pharmacistNotes || "No notes added."}
                                                </div>
                                            ) : (
                                                <textarea
                                                    className="w-full h-32 p-4 bg-white border border-[#14B8A6] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/10 resize-none text-sm"
                                                    placeholder="Add notes about dispensing, substitutions, or patient instructions..."
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                ></textarea>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex-none flex items-center justify-end gap-4 rounded-b-2xl">
                                        <button
                                            onClick={() => setPreviewFile(null)}
                                            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            Close
                                        </button>
                                        {(previewFile.details?.status === 'Dispensed' || previewFile.details?.dispenseStatus === 'Dispensed') && !isUpdateMode ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDispenseClick}
                                                    className="px-6 py-2.5 bg-amber-50 text-amber-600 font-bold rounded-xl flex items-center gap-2 border border-amber-200 hover:bg-amber-100 transition-colors"
                                                >
                                                    <RotateCcw size={20} />
                                                    Update Payment
                                                </button>
                                                <button
                                                    disabled
                                                    className="px-6 py-2.5 bg-green-100 text-green-700 font-bold rounded-xl flex items-center gap-2 cursor-not-allowed"
                                                >
                                                    <CheckCircle size={20} />
                                                    Dispensed
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleDispenseClick}
                                                disabled={dispensing}
                                                className="px-6 py-2.5 bg-[#14B8A6] hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-900/10 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {dispensing ? (
                                                    <Loader2 size={20} className="animate-spin" />
                                                ) : (
                                                    <CheckCircle size={20} />
                                                )}
                                                {dispensing ? "Dispensing..." : (isUpdateMode ? "Update Payment" : "Mark as Dispensed")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
                {/* Profile Image Preview Modal */}
                {
                    showImagePreviewModal && (
                        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowImagePreviewModal(false)}>
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
                    )
                }
            </main >
        </div >
    );
};

export default QuickPrescription;
