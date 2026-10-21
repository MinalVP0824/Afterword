import { useState } from "react";
import { ChevronDown, CornerDownRight, Loader2, PartyPopper, Send, Sparkles } from "lucide-react";

const FIELD_LABEL = { owner: "Owner", deadline: "Deadline", description: "Task details" };
const PLACEHOLDER = {
  owner: "e.g. Karthik",
  deadline: "e.g. 28 Oct, next Friday",
  description: "Describe the task clearly",
};

export default function ClarifyPanel({ clarifications, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const open = clarifications.filter((c) => !c.answered);
  const answered = clarifications.filter((c) => c.answered);
  const filled = Object.entries(answers).filter(([id, v]) => v.trim() && open.some((c) => c.id === id));

  async function submit() {
    if (!filled.length) return;
    setSending(true);
    setError("");
    try {
      await onSubmit(filled.map(([clarification_id, answer]) => ({ clarification_id, answer })));
      setAnswers({});
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card shadow-sm">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <h3 className="font-display text-lg">Afterword needs a few answers</h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          {open.length > 0
            ? `${open.length} thing${open.length > 1 ? "s were" : " was"} left unclear in the meeting.`
            : "Every task has an owner, a date and a clear goal."}
        </p>
      </div>

      {open.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-10 text-center">
          <PartyPopper size={28} className="text-ok" />
          <p className="mt-3 font-medium">All clear</p>
          <p className="mt-1 text-sm text-muted">Nothing left to clarify.</p>
        </div>
      ) : (
        <div className="max-h-[55vh] space-y-4 overflow-y-auto px-5 py-4">
          {open.map((c) => (
            <div key={c.id} className="rise">
              <span className="text-[11px] font-semibold tracking-wider text-accent uppercase">
                {FIELD_LABEL[c.field]}
              </span>
              <p className="mt-0.5 text-sm leading-snug">{c.question}</p>
              <input
                value={answers[c.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [c.id]: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={PLACEHOLDER[c.field]}
                className="mt-2 w-full rounded-lg border border-line bg-paper/50 px-3 py-2 text-sm outline-none focus:border-ink/40"
              />
            </div>
          ))}
        </div>
      )}

      {open.length > 0 && (
        <div className="border-t border-line px-5 py-3">
          {error && <p className="mb-2 text-xs text-accent">{error}</p>}
          <button
            onClick={submit}
            disabled={!filled.length || sending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {filled.length ? `Send ${filled.length} answer${filled.length > 1 ? "s" : ""}` : "Answer a question to continue"}
          </button>
        </div>
      )}

      {answered.length > 0 && (
        <div className="border-t border-line">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between px-5 py-3 text-xs font-medium text-muted hover:text-ink"
          >
            Answered ({answered.length})
            <ChevronDown size={14} className={`transition ${showHistory ? "rotate-180" : ""}`} />
          </button>
          {showHistory && (
            <ul className="space-y-3 px-5 pb-4">
              {answered.map((c) => (
                <li key={c.id} className="text-xs">
                  <p className="text-muted">{c.question}</p>
                  <p className="mt-1 flex items-center gap-1 font-medium">
                    <CornerDownRight size={12} className="text-muted" /> {c.answer}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}