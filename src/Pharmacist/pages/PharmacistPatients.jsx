import AuthImage from "../../components/AuthImage";
import React, { useEffect, useState } from "react";
import PharmacistSidebar from "../components/PharmacistSidebar";
import { Search, Phone, ArrowRight, Menu, MoreVertical, User, X } from "lucide-react";
import { searchPatientApi } from "../../services/PharmacistAllApi";
import { calculateDetailedAge } from "../../utils/dateUtils";
import { BASE_URL } from "../../services/baseURL";

import PatientHistoryModal from "../components/PatientHistoryModal";

export default function PharmacistPatients() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [patientData, setPatientData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // Live search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (phoneNumber && phoneNumber.length >= 3) {
                const performSearch = async () => {
                    setLoading(true);
                    try {
                        const result = await searchPatientApi(`query=${phoneNumber}`);
                        if (result.status === 200 && result.data.data.length > 0) {
                            setPatientData(result.data.data);
                        } else {
                            setPatientData([]);
                        }
                    } catch (error) {
                        console.log(error);
                    } finally {
                        setLoading(false);
                    }
                }
                performSearch();
            } else {
                setPatientData([]);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [phoneNumber]);

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            <PharmacistSidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={toggleSidebar}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <main
                className={`flex-1 min-h-screen transition-all duration-300 ease-in-out p-6 lg:p-10
                   ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
               `}
            >
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

                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
                    <p className="text-gray-500 mt-1">Search for existing patients</p>
                </div>

                <div className="max-w-xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Search className="text-[#14B8A6]" size={24} />
                                Search Patient
                            </h2>
                            <p className="text-gray-500 mt-2 text-sm">
                                Enter the patient's phone number to search
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter patient's Phone / Name to search"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all text-gray-700 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Found Patients List */}
                        {patientData.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Found Patients</h3>
                                <div className="space-y-3">
                                    {patientData.map((patient) => (
                                        <div
                                            key={patient.id}
                                            onClick={() => {
                                                setSelectedPatient(patient);
                                                setIsHistoryModalOpen(true);
                                            }}
                                            className="p-4 rounded-xl border border-gray-200 hover:border-[#14B8A6] hover:bg-teal-50/30 transition-all cursor-pointer flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-14 h-14 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold shrink-0 overflow-hidden relative border border-gray-100 cursor-pointer hover:border-[#14B8A6] transition-colors group-hover:scale-105 duration-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent opening history modal
                                                        if (patient.profilePhoto) {
                                                            const imgUrl = patient.profilePhoto.startsWith("http")
                                                                ? patient.profilePhoto
                                                                : `${BASE_URL}/uploads/${patient.profilePhoto}`;
                                                            setPreviewImage(imgUrl);
                                                        }
                                                    }}
                                                >
                                                    {patient.profilePhoto && patient.profilePhoto !== "null" ? (
                                                        <AuthImage
                                                            src={patient.profilePhoto.startsWith("http")
                                                                ? patient.profilePhoto
                                                                : `${BASE_URL}/uploads/${patient.profilePhoto}`}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                // Fallback if image fails to load, though we have 'User' in the else block, 
                                                                // disabling display lets the parent background show. 
                                                                // But we want the User icon. 
                                                                // For now just hide the broken image.
                                                            }}
                                                            alt={patient.fullName}
                                                            className="w-full h-full object-cover relative z-10"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full bg-teal-50 text-teal-600">
                                                            <User size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">{patient.fullName}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        ID: {patient.uniqueId} • {calculateDetailedAge(patient.dateOfBirth) || (patient.age + " years")} • {patient.mobile}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {phoneNumber.length >= 3 && patientData.length === 0 && !loading && (
                            <div className="mt-8 text-center text-gray-500">
                                No patients found.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <PatientHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                patient={selectedPatient}
            />

            {/* Profile Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
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
