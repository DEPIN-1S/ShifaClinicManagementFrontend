import React from 'react';
import { X, Calendar, Activity, Weight, Ruler, Clock } from 'lucide-react';

export default function VitalsHistoryModal({ isOpen, onClose, history, readOnly = false }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#14B8A6] flex items-center justify-center">
                            <Activity size={18} />
                        </div>
                        <h3 className="font-bold text-slate-900">Vitals History</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {history && history.length > 0 ? (
                        <div className="space-y-3">
                            {history.map((record, index) => (
                                <div key={index} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-3">
                                        {readOnly ? (
                                            <>
                                                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-[10px] text-gray-500 font-medium">
                                                    <Calendar size={12} className="text-[#14B8A6]" />
                                                    {new Date(record.date).toLocaleDateString('en-GB')}
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-[10px] text-gray-500 font-medium">
                                                    <Clock size={12} className="text-gray-400" />
                                                    {new Date(record.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xs font-semibold text-slate-700">
                                                    {new Date(record.date).toLocaleDateString()}
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-[10px] text-gray-500">
                                                    {new Date(record.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-blue-500 shadow-sm">
                                                <Ruler size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium">Height</p>
                                                <p className="text-sm font-bold text-slate-700">{record.height || "-"} <span className="text-xs font-normal text-gray-400">cm</span></p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-rose-500 shadow-sm">
                                                <Weight size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium">Weight</p>
                                                <p className="text-sm font-bold text-slate-700">{record.weight || "-"} <span className="text-xs font-normal text-gray-400">kg</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Activity size={32} className="text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">No history recorded</p>
                            <p className="text-xs text-gray-400">Previous vitals will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
