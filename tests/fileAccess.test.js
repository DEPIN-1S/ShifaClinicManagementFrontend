import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
    clearAuthenticatedFileCache,
    FileRequestError,
    loadAuthenticatedFile,
    releaseIdleEntries,
    retainAuthenticatedFile,
    setUnauthorizedHandler,
} from "../src/utils/authenticatedFile.js";
import {
    filenameFromContentDisposition,
    isProtectedFileUrl,
    resolveFileUrl,
} from "../src/utils/fileUrl.js";

const API = "https://api-new.shifclkmr.in";

function jsonResponse(status, body, headers = {}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: new Headers(headers),
        blob: async () => new Blob([body], { type: headers["content-type"] || "application/octet-stream" }),
    };
}

afterEach(() => {
    clearAuthenticatedFileCache();
    setUnauthorizedHandler(null);
    delete globalThis.fetch;
    globalThis.sessionStorage?.clear?.();
});

describe("file URL resolution", () => {
    it("points relative clinic files at the configured API and strips query tokens", () => {
        const resolved = resolveFileUrl(`${API}/uploads/Uploads/note.pdf?token=secret&download=1`);
        assert.equal(resolved, `${API}/uploads/Uploads/note.pdf`);
        assert.equal(resolved.includes("token"), false);
    });

    it("rewrites historical AWS and legacy hosts onto the current API", () => {
        assert.equal(
            resolveFileUrl("https://shifaclinicaws.shifclkmr.in/images/features/Patient/face.jpg"),
            `${API}/images/features/Patient/face.jpg`
        );
        assert.equal(
            resolveFileUrl("https://lunarsenterprises.com:6041/documents/patients/lab.pdf"),
            `${API}/documents/patients/lab.pdf`
        );
    });

    it("leaves local previews and unrelated public assets unauthenticated", () => {
        assert.equal(resolveFileUrl("blob:http://localhost/preview"), "blob:http://localhost/preview");
        assert.equal(resolveFileUrl("data:image/png;base64,abc"), "data:image/png;base64,abc");
        assert.equal(isProtectedFileUrl("/assets/logo.png"), false);
        assert.equal(isProtectedFileUrl(`${API}/images/features/User/staff.png`), true);
        assert.equal(isProtectedFileUrl(`${API}/images/logo.png`), false);
    });

    it("reads the filename from Content-Disposition", () => {
        assert.equal(
            filenameFromContentDisposition('inline; filename="visit-note.pdf"'),
            "visit-note.pdf"
        );
    });
});

describe("authenticated file loading", () => {
    it("sends the bearer token once and reuses the cached file", async () => {
        globalThis.sessionStorage = memoryStorage({ token: "staff-token" });
        let calls = 0;
        globalThis.fetch = async (url, options) => {
            calls += 1;
            assert.equal(url, `${API}/uploads/Uploads/note.pdf`);
            assert.equal(options.headers.Authorization, "Bearer staff-token");
            assert.equal(String(url).includes("staff-token"), false);
            return jsonResponse(200, "pdf-bytes", {
                "content-type": "application/pdf",
                "content-disposition": 'inline; filename="note.pdf"',
            });
        };

        const first = await loadAuthenticatedFile("/uploads/Uploads/note.pdf");
        const second = await loadAuthenticatedFile(`${API}/uploads/Uploads/note.pdf?token=nope`);
        assert.equal(calls, 1);
        assert.equal(first, second);
        assert.equal(first.filename, "note.pdf");
        assert.equal(first.contentType, "application/pdf");
        assert.equal(first.objectUrl.startsWith("blob:"), true);
    });

    it("shares one request between overlapping loads", async () => {
        globalThis.sessionStorage = memoryStorage({ token: "staff-token" });
        let calls = 0;
        globalThis.fetch = async () => {
            calls += 1;
            await new Promise((resolve) => setTimeout(resolve, 20));
            return jsonResponse(200, "image", { "content-type": "image/jpeg" });
        };

        const [a, b] = await Promise.all([
            loadAuthenticatedFile("/images/features/Patient/face.jpg"),
            loadAuthenticatedFile("/images/features/Patient/face.jpg"),
        ]);
        assert.equal(calls, 1);
        assert.equal(a.objectUrl, b.objectUrl);
    });

    it("treats 401 as session expiry and keeps 403 as permission denied", async () => {
        globalThis.sessionStorage = memoryStorage({ token: "staff-token" });
        let expired = 0;
        setUnauthorizedHandler(() => {
            expired += 1;
        });

        globalThis.fetch = async () => jsonResponse(401, "no");
        await assert.rejects(
            () => loadAuthenticatedFile("/documents/patients/file.pdf"),
            (error) => error instanceof FileRequestError && error.status === 401
        );
        assert.equal(expired, 1);

        globalThis.fetch = async () => jsonResponse(403, "no");
        await assert.rejects(
            () => loadAuthenticatedFile("/documents/patients/file.pdf"),
            (error) => error instanceof FileRequestError && error.code === "forbidden"
        );
        assert.equal(expired, 1);
    });

    it("reports missing files and network failures without caching them", async () => {
        globalThis.sessionStorage = memoryStorage({ token: "staff-token" });
        globalThis.fetch = async () => jsonResponse(404, "missing");
        await assert.rejects(
            () => loadAuthenticatedFile("/uploads/LabResults/missing.png"),
            (error) => error.status === 404
        );

        globalThis.fetch = async () => {
            throw new TypeError("Failed to fetch");
        };
        await assert.rejects(
            () => loadAuthenticatedFile("/uploads/LabResults/missing.png"),
            (error) => error.code === "network" && !String(error.message).includes("LabResults")
        );
    });

    it("revokes object URLs after the last viewer releases them", async () => {
        globalThis.sessionStorage = memoryStorage({ token: "staff-token" });
        const revoked = [];
        const originalRevoke = URL.revokeObjectURL;
        URL.revokeObjectURL = (url) => {
            revoked.push(url);
            return originalRevoke.call(URL, url);
        };
        globalThis.fetch = async () => jsonResponse(200, "image", { "content-type": "image/png" });

        try {
            const release = retainAuthenticatedFile("/images/features/Patient/face.jpg");
            const file = await loadAuthenticatedFile("/images/features/Patient/face.jpg");
            release();
            releaseIdleEntries(Date.now() + 120_000);
            assert.deepEqual(revoked, [file.objectUrl]);
        } finally {
            URL.revokeObjectURL = originalRevoke;
        }
    });
});

function memoryStorage(initial) {
    const values = new Map(Object.entries(initial));
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
        clear: () => values.clear(),
    };
}
