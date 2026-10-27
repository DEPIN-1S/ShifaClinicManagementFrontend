import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Check, X, RefreshCw, Wand2, Loader2, Crop } from 'lucide-react';




// ─── Simple rectangular crop with optional B&W ────────────────────────────────
function cropRect(canvas, corners, bw) {
  const { tl, tr, bl } = corners;
  const x = Math.round(tl.x);
  const y = Math.round(tl.y);
  const w = Math.round(tr.x - tl.x);
  const h = Math.round(bl.y  - tl.y);

  if (w < 4 || h < 4) return canvas.toDataURL('image/jpeg', 0.93);

  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

  if (bw && window.cv && window.cv.Mat) {
    const cv = window.cv;
    const mats = [];
    const own  = m => { mats.push(m); return m; };
    try {
      const mat  = own(cv.imread(out));
      const gray = own(new cv.Mat());
      const blurred = own(new cv.Mat());
      const dst  = own(new cv.Mat());
      
      // 1. Convert to Grayscale
      cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
      
      // 2. Reduce noise (grains) using Bilateral Filter
      // This preserves edges while smoothing flat areas
      cv.bilateralFilter(gray, blurred, 9, 75, 75);
      
      // 3. Adaptive Threshold with larger block size for smoother results
      cv.adaptiveThreshold(blurred, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 41, 15);
      
      cv.imshow(out, dst);
    } catch (e) {
      console.error('B&W filter error:', e);
    } finally {
      mats.forEach(m => { try { m.delete(); } catch (_) {} });
    }
  }

  return out.toDataURL('image/jpeg', 0.93);
}

// ─── Convert bounding data to 4 named corners ─────────────────────────────────
function rectToCorners(x, y, w, h) {
  return {
    tl: { x,     y     },
    tr: { x: x+w, y     },
    br: { x: x+w, y: y+h },
    bl: { x,     y: y+h },
  };
}

