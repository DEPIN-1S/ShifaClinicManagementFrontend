import { BASE_URL } from "./baseURL";
import { commonApi } from "./commonApi";


// Send OTP
export const sendOtpApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/User/login/send-otp`, reqBody, "")
}

// Verify OTP
export const verifyOtpApi = async (reqBody) => {
    return await commonApi("POST", `${BASE_URL}/api/User/login/verify-otp`, reqBody, "")
}
