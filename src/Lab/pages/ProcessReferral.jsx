import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    X,
    Upload,
    FileText,
    CheckCircle,
    ArrowLeft,
    User,
    Stethoscope,
    Calendar,
    Clock,
    AlertCircle,
    Check,
    Loader2,
    ArrowRight,
    CreditCard,
    FlaskConical,
    Download,
    Phone,
    QrCode,
    Landmark,
    Edit2
} from 'lucide-react';
import { SiGooglepay, SiPaytm, SiPhonepe, SiRazorpay } from "react-icons/si";
import Swal from 'sweetalert2';
import { jsPDF } from "jspdf";
import DownloadActionModal from '../../Common-Components/DownloadActionModal';
import LabSidebar from '../components/LabSidebar';
import { fetchLabRequestsApi, uploadLabReportApi, updateLabPaymentStatusApi, updateLabRequestStatusApi } from '../../services/LabAllApi';
import { BASE_URL } from "../../services/baseURL";
import logo from "../../assets/ShifaClinicLogo.png";
import AuthImage, { AuthenticatedMedia } from "../../components/AuthImage";
import { isPdfSource } from "../../utils/fileUrl";
import { downloadAuthenticatedFile, loadAuthenticatedFile, openAuthenticatedFile } from "../../utils/authenticatedFile";

