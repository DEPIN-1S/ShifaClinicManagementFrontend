import AuthImage from "../../components/AuthImage";
import React, { useState, useEffect } from 'react';
import { X, Upload, ChevronDown, Search, User, Check, FileText } from 'lucide-react';
import { BASE_URL } from "../../services/baseURL";
import { searchPatientApi, uploadQuickDocumentApi } from '../../services/receptionistAllApi';
import Swal from 'sweetalert2';

export default function UploadDocumentModal({ isOpen, onClose, onUploadSuccess }) {
    const [searchKey, setSearchKey] = useState("");
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    // const [documentType, setDocumentType] = useState("");
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        return `${BASE_URL}/${finalPath}`;
    };

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
            // Check file type if strict about extensions (optional but good practice)
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(droppedFile.type)) {
                Swal.fire("Warning", "Invalid file type. Please upload PDF, JPG, or PNG.", "warning");
                return;
            }

            setFile(droppedFile);
            setFileName(droppedFile.name);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setSearchKey("");
            setPatients([]);
            setSelectedPatient(null);
            setShowDropdown(false);
            // setDocumentType("");
            setFile(null);
            setFileName("");
            setIsUploading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const result = await searchPatientApi(`query=${searchKey}`);
                if (result.status === 200) {
                    // Handle response structure from receptionist API (result.data.data)
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
        setSearchKey(patient.fullName); // Assuming patient object has fullName
        setShowDropdown(false);
    };

    const handleSearchChange = (e) => {
        setSearchKey(e.target.value);
        setSelectedPatient(null); // Clear selection if user types again
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
            const nameWithoutExtension = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
            setFileName(nameWithoutExtension);
        }
    };

    const handleUpload = async () => {
        console.log("selected patient", selectedPatient);
        if (!selectedPatient || !file) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Details',
                text: 'Please select a patient and upload a file.',
                confirmButtonColor: '#14B8A6'
            });
            return;
        }

        if (!fileName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Details',
                text: 'Please enter a file name.',
                confirmButtonColor: '#14B8A6'
            });
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("patientId", selectedPatient.id); // Updated to use 'id' instead of 'uniqueId' per user request
        // formData.append("documentType", documentType);
        const extension = file.name.split('.').pop();
        const finalFileName = `${fileName}.${extension}`;
        formData.append("quickDocument", file, finalFileName);
        formData.append("fileName", finalFileName);

        try {
            const result = await uploadQuickDocumentApi(formData);
            const payload = result?.data;
            if (payload?.success === true) {
                Swal.fire({
                    icon: 'success',
                    title: 'Upload Successful',
                    text: 'Patient document has been uploaded.',
                    confirmButtonColor: '#14B8A6'
                });
                if (onUploadSuccess) onUploadSuccess();
                onClose();
            } else {
                const status = result?.response?.status;
                const serverMessage = result?.response?.data?.message || payload?.message;
                const text = status === 413
                    ? "This file is too large. Please use a file under 10 MB."
                    : serverMessage || "Failed to upload document.";
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text,
                    confirmButtonColor: '#EF4444'
                });
            }
        } catch {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to upload document.',
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
                        <h2 className="text-xl font-bold text-slate-900">Upload Document</h2>
                        <p className="text-sm text-gray-400 mt-1">Upload a scan, X-ray, or report for a patient</p>
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
                    <div className="space-y-3 relative">
                        <label className="text-sm font-semibold text-slate-800">Select Patient</label>

                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-3 bg-teal-50/50 border border-teal-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#14B8A6] flex items-center justify-center text-white shrink-0">
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
                                        <div className="text-xs text-teal-700 font-medium">ID: {selectedPatient.patientId || selectedPatient.uniqueId} • {selectedPatient.mobile || selectedPatient.mobileNumber}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedPatient(null);
                                        setSearchKey("");
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
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
                        )}

                        {/* Search Results Dropdown */}
                        {showDropdown && !selectedPatient && patients.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {patients.map((patient) => (
                                    <div
                                        key={patient._id || patient.id}
                                        onClick={() => handleSelectPatient(patient)}
                                        className="p-3 hover:bg-teal-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-sm border border-gray-100">
                                                {patient.profilePhoto ? (
                                                    <AuthImage
                                                        src={getImageUrl(patient.profilePhoto)}
                                                        alt={patient.fullName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User size={16} />
                                                )}
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
                        {showDropdown && !selectedPatient && searchKey && patients.length === 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-center text-gray-500 text-sm">
                                No patients found
                            </div>
                        )}
                    </div>



                    {/* Upload Area */}
                    {/* Upload Area */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">Upload File</label>
                        {!file ? (
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer group
                                    ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-400 hover:bg-teal-50/30'}
                                `}
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
                                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                                    <Upload size={24} />
                                </div>
                                <p className="text-slate-900 font-medium mb-1">Click to upload or drag and drop</p>
                                <p className="text-xs text-slate-500">Supported: PDF, JPG, PNG (Max 10MB)</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 ring-1 ring-black/5">
                                <div className="flex items-stretch">
                                    {/* Preview Section */}
                                    <div className="w-24 bg-gray-50 flex items-center justify-center border-r border-gray-100 relative group overflow-hidden">
                                        {file.type.startsWith('image/') ? (
                                            <>
                                                <AuthImage
                                                    src={URL.createObjectURL(file)}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-teal-900/0 group-hover:bg-teal-900/10 transition-colors duration-300" />
                                            </>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm text-teal-600">
                                                <FileText size={20} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details Section */}
                                    <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">File Name</label>
                                            <button
                                                onClick={() => {
                                                    setFile(null);
                                                    setFileName("");
                                                }}
                                                className="text-gray-300 hover:text-red-500 transition-colors -mt-1 -mr-1 p-1 rounded-full hover:bg-red-50"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-1 group/input">
                                            <input
                                                type="text"
                                                value={fileName}
                                                onChange={(e) => setFileName(e.target.value)}
                                                className="flex-1 font-semibold text-slate-800 text-lg bg-transparent border-b-2 border-transparent focus:border-teal-500 focus:outline-none transition-all placeholder-gray-300 py-0.5"
                                                placeholder="Enter name"
                                                autoFocus
                                            />
                                            <span className="text-gray-400 font-medium select-none">.{file.name.split('.').pop()}</span>
                                        </div>

                                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 font-medium">
                                            <span className="bg-gray-100/80 px-2 py-0.5 rounded text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span className="uppercase">{file.type.split('/')[1] || 'FILE'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
