import AuthImage from "../../components/AuthImage";
import React, { useState, useEffect } from 'react';
import { X, Upload, ChevronDown, Check, Search, Loader2, FileText, User, Camera } from 'lucide-react';
import { searchPatientApi, uploadQuickDocumentApi } from '../../services/DoctorAllApi';
import { BASE_URL } from '../../services/baseURL';
import Swal from 'sweetalert2';
import CameraCapture from './CameraCapture';

export default function DoctorUploadDocument({ isOpen, onClose, onUploadSuccess, preSelectedPatientId }) {
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    const cleanStr = String(path).trim();
    if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;
    let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
    return `${BASE_URL}/${finalPath}`;
  };

  // Handle pre-selected patient
  useEffect(() => {
    const fetchPreSelectedPatient = async () => {
      if (preSelectedPatientId && isOpen) {
        setIsSearching(true);
        try {
          const result = await searchPatientApi(`query=${preSelectedPatientId}`);
          if (result.status === 200) {
            const patientList = result.data.data || result.data || [];
            const match = patientList.find(p => p.id === preSelectedPatientId || p.uniqueId === preSelectedPatientId || p.id === parseInt(preSelectedPatientId));
            if (match) {
              setSelectedPatient(match);
              setPatientSearch(match.fullName);
              setShowDropdown(false);
            }
          }
        } catch (err) {
          console.error("Error fetching pre-selected patient", err);
        } finally {
          setIsSearching(false);
        }
      }
    };

    if (preSelectedPatientId && isOpen && !selectedPatient) {
      fetchPreSelectedPatient();
    }
  }, [preSelectedPatientId, isOpen]);

  useEffect(() => {
    const searchPatients = async () => {
      if (patientSearch.trim().length >= 2 && !selectedPatient) {
        setIsSearching(true);
        try {
          const result = await searchPatientApi(`query=${patientSearch}`);
          if (result.status === 200) {
            setPatients(result.data.data || []);
            setShowDropdown(true);
          }
        } catch (err) {
          console.error("Error searching patients", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setPatients([]);
        setShowDropdown(false);
      }
    };

    const debounceFn = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounceFn);
  }, [patientSearch, selectedPatient]);

  // Reset file name when file changes or modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setFileName("");
      setPatientSearch("");
      setSelectedPatient(null);
      setIsScanning(false);
    }
  }, [isOpen]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.fullName);
    setShowDropdown(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        Swal.fire("Warning", `File "${selectedFile.name}" exceeds 10MB limit.`, "warning");
        return;
      }
      setFile(selectedFile);
      const nameWithoutExtension = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
      setFileName(nameWithoutExtension);
    }
  };

  const handleUpload = async () => {
    if (!selectedPatient || !file) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Details',
        text: 'Please select a patient and upload a file.',
        confirmButtonColor: '#14B8A6'
      });
      return;
    }

    if (!fileName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Details',
        text: 'Please enter a file name.',
        confirmButtonColor: '#14B8A6'
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("patientId", selectedPatient.id);
    // formData.append("documentType", documentType); // Removed as per request
    const extension = file.name.split('.').pop();
    const finalFileName = `${fileName}.${extension}`;
    formData.append("quickDocument", file, finalFileName);
    formData.append("fileName", finalFileName);

    try {
      const result = await uploadQuickDocumentApi(formData);
      if (result.status === 200 || result.status === 201) {
        // Check for success flag in response if applicable, similar to Receptionist
        if (result.data.success === true || result.status === 201) {
          Swal.fire({
            icon: 'success',
            title: 'Upload Successful',
            text: 'Patient document has been uploaded.',
            confirmButtonColor: '#14B8A6'
          });
          onClose();
          if (onUploadSuccess) onUploadSuccess();

          // Reset form
          setPatientSearch("");
          setSelectedPatient(null);
          setFile(null);
          setFileName("");
        } else {
          throw new Error(result.data?.message || "Upload failed");
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: err.response?.data?.message || 'Failed to upload document. Please try again.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm z-[1000]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-start border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upload Document</h2>
            <p className="text-sm text-gray-400 mt-1">Upload a scan, X-ray, or report for a patient</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Patient identity or Search */}
          <div className="space-y-3 relative">
            <label className="text-sm font-semibold text-slate-800">
              {preSelectedPatientId ? 'Patient' : 'Select Patient'}
            </label>

            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-teal-50/50 border border-teal-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#14B8A6] flex items-center justify-center text-white shrink-0">
                    {selectedPatient.profilePhoto ? (
                      <AuthImage
                        src={getImageUrl(selectedPatient.profilePhoto)}
                        alt={selectedPatient.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 leading-tight">{selectedPatient.fullName}</div>
                    <div className="text-xs text-teal-700 font-medium">{selectedPatient.uniqueId} • {selectedPatient.mobile}</div>
                  </div>
                </div>
                {!preSelectedPatientId && (
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setPatientSearch("");
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search patient by name or ID..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      if (selectedPatient) setSelectedPatient(null);
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium
                                    ${selectedPatient ? 'border-teal-500 bg-teal-50/30' : 'border-gray-200'}
                                `}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-600" size={18} />
                  )}
                </div>

                {/* Dropdown Results */}
                {showDropdown && patients.length > 0 && !selectedPatient && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                    {patients.map(patient => (
                      <div
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                          {patient.profilePhoto ? (
                            <AuthImage
                              src={getImageUrl(patient.profilePhoto)}
                              alt={patient.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 leading-tight">{patient.fullName}</div>
                          <div className="text-xs text-gray-500">{patient.uniqueId} • {patient.mobile}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && patients.length === 0 && patientSearch.length >= 2 && !isSearching && !selectedPatient && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-center text-sm text-gray-400 z-10">
                    No patients found.
                  </div>
                )}
              </>
            )}
          </div>



          {/* Upload Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Upload File</label>
              {!file && (
                <button
                  onClick={() => setIsScanning(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#14B8A6] hover:text-teal-700 transition-colors uppercase tracking-wider"
                >
                  <Camera size={14} /> Scan Paper
                </button>
              )}
            </div>

            {!file ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer group
                  border-gray-200 hover:border-teal-400 hover:bg-teal-50/30`}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                  <Upload size={24} />
                </div>
                <p className="text-slate-900 font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500">Supported: PDF, JPG, PNG (Max 10MB)</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 ring-1 ring-black/5">
                <div className="flex items-stretch">
                  {/* Preview Section */}
                  <div className="w-24 bg-gray-50 flex items-center justify-center border-r border-gray-100 relative group overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <>
                        <AuthImage
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-teal-900/0 group-hover:bg-teal-900/10 transition-colors duration-300" />
                      </>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm text-teal-600">
                        <FileText size={20} />
                      </div>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">File Name</label>
                      <button
                        onClick={() => {
                          setFile(null);
                          setFileName("");
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors -mt-1 -mr-1 p-1 rounded-full hover:bg-red-50"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 group/input">
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="flex-1 font-semibold text-slate-800 text-lg bg-transparent border-b-2 border-transparent focus:border-teal-500 focus:outline-none transition-all placeholder-gray-300 py-0.5"
                        placeholder="Enter name"
                        autoFocus
                      />
                      <span className="text-gray-400 font-medium select-none">.{file.name.split('.').pop()}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 font-medium">
                      <span className="bg-gray-100/80 px-2 py-0.5 rounded text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="uppercase">{file.type.split('/')[1] || 'FILE'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isScanning && (
          <CameraCapture
            onCapture={(image) => {
              const scannedFile = dataURLtoFile(image, `Scan_${new Date().getTime()}.jpg`);
              setFile(scannedFile);
              const nameWithoutExtension = `Scan_${new Date().getTime()}`;
              setFileName(nameWithoutExtension);
              setIsScanning(false);
            }}
            onCancel={() => setIsScanning(false)}
          />
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium text-sm hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-6 py-2 bg-[#14B8A6] hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm shadow-lg shadow-teal-900/10 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
