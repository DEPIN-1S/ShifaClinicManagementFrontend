import React from 'react';
import { X, FileText } from 'lucide-react';
import ShifaClinicLogo from '../../assets/ShifaClinicLogo.png';
import { AuthenticatedMedia } from '../../components/AuthImage';

export default function ViewDocumentModal({ isOpen, onClose, docUrl, fileName, title, fileType }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-[#14B8A6]">
                        <FileText size={24} />
                        <h2 className="text-xl font-bold text-slate-900">{title || "Document Preview"}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-100 p-4 overflow-y-auto rounded-b-2xl custom-scrollbar">
                    <div className="relative w-full h-full flex items-center justify-center bg-white rounded-xl overflow-hidden border border-gray-200">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <img src={ShifaClinicLogo} alt="Watermark" className="w-[50%] h-auto object-contain opacity-[0.08]" />
                        </div>

                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            <AuthenticatedMedia
                                src={docUrl}
                                fileName={fileName}
                                fileType={fileType}
                                alt="Document Preview"
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
