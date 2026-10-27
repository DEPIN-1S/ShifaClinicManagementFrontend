import { BASE_URL } from "./baseURL";
import { commonApi } from "./commonApi";

console.log("baseurl", BASE_URL);


export const getPharmacistPrescriptionsApi = async (status) => {
    console.log("baseurl", BASE_URL);
    return await commonApi("GET", `${BASE_URL}/api/Pharmacy/prescriptions?dispenseStatus=${status}`, "", "")
}

export const getPrescriptionDetailsApi = async (id) => {
    return await commonApi("GET", `${BASE_URL}/api/Pharmacy/prescription/${id}`, "", "")
}

export const dispensePrescriptionApi = async (id, reqBody) => {
    return await commonApi("PUT", `${BASE_URL}/api/Pharmacy/prescription/${id}/dispense`, reqBody, "")
}

export const getPharmacistDashboardStatsApi = async () => {
    return await commonApi("GET", `${BASE_URL}/api/Pharmacy/dashboard`, "", "")
}

export const searchPatientApi = async (searchKey) => {
    return await commonApi("GET", `${BASE_URL}/api/Pharmacy/patient/search?${searchKey}`, "", "")
}

export const getPatientPrescriptionHistoryApi = async (patientId) => {
    return await commonApi("GET", `${BASE_URL}/api/Pharmacy/prescriptions/history/${patientId}`, "", "")
}

export const getQuickPrescriptionsApi = async (dispenseStatus, page, limit) => {
    return await commonApi("GET", `${BASE_URL}/api/Pharmacy/quick-prescriptions?dispenseStatus=${dispenseStatus}&page=${page}&limit=${limit}`, "", "")
}

export const uploadQuickPrescriptionApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/Pharmacy/quick-prescription`, reqBody, "multipart/form-data")
}

export const dispenseQuickPrescriptionApi = async (id, reqBody) => {
    return await commonApi("PUT", `${BASE_URL}/api/Pharmacy/quick-prescription/${id}/dispense`, reqBody, "")
}
