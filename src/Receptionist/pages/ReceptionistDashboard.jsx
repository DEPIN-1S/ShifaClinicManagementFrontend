import AuthImage from "../../components/AuthImage";
import React, { Activity, useEffect, useState } from "react";
import ReceptionistSidebar from "../components/ReceptionistSidebar";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Calendar, Clock, UserCheck, Menu, Users, ChevronLeft, ChevronRight, Check, User, X, CreditCard, Banknote, Coins, Wallet } from "lucide-react";
import { TbActivityHeartbeat } from "react-icons/tb";
import { FaPeopleGroup } from "react-icons/fa6";
import { fetchPatientsApi, searchPatientApi, fetchDashboardStatsApi } from "../../services/receptionistAllApi";
import { calculateDetailedAge } from "../../utils/dateUtils";
import { BASE_URL } from "../../services/baseURL";

export default function ReceptionistDashboard() {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // Data State
    const [patientData, setPatientdata] = useState([])
    const [stats, setStats] = useState({
        tokensToday: 0,
        waiting: 0,
        completed: 0,
        totalCF: 0
    });

    // Search and Pagination State
    const [searchKey, setSearchKey] = useState('')
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(4); // Match Admin side limit
    const [previewImage, setPreviewImage] = useState(null);

    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;

        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        // Adjust common path prefixes if needed, but standardizing on BASE_URL
        return `${BASE_URL}/${finalPath}`;
    };

    const fetchPatients = async () => {
        try {
            // Fetch all patients for frontend pagination (simulated with high limit)
            const result = await fetchPatientsApi(1, 1000);
            console.log("result for fetching patients", result);
            if (result.status === 200) {
                setPatientdata(result.data.data || []);
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    const fetchStats = async () => {
        try {
            const result = await fetchDashboardStatsApi();
            if (result.status === 200) {
                setStats(result.data.data);
            }
        } catch (error) {
            console.log("Error fetching stats:", error);
        }
    }

    useEffect(() => {
        if (!searchKey) {
            fetchPatients()
            fetchStats();
        }
    }, [searchKey]) // Removed currentPage dependency as we fetch all at once

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchKey) {
                const searchPatients = async () => {
                    try {
                        const result = await searchPatientApi(`query=${searchKey}`);
                        if (result.status === 200) {
                            setPatientdata(result.data.data);
                            setCurrentPage(1); // Reset to first page on search
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
                searchPatients();
            } else {
                fetchPatients();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchKey])

    // Filter Logic (Client-side search backup if needed, though API search is used above)
    // For now, we rely on the API search when searchKey is present, and local pagination on the result.

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPatients = patientData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(patientData.length / itemsPerPage);
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Mock Visits/Appointments Data
    const recentVisits = [
        {
            id: 1,
            name: "John Doe",
            mobile: "9876543210",
            doctor: "Dr. Sarah Smith",
            time: "09:00 AM",
            status: "Checked In",
        },
        {
            id: 2,
            name: "Jane Smith",
            mobile: "9876543211",
            doctor: "Dr. Ahmed Khan",
            time: "09:30 AM",
            status: "Waiting",
        },
        {
            id: 3,
            name: "Michael Brown",
            mobile: "9876543212",
            doctor: "Dr. Sarah Smith",
            time: "10:15 AM",
            status: "Completed",
        },
        {
            id: 4,
            name: "Emily White",
            mobile: "9876543213",
            doctor: "Dr. Fatima Hassan",
            time: "11:00 AM",
            status: "Checked In",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            {/* Sidebar - Controlled by Dashboard state */}
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
                {/* Mobile Header for hamburger */}
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
                        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.fullName || "Receptionist"}</h1>
                        <p className="text-gray-500 mt-1">Register patients and generate tokens</p>
                    </div>
                    <button
                        onClick={() => navigate('/receptionist/patient-registration')}
                        className="bg-[#14B8A6] hover:bg-teal-600 text-white px-5 text-sm py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-teal-900/10"
                    >
                        <Plus size={20} />
                        New Registration
                    </button>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Tokens Today</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.tokensToday}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                            <FaPeopleGroup size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Total No of CF Today</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {stats.totalCF}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                            <Wallet size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Waiting</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {stats.waiting}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {stats.completed}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center">
                            <UserCheck size={20} />
                        </div>
                    </div>
                </div>

                {/* Visits Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-6 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex flex-col items-start justify-center" >
                            <h3 className="font-semibold text-xl text-slate-900">Today's Tokens</h3>
                            <p className="text-sm text-gray-400" >Overview of patient tokens generated today</p>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search patient..."
                                onChange={(e) => setSearchKey(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6]"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 text-left">
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Token No</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">CF</th>
                                    {/* <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th> */}
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {currentPatients.length > 0 ? (
                                    currentPatients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="w-10 h-10 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-semibold">
                                                    {patient.activeToken}
                                                </div>
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
                                                                e.target.onerror = null;
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.classList.add('bg-slate-100');
                                                            }}
                                                        />
                                                    ) : (
                                                        <User size={18} className="text-slate-400" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                {patient.fullName}
                                                <div className="text-xs text-gray-400 font-normal">{patient.uniqueId}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                {patient.sex}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                {calculateDetailedAge(patient.dateOfBirth) || patient.age}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                {patient.CF ? (
                                                    <div className="flex items-center gap-1 text-green-600 font-bold">
                                                        <Check size={20} strokeWidth={3} />
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {(() => {
                                                    const status = patient.visitStatus || "Waiting"; // Default to Waiting if undefined? Or Pending?

                                                    // Define styles map
                                                    const statusStyles = {
                                                        "Completed": "bg-teal-100 text-teal-700",
                                                        "InConsultation": "bg-blue-100 text-blue-700",
                                                        "Waiting": "bg-amber-100 text-amber-700",
                                                        "Checked In": "bg-purple-100 text-purple-700",
                                                        "Pending": "bg-gray-100 text-gray-600"
                                                    };

                                                    const badgeClass = statusStyles[status] || "bg-gray-100 text-gray-600";

                                                    return (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                                                            {status}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                            No patients found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium text-gray-900">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-900">{Math.min(indexOfLastItem, patientData.length)}</span> of <span className="font-medium text-gray-900">{patientData.length}</span> results
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
                                    {[...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => paginate(index + 1)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                                                ${currentPage === index + 1
                                                    ? 'bg-[#14B8A6] text-white shadow-sm'
                                                    : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
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
