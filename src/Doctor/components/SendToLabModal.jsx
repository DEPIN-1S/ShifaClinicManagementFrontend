import React, { useState } from 'react';
import { X, Send, AlertCircle, Clock, Zap, FileText } from 'lucide-react';

export default function SendToLabModal({ isOpen, onClose, fileData, onSend, isSending }) {
    const [priority, setPriority] = useState('Medium');

    if (!isOpen) return null;

    const priorities = [
        { id: 'High', label: 'High', icon: Zap, color: 'bg-red-50 text-red-600 border-red-200', userSelect: 'ring-red-400' },
        { id: 'Medium', label: 'Medium', icon: AlertCircle, color: 'bg-orange-50 text-orange-600 border-orange-200', userSelect: 'ring-orange-400' },
        { id: 'Low', label: 'Low', icon: Clock, color: 'bg-blue-50 text-blue-600 border-blue-200', userSelect: 'ring-blue-400' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl transform transition-all scale-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Send size={20} className="text-[#14B8A6]" />
                        Send to Our Lab
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* File Info */}
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="p-3 bg-white rounded-lg shadow-sm text-teal-600">
                            <FileText size={24} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{fileData?.name || "Unknown File"}</p>
                            <p className="text-xs text-gray-500 mt-1">Ready to send</p>
                        </div>
                    </div>

                    {/* Priority Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">Select Priority</label>
                        <div className="grid grid-cols-3 gap-3">
                            {priorities.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPriority(p.id)}
                                    className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${priority === p.id
                                        ? `bg-white ${p.userSelect} ring-2 border-transparent shadow-sm`
                                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-500'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${p.color}`}>
                                        <p.icon size={18} />
                                    </div>
                                    <span className={`text-xs font-medium ${priority === p.id ? 'text-slate-900' : 'text-gray-500'}`}>
                                        {p.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors"
                        disabled={isSending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSend(priority)}
                        disabled={isSending}
                        className="px-6 py-2 bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Send to Our Lab
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
