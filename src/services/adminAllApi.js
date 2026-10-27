import { BASE_URL } from "./baseURL";
import { commonApi } from "./commonApi";


//for registering a new user
export const addNewUserApi = async (reqBody) => {
    console.log("add new user:::", reqBody);
    return await commonApi("POST", `${BASE_URL}/api/User`, reqBody, "")
}

//for fetching all users
export const fetchUsersApi = async (search) => {
    return await commonApi("GET", `${BASE_URL}/api/User${search ? `?${search}` : ""}`, "", "")
}

//for deleting user 
export const deleteUserApi = async (userId) => {
    console.log("user id inside api call", userId);
    return await commonApi("DELETE", `${BASE_URL}/api/User/${userId}`, {}, "")
}

//for updating user
export const editUserApi = async (userId, reqBody) => {
    return await commonApi("PUT", `${BASE_URL}/api/User/${userId}`, reqBody, "")
}

//for registering patient 
export const registerPatientApi = async (reqBody) => {
    console.log("Req body for register patient :::", reqBody);

    return await commonApi("POST", `${BASE_URL}/api/Receptionist/register-patient`, reqBody, "")
}


//for fetching dashboard stats
export const fetchDashboardStatsApi = async () => {
    return await commonApi("GET", `${BASE_URL}/api/Admin/dashboard-stats`, "", "")
}

//for fetching daily pharmacy payment stats
export const fetchDailyPharmacyPaymentStatsApi = async () => {
    return await commonApi("GET", `${BASE_URL}/api/Admin/daily-pharmacyPayment-stats`, "", "")
}

//for fetching pharmacy payments with pagination and search
export const fetchPharmacyPaymentsApi = async (page = 1, limit = 10, search = "") => {
    return await commonApi("GET", `${BASE_URL}/api/Admin/pharmacy-payments?page=${page}&limit=${limit}&search=${search}`, "", "")
}

//for downloading pharmacy revenue details
export const downloadPharmacyRevenueApi = async (date) => {
    return await commonApi("GET", `${BASE_URL}/api/Admin/pharmacy-payments?date=${date}`, "", "")
}

//for fetching daily lab payment stats
export const fetchDailyLabPaymentStatsApi = async (date = "") => {
    return await commonApi("GET", `${BASE_URL}/api/Admin/daily-labPayment-stats${date ? `?date=${date}` : ""}`, "", "")
}

//for fetching lab payments with pagination and search
export const fetchLabPaymentsApi = async (page = 1, limit = 10, search = "") => {
    return await commonApi("GET", `${BASE_URL}/api/Admin/lab-payments?page=${page}&limit=${limit}&search=${search}`, "", "")
}

//for downloading lab revenue details
export const downloadLabRevenueApi = async (date) => {
    return await commonApi("GET", `${BASE_URL}/api/Admin/lab-payments?date=${date}`, "", "")
}
