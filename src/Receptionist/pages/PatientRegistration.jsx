import AuthImage from "../../components/AuthImage";
import React, { useEffect, useState } from "react";
import ReceptionistSidebar from "../components/ReceptionistSidebar";
import ConfirmPatientDetails from "../components/ConfirmPatientDetails";
import PatientTokenSuccess from "../components/PatientTokenSuccess";
import PatientRegistrationForm from "../components/PatientRegistrationForm";
import { Search, Phone, ArrowRight, Menu, MoreVertical } from "lucide-react";
import { searchPatientApi, registerPatientApi } from "../../services/receptionistAllApi";
import { calculateDetailedAge } from "../../utils/dateUtils";
import { BASE_URL } from "../../services/baseURL";

function PatientRegistration() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  // Steps: 'search' | 'form' | 'confirm' | 'success'
  const [step, setStep] = useState('search');
  const [tokenNumber, setTokenNumber] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isMobileLocked, setIsMobileLocked] = useState(false); // [NEW] Lock mobile input // [NEW] Track active menu
  const [flowSource, setFlowSource] = useState('search'); // 'search' | 'form'

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    sex: "",
    mobile: "",
    paymentStatus: ""
  });

  // Track payment status separately if not part of formData (or merge with formData setup)
  // Since confirm component needs it, and it comes from patient search OR new registration
  const [paymentStatus, setPaymentStatus] = useState("");

  const [patientData, setPatientData] = useState([]);

  const getImageUrl = (path) => {
    if (!path) return null;
    const cleanStr = String(path).trim();
    if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
    let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
    return `${BASE_URL}/${finalPath}`;
  };

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Live search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (phoneNumber && phoneNumber.length >= 3) { // Start searching after 3 chars
        const performSearch = async () => {
          try {
            const result = await searchPatientApi(`query=${phoneNumber}`);
            if (result.status === 200 && result.data.data.length > 0) {
              setPatientData(result.data.data);
            } else {
              setPatientData([]);
            }
          } catch (error) {
            console.log(error);
          }
        }
        performSearch();
      } else {
        setPatientData([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [phoneNumber]);

  const handleManualSearch = () => {
    if (patientData.length === 0) {
      // Validate that we at least have something? Or just let them go?
      // User said "allow user to fill all 10 digits there" (in form).
      // So we pass what we have, and let them edit.
      setFormData({ ...formData, mobile: phoneNumber });
      setIsMobileLocked(true);
      setFlowSource('form');
      setStep('form');
    }
  };

  const handleRegistrationSuccess = (result, submittedData) => {
    // The child component calls this with the API result on success
    const generatedToken = result.data.token || result.data.data?.token || 0;
    setTokenNumber(generatedToken);

    // Extract patientId
    const pId = result.data._id || result.data.data?._id || result.data.id || result.data.data?.id;
    setPatientId(pId);

    const uniqueId = result.data.uniqueId || result.data.data?.uniqueId;
    const backendProfilePhoto = result.data.profilePhoto || result.data.data?.profilePhoto;

    if (submittedData) {
      setFormData({
        ...submittedData,
        uniqueId: uniqueId,
        profilePhoto: backendProfilePhoto || submittedData.profilePhoto
      });
    }

    // New patient registration usually implies "Payable" or we assume "Payable" or check result
    // The user didn't specify for new registration, but typically new patients are "Payable".
    // Or if the API returns the patient object check that.
    const pStatus = result.data.paymentStatus || result.data.data?.paymentStatus || "Payable";
    setPaymentStatus(pStatus);

    setStep('confirm');
  };

  const [successData, setSuccessData] = useState(null);

  const handleConfirmToken = async (tokenData) => {
    // tokenData is the object from API: { "Token Number": 5, "Patient ID": ..., ... }
    if (tokenData) {
      setTokenNumber(tokenData["Token Number"]);
      setSuccessData(tokenData);
    }
    setStep('success');
  };

  const handleSelectPatient = (patient) => {
    setFormData({
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth || patient.age,
      sex: patient.sex,
      mobile: patient.mobile,
      uniqueId: patient.uniqueId,
      profilePhoto: patient.profilePhoto
    });
    setPaymentStatus(patient.paymentStatus || "Payable");
    setPatientId(patient._id || patient.id);
    setFlowSource('search');
    setStep('confirm');
  }

  const handleRegisterNew = () => {
    // For context menu registration with SAME number
    // We should use the number from the patient we clicked on? 
    // The previous implementation used 'phoneNumber' state which was the SEARCH QUERY.
    // If I search "98", I see a patient with "9846...". If I click register new, 
    // it should use "9846..." not "98".

    // Changing handleRegisterNew to accept the full mobile number
    // Since I can't easily pass arguments in the existing onClick without changing it...
    // Wait, I updated the onClick in previous step to call handleRegisterNew() without args.
    // I should check if I can modify that.

    // Actually, let's just use what's in the search bar if that's what the user intended?
    // NO, the user said "clickimg the three dot for the patient with sam phone number".
    // So it must ensure the SAME number is used.

    // I need to update the trigger in the JSX to pass the mobile number.
    // But first let's update this function to accept it.
  }

  // Revised handleRegisterNew to accept mobile
  // But wait, the previous tool call didn't change the function signature in this file.
  // I need to replace the whole function and then update the JSX usage.


  const handleReset = () => {
    setStep('search');
    setPhoneNumber("");
    setPatientData([]);
    setPatientId(null);
    setFormData({
      fullName: "",
      dateOfBirth: "",
      sex: "",
      mobile: ""
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-poppins">
      {/* Sidebar */}
      <ReceptionistSidebar
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
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-slate-900">Patient Registration</h1>
          <p className="text-gray-500 mt-1">Search for existing patients or register new ones</p>
        </div>

        {/* Content Area */}
        {step === 'search' && (
          <div className="max-w-xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Search className="text-[#14B8A6]" size={24} />
                  Search Patient
                </h2>
                <p className="text-gray-500 mt-2 text-sm">
                  Enter the patient's phone number to search
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val) && val.length <= 10) {
                        setPhoneNumber(val);
                        if (patientData.length > 0) setPatientData([]); // Clear results on type
                      }
                    }}
                    placeholder="Enter 10-digit phone number"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all text-gray-700 placeholder-gray-400"
                  />
                </div>

                <button
                  onClick={handleManualSearch}
                  disabled={!/^\d{10}$/.test(phoneNumber)}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group
                    ${!/^\d{10}$/.test(phoneNumber)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-[#14B8A6] hover:bg-teal-600 text-white shadow-teal-900/10'
                    }`}
                >
                  Search Patient / Register New
                  <ArrowRight size={20} className={`transition-transform ${/^\d{10}$/.test(phoneNumber) ? 'group-hover:translate-x-1' : ''}`} />
                </button>
              </div>

              {/* Found Patients List */}
              {patientData.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Found Patients</h3>
                  <div className="space-y-3">
                    {patientData.map((patient) => (
                      <div key={patient.id} className="p-4 rounded-xl border border-gray-200 hover:border-[#14B8A6] hover:bg-teal-50/30 transition-all cursor-pointer flex items-center justify-between group" onClick={() => handleSelectPatient(patient)}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold overflow-hidden border border-teal-100 shrink-0">
                            {patient.profilePhoto ? (
                              <AuthImage
                                src={getImageUrl(patient.profilePhoto)}
                                alt={patient.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              patient.fullName?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{patient.fullName}</h4>
                            <p className="text-sm text-gray-500">ID: {patient.uniqueId} • {calculateDetailedAge(patient.dateOfBirth) || (patient.age + " years")} • {patient.mobile}</p>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === patient.id ? null : patient.id);
                            }}
                            className="p-2 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {/* Context Menu */}
                          {activeMenuId === patient.id && (
                            <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Pass the PATIENT'S mobile number, not the search query
                                  setFormData({ ...formData, mobile: patient.mobile });
                                  setIsMobileLocked(true); // Lock it for family registration
                                  setStep('form');
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#14B8A6] font-medium transition-colors"
                              >
                                Register new patient
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>


                </div>
              )}
            </div>
          </div>
        )}

        {step === 'form' && (
          <PatientRegistrationForm
            initialData={formData}
            isMobileLocked={isMobileLocked}
            onCancel={handleReset}
            onSubmit={handleRegistrationSuccess}
          />
        )}

        {step === 'confirm' && (
          <ConfirmPatientDetails
            formData={formData}
            patientId={patientId}
            onCancel={() => flowSource === 'search' ? setStep('search') : setStep('form')}
            onConfirm={handleConfirmToken}
            paymentStatus={paymentStatus}
          />
        )}

        {step === 'success' && (
          <PatientTokenSuccess
            onReset={handleReset}
            patientData={formData}
            tokenNumber={tokenNumber}
            successData={successData}
          />
        )}

      </main>
    </div>
  )
}

export default PatientRegistration
