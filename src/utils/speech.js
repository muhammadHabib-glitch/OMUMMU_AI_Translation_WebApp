/** Strip markdown for speech output */
export function stripMarkdown(text) {
  return String(text || "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/[#>_`]/g, "")
    .trim();
}

const LANG_HINTS = {
  igbo: "ig-NG",
  yoruba: "yo-NG",
  hausa: "ha-NG",
  swahili: "sw-KE",
  pidgin: "en-NG",
  amharic: "am-ET",
  zulu: "zu-ZA",
  afrikaans: "af-ZA",
  french: "fr-FR",
  spanish: "es-ES",
  arabic: "ar-SA",
};

const CODE_TO_BCP47 = {
  en: "en-US",
  "en-us": "en-US",
  "en-gb": "en-GB",
  ig: "ig-NG",
  yo: "yo-NG",
  ha: "ha-NG",
  sw: "sw-KE",
  pcm: "en-NG",
  am: "am-ET",
  zu: "zu-ZA",
  af: "af-ZA",
  fr: "fr-FR",
  es: "es-ES",
  "es-419": "es-419",
  ar: "ar-SA",
  de: "de-DE",
  pt: "pt-PT",
  "pt-br": "pt-BR",
  hi: "hi-IN",
  zh: "zh-CN",
  "zh-tw": "zh-TW",
  ja: "ja-JP",
  ko: "ko-KR",
};

const AFRICAN_KEYWORDS = [
  { re: /\bigbo\b/i, lang: "ig-NG" },
  { re: /\byoruba\b/i, lang: "yo-NG" },
  { re: /\bhausa\b/i, lang: "ha-NG" },
  { re: /\bswahili\b/i, lang: "sw-KE" },
  { re: /\b(nigerian )?pidgin\b/i, lang: "en-NG" },
  { re: /\bamharic\b/i, lang: "am-ET" },
  { re: /\bzulu\b/i, lang: "zu-ZA" },
  { re: /\bafrikaans\b/i, lang: "af-ZA" },
];

function detectSpeechLang(text, langHint) {
  if (langHint && LANG_HINTS[langHint.toLowerCase()]) {
    return LANG_HINTS[langHint.toLowerCase()];
  }
  for (const { re, lang } of AFRICAN_KEYWORDS) {
    if (re.test(text)) return lang;
  }
  const igboChars = /[ịọụẸỊỌỤ]/;
  if (igboChars.test(text)) return "ig-NG";
  return "en-US";
}

/** Map app language code/label → BCP-47 for SpeechRecognition */
export function toSpeechRecognitionLang(code, label) {
  const key = String(code || "").toLowerCase();
  if (CODE_TO_BCP47[key]) return CODE_TO_BCP47[key];
  if (label && LANG_HINTS[String(label).toLowerCase()]) {
    return LANG_HINTS[String(label).toLowerCase()];
  }
  if (key.includes("-")) {
    const [a, b] = key.split("-");
    return `${a}-${(b || "").toUpperCase()}`;
  }
  if (key.length === 2) return `${key}-${key.toUpperCase()}`;
  return "en-US";
}

export function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Create a SpeechRecognition instance.
 * Chrome ends sessions even with continuous=true after silence — callers that
 * want hold-to-talk must restart from onend while still held.
 */
export function createSpeechRecognition({
  lang = "en-US",
  continuous = false,
  interimResults = true,
  onResult,
  onError,
  onEnd,
} = {}) {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.continuous = Boolean(continuous);
  recognition.interimResults = Boolean(interimResults);
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    if (!onResult) return;
    let interim = "";
    let finalChunk = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const piece = event.results[i]?.[0]?.transcript || "";
      if (event.results[i].isFinal) finalChunk += piece;
      else interim += piece;
    }
    onResult({ interim, finalChunk, event });
  };

  recognition.onerror = (event) => {
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}

function pickVoice(voices, langCode) {
  if (!voices?.length) return null;
  const base = langCode.split("-")[0].toLowerCase();
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith(base)) ||
    voices.find((v) => v.lang?.toLowerCase().includes(base)) ||
    null
  );
}

let voicesReady = false;

function ensureVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (voicesReady && window.speechSynthesis.getVoices().length) return;
  window.speechSynthesis.getVoices();
  if (!voicesReady) {
    window.speechSynthesis.onvoiceschanged = () => {
      voicesReady = true;
    };
    voicesReady = true;
  }
}

/** Split long text into sentence-sized pieces; Chrome silently cuts off long single utterances. */
function splitForSpeech(text, max = 180) {
  const sentences = text.match(/[^.!?\n]+[.!?]*\s*/g) || [text];
  const chunks = [];
  let cur = "";
  for (const sentence of sentences) {
    if (cur && (cur + sentence).length > max) {
      chunks.push(cur.trim());
      cur = sentence;
    } else {
      cur += sentence;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.flatMap((c) =>
    c.length > max * 1.5 ? c.match(new RegExp(`.{1,${max}}(\\s|$)`, "g")) || [c] : [c]
  );
}

let currentSpeakId = 0;

/** Speaks text; options.onEnd fires once when speech finishes (not when stopSpeaking() is called). */
export function speakText(text, options = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  ensureVoices();
  const plain = stripMarkdown(text);
  if (!plain) return false;

  const lang = detectSpeechLang(plain, options.langHint);
  const voice = pickVoice(window.speechSynthesis.getVoices(), lang);
  const chunks = splitForSpeech(plain);
  const id = ++currentSpeakId;
  let finished = false;
  const finish = () => {
    if (finished || id !== currentSpeakId) return;
    finished = true;
    options.onEnd?.();
  };

  window.speechSynthesis.cancel();
  chunks.forEach((chunk, i) => {
    const utter = new SpeechSynthesisUtterance(chunk);
    utter.lang = lang;
    utter.rate = options.rate ?? 0.92;
    if (voice) utter.voice = voice;
    if (i === chunks.length - 1) utter.onend = finish;
    utter.onerror = finish;
    window.speechSynthesis.speak(utter);
  });
  return true;
}

export function stopSpeaking() {
  currentSpeakId += 1;
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
