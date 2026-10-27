import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { Users, UserCheck, Stethoscope, Menu, HeartPulse, UsersRound, UserRoundCheck, Ticket, Wallet, UserPlus, FlaskConical, Pill } from "lucide-react";
import { TbActivityHeartbeat } from "react-icons/tb";
import { FaUsers } from "react-icons/fa6";
import { HiOutlineUserGroup } from "react-icons/hi";
import { fetchUsersApi, fetchDashboardStatsApi } from "../../services/adminAllApi";

export default function AdminDashboard() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
    const [userData, setUserData] = useState([])
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalUsers: 0,
        totalCF: 0,
        tokensToday: 0,
        newPatients: 0,
        pharmacyRevenueToday: 0,
        labRevenueToday: 0
    });


    //for user length
    const fetchUsers = async () => {
        try {
            const result = await fetchUsersApi();
            console.log("result:::", result);
            setUserData(result.data.data);
        }
        catch (error) {
            console.log(error);
        }
    }

    const fetchDashboardStats = async () => {
        try {
            const result = await fetchDashboardStatsApi();
            console.log("dashboard stats result:::", result);
            if (result.status === 200) {
                setStats(result.data.data);
            }
        } catch (error) {
            console.log(error);
        }
    }



    useEffect(() => {
        fetchUsers();
        fetchDashboardStats();
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            {/* Sidebar */}
            <AdminSidebar
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of clinic performance and staff</p>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Total Patients</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalPatients}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                            <HeartPulse size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Tokens Generated</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.tokensToday}</p>
                            <p className="text-xs text-gray-400 mt-1">Today</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                            <Ticket size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">New Patients</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.newPatients}</p>
                            <p className="text-xs text-gray-400 mt-1">Today</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                            <UserPlus size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Consultation Fees</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCF}</p>
                            <p className="text-xs text-gray-400 mt-1">Today</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                            <Wallet size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalUsers}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                            <HiOutlineUserGroup size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Total Revenue (Lab)</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">₹ {stats.labRevenueToday}</p>
                            <p className="text-xs text-gray-400 mt-1">Today</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-[#14B8A6] flex items-center justify-center">
                            <FlaskConical size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Total Revenue (Pharmacy)</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">₹ {stats.pharmacyRevenueToday}</p>
                            <p className="text-xs text-gray-400 mt-1">Today</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <Pill size={20} />
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
