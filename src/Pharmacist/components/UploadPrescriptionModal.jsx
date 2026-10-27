import React, { useState, useEffect } from 'react';
import { X, Upload, Search, User } from 'lucide-react';
import { searchPatientApi, uploadQuickPrescriptionApi } from '../../services/PharmacistAllApi';
import Swal from 'sweetalert2';

export default function UploadPrescriptionModal({ isOpen, onClose, onUploadSuccess, preSelectedPatient }) {
    const [searchKey, setSearchKey] = useState("");
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            if (droppedFile.size > 10 * 1024 * 1024) {
                Swal.fire("Warning", `File "${droppedFile.name}" exceeds 10MB limit.`, "warning");
                return;
            }
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(droppedFile.type)) {
                Swal.fire("Warning", "Invalid file type. Please upload PDF, JPG, or PNG.", "warning");
                return;
            }
            setFile(droppedFile);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (preSelectedPatient) {
                setSelectedPatient(preSelectedPatient);
                setSearchKey(preSelectedPatient.fullName || "");
            } else {
                setSearchKey("");
                setSelectedPatient(null);
            }
            setPatients([]);
            setShowDropdown(false);
            setFile(null);
            setIsUploading(false);
        }
    }, [isOpen, preSelectedPatient]);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                // Using receptionist or common search API. PharmacistApi has searchPatientApi? Yes, I checked PharmacistAllApi.js.
                const result = await searchPatientApi(`query=${searchKey}`);
                if (result.status === 200) {
                    const patientList = result.data.data || result.data || [];
                    setPatients(patientList);
                    setShowDropdown(true);
                }
            } catch (err) {
                console.error("Error searching patients:", err);
            }
        };

        const timer = setTimeout(() => {
            if (searchKey && !selectedPatient) {
                fetchPatients();
            } else if (!searchKey) {
                setPatients([]);
                setShowDropdown(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchKey, selectedPatient]);

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setSearchKey(patient.fullName);
        setShowDropdown(false);
    };

    const handleSearchChange = (e) => {
        setSearchKey(e.target.value);
        setSelectedPatient(null);
        setShowDropdown(true);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                Swal.fire("Warning", `File "${selectedFile.name}" exceeds 10MB limit.`, "warning");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!selectedPatient || !file) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Details',
                text: 'Please select a patient and upload a file.',
                confirmButtonColor: '#14B8A6'
            });
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("patientId", selectedPatient.id); // Using 'id' as per previous correction in Receptionist module
        formData.append("quickPrescription", file);

        try {
            const result = await uploadQuickPrescriptionApi(formData);

            if (result.data.success === true) {
                Swal.fire({
                    icon: 'success',
                    title: 'Upload Successful',
                    text: 'Prescription has been uploaded.',
                    confirmButtonColor: '#14B8A6'
                });
                if (onUploadSuccess) onUploadSuccess();
                onClose();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text: result.data?.message || 'Something went wrong!',
                    confirmButtonColor: '#EF4444'
                });
            }
        } catch (error) {
            console.error("Upload error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to upload prescription.',
                confirmButtonColor: '#EF4444'
            });
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm z-[1000]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 flex justify-between items-start border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Upload Prescription</h2>
                        <p className="text-sm text-gray-400 mt-1">Upload a prescription for a patient</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6 space-y-5">
                    {/* Select Patient (Search) */}
                    <div className="space-y-1.5 relative">
                        <label className="text-sm font-semibold text-slate-800">Select Patient</label>
                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-3 bg-teal-50/50 border border-teal-100 rounded-xl animate-in fade-in zoom-in duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#14B8A6] flex items-center justify-center text-white shrink-0 shadow-sm">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 leading-tight">{selectedPatient.fullName}</div>
                                        <div className="text-xs text-teal-700 font-medium mt-0.5">
                                            ID: {selectedPatient.uniqueId || selectedPatient.patientId} • {selectedPatient.mobile || selectedPatient.mobileNumber}
                                        </div>
                                    </div>
                                </div>
                                {!preSelectedPatient && (
                                    <button
                                        onClick={() => {
                                            setSelectedPatient(null);
                                            setSearchKey("");
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                        title="Change Patient"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchKey}
                                        onChange={handleSearchChange}
                                        placeholder="Search patient by name or ID..."
                                        className="w-full p-3 pr-10 bg-white border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                                    />
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>

                                {/* Search Results Dropdown */}
                                {showDropdown && patients.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {patients.map((patient) => (
                                            <div
                                                key={patient._id || patient.id}
                                                onClick={() => handleSelectPatient(patient)}
                                                className="p-3 hover:bg-teal-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-sm">
                                                        {patient.fullName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">{patient.fullName}</p>
                                                        <p className="text-xs text-gray-500">ID: {patient.patientId || patient.uniqueId} • {patient.mobile || patient.mobileNumber}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showDropdown && searchKey && patients.length === 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-center text-gray-500 text-sm">
                                        No patients found
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-800">Upload File</label>
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group relative ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50/50'
                                }`}
                            onClick={() => document.getElementById('fileInput').click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="fileInput"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Upload size={20} />
                            </div>
                            {file ? (
                                <div className="text-sm font-medium text-teal-600">
                                    {file.name}
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-500 mb-1">Drag & drop or click to upload</p>
                                    <p className="text-xs text-gray-400 mb-4">Supported: PDF, JPG, PNG (Max 10MB)</p>
                                    <button className="bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors">
                                        Choose File
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium text-sm hover:text-gray-800 transition-colors"
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="px-6 py-2 bg-[#14B8A6] hover:bg-teal-600 text-white rounded-lg font-medium text-sm shadow-lg shadow-teal-900/10 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <span className="animate-pulse">Uploading...</span>
                        ) : (
                            <>
                                <Upload size={16} />
                                Upload
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
