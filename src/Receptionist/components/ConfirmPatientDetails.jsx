import AuthImage from "../../components/AuthImage";
import React from 'react';
import { User, Calendar, Phone, Activity, ArrowRight, AlertCircle, X, Check, Circle } from "lucide-react";
import { generateTokenApi, setFreeStatusApi } from '../../services/receptionistAllApi';
import Swal from 'sweetalert2';
import { calculateDetailedAge } from '../../utils/dateUtils';
import { BASE_URL } from '../../services/baseURL';

function ConfirmPatientDetails({ formData, patientId, onCancel, onConfirm, isNested = false, tokenApi, paymentStatus, freeStatusApi }) {
    const [paymentReceived, setPaymentReceived] = React.useState(false);
    const isFeeApplicable = !paymentStatus || paymentStatus === "Payable";
    const [previewUrl, setPreviewUrl] = React.useState(null);
    const [showPreviewModal, setShowPreviewModal] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (!formData.profilePhoto) {
            setPreviewUrl(null);
            return;
        }
        if (typeof formData.profilePhoto === 'object') {
            const url = URL.createObjectURL(formData.profilePhoto);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            const path = formData.profilePhoto;
            const cleanStr = String(path).trim();
            if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) {
                setPreviewUrl(cleanStr);
            } else {
                let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
                setPreviewUrl(`${BASE_URL}/${finalPath}`);
            }
        }
    }, [formData.profilePhoto]);

    const generateToken = async () => {
        console.log("Generating token for patientId:", patientId);
        setIsLoading(true);
        const reqBody = { patientId: patientId };
        try {
            // Use passed API or fallback to default (receptionist)
            const apiCall = tokenApi || generateTokenApi;
            const result = await apiCall(reqBody);
            console.log("result for generating token", result);

            if (result.data.success === true) {
                // Extract token data
                const tokenData = result.data.data;
                const token = tokenData["Token Number"];

                Swal.fire({
                    title: 'Token Generated!',
                    text: `Token number generated successfully`,
                    icon: 'success',
                    iconColor: '#14B8A6',
                    confirmButtonText: 'OK',
                }).then(() => {
                    onConfirm(tokenData); // Pass full data object
                });
            } else {
                Swal.fire({
                    title: 'Failed!',
                    text: 'Failed to generate token',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            }
        }
        catch (error) {
            console.log(error);
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred',
                icon: 'error',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <div className={`max-w-xl mx-auto animate-in fade-in zoom-in-50 duration-300 ${isNested ? '' : ''}`}>
            <div className={`bg-white overflow-hidden ${isNested ? '' : 'rounded-3xl shadow-xl border border-gray-100'}`}>

                {/* Header Section */}
                <div className="bg-white px-5 pt-10 text-center border-b border-gray-50">
                    <div
                        className={`w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-teal-100 overflow-hidden ${previewUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                        onClick={() => previewUrl && setShowPreviewModal(true)}
                    >
                        {previewUrl ? (
                            <AuthImage
                                src={previewUrl}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User size={32} className="text-[#14B8A6]" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Confirm Patient Details</h2>
                    <p className="text-slate-500 text-sm">Please verify the information before generating a token</p>

                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100">
                        <span># {formData.uniqueId || "N/A"}</span>
                    </div>
                </div>

                {/* Details List */}
                <div className="px-8 pt-2 pb-10 bg-white">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-1 border-b border-gray-50">
                            <span className="text-slate-500 text-sm font-medium">Name</span>
                            <span className="text-slate-500 font-semibold">{formData.fullName}</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-gray-50">
                            <span className="text-slate-500 text-sm font-medium">Date of Birth</span>
                            <span className="text-slate-500 font-semibold">
                                {formData.dateOfBirth}
                                {calculateDetailedAge(formData.dateOfBirth) !== formData.dateOfBirth && (
                                    <span className="text-slate-400 font-normal ml-1">({calculateDetailedAge(formData.dateOfBirth)})</span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-gray-50">
                            <span className="text-slate-500 text-sm font-medium">Sex</span>
                            <span className="text-slate-500 font-semibold">{formData.sex}</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-gray-50">
                            <span className="text-slate-500 text-sm font-medium">Phone</span>
                            <span className="text-slate-500 font-semibold">{formData.mobile}</span>
                        </div>
                    </div>

                    {/* Warning/Info Box - Display only if payment status is NOT "Free" */}
                    {isFeeApplicable && (
                        <div className="mt-4 space-y-3">
                            <div className="p-4 bg-orange-50 rounded-xl flex items-center justify-center gap-2 text-orange-700 text-sm font-medium border border-orange-100">
                                <AlertCircle size={18} />
                                <span>Consultation Fee Applicable</span>
                            </div>

                            {/* Payment Received Toggle */}
                            <button
                                onClick={() => {
                                    if (!paymentReceived) {
                                        Swal.fire({
                                            title: 'Confirm Payment',
                                            text: "The payment will be marked as paid and you cannot edit this status later.",
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonColor: '#14B8A6',
                                            cancelButtonColor: '#d33',
                                            confirmButtonText: 'Yes, Mark as Paid'
                                        }).then(async (result) => {
                                            if (result.isConfirmed) {
                                                setPaymentReceived(true);
                                                try {
                                                    const reqBody = {
                                                        patientId: patientId,
                                                        duration: 7
                                                    };
                                                    // Use passed API or fallback to default (receptionist)
                                                    const apiCall = freeStatusApi || setFreeStatusApi;
                                                    await apiCall(reqBody);
                                                } catch (error) {
                                                    console.error("Error setting free status:", error);
                                                }
                                            }
                                        });
                                    } else {
                                        setPaymentReceived(false);
                                    }
                                }}
                                className={`w-full py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all duration-200 ${paymentReceived
                                    ? 'bg-green-50 border-green-200 text-green-700 font-semibold'
                                    : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'
                                    }`}
                            >
                                {paymentReceived ? (
                                    <>
                                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span>Payment Received</span>
                                    </>
                                ) : (
                                    <>
                                        <Circle size={20} className="text-gray-300" />
                                        <span>Mark Payment as Received</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {paymentStatus === "Free" && (
                        <div className="mt-4 p-4 bg-green-50 rounded-xl flex items-center justify-center gap-2 text-green-700 text-sm font-medium border border-green-100">
                            <AlertCircle size={18} />
                            <span>No Consultation Fee Required</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-5 flex items-center gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3.5 px-6 bg-white border border-gray-200 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 focus:ring-2 focus:ring-gray-200 focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={generateToken}
                            disabled={isLoading}
                            className={`flex-1 py-3.5 px-6 font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2 focus:outline-none ${isLoading ? 'bg-gray-400 cursor-not-allowed text-white shadow-none' : 'bg-[#14B8A6] hover:bg-teal-600 text-white shadow-teal-900/20'}`}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Activity size={18} />
                            )}
                            {isLoading ? 'Generating...' : 'Generate Token'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {showPreviewModal && previewUrl && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowPreviewModal(false)}>
                    <div className="relative animate-in zoom-in-50 duration-300" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowPreviewModal(false)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-200 transition-colors"
                        >
                            <X size={32} />
                        </button>
                        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                            <AuthImage
                                src={previewUrl}
                                alt={formData.fullName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ConfirmPatientDetails;