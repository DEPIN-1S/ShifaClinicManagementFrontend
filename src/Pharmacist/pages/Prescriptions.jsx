
import AuthImage from "../../components/AuthImage";
import React, { useState, useEffect } from "react";
import PharmacistSidebar from "../components/PharmacistSidebar";
import { Search, Menu, Info, X, ChevronDown, CheckCircle, Clock, FileText, Pill, ChevronRight, Download, Calendar, Activity, Stethoscope, User, AlertCircle, Send, Eye, RotateCcw } from 'lucide-react';
import { getPharmacistPrescriptionsApi, getPrescriptionDetailsApi } from "../../services/PharmacistAllApi";
import { BASE_URL } from "../../services/baseURL";
import ViewPrescriptionModal from "../components/ViewPrescriptionModal";

export default function Prescriptions() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Pending");
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const calculateDetailedAge = (dob) => {
    if (!dob) return "--";
    const start = new Date(dob);
    const end = new Date();
    if (start > end) return "--";

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months--;
      // get days in previous month
      const prevMonthDate = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonthDate.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    if (years > 0) return `${years} Years`;
    if (months > 0) return `${months} Months`;
    return `${days} Days`;
  };

  const handleViewPrescription = async (id, updateMode = false) => {
    try {
      setIsUpdateMode(updateMode);
      const result = await getPrescriptionDetailsApi(id);
      if (result.status === 200) {
        setSelectedPrescription(result.data.data);
      } else {
        console.error("Failed to fetch details");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [activeTab]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const statusToSend = activeTab === "Completed" ? "Dispensed" : activeTab;
      const output = await getPharmacistPrescriptionsApi(statusToSend);
      if (output.status === 200) {
        setPrescriptions(output.data.data || []);
        console.log("Prescriptions data:", JSON.stringify(output.data.data?.[0], null, 2));
      } else {
        setError("Failed to fetch prescriptions");
      }
    } catch (err) {
      setError("An error occurred while fetching prescriptions");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    const tokenMatch = item.tokenNumber?.toString().includes(searchLower);
    const nameMatch = item.Patient?.fullName?.toLowerCase().includes(searchLower);
    return tokenMatch || nameMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
      case "Dispensed":
        return "bg-green-50 text-green-600 border-green-100";
      case "Pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const calculatePharmacyAmount = (prescription) => {
    if (prescription.pharmacyAmount) return parseFloat(prescription.pharmacyAmount);

    // Check specific payment fields based on mode or existence
    let total = 0;

    // Parse strings to floats as API returns strings like "678.00"
    if (prescription.pharmacyCash) total += parseFloat(prescription.pharmacyCash || 0);
    if (prescription.pharmacyOnline) total += parseFloat(prescription.pharmacyOnline || 0);
    if (prescription.pharmacyRazorPay) total += parseFloat(prescription.pharmacyRazorPay || 0);

    // Also check direct keys if pharmacy prefix keys are missing or 0 but mode suggests otherwise
    if (total === 0) {
      if (prescription.razorPay) total += parseFloat(prescription.razorPay || 0);
      if (prescription.onlinePayment) total += parseFloat(prescription.onlinePayment || 0);
      if (prescription.cash) total += parseFloat(prescription.cash || 0);
      if (prescription.combined) {
        total += parseFloat(prescription.combined.cash || 0);
        total += parseFloat(prescription.combined.onlinePayment || 0);
      }
    }

    return total;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-poppins">
      {/* Sidebar */}
      <PharmacistSidebar
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebar}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content */}
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ease-in-out p-6 lg:p-10
                ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
            `}
      >
        {/* Mobile Header */}
        <div className="lg:hidden mb-6 flex justify-between items-center">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-slate-900 text-white shadow-lg"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Shifa Clinic</h1>
          <div className="w-10"></div>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Prescriptions</h1>
          <p className="text-gray-500 mt-1">View pending and completed prescriptions</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-2 mb-8 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Filters/Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab("Pending")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors
                        ${activeTab === "Pending"
                ? "bg-white text-slate-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-slate-700"}`}
          >
            <Clock size={16} className={activeTab === "Pending" ? "text-slate-900" : ""} />
            Pending ({activeTab === "Pending" ? prescriptions.length : "..."})
          </button>
          <button
            onClick={() => setActiveTab("Completed")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors
                        ${activeTab === "Completed"
                ? "bg-white text-slate-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-slate-700"}`}
          >
            <CheckCircle size={16} className={activeTab === "Completed" ? "text-slate-900" : ""} />
            Completed ({activeTab === "Completed" ? prescriptions.length : "..."})
          </button>
        </div>

        {/* Prescriptions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading prescriptions...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-400">{error}</div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">No prescription to dispense today</h3>
            </div>
          ) : (
            filteredPrescriptions.map((prescription) => (
              <div key={prescription.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Token Number - Teal Circle */}
                  <div className="w-14 h-14 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-semibold text-lg shrink-0 shadow-sm shadow-teal-900/10">
                    {prescription.tokenNumber}
                  </div>

                  {/* Profile Picture / Avatar - Gray Circle */}
                  <div
                    className="w-14 h-14 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center shrink-0 overflow-hidden relative border border-gray-100 cursor-pointer hover:border-[#14B8A6] transition-colors group-hover:scale-105 duration-200"
                    onClick={() => {
                      if (prescription.Patient?.profilePhoto) {
                        const imgUrl = prescription.Patient.profilePhoto.startsWith("http")
                          ? prescription.Patient.profilePhoto
                          : `${BASE_URL}/uploads/${prescription.Patient.profilePhoto}`;
                        setPreviewImage(imgUrl);
                      }
                    }}
                  >
                    <User size={24} className="absolute z-0" />
                    {prescription.Patient?.profilePhoto && (
                      <AuthImage
                        src={prescription.Patient.profilePhoto.startsWith("http")
                          ? prescription.Patient.profilePhoto
                          : `${BASE_URL}/uploads/${prescription.Patient.profilePhoto}`}
                        onError={(e) => { e.target.style.opacity = '0' }}
                        alt={prescription.Patient.fullName}
                        className="w-full h-full object-cover relative z-10"
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-lg">
                        {prescription.Patient?.fullName || `Token #${prescription.tokenNumber}`}
                      </h3>
                      {prescription.Patient?.uniqueId && (
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">
                          #{prescription.Patient.uniqueId}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      {prescription.Patient?.sex || "--"}
                      <span className="text-gray-300">•</span>
                      {calculateDetailedAge(prescription.Patient?.dateOfBirth)}
                    </div>

                    {/* Doctor Name Badge - Moved here */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-slate-600">
                        <Stethoscope size={12} className="text-[#14B8A6]" />
                        <span className="text-xs font-semibold"> {prescription.Doctor?.fullName || "Unknown"}</span>
                      </div>
                      {prescription.dispensedByName && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-slate-600">
                          <Pill size={12} className="text-blue-500" />
                          <span className="text-xs font-semibold">{prescription.dispensedByName}</span>
                        </div>
                      )}
                    </div>




                    {/* Compact CD & CF Badges */}
                    <div className="mt-2 flex items-center gap-2">
                      {/* Clinical Findings / Drug Allergy / Payment Badge */}
                      {(prescription.paymentStatus === "Payable" || prescription.paymentStatus === "payable") && (
                        <div className="relative">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                            CF
                          </span>
                        </div>
                      )}

                      {/* Cardio Diabetic Badge */}
                      {(() => {
                        let hasCD = false;

                        // Check CD Data existence
                        if (prescription.isCardiodiabetic) hasCD = true;

                        if (prescription.cardioDiabetic) {
                          if (Array.isArray(prescription.cardioDiabetic) && prescription.cardioDiabetic.length > 0) hasCD = true;
                          else if (typeof prescription.cardioDiabetic === 'string' && prescription.cardioDiabetic.startsWith('[') && prescription.cardioDiabetic.length > 2) hasCD = true;
                          else if (typeof prescription.cardioDiabetic === 'object' && Object.keys(prescription.cardioDiabetic).length > 0) hasCD = true;
                        }

                        // Check flat fields
                        if (!hasCD && (prescription.bp || prescription.fbs || prescription.ppbs || prescription.totalCholesterol || prescription.cholesterol)) {
                          hasCD = true;
                        }

                        if (!hasCD) return null;

                        return (
                          <div className="relative group cursor-help">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                              CD
                            </span>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                              Cardio-Diabetic Record Available
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-8 w-full md:w-auto">
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border mb-1 ${getStatusColor(prescription.dispenseStatus || 'Pending')}`}>
                      {prescription.dispenseStatus === 'Dispensed' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {prescription.dispenseStatus || "Pending"}
                    </div>
                    {prescription.dispenseStatus === 'Dispensed' && (
                      <div className="text-lg font-bold text-slate-900 leading-tight">
                        ₹{calculatePharmacyAmount(prescription).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewPrescription(prescription.id)}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-slate-700 font-medium hover:bg-gray-50 hover:text-slate-900 transition-colors text-sm flex items-center gap-2"
                    >
                      {activeTab === "Completed" ? (
                        <>
                          <Eye size={18} />
                          View Prescription
                        </>
                      ) : (
                        <>
                          <Pill size={18} />
                          Dispense
                        </>
                      )}
                    </button>
                    {activeTab === "Completed" && (
                      <button
                        onClick={() => handleViewPrescription(prescription.id, true)}
                        className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 font-medium hover:bg-amber-100 transition-colors text-sm flex items-center gap-2"
                      >
                        <RotateCcw size={16} />
                        Update Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Prescription Details Modal */}
      {
        selectedPrescription && (
          <ViewPrescriptionModal
            prescription={selectedPrescription}
            onClose={() => {
              setSelectedPrescription(null);
              setIsUpdateMode(false);
            }}
            onDispenseSuccess={fetchPrescriptions}
            isUpdateMode={isUpdateMode}
          />
        )
      }


      {/* Profile Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative animate-in zoom-in-50 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white shadow-2xl relative">
              <AuthImage
                src={previewImage}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-0 right-0 bg-white/90 hover:bg-white text-slate-900 rounded-full p-2 shadow-lg transition-colors transform translate-x-1/4 -translate-y-1/4"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )
      }
    </div>
  );
}
