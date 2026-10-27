import AuthImage from "../../components/AuthImage";
import React, { useState, useEffect } from "react";
import { searchPatientApi, registerPatientApi, generateTokenApi, setFreeStatusApi } from "../../services/DoctorAllApi";
import { Search, User, X, Stethoscope, AlertCircle, ArrowRight, Activity, Calendar, Phone, ChevronRight, MoreVertical } from "lucide-react";
import PatientRegistrationForm from "../../Receptionist/components/PatientRegistrationForm";
import ConfirmPatientDetails from "../../Receptionist/components/ConfirmPatientDetails";
import PatientTokenSuccess from "../../Receptionist/components/PatientTokenSuccess";
import { calculateDetailedAge } from "../../utils/dateUtils";
import { BASE_URL } from "../../services/baseURL";




export default function StartConsultationModal({ isOpen, onClose, onStart, onRegistrationSuccess }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState('search'); // 'search' | 'form' | 'confirm_new' | 'success_new'
    const [registrationMobile, setRegistrationMobile] = useState('');
    const [activeMenuId, setActiveMenuId] = useState(null); // [NEW]
    const [isMobileLocked, setIsMobileLocked] = useState(false); // [NEW]

    // Search State
    const [searchResults, setSearchResults] = useState({ api: [] });

    // Registration Flow State
    const [regFormData, setRegFormData] = useState(null);
    const [regPatientId, setRegPatientId] = useState(null);
    const [successTokenData, setSuccessTokenData] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState("Payable"); // [NEW] Default Payable

    // Live search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery && searchQuery.length >= 1) {
                const performSearch = async () => {
                    try {
                        const result = await searchPatientApi(`query=${searchQuery}`);
                        if (result.status === 200 && result.data.data) {
                            const apiPatients = result.data.data;
                            // Remove duplicates from API results based on _id
                            // Remove duplicates from API results based on id
                            const uniqueApiPatients = Array.from(new Set(apiPatients.map(a => a.id)))
                                .map(id => apiPatients.find(a => a.id === id));

                            setSearchResults({ api: uniqueApiPatients });
                        } else {
                            setSearchResults({ api: [] });
                        }
                    } catch (error) {
                        console.error(error);
                        setSearchResults({ api: [] });
                    }
                }
                performSearch();
            } else {
                setSearchResults({ api: [] });
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);


    if (!isOpen) return null;

    const handlePatientSelect = (patient) => {
        console.log("Selected API patient:", patient);

        // Use the payment status from the API directly
        setPaymentStatus(patient.paymentStatus || "Payable");


        setRegFormData({
            fullName: patient.fullName,
            dateOfBirth: patient.dateOfBirth,
            sex: patient.sex,
            mobile: patient.mobile,
            uniqueId: patient.uniqueId,
            profilePhoto: patient.profilePhoto
        });
        setRegPatientId(patient._id || patient.id); // Use MongoDB ID for token generation
        setView('confirm_new');
    };


    const handleClose = () => {
        onClose();
        setSearchQuery("");
        setSearchResults({ api: [] });
        setView('search');
        setRegFormData(null);
        setRegPatientId(null);
        setSuccessTokenData(null);
    };

    const handleRegisterNew = () => {
        // If search query looks like phone number, use it
        const isPhone = /^\d+$/.test(searchQuery);
        if (isPhone) {
            setRegistrationMobile(searchQuery);
            setIsMobileLocked(false); // Allow editing if they typed it manually
        } else {
            setRegistrationMobile('');
            setIsMobileLocked(false);
        }
        setView('form');
    };

    const handleRegistrationComplete = (result, data) => {
        // result is the API response from patient registration
        console.log("Registration Complete in Modal:", result, data);
        const pId = result.data._id || result.data.data?._id || result.data.id || result.data.data?.id;
        const uniqueId = result.data.uniqueId || result.data.data?.uniqueId;
        const backendProfilePhoto = result.data.profilePhoto || result.data.data?.profilePhoto;

        setRegFormData({
            ...data,
            uniqueId,
            profilePhoto: backendProfilePhoto || data.profilePhoto
        });
        setRegPatientId(pId);
        setView('confirm_new');

        if (onRegistrationSuccess) {
            onRegistrationSuccess();
        }
    };

    const handleTokenGenerated = (tokenData) => {
        // Called when ConfirmPatientDetails successfully generates a token
        setSuccessTokenData(tokenData);
        setView('success_new');
        // Refresh the dashboard list immediately so the new token shows up
        if (onRegistrationSuccess) {
            onRegistrationSuccess();
        }
    }

    // handleSuccessAction removed as we now just close the modal


    // Helper to calculate age
    const calculateAge = (dob) => {
        if (!dob) return "N/A";
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Helper to get image URL
    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        return `${BASE_URL}/${finalPath}`;
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm z-[1000]">
            <div className={`bg-white rounded-2xl shadow-xl w-full ${view === 'search' ? 'max-w-lg' : 'max-w-2xl'} overflow-hidden animate-in fade-in zoom-in duration-200 transition-all`}>
                {/* ... existing code ... */}

                {/* ... confirm and success views ... */}
                {view === 'form' && (
                    <PatientRegistrationForm
                        initialData={{ mobile: registrationMobile }}
                        isMobileLocked={isMobileLocked}
                        onCancel={() => setView('search')}
                        onSubmit={handleRegistrationComplete}
                        registerApi={registerPatientApi}
                    />
                )}

                {view === 'confirm_new' && regFormData && (
                    <ConfirmPatientDetails
                        formData={regFormData}
                        patientId={regPatientId}
                        onCancel={() => setView('search')}
                        onConfirm={handleTokenGenerated}
                        isNested={true}
                        tokenApi={generateTokenApi}
                        paymentStatus={paymentStatus} // Pass calculated status
                        freeStatusApi={setFreeStatusApi}
                    />
                )}

                {view === 'success_new' && (
                    <div className="p-6">
                        <PatientTokenSuccess
                            onReset={handleClose}
                            patientData={regFormData}
                            successData={successTokenData}
                            tokenNumber={successTokenData?.["Token Number"]}
                            actionLabel="Back to Dashboard"
                        />
                    </div>
                )}

                {view === 'search' && (
                    <>
                        {/* ... search input ... */}
                        <div className="p-6 h-[500px] flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-2 text-[#14B8A6]">
                                    <Stethoscope size={24} />
                                    <h2 className="text-xl font-bold text-slate-900">Start Consultation</h2>
                                </div>
                                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <p className="text-gray-500 text-sm mb-4">Search for an existing patient by phone number or Patient ID.</p>

                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all"
                                    placeholder="Enter phone number..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setSearchQuery(val);
                                    }}
                                    autoFocus
                                />
                            </div>



                            {/* Search Results */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {searchQuery.length > 0 ? (
                                    <div className="space-y-4">
                                        {searchResults.api?.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">All Patients</h3>
                                                {searchResults.api.map((patient) => {
                                                    const pId = patient._id || patient.id;
                                                    return (
                                                        <div
                                                            key={`api-${pId}`}
                                                            onClick={() => handlePatientSelect(patient)}
                                                            className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group mb-2"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#14B8A6]/10 group-hover:text-[#14B8A6] transition-colors overflow-hidden border border-gray-100">
                                                                        {patient.profilePhoto ? (
                                                                            <AuthImage
                                                                                src={getImageUrl(patient.profilePhoto)}
                                                                                alt={patient.fullName}
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.querySelector('svg').style.display = 'block'; }}
                                                                            />
                                                                        ) : (
                                                                            <User size={20} />
                                                                        )}
                                                                        <User size={20} className="hidden" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="font-semibold text-slate-900">{patient.fullName}</h3>
                                                                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-amber-100">
                                                                                #{patient.uniqueId}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                                            {calculateDetailedAge(patient.dateOfBirth)} • {patient.sex} • <span className="font-mono">{patient.mobile}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="relative">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveMenuId(activeMenuId === pId ? null : pId);
                                                                            }}
                                                                            className="p-2 text-gray-300 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors"
                                                                        >
                                                                            <MoreVertical size={18} />
                                                                        </button>
                                                                        {/* Context Menu */}
                                                                        {activeMenuId === pId && (
                                                                            <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-200">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setRegistrationMobile(patient.mobile);
                                                                                        setIsMobileLocked(true);
                                                                                        setActiveMenuId(null);
                                                                                        setView('form');
                                                                                    }}
                                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#14B8A6] font-medium transition-colors"
                                                                                >
                                                                                    Register new patient
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setActiveMenuId(null);
                                                                                    }}
                                                                                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>

                                                                        )}
                                                                    </div>
                                                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-[#14B8A6] transition-colors" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {searchResults.api?.length === 0 && (
                                            <div className="text-center py-8 text-gray-400">
                                                <p>No patients found matching "{searchQuery}"</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-300">
                                        <Search size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>Type to search for patients</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Register New Patient Button */}
                        {searchQuery.length >= 10 && searchResults.api?.length === 0 && (
                            <div className="px-6 pb-6">
                                <button
                                    onClick={handleRegisterNew}
                                    className="w-full py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group bg-[#14B8A6] hover:bg-teal-600 text-white shadow-teal-900/10"
                                >
                                    <User size={18} />
                                    Register New Patient
                                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    );
}
