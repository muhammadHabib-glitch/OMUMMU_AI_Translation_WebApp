import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Volume2, RotateCcw } from "lucide-react";
import AppLayout from "../AppLayout";
import {
  fetchSpeakingPhrases,
  fetchSpeakingSession,
  startSpeakingSession,
  submitSpeakingAttempt,
} from "../../services/mockApi";
import {
  createSpeechRecognition,
  getSpeechRecognitionCtor,
  speakText,
  stopSpeaking,
  toSpeechRecognitionLang,
} from "../../utils/speech";
import "./Practice.css";

const PHASE = {
  IDLE: "idle",
  LISTENING: "listening",
  PROCESSING: "processing",
};

function scoreTone(score) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "pass";
  return "retry";
}

export default function Speaking() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phrases, setPhrases] = useState([]);
  const [passThreshold, setPassThreshold] = useState(70);
  const [session, setSession] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [micSupported, setMicSupported] = useState(true);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const loadPhrases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSpeakingPhrases("Igbo");
      setPhrases(data.phrases || []);
      setPassThreshold(data.passScoreThreshold ?? 70);
    } catch (err) {
      setError(err?.message || "Unable to load practice phrases.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSession = useCallback(async (id) => {
    setLoading(true);
    setError("");
    setLastResult(null);
    try {
      const data = await fetchSpeakingSession(id);
      setSession(data.session);
      setAttempts(data.attempts || []);
    } catch (err) {
      setError(err?.message || "Unable to load practice session.");
      setSession(null);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasRecognition = Boolean(getSpeechRecognitionCtor());
    const hasMedia = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
    setMicSupported(hasRecognition || hasMedia);
    if (sessionId) loadSession(sessionId);
    else loadPhrases();
  }, [sessionId, loadPhrases, loadSession]);

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }

  async function handlePickPhrase(phrase) {
    setError("");
    setLoading(true);
    try {
      const data = await startSpeakingSession({
        language: "Igbo",
        phraseText: phrase.text,
        phraseMeaning: phrase.meaning,
        phoneticHint: phrase.phonetic,
      });
      navigate(`/learn/speaking?sessionId=${data.session.id}`);
    } catch (err) {
      setError(err?.message || "Unable to start practice.");
      setLoading(false);
    }
  }

  function handleListen() {
    if (!session?.phraseText) return;
    speakText(session.phraseText, { langHint: "igbo" });
  }

  async function startMic() {
    if (!session || phase !== PHASE.IDLE || session.passed) return;
    if (!micSupported) {
      setError("Microphone or speech recognition is not available in this browser.");
      return;
    }

    setError("");
    setLiveTranscript("");
    setLastResult(null);
    finalTranscriptRef.current = "";
    audioChunksRef.current = [];
    setPhase(PHASE.LISTENING);

    const lang = toSpeechRecognitionLang("ig", session.language || "Igbo");
    const recognition = createSpeechRecognition({
      lang,
      continuous: true,
      interimResults: true,
      onResult: ({ interim, finalChunk }) => {
        if (finalChunk) finalTranscriptRef.current += finalChunk;
        setLiveTranscript((finalTranscriptRef.current + interim).trim());
      },
      onError: (event) => {
        if (event.error !== "aborted" && event.error !== "no-speech") {
          setError(`Microphone error: ${event.error}`);
        }
      },
    });
    recognitionRef.current = recognition;

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data?.size) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
        };
        recorder.start();
      }
    } catch (err) {
      setPhase(PHASE.IDLE);
      setError(err?.message || "Microphone permission denied.");
      return;
    }

    try {
      recognition?.start();
    } catch {
      /* some browsers lack recognition */
    }
  }

  async function stopMicAndSubmit() {
    if (phase !== PHASE.LISTENING || !sessionId) return;
    setPhase(PHASE.PROCESSING);
    stopListening();

    const browserTranscript = (finalTranscriptRef.current || liveTranscript).trim();
    let audioBlob = null;
    if (audioChunksRef.current.length) {
      audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    }

    if (!browserTranscript && !audioBlob) {
      setPhase(PHASE.IDLE);
      setError("No speech captured. Try again and speak clearly.");
      return;
    }

    try {
      const data = await submitSpeakingAttempt(sessionId, {
        browserTranscript,
        audioBlob,
      });
      setSession(data.session);
      setLastResult(data);
      setAttempts((prev) => [...prev, data.attempt]);
    } catch (err) {
      setError(err?.message || "Unable to evaluate pronunciation.");
    } finally {
      setPhase(PHASE.IDLE);
    }
  }

  function handleRetry() {
    setLastResult(null);
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    setError("");
  }

  function handleNewPhrase() {
    navigate("/learn/speaking");
    setSession(null);
    setAttempts([]);
    setLastResult(null);
    loadPhrases();
  }

  const latestAttempt = lastResult?.attempt || attempts[attempts.length - 1];
  const feedback = latestAttempt?.feedback;
  const isListening = phase === PHASE.LISTENING;
  const isProcessing = phase === PHASE.PROCESSING;

  return (
    <AppLayout>
      <div className="practice-page speaking-page">
        <Link to="/learn" className="practice-back">
          <ArrowLeft size={18} />
          Back to Learn
        </Link>

        <h1>Speaking &amp; Pronunciation</h1>
        <p className="practice-page__sub">
          Listen to the phrase, then speak it. Your speech is evaluated by AI — pass score is{" "}
          {passThreshold}+.
        </p>

        {error ? <p className="practice-error">{error}</p> : null}
        {loading ? <p>Loading…</p> : null}

        {!sessionId && !loading ? (
          <ul className="practice-list">
            {phrases.map((phrase) => (
              <li key={phrase.id}>
                <button
                  type="button"
                  className="practice-list-item practice-list-item--button"
                  onClick={() => handlePickPhrase(phrase)}
                >
                  <span>
                    <strong>{phrase.text}</strong>
                    <span className="practice-list-item__meta">{phrase.meaning}</span>
                  </span>
                  <span className="practice-list-item__cta">Practice</span>
                </button>
              </li>
            ))}
            {!phrases.length ? <p>No phrases available for this language yet.</p> : null}
          </ul>
        ) : null}

        {sessionId && session && !loading ? (
          <div className="speaking-session">
            <div className="speaking-target">
              <p className="speaking-target__label">Say this phrase</p>
              <h2 className="speaking-target__phrase">{session.phraseText}</h2>
              {session.phraseMeaning ? (
                <p className="speaking-target__meaning">{session.phraseMeaning}</p>
              ) : null}
              {session.phoneticHint ? (
                <p className="speaking-target__phonetic">Pronunciation: {session.phoneticHint}</p>
              ) : null}
            </div>

            <div className="speaking-actions">
              <button type="button" className="btn btn-outline" onClick={handleListen}>
                <Volume2 size={18} />
                Listen
              </button>

              {!session.passed ? (
                <button
                  type="button"
                  className={`btn ${isListening ? "btn-danger" : "btn-accent"}`}
                  onClick={isListening ? stopMicAndSubmit : startMic}
                  disabled={isProcessing || !micSupported}
                  aria-pressed={isListening}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  {isProcessing ? "Processing…" : isListening ? "Stop & evaluate" : "Start microphone"}
                </button>
              ) : null}
            </div>

            {!micSupported ? (
              <p className="speaking-hint speaking-hint--warn">
                Speech recognition is not supported in this browser. Use Chrome or Edge for best results.
              </p>
            ) : null}

            {isListening ? (
              <p className="speaking-status speaking-status--listening">Listening… speak now</p>
            ) : null}
            {isProcessing ? (
              <p className="speaking-status speaking-status--processing">Evaluating pronunciation…</p>
            ) : null}

            {liveTranscript && isListening ? (
              <div className="speaking-transcript">
                <strong>Heard:</strong> {liveTranscript}
              </div>
            ) : null}

            {latestAttempt ? (
              <div className={`speaking-result speaking-result--${scoreTone(latestAttempt.score)}`}>
                <p className="speaking-result__score">
                  Score: <strong>{latestAttempt.score}</strong> / 100
                  {latestAttempt.passed ? " — Passed" : " — Keep practicing"}
                </p>
                {latestAttempt.transcript ? (
                  <p>
                    <strong>You said:</strong> {latestAttempt.transcript}
                  </p>
                ) : null}
                {feedback?.feedback ? <p>{feedback.feedback}</p> : null}
                {Array.isArray(feedback?.corrections) && feedback.corrections.length > 0 ? (
                  <ul className="speaking-corrections">
                    {feedback.corrections.map((c, i) => (
                      <li key={`${c.expected}-${i}`}>
                        Expected <strong>{c.expected}</strong>
                        {c.heard ? (
                          <>
                            {" "}
                            — heard <em>{c.heard}</em>
                          </>
                        ) : null}
                        {c.tip ? <> — {c.tip}</> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {lastResult?.xpAwarded > 0 ? (
                  <p className="speaking-xp">+{lastResult.xpAwarded} XP earned!</p>
                ) : null}
                {lastResult?.newlyEarnedBadges?.length > 0 ? (
                  <p className="speaking-badge">
                    Badge unlocked: {lastResult.newlyEarnedBadges.map((b) => b.title).join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="speaking-footer">
              {session.passed ? (
                <button type="button" className="btn btn-accent" onClick={handleNewPhrase}>
                  Practice another phrase
                </button>
              ) : latestAttempt && !latestAttempt.passed ? (
                <button type="button" className="btn btn-outline" onClick={handleRetry}>
                  <RotateCcw size={16} />
                  Retry
                </button>
              ) : null}
              {attempts.length > 0 ? (
                <p className="speaking-attempts">
                  Attempts: {session.attemptCount ?? attempts.length}
                  {session.bestScore ? ` · Best: ${session.bestScore}` : ""}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
