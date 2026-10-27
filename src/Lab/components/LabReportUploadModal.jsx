import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Clock, Stethoscope, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { uploadLabReportApi } from '../../services/LabAllApi';

export default function LabReportUploadModal({ isOpen, onClose, referral, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [notes, setNotes] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setNotes("");
            setIsUploading(false);
        }
    }, [isOpen]);

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
            validateAndSetFile(droppedFile);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    };

    const validateAndSetFile = (selectedFile) => {
        if (selectedFile.size > 10 * 1024 * 1024) {
            Swal.fire("Warning", `File "${selectedFile.name}" exceeds 10MB limit.`, "warning");
            return;
        }
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(selectedFile.type)) {
            Swal.fire("Warning", "Invalid file type. Please upload PDF, JPG, or PNG.", "warning");
            return;
        }
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing File',
                text: 'Please upload the lab report file.',
                confirmButtonColor: '#14B8A6'
            });
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("requestId", referral.id);
        formData.append("reportFile", file);
        formData.append("notes", notes);

        try {
            const result = await uploadLabReportApi(formData);
            if (result.status === 200 || result.data?.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Report Uploaded',
                    text: 'The lab report has been successfully processed.',
                    confirmButtonColor: '#14B8A6'
                });
                if (onUploadSuccess) onUploadSuccess();
                onClose();
            } else {
                throw new Error(result.data?.message || "Failed to upload report");
            }
        } catch (error) {
            console.error("Upload error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: error.message || 'Something went wrong during the upload.',
                confirmButtonColor: '#EF4444'
            });
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen || !referral) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 flex justify-between items-start border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Process Lab Referral</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Test: <span className="text-teal-600 font-semibold">{referral.testName}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-white transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Patient & Referral Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-teal-50/30 rounded-xl border border-teal-100/50">
                            <div className="flex items-center gap-2 text-teal-600 mb-1">
                                <User size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Patient</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 truncate">{referral.patientName}</p>
                            <p className="text-[10px] text-gray-400">ID: #{referral.id}</p>
                        </div>
                        <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100/50">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <Stethoscope size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Doctor</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 truncate">{referral.doctorName}</p>
                            <p className="text-[10px] text-gray-400">Date: {referral.date}</p>
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">Upload Lab Report</label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('reportInput').click()}
                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative ${isDragging ? 'border-teal-500 bg-teal-50 shadow-inner' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <input
                                type="file"
                                id="reportInput"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />

                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${file ? 'bg-teal-100 text-teal-600' : 'bg-gray-50 text-gray-400'}`}>
                                {file ? <CheckCircle size={28} /> : <Upload size={28} />}
                            </div>

                            {file ? (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <p className="text-sm font-bold text-teal-600 mb-1 truncate max-w-[250px]">{file.name}</p>
                                    <p className="text-[10px] text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB • Click to change</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-slate-800 mb-1">Drag & drop report here</p>
                                    <p className="text-xs text-gray-400">or click to browse from device</p>
                                    <div className="mt-4 flex gap-2">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">PDF</span>
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">JPG</span>
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">PNG</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notes Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">Technician Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any specific observations or comments..."
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all min-h-[100px] resize-none"
                        ></textarea>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={isUploading || !file}
                        className="px-8 py-2.5 bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/10 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <Clock size={18} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Complete & Send
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
