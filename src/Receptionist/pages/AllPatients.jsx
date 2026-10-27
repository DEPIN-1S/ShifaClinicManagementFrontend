import AuthImage from "../../components/AuthImage";
import React, { useEffect, useState } from "react";
import ReceptionistSidebar from "../components/ReceptionistSidebar";
import { Search, Menu, Users, ChevronLeft, ChevronRight, User, Trash2 } from "lucide-react";
import { fetchAllPatientsApi, searchPatientApi } from "../../services/receptionistAllApi";
import Swal from 'sweetalert2';

import { calculateDetailedAge } from "../../utils/dateUtils";
import { BASE_URL } from "../../services/baseURL";
import { Edit2, X } from "lucide-react";
import PatientRegistrationForm from "../components/PatientRegistrationForm";

export default function AllPatients() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // Data State
    const [patientData, setPatientData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);

    // Profile Preview State
    const [previewImage, setPreviewImage] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10); // Changed to 10 to match backend/Doctor panel
    const [totalCount, setTotalCount] = useState(0); // To track total results
    const [searchKey, setSearchKey] = useState('');

    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;

        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        // Adjust common path prefixes if needed, but standardizing on BASE_URL
        return `${BASE_URL}/${finalPath}`;
    };

    const fetchPatients = async () => {
        setLoading(true);
        try {
            // Check if searching or just fetching list
            if (searchKey) {
                const result = await searchPatientApi(`query=${searchKey}`);
                if (result.status === 200) {
                    setPatientData(result.data.data || []);
                    // Search API usually returns all matches, so pagination might be reset or handled locally
                    // For now assuming we just show the results
                    setTotalPages(1);
                    setTotalCount(result.data.data?.length || 0);
                }
            } else {
                const result = await fetchAllPatientsApi(currentPage, itemsPerPage);
                console.log("All Patients Result:", result);
                if (result.status === 200) {
                    setPatientData(result.data.data || []);

                    if (result.data.meta) {
                        setTotalCount(result.data.meta.total);
                        setTotalPages(result.data.meta.totalPages);
                    } else {
                        // Fallback for older structure
                        if (result.data.totalCount) {
                            setTotalCount(result.data.totalCount);
                        }

                        if (result.data.totalPages) {
                            setTotalPages(result.data.totalPages);
                        } else if (result.data.totalCount) {
                            setTotalPages(Math.ceil(result.data.totalCount / itemsPerPage));
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching patients", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPatients();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [currentPage, searchKey]);

    // Calculate indices for display "Showing X to Y of Z"
    // Since we are server-side paginating, this is different from dashboard client-side
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const showingStart = indexOfFirstItem + 1;
    const showingEnd = indexOfFirstItem + patientData.length;



    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleEditClick = (patient) => {
        setEditingPatient(patient);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setEditingPatient(null);
        fetchPatients(); // Refresh list
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            {/* Sidebar */}
            <ReceptionistSidebar
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
                        <h1 className="text-3xl font-bold text-slate-900">All Patients</h1>
                        <p className="text-gray-500 mt-1">Directory of all registered patients</p>
                    </div>
                </div>

                {/* Patients Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Header - Matching Dashboard Style */}
                    <div className="px-6 py-6 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex flex-col items-start justify-center" >
                            <h3 className="font-semibold text-xl text-slate-900">Registered Patients</h3>
                            <p className="text-sm text-gray-400" >List of all patients in the system</p>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search patient..."
                                onChange={(e) => {
                                    setSearchKey(e.target.value);
                                    setCurrentPage(1); // Reset page on search
                                }}
                                className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6]"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 text-left">
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient ID</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                            Loading patients...
                                        </td>
                                    </tr>
                                ) : patientData.length > 0 ? (
                                    patientData.map((patient) => (
                                        <tr key={patient._id || patient.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">
                                                    #{patient.uniqueId}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div
                                                    className="w-15 h-15 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#14B8A6] transition-colors group-hover:scale-105 duration-200"
                                                    onClick={() => patient.profilePhoto && setPreviewImage(getImageUrl(patient.profilePhoto))}
                                                    title="Click to view"
                                                >
                                                    {patient.profilePhoto ? (
                                                        <AuthImage
                                                            src={getImageUrl(patient.profilePhoto)}
                                                            alt={patient.fullName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.onerror = null; // Prevent infinite loop
                                                                e.target.style.display = 'none'; // Hide broken image
                                                                e.target.parentElement.classList.add('bg-slate-100'); // Ensure background
                                                                // Show icon fallback
                                                            }}
                                                        />
                                                    ) : (
                                                        <User size={18} className="text-slate-400" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    {patient.fullName}
                                                    {(patient.isCardiodiabetic === true || (Array.isArray(patient.Visits) && patient.Visits.some(v => v.isCardiodiabetic === true))) && (
                                                        <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-xs font-semibold border border-rose-200">
                                                            CD
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-600">
                                                {patient.mobile}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                {patient.sex}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                {calculateDetailedAge(patient.dateOfBirth)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleEditClick(patient)}
                                                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                    title="Edit Patient"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                            No patients found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls - Logic copied from Dashboard */}
                    {totalPages > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium text-gray-900">{showingStart}</span> to <span className="font-medium text-gray-900">{showingEnd}</span> results
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
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
                                                onClick={() => paginate(page)}
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
                                    onClick={() => paginate(currentPage + 1)}
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
            </main>

            {/* Edit Patient Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        {/* We reuse the form, but strip the outer container padding if needed or just let it consist of its own padding */}
                        <div className="p-2">
                            <PatientRegistrationForm
                                initialData={editingPatient}
                                isEdit={true}
                                patientId={editingPatient._id || editingPatient.id}
                                onCancel={() => setIsEditModalOpen(false)}
                                onSubmit={handleEditSuccess}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative animate-in zoom-in-50 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white shadow-2xl relative">
                            <AuthImage
                                src={previewImage}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            onClick={() => setPreviewImage(null)}
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