export default function ProcessReferral() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const [referral, setReferral] = useState(location.state?.referral || null);
    const [loading, setLoading] = useState(!location.state?.referral);
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [notes, setNotes] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState(""); // State for renaming file
    const [fileExtension, setFileExtension] = useState(""); // State for file extension
    const [paymentStatus, setPaymentStatus] = useState(location.state?.referral?.paymentStatus || "Pending");

    // Image Preview State
    const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
    const [viewImageUrl, setViewImageUrl] = useState(null);

    // Download Modal State
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadFileData, setDownloadFileData] = useState(null);
    const [isDownloadingFile, setIsDownloadingFile] = useState(false);

    // Payment Flow States
    const [showPaymentSelection, setShowPaymentSelection] = useState(false);
    const [showAmountEntry, setShowAmountEntry] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(""); // 'Online Payment', 'Cash', 'Combined Payment', 'Razorpay Payment'
    const [onlineAmount, setOnlineAmount] = useState("");
    const [cashAmount, setCashAmount] = useState("");
    const [isUpdateMode, setIsUpdateMode] = useState(false); // For future use if we allow editing payment

    const getImageUrl = (path) => {
        if (!path) return "";
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;

        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        if (finalPath.startsWith('uploads/') || finalPath.startsWith('Uploads/')) {
            // Already includes uploads/, do not prepend
        } else {
            finalPath = `uploads/${finalPath}`;
        }

        return `${BASE_URL}/${finalPath}`;
    };

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    useEffect(() => {
        if (referral) {
            setLoading(false);
            return;
        }

        const getReferralData = async () => {
            setLoading(true);
            try {
                // Try fetching with empty status to search everywhere, and increased limit
                const result = await fetchLabRequestsApi("", 1, 100, "");
                if (result.status === 200) {
                    const found = result.data.data.find(r => r.id.toString() === requestId);
                    if (found) {
                        setReferral(found);
                        setPaymentStatus(found.paymentStatus || 'Pending');
                    } else {
                        // Fallback: If not found in first 100, we might need a specific endpoint or user search
                        // For now, show error if strictly not found
                        Swal.fire("Error", "Referral not found", "error");
                        navigate('/lab/doctor-referrals');
                    }
                }
            } catch (error) {
                console.error("Error fetching referral:", error);
                // navigate('/lab/doctor-referrals'); // Optional: redirect on error
            } finally {
                setLoading(false);
            }
        };
        getReferralData();
    }, [requestId, navigate]);

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
        const lastDotIndex = selectedFile.name.lastIndexOf(".");
        if (lastDotIndex !== -1) {
            setFileName(selectedFile.name.substring(0, lastDotIndex));
            setFileExtension(selectedFile.name.substring(lastDotIndex));
        } else {
            setFileName(selectedFile.name);
            setFileExtension("");
        }
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
        // Append file with the new name
        const finalName = fileName + fileExtension;
        formData.append("file", file, finalName);
        formData.append("technicianNotes", notes);

        try {
            const result = await uploadLabReportApi(requestId, formData);
            if (result.status === 200 || result.data?.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Report Uploaded',
                    text: 'The lab report has been successfully processed.',
                    confirmButtonColor: '#14B8A6'
                });
                navigate(-1);
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




    const handleUpdateStatus = async (newStatus) => {
        if (newStatus === 'Completed' && !referral.result) {
            Swal.fire({
                icon: 'warning',
                title: 'Result Missing',
                text: 'Please upload the lab result document before marking as completed.',
                confirmButtonColor: '#14B8A6'
            });
            return;
        }

        try {
            const result = await updateLabRequestStatusApi(requestId, newStatus);
            if (result.status === 200 || result.data?.success) {
                setReferral({ ...referral, status: newStatus });
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    text: `Test status changed to ${newStatus}.`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            Swal.fire("Error", "Failed to update test status", "error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14B8A6]"></div>
            </div>
        );
    }

    if (!referral) return null;

    const handlePaymentStatusChange = () => {
        if (paymentStatus === 'Paid') {
            // Already paid, do nothing on toggle click? 
            // The UI will show an Edit button instead of this toggle for Paid status.
            // But if for some reason this is clicked, maybe verify?
            // Let's keep the pending rollback as a separate action or just disable toggle.
            // For now, if paid, we don't expect this to be clicked via the toggle UI we plan to change.
            // But just in case, let's leave it empty or safe.
        } else {
            // Open Modal for new payment
            setIsUpdateMode(false);
            setOnlineAmount("");
            setCashAmount("");
            setShowPaymentSelection(true);
        }
    };

    const handleEditPayment = () => {
        setIsUpdateMode(true);
        const mode = referral.labPaymentMode || 'Cash';
        setPaymentMethod(mode);

        // Pre-fill amounts
        setOnlineAmount("");
        setCashAmount("");

        if (mode === 'Combined' && referral.combined) {
            setOnlineAmount(referral.combined.onlinePayment || "");
            setCashAmount(referral.combined.cash || "");
        } else if (mode === 'Online' || mode === 'Online Payment') {
            // referral.labAmount holds the total.
            setOnlineAmount(referral.labAmount || "");
        } else if (mode === 'Razorpay' || mode === 'Razorpay Payment') {
            setOnlineAmount(referral.labAmount || "");
        } else {
            // Cash
            setCashAmount(referral.labAmount || "");
        }

        setShowPaymentSelection(true);
    };

    const handleUpdatePaymentStatusToPending = async () => {
        try {
            const result = await updateLabPaymentStatusApi(requestId, { paymentStatus: 'Pending' });
            if (result.status === 200 || result.data?.success) {
                setPaymentStatus('Pending');
                setReferral({ ...referral, paymentStatus: 'Pending' });
                Swal.fire({
                    icon: 'success',
                    title: 'Payment Status Updated',
                    text: `Payment marked as Pending.`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
            Swal.fire("Error", "Failed to update payment status", "error");
        }
    };

    const handleMethodSelect = (method) => {
        setPaymentMethod(method);
        let online = "";
        let cash = "";

        if (isUpdateMode) {
            const prevMode = referral.labPaymentMode;
            const isMatch = (method === 'Combined Payment' && (prevMode === 'Combined' || prevMode === 'Combined Payment')) ||
                (method === 'Online Payment' && (prevMode === 'Online' || prevMode === 'Online Payment')) ||
                (method === 'Cash' && prevMode === 'Cash') ||
                (method === 'Razorpay Payment' && (prevMode?.toLowerCase() === 'razorpay' || prevMode?.toLowerCase() === 'razorpay payment'));

            if (isMatch) {
                if (referral.combined) {
                    online = referral.combined.onlinePayment || "0";
                    cash = referral.combined.cash || "0";
                } else {
                    // Single mode in record
                    if (referral.labPaymentMode === 'Online' || referral.labPaymentMode === 'Online Payment') online = referral.labAmount || "0";
                    else if (referral.labPaymentMode === 'Razorpay' || referral.labPaymentMode === 'Razorpay Payment') online = referral.labAmount || "0";
                    else if (referral.labPaymentMode === 'Cash') cash = referral.labAmount || "0";
                }

                online = online.toString();
                cash = cash.toString();
            }
        }

        setOnlineAmount(online);
        setCashAmount(cash);
        setShowPaymentSelection(false);
        setShowAmountEntry(true);
    };

    const handleFinalPayment = async () => {
        const cashVal = Number(cashAmount) || 0;
        const onlineVal = Number(onlineAmount) || 0;
        let reqBody;

        if (paymentMethod === 'Cash') {
            reqBody = {
                cash: cashVal,
                paymentStatus: "Paid"
            };
        } else if (paymentMethod === 'Online Payment') {
            reqBody = {
                onlinePayment: onlineVal,
                paymentStatus: "Paid"
            };
        } else if (paymentMethod === 'Razorpay Payment') {
            reqBody = {
                razorPay: onlineVal,
                paymentStatus: "Paid"
            };
        } else {
            // Combined Payment
            reqBody = {
                paymentStatus: "Paid",
                combined: {
                    cash: cashVal,
                    onlinePayment: onlineVal
                }
            };
        }

        try {
            const result = await updateLabPaymentStatusApi(requestId, reqBody);
            if (result.status === 200 || result.data?.success) {
                setPaymentStatus('Paid');

                // Construct the updated referral object for local state
                const totalAmount = onlineVal + cashVal;
                let paymentModeString = "";
                if (paymentMethod === 'Cash') paymentModeString = "Cash";
                else if (paymentMethod === 'Online Payment') paymentModeString = "Online"; // Or "Online Payment" depending on backend
                else if (paymentMethod === 'Razorpay Payment') paymentModeString = "Razorpay";
                else paymentModeString = "Combined";

                setReferral({
                    ...referral,
                    paymentStatus: 'Paid',
                    labAmount: totalAmount,
                    labPaymentMode: paymentModeString,
                    ...reqBody
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Payment Status Updated',
                    text: `Payment marked as Paid.`,
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowAmountEntry(false);
            } else {
                Swal.fire("Error", "Failed to update payment status", "error");
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
            Swal.fire("Error", "Failed to update payment status", "error");
        }
    };

    const openDownloadModal = async (fileUrl, fileName) => {
        const fullUrl = getImageUrl(fileUrl);
        const downloadName = fileName || "Lab_Result";
        if (isPdfSource({ src: fullUrl, fileName: downloadName })) {
            try {
                const name = downloadName.toLowerCase().endsWith(".pdf") ? downloadName : `${downloadName}.pdf`;
                await downloadAuthenticatedFile(fullUrl, name);
            } catch (error) {
                Swal.fire("Error", error.message || "Failed to download the file.", "error");
            }
            return;
        }
        setDownloadFileData({ src: fullUrl, name: fileName });
        setShowDownloadModal(true);
    };

    const handleDownloadOption = async (format) => {
        if (!downloadFileData) return;
        setIsDownloadingFile(true);

        try {
            const { src, name } = downloadFileData;
            const fileName = (name && name.split('.')[0]) || "Lab_Result";

            // Helper to get Blob/Image
            const file = await loadAuthenticatedFile(src);
            const blob = file.blob;
            const imgBitmap = await createImageBitmap(blob);

            // Unified Logic: Canvas -> Watermark -> Download

            // Create canvas to draw image
            const canvas = document.createElement('canvas');
            canvas.width = imgBitmap.width;
            canvas.height = imgBitmap.height;
            const ctx = canvas.getContext('2d');

            // 1. Fill White Background
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Draw original image
            ctx.drawImage(imgBitmap, 0, 0);

            // Draw Watermark
            const watermarkImg = new Image();
            watermarkImg.src = logo;
            await new Promise((resolve) => {
                watermarkImg.onload = () => {
                    const width = canvas.width;
                    const height = canvas.height;
                    const wmWidth = width * 0.5;
                    const wmHeight = (watermarkImg.height / watermarkImg.width) * wmWidth;
                    const wmX = (width - wmWidth) / 2;
                    const wmY = (height - wmHeight) / 2;

                    ctx.globalAlpha = 0.08;
                    ctx.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
                    ctx.globalAlpha = 1.0;
                    resolve();
                };
                watermarkImg.onerror = resolve; // Continue even if watermark fails
            });

            if (format === 'png') {
                // Convert canvas to blob for PNG download using Promise wrapper
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${fileName}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setShowDownloadModal(false);
            } else {
                // PDF Conversion (Preserve existing logic roughly)
                const doc = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();

                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                const imgProps = doc.getImageProperties(imgData);
                const pdfRatio = pdfWidth / pdfHeight;
                const imgRatio = imgProps.width / imgProps.height;

                let w = pdfWidth;
                let h = w / imgRatio;

                if (h > pdfHeight) {
                    h = pdfHeight;
                    w = h * imgRatio;
                }

                doc.addImage(imgData, 'JPEG', 0, 0, w, h);
                doc.save(`${fileName}.pdf`);
                setShowDownloadModal(false);
            }
        } catch {
            console.error("Download processing error");
            Swal.fire("Error", "Failed to process download. Try direct link.", "error");
        } finally {
            setIsDownloadingFile(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            <LabSidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={toggleSidebar}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out p-6 lg:p-10 ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">


                        <div className="p-3 bg-teal-50 rounded-xl">
                            <FlaskConical size={24} className="text-[#14B8A6]" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Process Lab Referral</h1>
                            <p className="text-gray-500 mt-1">Submit test results and finalize clinical request</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Left Column: Patient & Test Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Patient Information</h2>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-[#14B8A6] border border-teal-100 shrink-0 overflow-hidden cursor-pointer"
                                    onClick={() => {
                                        if (referral.profilePhoto) {
                                            setViewImageUrl(getImageUrl(referral.profilePhoto));
                                            setShowImagePreviewModal(true);
                                        }
                                    }}
                                >
                                    {referral.profilePhoto ? (
                                        <AuthImage
                                            src={getImageUrl(referral.profilePhoto)}
                                            alt={referral.patientName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={28} />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                        {referral.patientName}
                                        {referral.isCardiodiabetic && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200">
                                                CD
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100/50">#{referral.patientId || referral.id}</span>
                                        {referral.patientMobile && (
                                            <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5 pl-2 border-l border-gray-200">
                                                <Phone size={14} className="text-gray-400" />
                                                {referral.patientMobile}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Referred By</span>
                                    <span className="font-bold text-slate-800 flex items-center gap-1">
                                        <Stethoscope size={14} className="text-[#14B8A6]" />
                                        {referral.referredBy}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Priority</span>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${referral.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                        {referral.priority || 'Normal'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Billing Status</h2>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${paymentStatus === 'Paid' ? 'bg-teal-50 text-[#14B8A6] border-teal-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Payment Status</p>
                                        <p className={`text-[10px] font-medium uppercase tracking-wider ${paymentStatus === 'Paid' ? 'text-[#14B8A6]' : 'text-amber-600'}`}>
                                            {paymentStatus}
                                            {paymentStatus === 'Paid' && referral.labAmount > 0 && (
                                                <span className="block text-slate-500 normal-case mt-0.5">
                                                    {referral.labPaymentMode === 'Combined' && referral.combined ? (
                                                        <>
                                                            <span>Cash: ₹{referral.combined.cash}</span>
                                                            <span className="mx-1">|</span>
                                                            <span>Online: ₹{referral.combined.onlinePayment}</span>
                                                        </>
                                                    ) : (
                                                        <span>{referral.labPaymentMode} : ₹{referral.labAmount}</span>
                                                    )}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle Button */}
                                {paymentStatus === 'Paid' ? (
                                    <button
                                        onClick={handleEditPayment}
                                        className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-200 hover:bg-teal-100 hover:border-teal-200 transition-all active:scale-95"
                                        title="Edit Payment Details"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePaymentStatusChange}
                                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 bg-gray-200"
                                    >
                                        <span
                                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"
                                        />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-[#14B8A6]/5 rounded-2xl border border-[#14B8A6]/10 p-6">
                            <div className="flex items-center gap-3 text-[#14B8A6] mb-3">
                                <AlertCircle size={20} />
                                <h3 className="font-bold">Guidelines</h3>
                            </div>
                            <ul className="text-xs text-slate-600 space-y-3 list-disc pl-4">
                                <li>Ensure the document is clear and legible.</li>
                                <li>Supported formats: PDF, JPEG, PNG.</li>
                                <li>Maximum file size allowed is 10MB.</li>
                                <li>Once submitted, results cannot be edited here.</li>
                                <li>Update the test status properly after each step.</li>
                                <li>Uploading result will mark the test status completed.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Referral Document */}
                    <div className="lg:col-span-2 h-full">
                        {/* 1. Doctor's Referral Document Display */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <FileText size={20} className="text-[#14B8A6]" />
                                    Doctor's Referral
                                </h2>
                                {(referral.referralDocument || referral.file?.path) && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDownloadModal(referral.referralDocument || referral.file?.path, `${referral.patientName}_Referral`);
                                            }}
                                            className="text-sm font-bold text-gray-400 hover:text-[#14B8A6] transition-colors flex items-center gap-1"
                                            title="Download Referral"
                                        >
                                            <Download size={16} />
                                        </button>

                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex-1 flex items-center justify-center relative overflow-hidden group min-h-[400px]">
                                {(referral.referralDocument || referral.file?.path) ? (
                                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                                        <AuthenticatedMedia
                                            src={getImageUrl(referral.referralDocument || referral.file?.path)}
                                            fileName={referral.referralDocument || referral.file?.path}
                                            alt="Doctor's Referral"
                                            title="Referral PDF"
                                            frameClassName="w-full h-full rounded-xl"
                                            imageClassName="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No digital referral document attached.</p>
                                        <p className="text-xs">Please check physical records if available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Status Management & Upload */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Status Management Section */}
                    {/* Status Management Section */}
                    <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full">
                        <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2 shrink-0">
                            <Clock size={20} className="text-[#14B8A6]" />
                            Update Status
                        </h2>

                        <div className="flex-1 relative pl-10 border-l-2 border-slate-100 ml-4 flex flex-col justify-between py-2 min-h-[400px]">
                            {/* Step 1: Pending */}
                            <div className="relative">
                                {/* Node: Center on border (left: 0 of parent). Left of content is pl-10 (40px). Node is w-8 (32px).
                                    Center of node should be at 0. Left of node should be -16px (relative to 0).
                                    Relative to content (40px) => -16 - 40 = -56px.
                                    Lets try manual pixel or standard class. -left-14 is -3.5rem = -56px. Perfect.
                                */}
                                <div className={`absolute -left-14 top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center transition-all ${!referral.status || referral.status === 'Pending' ? 'bg-amber-500 shadow-amber-200 shadow-lg scale-110' : 'bg-[#14B8A6]'}`}>
                                    {(!referral.status || referral.status === 'Pending') && <Clock size={14} className="text-white" />}
                                    {(referral.status === 'In Progress' || referral.status === 'Completed') && <Check size={14} className="text-white" />}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm flex items-center gap-2 ${(!referral.status || referral.status === 'Pending') ? 'text-slate-900' : 'text-gray-500'}`}>
                                        Request Received
                                        {(!referral.status || referral.status === 'Pending') && <FileText size={14} className="text-amber-500" />}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">{referral.date} • {referral.date ? '09:00 AM' : 'Earlier'}</p>


                                </div>
                            </div>

                            {/* Step 2: In Progress */}
                            <div className="relative">
                                <div className={`absolute -left-14 top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center transition-all ${referral.status === 'In Progress' ? 'bg-blue-500 shadow-blue-200 shadow-lg scale-110' : referral.status === 'Completed' ? 'bg-[#14B8A6]' : 'bg-gray-200'}`}>
                                    {referral.status === 'In Progress' && <FlaskConical size={14} className="text-white animate-spin-slow" />}
                                    {referral.status === 'Completed' && <Check size={14} className="text-white" />}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm ${referral.status === 'In Progress' ? 'text-slate-900' : 'text-gray-500'}`}>Start Processing</h3>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <FlaskConical size={12} />
                                        Lab Testing
                                    </p>

                                    {referral.status === 'In Progress' && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 font-medium flex items-center gap-2 animate-pulse">
                                            <FlaskConical size={14} />
                                            Analysis in progress...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Completed */}
                            <div className="relative">
                                <div className={`absolute -left-14 top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center transition-all ${referral.status === 'Completed' ? 'bg-green-500 shadow-green-200 shadow-lg scale-110' : 'bg-gray-200'}`}>
                                    <CheckCircle size={14} className="text-white" />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm ${referral.status === 'Completed' ? 'text-slate-900' : 'text-gray-500'}`}>Process Completed</h3>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <Stethoscope size={12} />
                                        Shared with Doctor
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Cancel Action */}
                        <div className="mt-auto pt-6 border-t border-dashed border-gray-100 shrink-0 space-y-3">
                            {(!referral.status || referral.status === 'Pending') && (
                                <button
                                    onClick={() => handleUpdateStatus('In Progress')}
                                    className="w-full py-3 px-4 bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    Start Test
                                    <ArrowRight size={14} />
                                </button>
                            )}



                            {referral.status !== 'Completed' && referral.status !== 'Cancelled' && (
                                <button
                                    onClick={() => handleUpdateStatus('Cancelled')}
                                    className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <X size={14} />
                                    Cancel Test
                                </button>
                            )}

                            {referral.status === 'Cancelled' && (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                                    <p className="text-red-700 font-bold text-sm">Test Cancelled</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Results Section */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            {(referral.status === 'Completed' && referral.result) ? <FileText size={20} className="text-[#14B8A6]" /> : <Upload size={20} className="text-[#14B8A6]" />}
                            {(referral.status === 'Completed' && referral.result) ? 'Lab Result' : 'Upload Results'}
                        </h2>

                        {(referral.status === 'Completed' && referral.result) ? (
                            <div className="bg-teal-50/50 rounded-2xl border border-teal-100 p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-4 shadow-sm">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Test Completed</h3>
                                <p className="text-sm text-gray-500 max-w-md mb-6">
                                    The lab test has been completed and the result has been shared with doctor
                                </p>

                                <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                                    <div className="w-full h-64 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-4 relative group">
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <AuthenticatedMedia
                                                src={getImageUrl(referral.result.path)}
                                                fileName={referral.result.name || referral.result.path}
                                                alt="Lab Result"
                                                title="Lab Result PDF"
                                                frameClassName="w-full h-full"
                                                imageClassName="w-full h-full object-contain"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => openAuthenticatedFile(getImageUrl(referral.result.path)).catch((error) => {
                                                Swal.fire("Error", error.message || "Could not open the file.", "error");
                                            })}
                                            className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        >
                                            <div className="bg-white/90 p-2 rounded-full shadow-lg">
                                                <ArrowRight size={20} className="-rotate-45 text-slate-900" />
                                            </div>
                                        </button>
                                    </div>

                                    <div className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 text-left">
                                        <div className="p-2 bg-teal-50 text-teal-600 rounded-lg shrink-0">
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-900 truncate">
                                                {referral.result.name || "Lab_Result.pdf"}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {referral.result.size ? (referral.result.size / 1024).toFixed(2) + ' KB' : 'Document'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDownloadModal(referral.result.path, referral.result.name);
                                            }}
                                            className="p-2 text-gray-400 hover:text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-all"
                                            title="Download Result"
                                        >
                                            <Download size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('reportInput').click()}
                                    className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative min-h-[250px] ${isDragging ? 'border-[#14B8A6] bg-teal-50 shadow-inner' : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                                >
                                    <input
                                        type="file"
                                        id="reportInput"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />

                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${file ? 'bg-teal-100 text-teal-600' : 'bg-gray-50 text-gray-400'}`}>
                                        {file ? <CheckCircle size={32} /> : <Upload size={32} />}
                                    </div>

                                    {file ? (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-sm">
                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                <div className="flex-1 flex border-b border-teal-200 focus-within:border-teal-500 transition-colors">
                                                    <input
                                                        type="text"
                                                        value={fileName}
                                                        onChange={(e) => setFileName(e.target.value)}
                                                        className="text-lg font-bold text-teal-600 text-right bg-transparent focus:outline-none w-full truncate"
                                                        onClick={(e) => e.stopPropagation()} // Prevent triggering file input
                                                    />
                                                    <span className="text-lg font-bold text-teal-600 shrink-0">{fileExtension}</span>
                                                </div>
                                                <div className="text-teal-400 group-hover:text-teal-600 cursor-pointer shrink-0 ml-1" title="Rename File">
                                                    <FileText size={16} />
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB • Click icon to change file</p>
                                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-bold ring-1 ring-teal-100">
                                                <CheckCircle size={14} /> Ready for submission
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-lg font-bold text-slate-800 mb-2">Drag & drop lab report here</p>
                                            <p className="text-sm text-gray-400">or click to browse from device</p>
                                        </>
                                    )}
                                </div>

                                <div className="mt-8 space-y-3">
                                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <FileText size={16} className="text-gray-400" />
                                        Technician Observations (Optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add any specific clinical observations, reference ranges, or comments for the doctor..."
                                        className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/10 focus:border-[#14B8A6] transition-all min-h-[120px] resize-none"
                                    ></textarea>
                                </div>
                                <div className="mt-10 flex justify-end gap-4">
                                    <button
                                        onClick={handleUpload}
                                        disabled={isUploading || !file}
                                        className="px-10 py-3 bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-bold rounded-2xl shadow-xl shadow-teal-500/20 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={20} />
                                                Upload & Complete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Image Preview Modal */}
            {showImagePreviewModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowImagePreviewModal(false)}>
                    <div className="relative animate-in zoom-in-50 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white shadow-2xl relative">
                            <AuthImage
                                src={viewImageUrl}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            onClick={() => setShowImagePreviewModal(false)}
                            className="absolute top-0 right-0 bg-white/90 hover:bg-white text-slate-900 rounded-full p-2 shadow-lg transition-colors transform translate-x-1/4 -translate-y-1/4"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            <DownloadActionModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                onDownloadPdf={() => handleDownloadOption('pdf')}
                onDownloadPng={() => handleDownloadOption('png')}
                isDownloading={isDownloadingFile}
            />

            {/* Payment Selection Modal */}
            {showPaymentSelection && (
                <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-slate-800">Select Payment Method</h3>
                            <button onClick={() => setShowPaymentSelection(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <button
                                onClick={() => handleMethodSelect('Online Payment')}
                                className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && (referral.labPaymentMode === 'Online Payment' || referral.labPaymentMode === 'Online') ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
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
                                <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && (referral.labPaymentMode === 'Online Payment' || referral.labPaymentMode === 'Online') ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                            </button>

                            <button
                                onClick={() => handleMethodSelect('Cash')}
                                className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && referral.labPaymentMode === 'Cash' ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
                            >
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-800 text-lg">Cash Payment</p>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">Physical currency payment</p>
                                </div>
                                <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && referral.labPaymentMode === 'Cash' ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                            </button>

                            <button
                                onClick={() => handleMethodSelect('Combined Payment')}
                                className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && (referral.labPaymentMode === 'Combined Payment' || referral.labPaymentMode === 'Combined') ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
                            >
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-800 text-lg">Combined Payment</p>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">Split between Cash and Online</p>
                                </div>
                                <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && (referral.labPaymentMode === 'Combined Payment' || referral.labPaymentMode === 'Combined') ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                            </button>

                            <button
                                onClick={() => handleMethodSelect('Razorpay Payment')}
                                className={`w-full h-[105px] flex items-center justify-between p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md ${isUpdateMode && (referral.labPaymentMode === 'Razorpay Payment' || referral.labPaymentMode === 'Razorpay') ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50' : 'border-gray-100 hover:border-[#14B8A6] hover:bg-teal-50/30'}`}
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
                                <ArrowLeft className={`rotate-180 transition-colors ${isUpdateMode && (referral.labPaymentMode === 'Razorpay Payment' || referral.labPaymentMode === 'Razorpay') ? 'text-amber-400 group-hover:text-amber-600' : 'text-gray-300 group-hover:text-[#14B8A6]'}`} size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Amount Entry Modal */}
            {showAmountEntry && (
                <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Enter Amount</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{paymentMethod}</p>
                            </div>
                            <button onClick={() => setShowAmountEntry(false)} className="text-gray-400 hover:text-red-500 transition-colors">
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
                                    onClick={handleFinalPayment}
                                    disabled={!onlineAmount && !cashAmount}
                                    className="flex-[2] px-6 py-3 bg-[#14B8A6] hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-900/10 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100 font-poppins"
                                >
                                    <CheckCircle size={20} />
                                    Confirm Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
