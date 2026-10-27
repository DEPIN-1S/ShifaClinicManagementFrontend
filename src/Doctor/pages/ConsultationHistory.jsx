import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ActiveConsultation from "../components/ActiveConsultation";
import { getConsultationHistoryFullApi } from "../../services/DoctorAllApi";
import DoctorSidebar from "../components/DoctorSidebar";
import { Menu, Calendar, User, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ConsultationHistory() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [allVisits, setAllVisits] = useState([]);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!patientId) return;
            try {
                const response = await getConsultationHistoryFullApi(patientId);
                // Handle different response structures gracefully
                if (response.status === 200) {
                    const data = response.data.data || response.data;

                    if (Array.isArray(data) && data.length > 0) {
                        setAllVisits(data);
                        setSelectedVisit(data[0]); // Default to latest (assuming sorted by API or DB)
                    } else if (data && !Array.isArray(data)) {
                        // Single object fallback
                        setAllVisits([data]);
                        setSelectedVisit(data);
                    }
                }
            } catch (error) {
                console.error("Error loading consultation history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [patientId]);

    // Format date helper to avoid invalid date errors
    const safeFormat = (dateStr, fmt) => {
        try {
            if (!dateStr) return "";
            return format(new Date(dateStr), fmt);
        } catch (e) {
            return "";
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading history...</div>;
    }

    if (!selectedVisit) {
        return (
            <div className="min-h-screen bg-gray-50 flex font-poppins">
                <DoctorSidebar isCollapsed={isSidebarCollapsed} toggleCollapse={toggleSidebar} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
                <main className={`flex-1 flex items-center justify-center text-gray-500 ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
                    No consultation history found for this patient.
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            <DoctorSidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={toggleSidebar}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out py-6 pr-6 pl-6 ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} flex gap-6`}>

                {/* Main Active Consultation View */}
                <div className="flex-1 min-w-0"> {/* min-w-0 ensures flex child doesn't overflow */}
                    {/* Mobile Header */}
                    <div className="lg:hidden mb-6 flex justify-between items-center">
                        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-slate-900 text-white shadow-lg">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">History</h1>
                        <div className="w-10"></div>
                    </div>

                    <ActiveConsultation
                        key={selectedVisit.visitDetails?.id || 'default'}
                        patient={selectedVisit.Patient} // Pass the patient object from the visit
                        onBack={() => navigate(-1)}
                        onEnd={() => navigate(-1)}
                        readOnly={true}
                        initialData={selectedVisit}
                        allowFileDeletion={true}
                    />
                </div>

                {/* Right Side: History List (Desktop Only) */}
                <div className="w-64 hidden xl:flex flex-col gap-4 h-[calc(100vh-3rem)] sticky top-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex-1 overflow-y-auto">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-[#14B8A6]" />
                            Previous Visits
                        </h3>

                        <div className="space-y-3">
                            {allVisits.map((visit, index) => {
                                const visitDate = visit.visitDetails?.date || visit.visitDetails?.updatedAt;
                                const isSelected = selectedVisit === visit;

                                return (
                                    <div
                                        key={index}
                                       
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${isSelected
                                            ? "border-[#14B8A6] bg-teal-50 ring-1 ring-[#14B8A6]"
                                            : "border-gray-100 hover:border-teal-200 bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-gray-100 text-gray-600">
                                                {safeFormat(visitDate, "dd MMM yyyy")}
                                            </span>
                                            {isSelected && (
                                                <span className="w-2 h-2 rounded-full bg-[#14B8A6]"></span>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-700 font-medium mb-1 flex items-center gap-2">
                                            <User size={14} className="text-gray-400" />
                                            {visit.visitDetails?.doctorName || "Doctor"}
                                        </div>

                                        <div className="text-xs text-gray-500 flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {safeFormat(visitDate, "hh:mm a")}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
