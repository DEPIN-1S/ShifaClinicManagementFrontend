import React from 'react';
import { X, FileType, ImageIcon, ArrowLeft } from 'lucide-react';

export default function DownloadActionModal({ isOpen, onClose, onDownloadPdf, onDownloadPng, isDownloading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-0 w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-50 duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Download Report</h3>
                        <p className="text-xs text-gray-500">Select your preferred format</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                    <button
                        onClick={onDownloadPdf}
                        disabled={isDownloading}
                        className="w-full relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-red-200 hover:bg-red-50/50 group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                                <FileType size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-800 group-hover:text-red-700 transition-colors">PDF Document</p>
                                <p className="text-xs text-gray-500 group-hover:text-red-500/80">Best for printing & sharing</p>
                            </div>
                        </div>
                        {isDownloading ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-red-500 group-hover:border-red-100 shadow-sm transition-all">
                                <ArrowLeft className="rotate-180" size={16} />
                            </div>
                        )}
                    </button>

                    <button
                        onClick={onDownloadPng}
                        disabled={isDownloading}
                        className="w-full relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                <ImageIcon size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">PNG Image</p>
                                <p className="text-xs text-gray-500 group-hover:text-blue-500/80">High quality image format</p>
                            </div>
                        </div>
                        {isDownloading ? (
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-blue-500 group-hover:border-blue-100 shadow-sm transition-all">
                                <ArrowLeft className="rotate-180" size={16} />
                            </div>
                        )}
                    </button>
                </div>

                {/* Footer Info */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 font-medium">Securely generated by Shifa Clinic System</p>
                </div>
            </div>
        </div>
    );
}
