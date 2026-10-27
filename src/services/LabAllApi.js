import { commonApi } from "./commonApi";
import { BASE_URL } from "./baseURL";

// for fetching lab requests
// for fetching lab requests
export const fetchLabRequestsApi = async (status = "Pending", page = 1, limit = 10, searchKey = "") => {
    return await commonApi("GET", `${BASE_URL}/api/LabTechnician/lab-requests?status=${status}&page=${page}&limit=${limit}&search=${searchKey}`, "", "");
};

// for dashboard stats
// for dashboard stats
export const getLabDashboardStatsApi = async () => {
    return await commonApi("GET", `${BASE_URL}/api/LabTechnician/dashboard-stats`, "", "");
};

// for uploading lab report
export const uploadLabReportApi = async (requestId, reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/LabTechnician/lab-requests/${requestId}/upload`, reqBody, "multipart/form-data");
};

// for updating lab payment status
export const updateLabPaymentStatusApi = async (requestId, reqBody) => {
    return await commonApi("PATCH", `${BASE_URL}/api/LabTechnician/lab-requests/${requestId}/payment-status`, reqBody, "");
};

// for updating lab request status (workflow)
export const updateLabRequestStatusApi = async (requestId, status) => {
    return await commonApi("PATCH", `${BASE_URL}/api/LabTechnician/lab-requests/${requestId}/status`, { status }, "");
};
