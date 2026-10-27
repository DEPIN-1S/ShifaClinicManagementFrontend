import AuthImage from "../../components/AuthImage";
import React from 'react';
import { X } from 'lucide-react';

export default function ImagePreviewModal({ isOpen, onClose, imageUrl, title }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white z-10">
                    <h3 className="font-semibold text-slate-900">{title || "Preview"}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-slate-900 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-auto flex items-center justify-center bg-gray-50 flex-1">
                    {imageUrl ? (
                        <AuthImage
                            src={imageUrl}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                        />
                    ) : (
                        <p className="text-gray-400">No image to display</p>
                    )}
                </div>
            </div>
        </div>
    );
}
