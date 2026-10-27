import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DoctorSidebar from "../components/DoctorSidebar";
import ActiveConsultation from "../components/ActiveConsultation";
import { ArrowLeft, Menu } from "lucide-react";

export default function ConsultationDetails() {
    const { id } = useParams(); // Start expecting 'id' as the visit ID
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // Mock patient object with just the ID to trigger fetch in ActiveConsultation
    // ActiveConsultation will fetch full details using this ID
    const patientStub = {
        id: id,
        name: "Loading...",
        patientId: "",
        age: "",
        gender: "",
        time: "",
        token: ""
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            <DoctorSidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={toggleSidebar}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out p-6 lg:p-10 ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
                {/* Mobile Header */}
                <div className="lg:hidden mb-6 flex justify-between items-center">
                    <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-slate-900 text-white shadow-lg">
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Shifa Clinic</h1>
                    <div className="w-10"></div>
                </div>

                <div className="max-w-5xl mx-auto">
                    {/* We pass readOnly={true} to disable editing */}
                    <ActiveConsultation
                        patient={patientStub}
                        onBack={() => navigate(-1)}
                        readOnly={true}
                    />
                </div>
            </main>
        </div>
    );
}
