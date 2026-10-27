import {
    filenameFromContentDisposition,
    filenameFromPath,
    isProtectedFileUrl,
    resolveFileUrl,
    sanitizeFilename,
} from "./fileUrl.js";

const MAX_CACHE_ENTRIES = 40;
const IDLE_MS = 60_000;

const ready = new Map();
const inflight = new Map();
const transientUrls = new Set();
let unauthorizedHandler = null;

export class FileRequestError extends Error {
    constructor(message, { status = 0, code = "network" } = {}) {
        super(message);
        this.name = "FileRequestError";
        this.status = status;
        this.code = code;
    }
}

export function setUnauthorizedHandler(handler) {
    unauthorizedHandler = handler;
}

function readToken() {
    try {
        if (typeof sessionStorage === "undefined") return "";
        return sessionStorage.getItem("token") || "";
    } catch {
        return "";
    }
}

function createObjectUrl(blob) {
    return URL.createObjectURL(blob);
}

function revokeObjectUrl(url) {
    if (!url || !url.startsWith("blob:")) return;
    URL.revokeObjectURL(url);
}

function revokeEntry(url) {
    const entry = ready.get(url);
    if (!entry) return;
    clearTimeout(entry.idleTimer);
    if (entry.ownedUrl) revokeObjectUrl(entry.objectUrl);
    ready.delete(url);
}

export function clearAuthenticatedFileCache() {
    for (const url of [...ready.keys()]) revokeEntry(url);
    inflight.clear();
    for (const url of transientUrls) revokeObjectUrl(url);
    transientUrls.clear();
}

export function releaseIdleEntries(now = Date.now()) {
    for (const [url, entry] of [...ready.entries()]) {
        if (entry.refs > 0 || !entry.objectUrl || !entry.idleUntil || entry.idleUntil > now) continue;
        revokeEntry(url);
    }
}

function scheduleIdle(url) {
    const entry = ready.get(url);
    if (!entry || entry.refs > 0 || !entry.objectUrl) return;
    entry.idleUntil = Date.now() + IDLE_MS;
    clearTimeout(entry.idleTimer);
    entry.idleTimer = setTimeout(() => releaseIdleEntries(), IDLE_MS);
}

function remember(url, entry) {
    ready.delete(url);
    ready.set(url, entry);
    while (ready.size > MAX_CACHE_ENTRIES) {
        const victim = [...ready.entries()].find(([, item]) => item.refs === 0 && item.objectUrl);
        if (!victim) break;
        revokeEntry(victim[0]);
    }
}

function notifyUnauthorized() {
    if (unauthorizedHandler) unauthorizedHandler();
    else clearAuthenticatedFileCache();
}

function errorForStatus(status) {
    if (status === 401) {
        return new FileRequestError("Your session has expired. Please log in again.", { status, code: "unauthorized" });
    }
    if (status === 403) {
        return new FileRequestError("You do not have permission to view this file.", { status, code: "forbidden" });
    }
    if (status === 404) {
        return new FileRequestError("File not found.", { status, code: "not_found" });
    }
    return new FileRequestError("Could not load this file.", { status, code: "http" });
}

async function fetchBlob(url, { authenticated }) {
    const headers = {};
    if (authenticated) {
        const token = readToken();
        if (!token) {
            notifyUnauthorized();
            throw errorForStatus(401);
        }
        headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(url, {
            method: "GET",
            headers,
            credentials: "omit",
            cache: "no-store",
        });
    } catch (cause) {
        if (cause?.name === "AbortError") throw cause;
        throw new FileRequestError("Could not load this file. Check your connection and try again.", { status: 0, code: "network" });
    }

    if (!response.ok) {
        if (response.status === 401) notifyUnauthorized();
        throw errorForStatus(response.status);
    }

    const headerType = response.headers.get("content-type") || "";
    const contentType = headerType.split(";")[0].trim() || "application/octet-stream";
    const rawBlob = await response.blob();
    const blob = rawBlob.type ? rawBlob : new Blob([rawBlob], { type: contentType });
    return {
        blob,
        contentType: blob.type || contentType,
        filename: filenameFromContentDisposition(response.headers.get("content-disposition")),
    };
}

