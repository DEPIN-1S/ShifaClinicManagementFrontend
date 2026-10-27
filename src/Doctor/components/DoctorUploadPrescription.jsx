import AuthImage from "../../components/AuthImage";
import React, { useState, useEffect } from 'react';
import { X, Upload, Check, Search, Loader2, User, Camera } from 'lucide-react'; 
import { searchPatientApi, uploadQuickPrescriptionApi } from '../../services/DoctorAllApi';
import { BASE_URL } from '../../services/baseURL';
import Swal from 'sweetalert2';
import CameraCapture from './CameraCapture';

export default function DoctorUploadPrescription({ isOpen, onClose, onUploadSuccess, preSelectedPatient }) {
    const [patientSearch, setPatientSearch] = useState("");
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const dataURLtoFile = (dataurl, filename) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    // Handle pre-selected patient
    useEffect(() => {
        if (preSelectedPatient && isOpen) {
            setSelectedPatient(preSelectedPatient);
            setPatientSearch(preSelectedPatient.fullName);
            setShowDropdown(false);
        }
    }, [preSelectedPatient, isOpen]);

    useEffect(() => {
        const searchPatients = async () => {
            if (patientSearch.trim().length >= 2 && !selectedPatient) {
                setIsSearching(true);
                try {
                    const result = await searchPatientApi(`query=${patientSearch}`);
                    if (result.status === 200) {
                        setPatients(result.data.data || []);
                        setShowDropdown(true);
                    }
                } catch (err) {
                    console.error("Error searching patients", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setPatients([]);
                setShowDropdown(false);
            }
        };

        const debounceFn = setTimeout(searchPatients, 300);
        return () => clearTimeout(debounceFn);
    }, [patientSearch, selectedPatient]);

    useEffect(() => {
        if (!isOpen) {
            setPatientSearch("");
            setPatients([]);
            setSelectedPatient(null);
            setFile(null);
            setShowDropdown(false);
            setIsScanning(false);
        }
    }, [isOpen]);

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setPatientSearch(patient.fullName);
        setShowDropdown(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate Size
            if (selectedFile.size > 10 * 1024 * 1024) {
                Swal.fire("Warning", `File "${selectedFile.name}" exceeds 10MB limit.`, "warning");
                return;
            }

            // Validate Type
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(selectedFile.type)) {
                Swal.fire("Warning", "Only PDF, JPG, and PNG files are allowed.", "warning");
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
                text: 'Please select a patient and upload a prescription file.',
                confirmButtonColor: '#14B8A6'
            });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("patientId", selectedPatient.id);
        formData.append("quickPrescription", file);

        try {
            const result = await uploadQuickPrescriptionApi(formData);
            if (result.status === 200 || result.status === 201) {
                if (result.data.success === true || result.status === 201) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Upload Successful',
                        text: 'Prescription has been uploaded.',
                        confirmButtonColor: '#14B8A6'
                    });
                    onClose();
                    if (onUploadSuccess) onUploadSuccess();

                    // Reset form
                    setPatientSearch("");
                    setSelectedPatient(null);
                    setFile(null);
                } else {
                    throw new Error(result.data?.message || "Upload failed");
                }
            }
        } catch (err) {
            console.error("Upload error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: err.response?.data?.message || 'Failed to upload prescription. Please try again.',
                confirmButtonColor: '#EF4444'
            });
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        if (finalPath.startsWith('uploads/') || finalPath.startsWith('Uploads/')) {
            // Already includes uploads/
        } else {
            finalPath = `uploads/${finalPath}`;
        }
        return `${BASE_URL}/${finalPath}`;
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
                    {/* Patient identity or Search */}
                    <div className="space-y-1.5 relative">
                        <label className="text-sm font-semibold text-slate-800">
                            Select Patient
                        </label>

                        {selectedPatient ? (
                            <div className="relative group">
                                <div className="flex items-center gap-3 p-3 bg-teal-50/50 border border-teal-100 rounded-xl pr-10 transition-colors hover:border-teal-200">
                                    <div className="w-10 h-10 rounded-full bg-[#14B8A6] flex items-center justify-center text-white shrink-0 overflow-hidden border border-teal-200 shadow-sm">
                                        {selectedPatient.profilePhoto ? (
                                            <AuthImage
                                                src={getImageUrl(selectedPatient.profilePhoto)}
                                                alt={selectedPatient.fullName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 leading-tight">{selectedPatient.fullName}</div>
                                        <div className="text-xs text-teal-700 font-medium">{selectedPatient.uniqueId} • {selectedPatient.mobile}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedPatient(null);
                                        setPatientSearch("");
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    title="Remove patient"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search patient by name or ID..."
                                        value={patientSearch}
                                        onChange={(e) => {
                                            setPatientSearch(e.target.value);
                                            if (selectedPatient) setSelectedPatient(null);
                                        }}
                                        className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium
                                            ${selectedPatient ? 'border-teal-500 bg-teal-50/30' : 'border-gray-200'}
                                        `}
                                    />
                                    {isSearching && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-600" size={18} />
                                    )}
                                </div>

                                {/* Dropdown Results */}
                                {showDropdown && patients.length > 0 && !selectedPatient && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                                        {patients.map(patient => (
                                            <div
                                                key={patient.id}
                                                onClick={() => handleSelectPatient(patient)}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-[#14B8A6] shrink-0 overflow-hidden border border-teal-100">
                                                    {patient.profilePhoto ? (
                                                        <AuthImage
                                                            src={getImageUrl(patient.profilePhoto)}
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' }}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User size={16} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800 leading-tight">{patient.fullName}</div>
                                                    <div className="text-xs text-gray-500">{patient.uniqueId} • {patient.mobile}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showDropdown && patients.length === 0 && patientSearch.length >= 2 && !isSearching && !selectedPatient && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-center text-sm text-gray-400 z-10">
                                        No patients found.
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-800">Prescription File</label>
                            {!file && (
                                <button 
                                    onClick={() => setIsScanning(true)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-[#14B8A6] hover:text-teal-700 transition-colors uppercase tracking-wider"
                                >
                                    <Camera size={14} /> Scan Paper
                                </button>
                            )}
                        </div>
                        
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group
                                ${file ? 'border-teal-500 bg-teal-50/20' : 'border-gray-200 hover:bg-gray-50/50'}
                            `}
                            onClick={() => document.getElementById('file-upload').click()}
                        >
                            <input
                                id="file-upload"
                                type="file"
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110
                                ${file ? 'bg-teal-100 text-teal-600' : 'bg-gray-50 text-gray-400'}
                            `}>
                                {file ? <Check size={20} /> : <Upload size={20} />}
                            </div>
                            <p className="text-sm text-gray-500 mb-1">
                                {file ? file.name : 'Drag & drop or click to upload'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Supported: PDF, JPG, PNG (Max 10MB)
                            </p>
                            {!file && (
                                <span className="bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm group-hover:bg-gray-50 transition-colors">
                                    Choose File
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {isScanning && (
                    <CameraCapture 
                        onCapture={(image) => {
                            const scannedFile = dataURLtoFile(image, `Scan_${new Date().getTime()}.jpg`);
                            setFile(scannedFile);
                            setIsScanning(false);
                        }}
                        onCancel={() => setIsScanning(false)}
                    />
                )}

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium text-sm hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        className="px-6 py-2 bg-[#14B8A6] hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm shadow-lg shadow-teal-900/10 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        Upload
                    </button>
                </div>
            </div>
        </div>
    );
}