// ─── Draw overlay on canvas ───────────────────────────────────────────────────
function drawOverlay(ctx, corners, W, H, active) {
  const { tl, tr, br, bl } = corners;
  const r = Math.max(20, W * 0.022);
  const sx = tl.x, sy = tl.y, sw = tr.x - tl.x, sh = bl.y - tl.y;

  // Darken OUTSIDE the selection using evenodd fill rule (does NOT erase image pixels)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);          // outer rectangle (clockwise)
  ctx.rect(sx, sy, sw, sh);      // inner rectangle (clockwise = same winding = punch-out via evenodd)
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  ctx.fill('evenodd');            // fills only the area BETWEEN the two rects
  ctx.restore();

  // Border
  ctx.strokeStyle = '#2DD4BF';
  ctx.lineWidth = Math.max(3, W * 0.004);
  ctx.strokeRect(tl.x, tl.y, tr.x - tl.x, bl.y - tl.y);

  // Handles
  [['tl', tl], ['tr', tr], ['br', br], ['bl', bl]].forEach(([key, p]) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = active === key ? '#2DD4BF' : 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = Math.max(3, W * 0.003);
    ctx.stroke();

    // crosshair inside handle
    const s = r * 0.4;
    ctx.strokeStyle = active === key ? '#fff' : '#2DD4BF';
    ctx.lineWidth = Math.max(1.5, W * 0.0015);
    ctx.beginPath();
    ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y);
    ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s);
    ctx.stroke();
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
const CameraCapture = ({ onCapture, onCancel }) => {
  const webcamRef    = useRef(null);
  const overlayRef   = useRef(null);

  const [phase, setPhase]           = useState('camera');   // camera | refine | result
  const [cvReady, setCvReady]       = useState(false);
  const [srcCanvas, setSrcCanvas]   = useState(null);
  const [srcDataUrl, setSrcDataUrl] = useState(null);
  const [imgSize, setImgSize]       = useState({ w: 1, h: 1 });
  const [corners, setCorners]       = useState(null);
  const [dragging, setDragging]     = useState(null);
  const [resultUrl, setResultUrl]   = useState(null);
  const [bwMode, setBwMode]         = useState(false);
  const [processing, setProcessing] = useState(false);
  const [devices, setDevices]       = useState([]);
  const [camIdx, setCamIdx]         = useState(0);
  const [rotation, setRotation]     = useState(0); // 0, 90, 180, 270

  // Poll for OpenCV
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      if (window.cv && window.cv.Mat) { setCvReady(true); clearInterval(t); }
      if (n++ > 120) clearInterval(t);
    }, 300);
    return () => clearInterval(t);
  }, []);

  // Enumerate cameras
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(ds => setDevices(ds.filter(d => d.kind === 'videoinput')))
      .catch(() => {});
  }, []);

  // Redraw overlay when corners/dragging changes
  useEffect(() => {
    if (phase !== 'refine' || !overlayRef.current || !srcDataUrl || !corners) return;
    const canvas = overlayRef.current;
    const ctx    = canvas.getContext('2d');
    const img    = new Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      drawOverlay(ctx, corners, img.naturalWidth, img.naturalHeight, dragging);
    };
    img.src = srcDataUrl;
  }, [phase, srcDataUrl, corners, dragging]);

  // ── Capture ─────────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!webcamRef.current || processing) return;
    setProcessing(true);
    try {
      const video  = webcamRef.current.video;
      const canvas = document.createElement('canvas');

      if (video && video.readyState >= 2) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
      } else {
        const ss = webcamRef.current.getScreenshot();
        if (!ss) throw new Error('Screenshot failed');
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = ss; });
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
      }

      const W = canvas.width, H = canvas.height;
      setSrcCanvas(canvas);
      setSrcDataUrl(canvas.toDataURL('image/jpeg', 0.95));
      setImgSize({ w: W, h: H });

      const det = { x: W * 0.10, y: H * 0.10, w: W * 0.80, h: H * 0.80 };
      setCorners(rectToCorners(det.x, det.y, det.w, det.h));
      setPhase('refine');
    } catch (e) {
      console.error('Capture error:', e);
    } finally {
      setProcessing(false);
    }
  };

  // ── Crop ─────────────────────────────────────────────────────────────────────
  const handleCrop = () => {
    if (!srcCanvas || !corners || processing) return;
    setProcessing(true);
    setTimeout(() => {
      try {
        const url = cropRect(srcCanvas, corners, bwMode);
        setResultUrl(url);
        setRotation(0);
        setPhase('result');
      } catch (e) {
        console.error('Crop error:', e);
      } finally {
        setProcessing(false);
      }
    }, 50);
  };

  // ── Rotate 90° CW ────────────────────────────────────────────────────────────
  const handleRotate = () => {
    if (!resultUrl) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width  = img.height;
      c.height = img.width;
      const ctx = c.getContext('2d');
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      setResultUrl(c.toDataURL('image/jpeg', 0.93));
      setRotation(r => (r + 90) % 360);
    };
    img.src = resultUrl;
  };

  // ── Retake ────────────────────────────────────────────────────────────────────
  const handleRetake = () => {
    setSrcCanvas(null); setSrcDataUrl(null);
    setCorners(null); setResultUrl(null);
    setPhase('camera');
  };

  // ── Canvas pointer events (90-degree rectangle maintained) ───────────────────
  const clientXY = e => {
    const s = e.touches ? e.touches[0] : e;
    return { x: s.clientX, y: s.clientY };
  };

  const toCanvasXY = e => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const { x, y } = clientXY(e);
    return {
      x: Math.max(0, Math.min(canvas.width,  (x - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (y - rect.top)  * scaleY)),
    };
  };

  const hitRadius = () => {
    const canvas = overlayRef.current;
    if (!canvas) return 50;
    const rect = canvas.getBoundingClientRect();
    return Math.max(32, canvas.width * 0.05) * (canvas.width / rect.width);
  };

  const onDown = e => {
    if (!corners) return;
    const pos = toCanvasXY(e);
    const hr  = hitRadius();
    const hit = ['tl', 'tr', 'br', 'bl'].find(k =>
      Math.hypot(corners[k].x - pos.x, corners[k].y - pos.y) < hr
    );
    if (hit) { setDragging(hit); e.preventDefault && e.preventDefault(); }
  };

  const onMove = e => {
    if (!dragging || !corners) return;
    e.preventDefault && e.preventDefault();
    const { x, y } = toCanvasXY(e);

    // Enforce 90-degree rectangle: each corner controls its row/column
    setCorners(prev => {
      const p = { ...prev };
      if (dragging === 'tl') {
        p.tl = { x, y };
        p.bl = { x, y: p.bl.y };   // same column
        p.tr = { x: p.tr.x, y };   // same row
      } else if (dragging === 'tr') {
        p.tr = { x, y };
        p.br = { x, y: p.br.y };
        p.tl = { x: p.tl.x, y };
      } else if (dragging === 'br') {
        p.br = { x, y };
        p.tr = { x, y: p.tr.y };
        p.bl = { x: p.bl.x, y };
      } else if (dragging === 'bl') {
        p.bl = { x, y };
        p.tl = { x, y: p.tl.y };
        p.br = { x: p.br.x, y };
      }
      return p;
    });
  };

  const onUp = () => setDragging(null);

  // ── Render ────────────────────────────────────────────────────────────────────
  const ui = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000', display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* ── CAMERA PHASE ─────────────────────────────────────────────────────── */}
      {phase === 'camera' && (
        <>
          {/* Full-screen webcam */}
          <div style={{ position: 'absolute', inset: 0 }}>
            {!cvReady && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                <Loader2 size={40} color="#2DD4BF" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <p style={{ color: '#2DD4BF', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>Loading Scanner…</p>
              </div>
            )}
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                ...(devices[camIdx] ? { deviceId: devices[camIdx].deviceId } : {}),
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Corner guide */}
            {cvReady && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <CornerGuide />
              </div>
            )}
          </div>

          {/* Floating header */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
            <button onClick={onCancel} style={btnRound}>
              <X size={20} color="#fff" />
            </button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#2DD4BF', fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>📷 Document Scanner</p>
              {cvReady && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, margin: '2px 0 0', letterSpacing: '0.1em' }}>Place document in frame · press capture</p>}
            </div>
            <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {processing && <Loader2 size={20} color="#2DD4BF" style={{ animation: 'spin 1s linear infinite' }} />}
            </div>
          </div>

          {/* Floating bottom controls */}
          <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '16px 24px 28px', background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>
            <button onClick={onCancel} style={btnRound}>
              <X size={20} color="#fff" />
            </button>

            {/* Shutter */}
            <button
              onClick={handleCapture}
              disabled={!cvReady || processing}
              style={{ width: 78, height: 78, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.6)', opacity: (!cvReady || processing) ? 0.45 : 1, transition: 'transform 0.1s, opacity 0.2s' }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ width: 62, height: 62, borderRadius: '50%', border: '4px solid #2DD4BF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={24} color="#2DD4BF" />
                </div>
              </div>
            </button>

            {devices.length > 1 ? (
              <button onClick={() => setCamIdx(i => (i + 1) % devices.length)} style={btnRound}>
                <RefreshCw size={18} color="#fff" />
              </button>
            ) : <div style={{ width: 44 }} />}
          </div>
        </>
      )}

      {/* ── REFINE PHASE ──────────────────────────────────────────────────────── */}
      {phase === 'refine' && srcDataUrl && corners && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(0,0,0,0.9)', flexShrink: 0 }}>
            <button onClick={onCancel} style={btnRound}>
              <X size={20} color="#fff" />
            </button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#2DD4BF', fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>✏️ Adjust Crop</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: '2px 0 0', letterSpacing: '0.1em' }}>
                Drag corners to select document area
              </p>
            </div>
            <div style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {processing && <Loader2 size={20} color="#2DD4BF" style={{ animation: 'spin 1s linear infinite' }} />}
            </div>
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
            <canvas
              ref={overlayRef}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
              onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
            />
          </div>

          {/* Bottom bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 20px', background: 'rgba(0,0,0,0.9)', flexShrink: 0 }}>
            <button onClick={handleRetake} style={btnOutline}>
              <RotateCcw size={14} color="#fff" style={{ marginRight: 6 }} /> Retake
            </button>
            <button
              onClick={handleCrop}
              disabled={processing}
              style={{ ...btnPrimary, flex: 1, opacity: processing ? 0.6 : 1 }}
            >
              {processing
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <><Crop size={16} style={{ marginRight: 8 }} /> Crop Document</>
              }
            </button>
          </div>
        </>
      )}

      {/* ── RESULT PHASE ──────────────────────────────────────────────────────── */}
      {phase === 'result' && resultUrl && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(0,0,0,0.9)', flexShrink: 0 }}>
            <button onClick={onCancel} style={btnRound}>
              <X size={20} color="#fff" />
            </button>
            <p style={{ color: 'white', fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}> Review Capture</p>
            <div style={{ width: 44 }} />
          </div>

          {/* Preview */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <img
              src={resultUrl}
              alt="Scan result"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Bottom bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 20px', background: 'rgba(0,0,0,0.9)', flexShrink: 0 }}>
            <button
              onClick={() => {
                const next = !bwMode;
                setBwMode(next);
                // Re-apply crop with new filter, stay on result screen
                if (srcCanvas && corners) {
                  setProcessing(true);
                  setTimeout(() => {
                    try {
                      const url = cropRect(srcCanvas, corners, next);
                      setResultUrl(url);
                    } catch (e) {
                      console.error('B&W toggle error:', e);
                    } finally {
                      setProcessing(false);
                    }
                  }, 30);
                }
              }}
              style={btnOutline}
            >
              <Wand2 size={14} color="#fff" style={{ marginRight: 5 }} /> {bwMode ? 'Color' : 'B&W'}
            </button>
            <button onClick={handleRotate} style={btnOutline} title="Rotate 90°">
              <RefreshCw size={14} color="#fff" style={{ marginRight: 5 }} /> Rotate
            </button>
            <button onClick={() => setPhase('refine')} style={btnOutline}>
              <Crop size={14} color="#fff" style={{ marginRight: 5 }} /> Adjust
            </button>
            <button onClick={() => onCapture(resultUrl)} style={{ ...btnPrimary, flex: 1 }}>
              <Check size={16} style={{ marginRight: 8 }} /> Use Scan
            </button>
          </div>
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return createPortal(ui, document.body);
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const CornerGuide = () => {
  const c = '#2DD4BF', sz = 30, th = 3;
  const edge = (top, right, bottom, left) => ({
    position: 'absolute', width: sz, height: sz,
    ...(top    !== undefined && { top,    borderTop:    `${th}px solid ${c}`, borderLeft:  `${th}px solid ${c}` }),
    ...(right  !== undefined && { right,  borderTop:    `${th}px solid ${c}`, borderRight: `${th}px solid ${c}` }),
    ...(bottom !== undefined && { bottom, borderBottom:  `${th}px solid ${c}`, borderRight: `${th}px solid ${c}` }),
    ...(left   !== undefined && { left: 0, bottom, borderBottom: `${th}px solid ${c}`, borderLeft: `${th}px solid ${c}` }),
  });
  return (
    <div style={{ position: 'relative', width: '80%', height: '76%' }}>
      <div style={{ position: 'absolute', top: 0,    left: 0,    width: sz, height: sz, borderTop: `${th}px solid ${c}`, borderLeft:  `${th}px solid ${c}` }} />
      <div style={{ position: 'absolute', top: 0,    right: 0,   width: sz, height: sz, borderTop: `${th}px solid ${c}`, borderRight: `${th}px solid ${c}` }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0,   width: sz, height: sz, borderBottom: `${th}px solid ${c}`, borderRight: `${th}px solid ${c}` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0,    width: sz, height: sz, borderBottom: `${th}px solid ${c}`, borderLeft:  `${th}px solid ${c}` }} />
      <div style={{ position: 'absolute', inset: 0, border: '1px dashed rgba(45,212,191,0.25)', borderRadius: 6 }} />
    </div>
  );
};

// ─── Button styles ────────────────────────────────────────────────────────────
const btnRound = {
  width: 44, height: 44, borderRadius: '50%',
  background: 'rgba(255,255,255,0.12)', border: 'none',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

const btnOutline = {
  display: 'flex', alignItems: 'center', padding: '11px 14px',
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 12, cursor: 'pointer', color: '#fff',
  fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0,
};

const btnPrimary = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '13px 0', background: '#2DD4BF', color: '#0f172a',
  borderRadius: 14, border: 'none', cursor: 'pointer',
  fontWeight: 900, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
  boxShadow: '0 4px 20px rgba(45,212,191,0.35)',
};

export default CameraCapture;
