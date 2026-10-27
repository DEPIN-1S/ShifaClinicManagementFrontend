import React, { useEffect, useState } from 'react';
import { X, User } from 'lucide-react';
import { editUserApi } from '../../services/adminAllApi';
import Swal from 'sweetalert2';

export default function EditUserModal({ isOpen, onClose, user, onUpdate }) {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        role: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.fullName || '',
                mobile: user.mobile || '',
                role: user.role || ''
            });
        }
    }, [user]);

    const handleUpdate = async () => {
        // Validation
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Full Name is required";
        if (!formData.mobile.trim()) newErrors.mobile = "Mobile Number is required";
        else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = "Enter a valid 10-digit number";
        if (!formData.role) newErrors.role = "Role selection is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        try {
            const reqBody = new FormData();
            reqBody.append("fullName", formData.name);
            reqBody.append("mobile", formData.mobile);
            reqBody.append("role", formData.role);
            reqBody.append("id", user.id);
            reqBody.append("status", user.status || "Active");
            // Assuming image handling is separate or not implemented yet for edit
            // reqBody.append("userProfile", user.userProfile); 

            const result = await editUserApi(user.id, reqBody);
            console.log("Update Result:", result);
            if (result.status === 200) {
                Swal.fire({
                    title: 'Success',
                    text: 'User updated successfully',
                    icon: 'success',
                    iconColor: '#14B8A6',
                    confirmButtonText: 'OK'
                });
                onUpdate(); // Refresh list
                onClose();
            } else {
                let errorMessage = "Failed to update user";
                if (result.response?.data?.error && Array.isArray(result.response.data.error)) {
                    // Extract the message from the first error object
                    const firstError = result.response.data.error[0];
                    if (firstError.message) {
                        errorMessage = firstError.message;
                    }
                } else if (result.data?.message) {
                    errorMessage = result.data.message;
                } else if (result.response?.data?.message) {
                    errorMessage = result.response.data.message;
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMessage
                });
            }
        } catch (error) {
            console.log(error);
            let errorMessage = "An unexpected error occurred type";

            if (error.response?.data?.error && Array.isArray(error.response.data.error)) {
                const firstError = error.response.data.error[0];
                if (firstError.message) {
                    errorMessage = firstError.message;
                }
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
                {/* Header */}
                <div className="flex justify-between items-start p-6 pb-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Edit User</h2>
                        <p className="text-sm text-gray-500 mt-1">Update staff account details and permissions.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Form Fields */}

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-900 mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => {
                                    setFormData({ ...formData, name: e.target.value.replace(/[0-9]/g, '') });
                                    if (errors.name) setErrors({ ...errors, name: null });
                                }}
                                placeholder="Enter full name"
                                className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all text-sm ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#14B8A6]'}`}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-900 mb-1.5">Mobile Number</label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => {
                                    setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') });
                                    if (errors.mobile) setErrors({ ...errors, mobile: null });
                                }}
                                placeholder="10-digit mobile number"
                                maxLength={10}
                                className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all text-sm ${errors.mobile ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#14B8A6]'}`}
                            />
                            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-900 mb-1.5">Role</label>
                            <div className="relative">
                                <select
                                    value={formData.role}
                                    onChange={(e) => {
                                        setFormData({ ...formData, role: e.target.value });
                                        if (errors.role) setErrors({ ...errors, role: null });
                                    }}
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all text-sm appearance-none bg-white ${errors.role ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#14B8A6]'}`}
                                >
                                    <option value="">Select role</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Receptionist">Receptionist</option>
                                    <option value="Pharmacy">Pharmacist</option>
                                    <option value="LabTechnician">Lab Technician</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-8 pt-4 border-t border-gray-50">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#14B8A6] text-white text-sm font-medium hover:bg-teal-600 shadow-lg shadow-teal-900/10 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
