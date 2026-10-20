import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { deleteSavedVocabulary, saveVocabulary } from "../../services/mockApi";

export default function SaveWordButton({ vocabulary, onChanged }) {
  const [saved, setSaved] = useState(Boolean(vocabulary?.saved));
  const [userVocabularyId, setUserVocabularyId] = useState(vocabulary?.userVocabularyId || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSaved(Boolean(vocabulary?.saved));
    setUserVocabularyId(vocabulary?.userVocabularyId || null);
  }, [vocabulary?.id, vocabulary?.saved, vocabulary?.userVocabularyId]);

  if (!vocabulary?.id) return null;

  async function handleToggle() {
    setLoading(true);
    setError("");
    try {
      if (saved && userVocabularyId) {
        await deleteSavedVocabulary(userVocabularyId);
        setSaved(false);
        setUserVocabularyId(null);
        onChanged?.({ saved: false, userVocabularyId: null, vocabularyId: vocabulary.id });
      } else {
        const result = await saveVocabulary({
          vocabularyId: vocabulary.id,
          source: "lesson",
        });
        setSaved(true);
        setUserVocabularyId(result.item?.id || null);
        onChanged?.({
          saved: true,
          userVocabularyId: result.item?.id || null,
          vocabularyId: vocabulary.id,
        });
      }
    } catch (err) {
      setError(err?.message || "Unable to update dictionary.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="save-word">
      <button
        type="button"
        className={`save-word__btn${saved ? " is-saved" : ""}`}
        onClick={handleToggle}
        disabled={loading}
        aria-pressed={saved}
      >
        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {loading ? "Saving…" : saved ? "Saved" : "Save word"}
      </button>
      {error ? <span className="save-word__error">{error}</span> : null}
    </div>
  );
}
