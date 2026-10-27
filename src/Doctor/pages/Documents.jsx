import AuthImage from "../../components/AuthImage";
import React, { useState, useEffect } from "react";
import DoctorSidebar from "../components/DoctorSidebar";
import { Search, Plus, Eye, Menu, Image as ImageIcon, FileText, User, X, Loader2, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import DoctorUploadDocument from "../components/DoctorUploadDocument";
import { fetchPatientDocumentsApi, searchPatientApi, fetchAllDocumentsApi, getQuickDocumentsApi } from "../../services/DoctorAllApi";
import { BASE_URL } from "../../services/baseURL";
import ViewLabReportModal from "../components/ViewLabReportModal";

export default function DoctorDocuments() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);


    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(6);
    const [totalCount, setTotalCount] = useState(0);

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewDocUrl, setViewDocUrl] = useState("");
    const [viewDocName, setViewDocName] = useState("");
    const [viewDocType, setViewDocType] = useState("");

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const result = await getQuickDocumentsApi(currentPage, itemsPerPage, searchQuery);
            if (result.status === 200) {
                setDocuments(result.data.data);
                if (result.data.meta) {
                    setTotalCount(result.data.meta.total);
                    setTotalPages(result.data.meta.totalPages);
                }
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDocuments();
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [currentPage, searchQuery]);

    // Reset page on search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        return `${BASE_URL}/${finalPath}`;
    };


    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            {/* Sidebar */}
            <DoctorSidebar
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
                            Quick Documents
                        </h1>
                        <p className="text-gray-500 mt-1">Upload and manage patient documents</p>
                    </div>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-[#14B8A6] hover:bg-teal-600 text-white px-5 text-sm py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-teal-900/10"
                    >
                        <Plus size={20} />
                        Upload Document
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl border border-gray-100 p-2 mb-8 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or phone number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 text-gray-700 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Documents Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-[#14B8A6]" size={32} />
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {documents.length > 0 ? (
                                documents.map((doc) => (
                                    <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0
                                                ${doc.fileType?.includes('image') ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}
                                            `}>
                                                {doc.fileType?.includes('image') ? <ImageIcon size={24} /> : <FileText size={24} />}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900 text-lg" title={doc.fileName}>
                                                    {doc.fileName.length > 30 ? doc.fileName.substring(0, 30) + "..." : doc.fileName}
                                                </h3>
                                                <p className="text-gray-500 text-sm mb-3">{doc.documentType || 'Document'}</p>

                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-teal-50 flex items-center justify-center text-teal-600 border border-gray-100 shrink-0">
                                                        {(doc.Visit?.Patient?.profilePhoto || doc.profilePhoto) ? (
                                                            <AuthImage
                                                                src={getImageUrl(doc.Visit?.Patient?.profilePhoto || doc.profilePhoto)}
                                                                alt={doc.Visit?.Patient?.fullName || doc.patientName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User size={12} />
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-slate-700">{doc.Visit?.Patient?.fullName || doc.patientName}</span>
                                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">
                                                        {doc.Visit?.Patient?.uniqueId || doc.patientUniqueId}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-3 h-3 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                                        </span>
                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span>{doc.fileType?.split('/')[1]?.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const fullPath = doc.filePath?.startsWith('http')
                                                    ? doc.filePath
                                                    : `${BASE_URL}${doc.filePath}`;
                                                setViewDocUrl(fullPath);
                                                setViewDocName(doc.fileName);
                                                setViewDocType(doc.fileType);
                                                setViewModalOpen(true);
                                            }}
                                            className="w-full py-2.5 rounded-lg border border-gray-100 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Eye size={16} />
                                            View Document
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 md:col-span-2 text-center py-12 text-gray-400">
                                    No documents found.
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 0 && !searchQuery && (
                            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="text-sm text-gray-500">
                                    Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium text-gray-900">{totalCount}</span> results
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className={`p-2 rounded-lg border border-gray-200 transition-colors
                                            ${currentPage === 1
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-[#14B8A6]'}`}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {(() => {
                                            let start = Math.max(1, currentPage - 1);
                                            let end = Math.min(totalPages, start + 2);
                                            if (end - start < 2 && totalPages >= 3) {
                                                start = Math.max(1, end - 2);
                                            }

                                            const pages = [];
                                            for (let i = start; i <= end; i++) {
                                                pages.push(i);
                                            }

                                            return pages.map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                                                        ${currentPage === page
                                                            ? 'bg-[#14B8A6] text-white shadow-sm'
                                                            : 'text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    {page}
                                                </button>
                                            ));
                                        })()}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`p-2 rounded-lg border border-gray-200 transition-colors
                                            ${currentPage === totalPages
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-[#14B8A6]'}`}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <DoctorUploadDocument
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={fetchDocuments}
            />

            <ViewLabReportModal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                pdfUrl={viewDocUrl}
                fileName={viewDocName}
                fileType={viewDocType}
            />
        </div>
    );
}
