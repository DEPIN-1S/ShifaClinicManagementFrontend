import { isPdfSource } from "../utils/fileUrl.js";
import { useAuthenticatedFile } from "../hooks/useAuthenticatedFile.js";

export function AuthImage({ src, alt = "", className = "", fallbackSrc, onClick, ...rest }) {
    const file = useAuthenticatedFile(src);

    if (!src && fallbackSrc) {
        return <img src={fallbackSrc} alt={alt} className={className} onClick={onClick} {...rest} />;
    }
    if (!src) return null;

    if (file.status === "loading") {
        return <span className={`inline-block bg-slate-100 animate-pulse ${className}`} aria-busy="true" onClick={onClick} />;
    }

    if (file.status !== "ready" || !file.objectUrl) {
        if (fallbackSrc) {
            return <img src={fallbackSrc} alt={alt} className={className} onClick={onClick} {...rest} />;
        }
        return (
            <span
                className={`inline-flex items-center justify-center bg-slate-100 text-[10px] text-slate-400 ${className}`}
                role="img"
                aria-label={file.message || "File unavailable"}
                onClick={onClick}
            />
        );
    }

    return <img src={file.objectUrl} alt={alt} className={className} onClick={onClick} {...rest} />;
}

export function AuthenticatedMedia({
    src,
    fileName = "",
    fileType = "",
    alt = "Preview",
    title = "File preview",
    imageClassName = "max-w-full max-h-full object-contain",
    frameClassName = "w-full h-full bg-white border-0",
}) {
    const file = useAuthenticatedFile(src);

    if (!src || file.status === "loading") {
        return <p className="text-gray-400 text-sm">Loading file...</p>;
    }
    if (file.status !== "ready" || !file.objectUrl) {
        return <p className="text-sm text-red-500 px-4 text-center">{file.message || "Could not load this file."}</p>;
    }

    const pdf = isPdfSource({
        src,
        fileName,
        fileType,
        contentType: file.contentType,
    });

    if (pdf) {
        return <iframe src={file.objectUrl} className={frameClassName} title={title} />;
    }

    return <img src={file.objectUrl} alt={alt} className={imageClassName} />;
}

export default AuthImage;
