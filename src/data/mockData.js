export const LANGUAGES = [
  { code: "en-uk", countryCode: "GB", label: "English (UK)", flag: "🇬🇧" },
  { code: "ig", countryCode: "NG", label: "Igbo", flag: "🇳🇬" },
  { code: "yo", countryCode: "NG", label: "Yoruba", flag: "🇳🇬" },
  { code: "ha", countryCode: "NG", label: "Hausa", flag: "🇳🇬" },
  { code: "sw", countryCode: "KE", label: "Swahili", flag: "🇰🇪" },
  { code: "am", countryCode: "ET", label: "Amharic", flag: "🇪🇹" },
  { code: "zu", countryCode: "ZA", label: "Zulu", flag: "🇿🇦" },
  { code: "af", countryCode: "ZA", label: "Afrikaans", flag: "🇿🇦" },
  { code: "fr", countryCode: "FR", label: "French", flag: "🇫🇷" },
  { code: "de", countryCode: "DE", label: "German", flag: "🇩🇪" },
  { code: "es", countryCode: "ES", label: "Spanish", flag: "🇪🇸" },
];

export const MOCK_IGBO = {
  "Hello, how are you today?": "Kedu, kedu ka i mere taa?",
  "Hello, how are you?": "Kedu, kedu ka i mere?",
  Welcome: "Nnọọ",
  "Good morning": "Ụtụtụ ọma",
  Menu: "Nri ncha",
};

export const COURSES = [
  {
    id: "igbo",
    name: "Igbo",
    lessons: 12,
    desc: "Southeast Nigeria dialect & culture",
    progress: 45,
    active: true,
  },
  {
    id: "yoruba",
    name: "Yoruba",
    lessons: 10,
    desc: "Western Nigeria tonal language",
    progress: 20,
  },
  {
    id: "swahili",
    name: "Swahili",
    lessons: 8,
    desc: "East African lingua franca",
    progress: 65,
    tag: "Daily Challenge",
  },
  {
    id: "hausa",
    name: "Hausa",
    lessons: 8,
    desc: "Northern Nigeria & Sahel regions",
    locked: true,
  },
];

export const RECENT_LESSONS = [
  { id: 1, title: "Basic Greetings", status: "mastered", meta: "Mastered 2 days ago" },
  { id: 2, title: "Numbers & Counting", status: "progress", meta: "60% In progress", progress: 60 },
  { id: 3, title: "Family & Relationships", status: "locked", meta: "Locked until Level 2" },
  { id: 4, title: "Common Phrases", status: "mastered", meta: "Mastered 1 week ago" },
];

export const BADGES = [
  { id: 1, label: "Early Bird", earned: true },
  { id: 2, label: "Linguist", earned: true },
  { id: 3, label: "Expert", earned: false },
  { id: 4, label: "Global", earned: false },
  { id: 5, label: "Streaker", earned: false },
  { id: 6, label: "AI Master", earned: false },
];

export const COMMUNITY_POSTS = [
  {
    id: 1,
    user: "Ada Okafor",
    lang: "Igbo",
    original: "How are you?",
    suggestion: "Kedu ka ị mere?",
    votes: 24,
    time: "2h ago",
  },
  {
    id: 2,
    user: "Tunde Adebayo",
    lang: "Yoruba",
    original: "Good evening",
    suggestion: "E kaale",
    votes: 18,
    time: "5h ago",
  },
  {
    id: 3,
    user: "Amina Yusuf",
    lang: "Hausa",
    original: "Thank you very much",
    suggestion: "Na gode sosai",
    votes: 31,
    time: "1d ago",
  },
];

export const FORUM_THREADS = [
  { id: 1, title: "Best way to learn Igbo tones?", replies: 12, tag: "Igbo" },
  { id: 2, title: "Yoruba vs Igbo greeting differences", replies: 8, tag: "Discussion" },
  { id: 3, title: "Hausa dialect contributions needed", replies: 15, tag: "Hausa" },
];

export const CHAT_SUGGESTIONS = [
  "How do I say good morning in Igbo?",
  "Explain Yoruba tones",
  "Correct my sentence: I goes to market yesterday",
  "Improve my writing: I want learn Hausa fast",
  "Explain this idiom: break the ice",
  "Help with pronunciation in Nigerian Pidgin",
];

export const DOC_FORMATS = [
  { id: "PDF", supported: true },
  { id: "DOC", supported: true, note: "Exports as DOCX" },
  { id: "DOCX", supported: true },
  { id: "PPT", supported: false, note: "Use PPTX" },
  { id: "PPTX", supported: true },
  { id: "XLS", supported: true, note: "Exports as XLSX" },
  { id: "XLSX", supported: true },
  { id: "TXT", supported: true },
];
