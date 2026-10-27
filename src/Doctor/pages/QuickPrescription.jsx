import AuthImage from "../../components/AuthImage";
import React, { useState, useEffect } from 'react';
import DoctorSidebar from '../components/DoctorSidebar';
import { Menu, Zap, Plus, Search, User, Loader2 } from 'lucide-react';
import DoctorUploadPrescription from '../components/DoctorUploadPrescription';
import { searchPatientApi } from '../../services/DoctorAllApi';
import { BASE_URL } from "../../services/baseURL";

const QuickPrescription = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);

    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        return `${BASE_URL}/${finalPath}`;
    };

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const handleSearch = async () => {
        if (searchQuery.trim().length >= 2) {
            setLoading(true);
            try {
                const result = await searchPatientApi(`query=${searchQuery}`);
                if (result.status === 200) {
                    setPatients(result.data.data || []);
                }
            } catch (error) {
                console.error("Error searching patients:", error);
            } finally {
                setLoading(false);
            }
        } else {
            setPatients([]);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(handleSearch, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handlePatientClick = (patient) => {
        setSelectedPatient(patient);
        setIsUploadModalOpen(true);
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
                            Quick Prescription
                        </h1>
                        <p className="text-gray-500 mt-1">Search patient to upload a prescription</p>
                    </div>

                </div>

                {/* Search Bar */}


                {/* Patients List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-[#14B8A6]" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {patients.length > 0 ? (
                            patients.map((patient) => (
                                <div
                                    key={patient.id}
                                    onClick={() => handlePatientClick(patient)}
                                    className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-[#14B8A6]/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-[#14B8A6] group-hover:text-white transition-all border border-gray-100 group-hover:border-transparent">
                                            {patient.profilePhoto ? (
                                                <AuthImage
                                                    src={getImageUrl(patient.profilePhoto)}
                                                    alt={patient.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User size={24} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900 text-lg group-hover:text-[#14B8A6] transition-colors">
                                                {patient.fullName}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">
                                                    #{patient.uniqueId}
                                                </span>
                                                <span className="text-gray-400 text-sm">{patient.mobile}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-sm text-gray-500">{patient.sex} • {patient.age ? `${patient.age}y` : 'N/A'}</span>
                                        <div className="text-[#14B8A6] font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus size={16} />
                                            Upload
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : searchQuery.length >= 2 ? (
                            <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-400">No patients found matching "{searchQuery}"</p>
                            </div>
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-[#14B8A6] mb-6">
                                    <Zap size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Upload New Prescription</h3>
                                <p className="text-gray-500 max-w-md text-center mb-8">
                                    Upload a quick prescription for any patient. You can search for the patient in the next step.
                                </p>
                                <button
                                    onClick={() => {
                                        setSelectedPatient(null);
                                        setIsUploadModalOpen(true);
                                    }}
                                    className="bg-[#14B8A6] text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-teal-900/20 hover:bg-teal-600 transition-all flex items-center gap-2 transform hover:scale-105"
                                >
                                    <Plus size={20} />
                                    Upload Quick Prescription
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <DoctorUploadPrescription
                    isOpen={isUploadModalOpen}
                    onClose={() => {
                        setIsUploadModalOpen(false);
                        setSelectedPatient(null);
                    }}
                    preSelectedPatient={selectedPatient}
                    onUploadSuccess={() => {
                        console.log("Prescription uploaded");
                        setSearchQuery("");
                        setPatients([]);
                    }}
                />
            </main>
        </div>
    );
};

export default QuickPrescription;
