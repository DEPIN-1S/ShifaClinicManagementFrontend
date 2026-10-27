import React from 'react';
import { X, FileText } from 'lucide-react';
import ShifaClinicLogo from '../../assets/ShifaClinicLogo.png';
import ShifaClinicHeaderLogo from '../../assets/ShifaClinicLogo (1).png';
import { AuthenticatedMedia } from '../../components/AuthImage';

export default function ViewLabReportModal({ isOpen, onClose, pdfUrl, fileName, title, formatted = false, patientDetails, fileType }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-[#14B8A6]">
                        <FileText size={24} />
                        <h2 className="text-xl font-bold text-slate-900">{title || "Lab Report Preview"}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-100 p-4 overflow-y-auto rounded-b-2xl custom-scrollbar">
                    {formatted && patientDetails ? (
                        /* HTML Formatted Report Preview - A4 Size */
                        <div id="printable-report" className="bg-white mx-auto shadow-lg min-h-[297mm] w-[210mm] p-[20mm] relative overflow-hidden text-slate-900">
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10">
                                <img src={ShifaClinicLogo} alt="Watermark" className="w-[50%] h-auto object-contain" />
                            </div>

                            <div className="relative z-10">
                                {/* Header */}
                                {/* Header */}
                                <div className="flex items-center gap-1 mb-6 border-b border-gray-200 pb-4">
                                    <img src={ShifaClinicHeaderLogo} alt="Clinic Logo" className="w-24 h-24 object-contain" />
                                    <div className="text-left">
                                        <h1 className="text-3xl font-bold font-serif text-slate-900 leading-tight">SHIFA CLINIC</h1>
                                        <p className="text-xl font-bold text-gray-700  ">KILIMANOOR</p>

                                    </div>
                                </div>

                                {/* Patient Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm mb-6 pb-4 border-b border-gray-200">
                                    <div>
                                        <p className="mb-1"><span className="font-semibold text-gray-600">Patient Name:</span> {patientDetails.name}</p>
                                        <p className="mb-1"><span className="font-semibold text-gray-600">Patient ID:</span> {patientDetails.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="mb-1"><span className="font-semibold text-gray-600">Age:</span> {patientDetails.age} </p>
                                        <p className="mb-1"><span className="font-semibold text-gray-600">Gender:</span> {patientDetails.gender}</p>
                                        <p className="mb-1"><span className="font-semibold text-gray-600">Date:</span> {new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Preferred By removed from preview as per request */}

                                {/* Image/PDF Content */}
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-4">Lab investigation to be done :</p>
                                    <AuthenticatedMedia
                                        src={pdfUrl}
                                        fileName={fileName}
                                        fileType={fileType}
                                        alt="Lab Report"
                                        title="PDF Preview"
                                        frameClassName="w-full h-[800px] bg-white border border-gray-200 rounded-lg"
                                        imageClassName="w-full h-auto object-contain border border-gray-100 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Standard Preview */
                        <div className="relative w-full h-full flex items-center justify-center bg-white rounded-xl overflow-hidden border border-gray-200">
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                <img src={ShifaClinicLogo} alt="Watermark" className="w-[50%] h-auto object-contain opacity-[0.08]" />
                            </div>

                            <div className="relative z-10 w-full h-full flex items-center justify-center">
                                <AuthenticatedMedia
                                    src={pdfUrl}
                                    fileName={fileName}
                                    fileType={fileType}
                                    alt="Report Preview"
                                    title="PDF Preview"
                                    frameClassName="w-full h-full bg-white border-0"
                                    imageClassName="max-w-full max-h-full object-contain"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
