import AuthImage from "../../components/AuthImage";
import React, { useEffect, useState, useRef } from "react";
import { Trash2, Plus, X, Upload, FileText, ChevronDown, ChevronUp, Calendar, Clock, ArrowLeft, User, Save, RefreshCw, AlertCircle, Phone, Eye, Download, Search, Check, Info, PenTool, LayoutGrid, Heart, Activity, ShieldAlert, ImageIcon, FileType, FlaskConical, CheckCircle, Type, Zap, MoreVertical, Send, FileCheck, Camera } from 'lucide-react';
import jsPDF from 'jspdf';
import DownloadActionModal from '../../Common-Components/DownloadActionModal';
import Swal from "sweetalert2";
import {
    fetchVisitDetailsApi,
    updateConsultationApi,
    updateVisitStatusApi,
    fetchPatientDocumentsApi,
    deletePatientDocumentApi,
    deleteVisitFileApi,
    createLabRequestApi,
    deleteLabRequestApi,
    deleteLabInvestigationApi, // [NEW]
    deletePrescriptionApi, // [NEW]
    deleteQuickDocumentApi // [NEW]
} from "../../services/DoctorAllApi";
import { BASE_URL } from "../../services/baseURL";
import { isPdfSource } from "../../utils/fileUrl";
import { loadAuthenticatedFile, loadAuthenticatedImage, openAuthenticatedFile, decodeImage } from "../../utils/authenticatedFile";


