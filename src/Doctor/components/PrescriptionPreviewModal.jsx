import React from 'react';
import { X, FileText, ChevronLeft, ChevronRight, Calendar, User } from 'lucide-react';
import ShifaClinicLogo from '../../assets/ShifaClinicLogo.png';
import { AuthenticatedMedia } from '../../components/AuthImage';

export default function PrescriptionPreviewModal({ isOpen, onClose, prescriptions, currentIndex, onNavigate }) {
    if (!isOpen || !prescriptions || prescriptions.length === 0 || currentIndex === null) return null;

    const currentPrescription = prescriptions[currentIndex];
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < prescriptions.length - 1;

    const handlePrevious = (e) => {
        e.stopPropagation();
        if (hasPrevious) onNavigate(currentIndex - 1);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        if (hasNext) onNavigate(currentIndex + 1);
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[#14B8A6]">
                            <FileText size={24} />
                            <h2 className="text-xl font-bold text-slate-900">Prescription Preview</h2>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-[#14B8A6]" />
                                {currentPrescription.date ? new Date(currentPrescription.date).toLocaleDateString('en-GB') : "N/A"}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <User size={14} className="text-gray-400" />
                                {currentPrescription.doctor || "Unknown"}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 items-start">
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-100 p-4 overflow-hidden rounded-b-2xl relative flex items-center justify-center group">
                    {/* Navigation Buttons */}
                    {hasPrevious && (
                        <button
                            onClick={handlePrevious}
                            className="absolute left-6 z-20 p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-[#14B8A6] hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                            title="Previous Prescription"
                        >
                            <ChevronLeft size={28} />
                        </button>
                    )}
                    {hasNext && (
                        <button
                            onClick={handleNext}
                            className="absolute right-6 z-20 p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-[#14B8A6] hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                            title="Next Prescription"
                        >
                            <ChevronRight size={28} />
                        </button>
                    )}

                    <div className="relative w-full h-full flex items-center justify-center bg-white rounded-xl overflow-hidden border border-gray-200">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <img src={ShifaClinicLogo} alt="Watermark" className="w-[50%] h-auto object-contain opacity-[0.08]" />
                        </div>

                        <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
                            <AuthenticatedMedia
                                src={currentPrescription.preview}
                                fileName={currentPrescription.preview}
                                alt="Prescription Preview"
                                title="PDF Preview"
                                frameClassName="w-full h-full bg-white border-0"
                                imageClassName="max-w-full max-h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
