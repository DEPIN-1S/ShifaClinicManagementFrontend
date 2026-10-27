import AuthImage from "../../components/AuthImage";
import React, { useState } from "react";
import { X, User, Activity, FileText, Download, Send, Eye, Clock, RotateCcw, CheckCircle, Stethoscope, FileType, ArrowLeft, ImageIcon, Info, Zap, Phone, QrCode, Landmark } from "lucide-react";
import { SiGooglepay, SiPaytm, SiPhonepe, SiRazorpay } from "react-icons/si";
import { BASE_URL } from "../../services/baseURL";
import { dispensePrescriptionApi } from "../../services/PharmacistAllApi";
import Swal from 'sweetalert2';
import { jsPDF } from "jspdf";
import logo from "../../assets/ShifaClinicLogo.png";
import reportLogo from "../../assets/ShifaClinicLogo (1).png";
import { loadAuthenticatedImage } from "../../utils/authenticatedFile";

export default function ViewPrescriptionModal({ prescription, onClose, onDispenseSuccess, isUpdateMode = false }) {
    const [note, setNote] = useState("");
    const [dispenseLoading, setDispenseLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [downloadTarget, setDownloadTarget] = useState(null); // Image to be downloaded
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Payment Flow States
    const [showPaymentSelection, setShowPaymentSelection] = useState(false);
    const [showAmountEntry, setShowAmountEntry] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(""); // 'Online', 'Cash', 'Combined'
    const [onlineAmount, setOnlineAmount] = useState("");
    const [cashAmount, setCashAmount] = useState("");

    // Pagination for Quick Prescriptions & History
    const [quickPage, setQuickPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const itemsPerPage = 3;

    if (!prescription) return null;

    React.useEffect(() => {
        if (isUpdateMode) {
            handleDispenseClick();
        }
    }, [isUpdateMode]);

    // Helper to generate formatted canvas
    const generatePrescriptionCanvas = async (imageSrc) => {
        return new Promise(async (resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                // A4 at 96 DPI logic from Doctor view
                const width = 1588;
                const height = 2246;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // 1. Fill White Background
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, width, height);

                // 2. Draw Watermark
                const watermarkImg = new Image();
                watermarkImg.src = logo;
                await new Promise((r) => {
                    watermarkImg.onload = () => {
                        const wmWidth = width * 0.5;
                        const wmHeight = (watermarkImg.height / watermarkImg.width) * wmWidth;
                        const wmX = (width - wmWidth) / 2;
                        const wmY = (height - wmHeight) / 2;
                        ctx.save();
                        ctx.globalAlpha = 0.08;
                        ctx.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
                        ctx.restore();
                        r();
                    };
                    watermarkImg.onerror = r;
                });

                // 3. Header
                const logoImg = new Image();
                logoImg.src = reportLogo;
                await new Promise((r) => {
                    logoImg.onload = () => {
                        ctx.drawImage(logoImg, 40, 30, 150, 150);
                        r();
                    };
                    logoImg.onerror = r;
                });

                ctx.fillStyle = "#000000";
                ctx.font = "bold 60px Poppins, sans-serif";
                ctx.fillText("SHIFA CLINIC", 195, 100);

                ctx.fillStyle = "#505050";
                ctx.font = "30px Poppins, sans-serif";
                ctx.fillText("KILIMANOOR", 195, 140);

                // Horizontal Line
                ctx.strokeStyle = "#C8C8C8";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(40, 170);
                ctx.lineTo(width - 40, 170);
                ctx.stroke();

                // 4. Patient Details
                const contentStartY = 220;
                ctx.font = "normal 30px Poppins, sans-serif";
                ctx.fillStyle = "#3C3C3C";

                // Derived from prescription/patientDetails
                const pName = patientDetails.patientName;
                const pId = patientDetails.patientId;
                const pAge = patientDetails.age;
                const pGender = patientDetails.gender;
                const pMobile = prescription.Patient?.mobile || "N/A";

                // Use target doctor or selected doctor
                const targetDoc = downloadTarget?.doctor || selectedImage?.doctor || patientDetails.doctorName;

                const leftX = 60;
                const rightX = 900;
                const lineHeight = 50;

                ctx.fillText(`Patient Name: ${pName}`, leftX, contentStartY);
                ctx.fillText(`Patient ID: ${pId}`, leftX, contentStartY + lineHeight);
                ctx.fillText(`Prescribed by: Dr. ${targetDoc}`, leftX, contentStartY + lineHeight * 2);

                ctx.fillText(`Age: ${pAge}`, rightX, contentStartY);
                ctx.fillText(`Gender: ${pGender}`, rightX, contentStartY + lineHeight);
                ctx.fillText(`Mobile: ${pMobile}`, rightX, contentStartY + lineHeight * 2);

                // Divider
                ctx.beginPath();
                ctx.moveTo(60, contentStartY + lineHeight * 3.5);
                ctx.lineTo(width - 60, contentStartY + lineHeight * 3.5);
                ctx.stroke();

                // 5. Prescription Image
                const reportImg = await loadAuthenticatedImage(imageSrc);
                const imgMaxW = width - 120;
                const imgMaxH = height - (contentStartY + lineHeight * 4.5) - 100;

                let drawW = reportImg.width;
                let drawH = reportImg.height;
                const scale = Math.min(imgMaxW / drawW, imgMaxH / drawH);

                drawW *= scale;
                drawH *= scale;

                const imgX = (width - drawW) / 2;
                const imgY = contentStartY + lineHeight * 4.5;

                ctx.drawImage(reportImg, imgX, imgY, drawW, drawH);

                resolve(canvas);
            } catch (error) {
                reject(error);
            }
        });
    };

    const handleDownloadOption = async (format) => {
        setIsDownloading(true);
        try {
            const target = downloadTarget || selectedImage;
            if (!target) throw new Error("No image selected for download");

            const fileName = `Prescription-${target.date || 'Record'}`;
            const canvas = await generatePrescriptionCanvas(target.src);

            if (format === 'png') {
                canvas.toBlob((blob) => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `${fileName}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, 'image/png');
            } else if (format === 'pdf') {
                const doc = new jsPDF('p', 'mm', 'a4');
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();

                doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                doc.save(`${fileName}.pdf`);
            }
            setDownloadModalOpen(false);
        } catch {
            console.error("Download error");
            Swal.fire("Error", "Failed to generate format. Please try again.", "error");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleFinalDispense = async () => {
        setDispenseLoading(true);
        try {
            const cashVal = cashAmount ? parseFloat(cashAmount) : 0;
            const onlineVal = onlineAmount ? parseFloat(onlineAmount) : 0;
            let reqBody;
            if (paymentMethod === 'Cash') {
                reqBody = {
                    notes: note,
                    cash: cashVal,
                    paymentStatus: "Paid"
                };
            } else if (paymentMethod === 'Online Payment') {
                reqBody = {
                    notes: note,
                    onlinePayment: onlineVal,
                    paymentStatus: "Paid"
                };
            } else if (paymentMethod === 'Razorpay Payment') {
                reqBody = {
                    notes: note,
                    razorPay: onlineVal,
                    paymentStatus: "Paid"
                };
            } else {
                // Combined Payment
                reqBody = {
                    notes: note,
                    paymentStatus: "Paid",
                    combined: {
                        cash: cashVal,
                        onlinePayment: onlineVal
                    }
                };
            }
            const res = await dispensePrescriptionApi(prescription.id, reqBody);
            if (res.status === 200) {
                Swal.fire({
                    title: 'Dispensed!',
                    text: 'Prescription marked as dispensed successfully.',
                    icon: 'success',
                    confirmButtonColor: '#14B8A6'
                });
                if (onDispenseSuccess) onDispenseSuccess();
                onClose();
            } else {
                Swal.fire({
                    title: 'Failed!',
                    text: 'Failed to dispense prescription. Please try again.',
                    icon: 'error',
                    confirmButtonColor: '#ef4444'
                });
            }
        } catch (error) {
            console.error("Dispense error:", error);
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred while dispensing.',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setDispenseLoading(false);
            setShowAmountEntry(false);
            setShowPaymentSelection(false);
        }
    };

    const handleDispenseClick = () => {
        setShowPaymentSelection(true);
    };

    const handleMethodSelect = (method) => {
        setPaymentMethod(method);
        let online = "";
        let cash = "";

        if (isUpdateMode) {
            const prevMode = prescription.pharmacyPaymentMode;
            const isMatch = (method === 'Combined Payment' && (prevMode === 'Combined' || prevMode === 'Combined Payment')) ||
                (method === 'Online Payment' && (prevMode === 'Online' || prevMode === 'Online Payment')) ||
                (method === 'Cash' && prevMode === 'Cash') ||
                (method === 'Razorpay Payment' && (prevMode?.toLowerCase() === 'razorpay' || prevMode?.toLowerCase() === 'razorpay payment'));

            if (isMatch) {
                if (prescription.combined) {
                    online = prescription.combined.onlinePayment || "0";
                    cash = prescription.combined.cash || "0";
                } else {
                    if (prescription.razorPay) online = prescription.razorPay;
                    else if (prescription.onlinePayment) online = prescription.onlinePayment;

                    if (prescription.cash) cash = prescription.cash;
                }

                // Fallbacks for legacy/other fields
                if (online === "0" && prescription.pharmacyOnline) online = prescription.pharmacyOnline;
                if (cash === "0" && prescription.pharmacyCash) cash = prescription.pharmacyCash;

                online = online.toString();
                cash = cash.toString();
            }
        }

        setOnlineAmount(online);
        setCashAmount(cash);
        setShowPaymentSelection(false);
        setShowAmountEntry(true);
    };



    // Normalize data from API
    // API returns: id, tokenNumber, status, paymentStatus, height, weight, isCardiodiabetic, bp, fbs, ppbs, totalCholesterol, prescriptionImage (array)
    // We map these to the UI fields.
    const parseImages = (imgData) => {
        if (!imgData) return [];
        if (Array.isArray(imgData)) return imgData;
        try {
            return JSON.parse(imgData);
        } catch (e) {
            console.error("Error parsing prescription images", e);
            return [];
        }
    };

    const calculateDetailedAge = (dob) => {
        if (!dob) return "--";
        const start = new Date(dob);
        const end = new Date();
        if (start > end) return "--";

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        if (days < 0) {
            months--;
            const prevMonthDate = new Date(end.getFullYear(), end.getMonth(), 0);
            days += prevMonthDate.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        if (months > 0) return `${months} Months`;
        return `${days} Days`;
    };

    const calculatePharmacyAmount = (details) => {
        if (!details) return 0;
        if (details.pharmacyAmount) return parseFloat(details.pharmacyAmount);

        let total = 0;
        if (details.razorPay) total += parseFloat(details.razorPay || 0);
        if (details.onlinePayment) total += parseFloat(details.onlinePayment || 0);
        if (details.cash) total += parseFloat(details.cash || 0);
        if (details.combined) {
            total += parseFloat(details.combined.cash || 0);
            total += parseFloat(details.combined.onlinePayment || 0);
        }

        // Fallback
        if (total === 0) {
            if (details.pharmacyCash) total += parseFloat(details.pharmacyCash || 0);
            if (details.pharmacyOnline) total += parseFloat(details.pharmacyOnline || 0);
        }
        return total;
    };

    const allPrescriptionImages = parseImages(prescription.prescriptionImage);

    // Split into Current (Today's) and Previous based on visitDate matching createdAt
    // We compare YYYY-MM-DD to be safe
    const visitDateStr = new Date(prescription.createdAt).toISOString().split('T')[0];

    const currentPrescriptions = allPrescriptionImages.filter(img => {
        if (!img.visitDate) return false; // Or true if we assume legacy no-date is current? Let's assume date exists
        const imgDateStr = new Date(img.visitDate).toISOString().split('T')[0];
        return imgDateStr === visitDateStr;
    });

    const previousPrescriptions = allPrescriptionImages.filter(img => {
        if (!img.visitDate) return false;
        const imgDateStr = new Date(img.visitDate).toISOString().split('T')[0];
        return imgDateStr !== visitDateStr;
    });

    // Sort previous prescriptions by date descending
    previousPrescriptions.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    // If no date handling (legacy), just put everything in current if empty? 
    // For now assuming the data structure provided in user request.

    const patientDetails = {
        ...prescription,
        patientName: prescription.Patient?.fullName || `Token #${prescription.tokenNumber}`,
        patientId: prescription.Patient?.uniqueId || prescription.Patient?.id,
        // Use calculated age if DOB is present, else fallback to age field or --
        age: prescription.Patient?.dateOfBirth ? calculateDetailedAge(prescription.Patient.dateOfBirth) : (prescription.Patient?.age ? `${prescription.Patient.age} Years` : "--"),
        gender: prescription.Patient?.sex || "--",
        bp: prescription.bp || "--",
        weight: prescription.weight ? `${prescription.weight}` : "--",
        cholesterol: prescription.totalCholesterol || "--",
        sugar: prescription.fbs ? `FBS: ${prescription.fbs}` : "--", // or use ppbs

        // parsedImages: currentPrescriptions, // We will use this directly
        doctorName: prescription.Doctor?.fullName || "Unknown",
        history: previousPrescriptions // Use filtered previous list as history
    };

    if (showPaymentSelection) {
        return (
            <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-xl font-bold text-slate-800">Select Payment Method {isUpdateMode && `(₹${calculatePharmacyAmount(prescription).toLocaleString('en-IN')})`}</h3>
                        <button onClick={() => isUpdateMode ? onClose() : setShowPaymentSelection(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <button
                            onClick={() => handleMethodSelect('Online Payment')}
                            className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && (prescription.pharmacyPaymentMode === 'Online Payment' || prescription.pharmacyPaymentMode === 'Online') ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
                        >
                            <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800 text-lg">Online Payment</p>
                                </div>
                                <p className="text-xs text-gray-400 font-medium tracking-tight">UPI, Cards & Net Banking</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <SiGooglepay size={22} className="text-[#4285F4] opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <SiPaytm size={22} className="text-[#00B9F1] opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <SiPhonepe size={22} className="text-[#5F259F] opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
                                    <Landmark size={18} className="text-gray-400" title="Net Banking" />
                                    <QrCode size={18} className="text-gray-400" />
                                </div>
                            </div>
                            <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && (prescription.pharmacyPaymentMode === 'Online Payment' || prescription.pharmacyPaymentMode === 'Online') ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                        </button>

                        <button
                            onClick={() => handleMethodSelect('Cash')}
                            className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && prescription.pharmacyPaymentMode === 'Cash' ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
                        >
                            <div className="text-left">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800 text-lg">Cash Payment</p>
                                </div>
                                <p className="text-xs text-gray-400 font-medium">Physical currency payment</p>
                            </div>
                            <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && prescription.pharmacyPaymentMode === 'Cash' ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                        </button>

                        <button
                            onClick={() => handleMethodSelect('Combined Payment')}
                            className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && (prescription.pharmacyPaymentMode === 'Combined Payment' || prescription.pharmacyPaymentMode === 'Combined') ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
                        >
                            <div className="text-left">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800 text-lg">Combined Payment</p>
                                </div>
                                <p className="text-xs text-gray-400 font-medium">Split between Cash and Online</p>
                            </div>
                            <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && (prescription.pharmacyPaymentMode === 'Combined Payment' || prescription.pharmacyPaymentMode === 'Combined') ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                        </button>

                        <button
                            onClick={() => handleMethodSelect('Razorpay Payment')}
                            className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && (prescription.pharmacyPaymentMode?.toLowerCase() === 'razorpay' || prescription.pharmacyPaymentMode?.toLowerCase() === 'razorpay payment') ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
                        >
                            <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800 text-lg">Razorpay</p>
                                </div>
                                <p className="text-xs text-gray-400 font-medium tracking-tight">Pay via Razorpay Gateway</p>
                                <div className="mt-3">
                                    <SiRazorpay size={22} className="text-[#3395FF]" />
                                </div>
                            </div>
                            <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && (prescription.pharmacyPaymentMode?.toLowerCase() === 'razorpay' || prescription.pharmacyPaymentMode?.toLowerCase() === 'razorpay payment') ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showAmountEntry) {
        return (
            <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Enter Amount {isUpdateMode && `(₹${(parseFloat(onlineAmount || 0) + parseFloat(cashAmount || 0)).toLocaleString('en-IN')})`}</h3>
                            <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{paymentMethod}</p>
                        </div>
                        <button onClick={() => isUpdateMode ? onClose() : setShowAmountEntry(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-5">
                        {paymentMethod === 'Combined Payment' ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Online Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            autoFocus
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/10 focus:border-[#14B8A6] transition-all font-bold text-slate-800"
                                            placeholder="0.00"
                                            value={onlineAmount}
                                            onChange={(e) => setOnlineAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Cash Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/10 focus:border-[#14B8A6] transition-all font-bold text-slate-800"
                                            placeholder="0.00"
                                            value={cashAmount}
                                            onChange={(e) => setCashAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-gray-100">
                                    <div className="flex justify-between items-center text-slate-600 text-sm font-medium">
                                        <span>Total Amount</span>
                                        <span className="text-lg font-bold text-[#14B8A6]">₹ {(parseFloat(onlineAmount || 0) + parseFloat(cashAmount || 0)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">
                                    {(paymentMethod === 'Online Payment' || paymentMethod === 'Razorpay Payment' || paymentMethod === 'Razorpay') ? 'Online Amount' : 'Cash Amount'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/10 focus:border-[#14B8A6] transition-all font-bold text-slate-800 text-lg"
                                        placeholder="0.00"
                                        value={(paymentMethod === 'Online Payment' || paymentMethod === 'Razorpay Payment' || paymentMethod === 'Razorpay') ? onlineAmount : cashAmount}
                                        onChange={(e) => {
                                            if (paymentMethod === 'Online Payment' || paymentMethod === 'Razorpay Payment' || paymentMethod === 'Razorpay') setOnlineAmount(e.target.value);
                                            else setCashAmount(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setShowAmountEntry(false);
                                    setShowPaymentSelection(true);
                                }}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all font-poppins"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleFinalDispense}
                                disabled={dispenseLoading || (!onlineAmount && !cashAmount)}
                                className="flex-[2] px-6 py-3 bg-[#14B8A6] hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-900/10 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100 font-poppins"
                            >
                                {dispenseLoading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        {isUpdateMode ? "Update Payment" : "Confirm Dispense"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm z-[1000]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-none bg-white rounded-t-2xl z-20">
                    <div className="flex items-center gap-2 text-[#14B8A6]">
                        <FileText size={24} />
                        <h2 className="text-xl font-bold text-slate-900">Prescription Details</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    {/* Patient Header Card */}
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-[#14B8A6] overflow-hidden border-2 border-white shadow-sm">
                                {prescription.Patient?.profilePhoto ? (
                                    <AuthImage
                                        src={prescription.Patient.profilePhoto}
                                        alt={patientDetails.patientName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User size={32} />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-bold text-slate-900">{patientDetails.patientName}</h3>
                                    {prescription.isCardiodiabetic && (
                                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-medium border border-red-100">
                                            CD
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">
                                            #{patientDetails.patientId}
                                        </span>
                                        <p className="text-gray-500 text-sm flex items-center gap-1">
                                            <Phone size={12} className="text-gray-400" /> {prescription.Patient?.mobile || "--"}
                                        </p>
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        {patientDetails.age}, {patientDetails.gender}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="w-12 h-12 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-teal-900/10">
                                {patientDetails.tokenNumber}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center w-full" >
                        <div className="flex justify-center items-center gap-1.5 px-5 py-2 rounded-full bg-teal-50 border border-teal-200 text-slate-600">
                            <Stethoscope size={12} className="text-[#14B8A6]" />
                            <h1 className="text-sm font-semibold"> <span className="font-normal" >Prescribed by :</span> {patientDetails.doctorName}</h1>
                        </div>
                    </div>


                    {/* Vitals Section */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-gray-400" />
                            Vitals
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                                <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">BP</p>
                                <p className={`font-bold text-slate-900 ${patientDetails.bp && patientDetails.bp !== "--" ? "text-base" : "text-xs text-gray-400 font-medium"}`}>
                                    {patientDetails.bp && patientDetails.bp !== "--" ? patientDetails.bp : "Not Added"}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                                <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Weight</p>
                                <p className={`font-bold text-slate-900 ${patientDetails.weight && patientDetails.weight !== "--" ? "text-base" : "text-xs text-gray-400 font-medium"}`}>
                                    {patientDetails.weight && patientDetails.weight !== "--" ? patientDetails.weight : "Not Added"}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                                <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Cholesterol</p>
                                <p className={`font-bold text-slate-900 ${patientDetails.cholesterol && patientDetails.cholesterol !== "--" ? "text-base" : "text-xs text-gray-400 font-medium"}`}>
                                    {patientDetails.cholesterol && patientDetails.cholesterol !== "--" ? patientDetails.cholesterol : "Not Added"}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                                <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Blood Sugar</p>
                                <p className={`font-bold text-slate-900 ${patientDetails.sugar && patientDetails.sugar !== "--" ? "text-base" : "text-xs text-gray-400 font-medium"}`}>
                                    {patientDetails.sugar && patientDetails.sugar !== "--" ? patientDetails.sugar : "Not Added"}
                                </p>

                            </div>
                        </div>
                    </div>

                    {/* Prescription Image Area */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4">Prescription</h3>
                        {currentPrescriptions && currentPrescriptions.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {currentPrescriptions.map((img, idx) => {
                                    // Handle both object (new format) and string (old format)
                                    let imagePath = img;
                                    if (typeof img === 'object' && img !== null && img.image) {
                                        imagePath = img.image;
                                    }

                                    // Ensure image path is correct. If it starts with http, use as is, else prepend BASE_URL
                                    const imgSrc = (typeof imagePath === 'string' && imagePath.startsWith("http"))
                                        ? imagePath
                                        : `${BASE_URL}${imagePath}`;

                                    return (
                                        <AuthImage key={idx} src={imgSrc} alt={`Prescription ${idx + 1}`} className="w-full rounded-xl border border-gray-200" />
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="w-full h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                <FileText size={48} className="mb-3 opacity-20" />
                                <p className="text-sm">No prescription for today</p>
                            </div>
                        )}
                    </div>

                    {/* Pharmacist Notes */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            Pharmacist Notes (Optional)
                        </h3>
                        <textarea
                            className="w-full h-32 p-4 bg-white border border-[#14B8A6] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/10 resize-none text-sm"
                            placeholder="Add notes about dispensing, substitutions, or patient instructions..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Previous Prescriptions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Previous Prescriptions */}
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <RotateCcw size={18} className="text-gray-400" />
                                Previous Prescriptions
                            </h3>

                            {patientDetails.history && patientDetails.history.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 gap-3">
                                        {patientDetails.history
                                            .slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage)
                                            .map((hist, idx) => {
                                                const hasNotes = hist.pharmacistNotes && hist.pharmacistNotes.trim() !== "";
                                                const isQuick = hist.type === 'QuickPrescription';

                                                // Handle both object (new format) and string (old format)
                                                let imagePath = hist;
                                                if (typeof hist === 'object' && hist !== null && hist.image) {
                                                    imagePath = hist.image;
                                                }

                                                // Ensure image path is correct
                                                const imgSrc = (typeof imagePath === 'string' && imagePath.startsWith("http"))
                                                    ? imagePath
                                                    : `${BASE_URL}${imagePath}`;

                                                const histDate = hist.visitDate ? new Date(hist.visitDate).toLocaleDateString() : "Date N/A";
                                                const histDoctor = hist.prescriptionBy || "Unknown";

                                                if (isQuick) {
                                                    // Distinct Design for Quick Prescription in History
                                                    return (
                                                        <div key={idx} className="flex items-center justify-between p-4 bg-orange-50/50 rounded-xl border border-orange-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center border-2 border-white shadow-sm">
                                                                    <Zap size={20} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <h4 className="font-bold text-slate-800">{histDate}</h4>
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wider">
                                                                            Quick
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setSelectedImage({
                                                                        src: imgSrc,
                                                                        date: hist.visitDate || "Unknown Date",
                                                                        doctor: histDoctor
                                                                    })}
                                                                    className="p-2 bg-white text-orange-500 border border-orange-100 hover:bg-orange-50 hover:border-orange-200 rounded-lg transition-colors shadow-sm"
                                                                    title="View Quick Prescription"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        setDownloadTarget({ src: imgSrc, date: hist.visitDate, doctor: histDoctor });
                                                                        setDownloadModalOpen(true);
                                                                    }}
                                                                    className="p-2 bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 hover:border-blue-200 rounded-lg transition-colors shadow-sm"
                                                                    title="Download Report"
                                                                >
                                                                    <Download size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // Default Design for Standard Prescription
                                                return (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-teal-50 text-[#14B8A6] flex items-center justify-center">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-900">{histDate}</h4>
                                                                <p className="text-xs text-gray-500">Dr. {histDoctor}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {hasNotes && (
                                                                <button
                                                                    onClick={() => Swal.fire({
                                                                        title: `<span class="text-xl font-bold text-slate-800">Pharmacist Note</span>`,
                                                                        html: `
                                                                <div class="text-left mt-2">
                                                                    <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 text-slate-700 text-sm leading-relaxed">
                                                                        ${hist.pharmacistNotes}
                                                                    </div>
                                                                </div>
                                                            `,
                                                                        showConfirmButton: false,
                                                                        showCloseButton: true,
                                                                        customClass: {
                                                                            popup: 'rounded-2xl',
                                                                            closeButton: 'focus:outline-none'
                                                                        }
                                                                    })}
                                                                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                                    title="View Notes"
                                                                >
                                                                    <Info size={20} />
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => setSelectedImage({
                                                                    src: imgSrc,
                                                                    date: hist.visitDate || "Unknown Date",
                                                                    doctor: histDoctor
                                                                })}
                                                                className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors"
                                                                title="View Prescription"
                                                            >
                                                                <Eye size={18} />
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setDownloadTarget({ src: imgSrc, date: hist.visitDate, doctor: histDoctor });
                                                                    setDownloadModalOpen(true);
                                                                }}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Download Report"
                                                            >
                                                                <Download size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    {/* Pagination Controls */}
                                    {patientDetails.history.length > itemsPerPage && (
                                        <div className="flex items-center justify-between mt-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                                            <span>
                                                Showing <span className="font-medium text-slate-800">{(historyPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-slate-800">{Math.min(historyPage * itemsPerPage, patientDetails.history.length)}</span> of <span className="font-medium text-slate-800">{patientDetails.history.length}</span>
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
                                                    disabled={historyPage === 1}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-teal-50 hover:text-[#14B8A6] hover:border-[#14B8A6]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-gray-50 transition-all"
                                                >
                                                    <ArrowLeft size={16} />
                                                </button>
                                                <span className="min-w-[1.5rem] text-center font-medium text-slate-700 bg-gray-50 rounded px-1.5 py-0.5 border border-gray-100">{historyPage}</span>
                                                <button
                                                    onClick={() => setHistoryPage(Math.min(Math.ceil(patientDetails.history.length / itemsPerPage), historyPage + 1))}
                                                    disabled={historyPage === Math.ceil(patientDetails.history.length / itemsPerPage)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-teal-50 hover:text-[#14B8A6] hover:border-[#14B8A6]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-gray-50 transition-all"
                                                >
                                                    <ArrowLeft size={16} className="rotate-180" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-32 border border-gray-100 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                    <Clock size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm">No previous prescriptions</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Prescriptions */}
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Zap size={18} className="text-gray-400" />
                                Quick Prescriptions
                            </h3>

                            {prescription.quickPrescriptions && prescription.quickPrescriptions.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 gap-3">
                                        {prescription.quickPrescriptions
                                            .slice((quickPage - 1) * itemsPerPage, quickPage * itemsPerPage)
                                            .map((quick, idx) => {
                                                // Ensure image path is correct
                                                const imgSrc = (quick.image && String(quick.image).startsWith("http"))
                                                    ? quick.image
                                                    : `${BASE_URL}${quick.image}`;

                                                const quickDate = quick.visitDate ? new Date(quick.visitDate).toLocaleDateString() : "Date N/A";
                                                const quickDoctor = quick.prescriptionBy || "Unknown";

                                                return (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                                                                <Zap size={20} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-900">{quickDate}</h4>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedImage({
                                                                    src: imgSrc,
                                                                    date: quick.visitDate || "Unknown Date",
                                                                    doctor: quickDoctor
                                                                })}
                                                                className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors"
                                                                title="View Prescription"
                                                            >
                                                                <Eye size={18} />
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setDownloadTarget({ src: imgSrc, date: quick.visitDate, doctor: quickDoctor });
                                                                    setDownloadModalOpen(true);
                                                                }}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Download Report"
                                                            >
                                                                <Download size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    {/* Pagination Controls */}
                                    {prescription.quickPrescriptions.length > itemsPerPage && (
                                        <div className="flex items-center justify-between mt-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                                            <span>
                                                Showing <span className="font-medium text-slate-800">{(quickPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-slate-800">{Math.min(quickPage * itemsPerPage, prescription.quickPrescriptions.length)}</span> of <span className="font-medium text-slate-800">{prescription.quickPrescriptions.length}</span>
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setQuickPage(Math.max(1, quickPage - 1))}
                                                    disabled={quickPage === 1}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-teal-50 hover:text-[#14B8A6] hover:border-[#14B8A6]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-gray-50 transition-all"
                                                >
                                                    <ArrowLeft size={16} />
                                                </button>
                                                <span className="min-w-[1.5rem] text-center font-medium text-slate-700 bg-gray-50 rounded px-1.5 py-0.5 border border-gray-100">{quickPage}</span>
                                                <button
                                                    onClick={() => setQuickPage(Math.min(Math.ceil(prescription.quickPrescriptions.length / itemsPerPage), quickPage + 1))}
                                                    disabled={quickPage === Math.ceil(prescription.quickPrescriptions.length / itemsPerPage)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-teal-50 hover:text-[#14B8A6] hover:border-[#14B8A6]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-gray-50 transition-all"
                                                >
                                                    <ArrowLeft size={16} className="rotate-180" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-32 border border-gray-100 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                    <Zap size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm">No quick prescriptions</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-xs text-gray-400 flex items-center justify-end border-t border-gray-100 pt-6">
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> {patientDetails.updatedAt ? new Date(patientDetails.updatedAt).toLocaleString() : '--'}
                        </span>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex-none flex items-center justify-end gap-4 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                    {patientDetails.dispenseStatus === 'Dispensed' ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleDispenseClick}
                                className="px-6 py-2.5 bg-amber-50 text-amber-600 font-bold rounded-xl flex items-center gap-2 border border-amber-200 hover:bg-amber-100 transition-colors"
                            >
                                <RotateCcw size={20} />
                                Update Payment
                            </button>
                            <button
                                disabled
                                className="px-6 py-2.5 bg-green-100 text-green-700 font-bold rounded-xl flex items-center gap-2 cursor-not-allowed"
                            >
                                <CheckCircle size={20} />
                                Dispensed
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleDispenseClick}
                            disabled={dispenseLoading}
                            className={`px-6 py-2.5 bg-[#14B8A6] hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-900/10 flex items-center gap-2 transition-all transform active:scale-95 ${dispenseLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {dispenseLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Mark as Dispensed
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

        </div >
    );
}
