import AuthImage from "../../components/AuthImage";
import React, { useState, useEffect } from "react";
import PharmacistSidebar from "../components/PharmacistSidebar";
import { getPharmacistDashboardStatsApi, getPharmacistPrescriptionsApi } from "../../services/PharmacistAllApi";
import ViewPrescriptionModal from "../components/ViewPrescriptionModal";
import { Search, Plus, Pill, AlertTriangle, Package, Menu, Clock, CheckCircle, Eye, Stethoscope, User } from "lucide-react";
import { BASE_URL } from "../../services/baseURL";

export default function PharmacistDashboard() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [stats, setStats] = useState({
        prescriptionsToday: 0,
        pending: 0,
        completed: 0
    });
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrescription, setSelectedPrescription] = useState(null);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    useEffect(() => {
        fetchStats();
        fetchPendingPrescriptions();
    }, []);

    const fetchStats = async () => {
        try {
            const result = await getPharmacistDashboardStatsApi();
            if (result.status === 200) {
                setStats(result.data.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    };

    const fetchPendingPrescriptions = async () => {
        try {
            setLoading(true);
            const result = await getPharmacistPrescriptionsApi('Pending');
            if (result.status === 200) {
                setPrescriptions(result.data.data);
            }
        } catch (error) {
            console.error("Error fetching pending prescriptions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPrescription = (prescription) => {
        setSelectedPrescription(prescription);
    };

    const handleDispenseSuccess = () => {
        fetchStats();
        fetchPendingPrescriptions();
        setSelectedPrescription(null); // Close modal on success if desired, or keep open
    };

    const formatDate = (dateString) => {
        if (!dateString) return "--";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateAge = (dob) => {
        if (!dob) return "--";
        const birthday = new Date(dob);
        const ageDifMs = Date.now() - birthday.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            {/* Sidebar - Controlled by Dashboard state */}
            <PharmacistSidebar
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
                        <h1 className="text-3xl font-bold text-slate-900">Pharmacist Dashboard</h1>
                        <p className="text-gray-500 mt-1">Welcome back, get an overview of your activity</p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/pharmacist/prescriptions'}
                        className="bg-[#14B8A6] hover:bg-teal-600 text-white px-5 text-sm py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-teal-900/10">
                        <Plus size={20} />
                        View all prescriptions
                    </button>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Total Prescriptions Today</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.prescriptionsToday}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                            <Pill size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.pending}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.completed}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                </div>

                {/* Pending Prescriptions Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Pending Prescriptions</h2>
                            <p className="text-sm text-gray-500">List of prescriptions waiting to be dispensed</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Token</th>
                                    <th className="px-6 py-4">Profile</th>
                                    <th className="px-6 py-4">Patient Name</th>
                                    <th className="px-6 py-4">Gender</th>
                                    <th className="px-6 py-4">Age</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Doctor</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                            Loading pending prescriptions...
                                        </td>
                                    </tr>
                                ) : prescriptions.length > 0 ? (
                                    prescriptions.slice(0, 6).map((prescription) => (
                                        <tr
                                            key={prescription.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="w-12 h-12 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-semibold text-lg shadow-sm">
                                                    {prescription.tokenNumber}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center overflow-hidden border border-gray-100">
                                                    {prescription.Patient?.profilePhoto ? (
                                                        <AuthImage
                                                            src={prescription.Patient.profilePhoto.startsWith("http")
                                                                ? prescription.Patient.profilePhoto
                                                                : `${BASE_URL}/uploads/${prescription.Patient.profilePhoto}`}
                                                            onError={(e) => { e.target.style.opacity = '0' }}
                                                            alt={prescription.Patient.fullName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User size={24} />
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h3 className="font-bold text-slate-900 text-base">{prescription.Patient?.fullName || "--"}</h3>
                                                        {prescription.Patient?.uniqueId && (
                                                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-100 uppercase tracking-wide">
                                                                #{prescription.Patient.uniqueId}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400">{prescription.Patient?.location || ""}</div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {prescription.Patient?.sex || "--"}
                                            </td>
                                            <td className="px-6 py-4">
                                                {calculateAge(prescription.Patient?.dateOfBirth)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatDate(prescription.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs">
                                                        <Stethoscope size={12} />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">Dr. {prescription.Doctor?.fullName || "--"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100">
                                                    <Clock size={12} />
                                                    Pending
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            No pending prescriptions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* View/Dispense Prescription Modal */}
            {selectedPrescription && (
                <ViewPrescriptionModal
                    prescription={selectedPrescription}
                    onClose={() => setSelectedPrescription(null)}
                    onDispenseSuccess={handleDispenseSuccess}
                />
            )}
        </div>
    );
}
