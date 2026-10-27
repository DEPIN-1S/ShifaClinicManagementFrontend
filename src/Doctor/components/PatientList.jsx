import AuthImage from "../../components/AuthImage";
import React, { useState } from "react";
import { Search, Clock, CheckCircle, Stethoscope, User, Plus, Pencil, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { BASE_URL } from "../../services/baseURL";

export default function PatientList({ patients, activeTab, onTabChange, onStartNew, onSelectPatient }) {
    const navigate = useNavigate();
    const [previewImage, setPreviewImage] = useState(null); // [NEW]

    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        return `${BASE_URL}/${finalPath}`;
    };

    return (
        <>
            {/* Page Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Consultations</h1>
                    <p className="text-gray-500 mt-1">View waiting patients and manage consultations</p>
                </div>
                <button
                    onClick={onStartNew}
                    className="bg-[#14B8A6] hover:bg-teal-600 text-white px-5 text-sm py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-teal-900/10"
                >
                    <Plus size={20} />
                    Start New Consultation
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => onTabChange("Waiting")}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors
                        ${activeTab === "Waiting"
                            ? "bg-white text-slate-900 shadow-sm border border-gray-200"
                            : "text-gray-500 hover:text-slate-700"}`}
                >
                    <Clock size={16} className={activeTab === "Waiting" ? "text-slate-900" : ""} />
                    Waiting {activeTab === "Waiting" && `(${patients.length})`}
                </button>
                <button
                    onClick={() => onTabChange("Completed")}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors
                        ${activeTab === "Completed"
                            ? "bg-white text-slate-900 shadow-sm border border-gray-200"
                            : "text-gray-500 hover:text-slate-700"}`}
                >
                    <CheckCircle size={16} className={activeTab === "Completed" ? "text-slate-900" : ""} />
                    Completed {activeTab === "Completed" && `(${patients.length})`}
                </button>
            </div>

            {/* Patient List */}
            <div className="space-y-4">
                {patients.map((patient) => (
                    <div key={patient.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                            {/* Token Number */}
                            <div className="w-12 h-12 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-semibold text-lg  shrink-0">
                                {patient.token}
                            </div>

                            {/* Avatar Placeholder */}
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-[#14B8A6] transition-all"
                                onClick={() => patient.profilePhoto && setPreviewImage(getImageUrl(patient.profilePhoto))}
                            >
                                {patient.profilePhoto ? (
                                    <AuthImage
                                        src={getImageUrl(patient.profilePhoto)}
                                        alt={patient.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none'; // Hide broken image
                                            e.target.parentNode.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'text-gray-400'); // Restore placeholder style
                                            // We can't easily inject the icon back without React state, but hiding is better than broken img
                                        }}
                                    />
                                ) : (
                                    <User size={24} />
                                )}
                            </div>

                            {/* Patient Details */}
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-slate-900 text-lg">{patient.name}</h3>
                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">
                                        #{patient.patientId}
                                    </span>

                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>{patient.age}</span>
                                    <span>{patient.gender}</span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {patient.time}
                                    </span>
                                    {activeTab === "Completed" && (
                                        <span className="flex items-center gap-1 text-blue-700 font-medium bg-blue-50 px-2.5 py-1 rounded-full text-xs ml-2 border border-blue-100">
                                            <Stethoscope size={12} />
                                            {patient.doctorName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side Actions with CF Badge */}
                        <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            {/* CF Badge */}
                            {patient.CF && (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-bold border border-green-200 whitespace-nowrap">
                                    CF
                                </span>
                            )}

                            {activeTab === "Waiting" && (
                                <button
                                    onClick={() => onSelectPatient(patient)}
                                    className="flex-1 md:flex-none bg-[#14B8A6] hover:bg-teal-600 text-white px-5 text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-lg shadow-teal-900/10"
                                >
                                    {patient.status === "InConsultation" ? (
                                        <>
                                            <Stethoscope size={20} />
                                            Resume Consultation
                                        </>
                                    ) : (
                                        <>
                                            <Stethoscope size={20} />
                                            Start Consultation
                                        </>
                                    )}
                                </button>
                            )}
                            {activeTab === "Completed" && (
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => onSelectPatient(patient)}
                                        className="p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#14B8A6] transition-colors"
                                        title="Edit Consultation"
                                    >
                                        <Pencil size={20} />
                                    </button>
                                    <button
                                        onClick={() => navigate(`/doctor/consultation-details/${patient.id}`)}
                                        className="flex-1 md:flex-none border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {patients.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        No patients found in this list.
                    </div>
                )}
            </div>

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
        </>
    );
}
