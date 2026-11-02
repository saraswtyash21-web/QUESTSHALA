import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, CameraOff, ImageUp, RotateCcw, ScanLine, Save, ShieldCheck } from "lucide-react";
import type { Note } from "./types";

type TextDetectorResult = { rawValue?: string };
type TextDetectorApi = { detect: (source: ImageBitmapSource) => Promise<TextDetectorResult[]> };
type WindowWithTextDetector = Window & { TextDetector?: new () => TextDetectorApi };

export function StudyScanner({ onSave }: { onSave: (note: Note) => Promise<void> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [photo, setPhoto] = useState("");
  const [title, setTitle] = useState("Scanned study page");
  const [subject, setSubject] = useState("General");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [detectingText, setDetectingText] = useState(false);
  const [ocrMessage, setOcrMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const navigate = useNavigate();

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }
  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser or page context cannot open a live camera. Use the Upload / mobile camera option instead, or open QuestShala over HTTPS or localhost.");
      return;
    }
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (error) {
      console.error("Could not open the study scanner camera.", error);
      const name = error instanceof DOMException ? error.name : "";
      setCameraError(name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in your browser settings, then try again." : name === "NotFoundError" ? "No camera was found. Upload a photo or use a phone camera instead." : "The camera could not start. Close other apps using it and try again.");
    }
  }

  async function recognizeText(source: HTMLCanvasElement | HTMLImageElement) {
    const TextDetector = (window as WindowWithTextDetector).TextDetector;
    if (!TextDetector) {
      setOcrMessage("Photo captured. Automatic text recognition is not available in this browser, so type your key notes below. The photo will still be saved with your note.");
      return;
    }
    setDetectingText(true);
    setOcrMessage("Looking for readable text in the page…");
    try {
      const detected = await new TextDetector().detect(source);
      const text = detected.map((item) => item.rawValue?.trim()).filter(Boolean).join("\n");
      if (text) {
        setNotes((current) => current.trim() ? `${current.trim()}\n\n${text}` : text);
        setOcrMessage(`Recognized ${detected.length} text segment${detected.length === 1 ? "" : "s"}. Review it before saving.`);
      } else setOcrMessage("No text could be read automatically. The page photo is ready; type your important notes below.");
    } catch (error) {
      console.warn("Browser text recognition did not complete.", error);
      setOcrMessage("Automatic text reading failed in this browser. The photo is safe to use; type or paste the key text below.");
    } finally { setDetectingText(false); }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("The camera is still starting. Wait until the live preview appears, then capture again.");
      return;
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1800 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) { setCameraError("This browser could not prepare the image. Try uploading a photo instead."); return; }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
    setPhoto(dataUrl);
    setCameraError("");
    stopCamera();
    await recognizeText(canvas);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setCameraError("Choose an image file to scan."); return; }
    if (file.size > 12 * 1024 * 1024) { setCameraError("This image is larger than 12 MB. Choose a smaller photo for smoother saving."); return; }
    setCameraError("");
    const reader = new FileReader();
    reader.onerror = () => setCameraError("This image could not be opened. Choose another file.");
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const image = new Image();
      image.onload = () => {
        // Re-encode uploaded phone photos before storing them in local notes or Supabase.
        // This prevents large camera images from exhausting browser storage.
        const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
        if (!longestSide) {
          setCameraError("This image has no readable dimensions. Choose another photo.");
          return;
        }
        const scale = Math.min(1, 1800 / longestSide);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          setCameraError("This browser could not prepare the image. Choose another photo.");
          return;
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.82));
        void recognizeText(canvas);
      };
      image.onerror = () => setCameraError("This image could not be decoded by the browser. Choose a JPG or PNG photo.");
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  async function saveNote() {
    if (!photo) { setCameraError("Capture a page or upload a photo before saving your scanned note."); return; }
    if (!title.trim()) { setSaveError("Give this scan a title so you can find it later."); return; }
    setSaving(true);
    setSaveError("");
    try {
      const note: Note = {
        id: crypto.randomUUID(), title: title.trim(), body: notes.trim() || "Scanned page attached. Add your summary or key points here.",
        subject, topic: topic.trim(), photo, updatedAt: new Date().toISOString(),
      };
      await onSave(note);
      navigate("/notes");
    } catch (error) {
      console.error("Could not save the scanned study note.", error);
      setSaveError("The scan could not be saved. Check your storage connection and try again.");
    } finally { setSaving(false); }
  }

  return <main className="study-scanner-page">
    <div className="page-title"><div><span className="eyebrow"><ScanLine size={14} /> CAMERA-POWERED STUDY TOOL</span><h1>Scan a page into your study notes.</h1><p>Capture a textbook, worksheet or handwritten page, add a title and save it directly to Notes.</p></div><Link className="btn outline" to="/notes">Open Notes</Link></div>
    <div className="scanner-layout">
      <section className="panel scanner-preview-panel"><div className="panel-head"><div><span className="eyebrow">LIVE SCAN</span><h2>{photo ? "Page captured" : cameraActive ? "Align the page in frame" : "Ready when you are"}</h2></div><span className={`scanner-status ${cameraActive ? "is-active" : photo ? "is-captured" : ""}`}><span /> {photo ? "Captured" : cameraActive ? "Camera on" : "Camera off"}</span></div>
        <div className={`scanner-viewport ${photo ? "has-photo" : ""}`}>
          {photo ? <img className="scanner-captured-image" src={photo} alt="Captured study page preview" /> : cameraActive ? <video ref={videoRef} playsInline muted autoPlay aria-label="Live camera preview" /> : <div className="scanner-placeholder"><span className="scanner-frame-icon"><ScanLine size={42} /></span><strong>Your page will appear here</strong><p>Place the page on a flat, well-lit surface and keep all corners visible.</p></div>}
          {!photo && cameraActive && <div className="scanner-corners" aria-hidden="true"><i /><i /><i /><i /></div>}
        </div>
        <div className="scanner-actions">{!cameraActive && !photo && <button className="btn violet" type="button" onClick={() => void startCamera()}><Camera size={17} /> Open camera</button>}{cameraActive && <><button className="btn violet" type="button" onClick={() => void capturePhoto()}><ScanLine size={17} /> Capture page</button><button className="btn outline" type="button" onClick={stopCamera}><CameraOff size={17} /> Turn camera off</button></>}{photo && <button className="btn outline" type="button" onClick={() => { setPhoto(""); setOcrMessage(""); setCameraError(""); void startCamera(); }}><RotateCcw size={17} /> Retake</button>}<button className="btn outline" type="button" onClick={() => fileRef.current?.click()}><ImageUp size={17} /> Upload / mobile camera</button><input ref={fileRef} type="file" accept="image/*" capture="environment" className="visually-hidden" onChange={(event) => void chooseFile(event)} /></div>
        {cameraError && <p className="error-message" role="alert">{cameraError}</p>}
        {ocrMessage && <p className="scanner-ocr-note" role="status">{detectingText ? "Recognizing text…" : ocrMessage}</p>}
      </section>
      <section className="panel scanner-note-panel"><span className="eyebrow">SAVE TO YOUR NOTEBOOK</span><h2>Give your scan context.</h2><label>Note title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="e.g. Physics — Ray optics notes" /></label><label>Subject<select value={subject} onChange={(event) => setSubject(event.target.value)}>{["General", "Mathematics", "Science", "Physics", "Chemistry", "Biology", "English", "Social Science", "Computer Science"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Topic / chapter<input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={100} placeholder="e.g. Reflection of light" /></label><label>Key points / recognized text<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} maxLength={12000} placeholder="Type the key points, or review text recognized by your browser…" /></label><div className="scanner-privacy"><ShieldCheck size={17} /><span><strong>Your camera is only used after you press Open camera.</strong><small>Capture stays on this page until you save it. Without a configured account, notes are stored in this browser.</small></span></div>{saveError && <p className="error-message" role="alert">{saveError}</p>}<button className="btn primary full" type="button" disabled={!photo || saving} onClick={() => void saveNote()}><Save size={17} /> {saving ? "Saving scanned note…" : "Save scan to Notes"}</button></section>
    </div>
  </main>;
}
