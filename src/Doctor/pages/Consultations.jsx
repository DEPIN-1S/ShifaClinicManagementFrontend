import React, { useEffect, useState } from "react";
import DoctorSidebar from "../components/DoctorSidebar";
import StartConsultationModal from "../components/StartConsultationModal";
import ActiveConsultation from "../components/ActiveConsultation";
import PatientList from "../components/PatientList";
import { Menu } from "lucide-react";
import { fetchPatientsApi, updateVisitStatusApi } from "../../services/DoctorAllApi";
import { calculateDetailedAge } from "../../utils/dateUtils";

export default function Consultations() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [patientList, setPatientList] = useState([]);
  const [activeTab, setActiveTab] = useState("Waiting");

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Process API data
  const formatPatient = (patient) => ({
    id: patient.id,
    token: patient.tokenNumber,
    name: patient?.Patient?.fullName || "Unknown",
    patientId: patient?.Patient?.uniqueId || "",
    age: calculateDetailedAge(patient?.Patient?.dateOfBirth) || (patient?.Patient?.age ? `${patient?.Patient?.age} Years` : "0"),
    dateOfBirth: patient?.Patient?.dateOfBirth,
    gender: patient?.Patient?.sex || "",
    time: patient.createdAt ? new Date(patient.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : "",
    status: patient.status,
    mobile: patient?.Patient?.mobile || "",
    doctorName: patient?.Doctor?.fullName || "Unknown", // [NEW] Map Doctor Name
    paymentStatus: patient.paymentStatus || "Free", // Map paymentStatus
    profilePhoto: patient?.Patient?.profilePhoto, // [NEW] Map profile photo
    CF: patient?.Patient?.CF // [NEW] Map CF status
  });

  const formattedPatients = patientList.map(formatPatient);

  const fetchPatients = async () => {
    try {
      const result = await fetchPatientsApi(activeTab);
      // console.log(result);
      if (result.status === 200) {
        setPatientList(result.data.data || []);
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  const handleStartConsultation = async (patient) => {
    if (patient.status === "InConsultation" || patient.status === "Completed") {
      setSelectedPatient(patient);
      setIsStartModalOpen(false);
      return;
    }

    try {
      const result = await updateVisitStatusApi(patient.id, "InConsultation");
      if (result.status === 200) {
        setSelectedPatient(patient);
        setIsStartModalOpen(false); // Close modal if open
        fetchPatients(); // Refresh list to reflect status change
      } else {
        console.error("Failed to update status");
        // Still proceed locally or show error? Best to proceed but log error or maybe just proceed
        setSelectedPatient(patient);
        setIsStartModalOpen(false);
      }
    } catch (error) {
      console.error("Error starting consultation:", error);
      setSelectedPatient(patient);
      setIsStartModalOpen(false);
    }
  };

  useEffect(() => {
    fetchPatients()
  }, [activeTab])

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

        {selectedPatient ? (
          <ActiveConsultation
            patient={selectedPatient}
            onBack={() => {
              setSelectedPatient(null);
              fetchPatients();
            }}
            onEnd={() => {
              setSelectedPatient(null);
              fetchPatients();
            }}
          />
        ) : (
          <PatientList
            patients={formattedPatients}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onStartNew={() => setIsStartModalOpen(true)}
            onSelectPatient={handleStartConsultation}
          />
        )}
      </main>

      {/* Start Consultation Modal */}
      <StartConsultationModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onStart={handleStartConsultation}
        onRegistrationSuccess={fetchPatients}
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
