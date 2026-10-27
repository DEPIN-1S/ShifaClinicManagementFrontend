import AuthImage from "../../components/AuthImage";
import React, { useState } from 'react';
import { User, Phone, ArrowRight, ChevronDown } from "lucide-react";
import { registerPatientApi, editPatientApi } from '../../services/receptionistAllApi';
import { BASE_URL } from '../../services/baseURL';
import Swal from 'sweetalert2';

function PatientRegistrationForm({ initialData, onCancel, onSubmit, isMobileLocked = false, registerApi, editApi, isEdit = false, patientId }) {
    const [formData, setFormData] = useState(initialData || {
        fullName: "",
        dateOfBirth: "",
        sex: "",
        mobile: ""
    });

    const getImageUrl = (path) => {
        if (!path) return null;
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        return `${BASE_URL}/${finalPath}`;
    };

    // [NEW] State for Profile Photo
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(() => {
        if (initialData?.profilePhoto) {
            return getImageUrl(initialData.profilePhoto);
        }
        return null;
    });
    const fileInputRef = React.useRef(null);

    const handleFormInputChange = (e) => {
        const { name, value } = e.target;

        // [NEW] Restrict numeric input for fullName
        if (name === "fullName" && /[^a-zA-Z\s]/.test(value)) {
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // [NEW] Handle File Change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhoto(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!formData.fullName || !formData.dateOfBirth || !formData.sex || !formData.mobile) {
            alert("Please fill in all fields");
            return;
        }

        if (formData.mobile.length !== 10) {
            alert("Please enter a valid 10-digit phone number");
            return;
        }

        try {
            // [MODIFIED] Use FormData to handle file upload
            const data = new FormData();
            data.append("fullName", formData.fullName);
            // Handle date format if needed (backend usually expects YYYY-MM-DD which input type=date provides)
            // If editing, dateOfBirth might come in ISO format, ensure it's simple date string if backend needs it?
            // Input type="date" value usually is YYYY-MM-DD. 
            // If formData.dateOfBirth is full ISO from initialData, we might need to truncate it for the input display, 
            // but here we just append what we have.
            data.append("dateOfBirth", formData.dateOfBirth);
            data.append("sex", formData.sex);
            data.append("mobile", formData.mobile);

            // Calculate and append Age
            if (formData.dateOfBirth) {
                const birthDate = new Date(formData.dateOfBirth);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                data.append("age", age);
            }

            // Append photo if selected using keys 'profilePhoto'
            if (profilePhoto) {
                data.append("profilePhoto", profilePhoto);
            }

            let result;
            if (isEdit) {
                // Use passed API or fallback
                const apiCall = editApi || editPatientApi;
                result = await apiCall(patientId, data);
            } else {
                // Use passed API or fallback
                const apiCall = registerApi || registerPatientApi;
                result = await apiCall(data);
            }

            console.log("Submission Result:", result);

            if (result.status === 200 || result.data?.success === true) {
                Swal.fire({
                    title: isEdit ? 'Patient Updated!' : 'Patient Registered!',
                    text: isEdit ? 'Patient details have been updated.' : 'New user has been added.',
                    icon: 'success',
                    iconColor: '#14B8A6',
                    confirmButtonText: 'OK',
                }).then(() => {
                    onSubmit(result, { ...formData, profilePhoto });
                });
            } else {
                Swal.fire({
                    title: 'Failed!',
                    text: result.response?.data?.message || `Failed to ${isEdit ? 'update' : 'register'} patient.`,
                    icon: 'error',
                    iconColor: '#14B8A6',
                    confirmButtonText: 'OK',
                })
            }
        }
        catch (error) {
            console.log(error);
            alert(`An error occurred during ${isEdit ? 'update' : 'registration'}.`);
        }
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">

            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <User className="text-[#14B8A6]" size={24} />
                    {isEdit ? "Edit Patient Details" : "New Patient Registration"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {isEdit ? "Update the details below." : "Please fill in the details for new patient registration."}
                </p>
            </div>

            {/* Photo Upload */}
            <div className="flex flex-col items-center justify-center mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">Patient Photo (Optional)</label>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-teal-50 flex flex-col items-center justify-center cursor-pointer hover:bg-teal-100 transition-colors border-2 border-dashed border-teal-200 overflow-hidden relative"
                >
                    {previewUrl ? (
                        <AuthImage src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <User className="text-teal-500 mb-1" size={32} />
                    )}
                    {previewUrl && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">Change</span>
                        </div>
                    )}
                </div>
                <span className="text-xs text-teal-600 mt-2 font-medium cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {previewUrl ? "Click to change photo" : "Click to upload"}
                </span>
            </div>

            <div className="space-y-5">

                {/* Full Name */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleFormInputChange}
                        placeholder="Enter patient's full name"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all text-slate-900 placeholder-gray-400"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date of Birth */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Date of Birth</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ""} // Handle ISO string
                            onChange={handleFormInputChange}
                            max={new Date().toISOString().split('T')[0]} // [NEW] Restrict future dates
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all text-slate-900 placeholder-gray-400"
                        />
                    </div>
                    {/* Sex */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Sex</label>
                        <div className="relative">
                            <select
                                name="sex"
                                value={formData.sex}
                                onChange={handleFormInputChange}
                                className="w-full p-3 pr-10 bg-white border border-gray-200 rounded-xl appearance-none text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all"
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>
                </div>

                {/* Phone Number */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="tel"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleFormInputChange}
                            readOnly={isMobileLocked}
                            className={`w-full pl-10 pr-4 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all text-slate-900 ${isMobileLocked ? 'cursor-not-allowed opacity-75' : ''}`}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    className="flex-1 py-3 rounded-xl bg-[#14B8A6] hover:bg-teal-600 text-white font-semibold shadow-lg shadow-teal-900/10 transition-all flex items-center justify-center gap-2 group"
                >
                    {isEdit ? "Update Patient" : "Register Patient"}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}

export default PatientRegistrationForm;
