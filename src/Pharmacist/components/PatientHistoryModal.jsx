import AuthImage from "../../components/AuthImage";
import React, { useEffect, useState } from 'react';
import { X, Calendar, User, FileText, Image as ImageIcon, Loader2, Clock, Eye, Zap, Download, ArrowLeft, AlertCircle, Send } from 'lucide-react';
import Swal from 'sweetalert2';
import { jsPDF } from "jspdf";
import { getPatientPrescriptionHistoryApi, uploadQuickPrescriptionApi } from '../../services/PharmacistAllApi';
// import { uploadQuickPrescriptionApi } from '../../services/DoctorAllApi'; // Removed or commented out
import ViewLabReportModal from '../../Doctor/components/ViewLabReportModal';
import DownloadActionModal from '../../Common-Components/DownloadActionModal';
import { BASE_URL } from '../../services/baseURL';
import { authenticatedFileToDataUrl, downloadAuthenticatedFile, loadAuthenticatedFile } from '../../utils/authenticatedFile';

export default function PatientHistoryModal({ isOpen, onClose, patient, fetchApi, uploadApi }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewPrescription, setViewPrescription] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    // Download format modal state
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);
    const [downloadTarget, setDownloadTarget] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            if (isOpen && patient?.id) {
                setLoading(true);
                try {
                    let result;
                    if (fetchApi) {
                        // User requested limit 10
                        result = await fetchApi(patient.uniqueId, 1, 10);
                        if (result.status === 200) {
                            // Transformation for Doctor API response (New Structure: Flat Array)
                            const data = result.data.data;
                            let visits = [];

                            if (Array.isArray(data)) {
                                visits = data;
                            } else if (data?.history) {
                                visits = data.history;
                            }

                            // Map to expected format
                            const mappedHistory = visits.map(v => {
                                let img = v.image;
                                // Parse prescriptionImage if present and image is not yet set
                                if (!img && v.prescriptionImage) {
                                    try {
                                        const parsed = JSON.parse(v.prescriptionImage);
                                        if (Array.isArray(parsed) && parsed.length > 0) img = parsed[0];
                                        else if (typeof parsed === 'string') img = parsed;
                                    } catch (e) {
                                        img = v.prescriptionImage !== "[]" ? v.prescriptionImage : null;
                                    }
                                }

                                return {
                                    ...v,
                                    date: v.createdAt || v.date || v.visitDate,
                                    visitDate: v.createdAt || v.date || v.visitDate,
                                    image: img,
                                    doctorName: v.prescriptionBy || v.doctorName || (v.Doctor ? v.Doctor.fullName : "Unknown"),
                                    type: v.type || 'Visit'
                                };
                            });

                            // Sort by date descending
                            mappedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

                            setHistory(mappedHistory);
                        }
                    } else {
                        result = await getPatientPrescriptionHistoryApi(patient.id);
                        if (result.status === 200) {
                            setHistory(result.data.data.history || result.data.data || []);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching history:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchHistory();
    }, [isOpen, patient]);

    if (!isOpen) return null;

    // Download Handlers
    const handleDownloadPdf = async () => {
        if (!downloadTarget?.src) return;
        setIsDownloading(true);
        try {
            // Create PDF
            const doc = new jsPDF();

            // Load image
            const imageData = await authenticatedFileToDataUrl(downloadTarget.src);
            const imgProps = doc.getImageProperties(imageData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            const imgWidth = imgProps.width;
            const imgHeight = imgProps.height;

            // Scale and center
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const w = imgWidth * ratio;
            const h = imgHeight * ratio;
            const x = (pdfWidth - w) / 2;
            const y = (pdfHeight - h) / 2;

            const format = String(imageData).startsWith("data:image/png") ? "PNG" : "JPEG";
            doc.addImage(imageData, format, x, y, w, h);

            const dateStr = downloadTarget.date ? new Date(downloadTarget.date).toISOString().split('T')[0] : 'date';
            const safeName = `Prescription_${downloadTarget.doctor || 'Doctor'}_${dateStr}.pdf`;
            doc.save(safeName);
            setDownloadModalOpen(false);
        } catch {
            console.error("PDF generation failed");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadPng = async () => {
        if (!downloadTarget?.src) return;
        setIsDownloading(true);
        try {
            const dateStr = downloadTarget.date ? new Date(downloadTarget.date).toISOString().split('T')[0] : 'date';
            const safeName = `Prescription_${downloadTarget.doctor || 'Doctor'}_${dateStr}.png`;
            await downloadAuthenticatedFile(downloadTarget.src, safeName);
            setDownloadModalOpen(false);
        } catch {
            console.error("PNG download failed");
        } finally {
            setIsDownloading(false);
        }
    };

    // Helper to format date parts
    const getDateParts = (dateString) => {
        const date = new Date(dateString);
        return {
            day: date.getDate(),
            month: date.toLocaleString('default', { month: 'short' }),
            year: date.getFullYear(),
            time: date.toLocaleString('default', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    };

    // [NEW] Handle Send to Quick Prescription
    const handleSendToQP = async (record) => {
        try {
            const result = await Swal.fire({
                title: 'Confirm Prescription',
                text: "Are you sure you want to prescribe this as a Quick Prescription?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#14B8A6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, Send it!'
            });

            if (result.isConfirmed) {
                // 1. Get Image Blob
                const imgUrl = record.image?.startsWith('http') ? record.image : `${BASE_URL}${record.image}`;

                // Show loading toast
                const loadingToast = Swal.fire({
                    title: 'Processing...',
                    didOpen: () => Swal.showLoading(),
                    showConfirmButton: false,
                    allowOutsideClick: false
                });

                const fileResponse = await loadAuthenticatedFile(imgUrl);
                const blob = fileResponse.blob;
                const file = new File([blob], "quick_prescription_copy.png", { type: blob.type });

                // 2. Prepare Form Data
                const reqBody = new FormData();
                reqBody.append("patientId", patient.id);
                reqBody.append("quickPrescription", file);

                // 3. Call API
                const apiToCall = fetchApi && typeof uploadApi === 'function' ? uploadApi : uploadQuickPrescriptionApi;
                const res = await apiToCall(reqBody);

                loadingToast.close();

                if (res.status === 200 || res.status === 201) {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Prescription added to Quick Prescriptions.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error("Failed to upload");
                }
            }
        } catch {
            console.error("Quick prescription copy failed");
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: 'Could not upload to Quick Prescriptions.',
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header - Gradient Design */}
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-6 text-white shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Prescription History</h2>
                            <div className="mt-2 flex items-center gap-3 text-teal-100 text-sm font-medium">
                                <span className="bg-white/20 px-3 py-1 rounded-full">{patient?.fullName}</span>
                                <span>•</span>
                                <span>{patient?.uniqueId}</span>
                                <span>•</span>
                                <span>{patient?.mobile}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content - Timeline/List Style */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                            <Loader2 className="animate-spin text-teal-500" size={40} />
                            <p className="font-medium text-sm">Loading records...</p>
                        </div>
                    ) : history.length > 0 ? (
                        <>
                            <div className="space-y-4">
                                {history
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((record, index) => {
                                        const { day, month, year, time } = getDateParts(record.date || record.visitDate);
                                        const isQuick = record.type === 'QuickPrescription';
                                        const doctorName = record.prescriptionBy || record.doctorName || "Unknown";

                                        // Image URL helper
                                        const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150' fill='%23f1f5f9'%3E%3Crect width='150' height='150' /%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='14' fill='%2394a3b8' dy='.3em' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

                                        const imgUrl = record.image
                                            ? (record.image.startsWith('http') ? record.image : `${BASE_URL}${record.image}`)
                                            : FALLBACK_IMAGE;

                                        if (isQuick) {
                                            return (
                                                <div
                                                    key={index}
                                                    className="bg-orange-50/50 rounded-xl p-2 shadow-sm border border-orange-100 hover:shadow-md hover:border-orange-200 transition-all duration-200 flex gap-3 group items-center"
                                                >
                                                    {/* Date Section - Orange Theme */}
                                                    <div className="w-16 bg-orange-50 rounded-l-lg flex flex-col items-center justify-center border-r border-orange-100 p-2 shrink-0">
                                                        <span className="text-2xl font-bold text-slate-700">{day}</span>
                                                        <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">{month}</span>
                                                        <span className="text-xs text-slate-400 mt-1">{year}</span>
                                                    </div>

                                                    {/* Info Section */}
                                                    <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                                                                    <Zap size={16} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wider">
                                                                            QUICK
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                                        <Clock size={12} />
                                                                        <span>{day} {month} {year} • {time}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Action Icons in Header */}
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSendToQP(record);
                                                                    }}
                                                                    className="px-2 py-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1 bg-teal-50/50 border border-teal-100"
                                                                    title="Send to Quick Prescription"
                                                                >
                                                                    <Send size={14} />
                                                                    <span className="text-[10px] font-bold">QP</span>
                                                                </button>
                                                                {(record.notes || record.pharmacistNotes) && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            Swal.fire({
                                                                                title: '<span class="text-xl font-bold text-slate-800">Pharmacist Note</span>',
                                                                                html: `
                                                                                    <div class="text-left mt-2">
                                                                                        <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 text-slate-700 text-sm leading-relaxed">
                                                                                            ${record.notes || record.pharmacistNotes}
                                                                                        </div>
                                                                                    </div>
                                                                                `,
                                                                                showConfirmButton: false,
                                                                                showCloseButton: true,
                                                                                customClass: {
                                                                                    popup: 'rounded-2xl',
                                                                                    closeButton: 'focus:outline-none'
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                                        title="View Note"
                                                                    >
                                                                        <AlertCircle size={18} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDownloadTarget({ src: imgUrl, date: record.date || record.visitDate, doctor: doctorName });
                                                                        setDownloadModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                    title="Download"
                                                                >
                                                                    <Download size={18} />
                                                                </button>
                                                            </div>
                                                        </div>


                                                    </div>

                                                    {/* Action/Preview Section */}
                                                    <div className="p-2 flex flex-col gap-3 items-center justify-center border-l border-orange-50 w-32">
                                                        <div
                                                            onClick={() => setViewPrescription({
                                                                url: imgUrl,
                                                                name: `Quick Prescription - ${day} ${month} ${year}`
                                                            })}
                                                            className="relative w-[5.5rem] h-[5.5rem] rounded-lg overflow-hidden group/image shadow-inner bg-orange-50 ring-1 ring-black/5 cursor-pointer"
                                                        >
                                                            <AuthImage
                                                                src={imgUrl}
                                                                alt="Prescription"
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
                                                                fallbackSrc={FALLBACK_IMAGE}
                                                            />

                                                            {/* Hover Overlay with View Icon */}
                                                            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                                                <div className="w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center transform scale-0 group-hover/image:scale-100 transition-transform duration-300">
                                                                    <Eye size={20} className="text-orange-600" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={index}
                                                className="bg-white rounded-xl p-2 shadow-sm border border-slate-100 hover:shadow-md hover:border-teal-200 transition-all duration-200 flex gap-3 group items-center"
                                            >
                                                {/* Date Section */}
                                                <div className="w-16 bg-slate-50 rounded-l-lg flex flex-col items-center justify-center border-r border-slate-100 p-2 shrink-0">
                                                    <span className="text-2xl font-bold text-slate-700">{day}</span>
                                                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">{month}</span>
                                                    <span className="text-xs text-slate-400 mt-1">{year}</span>
                                                </div>

                                                {/* Info Section */}
                                                <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                                                <User size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Doctor</p>
                                                                <h3 className="font-bold text-slate-800 leading-tight truncate">Dr. {doctorName}</h3>
                                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                                                                    <Clock size={12} />
                                                                    <span>{day} {month} {year} • {time}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Action Icons in Header */}
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSendToQP(record);
                                                                }}
                                                                className="px-2 py-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1 bg-teal-50/50 border border-teal-100"
                                                                title="Send to Quick Prescription"
                                                            >
                                                                <Send size={14} />
                                                                <span className="text-[10px] font-bold">QP</span>
                                                            </button>

                                                            {(record.notes || record.pharmacistNotes) && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        Swal.fire({
                                                                            title: '<span class="text-xl font-bold text-slate-800">Pharmacist Note</span>',
                                                                            html: `
                                                                                <div class="text-left mt-2">
                                                                                    <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 text-slate-700 text-sm leading-relaxed">
                                                                                        ${record.notes || record.pharmacistNotes}
                                                                                    </div>
                                                                                </div>
                                                                            `,
                                                                            showConfirmButton: false,
                                                                            showCloseButton: true,
                                                                            customClass: {
                                                                                popup: 'rounded-2xl',
                                                                                closeButton: 'focus:outline-none'
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                                    title="View Note"
                                                                >
                                                                    <AlertCircle size={18} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDownloadTarget({ src: imgUrl, date: record.date || record.visitDate, doctor: doctorName });
                                                                    setDownloadModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Download"
                                                            >
                                                                <Download size={18} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                </div>


                                                {/* Action/Preview Section */}
                                                <div className="p-2 flex flex-col gap-3 items-center justify-center border-l border-slate-50 w-32">
                                                    <div
                                                        onClick={() => setViewPrescription({
                                                            url: imgUrl,
                                                            name: `Prescription - ${day} ${month} ${year}`
                                                        })}
                                                        className="relative w-[5.5rem] h-[5.5rem] rounded-lg overflow-hidden group/image shadow-inner bg-slate-100 ring-1 ring-black/5 cursor-pointer"
                                                    >
                                                        <AuthImage
                                                            src={imgUrl}
                                                            alt="Prescription"
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
                                                            fallbackSrc={FALLBACK_IMAGE}
                                                        />

                                                        {/* Hover Overlay with View Icon */}
                                                        <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                                            <div className="w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center transform scale-0 group-hover/image:scale-100 transition-transform duration-300">
                                                                <Eye size={20} className="text-teal-600" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            {/* Pagination Controls */}
                            {history.length > itemsPerPage && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                                    <span className="text-sm text-gray-500">
                                        Showing <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, history.length)}</span> of <span className="font-medium text-slate-900">{history.length}</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-teal-50 hover:text-[#14B8A6] hover:border-[#14B8A6]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-gray-50 transition-all"
                                        >
                                            <ArrowLeft size={18} />
                                        </button>
                                        <span className="px-3 py-1.5 min-w-[2rem] text-center font-medium text-slate-700 bg-gray-50 rounded-lg border border-gray-100">{currentPage}</span>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(Math.ceil(history.length / itemsPerPage), currentPage + 1))}
                                            disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-teal-50 hover:text-[#14B8A6] hover:border-[#14B8A6]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-gray-50 transition-all"
                                        >
                                            <ArrowLeft size={18} className="rotate-180" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <FileText size={40} />
                            </div>
                            <p className="text-lg font-medium text-slate-600">No history found</p>
                            <p className="text-sm">This patient has no previous prescriptions on record.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* View Modal */}
            <ViewLabReportModal
                isOpen={!!viewPrescription}
                onClose={() => setViewPrescription(null)}
                pdfUrl={viewPrescription?.url}
                fileName={viewPrescription?.name}
                fileType="image/png"
                title="Prescription View"
            />

            {/* Download Action Modal */}
            <DownloadActionModal
                isOpen={downloadModalOpen}
                onClose={() => {
                    setDownloadModalOpen(false);
                    setDownloadTarget(null);
                }}
                onDownloadPdf={handleDownloadPdf}
                onDownloadPng={handleDownloadPng}
                isDownloading={isDownloading}
            />
        </div >
    );
}
