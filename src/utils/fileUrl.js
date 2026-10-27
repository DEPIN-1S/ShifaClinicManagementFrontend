const DEFAULT_API_BASE_URL = "https://api-new.shifclkmr.in";

const LEGACY_API_HOSTS = new Set([
    "api-new.shifclkmr.in",
    "shifaclinicaws.shifclkmr.in",
    "lunarsenterprises.com",
]);

export function getApiBaseUrl() {
    const configured = import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
    return String(configured).trim().replace(/\/+$/, "");
}

export function isProtectedPathname(pathname) {
    const path = String(pathname || "");
    const normalized = (path.startsWith("/") ? path : `/${path}`).toLowerCase();
    return normalized === "/uploads"
        || normalized.startsWith("/uploads/")
        || normalized === "/documents"
        || normalized.startsWith("/documents/")
        || normalized === "/images/features"
        || normalized.startsWith("/images/features/");
}

export function resolveFileUrl(input, { uploadsFallback = false } = {}) {
    if (input == null) return "";
    const clean = String(input).trim();
    if (!clean || clean === "null" || clean === "undefined") return "";
    if (clean.startsWith("blob:") || clean.startsWith("data:")) return clean;

    if (/^https?:\/\//i.test(clean)) {
        try {
            const url = new URL(clean);
            const base = new URL(getApiBaseUrl());
            const knownHost = url.hostname === base.hostname || LEGACY_API_HOSTS.has(url.hostname);
            if (knownHost && isProtectedPathname(url.pathname)) {
                return `${getApiBaseUrl()}${url.pathname}`;
            }
        } catch {
            return clean;
        }
        return clean;
    }

    let path = clean.replace(/^\/+/, "");
    if (uploadsFallback && !/^(uploads|documents|images)\//i.test(path)) {
        path = `uploads/${path}`;
    }
    return `${getApiBaseUrl()}/${path}`;
}

export function isProtectedFileUrl(input) {
    const resolved = resolveFileUrl(input);
    if (!resolved || resolved.startsWith("blob:") || resolved.startsWith("data:")) return false;
    try {
        const url = new URL(resolved);
        const base = new URL(getApiBaseUrl());
        return url.origin === base.origin && isProtectedPathname(url.pathname);
    } catch {
        return false;
    }
}

export function isPdfSource({ src = "", fileName = "", fileType = "", contentType = "" } = {}) {
    const type = `${fileType} ${contentType}`.toLowerCase();
    if (type.includes("pdf")) return true;
    const name = `${fileName} ${String(src).split("?")[0]}`.toLowerCase();
    return name.includes("application/pdf") || name.endsWith(".pdf");
}

export function filenameFromPath(input) {
    const resolved = resolveFileUrl(input);
    if (!resolved || resolved.startsWith("data:")) return "";
    try {
        const pathname = resolved.startsWith("blob:") ? resolved : new URL(resolved).pathname;
        const name = pathname.split("/").filter(Boolean).pop() || "";
        return decodeURIComponent(name);
    } catch {
        return "";
    }
}

export function sanitizeFilename(name, fallback = "download") {
    const cleaned = String(name || "").replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, " ").trim();
    return cleaned || fallback;
}

export function filenameFromContentDisposition(header) {
    if (!header) return "";
    const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (encoded) {
        try {
            return sanitizeFilename(decodeURIComponent(encoded[1].trim()));
        } catch {
            return sanitizeFilename(encoded[1].trim());
        }
    }
    const quoted = header.match(/filename="([^"]+)"/i);
    if (quoted) return sanitizeFilename(quoted[1]);
    const plain = header.match(/filename=([^;]+)/i);
    return plain ? sanitizeFilename(plain[1].trim()) : "";
}
