import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowRight,
  FileText,
  Mic,
  FileStack,
  Camera,
  Copy,
  Volume2,
  VolumeX,
  Star,
  Share2,
  History,
  Check,
  Upload,
  X,
  Download,
  FlipHorizontal,
  Image as ImageIcon,
} from "lucide-react";
import AppLayout from "./AppLayout";
import LanguagePicker, { getDefaultLanguages } from "./LanguagePicker";
import { DOC_FORMATS } from "../data/mockData";
import {
  translateText,
  translateVoice,
  translateDocument,
  translateImage,
  fetchLanguages,
  fetchBillingConfig,
  fetchBillingPlans,
  fetchHistory,
  toggleHistoryFavorite,
} from "../services/mockApi";
import { findLanguageByLabel, mapHistoryItem } from "../utils/historyUtils";
import UpgradeModal from "./UpgradeModal";
import {
  createSpeechRecognition,
  getSpeechRecognitionCtor,
  toSpeechRecognitionLang,
  speakText,
  stopSpeaking,
} from "../utils/speech";
import "./Translate.css";

const HOLD_LISTEN_MS = 280;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isAllowedImageFile(file) {
  if (!file) return false;
  if (ALLOWED_IMAGE_TYPES.has(file.type)) return true;
  return /\.(jpe?g|png|webp)$/i.test(file.name || "");
}

const MODES = [
  { id: "text", label: "Text", icon: FileText },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "document", label: "Document", icon: FileStack },
  { id: "camera", label: "Camera", icon: Camera },
];

function LanguageSelect(props) {
  return <LanguagePicker {...props} />;
}

function IconAction({ icon: Icon, label, onClick, active, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={disabled ? `${label} (unavailable)` : label}
      className={`icon-action ${active ? "is-active" : ""}${disabled ? " is-disabled" : ""}`}
    >
      <Icon size={18} />
    </button>
  );
}

