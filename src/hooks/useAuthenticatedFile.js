import { useEffect, useState } from "react";
import {
    loadAuthenticatedFile,
    peekAuthenticatedFile,
    retainAuthenticatedFile,
} from "../utils/authenticatedFile.js";
import { isProtectedFileUrl, resolveFileUrl } from "../utils/fileUrl.js";
import "../utils/sessionExpiry.js";

function snapshot(src) {
    const source = resolveFileUrl(src);
    if (!source) {
        return { status: "idle", objectUrl: "", contentType: "", filename: "", message: "", httpStatus: 0, code: "", source: "" };
    }
    if (!isProtectedFileUrl(source)) {
        return { status: "ready", objectUrl: source, contentType: "", filename: "", message: "", httpStatus: 200, code: "", source };
    }
    const cached = peekAuthenticatedFile(source);
    if (cached) {
        return {
            status: "ready",
            objectUrl: cached.objectUrl,
            contentType: cached.contentType,
            filename: cached.filename,
            message: "",
            httpStatus: 200,
            code: "",
            source,
        };
    }
    return { status: "loading", objectUrl: "", contentType: "", filename: "", message: "", httpStatus: 0, code: "", source };
}

export function useAuthenticatedFile(src) {
    const immediate = snapshot(src);
    const [remote, setRemote] = useState(null);

    useEffect(() => {
        const source = resolveFileUrl(src);
        if (!isProtectedFileUrl(source)) return undefined;

        const release = retainAuthenticatedFile(source);
        if (peekAuthenticatedFile(source)) return release;

        let active = true;
        loadAuthenticatedFile(source).then((file) => {
            if (!active) return;
            setRemote({
                status: "ready",
                objectUrl: file.objectUrl,
                contentType: file.contentType,
                filename: file.filename,
                message: "",
                httpStatus: 200,
                code: "",
                source: file.url,
            });
        }).catch((error) => {
            if (!active) return;
            setRemote({
                status: "error",
                objectUrl: "",
                contentType: "",
                filename: "",
                message: error?.message || "Could not load this file.",
                httpStatus: error?.status || 0,
                code: error?.code || "network",
                source,
            });
        });

        return () => {
            active = false;
            release();
        };
    }, [src]);

    if (immediate.status !== "loading") return immediate;
    if (remote?.source === immediate.source) {
        if (remote.status === "error") return remote;
        if (remote.status === "ready" && peekAuthenticatedFile(immediate.source)) return remote;
    }
    return immediate;
}
