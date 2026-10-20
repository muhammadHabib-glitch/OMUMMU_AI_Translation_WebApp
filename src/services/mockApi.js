import { apiRequest, setSession, clearSession, API_BASE, getToken } from "./apiClient";
import { MOCK_IGBO } from "../data/mockData";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

/** True only when the server could not be reached (not for 401/400/etc.) */
function isNetworkFailure(err) {
  if (!err) return true;
  // apiClient sets status on HTTP errors; network/fetch failures usually have none
  if (typeof err.status === "number") return false;
  const msg = String(err.message || "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("network request failed")
  );
}

/** Prefer live backend; fall back to local stubs only if API is unreachable */
async function withFallback(apiCall, fallback) {
  try {
    return await apiCall();
  } catch (err) {
    if (!isNetworkFailure(err)) throw err;
    console.warn("API unreachable, using local stub:", err.message);
    return fallback();
  }
}

export async function translateText(text, targetLabel = "Igbo", sourceLang = "English", options = {}) {
  const { autoDetect = false } = options;
  return withFallback(
    async () => {
      const data = await apiRequest("/translate/text", {
        method: "POST",
        body: JSON.stringify({
          text,
          targetLang: targetLabel,
          sourceLang: autoDetect ? "auto" : sourceLang,
          autoDetect,
        }),
      });
      return data;
    },
    async () => {
      await delay(500);
      const trimmed = text.trim();
      if (!trimmed) {
        return {
          translation: "",
          sourceLang,
          targetLang: targetLabel,
          detectedSourceLang: null,
          stub: true,
        };
      }
      return {
        translation: MOCK_IGBO[trimmed] || `[${targetLabel}] ${trimmed}`,
        sourceLang,
        targetLang: targetLabel,
        detectedSourceLang: autoDetect ? "English" : null,
        stub: true,
      };
    }
  );
}

const RECENT_LANG_KEY = "omummu_recent_langs";
const MAX_RECENT = 5;

let cachedLanguages = null;

export async function fetchLanguages() {
  if (cachedLanguages) return cachedLanguages;
  return withFallback(
    async () => {
      const data = await apiRequest("/languages");
      cachedLanguages = data;
      return data;
    },
    async () => {
      const { LANGUAGES_FALLBACK, AUTO_DETECT_OPTION } = await import("../data/languagesFallback.js");
      return {
        count: LANGUAGES_FALLBACK.length,
        autoDetect: AUTO_DETECT_OPTION,
        priority: LANGUAGES_FALLBACK.filter((l) => l.priority),
        languages: LANGUAGES_FALLBACK,
      };
    }
  );
}

