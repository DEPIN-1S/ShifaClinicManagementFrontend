import AuthImage from "../../components/AuthImage";
import React, { useEffect, useState } from "react";
import DoctorSidebar from "../components/DoctorSidebar";
import { Search, Plus, Calendar, Clock, User, FileText, Menu, Users, Stethoscope, UserCheck, X, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FaPeopleGroup } from "react-icons/fa6";
import { fetchPatientsApi, fetchDashboardCountsApi } from "../../services/DoctorAllApi";
import { BASE_URL } from "../../services/baseURL";

export default function DoctorDashboard() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
    const navigate = useNavigate();
    const [patientList, setPatientList] = useState([])
    const [previewImage, setPreviewImage] = useState(null); // [NEW]
    const [dashboardCounts, setDashboardCounts] = useState({
        waiting: 0,
        inConsultation: 0,
        underConsultation: 0,
        completed: 0
    })

    // Mock Patient Data
    const recentVisits = [
        {
            id: 1,
            name: "John Doe",
            mobile: "9876543210",
            time: "09:00 AM",
            type: "Checkup",
            status: "Waiting",
        },
        {
            id: 2,
            name: "Jane Smith",
            mobile: "9876543211",
            time: "10:30 AM",
            type: "Follow-up",
            status: "Confirmed",
        },
        {
            id: 3,
            name: "Michael Brown",
            mobile: "9876543212",
            time: "11:45 AM",
            type: "Consultation",
            status: "Completed",
        },
    ];


    const fetchPatients = async () => {
        try {
            const result = await fetchPatientsApi();
            console.log(result);
            setPatientList(result.data.data?.slice(0, 5) || [])
        }
        catch (error) {
            console.log(error);
        }
    }

    const fetchDashboardCounts = async () => {
        try {
            const result = await fetchDashboardCountsApi();
            if (result.status === 200) {
                setDashboardCounts(result.data.data)
            }
            console.log("result for dashboard counts::", result);
        }
        catch (error) {
            console.log(error);
        }
    }

    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        return `${BASE_URL}/${finalPath}`;
    };

    useEffect(() => {
        fetchPatients();
        fetchDashboardCounts()
    }, [])

    const getDisplayAge = (patient) => {
        if (!patient) return "";
        if (patient.age > 0) return `${patient.age} Years`;
        if (!patient.dateOfBirth) return "0";

        const birthDate = new Date(patient.dateOfBirth);
        const today = new Date();
        const diffTime = today - birthDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) return `${diffDays} Days`;

        let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
        if (today.getDate() < birthDate.getDate()) months--;

        return `${months} Months`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            {/* Sidebar - Controlled by Dashboard state */}
            <DoctorSidebar
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
                        <h1 className="text-3xl font-bold text-slate-900">Patient Appointments</h1>
                        <p className="text-gray-500 mt-1">Manage today's schedule</p>
                    </div>
                    <button
                        onClick={() => navigate('/doctor/consultations')}
                        className="bg-[#14B8A6] hover:bg-teal-600 text-white px-5 text-sm py-2.5 rounded-lg flex items-center gap-2 font-medium  transition-colors shadow-lg shadow-teal-900/10"
                    >
                        <Stethoscope size={20} />
                        View Consultation
                    </button>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Total Patients</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {(dashboardCounts.waiting || 0) +
                                    (dashboardCounts.completed || 0) +
                                    (dashboardCounts.underConsultation || 0)}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                            <FaPeopleGroup size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">To Consult</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{dashboardCounts.waiting || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Under Consultation</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {dashboardCounts.underConsultation || 0}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                            <Activity size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Completed Today</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{dashboardCounts.completed || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center">
                            <UserCheck size={20} />
                        </div>
                    </div>
                </div>


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
                                    {/* <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th> */}
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {patientList.map((Patient) => (
                                    <tr key={Patient.PatientId} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-10 h-10 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-semibold">
                                                {Patient.tokenNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-15 h-15 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-[#14B8A6] transition-all"
                                                onClick={() => Patient.Patient.profilePhoto && setPreviewImage(getImageUrl(Patient.Patient.profilePhoto))}
                                            >
                                                {Patient.Patient.profilePhoto ? (
                                                    <AuthImage
                                                        src={getImageUrl(Patient.Patient.profilePhoto)}
                                                        alt={Patient.Patient.fullName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentNode.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'text-gray-400');
                                                        }}
                                                    />
                                                ) : (
                                                    <User size={18} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                            <div className="flex items-center gap-2">
                                                {Patient.Patient.fullName}
                                                {Patient.Patient.CF && (
                                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200">
                                                        CF
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 font-normal">{Patient.Patient.uniqueId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {Patient.Patient.sex}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {getDisplayAge(Patient.Patient)}
                                        </td>
                                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {visit.doctor}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center gap-2">
                                            <Clock size={14} /> {visit.time}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button className="text-[#14B8A6] hover:text-teal-700 font-medium text-sm">View Token</button>
                                        </td> */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {(() => {
                                                const status = Patient.status || "Waiting";

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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
                    <div className="relative animate-in zoom-in-50 duration-300" onClick={e => e.stopPropagation()}>
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