export function peekAuthenticatedFile(src) {
    const url = resolveFileUrl(src);
    const entry = ready.get(url);
    if (!entry?.objectUrl) return null;
    entry.lastUsed = Date.now();
    clearTimeout(entry.idleTimer);
    entry.idleUntil = 0;
    return entry;
}

export function retainAuthenticatedFile(src) {
    const url = resolveFileUrl(src);
    if (!isProtectedFileUrl(url)) return () => {};

    const existing = ready.get(url) || { refs: 0 };
    existing.refs = (existing.refs || 0) + 1;
    clearTimeout(existing.idleTimer);
    existing.idleUntil = 0;
    ready.set(url, existing);

    return () => {
        const current = ready.get(url);
        if (!current) return;
        current.refs = Math.max(0, (current.refs || 0) - 1);
        if (current.refs === 0 && !current.objectUrl) ready.delete(url);
        else if (current.refs === 0) scheduleIdle(url);
    };
}

export async function loadAuthenticatedFile(src) {
    const url = resolveFileUrl(src);
    if (!url) {
        throw new FileRequestError("File not found.", { status: 404, code: "not_found" });
    }

    const cached = ready.get(url);
    if (cached?.objectUrl) {
        cached.lastUsed = Date.now();
        clearTimeout(cached.idleTimer);
        cached.idleUntil = 0;
        return cached;
    }

    if (inflight.has(url)) return inflight.get(url);

    const request = (async () => {
        const protectedFile = isProtectedFileUrl(url);
        const fetched = await fetchBlob(url, { authenticated: protectedFile });
        const ownedUrl = protectedFile || (!url.startsWith("blob:") && !url.startsWith("data:"));
        const objectUrl = ownedUrl ? createObjectUrl(fetched.blob) : url;
        const previous = ready.get(url);
        const entry = {
            url,
            blob: fetched.blob,
            objectUrl,
            ownedUrl,
            contentType: fetched.contentType,
            filename: fetched.filename || filenameFromPath(url),
            refs: previous?.refs || 0,
            lastUsed: Date.now(),
            idleUntil: 0,
        };
        remember(url, entry);
        if (entry.refs === 0) scheduleIdle(url);
        return entry;
    })();

    inflight.set(url, request);
    try {
        return await request;
    } finally {
        inflight.delete(url);
    }
}

export function decodeImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new FileRequestError("Could not load this file.", { code: "decode" }));
        image.src = src;
    });
}

export async function loadAuthenticatedImage(src) {
    const resolved = resolveFileUrl(src);
    if (resolved.startsWith("data:") || resolved.startsWith("blob:")) {
        return decodeImage(resolved);
    }
    const file = await loadAuthenticatedFile(resolved);
    return decodeImage(file.objectUrl);
}

export function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new FileRequestError("Could not read this file.", { code: "read" }));
        reader.readAsDataURL(blob);
    });
}

export async function authenticatedFileToDataUrl(src) {
    const file = await loadAuthenticatedFile(src);
    return blobToDataUrl(file.blob);
}

export async function downloadAuthenticatedFile(src, filename) {
    const file = await loadAuthenticatedFile(src);
    const name = sanitizeFilename(filename || file.filename || filenameFromPath(file.url));
    const downloadUrl = createObjectUrl(file.blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => revokeObjectUrl(downloadUrl), 1500);
    return name;
}

export async function openAuthenticatedFile(src) {
    const file = await loadAuthenticatedFile(src);
    const popupUrl = createObjectUrl(file.blob);
    transientUrls.add(popupUrl);
    const popup = window.open(popupUrl, "_blank");
    if (!popup) {
        revokeObjectUrl(popupUrl);
        transientUrls.delete(popupUrl);
        throw new FileRequestError("The browser blocked the file window.", { code: "popup" });
    }
    return popupUrl;
}
