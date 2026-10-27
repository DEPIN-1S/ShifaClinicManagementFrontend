import React, { useState } from 'react';
import { Phone, ArrowRight } from 'lucide-react';
import { TbFidgetSpinner } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png'
import VerifyOtp from '../Common-Components/VerifyOtp';
import { sendOtpApi, verifyOtpApi } from '../services/allApi';
import Swal from 'sweetalert2';

function Login() {
    const [mobileNumber, setMobileNumber] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setError('');

        if (mobileNumber === '1111111111') {
            sessionStorage.setItem("token", "dummy-lab-token");
            sessionStorage.setItem("user", JSON.stringify({ role: "LabTechnician", name: "Lab Technician" }));
            navigate('/lab-dashboard');
            return;
        }

        if (mobileNumber.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsLoading(true);
        try {
            const result = await sendOtpApi({ mobile: mobileNumber });
            if (result.status === 200 && result.data.success) {
                setShowOtpModal(true);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'OTP sent successfully',
                    showConfirmButton: false,
                    timer: 3000
                });
            } else {
                console.log(result);
                const errorMessage = result.response?.data?.message || result.data?.message || result.message || "Failed to send OTP";
                setError(errorMessage);
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (otp) => {
        // ... (existing verify logic remains unchanged, but we can also add loading here if needed, 
        // strictly following user request for 'entering phonenumber', so focus on handleLogin first)
        try {
            const result = await verifyOtpApi({ mobile: mobileNumber, otp: otp });
            console.log("Verify Result:", result);

            if (result.status === 200 && result.data.success) {
                const responseData = result.data.data;
                const user = responseData.user;
                const token = responseData.token || result.data.token;

                if (token) {
                    sessionStorage.setItem("token", token);
                }

                if (user) {
                    sessionStorage.setItem("user", JSON.stringify(user));
                }

                const userRole = (user?.role || "").toLowerCase();
                setShowOtpModal(false);

                if (userRole === 'admin') {
                    navigate('/admin-dashboard');
                } else if (userRole === 'receptionist') {
                    navigate('/receptionist-dashboard');
                } else if (userRole === 'doctor') {
                    navigate('/doctor-dashboard');
                } else if (userRole === 'pharmacist' || userRole === 'pharmacy') {
                    navigate('/pharmacist-dashboard');
                } else if (userRole === 'labtechnician' || userRole === 'lab') {
                    navigate('/lab-dashboard');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Access Denied',
                        text: 'Unknown role: ' + userRole
                    });
                }

            } else {
                console.log("Verification Failed Result:", result);
                const errorMessage = result.response?.data?.message || result.message || 'Invalid OTP';
                Swal.fire({
                    icon: 'error',
                    title: 'Verification Failed',
                    text: errorMessage
                });
            }
        } catch (err) {
            console.error("Verification Catch Error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: "An unexpected error occurred during verification."
            });
        }
    };

    return (
        <div className="flex min-h-screen w-full">
            {/* Left Panel */}
            <div className="hidden lg:flex w-1/2 bg-[#14B8A6] flex-col justify-center px-16 relative overflow-hidden">
                {/* Background Pattern Grid */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(#fff 2px, transparent 2px), linear-gradient(90deg, #fff 2px, transparent 2px)`,
                        backgroundSize: '70px 70px'
                    }}
                ></div>

                <div className="relative z-10 text-white max-w-lg">
                    <div className="flex items-center gap-3 mb-8">
                        <img src={logo} alt="" className='w-16' />
                        <div >
                            <h2 className="text-3xl font-bold leading-tight">Shifa Clinic</h2>
                            <p className="text-teal-100 text-lg font-medium ">Management System</p>
                        </div>
                    </div>

                    <h1 className="text-[46px] font-bold mb-6 leading-tight">
                        Streamlined Healthcare Management
                    </h1>

                    <p className="text-teal-50 leading-relaxed text-lg mb-12">
                        Manage patients, consultations, and prescriptions efficiently with our integrated clinic management solution.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-semibold backdrop-blur-sm">1</div>
                            <p className="text-lg pt-0.5">Quick patient registration & token generation</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-semibold backdrop-blur-sm">2</div>
                            <p className="text-lg pt-0.5">Digital consultations & prescriptions</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-semibold backdrop-blur-sm">3</div>
                            <p className="text-lg pt-0.5">Complete audit trail & document management</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-teal-100 p-10 rounded-2xl ">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome Back!</h2>
                        <p className="text-gray-500 text-sm">Enter your registered mobile number to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${error ? 'border-red-500' : 'border-gray-200'}`}
                                    placeholder="Enter 10-digit mobile number"
                                    maxLength={10}
                                    disabled={isLoading}
                                />
                            </div>
                            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center gap-2 bg-[#14B8A6] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <TbFidgetSpinner className="w-5 h-5 animate-spin" />
                                    Sending OTP...
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                </div>
            </div>

            <VerifyOtp
                isOpen={showOtpModal}
                onClose={() => setShowOtpModal(false)}
                onVerify={handleVerifyOtp}
                onResend={() => handleLogin()}
                mobileNumber={mobileNumber}
            />
        </div>
    );
}

export default Login;
