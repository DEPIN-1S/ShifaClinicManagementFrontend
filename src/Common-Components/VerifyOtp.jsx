import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';
import logo from '../assets/logo.png'

export default function VerifyOtp({ isOpen, onClose, onVerify, mobileNumber, onResend }) {
    const [otp, setOtp] = useState(['', '', '', '']);
    const inputRefs = useRef([]);
    const [timer, setTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimer(120);
            setCanResend(false);
            setOtp(['', '', '', '']);
            // Focus first input after animation
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isOpen]);

    useEffect(() => {
        let interval;
        if (isOpen && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [isOpen, timer]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous input on backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = () => {
        const otpValue = otp.join('');
        if (otpValue.length === 4) {
            onVerify(otpValue);
        }
    };

    const handleResend = () => {
        setTimer(120);
        setCanResend(false);
        setOtp(['', '', '', '']);
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 0);
        if (onResend) {
            onResend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl px-8 py-5 pb-9 transform transition-all scale-100 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center mb-6">

                    {/*  <ShieldCheck size={32} /> */}
                    <img src={logo} alt="" className='w-20 h-auto' />

                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Verification Code</h2>
                    <p className="text-gray-500 text-sm">
                        We have sent the verification code to <br />
                        <span className="font-semibold text-slate-900">{mobileNumber}</span>
                    </p>
                </div>

                <div className="flex justify-center gap-4 mb-8">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 border-2 border-gray-200 rounded-xl text-center text-xl font-bold text-slate-900 focus:border-[#14B8A6] focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                        />
                    ))}
                </div>

                <button
                    onClick={handleVerify}
                    className="w-full bg-[#14B8A6] hover:bg-teal-600 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-teal-900/10 flex items-center justify-center gap-2 mb-6"
                >
                    Verify and Proceed
                    <ArrowRight size={20} />
                </button>

                <div className="text-center text-sm">
                    {canResend ? (
                        <button
                            onClick={handleResend}
                            className="text-[#14B8A6] font-medium hover:text-teal-700 transition-colors"
                        >
                            Resend Code
                        </button>
                    ) : (
                        <p className="text-gray-400">
                            Resend code in <span className="font-medium text-gray-600">{formatTime(timer)}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
