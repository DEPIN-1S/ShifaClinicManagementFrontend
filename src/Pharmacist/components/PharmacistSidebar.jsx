import React, { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Pill,
    Users,
    History,
    AlertCircle,
    Menu,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Activity,
    Zap
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from '../../assets/logo.png'
import Swal from 'sweetalert2';

export default function PharmacistSidebar({ isCollapsed, toggleCollapse, mobileOpen, setMobileOpen }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [userData, setUserData] = useState({ name: "Pharmacist", role: "Pharmacist" });

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUserData({
                    name: parsedUser.fullName || "Pharmacist",
                    role: parsedUser.role || "Pharmacist"
                });
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    const navItems = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/pharmacist-dashboard" },
        { name: "Prescriptions", icon: Pill, path: "/pharmacist/prescriptions" },
        { name: "Patients", icon: Users, path: "/pharmacist/patients" },
        { name: "Quick Prescription", icon: Zap, path: "/pharmacist/quick-prescription" },
    ];

    const handleLogout = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out of your account.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Logout'
        }).then((result) => {
            if (result.isConfirmed) {
                sessionStorage.clear();
                navigate('/');
            }
        });
    }

    return (
        <>
            {/* Mobile Menu Button & Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed top-0 left-0 h-screen bg-[#0F172A] text-white transition-all duration-300 ease-in-out z-50 
            ${isCollapsed ? "w-20" : "w-64"} 
            ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
            >
                <div className="flex flex-col h-full relative">
                    {/* Logo Section */}
                    <div className={`p-6 flex items-center ${isCollapsed ? "justify-center px-2" : "gap-4"}`}>
                        <div className="h-auto w-11" >
                            <img src={logo} alt="" />
                        </div>

                        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
                            <h1 className="font-bold text-lg whitespace-nowrap">Shifa Clinic</h1>
                            <p className="text-xs text-gray-400 whitespace-nowrap">Pharmacy Panel</p>
                        </div>
                    </div>

                    {/* User Profile Section */}
                    <div className={`mx-4 mb-6 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center transition-all duration-300 ${isCollapsed ? "justify-center px-2" : "gap-3"}`}>
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border-2 border-slate-600 text-sm font-semibold">
                            PH
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
                            <h3 className="text-sm font-medium whitespace-nowrap">{userData.name}</h3>
                            <p className="text-xs text-gray-400 whitespace-nowrap">{userData.role}</p>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 px-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => navigate(item.path)}
                                    title={isCollapsed ? item.name : ""}
                                    className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group
                            ${isActive
                                            ? "bg-[#14B8A6] text-white shadow-lg shadow-teal-900/20"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white"}
                            ${isCollapsed ? "justify-center px-2" : "gap-3"}
                        `}
                                >
                                    <item.icon size={20} className={`shrink-0 ${isActive ? "text-white" : "group-hover:text-white"}`} />
                                    <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
                                        {item.name}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer / Toggle & Logout */}
                    <div className="p-4 border-t border-white/5 space-y-2">
                        <button
                            onClick={toggleCollapse}
                            className={`hidden lg:flex w-full items-center p-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all
                        ${isCollapsed ? "justify-center px-2" : "gap-3"}
                    `}
                        >
                            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
                                Collapse
                            </span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all
                        ${isCollapsed ? "justify-center px-2" : "gap-3"}
                    `}
                            title="Logout"
                        >
                            <LogOut size={20} />
                            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
                                Logout
                            </span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