export function getRecentLanguageCodes() {
  try {
    const raw = localStorage.getItem(RECENT_LANG_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function rememberLanguage(code) {
  if (!code || code === "auto") return;
  const current = getRecentLanguageCodes().filter((c) => c !== code);
  current.unshift(code);
  localStorage.setItem(RECENT_LANG_KEY, JSON.stringify(current.slice(0, MAX_RECENT)));
}

export async function detectLanguage(text) {
  return withFallback(
    async () => apiRequest("/translate/detect", { method: "POST", body: JSON.stringify({ text }) }),
    async () => ({ language: "English", label: "English", code: "en", confidence: 0.5, flag: "🇬🇧" })
  );
}

export async function translateVoice(
  audioBlob,
  targetLabel = "Igbo",
  sourceLang = "English",
  transcript = null
) {
  return withFallback(
    async () => {
      const form = new FormData();
      form.append("targetLang", targetLabel);
      form.append("sourceLang", sourceLang);
      if (transcript) form.append("transcript", String(transcript));
      if (audioBlob) form.append("audio", audioBlob, "recording.webm");
      return apiRequest("/translate/voice", { method: "POST", body: form });
    },
    async () => {
      await delay(800);
      const text = transcript || "Hello, how are you today?";
      return {
        transcript: text,
        translation: MOCK_IGBO[text] || `[${targetLabel}] ${text}`,
      };
    }
  );
}

export async function translateDocument(
  file,
  targetLabel = "Igbo",
  sourceLang = "English",
  options = {}
) {
  return withFallback(
    async () => {
      const form = new FormData();
      form.append("targetLang", targetLabel);
      form.append("sourceLang", sourceLang);
      form.append("preserveFormat", options.preserveFormat ? "true" : "false");
      form.append("file", file);
      return apiRequest("/translate/document", { method: "POST", body: form });
    },
    async () => {
      await delay(1200);
      const translation =
        "Ngwa ahụ bụ nzukọ mmụta nke ga-enyere anyị aka ịmụta asụsụ ndị Africa...";
      return {
        fileName: file?.name || "document.pdf",
        preview: translation,
        translation,
        formattingPreserved: false,
        formattingNote: "Offline fallback preview only.",
        download: {
          fileName: "document_translated.txt",
          mimeType: "text/plain; charset=utf-8",
          base64: btoa(unescape(encodeURIComponent(translation))),
        },
        status: "complete",
        targetLabel,
      };
    }
  );
}

export async function translateImage(file, targetLabel = "Igbo", sourceLang = "English") {
  return withFallback(
    async () => {
      const form = new FormData();
      form.append("targetLang", targetLabel);
      form.append("sourceLang", sourceLang);
      if (file) form.append("image", file);
      return apiRequest("/translate/image", { method: "POST", body: form });
    },
    async () => {
      await delay(900);
      return {
        detected: "Welcome",
        translation: MOCK_IGBO.Welcome || "Nnọọ",
        extras: [{ detected: "Menu", translation: "Nri ncha" }],
        targetLabel,
      };
    }
  );
}

export async function askAssistant(message, conversationId = null) {
  return withFallback(
    async () =>
      apiRequest("/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message, conversationId }),
      }),
    async () => {
      await delay(700);
      const lower = message.toLowerCase();
      if (lower.includes("morning") || lower.includes("good morning")) {
        return {
          text: 'In Igbo, “Good morning” is **Ụtụtụ ọma** (OO-too-too OH-ma). You can also greet with **Ndewo**.',
          phonetic: "OO-too-too OH-ma",
          conversationId: conversationId || "local-stub",
          messageId: `stub-${Date.now()}`,
        };
      }
      if (lower.includes("hello") || lower.includes("how are you")) {
        return {
          text: 'A natural Igbo reply is **Kedu?** or **Kedu ka i mere?** — “How are you?”',
          phonetic: "KEH-doo kah ee MEH-reh",
          conversationId: conversationId || "local-stub",
          messageId: `stub-${Date.now()}`,
        };
      }
      return {
        text: `Great question! Here's a tip for African languages: focus on tone. For “${message.slice(0, 60)}”, practice with Listen mode.`,
        phonetic: null,
        conversationId: conversationId || "local-stub",
        messageId: `stub-${Date.now()}`,
      };
    }
  );
}

export async function fetchConversations() {
  return withFallback(
    async () => apiRequest("/assistant/conversations"),
    async () => ({ conversations: [] })
  );
}

export async function createConversation(title = "New chat") {
  return withFallback(
    async () =>
      apiRequest("/assistant/conversations", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    async () => ({
      conversation: {
        id: `local-${Date.now()}`,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  );
}

export async function fetchConversation(conversationId) {
  return withFallback(
    async () => apiRequest(`/assistant/conversations/${conversationId}`),
    async () => ({ conversation: null, messages: [] })
  );
}

export async function deleteConversation(conversationId) {
  return apiRequest(`/assistant/conversations/${conversationId}`, { method: "DELETE" });
}

export async function fetchSavedResponses() {
  return withFallback(
    async () => apiRequest("/assistant/saved"),
    async () => ({ saved: [] })
  );
}

export async function saveAssistantResponse(payload) {
  return apiRequest("/assistant/saved", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteSavedResponse(savedId) {
  return apiRequest(`/assistant/saved/${savedId}`, { method: "DELETE" });
}

export async function login(email, password) {
  // Never stub auth — wrong password must fail, not fake a session
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setSession(data);
  return data;
}

export async function register({ name, email, password }) {
  // OTP flow — do not auto-login or stub past verification
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  if (data?.email) sessionStorage.setItem("omummu_pending_email", data.email);
  return data;
}

export async function verifyOtp({ email, otp }) {
  // Creates verified account only — no JWT / no auto-login
  return apiRequest("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function resendOtp(email) {
  return apiRequest("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyResetOtp({ email, otp }) {
  return apiRequest("/auth/verify-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function resendResetOtp(email) {
  return apiRequest("/auth/resend-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword({ email, resetToken, password, confirmPassword }) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, resetToken, password, confirmPassword }),
  });
}

export async function mockLogin(email, password) {
  return login(email, password);
}

export async function fetchHistory({ favorites } = {}) {
  const qs = favorites ? "?favorites=true" : "";
  return apiRequest(`/history${qs}`);
}

export async function toggleHistoryFavorite(id, favorite) {
  return apiRequest(`/history/${id}/favorite`, {
    method: "PATCH",
    body: JSON.stringify({ favorite }),
  });
}

export async function deleteHistoryItem(id) {
  return apiRequest(`/history/${id}`, { method: "DELETE" });
}

export async function fetchCourses() {
  const data = await apiRequest("/learn/courses");
  return data;
}

export async function fetchLearnStats() {
  return apiRequest("/learn/stats");
}

export async function fetchProfile() {
  return apiRequest("/profile");
}

export async function updateProfileName(name) {
  return apiRequest("/profile", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function uploadProfileAvatar(file) {
  const form = new FormData();
  form.append("avatar", file);
  return apiRequest("/profile/avatar", { method: "POST", body: form });
}

export async function removeProfileAvatar() {
  return apiRequest("/profile/avatar", { method: "DELETE" });
}

export function resolveAssetUrl(assetPath) {
  if (!assetPath) return null;
  if (String(assetPath).startsWith("http")) return assetPath;
  const base = API_BASE.replace(/\/api\/v1\/?$/, "");
  return `${base}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}

export async function fetchLearnCourse(courseId) {
  return apiRequest(`/learn/courses/${courseId}`);
}

export async function enrollLearnCourse(courseId) {
  return apiRequest(`/learn/courses/${courseId}/enroll`, { method: "POST" });
}

export async function fetchContinueLearning() {
  return apiRequest("/learn/continue");
}

export async function fetchRecentLessons(courseId) {
  const q = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiRequest(`/learn/recent-lessons${q}`);
}

export async function updateLearnProfile(activeLanguage) {
  return apiRequest("/learn/profile", {
    method: "PATCH",
    body: JSON.stringify({ activeLanguage }),
  });
}

export async function fetchLesson(lessonId) {
  return apiRequest(`/learn/lessons/${lessonId}`);
}

export async function startLesson(lessonId) {
  return apiRequest(`/learn/lessons/${lessonId}/start`, { method: "POST" });
}

export async function completeLesson(lessonId) {
  return apiRequest(`/learn/lessons/${lessonId}/complete`, { method: "POST" });
}

export async function fetchSavedVocabulary() {
  return apiRequest("/learn/vocabulary/saved");
}

export async function fetchCatalogVocabulary({ courseId, lessonId } = {}) {
  const params = new URLSearchParams();
  if (courseId) params.set("courseId", courseId);
  if (lessonId) params.set("lessonId", lessonId);
  const q = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/learn/vocabulary${q}`);
}

export async function saveVocabulary(payload) {
  return apiRequest("/learn/vocabulary/save", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSavedVocabulary(id, payload) {
  return apiRequest(`/learn/vocabulary/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function reviewSavedVocabulary(payload) {
  return apiRequest("/learn/vocabulary/review", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteSavedVocabulary(id) {
  return apiRequest(`/learn/vocabulary/${id}`, { method: "DELETE" });
}

export async function fetchFlashcardDecks(courseId) {
  const q = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiRequest(`/learn/flashcards/decks${q}`);
}

export async function fetchFlashcardDeck(deckId) {
  return apiRequest(`/learn/flashcards/decks/${deckId}`);
}

export async function reviewFlashcard(flashcardId, payload) {
  return apiRequest(`/learn/flashcards/${flashcardId}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchQuizzes(courseId) {
  const q = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiRequest(`/learn/quizzes${q}`);
}

export async function fetchQuiz(quizId) {
  return apiRequest(`/learn/quizzes/${quizId}`);
}

export async function submitQuiz(quizId, answers) {
  return apiRequest(`/learn/quizzes/${quizId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function fetchExercises({ courseId, lessonId } = {}) {
  const params = new URLSearchParams();
  if (courseId) params.set("courseId", courseId);
  if (lessonId) params.set("lessonId", lessonId);
  const q = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/learn/exercises${q}`);
}

export async function submitExercise(exerciseId, answer) {
  return apiRequest(`/learn/exercises/${exerciseId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export async function fetchLearnBadges() {
  return apiRequest("/learn/badges");
}

export async function fetchDailyChallenge() {
  return apiRequest("/learn/daily-challenge");
}

export async function fetchLearnRecommendations() {
  return apiRequest("/learn/recommendations");
}

export async function fetchConversationScenarios(courseId) {
  const params = new URLSearchParams();
  if (courseId) params.set("courseId", courseId);
  const q = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/learn/conversations/scenarios${q}`);
}

export async function startConversationSession(scenarioId) {
  return apiRequest("/learn/conversations/sessions", {
    method: "POST",
    body: JSON.stringify({ scenarioId }),
  });
}

export async function fetchConversationSession(sessionId) {
  return apiRequest(`/learn/conversations/sessions/${sessionId}`);
}

export async function sendConversationMessage(sessionId, message) {
  return apiRequest(`/learn/conversations/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function completeConversationSession(sessionId) {
  return apiRequest(`/learn/conversations/sessions/${sessionId}/complete`, {
    method: "POST",
  });
}

export async function fetchSpeakingPhrases(language = "Igbo") {
  const params = new URLSearchParams({ language });
  return apiRequest(`/learn/speaking/phrases?${params.toString()}`);
}

export async function startSpeakingSession({ language = "Igbo", phraseText, phraseMeaning, phoneticHint }) {
  return apiRequest("/learn/speaking/sessions", {
    method: "POST",
    body: JSON.stringify({ language, phraseText, phraseMeaning, phoneticHint }),
  });
}

export async function fetchSpeakingSession(sessionId) {
  return apiRequest(`/learn/speaking/sessions/${sessionId}`);
}

export async function submitSpeakingAttempt(sessionId, { browserTranscript = "", audioBlob = null } = {}) {
  if (audioBlob) {
    const form = new FormData();
    form.append("browserTranscript", browserTranscript);
    form.append("transcriptSource", "browser");
    form.append("audio", audioBlob, "recording.webm");
    return apiRequest(`/learn/speaking/sessions/${sessionId}/attempts`, {
      method: "POST",
      body: form,
    });
  }
  return apiRequest(`/learn/speaking/sessions/${sessionId}/attempts`, {
    method: "POST",
    body: JSON.stringify({
      browserTranscript,
      transcriptSource: "browser",
    }),
  });
}

export async function explainLanguage(topic, language = "Igbo") {
  return apiRequest("/learn/explain", {
    method: "POST",
    body: JSON.stringify({ topic, language }),
  });
}

export async function fetchCommunityPosts() {
  return withFallback(
    () => apiRequest("/community/posts"),
    async () => ({ posts: [], threads: [], forum: [] })
  );
}

export async function fetchCommunityPost(postId) {
  return apiRequest(`/community/posts/${postId}`);
}

export async function createCommunityPost(payload) {
  return apiRequest("/community/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function voteCommunityPost(postId) {
  return apiRequest(`/community/posts/${postId}/vote`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchCommunityComments(postId) {
  return apiRequest(`/community/posts/${postId}/comments`);
}

export async function createCommunityComment(postId, body) {
  return apiRequest(`/community/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function reportCommunityContent(payload) {
  return apiRequest("/community/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminCommunityOverview() {
  return apiRequest("/admin/community/overview");
}

export async function fetchAdminCommunityPosts(params = {}) {
  const q = new URLSearchParams();
  if (params.type) q.set("type", params.type);
  if (params.status) q.set("status", params.status);
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiRequest(`/admin/community/posts${qs ? `?${qs}` : ""}`);
}

export async function fetchAdminCommunityReports(status = "open") {
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  const qs = q.toString();
  return apiRequest(`/admin/community/reports${qs ? `?${qs}` : ""}`);
}

export async function moderateCommunityPost(postId, action, note) {
  return apiRequest(`/admin/community/posts/${postId}/moderate`, {
    method: "PATCH",
    body: JSON.stringify({ action, note }),
  });
}

export async function resolveCommunityReport(reportId, payload) {
  return apiRequest(`/admin/community/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminCommunityModerationLog(limit = 50) {
  const q = new URLSearchParams();
  if (limit) q.set("limit", String(limit));
  const qs = q.toString();
  return apiRequest(`/admin/community/moderation-log${qs ? `?${qs}` : ""}`);
}

export async function fetchNotifications({ limit = 20, offset = 0, unreadOnly = false } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));
  if (unreadOnly) params.set("unreadOnly", "true");
  const q = params.toString();
  return apiRequest(`/notifications${q ? `?${q}` : ""}`);
}

export async function fetchUnreadNotificationCount() {
  return apiRequest("/notifications/unread-count");
}

export async function markNotificationRead(notificationId) {
  return apiRequest(`/notifications/${notificationId}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return apiRequest("/notifications/read-all", { method: "PATCH" });
}

export async function fetchNotificationPreferences() {
  return apiRequest("/notifications/preferences");
}

export async function updateNotificationPreferences(patch) {
  return apiRequest("/notifications/preferences", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function publishAdminAnnouncement(payload) {
  return apiRequest("/admin/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminAnnouncements(limit = 50) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  const q = params.toString();
  return apiRequest(`/admin/announcements${q ? `?${q}` : ""}`);
}

export async function fetchBillingConfig() {
  return apiRequest("/billing/config");
}

export async function fetchBillingPlans() {
  return apiRequest("/billing/plans");
}

export async function fetchSubscriptionStatus() {
  return apiRequest("/billing/status");
}

export async function createCheckoutSession(payload) {
  return apiRequest("/billing/checkout", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function createBillingPortalSession() {
  return apiRequest("/billing/portal", { method: "POST" });
}

export async function fetchPaymentHistory({ limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));
  const q = params.toString();
  return apiRequest(`/billing/payments${q ? `?${q}` : ""}`);
}

export async function fetchAdminSubscriptions(limit = 50) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  const q = params.toString();
  return apiRequest(`/admin/subscriptions${q ? `?${q}` : ""}`);
}

export async function fetchAdminPayments(limit = 50) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  const q = params.toString();
  return apiRequest(`/admin/payments${q ? `?${q}` : ""}`);
}

export async function fetchAdminBillingStats() {
  return apiRequest("/admin/billing/stats");
}

export async function fetchAdminUsers() {
  return apiRequest("/admin/users");
}

export async function adminSetUserPlan(userId, plan) {
  return apiRequest(`/admin/users/${userId}/plan`, {
    method: "PATCH",
    body: JSON.stringify({ plan }),
  });
}

function analyticsQuery(range = {}) {
  const params = new URLSearchParams();
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);
  if (range.granularity) params.set("granularity", range.granularity);
  if (range.limit) params.set("limit", String(range.limit));
  const q = params.toString();
  return q ? `?${q}` : "";
}

export async function fetchAdminStats(range = {}) {
  return apiRequest(`/admin/stats${analyticsQuery(range)}`);
}

export async function fetchAdminTranslations(limit = 100) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  const q = params.toString();
  return apiRequest(`/admin/translations${q ? `?${q}` : ""}`);
}

export async function fetchAdminAnalyticsOverview(range = {}) {
  return apiRequest(`/admin/analytics/overview${analyticsQuery(range)}`);
}

export async function fetchAdminAnalyticsUsers(range = {}) {
  return apiRequest(`/admin/analytics/users${analyticsQuery(range)}`);
}

export async function fetchAdminAnalyticsTranslations(range = {}) {
  return apiRequest(`/admin/analytics/translations${analyticsQuery(range)}`);
}

export async function fetchAdminAnalyticsLearning(range = {}) {
  return apiRequest(`/admin/analytics/learning${analyticsQuery(range)}`);
}

export async function fetchAdminAnalyticsAi(range = {}) {
  return apiRequest(`/admin/analytics/ai${analyticsQuery(range)}`);
}

export async function fetchAdminAnalyticsFeatures(range = {}) {
  return apiRequest(`/admin/analytics/features${analyticsQuery(range)}`);
}

export async function fetchAdminAnalyticsSubscriptions(range = {}) {
  return apiRequest(`/admin/analytics/subscriptions${analyticsQuery(range)}`);
}

export async function fetchAdminAnalyticsActivity(range = {}) {
  return apiRequest(`/admin/analytics/activity${analyticsQuery(range)}`);
}

export { clearSession };