export default function TranslateScreen() {
  const navigate = useNavigate();
  const [sourceLang, setSourceLang] = useState(null);
  const [targetLang, setTargetLang] = useState(null);
  const [autoDetectOption, setAutoDetectOption] = useState(null);
  const [detectLanguage, setDetectLanguage] = useState(false);
  const [detectedLabel, setDetectedLabel] = useState("");
  const [activeMode, setActiveMode] = useState("text");
  const [sourceText, setSourceText] = useState("");
  const [translation, setTranslation] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);
  const [languageCatalog, setLanguageCatalog] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [conversationMode, setConversationMode] = useState(false);
  const [conversationLog, setConversationLog] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [autoListenTick, setAutoListenTick] = useState(0);
  const conversationModeRef = useRef(false);
  const conversationEndRef = useRef(null);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [preserveFormat, setPreserveFormat] = useState(true);
  const [docFile, setDocFile] = useState(null);
  const [docResult, setDocResult] = useState(null);
  const [docPremiumError, setDocPremiumError] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [billingPlans, setBillingPlans] = useState([]);
  const [checkoutAvailable, setCheckoutAvailable] = useState(false);
  const [cameraSubMode, setCameraSubMode] = useState("instant");
  const [ocrResult, setOcrResult] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraFacing, setCameraFacing] = useState("environment");
  const maxChars = 5000;
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const wantListeningRef = useRef(false);
  const listenModeRef = useRef(null); // "tap" | "hold"
  const finalTranscriptRef = useRef("");
  const holdTimerRef = useRef(null);
  const skipClickRef = useRef(false);

  useEffect(() => {
    let active = true;
    fetchLanguages().then((catalog) => {
      if (!active) return;
      setLanguageCatalog(catalog);
      setAutoDetectOption(catalog.autoDetect);
      const defaults = getDefaultLanguages(catalog);
      setSourceLang(defaults.source);
      setTargetLang(defaults.target);
    });
    return () => {
      active = false;
    };
  }, []);

  const refreshRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const data = await fetchHistory();
      const mapped = (data.items || [])
        .slice(0, 3)
        .map((row) => mapHistoryItem(row, languageCatalog));
      setRecentItems(mapped);
    } catch {
      setRecentItems([]);
    } finally {
      setRecentLoading(false);
    }
  }, [languageCatalog]);

  useEffect(() => {
    if (!languageCatalog) return;
    refreshRecent();
  }, [languageCatalog, refreshRecent]);

  const applyHistoryFromItem = useCallback(
    (item) => {
      const mode = item.mode === "image" ? "camera" : item.mode;
      setActiveMode(mode);
      setCurrentHistoryId(item.id || null);
      setIsFavorited(Boolean(item.favorite));
      setDetectLanguage(false);
      setDetectedLabel("");
      setVoiceError("");
      setCameraError("");
      setDocPremiumError("");

      const src = findLanguageByLabel(item.sourceLangLabel, languageCatalog);
      const tgt = findLanguageByLabel(item.targetLangLabel, languageCatalog);
      if (src) setSourceLang(src);
      if (tgt) setTargetLang(tgt);

      if (mode === "text") {
        setSourceText(item.source);
        setTranslation(item.translation);
        setVoiceTranscript("");
        setOcrResult(null);
        setDocResult(null);
        setDocFile(null);
      } else if (mode === "voice") {
        setVoiceTranscript(item.source);
        setTranslation(item.translation);
        setSourceText("");
        setOcrResult(null);
        setDocResult(null);
      } else if (mode === "camera") {
        setOcrResult({ detected: item.source, translation: item.translation });
        setTranslation(item.translation);
        setSourceText("");
        setVoiceTranscript("");
        setImageFile(null);
        setImagePreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return "";
        });
        setDocResult(null);
      } else if (mode === "document") {
        setDocResult({ preview: item.translation, translation: item.translation });
        setTranslation("");
        setSourceText("");
        setVoiceTranscript("");
        setOcrResult(null);
        setDocFile(null);
      }
    },
    [languageCatalog]
  );

  const handleFavoriteToggle = useCallback(async () => {
    if (!currentHistoryId) return;
    const next = !isFavorited;
    setIsFavorited(next);
    try {
      await toggleHistoryFavorite(currentHistoryId, next);
      await refreshRecent();
    } catch {
      setIsFavorited(!next);
    }
  }, [currentHistoryId, isFavorited, refreshRecent]);

  useEffect(() => {
    Promise.all([fetchBillingConfig(), fetchBillingPlans()])
      .then(([config, plansData]) => {
        setCheckoutAvailable(Boolean(config.checkoutAvailable));
        setBillingPlans(plansData.plans || []);
      })
      .catch(() => setCheckoutAvailable(false));
  }, []);

  useEffect(() => {
    if (detectLanguage && autoDetectOption) {
      setSourceLang(autoDetectOption);
      return;
    }
    if (!detectLanguage && sourceLang?.detectOnly && autoDetectOption) {
      fetchLanguages().then((catalog) => {
        const defaults = getDefaultLanguages(catalog);
        setSourceLang(defaults.source);
      });
    }
  }, [detectLanguage, autoDetectOption, sourceLang?.detectOnly]);

  // Browser speech recognition needs a known language up front, so voice can't auto-detect.
  useEffect(() => {
    if (activeMode === "voice" && detectLanguage) setDetectLanguage(false);
  }, [activeMode, detectLanguage]);

  useEffect(() => {
    if (activeMode !== "camera") {
      setImageFile(null);
      setOcrResult(null);
      setCameraError("");
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    }
  }, [activeMode]);

  useEffect(() => {
    if (activeMode !== "camera" || imagePreviewUrl) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      return undefined;
    }

    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera not supported in this browser. Use Gallery upload.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraError("");
      } catch {
        setCameraError("Camera access denied or unavailable. Use Gallery upload.");
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [activeMode, cameraFacing, imagePreviewUrl]);

  const effectiveSourceLabel = detectLanguage
    ? "auto"
    : sourceLang?.label || "English";

  const handleSwapLanguages = () => {
    if (!sourceLang || !targetLang) return;
    // With "Detect language" on, swap using the language that was detected (if any).
    const newTarget = sourceLang.detectOnly
      ? findLanguageByLabel(detectedLabel, languageCatalog)
      : sourceLang;
    if (!newTarget) return;
    setSourceLang(targetLang);
    setTargetLang(newTarget);
    setSourceText(translation);
    setTranslation(sourceText);
    setDetectedLabel("");
    setDetectLanguage(false);
  };

  const stopRecognitionInstance = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (!rec) return;
    try {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const translateCapturedSpeech = useCallback(
    async (transcript) => {
      const text = String(transcript || "").trim();
      if (!text || !targetLang?.label || sourceLang?.detectOnly) return;
      setIsTranslating(true);
      setVoiceError("");
      try {
        const result = await translateVoice(
          null,
          targetLang.label,
          sourceLang.label,
          text
        );
        setVoiceTranscript(result.transcript || text);
        setTranslation(result.translation || "");
        setCurrentHistoryId(result.historyId || null);
        setIsFavorited(false);

        if (conversationModeRef.current && result.translation) {
          const from = sourceLang;
          const to = targetLang;
          setConversationLog((log) => [
            ...log,
            {
              id: `${Date.now()}-${log.length}`,
              from: from.label,
              to: to.label,
              said: result.transcript || text,
              translated: result.translation,
            },
          ]);
          // Next turn belongs to the other speaker: flip direction, speak the reply, listen again.
          setSourceLang(to);
          setTargetLang(from);
          let advanced = false;
          const next = () => {
            if (advanced) return;
            advanced = true;
            if (conversationModeRef.current) setAutoListenTick((t) => t + 1);
          };
          const spoke = speakText(result.translation, { langHint: to.label, onEnd: next });
          // Fallback in case the browser never fires onend (no voice for this language).
          setTimeout(next, spoke ? Math.min(20000, 3000 + result.translation.length * 150) : 0);
        }
        await refreshRecent();
      } catch (err) {
        setVoiceError(err?.message || "Unable to translate speech.");
      } finally {
        setIsTranslating(false);
      }
    },
    [targetLang, sourceLang, refreshRecent]
  );

  const startVoiceListening = useCallback(
    (mode) => {
      if (!getSpeechRecognitionCtor()) {
        setVoiceError("Speech recognition is not supported in this browser. Try Chrome.");
        return;
      }
      if (!sourceLang || sourceLang.detectOnly) {
        setVoiceError("Choose a source language before using voice.");
        return;
      }
      if (!targetLang?.label) {
        setVoiceError("Choose a target language before using voice.");
        return;
      }

      wantListeningRef.current = false;
      stopRecognitionInstance();

      finalTranscriptRef.current = "";
      listenModeRef.current = mode;
      wantListeningRef.current = true;
      setVoiceError("");
      setVoiceListening(true);
      setVoiceTranscript("");
      setTranslation("");

      const lang = toSpeechRecognitionLang(sourceLang.code, sourceLang.label);
      const continuous = mode === "hold";

      const recognition = createSpeechRecognition({
        lang,
        continuous,
        interimResults: true,
        onResult: ({ interim, finalChunk }) => {
          if (finalChunk) {
            finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalChunk}`.trim();
          }
          const display = `${finalTranscriptRef.current} ${interim}`.trim();
          setVoiceTranscript(display);
        },
        onError: (event) => {
          const code = event?.error;
          if (code === "not-allowed" || code === "service-not-allowed") {
            setVoiceError("Microphone permission denied. Allow mic access and try again.");
            wantListeningRef.current = false;
          } else if (code === "audio-capture") {
            setVoiceError("No microphone found.");
            wantListeningRef.current = false;
          } else if (code && code !== "aborted" && code !== "no-speech") {
            setVoiceError(`Speech recognition error: ${code}`);
          }
        },
        onEnd: () => {
          // Chrome ends sessions after pauses even with continuous=true.
          // Restart while the user is still holding the mic.
          if (wantListeningRef.current && listenModeRef.current === "hold") {
            try {
              recognition.start();
              return;
            } catch {
              /* fall through to finalize */
            }
          }

          wantListeningRef.current = false;
          listenModeRef.current = null;
          recognitionRef.current = null;
          setVoiceListening(false);

          const text = finalTranscriptRef.current.trim();
          if (text) translateCapturedSpeech(text);
        },
      });

      if (!recognition) {
        wantListeningRef.current = false;
        listenModeRef.current = null;
        setVoiceListening(false);
        setVoiceError("Speech recognition is not supported in this browser. Try Chrome.");
        return;
      }

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        wantListeningRef.current = false;
        listenModeRef.current = null;
        recognitionRef.current = null;
        setVoiceListening(false);
        setVoiceError(err?.message || "Unable to start listening.");
      }
    },
    [sourceLang, targetLang, stopRecognitionInstance, translateCapturedSpeech]
  );

  const stopVoiceListening = useCallback(() => {
    wantListeningRef.current = false;
    // recognition.onend finalizes transcript + translation
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        setVoiceListening(false);
        listenModeRef.current = null;
        const text = finalTranscriptRef.current.trim();
        if (text) translateCapturedSpeech(text);
      }
    } else {
      setVoiceListening(false);
      listenModeRef.current = null;
    }
  }, [translateCapturedSpeech]);

  useEffect(() => {
    conversationModeRef.current = conversationMode;
    if (!conversationMode) {
      stopSpeaking();
      setAutoListenTick(0);
    }
  }, [conversationMode]);

  // Stop any read-aloud when switching modes or leaving the page.
  useEffect(() => {
    stopSpeaking();
    setSpeaking(false);
    return () => stopSpeaking();
  }, [activeMode]);

  // Conversation mode: re-open the mic for the next speaker after each reply.
  useEffect(() => {
    if (!autoListenTick || !conversationModeRef.current || activeMode !== "voice") return;
    startVoiceListening("tap");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoListenTick]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [conversationLog]);

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      try {
        recognitionRef.current?.abort?.();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    };
  }, []);

  const handleMicPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      skipClickRef.current = true;
      startVoiceListening("hold");
    }, HOLD_LISTEN_MS);
  };

  const handleMicPointerUp = (e) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    try {
      if (e?.currentTarget?.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* noop */
    }
    if (listenModeRef.current === "hold") {
      skipClickRef.current = true;
      stopVoiceListening();
    }
  };

  const handleMicClick = () => {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    if (voiceListening && listenModeRef.current === "tap") {
      stopVoiceListening();
      return;
    }
    if (!voiceListening) startVoiceListening("tap");
  };

  const runImageTranslate = useCallback(
    async (file) => {
      if (!file || !targetLang?.label || sourceLang?.detectOnly) return;
      setIsTranslating(true);
      setCameraError("");
      setOcrResult(null);
      try {
        const result = await translateImage(file, targetLang.label, sourceLang.label);
        setOcrResult(result);
        setTranslation(result.translation || "");
        setCurrentHistoryId(result.historyId || null);
        setIsFavorited(false);
        await refreshRecent();
      } catch (err) {
        setCameraError(err?.message || "Unable to translate image.");
      } finally {
        setIsTranslating(false);
      }
    },
    [targetLang, sourceLang, refreshRecent]
  );

  const captureFromCamera = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.readyState < 2) {
      if (imageFile) {
        await runImageTranslate(imageFile);
        return;
      }
      setCameraError("Camera not ready. Use Gallery upload or allow camera access.");
      return;
    }
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      setCameraError("Capture failed.");
      return;
    }
    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
    setImageFile(file);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    await runImageTranslate(file);
  }, [imageFile, runImageTranslate]);

  const handleTranslate = useCallback(async () => {
    if (!targetLang?.label) return;
    if (activeMode === "text") {
    if (!sourceText.trim() || isTranslating) return;
    setIsTranslating(true);
    setCurrentHistoryId(null);
    setIsFavorited(false);
      try {
        const result = await translateText(sourceText, targetLang.label, effectiveSourceLabel, {
          autoDetect: detectLanguage,
        });
        setTranslation(result.translation || "");
        if (result.detectedSourceLang) {
          setDetectedLabel(result.detectedSourceLang);
        } else if (!detectLanguage) {
          setDetectedLabel("");
        }
        setCurrentHistoryId(result.historyId || null);
        await refreshRecent();
      } finally {
        setIsTranslating(false);
      }
    } else if (activeMode === "document") {
      if (!docFile || sourceLang?.detectOnly) return;
      setIsTranslating(true);
      setDocPremiumError("");
      setCurrentHistoryId(null);
      setIsFavorited(false);
      try {
        const result = await translateDocument(docFile, targetLang.label, sourceLang.label, {
          preserveFormat,
        });
        setDocResult(result);
        setCurrentHistoryId(result.historyId || null);
        await refreshRecent();
      } catch (err) {
        if (err?.code === "PREMIUM_REQUIRED" || err?.status === 403) {
          setDocPremiumError(err.message || "Document translation requires Premium.");
        } else {
          throw err;
        }
      } finally {
      setIsTranslating(false);
      }
    } else if (activeMode === "camera") {
      if (sourceLang?.detectOnly) return;
      if (imageFile) await runImageTranslate(imageFile);
      else await captureFromCamera();
    }
  }, [
    activeMode,
    sourceText,
    isTranslating,
    targetLang,
    sourceLang,
    docFile,
    detectLanguage,
    effectiveSourceLabel,
    preserveFormat,
    imageFile,
    imagePreviewUrl,
    runImageTranslate,
    captureFromCamera,
    refreshRecent,
  ]);

  const handleClear = () => {
    setSourceText("");
    setTranslation("");
    setVoiceTranscript("");
    setConversationLog([]);
    setCurrentHistoryId(null);
    setIsFavorited(false);
    textareaRef.current?.focus();
  };

  const favoriteDisabled = !currentHistoryId;

  const handleDocDownload = () => {
    if (!docResult) return;
    const base = String(docResult?.fileName || docFile?.name || "document")
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w\-]+/g, "_") || "document";

    if (docResult.download?.base64) {
      const mime = docResult.download.mimeType || "application/octet-stream";
      const name = docResult.download.fileName || `${base}_translated.bin`;
      const binary = atob(docResult.download.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    const text = String(docResult?.translation || docResult?.preview || "").trim();
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}_translated.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const activeOutputText = () => {
    if (activeMode === "document") {
      return String(docResult?.translation || docResult?.preview || "").trim();
    }
    return String(translation || "").trim();
  };

  const handleCopy = async () => {
    const text = activeOutputText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const text = activeOutputText();
    if (!text) return;
    const started = speakText(text, {
      langHint: targetLang?.label || "Igbo",
      onEnd: () => setSpeaking(false),
    });
    setSpeaking(started);
  };

  const handleShare = async () => {
    const text = activeOutputText();
    if (!text) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Omummu translation",
          text,
        });
      } catch { /* noop */ }
    } else {
      handleCopy();
    }
  };

  const onImageSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAllowedImageFile(file)) {
      setCameraError("Unsupported format. Use JPG, PNG, JPEG, or WEBP.");
      return;
    }
    setImageFile(file);
    setOcrResult(null);
    setCameraError("");
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setOcrResult(null);
    setTranslation("");
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  };

  const onDocSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setDocResult(null);
  };

  const primaryCtaLabel = {
    text: isTranslating ? "Translating…" : "Translate",
    voice: isTranslating ? "Listening…" : "Start listening",
    document: isTranslating
      ? "Translating…"
      : docResult
        ? `Download ${(
            docResult.download?.fileName?.split(".").pop() ||
            docResult.format ||
            "file"
          ).toUpperCase()}`
        : "Translate Document",
    camera: isTranslating ? "Processing…" : "Capture & Translate",
  }[activeMode];

  const ctaDisabled =
    isTranslating ||
    !targetLang ||
    (activeMode === "text" && !sourceText.trim()) ||
    (activeMode === "document" && !docFile && !docResult);

  return (
    <AppLayout>
      <div className="translate-page page-container">
      <div className="translate-header">
        <h1>Translate with precision</h1>
        <p>
            100+ languages including Igbo, Yoruba, Hausa, and Swahili. Powered by
            high-fidelity linguistic AI models.
        </p>
      </div>

      <div className="translate-card">
        <div className="translate-toolbar">
          <div className="lang-row">
              <LanguageSelect
                language={sourceLang}
                onChange={(lang) => {
                  setSourceLang(lang);
                  setDetectedLabel("");
                  setDetectLanguage(Boolean(lang.detectOnly));
                }}
                allowAutoDetect
                autoDetectOption={autoDetectOption}
                ariaLabel="Source language"
              />
            <button
              type="button"
              className="swap-btn"
              aria-label="Swap languages"
              onClick={handleSwapLanguages}
                disabled={!sourceLang || !targetLang || (sourceLang.detectOnly && !detectedLabel)}
                title={sourceLang?.detectOnly && !detectedLabel ? "Translate some text first so the language can be detected" : "Swap languages"}
            >
              <ArrowLeftRight size={18} />
            </button>
              <LanguageSelect
                language={targetLang}
                onChange={setTargetLang}
                ariaLabel="Target language"
              />
          </div>
          <label className="detect-toggle">
            Detect language
            <button
              type="button"
              role="switch"
              aria-checked={detectLanguage}
              onClick={() => setDetectLanguage((v) => !v)}
              disabled={activeMode === "voice"}
              title={activeMode === "voice" ? "Voice needs a specific source language" : undefined}
              style={activeMode === "voice" ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              className={`switch ${detectLanguage ? "is-on" : ""}`}
            >
              <span className="switch-thumb" />
            </button>
          </label>
            {detectedLabel && (
              <p className="detected-lang-hint">Detected: {detectedLabel}</p>
            )}
        </div>

          {activeMode === "voice" && (
            <div className="mode-extra-row">
              <span className="mode-extra-label">Conversation mode</span>
              <button
                type="button"
                role="switch"
                aria-checked={conversationMode}
                className={`switch ${conversationMode ? "is-on" : ""}`}
                onClick={() => setConversationMode((v) => !v)}
              >
                <span className="switch-thumb" />
              </button>
              <span className="mode-extra-hint">Speak back and forth in real time</span>
            </div>
          )}

          {activeMode === "document" && (
            <div className="mode-extra-row">
              <span className="mode-extra-label">Structure-aware DOCX export</span>
              <button
                type="button"
                role="switch"
                aria-checked={preserveFormat}
                className={`switch ${preserveFormat ? "is-on" : ""}`}
                onClick={() => setPreserveFormat((v) => !v)}
                title="DOCX keeps paragraph structure when possible. PDF is always a text rebuild."
              >
                <span className="switch-thumb" />
              </button>
              <span className="mode-extra-hint">
                DOCX: keep paragraph/run structure when possible. PDF: text rebuild only (layout not preserved).
              </span>
            </div>
          )}

          {activeMode === "camera" && (
            <div className="camera-subtabs">
              {["instant", "scan", "import"].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`camera-subtab ${cameraSubMode === m ? "is-active" : ""}`}
                  onClick={() => setCameraSubMode(m)}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
              <span className="mode-extra-hint">Point your camera or upload a photo with text</span>
            </div>
          )}

        <div className="translate-panes">
            {/* TEXT MODE */}
            {activeMode === "text" && (
              <>
          <div className="pane">
            <span className="pane-label">SOURCE</span>
            <textarea
              ref={textareaRef}
              value={sourceText}
              maxLength={maxChars}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Type or paste text here..."
              className="pane-textarea"
            />
            <div className="pane-footer">
                    <span className="char-count">{sourceText.length} / {maxChars}</span>
                    <button type="button" className="clear-link" onClick={handleClear}>Clear text</button>
            </div>
          </div>
          <div className="pane pane-translation">
            <span className="pane-label">TRANSLATION</span>
            <div className="translation-output">
              {isTranslating ? (
                <span className="placeholder">Translating…</span>
              ) : translation ? (
                <p>{translation}</p>
              ) : (
                      <span className="placeholder italic">Translation will appear here...</span>
                    )}
                  </div>
                  <div className="pane-footer pane-footer-actions">
                    <IconAction icon={copied ? Check : Copy} label="Copy" onClick={handleCopy} active={copied} />
                    <IconAction icon={speaking ? VolumeX : Volume2} label={speaking ? "Stop" : "Listen"} onClick={handleSpeak} active={speaking} />
                    <IconAction icon={Star} label="Favorite" onClick={handleFavoriteToggle} active={isFavorited} disabled={favoriteDisabled} />
                    <IconAction icon={Share2} label="Share" onClick={handleShare} />
                  </div>
                </div>
              </>
            )}

            {/* VOICE MODE */}
            {activeMode === "voice" && (
              <>
                <div className="pane voice-pane">
                  <span className="pane-label">SOURCE</span>
                  <div className="voice-hero">
                    <div className={`voice-wave ${voiceListening ? "is-active" : ""}`}>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span key={i} style={{ animationDelay: `${i * 0.05}s` }} />
                      ))}
                    </div>
                    <button
                      type="button"
                      className={`mic-btn ${voiceListening ? "is-listening" : ""}`}
                      onClick={handleMicClick}
                      onPointerDown={handleMicPointerDown}
                      onPointerUp={handleMicPointerUp}
                      onPointerCancel={handleMicPointerUp}
                      aria-label="Tap to speak, hold for continuous listening"
                    >
                      <Mic size={32} />
                    </button>
                    <p className="mic-label">
                      {conversationMode ? `Speak ${sourceLang.label}` : "Tap to Speak"}
                    </p>
                    <p className="mic-hint">
                      {conversationMode
                        ? "After each reply the languages swap and the mic listens again"
                        : "Hold for continuous listening"}
                    </p>
                    {voiceError ? (
                      <p className="mic-hint" style={{ color: "#b91c1c" }}>{voiceError}</p>
                    ) : null}
                  </div>
                  <div className="voice-transcript-card">
                    <span className="pane-label">YOU SAID · {sourceLang.label.toUpperCase()}</span>
                    <p className={voiceTranscript ? "" : "placeholder italic"}>
                      {voiceTranscript || "Your speech transcript will appear here..."}
                    </p>
                  </div>
                  <div className="pane-footer">
                    <button type="button" className="clear-link" onClick={handleClear}>Clear</button>
                    <span className="char-count">{voiceListening ? "Listening…" : "0:00"}</span>
                  </div>
                </div>
                <div className="pane pane-translation">
                  <span className="pane-label">TRANSLATION</span>
                  <div className="translation-output">
                    {conversationMode ? (
                      conversationLog.length ? (
                        <div className="conversation-log">
                          {conversationLog.map((m) => (
                            <div key={m.id} className="conv-turn">
                              <span className="conv-lang">{m.from} → {m.to}</span>
                              <p className="conv-said">{m.said}</p>
                              <p className="conv-translated">{m.translated}</p>
                            </div>
                          ))}
                          <div ref={conversationEndRef} />
                        </div>
                      ) : (
                        <span className="placeholder italic">The conversation will appear here...</span>
                      )
                    ) : translation ? (
                      <p>{translation}</p>
                    ) : (
                      <span className="placeholder italic">Spoken translation will appear here...</span>
                    )}
                  </div>
                  <div className="pane-footer pane-footer-actions">
                    <IconAction icon={copied ? Check : Copy} label="Copy" onClick={handleCopy} active={copied} />
                    <IconAction icon={speaking ? VolumeX : Volume2} label={speaking ? "Stop" : "Listen"} onClick={handleSpeak} active={speaking} />
                    <IconAction icon={Star} label="Favorite" onClick={handleFavoriteToggle} active={isFavorited} disabled={favoriteDisabled} />
                    <IconAction icon={Share2} label="Share" onClick={handleShare} />
                  </div>
                </div>
              </>
            )}

            {/* DOCUMENT MODE */}
            {activeMode === "document" && (
              <>
                {docPremiumError && (
                  <div className="translate-premium-notice">
                    <p>{docPremiumError}</p>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setUpgradeOpen(true)}>
                      Upgrade to Premium
                    </button>
                  </div>
                )}
                <div className="pane">
                  <span className="pane-label">SOURCE DOCUMENT</span>
                  <button
                    type="button"
                    className="upload-zone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="upload-icon-circle"><Upload size={24} /></span>
                    <strong>Upload your document</strong>
                    <span className="placeholder">Drag and drop or click to browse</span>
                    <span className="btn btn-outline upload-choose">Choose File</span>
                    <span className="mic-hint">Max file size 25 MB</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.pptx,.xls,.xlsx,.txt"
                    onChange={onDocSelect}
                  />
                  <div className="format-row">
                    <span className="pane-label">SUPPORTED FORMATS</span>
                    <div className="format-chips">
                      {DOC_FORMATS.map((f) => {
                        const id = typeof f === "string" ? f : f.id;
                        const supported = typeof f === "string" ? ["PDF", "DOCX", "TXT"].includes(f) : f.supported;
                        const note = typeof f === "object" ? f.note : null;
                        return (
                          <span
                            key={id}
                            className={`format-chip${supported ? "" : " is-unsupported"}`}
                            title={
                              supported
                                ? note || "Supported"
                                : note || "Not supported — upload PPTX instead"
                            }
                          >
                            {id}
                            {supported ? "" : " · unsupported"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {docFile && (
                    <div className="file-card">
                      <div className="file-card__icon">
                        {(docFile.name.split(".").pop() || "DOC").toUpperCase().slice(0, 4)}
                      </div>
                      <div className="file-card__meta">
                        <strong>{docFile.name}</strong>
                        <span>{(docFile.size / 1024 / 1024).toFixed(1)} MB · Uploaded just now</span>
                        {docResult && <span className="file-card__done">Translation complete</span>}
                      </div>
                      <button type="button" className="icon-action" aria-label="Remove" onClick={() => { setDocFile(null); setDocResult(null); }}>
                        <X size={18} />
                      </button>
                      <div className={`file-progress ${docResult ? "is-done" : ""}`} />
                    </div>
                  )}
                </div>
                <div className="pane pane-translation">
                  <span className="pane-label">
                    TRANSLATED DOCUMENT <span className="badge-pill">{targetLang.label}</span>
                  </span>
                  <div className="doc-preview">
                    {docResult ? (
                      <>
                        <p>{docResult.translation || docResult.preview}</p>
                        <span className="mic-hint">
                          {docResult.formattingNote ||
                            (docResult.formattingPreserved
                              ? "DOCX structure preserved where possible"
                              : "Text preview — original layout is not rebuilt")}
                </span>
                      </>
                    ) : (
                      <span className="placeholder italic">Translated document preview will appear here...</span>
              )}
            </div>
            <div className="pane-footer pane-footer-actions">
                    <IconAction icon={Download} label="Download" onClick={handleDocDownload} />
                    <IconAction icon={Share2} label="Share" onClick={handleShare} />
                    <IconAction icon={Star} label="Save" onClick={handleFavoriteToggle} active={isFavorited} disabled={favoriteDisabled} />
                    <IconAction icon={History} label="History" onClick={() => navigate("/history")} />
                    <IconAction icon={speaking ? VolumeX : Volume2} label={speaking ? "Stop" : "Listen"} onClick={handleSpeak} active={speaking} />
                  </div>
                </div>
              </>
            )}

            {/* CAMERA MODE */}
            {activeMode === "camera" && (
              <>
                <div className="pane">
                  <span className="pane-label">CAMERA · IMAGE</span>
                  <div className="camera-preview">
                    <div className="scan-frame" />
                    {imagePreviewUrl ? (
                      <img src={imagePreviewUrl} alt="Selected for OCR" className="camera-still" />
                    ) : (
                      <video ref={videoRef} className="camera-video" playsInline muted />
                    )}
                    <p className="camera-caption">
                      {imagePreviewUrl ? "Image ready — tap Capture & Translate" : "Point camera at text"}
                    </p>
                    {imagePreviewUrl && (
                      <button type="button" className="camera-clear" onClick={clearImageSelection} aria-label="Clear image">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {cameraError && <p className="camera-error">{cameraError}</p>}
                  <div className="camera-controls">
                    <button type="button" className="btn btn-outline" onClick={() => imageInputRef.current?.click()}>
                      <ImageIcon size={16} /> Gallery
                    </button>
                    <button type="button" className="capture-btn" onClick={captureFromCamera} aria-label="Capture">
                      <Camera size={22} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        clearImageSelection();
                        setCameraFacing((f) => (f === "environment" ? "user" : "environment"));
                      }}
                    >
                      <FlipHorizontal size={16} /> Flip
                    </button>
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={onImageSelect}
                  />
                  <canvas ref={canvasRef} hidden />
                  <p className="mic-hint" style={{ textAlign: "center" }}>
                    Or upload JPG, PNG, JPEG, WEBP
                  </p>
                </div>
                <div className="pane pane-translation">
                  <span className="pane-label">
                    TRANSLATION <span className="badge-pill">{targetLang.label}</span>
                  </span>
                  <div className="ocr-result">
                    {ocrResult ? (
                      <>
                        <div className="ocr-block">
                          <span className="pane-label">DETECTED · {effectiveSourceLabel.toUpperCase()}</span>
                          <p>{ocrResult.detected}</p>
                        </div>
                        <div className="ocr-block">
                          <span className="pane-label" style={{ color: "var(--accent)" }}>{targetLang.label.toUpperCase()}</span>
                          <p className="ocr-translated">{ocrResult.translation}</p>
                        </div>
                        {ocrResult.extras?.map((ex) => (
                          <div key={ex.detected} className="ocr-block compact">
                            <span>{ex.detected} → {ex.translation}</span>
                          </div>
                        ))}
                        {ocrResult.stub && (
                          <p className="ocr-stub-note">OCR ran in stub mode (Google Vision API key not configured).</p>
                        )}
                      </>
                    ) : (
                      <span className="placeholder italic">OCR translation will appear here...</span>
                    )}
                  </div>
                  <div className="pane-footer pane-footer-actions">
                    <IconAction icon={copied ? Check : Copy} label="Copy" onClick={handleCopy} active={copied} />
              <IconAction icon={speaking ? VolumeX : Volume2} label={speaking ? "Stop" : "Listen"} onClick={handleSpeak} active={speaking} />
                    <IconAction icon={Star} label="Save" onClick={handleFavoriteToggle} active={isFavorited} disabled={favoriteDisabled} />
              <IconAction icon={Share2} label="Share" onClick={handleShare} />
                    <IconAction icon={Download} label="Download" onClick={() => {}} />
                  </div>
            </div>
              </>
            )}
        </div>

        <div className="translate-actions">
          <div className="mode-tabs">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveMode(mode.id)}
                    className={`mode-tab ${activeMode === mode.id ? "is-active" : ""}`}
                >
                  <Icon size={16} />
                  {mode.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
              onClick={() => {
                if (activeMode === "voice") handleMicClick();
                else if (activeMode === "document" && docResult) handleDocDownload();
                else if (activeMode === "camera") captureFromCamera();
                else handleTranslate();
              }}
              disabled={ctaDisabled}
            className="translate-btn"
          >
              {primaryCtaLabel}
          </button>
        </div>
      </div>

      <Link to="/assistant" className="assistant-banner">
        <span className="assistant-banner__text">
          Not sure about the meaning? <strong>Ask the AI Assistant</strong>
        </span>
        <ArrowRight size={16} />
      </Link>

      <div className="recent-card">
        <div className="recent-header">
          <span>Recent</span>
            <Link to="/history" className="view-all">View all</Link>
        </div>
        <ul className="recent-list">
            {recentLoading ? (
              <li>
                <span className="recent-meta">Loading recent translations…</span>
              </li>
            ) : recentItems.length === 0 ? (
              <li>
                <span className="recent-meta">No recent translations yet</span>
              </li>
            ) : (
              recentItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="recent-item"
                onClick={() => applyHistoryFromItem(item)}
              >
                <History size={18} className="recent-icon" />
                <span>
                  <span className="recent-text">{item.source}</span>
                    <span className="recent-meta">{item.from} → {item.to} · {item.mode}</span>
                </span>
              </button>
            </li>
              ))
            )}
        </ul>
      </div>
    </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        plans={billingPlans}
        checkoutAvailable={checkoutAvailable}
      />
    </AppLayout>
  );
}
