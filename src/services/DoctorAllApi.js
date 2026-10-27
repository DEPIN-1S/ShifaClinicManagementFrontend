import { BASE_URL } from "./baseURL";
import { commonApi } from "./commonApi";

export const fetchPatientsApi = async (status = "", page = 1, limit = 10) => {
    const url = status
        ? `${BASE_URL}/api/Doctor/patient-tokens?status=${status}`
        : `${BASE_URL}/api/Doctor/patient-tokens`;
    return await commonApi("GET", url, "", "")
}

export const fetchAllPatientsApi = async (page = 1, limit = 10) => {
    return await commonApi("GET", `${BASE_URL}/api/Doctor/all-patients?page=${page}&limit=${limit}`, "", "")
}

export const fetchDashboardCountsApi = async () => {
    return await commonApi("GET", `${BASE_URL}/api/Doctor/dashboard-stats`, "", "")
}

export const updateVisitStatusApi = async (id, status) => {
    return await commonApi("PATCH", `${BASE_URL}/api/Doctor/visit/${id}/status`, { "status": status }, "")
}

export const fetchPatientDocumentsApi = async (patientId) => {
    return await commonApi("GET", `${BASE_URL}/api/Doctor/patient-documents/${patientId}`, "", "")
}

export const searchPatientApi = async (searchParams) => {
    return await commonApi("GET", `${BASE_URL}/api/Doctor/search-patient?${searchParams}`)
}

export const registerPatientApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/Doctor/register-patient`, reqBody, "")
}

export const fetchAllDocumentsApi = async () => {
    return await commonApi("GET", `${BASE_URL}/api/Doctor/patient-documents`, "", "")
}

export const uploadDocumentApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/Doctor/patient/document`, reqBody, "multipart/form-data")
}

export const fetchVisitDetailsApi = async (visitId) => {
    return await commonApi("GET", `${BASE_URL}/api/Doctor/visit/${visitId}`, "", "")
}

export const updateConsultationApi = async (visitId, reqBody) => {
    return await commonApi("PATCH", `${BASE_URL}/api/Doctor/visit/${visitId}`, reqBody, "multipart/form-data")
}

export const generateTokenApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/Doctor/generate-token`, reqBody, "")
}

export const deletePatientApi = async (id) => {
    return await commonApi("DELETE", `${BASE_URL}/api/Doctor/patients/${id}`, {}, "")
}

export const deletePatientDocumentApi = async (docId) => {
    return await commonApi("DELETE", `${BASE_URL}/api/Doctor/patient/document/${docId}`, {}, "")
}

export const deleteVisitFileApi = async (id, reqBody) => {
    return await commonApi("DELETE", `${BASE_URL}/api/Doctor/visit/${id}/file`, reqBody, "")
}

export const createLabRequestApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/doctor/lab-request`, reqBody, "multipart/form-data")
}

export const uploadQuickDocumentApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/doctor/patient/quick-document`, reqBody, "multipart/form-data")
}

export const uploadQuickPrescriptionApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/doctor/patient/quick-prescription`, reqBody, "multipart/form-data")
}

export const getQuickDocumentsApi = async (page = 1, limit = 6, search = "") => {
    return await commonApi("GET", `${BASE_URL}/api/doctor/patient/quick-documents?page=${page}&limit=${limit}&search=${search}`, "", "")
}

export const editPatientApi = async (id, reqBody) => {
    return await commonApi("PATCH", `${BASE_URL}/api/Doctor/patients/${id}`, reqBody, "multipart/form-data")
}

export const getDoctorPatientPrescriptionHistoryApi = async (patientId, page = 1, limit = 10) => {
    return await commonApi("GET", `${BASE_URL}/api/doctor/patient/prescription-history/${patientId}?page=${page}&limit=${limit}`, "", "")
}

export const setFreeStatusApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/Doctor/set-free-status`, reqBody, "")
}

export const deleteLabRequestApi = async (id) => {
    return await commonApi("DELETE", `${BASE_URL}/api/Doctor/lab-request/${id}`, {}, "")
}


export const deleteLabInvestigationApi = async (id) => {
    return await commonApi("DELETE", `${BASE_URL}/api/Doctor/lab-investigation/${id}`, {}, "")
}


export const deletePrescriptionApi = async (id) => {
    return await commonApi("DELETE", `${BASE_URL}/api/Doctor/prescription/${id}`, {}, "")
}

export const deleteQuickDocumentApi = async (id) => {
    return await commonApi("DELETE", `${BASE_URL}/api/Doctor/quick-document/${id}`, {}, "")
}

export const getConsultationHistoryFullApi = async (patientId) => {
    return await commonApi("GET", `${BASE_URL}/api/Doctor/consultation-history-full/${patientId}`, "", "")
}