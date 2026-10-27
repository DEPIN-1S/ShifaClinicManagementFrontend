import { BASE_URL } from "./baseURL";
import { commonApi } from "./commonApi";

export const fetchPatientsApi = async (page = 1, limit = 10) => {
    return await commonApi("GET", `${BASE_URL}/api/Receptionist/patients?page=${page}&limit=${limit}`, "", "")
}

export const fetchAllPatientsApi = async (page = 1, limit = 10) => {
    return await commonApi("GET", `${BASE_URL}/api/Receptionist/all-patients?page=${page}&limit=${limit}`, "", "")
}

export const searchPatientApi = async (searchParams) => {
    return await commonApi("GET", `${BASE_URL}/api/Receptionist/search-patient?${searchParams}`)
}

export const registerPatientApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/Receptionist/register-patient`, reqBody, "")
}

export const generateTokenApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/Receptionist/generate-token`, reqBody, "")
}

export const uploadDocumentApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/Receptionist/patient/document`, reqBody, "")
}

export const uploadQuickDocumentApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/Receptionist/quick-document`, reqBody, "multipart/form-data")
}


export const fetchDocumentsApi = async (patientId) => {
    return await commonApi("GET", `${BASE_URL}/api/Receptionist/patient/${patientId}/documents`, "", "")
}

export const fetchAllDocumentsApi = async (page = 1, limit = 10) => {
    return await commonApi("GET", `${BASE_URL}/api/Receptionist/quick-documents?page=${page}&limit=${limit}`, "", "")
}

export const deletePatientApi = async (id) => {
    return await commonApi("DELETE", `${BASE_URL}/api/Receptionist/patients/${id}`, {}, "")
}

export const editPatientApi = async (id, reqBody) => {
    return await commonApi("PATCH", `${BASE_URL}/api/Receptionist/patients/${id}`, reqBody, "multipart/form-data")
}

export const setFreeStatusApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/Receptionist/set-free-status`, reqBody, "")
}

export const fetchDashboardStatsApi = async () => {
    return await commonApi("GET", `${BASE_URL}/api/receptionist/dashboard-stats`, "", "")
}