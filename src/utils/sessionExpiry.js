import Swal from "sweetalert2";
import { clearAuthenticatedFileCache, setUnauthorizedHandler } from "./authenticatedFile.js";

let expiryStarted = false;

export function handleSessionExpiry() {
    clearAuthenticatedFileCache();
    if (expiryStarted || Swal.isVisible()) return;
    expiryStarted = true;

    Swal.fire({
        title: "Session Expired",
        text: "Your session has expired. Please log in again.",
        icon: "warning",
        confirmButtonColor: "#14B8A6",
        confirmButtonText: "Log In",
        allowOutsideClick: false,
        allowEscapeKey: false,
    }).then(() => {
        sessionStorage.clear();
        window.location.href = "/";
    });
}

setUnauthorizedHandler(handleSessionExpiry);