import logo from "../../assets/ShifaClinicLogo.png";
import reportLogo from "../../assets/ShifaClinicLogo (1).png";
import ViewLabReportModal from "./ViewLabReportModal";
import ImagePreviewModal from "./ImagePreviewModal";
import PrescriptionPreviewModal from "./PrescriptionPreviewModal";
import VitalsHistoryModal from "./VitalsHistoryModal";
import SendToLabModal from "./SendToLabModal"; // [NEW]
import { calculateDetailedAge } from "../../utils/dateUtils";
import CameraCapture from "./CameraCapture";

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150' fill='%23f1f5f9'%3E%3Crect width='150' height='150' /%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='14' fill='%2394a3b8' dy='.3em' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ActiveConsultation({ patient, onBack, onEnd, readOnly = false, initialData = null, allowFileDeletion = false }) {
    const [visitDetails, setVisitDetails] = useState(initialData || null);
    const [prescriptionMode, setPrescriptionMode] = useState("upload");
    const [documents, setDocuments] = useState([]);
    const [doctorName, setDoctorName] = useState(""); // [NEW]

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setDoctorName(parsedUser.fullName || "Doctor");
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    const [cardioEnabled, setCardioEnabled] = useState(false);
    const [drugAllergyEnabled, setDrugAllergyEnabled] = useState(false);
    const [newLabImages, setNewLabImages] = useState([]);
    const [historicalLabImages, setHistoricalLabImages] = useState([]); // [NEW] - Store fetched lab images
    const [activeLabTab, setActiveLabTab] = useState("upload"); // "previous", "scan", "upload"
    const [labReportsPage, setLabReportsPage] = useState(1); // [NEW] - Pagination for Lab Reports
    const [prescriptionImages, setPrescriptionImages] = useState([]);
    const [historicalPrescriptionImages, setHistoricalPrescriptionImages] = useState([]); // [NEW]
    const [rxPage, setRxPage] = useState(1); // [NEW] Pagination for previous prescriptions
    const [cardioData, setCardioData] = useState({ bp: "", fbs: "", ppbs: "", cholesterol: "" });
    const [allergyText, setAllergyText] = useState("");
    const [vitals, setVitals] = useState({ height: "", weight: "" });
    const [vitalsHistory, setVitalsHistory] = useState([]); // [NEW] - Store vitals history
    const [showVitalsHistoryModal, setShowVitalsHistoryModal] = useState(false); // [NEW]

    // [NEW] Send to Lab Modal State
    const [showSendToLabModal, setShowSendToLabModal] = useState(false);
    const [sendToLabFile, setSendToLabFile] = useState(null);
    const [isSendingToLab, setIsSendingToLab] = useState(false);

    const fileInputRef = useRef(null);
    const prescriptionFileInputRef = useRef(null); // [NEW]
    const prescriptionCanvasRef = useRef(null);
    const labCanvasRef = useRef(null); // [NEW]


    const [medicalRecordsMode, setMedicalRecordsMode] = useState("previous");
    const [isLabCanvasDirty, setIsLabCanvasDirty] = useState(false);
    const [openLabActionMenuIndex, setOpenLabActionMenuIndex] = useState(null); // [NEW] Context menu state
    const [editingLabImageIndex, setEditingLabImageIndex] = useState(null); // [NEW] Renaming state
    const [tempLabImageName, setTempLabImageName] = useState(""); // [NEW] Renaming state


    // [NEW] Quick Prescription & Quick Documents State
    const [quickPrescriptionMode, setQuickPrescriptionMode] = useState("previous");
    const [newQuickPrescriptions, setNewQuickPrescriptions] = useState([]);
    const [historicalQuickPrescriptions, setHistoricalQuickPrescriptions] = useState([]);
    const [quickPrescriptionPage, setQuickPrescriptionPage] = useState(1);

    const [quickDocumentMode, setQuickDocumentMode] = useState("previous");
    const [newQuickDocuments, setNewQuickDocuments] = useState([]);
    const [historicalQuickDocuments, setHistoricalQuickDocuments] = useState([]);
    const [quickDocumentPage, setQuickDocumentPage] = useState(1);

    // [NEW] Our Lab Requests State
    const [ourLabRequests, setOurLabRequests] = useState([]);

    // Toggle Sections
    const [quickPrescriptionEnabled, setQuickPrescriptionEnabled] = useState(false); // Collapsible
    const [quickDocumentEnabled, setQuickDocumentEnabled] = useState(false); // Collapsible

    const quickPrescriptionInputRef = useRef(null);
    const quickDocumentInputRef = useRef(null);

    // Pagination State for Medical Records
    const [documentsPage, setDocumentsPage] = useState(1);
    const [ourLabPage, setOurLabPage] = useState(1); // [NEW]
    const itemsPerPage = 4; // [MODIFIED] From 3 to 4
    const rxItemsPerPage = 5; // [NEW] 5 cards for Previous Prescriptions

    const [showLabReportModal, setShowLabReportModal] = useState(false);
    const [viewLabReportUrl, setViewLabReportUrl] = useState(null);
    const [viewLabReportFileName, setViewLabReportFileName] = useState(null);
    const [viewLabReportTitle, setViewLabReportTitle] = useState("Lab Report Preview");

    // [NEW] Image Preview Modal State
    const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
    const [viewImageUrl, setViewImageUrl] = useState(null);
    const [viewImageTitle, setViewImageTitle] = useState("Image Preview");

    // [NEW] Prescription Preview Modal State
    const [showPrescriptionPreviewModal, setShowPrescriptionPreviewModal] = useState(false);
    const [prescriptionPreviewIndex, setPrescriptionPreviewIndex] = useState(null);

    const openPrescriptionPreview = (index) => {
        setPrescriptionPreviewIndex(index);
        setShowPrescriptionPreviewModal(true);
    };

    const getImageUrl = (path) => {
        if (!path) return "";
        const cleanStr = String(path).trim();
        if (cleanStr.toLowerCase().startsWith("http") || cleanStr.startsWith("data:")) return cleanStr;

        let finalPath = cleanStr.startsWith('/') ? cleanStr.slice(1) : cleanStr;
        if (finalPath.startsWith('uploads/') || finalPath.startsWith('Uploads/')) {
            // Already includes uploads/, do not prepend
        } else {
            finalPath = `uploads/${finalPath}`;
        }

        return `${BASE_URL}/${finalPath}`;
    };

    const handleViewLabReport = (url, fileName, title = "Lab Report Preview") => {
        setViewLabReportUrl(url);
        setViewLabReportTitle(title);
        setShowLabReportModal(true);
    };



    // Initial Fetch
    // State for History
    const [cardioHistory, setCardioHistory] = useState([]);

    const dataURLtoFile = (dataurl, filename) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handleSendToLab = (fileData) => {
        setSendToLabFile(fileData);
        setShowSendToLabModal(true);
        setOpenLabActionMenuIndex(null);
    };

    const confirmSendToLab = async (priority) => {
        if (!sendToLabFile) return;
        setIsSendingToLab(true);
        try {
            const reqBody = new FormData();
            reqBody.append("patientId", patient?.patientId || visitDetails?.Patient?.uniqueId);
            reqBody.append("priority", priority);

            let fileToSend = sendToLabFile.file;
            if (!fileToSend && sendToLabFile.preview) {
                fileToSend = dataURLtoFile(sendToLabFile.preview, sendToLabFile.name);
            }
            reqBody.append("file", fileToSend);

            const result = await createLabRequestApi(reqBody);
            if (result.status === 200 || result.status === 201) {
                Swal.fire({
                    title: 'Sent!',
                    text: 'Lab request has been sent successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                setShowSendToLabModal(false);
                setSendToLabFile(null);
            } else {
                throw new Error(result.response?.data?.message || "Failed to send request");
            }
        } catch (error) {
            Swal.fire("Error", `Request failed: ${error.message || "Unknown error"}`, "error");
        } finally {
            setIsSendingToLab(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.lab-action-menu-container')) {
                setOpenLabActionMenuIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update Initial Fetch
    useEffect(() => {
        const fetchVisitDetails = async () => {
            if (!patient?.id && !initialData) return;
            try {
                let data;
                if (initialData) {
                    data = initialData;
                } else {
                    const response = await fetchVisitDetailsApi(patient.id);
                    if (response?.data?.success) {
                        data = response.data.data;
                    }
                }

                if (data) {
                    setVisitDetails(data);

                    // Map Vitals
                    // Map Vitals
                    let currentHeight = "";
                    let currentWeight = "";

                    if (data.vitals && Array.isArray(data.vitals)) {
                        // Filter out empty records for history display
                        const validHistory = data.vitals.filter(v => v.height || v.weight);
                        setVitalsHistory(validHistory);

                        // Smart Prefill: Find latest valid values independently
                        const latestHeight = data.vitals.find(v => v.height)?.height || "";
                        const latestWeight = data.vitals.find(v => v.weight)?.weight || "";

                        currentHeight = latestHeight;
                        currentWeight = latestWeight;
                    } else if (data.vitals && typeof data.vitals === 'object') {
                        currentHeight = data.vitals.height || "";
                        currentWeight = data.vitals.weight || "";
                    } else {
                        // Fallback structure
                        currentHeight = data.visitDetails?.height || data.height || "";
                        currentWeight = data.visitDetails?.weight || data.weight || "";
                    }

                    setVitals({
                        height: currentHeight,
                        weight: currentWeight
                    });

                    // Map Cardio
                    // Map Cardio
                    if (data.cardioDiabetic && Array.isArray(data.cardioDiabetic)) {
                        setCardioHistory(data.cardioDiabetic);
                    } else if (data.cardioDiabetic && typeof data.cardioDiabetic === 'object') {
                        // Fallback for object structure if API changes back or is mixed
                        setCardioEnabled(data.cardioDiabetic.isCardiodiabetic);
                        setCardioData({
                            bp: data.cardioDiabetic.bp || "",
                            fbs: data.cardioDiabetic.fbs || "",
                            ppbs: data.cardioDiabetic.ppbs || "",
                            cholesterol: data.cardioDiabetic.totalCholesterol || ""
                        });
                    } else if (data.isCardiodiabetic !== undefined) {
                        // Handle flattened structure
                        setCardioEnabled(data.isCardiodiabetic);
                        setCardioData({
                            bp: data.bp || "",
                            fbs: data.fbs || "",
                            ppbs: data.ppbs || "",
                            cholesterol: data.totalCholesterol || ""
                        });
                    }

                    // Map Drug Allergy
                    if (data.drugAllergy) {
                        setDrugAllergyEnabled(true);
                        setAllergyText(data.drugAllergy);
                    }

                    // Map Uploads
                    if (data.uploads) {
                        // ... existing upload mapping logic
                        // Sort documents by date (newest first)
                        const rawDocs = data.uploads.medicalRecords || [];
                        const sortedDocs = rawDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        const mappedInitialDocs = sortedDocs.map(doc => ({
                            ...doc,
                            preview: getImageUrl(doc.filePath),
                            name: doc.fileName || "Document",
                            type: doc.fileType,
                            date: doc.createdAt,
                            id: doc.id
                        }));
                        setDocuments(mappedInitialDocs);
                        if (data.uploads.prescriptionImage) {
                            const pImgs = Array.isArray(data.uploads.prescriptionImage) ? data.uploads.prescriptionImage : [];
                            // Populate Historical Prescriptions
                            setHistoricalPrescriptionImages(pImgs.map(img => {
                                if (typeof img === 'string') {
                                    return {
                                        preview: getImageUrl(img),
                                        name: "Prescription",
                                        doctor: "Unknown",
                                        date: null
                                    };
                                }
                                // Robustly map date from available fields in backend JSON
                                return {
                                    preview: getImageUrl(img.image || img.filePath || img.filePath),
                                    name: "Prescription",
                                    doctor: img.prescriptionBy || "Unknown",
                                    date: img.createdAt || img.visitDate || img.date || null,
                                    pharmacistNotes: img.pharmacistNotes || null,
                                    id: img.id || img._id || img.fileId
                                };
                            }));
                            // Do NOT setPrescriptionImages here (keep current session empty for new adds)
                        }
                        if (data.uploads.labInvestigation || data.uploads.labInvestigations) {
                            // Handle both singular (labInvestigation) and plural (labInvestigations) keys
                            const labImgs = data.uploads.labInvestigation
                                ? (Array.isArray(data.uploads.labInvestigation) ? data.uploads.labInvestigation : [])
                                : (Array.isArray(data.uploads.labInvestigations) ? data.uploads.labInvestigations : []);

                            // Sort newest first explicitly
                            const sortedLabImgs = labImgs.sort((a, b) => {
                                const dateA = new Date(a.createdAt || a.visitDate || 0);
                                const dateB = new Date(b.createdAt || b.visitDate || 0);
                                return dateB - dateA;
                            });

                            setHistoricalLabImages(sortedLabImgs.map(img => {
                                if (typeof img === 'string') {
                                    return { preview: getImageUrl(img), name: img.split('/').pop() || "Lab Report" };
                                }
                                return {
                                    preview: getImageUrl(img.file || img.filePath),
                                    name: img.fileName || "Lab Report",
                                    id: img.id || img._id,
                                    fileId: img.fileId,
                                    date: img.createdAt || img.visitDate
                                };
                            }));
                        }
                        if (data.uploads.visitRecord) {
                            // Fallback for singular key if exists
                            const visitRecs = Array.isArray(data.uploads.visitRecord) ? data.uploads.visitRecord : [];
                            // Sort by date if possible (though uploads are just strings usually, we rely on array order - assume API sends latest last? or we reverse?)
                            // Let's assume array order is oldest to newest, so we reverse for display or keep as is.
                            setHistoricalVisitRecords(visitRecs.map(doc => {
                                if (typeof doc === 'string') {
                                    return {
                                        preview: getImageUrl(doc),
                                        name: "Visit Record",
                                        type: (doc.endsWith('.jpg') || doc.endsWith('.png') || doc.endsWith('.jpeg')) ? 'image' : 'pdf'
                                    };
                                }
                                return {
                                    preview: getImageUrl(doc.file || doc.filePath),
                                    name: doc.fileName || "Visit Record",
                                    type: ((doc.file || doc.filePath).endsWith('.jpg') || (doc.file || doc.filePath).endsWith('.png') || (doc.file || doc.filePath).endsWith('.jpeg')) ? 'image' : 'pdf',
                                    id: doc.id,
                                    fileId: doc.id,
                                    filePath: doc.file || doc.filePath,
                                    fileType: doc.fileType || "application/pdf"
                                };
                            }));
                        } else if (data.uploads.visitRecords) {
                            // Handle Plural Key (per user JSON)
                            const visitRecs = Array.isArray(data.uploads.visitRecords) ? data.uploads.visitRecords : [];
                            setHistoricalVisitRecords(visitRecs.map(doc => {
                                if (typeof doc === 'string') {
                                    return {
                                        preview: getImageUrl(doc),
                                        name: "Visit Record",
                                        type: (doc.endsWith('.jpg') || doc.endsWith('.png') || doc.endsWith('.jpeg')) ? 'image' : 'pdf',
                                        filePath: doc, // Store path
                                        id: null // String usually doesn't have ID unless implied
                                    };
                                }
                                return {
                                    preview: getImageUrl(doc.file || doc.filePath),
                                    name: doc.fileName || "Visit Record",
                                    type: ((doc.file || doc.filePath).endsWith('.jpg') || (doc.file || doc.filePath).endsWith('.png') || (doc.file || doc.filePath).endsWith('.jpeg')) ? 'image' : 'pdf',
                                    id: doc.id || doc.fileId,
                                    fileId: doc.fileId || doc.id,
                                    filePath: doc.file || doc.filePath,
                                    fileType: doc.fileType || "application/pdf"
                                };
                            }));
                        }

                        // [NEW] Map Quick Prescriptions
                        const qPreData = data.uploads.quickPrescriptions || data.uploads.quickPrescription;
                        if (qPreData) {
                            const qPre = Array.isArray(qPreData) ? qPreData : [];
                            // Sort descending by date? Assuming API order or handle here.
                            setHistoricalQuickPrescriptions(qPre.map(doc => ({
                                id: doc.id,
                                preview: getImageUrl(doc.image || doc.filePath),
                                name: "Quick Prescription",
                                date: doc.createdAt || doc.visitDate || doc.date || null,
                                fileId: doc.fileId,
                                pharmacistNotes: doc.pharmacistNotes || doc.notes || null // [NEW] Map notes
                            })));
                        }

                        // [NEW] Map Quick Documents
                        const qDocData = data.uploads.quickDocument || data.uploads.quickDocuments;
                        if (qDocData) {
                            const qDoc = Array.isArray(qDocData) ? qDocData : [];
                            setHistoricalQuickDocuments(qDoc.map(doc => ({
                                id: doc.id,
                                preview: getImageUrl(doc.image || doc.filePath),
                                name: "Quick Document",
                                date: doc.createdAt || doc.visitDate || doc.date || null,
                                fileId: doc.fileId
                            })));
                        }

                        // [NEW] Map Our Lab Requests
                        if (data.uploads.ourLabRequests) {
                            const ourLab = Array.isArray(data.uploads.ourLabRequests) ? data.uploads.ourLabRequests : [];
                            // Sort newest first
                            const sortedOurLab = ourLab.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
                            setOurLabRequests(sortedOurLab.map(req => ({
                                ...req,
                                preview: getImageUrl(req.requestImage || req.image), // Show request image as main preview usually
                                resultPreview: req.resultImage ? getImageUrl(req.resultImage) : null, // [NEW] Store result image
                                name: "Lab Request",
                                date: req.visitDate
                            })));
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load visit details", error);
            }
        };
        fetchVisitDetails();
    }, [patient?.id]);

    // [NEW] Fetch All Patient Documents using new API
    useEffect(() => {
        const fetchDocs = async () => {
            if (visitDetails) {
                const pId = visitDetails.patientId || visitDetails.Patient?.uniqueId || visitDetails.Patient?.id; // Robust ID fetch
                if (pId) {
                    try {
                        const res = await fetchPatientDocumentsApi(pId);
                        if (res.status === 200) {
                            const docs = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);

                            const mappedDocs = docs.map(doc => ({
                                ...doc,
                                preview: getImageUrl(doc.filePath),
                                name: doc.fileName || "Document",
                                type: doc.fileType,
                                date: doc.createdAt,
                                id: doc.id
                            }));
                            setDocuments(mappedDocs);
                        }
                    } catch (err) {
                        console.error("Error fetching patient documents:", err);
                    }
                }
            }
        };
        fetchDocs();
    }, [visitDetails]);

    const showCardioDetails = (details) => {
        Swal.fire({
            title: `<span class="text-xl font-bold text-slate-800">Cardiodiabetic Details</span>`,
            html: `
                <div class="grid grid-cols-2 gap-4 text-left mt-2">
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span class="block text-xs font-semibold text-gray-500 uppercase">BP</span>
                        <span class="text-lg font-medium text-slate-900">${details.bp || "N/A"}</span>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span class="block text-xs font-semibold text-gray-500 uppercase">FBS</span>
                        <span class="text-lg font-medium text-slate-900">${details.fbs || "N/A"}</span>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span class="block text-xs font-semibold text-gray-500 uppercase">PPBS</span>
                        <span class="text-lg font-medium text-slate-900">${details.ppbs || "N/A"}</span>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span class="block text-xs font-semibold text-gray-500 uppercase">Total Cholesterol</span>
                        <span class="text-lg font-medium text-slate-900">${details.totalCholesterol || details.cholesterol || "N/A"}</span>
                    </div>
                     <div class="col-span-2 text-right mt-2 text-xs text-gray-400">
                        Recorded on: ${new Date(details.date).toLocaleDateString()}
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                popup: 'rounded-2xl',
                closeButton: 'focus:outline-none'
            }
        });
    };




    // [NEW] - Handle Prescription Image Upload
    const handlePrescriptionImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire("Warning", `File "${file.name}" exceeds 10MB limit.`, "warning");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPrescriptionImages(prev => [...prev, {
                    file: file,
                    preview: reader.result,
                    name: file.name,
                    date: new Date()
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePrescriptionImage = (index) => {
        setPrescriptionImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleLabImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire("Warning", `File "${file.name}" exceeds 10MB limit.`, "warning");
                return;
            }
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                Swal.fire("Invalid File", `File "${file.name}" is not supported. Please upload JPG or PNG.`, "warning");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewLabImages(prev => [...prev, { file, preview: reader.result, name: file.name, date: new Date() }]);
            };
            reader.readAsDataURL(file);
        }
    };

    // Lab Renaming Handlers
    const startRenamingLabImage = (index, currentName) => {
        setEditingLabImageIndex(index);
        // Strip extension for editing
        const nameWithoutExt = currentName.substring(0, currentName.lastIndexOf('.')) || currentName;
        setTempLabImageName(nameWithoutExt);
        setOpenLabActionMenuIndex(null); // Close menu
    };

    const saveRenamedLabImage = (index) => {
        if (!tempLabImageName.trim()) {
            return Swal.fire("Error", "File name cannot be empty.", "warning");
        }
        setNewLabImages(prev => prev.map((img, i) => {
            if (i === index) {
                const originalName = img.name;
                const extension = originalName.substring(originalName.lastIndexOf('.'));
                // Determine if user typed extension or not. If not, append original.
                // Simple approach: Always use new base name + original extension
                return { ...img, name: tempLabImageName + extension };
            }
            return img;
        }));
        setEditingLabImageIndex(null);
    };

    const cancelRenamingLabImage = () => {
        setEditingLabImageIndex(null);
        setTempLabImageName("");
    };

    const removeLabImage = (index) => {
        setNewLabImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleLabHandwrittenUpload = () => {
        if (labCanvasRef.current) {
            const image = labCanvasRef.current.exportImage();
            if (image) {
                setNewLabImages(prev => [...prev, { preview: image, name: `Lab_Note_${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`, type: 'image', date: new Date() }]);
                labCanvasRef.current.clear();
                setIsLabCanvasDirty(false);
            }
        }
    };

    const dataURLtoBlob = (dataurl) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    const loadDrawableImage = async (fileOrUrl) => {
        if (fileOrUrl instanceof File) {
            const localUrl = URL.createObjectURL(fileOrUrl);
            const image = await decodeImage(localUrl);
            return { image, cleanup: () => URL.revokeObjectURL(localUrl) };
        }
        return { image: await loadAuthenticatedImage(fileOrUrl), cleanup: () => {} };
    };

    // Helper to convert File/URL to PNG Blob
    const processImageToPngBlob = async (fileOrUrl) => {
        const { image: img, cleanup } = await loadDrawableImage(fileOrUrl);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        } finally {
            cleanup();
        }
    };

    // Helper to add Watermark to Image (for End Consultation Upload)
    const processImageWithWatermark = async (fileOrUrl) => {
        const { image: img, cleanup } = await loadDrawableImage(fileOrUrl);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const watermarkImg = new Image();
            watermarkImg.src = logo;
            await new Promise((resolve) => {
                watermarkImg.onload = () => {
                    const wmWidth = canvas.width * 0.5;
                    const wmHeight = (watermarkImg.height / watermarkImg.width) * wmWidth;
                    const wmX = (canvas.width - wmWidth) / 2;
                    const wmY = (canvas.height - wmHeight) / 2;
                    ctx.save();
                    ctx.globalAlpha = 0.08;
                    ctx.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
                    ctx.restore();
                    ctx.drawImage(img, 0, 0);
                    resolve();
                };
                watermarkImg.onerror = () => {
                    ctx.drawImage(img, 0, 0);
                    resolve();
                };
            });

            return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        } finally {
            cleanup();
        }
    };

    const handleEndConsultation = async () => {
        if (!patient?.id) {
            Swal.fire("Error", "Missing Visit ID", "error");
            return;
        }

        const result = await Swal.fire({
            title: 'End Consultation?',
            text: "This will save all data and mark the consultation as completed. You cannot undo this action.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#14B8A6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, End Consultation'
        });

        if (result.isConfirmed) {
            try {
                const reqBody = new FormData();
                if (allergyText) reqBody.append("drugAllergy", allergyText);

                // Vitals
                if (vitals.height) reqBody.append("height", vitals.height);
                if (vitals.weight) reqBody.append("weight", vitals.weight);

                // Cardiodiabetic
                reqBody.append("isCardiodiabetic", cardioEnabled);
                if (cardioEnabled) {
                    reqBody.append("bp", cardioData.bp);
                    reqBody.append("fbs", cardioData.fbs);
                    reqBody.append("ppbs", cardioData.ppbs);
                    reqBody.append("totalCholesterol", cardioData.cholesterol);
                }

                // Process Prescription Images (With Watermark)
                for (const img of prescriptionImages) {
                    if (img.file && img.file.type.startsWith('image')) {
                        try {
                            const pngBlob = await processImageWithWatermark(img.file); // Use Text Watermark helper if desired, but here we use Logo Watermark
                            reqBody.append("prescriptionImages", pngBlob, img.name.replace(/\.[^/.]+$/, "") + ".png");
                        } catch (e) {
                            console.error("Failed to watermark prescription", e);
                            reqBody.append("prescriptionImages", img.file);
                        }
                    } else if (img.file) {
                        reqBody.append("prescriptionImages", img.file);
                    } else if (img.preview && img.preview.startsWith('data:')) {
                        if (img.preview.startsWith('data:image/png')) {
                            // Even if png, we want to add watermark now
                            try {
                                const pngBlob = await processImageWithWatermark(img.preview);
                                reqBody.append("prescriptionImages", pngBlob, `prescription_${Date.now()}.png`);
                            } catch (e) {
                                const blob = dataURLtoBlob(img.preview);
                                reqBody.append("prescriptionImages", blob, `prescription_${Date.now()}.png`);
                            }
                        } else {
                            try {
                                const pngBlob = await processImageWithWatermark(img.preview);
                                reqBody.append("prescriptionImages", pngBlob, `prescription_${Date.now()}.png`);
                            } catch (e) {
                                console.error("Failed to convert prescription dataURL", e);
                                const blob = dataURLtoBlob(img.preview);
                                reqBody.append("prescriptionImages", blob, `prescription_${Date.now()}.png`);
                            }
                        }
                    }
                }

                // Process Lab Images (Standard PNG conversion is fine, unless user wants watermark there too? Kept standard for now to match explicit request for Prescription)
                for (const img of newLabImages) {
                    if (img.file && img.file.type.startsWith('image')) {
                        try {
                            const pngBlob = await processImageToPngBlob(img.file);
                            reqBody.append("labInvestigations", pngBlob, img.name.replace(/\.[^/.]+$/, "") + ".png");
                        } catch (e) {
                            console.error("Failed to convert lab image to PNG", e);
                            reqBody.append("labInvestigations", img.file);
                        }
                    } else if (img.file) {
                        reqBody.append("labInvestigations", img.file);
                    } else if (img.preview && img.preview.startsWith('data:')) {
                        if (img.preview.startsWith('data:image/png')) {
                            const blob = dataURLtoBlob(img.preview);
                            reqBody.append("labInvestigations", blob, img.name || "lab_report.png");
                        } else {
                            try {
                                const pngBlob = await processImageToPngBlob(img.preview);
                                reqBody.append("labInvestigations", pngBlob, (img.name ? img.name.replace(/\.[^/.]+$/, "") : "lab_report") + ".png");
                            } catch (e) {
                                console.error("Failed to convert lab dataURL to PNG", e);
                                const blob = dataURLtoBlob(img.preview);
                                reqBody.append("labInvestigations", blob, img.name || "lab_report.png");
                            }
                        }
                    }
                }

                // Visit Records & Medical Records
                for (const doc of newVisitRecords) {
                    if (doc.file && doc.file.type.startsWith('image')) {
                        try {
                            const pngBlob = await processImageToPngBlob(doc.file);
                            reqBody.append("visitRecords", pngBlob, doc.name.replace(/\.[^/.]+$/, "") + ".png");
                        } catch (e) {
                            // Fallback with correct name
                            reqBody.append("visitRecords", doc.file, doc.name);
                        }
                    } else if (doc.file) {
                        reqBody.append("visitRecords", doc.file, doc.name);
                    } else if (doc.preview && doc.preview.startsWith('data:')) {
                        const blob = dataURLtoBlob(doc.preview);
                        reqBody.append("visitRecords", blob, doc.name);
                    }
                }

                for (const doc of newMedicalRecords) {
                    if (doc.file && doc.file.type.startsWith('image')) {
                        try {
                            const pngBlob = await processImageToPngBlob(doc.file);
                            reqBody.append("medicalRecord", pngBlob, doc.name.replace(/\.[^/.]+$/, "") + ".png");
                        } catch (e) {
                            // Fallback with correct name
                            reqBody.append("medicalRecord", doc.file, doc.name);
                        }
                    } else if (doc.file) {
                        reqBody.append("medicalRecord", doc.file, doc.name);
                    } else if (doc.preview && doc.preview.startsWith('data:')) {
                        const blob = dataURLtoBlob(doc.preview);
                        reqBody.append("medicalRecord", blob, doc.name);
                    }
                }

                // [NEW] Quick Prescriptions
                for (const doc of newQuickPrescriptions) {
                    if (doc.file && doc.file.type.startsWith('image')) {
                        try {
                            const pngBlob = await processImageToPngBlob(doc.file);
                            reqBody.append("quickPrescription", pngBlob, doc.name.replace(/\.[^/.]+$/, "") + ".png");
                        } catch (e) {
                            reqBody.append("quickPrescription", doc.file, doc.name);
                        }
                    } else if (doc.file) {
                        reqBody.append("quickPrescription", doc.file, doc.name);
                    } else if (doc.preview && doc.preview.startsWith('data:')) {
                        const blob = dataURLtoBlob(doc.preview);
                        reqBody.append("quickPrescription", blob, doc.name);
                    }
                }

                // [NEW] Quick Documents
                for (const doc of newQuickDocuments) {
                    if (doc.file && doc.file.type.startsWith('image')) {
                        try {
                            const pngBlob = await processImageToPngBlob(doc.file);
                            reqBody.append("quickDocument", pngBlob, doc.name.replace(/\.[^/.]+$/, "") + ".png");
                        } catch (e) {
                            reqBody.append("quickDocument", doc.file, doc.name);
                        }
                    } else if (doc.file) {
                        reqBody.append("quickDocument", doc.file, doc.name);
                    } else if (doc.preview && doc.preview.startsWith('data:')) {
                        const blob = dataURLtoBlob(doc.preview);
                        reqBody.append("quickDocument", blob, doc.name);
                    }
                }


                const updateResponse = await updateConsultationApi(patient.id, reqBody);

                if (updateResponse.status === 200) {
                    const statusResponse = await updateVisitStatusApi(patient.id, "Completed");
                    if (statusResponse.status === 200) {
                        Swal.fire({
                            title: 'Consultation Ended',
                            text: 'The consultation has been successfully recorded and closed.',
                            icon: 'success',
                            timer: 2000
                        });
                        onEnd();
                    } else {
                        Swal.fire("Warning", "Data saved but failed to update status", "warning");
                    }
                } else {
                    Swal.fire("Error", "Failed to save consultation details", "error");
                }
            } catch (error) {
                console.error("End Consultation Error", error);
                Swal.fire("Error", "An unexpected error occurred", "error");
            }
        }
    };



    const [newVisitRecords, setNewVisitRecords] = useState([]);
    const [historicalVisitRecords, setHistoricalVisitRecords] = useState([]);
    const [visitRecordsMode, setVisitRecordsMode] = useState("previous"); // "previous" or "upload"
    // Pagination for Visit Records
    const [visitRecordsPage, setVisitRecordsPage] = useState(1);

    // Profile Preview State
    const [previewImage, setPreviewImage] = useState(null);

    // [NEW] Rename Logic for Visit Records
    const [editingVisitRecordIndex, setEditingVisitRecordIndex] = useState(-1);
    const [tempVisitRecordName, setTempVisitRecordName] = useState("");

    const startRenamingVisitRecord = (index, currentName) => {
        setEditingVisitRecordIndex(index);
        // Strip extension for editing
        const nameWithoutExt = currentName.substring(0, currentName.lastIndexOf('.')) || currentName;
        setTempVisitRecordName(nameWithoutExt);
    };

    const saveRenamedVisitRecord = (index) => {
        if (!tempVisitRecordName.trim()) return;
        setNewVisitRecords(prev => prev.map((doc, i) => {
            if (i === index) {
                const originalName = doc.name;
                const extension = originalName.substring(originalName.lastIndexOf('.'));
                // Use new name + original extension
                return { ...doc, name: tempVisitRecordName + extension };
            }
            return doc;
        }));
        setEditingVisitRecordIndex(-1);
        setTempVisitRecordName("");
    };

    const cancelRenamingVisitRecord = () => {
        setEditingVisitRecordIndex(-1);
        setTempVisitRecordName("");
    };

    const visitRecordInputRef = useRef(null);

    const handleVisitRecordUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire("Warning", `File "${file.name}" exceeds 10MB limit.`, "warning");
                return;
            }
            if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
                Swal.fire("Invalid File", `File "${file.name}" is not supported. Please upload PDF, JPG, or PNG.`, "warning");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewVisitRecords(prev => [...prev, {
                    file: file,
                    preview: reader.result,
                    name: file.name,
                    type: file.type.startsWith('image') ? 'image' : 'pdf'
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeVisitRecord = (index) => {
        setNewVisitRecords(prev => prev.filter((_, i) => i !== index));
    };

    const handleDeleteVisitRecord = async (docId) => {
        if (!docId) return;

        // Find the full record object to get file details
        const record = historicalVisitRecords.find(d => d.id === docId);
        if (!record) {
            Swal.fire('Error', 'Record not found in local state.', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Delete Record?',
            text: "Are you sure you want to delete this visit record?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                // Determine filePath: try 'file' first (from API), then 'filePath' (from local/mapping)
                const reqBody = {
                    fileType: record.fileType || "application/pdf", // Default fallback
                    filePath: record.filePath,
                    fileId: record.fileId || record.id
                };

                // Use visitId from visitDetails
                const visitId = visitDetails?.id || visitDetails?.visitDetails?.id; // Try both locations
                if (!visitId) {
                    Swal.fire('Error', 'Visit ID missing.', 'error');
                    return;
                }

                const res = await deleteVisitFileApi(visitId, reqBody);
                if (res.status === 200) {
                    setHistoricalVisitRecords(prev => prev.filter(d => d.id !== docId));
                    Swal.fire('Deleted!', 'The record has been deleted.', 'success');
                } else {
                    Swal.fire('Error', 'Failed to delete record.', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'An error occurred.', 'error');
            }
        }
    };

    // Permanent Medical Records (Queued for End Consultation)
    const [newMedicalRecords, setNewMedicalRecords] = useState([]);
    const medicalRecordInputRef = useRef(null);

    // [NEW] Rename Logic for Medical Records
    const [editingMedicalRecordIndex, setEditingMedicalRecordIndex] = useState(-1);
    const [tempMedicalRecordName, setTempMedicalRecordName] = useState("");

    const startRenamingMedicalRecord = (index, currentName) => {
        setEditingMedicalRecordIndex(index);
        // Strip extension for editing
        const nameWithoutExt = currentName.substring(0, currentName.lastIndexOf('.')) || currentName;
        setTempMedicalRecordName(nameWithoutExt);
    };

    // [NEW] Handlers for Quick Prescriptions
    const handleQuickPrescriptionUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire("Warning", `File "${file.name}" exceeds 10MB limit.`, "warning");
                return;
            }
            if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
                Swal.fire("Invalid File", `File "${file.name}" is not supported. Please upload PDF, JPG, or PNG.`, "warning");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewQuickPrescriptions(prev => [...prev, {
                    file: file,
                    preview: reader.result,
                    name: file.name,
                    type: file.type.startsWith('image') ? 'image' : 'pdf'
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeQuickPrescription = (index) => {
        setNewQuickPrescriptions(prev => prev.filter((_, i) => i !== index));
    };

    // [NEW] Handlers for Quick Documents
    const handleQuickDocumentUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire("Warning", `File "${file.name}" exceeds 10MB limit.`, "warning");
                return;
            }
            if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
                Swal.fire("Invalid File", `File "${file.name}" is not supported. Please upload PDF, JPG, or PNG.`, "warning");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewQuickDocuments(prev => [...prev, {
                    file: file,
                    preview: reader.result,
                    name: file.name,
                    type: file.type.startsWith('image') ? 'image' : 'pdf'
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeQuickDocument = (index) => {
        setNewQuickDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const saveRenamedMedicalRecord = (index) => {
        if (!tempMedicalRecordName.trim()) return;
        setNewMedicalRecords(prev => prev.map((doc, i) => {
            if (i === index) {
                const originalName = doc.name;
                const extension = originalName.substring(originalName.lastIndexOf('.'));
                return { ...doc, name: tempMedicalRecordName + extension };
            }
            return doc;
        }));
        setEditingMedicalRecordIndex(-1);
        setTempMedicalRecordName("");
    };

    const cancelRenamingMedicalRecord = () => {
        setEditingMedicalRecordIndex(-1);
        setTempMedicalRecordName("");
    };

    // [NEW] Delete Historical Medical Record
    const handleDeleteMedicalRecord = async (docId) => {
        if (!docId) return;
        const result = await Swal.fire({
            title: 'Delete Record?',
            text: "Are you sure you want to delete this medical record?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await deletePatientDocumentApi(docId);
                if (res.status === 200) {
                    setDocuments(prev => prev.filter(d => d.id !== docId));
                    Swal.fire('Deleted!', 'The record has been deleted.', 'success');
                } else {
                    Swal.fire('Error', 'Failed to delete record.', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'An error occurred.', 'error');
            }
        }
    };

    const handleMedicalRecordUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire("Warning", `File "${file.name}" exceeds 10MB limit.`, "warning");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewMedicalRecords(prev => [...prev, {
                    file: file,
                    preview: reader.result,
                    name: file.name,
                    type: file.type.startsWith('image') ? 'image' : 'pdf'
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeMedicalRecord = (index) => {
        setNewMedicalRecords(prev => prev.filter((_, i) => i !== index));
    };

    const handleDeleteLabRequest = async (requestId, status) => {
        if (!requestId) return;

        if (status === 'In Progress') {
            Swal.fire({
                icon: 'warning',
                title: 'Cannot Delete',
                text: 'You cannot delete the request because the test is under process.',
                confirmButtonColor: '#14B8A6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Delete Result?',
            text: "Are you sure you want to delete this lab result?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await deleteLabRequestApi(requestId);
                if (res.status === 200) {
                    setOurLabRequests(prev => prev.filter(req => req.id !== requestId));
                    Swal.fire('Deleted!', 'The lab result has been deleted.', 'success');
                } else {
                    Swal.fire('Error', 'Failed to delete result.', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'An error occurred.', 'error');
            }
        }
    };

    const handleDeleteLabInvestigation = async (fileId) => {
        if (!fileId) return;

        const result = await Swal.fire({
            title: 'Delete Investigation?',
            text: "Are you sure you want to delete this lab investigation?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await deleteLabInvestigationApi(fileId);
                if (res.status === 200) {
                    setHistoricalLabImages(prev => prev.filter(img => img.id !== fileId && img.fileId !== fileId));
                    Swal.fire('Deleted!', 'The file has been deleted.', 'success');
                } else {
                    Swal.fire('Error', 'Failed to delete file.', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'An error occurred.', 'error');
            }
        }
    };

    // [NEW] Delete Previous Prescription
    const handleDeletePrescription = async (prescriptionId) => {
        if (!prescriptionId) return;

        const result = await Swal.fire({
            title: 'Delete Prescription?',
            text: "Are you sure you want to delete this prescription record?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await deletePrescriptionApi(prescriptionId);
                if (res.status === 200) {
                    setHistoricalPrescriptionImages(prev => prev.filter(img => img.id !== prescriptionId));
                    Swal.fire('Deleted!', 'The prescription record has been deleted.', 'success');
                } else {
                    Swal.fire('Error', 'Failed to delete prescription.', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'An error occurred.', 'error');
            }
        }
    };

    // [NEW] Delete Quick Prescription
    const handleDeleteQuickPrescription = async (prescriptionId) => {
        if (!prescriptionId) return;

        const result = await Swal.fire({
            title: 'Delete Quick Prescription?',
            text: "Are you sure you want to delete this quick prescription?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                // Using the same API as regular prescription delete per user instruction
                const res = await deletePrescriptionApi(prescriptionId);
                if (res.status === 200) {
                    setHistoricalQuickPrescriptions(prev => prev.filter(img => img.id !== prescriptionId));
                    Swal.fire('Deleted!', 'The quick prescription has been deleted.', 'success');
                } else {
                    Swal.fire('Error', 'Failed to delete quick prescription.', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'An error occurred.', 'error');
            }
        }
    };

    // [NEW] Delete Quick Document
    const handleDeleteQuickDocument = async (documentId) => {
        if (!documentId) return;

        const result = await Swal.fire({
            title: 'Delete Quick Document?',
            text: "Are you sure you want to delete this quick document?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await deleteQuickDocumentApi(documentId);
                if (res.status === 200) {
                    setHistoricalQuickDocuments(prev => prev.filter(doc => doc.id !== documentId));
                    Swal.fire('Deleted!', 'The quick document has been deleted.', 'success');
                } else {
                    Swal.fire('Error', 'Failed to delete quick document.', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'An error occurred.', 'error');
            }
        }
    };

    const convertImageToDataURL = async (url) => {
        if (String(url).startsWith("data:")) return url;
        const file = await loadAuthenticatedFile(url);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file.blob);
        });
    };

    // [NEW] Shared Canvas Generator for Lab Reports (PDF & PNG)
    const generateLabReportCanvas = async (imageSrc, title = "Lab Report", reportDate = null) => {
        return new Promise(async (resolve, reject) => {
            try {
                let validImageSrc = imageSrc;
                if (!imageSrc.startsWith('data:')) {
                    try {
                        validImageSrc = await convertImageToDataURL(imageSrc);
                    } catch (err) {
                        console.error("Failed to convert image for report", err);
                    }
                }

                const canvas = document.createElement('canvas');
                // A4 at 96 DPI is approx 794x1123. Let's use 2x for quality: 1588x2246
                const width = 1588;
                const height = 2246;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // 1. Fill White Background
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, width, height);

                // 2. Draw Watermark
                const watermarkImg = new Image();
                watermarkImg.src = logo;
                await new Promise((r) => {
                    watermarkImg.onload = () => {
                        const wmWidth = width * 0.5;
                        const wmHeight = (watermarkImg.height / watermarkImg.width) * wmWidth;
                        const wmX = (width - wmWidth) / 2;
                        const wmY = (height - wmHeight) / 2;
                        ctx.save();
                        ctx.globalAlpha = 0.08;
                        ctx.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
                        ctx.restore();
                        r();
                    };
                    watermarkImg.onerror = r;
                });

                // 3. Header
                const logoImg = new Image();
                logoImg.src = reportLogo;
                await new Promise((r) => {
                    logoImg.onload = () => {
                        ctx.drawImage(logoImg, 40, 30, 150, 150);
                        r();
                    };
                    logoImg.onerror = r;
                });

                ctx.fillStyle = "#000000";
                ctx.font = "bold 60px Poppins, sans-serif";
                ctx.fillText("SHIFA CLINIC", 195, 100);

                ctx.fillStyle = "#505050"; // Dark Gray
                ctx.font = "30px Poppins, sans-serif";
                ctx.fillText("KILIMANOOR", 195, 140);

                // Horizontal Line
                ctx.strokeStyle = "#C8C8C8";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(40, 170);
                ctx.lineTo(width - 40, 170);
                ctx.stroke();

                // 4. Patient Details
                const contentStartY = 220;
                ctx.font = "normal 30px Poppins, sans-serif";
                ctx.fillStyle = "#3C3C3C";

                // Use visitDetails or fallback
                const pName = visitDetails?.Patient?.fullName || patient?.name;
                const pId = visitDetails?.Patient?.uniqueId || patient?.patientId;
                const pDob = visitDetails?.Patient?.dateOfBirth || patient?.dateOfBirth;
                const pAge = pDob ? calculateDetailedAge(pDob) : (visitDetails?.Patient?.age || patient?.age);
                const pGender = visitDetails?.Patient?.sex || patient?.gender;
                const pMobile = visitDetails?.Patient?.mobile || patient?.mobile;

                const leftX = 60;
                const rightX = 900;
                const lineHeight = 50;

                ctx.fillText(`Patient Name: ${pName}`, leftX, contentStartY);
                ctx.fillText(`Patient ID: ${pId}`, leftX, contentStartY + lineHeight);
                if (doctorName) {
                    const displayDoctor = doctorName.toLowerCase().startsWith("dr.") ? doctorName : `Dr. ${doctorName}`;
                    ctx.fillText(`Referred by: ${displayDoctor}`, leftX, contentStartY + lineHeight * 2);
                }

                ctx.fillText(`Age: ${pAge}`, rightX, contentStartY);
                ctx.fillText(`Gender: ${pGender}`, rightX, contentStartY + lineHeight);
                ctx.fillText(`Mobile: ${pMobile || "N/A"}`, rightX, contentStartY + lineHeight * 2);

                // Date
                const displayDate = safeParseDate(reportDate).toLocaleDateString('en-GB'); // DD/MM/YYYY
                ctx.fillText(`Date: ${displayDate}`, rightX, contentStartY + lineHeight * 3);

                // Divider
                // Divider
                ctx.beginPath();
                ctx.moveTo(60, contentStartY + lineHeight * 3.5);
                ctx.lineTo(width - 60, contentStartY + lineHeight * 3.5);
                ctx.stroke();

                // 5. Lab Image
                // 5. Lab Image (Title Removed)

                const labImg = new Image();
                labImg.src = validImageSrc;
                await new Promise((r) => {
                    labImg.onload = () => {
                        const imgMaxW = width - 120;
                        const imgMaxH = height - (contentStartY + lineHeight * 4.5) - 100; // Remaining height minus padding

                        let drawW = labImg.width;
                        let drawH = labImg.height;
                        const scale = Math.min(imgMaxW / drawW, imgMaxH / drawH);

                        drawW *= scale;
                        drawH *= scale;

                        ctx.drawImage(labImg, leftX, contentStartY + lineHeight * 4.5, drawW, drawH);
                        r();
                    };
                    labImg.onerror = r;
                });

                resolve(canvas);

            } catch (error) {
                reject(error);
            }
        });
    };

    // Download Modal State
    const [downloadModalData, setDownloadModalData] = useState(null); // { src, title, date }
    const [isDownloading, setIsDownloading] = useState(false);

    const safeParseDate = (dateInput) => {
        if (!dateInput || dateInput === "N/A" || dateInput === "previously recorded") return new Date();
        try {
            const d = new Date(dateInput);
            // new Date(null) is 1970-01-01, we want 'now' if date is truly missing
            if (isNaN(d.getTime()) || d.getTime() === 0) return new Date();
            return d;
        } catch (e) {
            return new Date();
        }
    };

    const openDownloadModal = (imageSrc, title = "Lab Report", date = null) => {
        console.log("Opening Download Modal:", { title, date, src: imageSrc });
        try {
            if (!imageSrc) {
                Swal.fire("Error", "No image source found for download", "error");
                return;
            }

            // Check if it's already a PDF file (not image)
            const isPdf = typeof imageSrc === 'string' && (
                imageSrc.startsWith('data:application/pdf') ||
                /\.pdf($|\?)/i.test(imageSrc)
            );

            if (isPdf) {
                // Direct download for PDF files
                const link = document.createElement('a');
                link.href = imageSrc;
                const pdfDate = safeParseDate(date).toISOString().split('T')[0];
                link.download = `${title.replace(/\s+/g, '_')}_${pdfDate}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                setDownloadModalData({ src: imageSrc, title, date });
            }
        } catch (err) {
            console.error("Open download modal failed", err);
            Swal.fire("Error", "Failed to initialize download", "error");
        }
    };

    const handleDownloadOption = async (format) => {
        if (!downloadModalData) return;

        // Extract data before clearing state
        const { src, title, date } = downloadModalData;

        setIsDownloading(true);
        setDownloadModalData(null); // Close modal early

        Swal.fire({
            title: 'Generating Report...',
            text: 'Please wait while we prepare your document.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        console.log("Handling Download Option:", { format, title, date });
        const pName = (visitDetails?.Patient?.fullName || patient?.name || "Patient").trim().replace(/\s+/g, "_");
        const pMobile = (visitDetails?.Patient?.mobile || patient?.mobile || "NoNumber").trim();
        const parsedDate = safeParseDate(date);
        const dateStr = parsedDate.toISOString().split('T')[0];

        let typeSuffix = "LI"; // Default Lab Investigation
        if (title && title.toLowerCase().includes("prescription")) {
            typeSuffix = "DP"; // Doctor Prescription
        }

        const fileName = `${pName}_${pMobile}_${dateStr}_${typeSuffix}`;

        try {
            const canvas = await generateLabReportCanvas(src, title, date);

            if (format === 'png') {
                canvas.toBlob((blob) => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `${fileName}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setDownloadModalData(null);
                }, 'image/png');
            } else {
                // PDF
                const doc = new jsPDF('p', 'mm', 'a4'); // A4 size
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();
                doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                doc.save(`${fileName}.pdf`);
                setDownloadModalData(null);
            }
            Swal.close();
            Swal.fire({
                title: 'Success!',
                text: 'Report generated successfully.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch {
            console.error("Download failed");
            Swal.close();
            Swal.fire("Error", "Failed to generate report. This might be due to a network or CORS issue with the image file.", "error");
        } finally {
            setIsDownloading(false);
        }
    };

    const openImagePreview = async (url, title = "Preview") => {
        if (!url) return;
        const resolved = getImageUrl(url);
        if (isPdfSource({ src: resolved })) {
            try {
                await openAuthenticatedFile(resolved);
            } catch (error) {
                Swal.fire("Error", error.message || "Could not open the file.", "error");
            }
            return;
        }
        setViewImageUrl(resolved);
        setViewImageTitle(title);
        setShowImagePreviewModal(true);
    };




    if (!patient) return null;

    // Use fetched data or fallback to initial props (which acts as a skeleton/placeholder)
    const patientName = visitDetails?.Patient?.fullName || patient.name;
    const patientUniqueId = visitDetails?.Patient?.uniqueId || patient.patientId;
    // Prefer calculated detailed age from DOB
    const dob = visitDetails?.Patient?.dateOfBirth || patient.dateOfBirth;
    const patientAge = dob ? calculateDetailedAge(dob) : (visitDetails?.Patient?.age ? `${visitDetails.Patient.age} Years` : (patient.age ? `${patient.age} Years` : "0"));
    const patientGender = visitDetails?.Patient?.sex || patient.gender;
    const patientMobile = visitDetails?.Patient?.mobile || patient.mobile;
    const tokenNumber = visitDetails?.visitDetails?.tokenNumber || patient.token;
    const lastConsultedBy = visitDetails?.Patient?.lastConsultedBy || patient.lastConsultedBy;
    const lastVisitDate = visitDetails?.Patient?.lastVisitDate || patient.lastVisitDate;

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
            {/* Top Navigation */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-slate-900 transition-colors font-medium"
                >
                    <ArrowLeft size={20} />
                    Back to List
                </button>

            </div>

            {/* Patient Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-8 px-6 mb-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex gap-6">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0 overflow-hidden border border-gray-200">
                            {(visitDetails?.Patient?.profilePhoto || patient?.profilePhoto) ? (
                                <AuthImage
                                    src={getImageUrl(visitDetails?.Patient?.profilePhoto || patient?.profilePhoto)}
                                    alt={patientName}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setPreviewImage(getImageUrl(visitDetails?.Patient?.profilePhoto || patient?.profilePhoto))}
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 ${(visitDetails?.Patient?.profilePhoto || patient?.profilePhoto) ? 'hidden' : ''}`}>
                                <User size={40} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-slate-900">{patientName}</h2>
                                <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100 tracking-wide">
                                    #{patientUniqueId}
                                </span>
                                {(visitDetails?.Patient?.CF || patient.CF) && (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 tracking-wide">
                                        CF
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm mb-3">Phone: {patientMobile || "N/A"}</p>
                            <div className="flex items-center gap-6 text-slate-700 text-sm mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-lg">{patientAge}</span>
                                    <span className="text-gray-400 text-xs">(Age on Visit)</span>
                                </div>
                                <span>{patientGender}</span>
                                {readOnly ? (
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 text-xs text-gray-500 font-medium">
                                        <Calendar size={14} className="text-[#14B8A6]" />
                                        {new Date().toLocaleDateString('en-GB')}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-gray-500">
                                        <Calendar size={14} />
                                        {new Date().toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {/* Last Consultation Details */}
                            {lastConsultedBy && (
                                <div className="mb-4 text-xs flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <span className="font-semibold text-gray-600">Last Visit:</span>
                                    {readOnly ? (
                                        <>
                                            <span className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px] font-medium text-gray-600">
                                                <Calendar size={12} className="text-[#14B8A6]" />
                                                {lastVisitDate ? new Date(lastVisitDate).toLocaleDateString('en-GB') : "N/A"}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px] font-medium text-gray-600">
                                                <User size={12} className="text-[#14B8A6]" />
                                                {lastConsultedBy.toLowerCase().startsWith("dr.") ? lastConsultedBy : `Dr. ${lastConsultedBy}`}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} className="text-gray-400" />
                                                {lastVisitDate ? new Date(lastVisitDate).toLocaleDateString() : "N/A"}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="flex items-center gap-1">
                                                <User size={12} className="text-gray-400" />
                                                {lastConsultedBy.toLowerCase().startsWith("dr.") ? lastConsultedBy : `Dr. ${lastConsultedBy}`}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}


                            <div className="">
                                {(cardioHistory.length > 0 || allergyText) && (
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        {cardioHistory.length > 0 && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                                <Heart size={14} className="fill-current" />
                                                Cardio-Diabetic
                                            </span>
                                        )}
                                        {allergyText && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                                <ShieldAlert size={14} />
                                                Drug Allergy
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-4 border-b border-gray-300 pb-2">

                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Height:</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-16 p-1 border border-gray-300 rounded text-center text-sm"
                                                placeholder="-"
                                                value={vitals.height}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^[0-9.]*$/.test(val)) {
                                                        setVitals(prev => ({ ...prev, height: val }));
                                                    }
                                                }}
                                                disabled={readOnly}
                                            />
                                            <span className="absolute right-[-24px] top-1/2 -translate-y-1/2 text-xs text-gray-400">cm</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <label className="text-sm text-gray-600">Weight:</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-16 p-1 border border-gray-300 rounded text-center text-sm"
                                                placeholder="-"
                                                value={vitals.weight}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^[0-9.]*$/.test(val)) {
                                                        setVitals(prev => ({ ...prev, weight: val }));
                                                    }
                                                }}
                                                disabled={readOnly}
                                            />
                                            <span className="absolute right-[-24px] top-1/2 -translate-y-1/2 text-xs text-gray-400">kg</span>
                                        </div>
                                    </div>

                                    <div className="ml-5" >
                                        {vitalsHistory.length > 0 && (
                                            <button
                                                onClick={() => setShowVitalsHistoryModal(true)}
                                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-teal-50 text-[#14B8A6]  rounded-md hover:bg-[#14B8A6] hover:text-white transition-all"
                                            >
                                                <Clock size={12} /> View History
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-bold text-2xl ">
                        {tokenNumber}
                    </div>
                </div>
            </div>

            {/* Permanent Medical Records & Visit Records Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="text-[#14B8A6]" size={20} />
                            <h3 className="font-bold text-slate-900">Permanent Medical Records</h3>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Records that persist across all visits. Upload medical record (PDF, PNG, JPG).</p>

                    {/* Tabs */}
                    {/* Tabs - Hide in ReadOnly */}
                    {!readOnly && (
                        <div className="flex bg-gray-50 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
                            {documents.length > 0 && (
                                <button
                                    onClick={() => setMedicalRecordsMode("previous")}
                                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${medicalRecordsMode === "previous" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                                >
                                    <Clock size={14} /> Previous
                                </button>
                            )}
                            <button
                                onClick={() => setMedicalRecordsMode("scan")}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${medicalRecordsMode === "scan" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                            >
                                <Camera size={14} /> Capture
                            </button>
                            <button
                                onClick={() => setMedicalRecordsMode("upload")}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${medicalRecordsMode === "upload" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                            >
                                <Upload size={14} /> Upload
                            </button>
                        </div>
                    )}


                    {medicalRecordsMode === "previous" && documents.length > 0 ? (
                        <div className="space-y-3 mb-4">
                            {documents.slice((documentsPage - 1) * itemsPerPage, documentsPage * itemsPerPage).map((doc) => (
                                <div key={doc.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-500 flex items-center justify-center flex-shrink-0">
                                            {(doc.type?.startsWith('image') || doc.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                                                ? <ImageIcon size={16} />
                                                : <FileType size={16} />
                                            }
                                        </div>
                                        <div className="overflow-hidden space-y-1 min-w-0">
                                            <p className="font-medium text-slate-900 text-sm truncate">{doc.name}</p>
                                            {readOnly ? (
                                                <span className="inline-flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-100 text-[10px] text-gray-500 font-medium">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    {doc.date ? new Date(doc.date).toLocaleDateString('en-GB') : "N/A"}
                                                </span>
                                            ) : (
                                                <p className="text-[10px] text-gray-500">{doc.date ? new Date(doc.date).toLocaleDateString() : "N/A"}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleViewLabReport(doc.preview, doc.name, "Permanent Medical Records Preview")}
                                            className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors"
                                            title="View Document"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        {(!readOnly || allowFileDeletion) && (
                                            <button
                                                onClick={() => handleDeleteMedicalRecord(doc.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* Pagination Controls */}
                            {documents.length > itemsPerPage && (
                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        onClick={() => setDocumentsPage(prev => Math.max(prev - 1, 1))}
                                        disabled={documentsPage === 1}
                                        className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        Page {documentsPage} of {Math.ceil(documents.length / itemsPerPage)}
                                    </span>
                                    <button
                                        onClick={() => setDocumentsPage(prev => Math.min(prev + 1, Math.ceil(documents.length / itemsPerPage)))}
                                        disabled={documentsPage === Math.ceil(documents.length / itemsPerPage)}
                                        className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : medicalRecordsMode === "scan" ? (
                        <div className="w-full h-full min-h-[300px]">
                            <CameraCapture
                                onCapture={(image) => {
                                    setNewMedicalRecords(prev => [...prev, {
                                        preview: image,
                                        name: `Scan_Medical_Record_${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}.jpg`,
                                        type: 'image',
                                        date: new Date()
                                    }]);
                                    setMedicalRecordsMode("upload");
                                }}
                                onCancel={() => setMedicalRecordsMode("upload")}
                            />
                        </div>
                    ) : (
                        /* Upload UI (Show if mode is upload OR if no previous records exist) */
                        <div className="border border-dashed border-gray-100 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/30 flex-1 min-h-[300px]">
                            <input type="file" ref={medicalRecordInputRef} onChange={handleMedicalRecordUpload} accept="image/*,application/pdf" multiple className="hidden" />

                            {newMedicalRecords.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="w-12 h-12 rounded-full bg-teal-50 text-[#14B8A6] flex items-center justify-center mb-3">
                                        <FileText size={24} />
                                    </div>
                                    <p className="text-sm text-gray-400 mb-6">
                                        {documents.length > 0 ? "Upload new medical records (PDF, PNG, JPG)" : "No permanent records found. Upload medical record (PDF, PNG, JPG)."}
                                    </p>
                                    {!readOnly && (
                                        <button onClick={() => medicalRecordInputRef.current?.click()} className="px-4 py-2 bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                            Select Files
                                        </button>
                                    )}
                                </div>
                            )}

                            {newMedicalRecords.length > 0 && (
                                <div className="w-full space-y-2 mb-4">
                                    <p className="text-xs font-semibold text-left text-slate-500">New Records to Upload:</p>
                                    {newMedicalRecords.map((doc, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                                                    {doc.type === 'image' ? <ImageIcon size={16} /> : <FileType size={16} />}
                                                </div>
                                                {editingMedicalRecordIndex === index ? (
                                                    <input
                                                        type="text"
                                                        value={tempMedicalRecordName}
                                                        onChange={(e) => setTempMedicalRecordName(e.target.value)}
                                                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#14B8A6]"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                {editingMedicalRecordIndex === index ? (
                                                    <>
                                                        <button onClick={() => saveRenamedMedicalRecord(index)} className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg"><Check size={16} /></button>
                                                        <button onClick={cancelRenamingMedicalRecord} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X size={16} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startRenamingMedicalRecord(index, doc.name)} className={`p-2 text-gray-400 hover:text-slate-900 ${readOnly ? 'hidden' : ''}`}><Type size={14} /></button>
                                                        <button onClick={() => removeMedicalRecord(index)} className={`p-2 text-red-500 ${readOnly ? 'hidden' : ''}`}><Trash2 size={16} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {!readOnly && (
                                        <button onClick={() => medicalRecordInputRef.current?.click()} className="mt-4 px-4 py-2 bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm w-full">
                                            Add More Files
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Daily Visit Record */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <FileText className="text-[#14B8A6]" size={20} />
                            <h3 className="font-bold text-slate-900">Visit Records</h3>
                        </div>
                    </div>

                    {/* Tabs - Hide in ReadOnly */}
                    {!readOnly && (
                        <div className="flex bg-gray-50 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
                            {historicalVisitRecords.length > 0 && (
                                <button
                                    onClick={() => setVisitRecordsMode("previous")}
                                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${visitRecordsMode === "previous" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                                >
                                    <Clock size={14} /> Previous
                                </button>
                            )}
                            <button
                                onClick={() => setVisitRecordsMode("scan")}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${visitRecordsMode === "scan" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                            >
                                <Camera size={14} /> Capture
                            </button>
                            <button
                                onClick={() => setVisitRecordsMode("upload")}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${visitRecordsMode === "upload" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                            >
                                <Upload size={14} /> Upload
                            </button>
                        </div>
                    )}

                    {visitRecordsMode === "previous" && historicalVisitRecords.length > 0 ? (
                        <div className="space-y-3 mb-4">
                            {historicalVisitRecords.slice((visitRecordsPage - 1) * itemsPerPage, visitRecordsPage * itemsPerPage).map((doc, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-500 flex items-center justify-center">
                                            {(doc.type === 'image' || doc.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                                                ? <ImageIcon size={16} />
                                                : <FileType size={16} />
                                            }
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-medium text-slate-900 text-sm truncate">{doc.name}</p>
                                            <p className="text-[10px] text-gray-500">Recorded previously</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleViewLabReport(doc.preview, doc.name, "Visit Record Preview")}
                                            className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors"
                                            title="View Document"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        {(!readOnly || allowFileDeletion) && doc.id && (
                                            <button
                                                onClick={() => handleDeleteVisitRecord(doc.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* Pagination Controls */}
                            {historicalVisitRecords.length > itemsPerPage && (
                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        onClick={() => setVisitRecordsPage(prev => Math.max(prev - 1, 1))}
                                        disabled={visitRecordsPage === 1}
                                        className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        Page {visitRecordsPage} of {Math.ceil(historicalVisitRecords.length / itemsPerPage)}
                                    </span>
                                    <button
                                        onClick={() => setVisitRecordsPage(prev => Math.min(prev + 1, Math.ceil(historicalVisitRecords.length / itemsPerPage)))}
                                        disabled={visitRecordsPage === Math.ceil(historicalVisitRecords.length / itemsPerPage)}
                                        className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : visitRecordsMode === "scan" ? (
                        <div className="w-full h-full min-h-[300px]">
                            <CameraCapture
                                onCapture={(image) => {
                                    setNewVisitRecords(prev => [...prev, {
                                        preview: image,
                                        name: `Scan_Visit_Record_${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}.jpg`,
                                        type: 'image',
                                        date: new Date()
                                    }]);
                                    setVisitRecordsMode("upload");
                                }}
                                onCancel={() => setVisitRecordsMode("upload")}
                            />
                        </div>
                    ) : (
                        /* Upload UI */
                        <div className="border border-dashed border-gray-100 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/30 flex-1">
                            <input
                                type="file"
                                ref={visitRecordInputRef}
                                onChange={handleVisitRecordUpload}
                                accept="image/*,application/pdf"
                                multiple
                                className="hidden"
                            />
                            {newVisitRecords.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="w-12 h-12 rounded-full bg-teal-50 text-[#14B8A6] flex items-center justify-center mb-3">
                                        <FileText size={24} />
                                    </div>
                                    {/* <h4 className="text-sm font-semibold text-slate-900 mb-1">Upload Daily Visit Record</h4> */}
                                    <p className="text-sm text-gray-400 mb-6">No files selected. Allowed formats (PDF, PNG, JPG)</p>
                                    <button
                                        onClick={() => !readOnly && visitRecordInputRef.current?.click()}
                                        disabled={readOnly}
                                        className="px-4 py-2 bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Select Files
                                    </button>
                                </div>
                            )}

                            {newVisitRecords.length > 0 && (
                                <div className="w-full space-y-2">
                                    <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider text-left">Files to Upload</p>
                                    {newVisitRecords.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                                                    {doc.type === 'image' || doc.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? <ImageIcon size={16} /> : <FileType size={16} />}
                                                </div>
                                                {editingVisitRecordIndex === idx ? (
                                                    <input
                                                        type="text"
                                                        value={tempVisitRecordName}
                                                        onChange={(e) => setTempVisitRecordName(e.target.value)}
                                                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#14B8A6]"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                {editingVisitRecordIndex === idx ? (
                                                    <>
                                                        <button onClick={() => saveRenamedVisitRecord(idx)} className="p-1.5 text-[#14B8A6] hover:bg-teal-50 rounded-md transition-colors"><Check size={16} /></button>
                                                        <button onClick={cancelRenamingVisitRecord} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"><X size={16} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleViewLabReport(doc.preview, doc.name, "Preview")} className="p-1.5 text-[#14B8A6] hover:bg-teal-50 rounded-md transition-colors"><Eye size={14} /></button>
                                                        {!readOnly && (
                                                            <>
                                                                <button onClick={() => startRenamingVisitRecord(idx, doc.name)} className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-md transition-colors"><Type size={14} /></button>
                                                                <button onClick={() => removeVisitRecord(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {!readOnly && (
                                        <button
                                            onClick={() => visitRecordInputRef.current?.click()}
                                            className="mt-3 text-xs font-medium text-[#14B8A6] hover:text-teal-700 flex items-center justify-center gap-1 w-full py-2 border border-dashed border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                                        >
                                            <Plus size={12} /> Add More Files
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lab Investigation & Our Lab Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="text-[#14B8A6]" size={20} />
                        <h3 className="font-bold text-slate-900">Lab Investigation</h3>
                    </div>

                    {/* Tabs for Lab Investigation - Hide in ReadOnly */}
                    {!readOnly && (
                        <div className="flex bg-gray-50 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
                            {historicalLabImages.length > 0 && (
                                <button
                                    onClick={() => setActiveLabTab("previous")}
                                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${activeLabTab === "previous" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                                >
                                    <Clock size={14} /> Previous
                                </button>
                            )}
                            <button
                                onClick={() => setActiveLabTab("scan")}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${activeLabTab === "scan" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                            >
                                <Camera size={14} /> Capture
                            </button>
                            <button
                                onClick={() => setActiveLabTab("upload")}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${activeLabTab === "upload" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                            >
                                <Upload size={14} /> Upload
                            </button>
                        </div>
                    )}

                    {activeLabTab === "previous" && historicalLabImages.length > 0 ? (
                        <div className="space-y-3 mb-4">
                            {historicalLabImages.slice((labReportsPage - 1) * itemsPerPage, labReportsPage * itemsPerPage).map((img, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                                            <AuthImage src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="overflow-hidden space-y-1 min-w-0">
                                            <p className="font-medium text-slate-900 text-sm truncate">
                                                {img.name.includes('_') ? img.name.split('_').slice(0, 2).join('_') : img.name}
                                            </p>
                                            {readOnly ? (
                                                <span className="inline-flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-[10px] text-gray-500 font-medium">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    {img.date ? new Date(img.date).toLocaleDateString('en-GB') : "Recorded previously"}
                                                </span>
                                            ) : (
                                                <p className="text-[10px] text-gray-500">
                                                    {img.date ? new Date(img.date).toLocaleDateString('en-GB') : "Recorded previously"}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleViewLabReport(img.preview, img.name, "Lab Report")} className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors" title="View PDF"><Eye size={18} /></button>
                                        <button onClick={() => openDownloadModal(img.preview, img.name, img.date)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download Report"><Download size={18} /></button>
                                        {(!readOnly || allowFileDeletion) && (img.id || img.fileId) && (
                                            <button
                                                onClick={() => handleDeleteLabInvestigation(img.id || img.fileId)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete File"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* Pagination Controls */}
                            {historicalLabImages.length > itemsPerPage && (
                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        onClick={() => setLabReportsPage(prev => Math.max(prev - 1, 1))}
                                        disabled={labReportsPage === 1}
                                        className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        Page {labReportsPage} of {Math.ceil(historicalLabImages.length / itemsPerPage)}
                                    </span>
                                    <button
                                        onClick={() => setLabReportsPage(prev => Math.min(prev + 1, Math.ceil(historicalLabImages.length / itemsPerPage)))}
                                        disabled={labReportsPage === Math.ceil(historicalLabImages.length / itemsPerPage)}
                                        className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : activeLabTab === "scan" ? (
                        <div className="w-full h-full min-h-[300px]">
                            <CameraCapture 
                                onCapture={(image) => {
                                    setNewLabImages(prev => [...prev, { 
                                        preview: image, 
                                        name: `Scan_Lab_Note_${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`, 
                                        type: 'image', 
                                        date: new Date() 
                                    }]);
                                    setActiveLabTab("upload");
                                }} 
                                onCancel={() => setActiveLabTab("upload")}
                            />
                        </div>
                    ) : (
                        <div className="border border-dashed border-gray-100 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/30 flex-1 min-h-[300px]">
                            <input type="file" ref={fileInputRef} onChange={handleLabImageUpload} accept="image/jpeg,image/png" className="hidden" />
                            {newLabImages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="w-12 h-12 rounded-full bg-teal-50 text-[#14B8A6] flex items-center justify-center mb-3">
                                        <FlaskConical size={24} />
                                    </div>
                                    <p className="text-sm text-gray-400 mb-6">No files selected. Allowed formats (PNG, JPG)</p>
                                    {!readOnly && (
                                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                            Select File
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 w-full">
                                    {newLabImages.map((img, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                                    <AuthImage src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                                </div>
                                                {editingLabImageIndex === index ? (
                                                    <input
                                                        type="text"
                                                        value={tempLabImageName}
                                                        onChange={(e) => setTempLabImageName(e.target.value)}
                                                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#14B8A6]"
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-slate-900 truncate">{img.name}</p>
                                                )}
                                            </div>
                                            {editingLabImageIndex === index ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => saveRenamedLabImage(index)} className="p-1.5 text-[#14B8A6] hover:bg-teal-50 rounded-md transition-colors"><Check size={16} /></button>
                                                    <button onClick={cancelRenamingLabImage} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="relative lab-action-menu-container">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenLabActionMenuIndex(openLabActionMenuIndex === index ? null : index);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-slate-900 hover:bg-gray-50 rounded-lg transition-all"
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>

                                                    {openLabActionMenuIndex === index && (
                                                        <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                            <button
                                                                onClick={() => {
                                                                    handleViewLabReport(img.preview, img.name);
                                                                    setOpenLabActionMenuIndex(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Eye size={16} className="text-gray-400" /> View
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    openDownloadModal(img.preview, img.name);
                                                                    setOpenLabActionMenuIndex(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Download size={16} className="text-gray-400" /> Download
                                                            </button>
                                                            <button
                                                                onClick={() => handleSendToLab(img)}
                                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Send size={16} className="text-gray-400" /> Send to Our Lab
                                                            </button>
                                                            {!readOnly && (
                                                                <>
                                                                    <button
                                                                        onClick={() => startRenamingLabImage(index, img.name)}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <Type size={16} className="text-gray-400" /> Rename
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            removeLabImage(index);
                                                                            setOpenLabActionMenuIndex(null);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-50"
                                                                    >
                                                                        <Trash2 size={16} /> Remove File
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {!readOnly && (
                                        <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-4 py-2 bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm w-full">
                                            Select File
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {/* [NEW] Footer for External Lab */}
                    <div className="mt-auto pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                        <p>Lab test referral for external laboratory</p>
                    </div>
                </div>

                {/* Our Lab Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                        <FlaskConical className="text-[#14B8A6]" size={20} />
                        <h3 className="font-bold text-slate-900">Our Lab</h3>
                    </div>
                    <div className="flex bg-gray-50 p-1 rounded-xl mb-6">
                        <button className="flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-white text-slate-900 shadow-sm">
                            <Clock size={14} /> Latest Reports
                        </button>
                    </div>
                    <div className="space-y-3 mb-4 flex-1 overflow-y-auto custom-scrollbar">
                        {ourLabRequests.length > 0 ? (
                            ourLabRequests.slice((ourLabPage - 1) * itemsPerPage, ourLabPage * itemsPerPage).map((req, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-500 overflow-hidden">
                                            {req.preview ? (
                                                <AuthImage src={req.preview} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <FileText size={20} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-slate-900 text-sm truncate">{req.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {readOnly ? (
                                                    <span className="flex items-center gap-1.5 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 text-[10px] text-gray-500 font-medium">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        {req.date ? new Date(req.date).toLocaleDateString('en-GB') : "N/A"}
                                                    </span>
                                                ) : (
                                                    <p className="text-[10px] text-gray-500">{req.date ? new Date(req.date).toLocaleDateString() : "N/A"}</p>
                                                )}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${req.status === 'Completed' ? 'bg-green-50 text-green-600' :
                                                    req.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                                                        req.status === 'Pending' ? 'bg-yellow-50 text-yellow-600' :
                                                            'bg-gray-50 text-gray-600'
                                                    }`}>
                                                    {req.status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* [NEW] Result Button */}
                                        {req.resultPreview && (
                                            <button
                                                onClick={() => handleViewLabReport(req.resultPreview, "Lab Result", "Lab Result")}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="View Result"
                                            >
                                                <FileCheck size={18} />
                                            </button>
                                        )}
                                        {/* Tech Notes */}
                                        {(req.technicianNotes || req.notes) && (
                                            <button
                                                onClick={() => Swal.fire({
                                                    title: '<span class="text-xl font-bold text-slate-800">Lab Technician Note</span>',
                                                    html: `
                                                        <div class="text-left mt-2">
                                                            <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 text-slate-700 text-sm leading-relaxed">
                                                                ${req.technicianNotes || req.notes}
                                                            </div>
                                                        </div>
                                                    `,
                                                    showConfirmButton: false,
                                                    showCloseButton: true,
                                                    customClass: {
                                                        popup: 'rounded-2xl',
                                                        closeButton: 'focus:outline-none'
                                                    }
                                                })}
                                                className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="View Lab Note"
                                            >
                                                <Info size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleViewLabReport(req.preview, req.name, "Our Lab Report")}
                                            className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors"
                                            title="View Document"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => openDownloadModal(req.preview, req.name, req.date)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Download Report"
                                        >
                                            <Download size={18} />
                                        </button>
                                        {(!readOnly || allowFileDeletion) && (
                                            <button
                                                onClick={() => handleDeleteLabRequest(req.id, req.status)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Request"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-gray-400">
                                <FileText size={24} className="mb-2 opacity-50" />
                                <p className="text-xs">No internal lab requests found</p>
                            </div>
                        )}
                        {/* Pagination Controls for Our Lab */}
                        {ourLabRequests.length > itemsPerPage && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                                <button
                                    onClick={() => setOurLabPage(prev => Math.max(prev - 1, 1))}
                                    disabled={ourLabPage === 1}
                                    className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-xs text-gray-500">
                                    Page {ourLabPage} of {Math.ceil(ourLabRequests.length / itemsPerPage)}
                                </span>
                                <button
                                    onClick={() => setOurLabPage(prev => Math.min(prev + 1, Math.ceil(ourLabRequests.length / itemsPerPage)))}
                                    disabled={ourLabPage === Math.ceil(ourLabRequests.length / itemsPerPage)}
                                    className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                        <p>Lab reports from internal laboratory</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 mb-6">
                {/* Cardio Diabetic */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Heart className="text-[#14B8A6]" size={20} />
                            <h3 className="font-bold text-slate-900">Cardiodiabetic</h3>
                        </div>

                        {/* Header Action: Toggle or Add Button */}
                        {cardioHistory.length === 0 ? (
                            <button onClick={() => !readOnly && setCardioEnabled(!cardioEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${cardioEnabled ? 'bg-[#14B8A6]' : 'bg-gray-200'} ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}>
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${cardioEnabled ? 'left-6.5' : 'left-0.5'}`}></div>
                            </button>
                        ) : (
                            !readOnly && (
                                <button onClick={() => setCardioEnabled(true)} className="p-1.5 bg-gray-100 text-[#14B8A6] rounded-lg hover:bg-[#14B8A6] hover:text-white transition-all shadow-sm" title="Add New Record">
                                    <Plus size={18} />
                                </button>
                            )
                        )}
                    </div>

                    {/* History List */}
                    {cardioHistory.length > 0 && (
                        <div className="mb-4 space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Previous Records</p>
                            {cardioHistory.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100/50 hover:border-gray-200 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                                            <Calendar size={14} />
                                        </div>
                                        {readOnly ? (
                                            <div className="flex flex-col gap-1.5 min-w-0">
                                                <span className="inline-flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px] font-medium text-gray-600">
                                                    <Calendar size={12} className="text-[#14B8A6]" />
                                                    {new Date(item.date).toLocaleDateString('en-GB')}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px] font-medium text-gray-500">
                                                    <Clock size={12} className="text-gray-400" />
                                                    {new Date(item.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-700 truncate">{new Date(item.date).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{new Date(item.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => showCardioDetails(item)} className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors">
                                        <Eye size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Input Form */}
                    {cardioEnabled ? (
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 ${cardioHistory.length > 0 ? 'animate-in fade-in slide-in-from-top-4 border-t border-dashed border-gray-200 pt-4' : ''}`}>
                            {cardioHistory.length > 0 && (
                                <div className="md:col-span-2 flex justify-between items-center mb-1">
                                    <p className="text-xs font-bold text-[#14B8A6]">New Entry</p>
                                    <button onClick={() => setCardioEnabled(false)} className="text-xs text-red-400 hover:text-red-500">Cancel</button>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">BP</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 120/80 mmHg"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    value={cardioData.bp}
                                    onChange={(e) => setCardioData({ ...cardioData, bp: e.target.value })}
                                    disabled={readOnly}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">FBS</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    value={cardioData.fbs}
                                    onChange={(e) => setCardioData({ ...cardioData, fbs: e.target.value })}
                                    disabled={readOnly}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">PPBS</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    value={cardioData.ppbs}
                                    onChange={(e) => setCardioData({ ...cardioData, ppbs: e.target.value })}
                                    disabled={readOnly}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total Cholesterol</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    value={cardioData.cholesterol}
                                    onChange={(e) => setCardioData({ ...cardioData, cholesterol: e.target.value })}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    ) : (
                        cardioHistory.length === 0 && (
                            <div className="border border-dashed border-gray-100 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/30 h-[200px]">
                                <p className="text-sm text-gray-400 italic">Cardiodiabetic details not recorded for this patient</p>
                            </div>
                        )
                    )}
                </div>

                {/* Drug Allergy */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldAlert className="text-[#14B8A6]" size={20} />
                            <h3 className="font-bold text-slate-900">Drug Allergy</h3>
                        </div>
                        <button onClick={() => !readOnly && setDrugAllergyEnabled(!drugAllergyEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${drugAllergyEnabled ? 'bg-[#14B8A6]' : 'bg-gray-200'} ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}>
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${drugAllergyEnabled ? 'left-6.5' : 'left-0.5'}`}></div>
                        </button>
                    </div>
                    {drugAllergyEnabled ? (
                        <textarea
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 min-h-[150px]"
                            placeholder="e.g., Penicillin, Sulfa drugs"
                            value={allergyText}
                            onChange={(e) => setAllergyText(e.target.value)}
                            disabled={readOnly}
                        ></textarea>
                    ) : (
                        <div className="border border-dashed border-gray-100 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/30 h-[200px]">
                            <p className="text-sm text-gray-400 italic">No drug allergies recorded</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Prescription */}
            <div className={`grid grid-cols-1 ${!readOnly || prescriptionImages.length > 0 ? 'lg:grid-cols-2' : ''} gap-6`}>
                {/* Prescription */}
                {(prescriptionImages.length > 0 || !readOnly) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full min-h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <PenTool className="text-[#14B8A6]" size={20} />
                                <h3 className="font-bold text-slate-900">Prescription</h3>
                            </div>
                        </div>

                        {/* Prescription Tabs */}
                        {!readOnly && (
                            <div className="flex bg-gray-50 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">

                                <button
                                    onClick={() => setPrescriptionMode("scan")}
                                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${prescriptionMode === "scan" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                                >
                                    <Camera size={14} /> Capture
                                </button>
                                <button
                                    onClick={() => setPrescriptionMode("upload")}
                                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap px-2 ${prescriptionMode === "upload" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}
                                >
                                    <Upload size={14} /> Upload
                                </button>
                            </div>
                        )}


                        {/* Content */}
                        <div className="flex-1 flex flex-col h-full">
                            {readOnly ? (
                                // Read Only View (e.g. for Completed Consultations)
                                <div className="space-y-4">
                                    {prescriptionImages.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {prescriptionImages.map((img, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                                            <AuthImage src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-900 truncate">Prescription {index + 1}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleViewLabReport(img.preview, img.name, "Prescription")} className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors" title="View PDF">
                                                            <Eye size={18} />
                                                        </button>
                                                        <button onClick={() => openDownloadModal(img.preview, "Prescription", img.date)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                                                            <Download size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="border border-dashed border-gray-100 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/30 h-[400px]">
                                            <p className="text-sm text-gray-400 italic">No prescription recorded</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Interactive Mode
                                prescriptionMode === "scan" ? (
                                    <div className="w-full h-full min-h-[400px]">
                                        <CameraCapture 
                                            onCapture={(image) => {
                                                setPrescriptionImages(prev => [...prev, { 
                                                    preview: image, 
                                                    name: `Scan_Prescription_${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`, 
                                                    date: new Date() 
                                                }]);
                                                setPrescriptionMode("upload");
                                            }} 
                                            onCancel={() => setPrescriptionMode("upload")}
                                        />
                                    </div>
                                ) : (
                                    // Upload Mode UI
                                    <div className="border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30 p-6 min-h-[400px] flex flex-col">
                                        <input type="file" ref={prescriptionFileInputRef} onChange={handlePrescriptionImageUpload} accept="image/*" multiple className="hidden" />
                                        {prescriptionImages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center flex-1 text-center">
                                                <p className="text-sm text-gray-400 mb-6">No prescription images uploaded</p>
                                                <button onClick={() => prescriptionFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-[#14B8A6] hover:bg-teal-600 text-white transition-colors">
                                                    <Upload size={14} /> Upload Image(s)
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {prescriptionImages.map((img, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                                                <AuthImage src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                                            </div>
                                                            <p className="text-sm font-medium text-slate-900 truncate">{img.name || `Prescription ${index + 1}`}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleViewLabReport(img.preview, img.name, "Prescription Preview")} className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors" title="View PDF">
                                                                <Eye size={18} />
                                                            </button>
                                                            <button onClick={() => openDownloadModal(img.preview, "Prescription", img.date)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download Report">
                                                                <Download size={18} />
                                                            </button>
                                                            <button onClick={() => removePrescriptionImage(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                                                                <X size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button onClick={() => prescriptionFileInputRef.current?.click()} className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 flex items-center justify-center gap-2 mt-4">
                                                    <Plus size={16} /> Add Another Image
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            )
                            }
                        </div>
                    </div>
                )}

                {/* Separate Previous Prescription Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full min-h-[400px]">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-[#14B8A6]" size={20} />
                        <h3 className="font-bold text-slate-900">Previous Prescriptions</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-6">History of prescriptions given</p>

                    {historicalPrescriptionImages.length > 0 ? (
                        <div className="space-y-3 mb-4">
                            {historicalPrescriptionImages.slice((rxPage - 1) * rxItemsPerPage, rxPage * rxItemsPerPage).map((img, index) => (
                                <div key={index} className="flex flex-col bg-white p-3 rounded-lg border border-gray-200 shadow-sm gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                                <AuthImage src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-medium text-slate-900 text-sm truncate">Prescription</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-100 text-[10px] text-gray-500 font-medium">
                                                        <Calendar size={12} className="text-[#14B8A6]" />
                                                        {img.date ? new Date(img.date).toLocaleDateString('en-GB') : "N/A"}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-100 text-[10px] text-gray-500 font-medium">
                                                        <User size={12} className="text-gray-400" />
                                                        {img.doctor}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {img.pharmacistNotes && (
                                                <button
                                                    onClick={() => Swal.fire({
                                                        title: `<span class="text-xl font-bold text-slate-800">Pharmacist Note</span>`,
                                                        html: `
                                                            <div class="text-left mt-2">
                                                                <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 text-slate-700 text-sm leading-relaxed">
                                                                    ${img.pharmacistNotes}
                                                                </div>
                                                            </div>
                                                        `,
                                                        showConfirmButton: false,
                                                        showCloseButton: true,
                                                        customClass: {
                                                            popup: 'rounded-2xl',
                                                            closeButton: 'focus:outline-none'
                                                        }
                                                    })}
                                                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="View Pharmacist Note"
                                                >
                                                    <Info size={18} />
                                                </button>
                                            )}
                                            <button onClick={() => openPrescriptionPreview((rxPage - 1) * rxItemsPerPage + index)} className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors" title="View Prescription">
                                                <Eye size={18} />
                                            </button>
                                            <button onClick={() => openDownloadModal(img.preview, "Prescription", img.date)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                                                <Download size={18} />
                                            </button>
                                            {(!readOnly || allowFileDeletion) && img.id && (
                                                <button
                                                    onClick={() => handleDeletePrescription(img.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Prescription"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Pagination Controls */}
                            {historicalPrescriptionImages.length > rxItemsPerPage && (
                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        onClick={() => setRxPage(prev => Math.max(prev - 1, 1))}
                                        disabled={rxPage === 1}
                                        className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        Page {rxPage} of {Math.ceil(historicalPrescriptionImages.length / rxItemsPerPage)}
                                    </span>
                                    <button
                                        onClick={() => setRxPage(prev => Math.min(prev + 1, Math.ceil(historicalPrescriptionImages.length / rxItemsPerPage)))}
                                        disabled={rxPage === Math.ceil(historicalPrescriptionImages.length / rxItemsPerPage)}
                                        className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="border border-dashed border-gray-100 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/30 h-[200px]">
                            <Clock className="text-gray-200 mb-2" size={32} />
                            <p className="text-sm text-gray-400 italic">No previous prescriptions</p>
                        </div>
                    )}
                </div>
            </div>

            {/* [NEW] Quick Prescriptions Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full min-h-[300px]">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="text-[#14B8A6]" size={20} />
                        <h3 className="font-bold text-slate-900">Quick Prescription</h3>
                    </div>

                    <div className="flex-1 flex flex-col">
                        {historicalQuickPrescriptions.length > 0 ? (
                            <div className="space-y-3 mb-4">
                                {historicalQuickPrescriptions.slice((quickPrescriptionPage - 1) * itemsPerPage, quickPrescriptionPage * itemsPerPage).map((doc, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-white shrink-0 overflow-hidden border border-gray-200">
                                                <AuthImage
                                                    src={doc.preview || FALLBACK_IMAGE}
                                                    alt="preview"
                                                    className="w-full h-full object-cover"
                                                    fallbackSrc={FALLBACK_IMAGE}
                                                />
                                            </div>
                                            <div className="overflow-hidden min-w-0 space-y-1">
                                                <p className="font-medium text-slate-900 text-sm truncate">{doc.name}</p>
                                                {readOnly ? (
                                                    <span className="inline-flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-100 text-[10px] text-gray-500 font-medium">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        {doc.date ? new Date(doc.date).toLocaleDateString('en-GB') : 'Previously Recorded'}
                                                    </span>
                                                ) : (
                                                    <p className="text-[10px] text-gray-500">
                                                        {doc.date ? new Date(doc.date).toLocaleDateString() : 'Previously Recorded'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {doc.pharmacistNotes && (
                                                <button
                                                    onClick={() => Swal.fire({
                                                        title: `<span class="text-xl font-bold text-slate-800">Pharmacist Note</span>`,
                                                        html: `
                                                            <div class="text-left mt-2">
                                                                <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 text-slate-700 text-sm leading-relaxed">
                                                                    ${doc.pharmacistNotes}
                                                                </div>
                                                            </div>
                                                        `,
                                                        showConfirmButton: false,
                                                        showCloseButton: true,
                                                        customClass: {
                                                            popup: 'rounded-2xl',
                                                            closeButton: 'focus:outline-none'
                                                        }
                                                    })}
                                                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="View Pharmacist Note"
                                                >
                                                    <Info size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openImagePreview(doc.preview, "Quick Prescription Preview")}
                                                className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors"
                                                title="View Document"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {(!readOnly || allowFileDeletion) && doc.id && (
                                                <button
                                                    onClick={() => handleDeleteQuickPrescription(doc.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Quick Prescription"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Pagination Controls */}
                                {historicalQuickPrescriptions.length > itemsPerPage && (
                                    <div className="flex items-center justify-between pt-2">
                                        <button
                                            onClick={() => setQuickPrescriptionPage(prev => Math.max(prev - 1, 1))}
                                            disabled={quickPrescriptionPage === 1}
                                            className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-xs text-gray-500">
                                            Page {quickPrescriptionPage} of {Math.ceil(historicalQuickPrescriptions.length / itemsPerPage)}
                                        </span>
                                        <button
                                            onClick={() => setQuickPrescriptionPage(prev => Math.min(prev + 1, Math.ceil(historicalQuickPrescriptions.length / itemsPerPage)))}
                                            disabled={quickPrescriptionPage === Math.ceil(historicalQuickPrescriptions.length / itemsPerPage)}
                                            className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="border border-dashed border-gray-100 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/30 flex-1">
                                <p className="text-sm text-gray-400 italic">No previous records</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* [NEW] Quick Documents Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full min-h-[300px]">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="text-[#14B8A6]" size={20} />
                        <h3 className="font-bold text-slate-900">Quick Documents</h3>
                    </div>

                    <div className="flex-1 flex flex-col">
                        {historicalQuickDocuments.length > 0 ? (
                            <div className="space-y-3 mb-4">
                                {historicalQuickDocuments.slice((quickDocumentPage - 1) * itemsPerPage, quickDocumentPage * itemsPerPage).map((doc, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-500 flex items-center justify-center shrink-0">
                                                {(doc.preview && (doc.preview.match(/\.(jpg|jpeg|png|gif|webp)$/i) || doc.preview.startsWith('data:image')))
                                                    ? <ImageIcon size={16} />
                                                    : <FileType size={16} />
                                                }
                                            </div>
                                            <div className="overflow-hidden min-w-0 space-y-1">
                                                <p className="font-medium text-slate-900 text-sm truncate">{doc.name}</p>
                                                {readOnly ? (
                                                    <span className="inline-flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-100 text-[10px] text-gray-500 font-medium">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        {doc.date ? new Date(doc.date).toLocaleDateString('en-GB') : 'Previously Recorded'}
                                                    </span>
                                                ) : (
                                                    <p className="text-[10px] text-gray-500">
                                                        {doc.date ? new Date(doc.date).toLocaleDateString() : 'Previously Recorded'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openImagePreview(doc.preview, "Quick Document Preview")}
                                                className="p-2 text-[#14B8A6] hover:bg-teal-50 rounded-lg transition-colors"
                                                title="View Document"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {(!readOnly || allowFileDeletion) && doc.id && (
                                                <button
                                                    onClick={() => handleDeleteQuickDocument(doc.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Quick Document"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Pagination Controls */}
                                {historicalQuickDocuments.length > itemsPerPage && (
                                    <div className="flex items-center justify-between pt-2">
                                        <button
                                            onClick={() => setQuickDocumentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={quickDocumentPage === 1}
                                            className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-xs text-gray-500">
                                            Page {quickDocumentPage} of {Math.ceil(historicalQuickDocuments.length / itemsPerPage)}
                                        </span>
                                        <button
                                            onClick={() => setQuickDocumentPage(prev => Math.min(prev + 1, Math.ceil(historicalQuickDocuments.length / itemsPerPage)))}
                                            disabled={quickDocumentPage === Math.ceil(historicalQuickDocuments.length / itemsPerPage)}
                                            className="px-3 py-1 text-xs font-medium text-[#14B8A6] bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="border border-dashed border-gray-100 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/30 flex-1">
                                <p className="text-sm text-gray-400 italic">No previous records</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Footer */}
            {
                !readOnly && (
                    <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-amber-700">
                            <Activity size={20} className="flex-shrink-0" />
                            <div className="text-sm">
                                <span className="font-bold block mb-0.5">Consultation will be locked after ending</span>
                            </div>
                        </div>
                        <button onClick={handleEndConsultation} className="bg-[#14B8A6] hover:bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-teal-900/10 flex items-center gap-2 transition-all whitespace-nowrap">
                            <CheckCircle size={20} /> End Consultation
                        </button>
                    </div>
                )
            }


            {/* Download Options Modal */}
            <DownloadActionModal
                isOpen={!!downloadModalData}
                onClose={() => setDownloadModalData(null)}
                onDownloadPdf={() => handleDownloadOption('pdf')}
                onDownloadPng={() => handleDownloadOption('png')}
                isDownloading={isDownloading}
            />

            {/* Lab Report Modal */}
            <ViewLabReportModal
                isOpen={showLabReportModal}
                onClose={() => setShowLabReportModal(false)}
                pdfUrl={viewLabReportUrl}
                fileName={viewLabReportFileName}
                title={viewLabReportTitle}
                formatted={false}
                patientDetails={{
                    name: visitDetails?.Patient?.fullName || patient?.name,
                    id: visitDetails?.Patient?.uniqueId || patient?.patientId,
                    age: visitDetails?.Patient?.age || patient?.age, // Use simple age access
                    gender: visitDetails?.Patient?.sex || patient?.gender,
                    doctorName: doctorName,
                    date: new Date().toLocaleDateString()
                }}
            />



            {/* Send to Lab Modal */}
            <SendToLabModal
                isOpen={showSendToLabModal}
                onClose={() => setShowSendToLabModal(false)}
                fileData={sendToLabFile}
                onSend={confirmSendToLab}
                isSending={isSendingToLab}
            />

            {/* Vitals History Modal */}
            <VitalsHistoryModal
                isOpen={showVitalsHistoryModal}
                onClose={() => setShowVitalsHistoryModal(false)}
                history={vitalsHistory}
                readOnly={readOnly}
            />

            {/* Profile Image Preview Modal */}
            {
                previewImage && (
                    <div
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
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


            {/* Image Preview Modal */}
            <ImagePreviewModal
                isOpen={showImagePreviewModal}
                onClose={() => {
                    setShowImagePreviewModal(false);
                    setViewImageUrl(null);
                }}
                imageUrl={viewImageUrl}
                title={viewImageTitle}
            />

            <PrescriptionPreviewModal
                isOpen={showPrescriptionPreviewModal}
                onClose={() => setShowPrescriptionPreviewModal(false)}
                prescriptions={historicalPrescriptionImages}
                currentIndex={prescriptionPreviewIndex}
                onNavigate={(index) => setPrescriptionPreviewIndex(index)}
            />
        </div >
    );
}
