import { useEffect, useRef, useState } from "react";
import { ArrowRight, FileText, Loader2, Upload } from "lucide-react";
import { api } from "../api";
import { todayISO } from "../utils";

const LOADING_STEPS = [
  "Reading the transcript",
  "Picking out decisions",
  "Finding tasks and owners",
  "Checking for anything unclear",
];

export default function NewMeeting({ onCreated }) {
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(todayISO());
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    api.samples().then(setSamples).catch(() => setSamples([]));
  }, []);

  // cycle through the loading messages while the agent works
  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 2200);
    return () => clearInterval(timer);
  }, [loading]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTranscript(String(reader.result));
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleAnalyze() {
    setError("");
    if (transcript.trim().length < 20) {
      setError("The transcript is too short. Paste the full meeting conversation.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.analyze({
        transcript,
        meeting_date: meetingDate,
        title: title.trim() || null,
      });
      onCreated(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 lg:py-16">
      <h2 className="font-display text-4xl leading-tight tracking-tight lg:text-5xl">
        What happened in <span className="italic">the meeting?</span>
      </h2>
      <p className="mt-3 max-w-xl text-muted">
        Paste the transcript. Afterword pulls out the summary, decisions and tasks, and asks you about
        anything left vague.
      </p>

      <div className="rise mt-8 rounded-2xl border border-line bg-card shadow-sm">
        <div className="grid gap-4 border-b border-line p-5 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1.5 block text-xs font-medium text-muted">Title (optional)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Afterword will suggest one"
              className="w-full rounded-lg border border-line bg-paper/50 px-3 py-2 outline-none focus:border-ink/40"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-xs font-medium text-muted">Meeting date</span>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full rounded-lg border border-line bg-paper/50 px-3 py-2 outline-none focus:border-ink/40"
            />
          </label>
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          disabled={loading}
          placeholder={"Ananya: Okay everyone, let's start...\nRohan: Before anything else, the venue..."}
          className="block h-80 w-full resize-none bg-transparent p-5 text-[15px] leading-relaxed outline-none disabled:opacity-60"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
          <div className="flex items-center gap-3 text-xs text-muted">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-paper hover:text-ink"
            >
              <Upload size={14} /> Upload .txt
            </button>
            <input ref={fileRef} type="file" accept=".txt" onChange={handleFile} className="hidden" />
            <span>{wordCount} words</span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {LOADING_STEPS[step]}...
              </>
            ) : (
              <>
                Analyse meeting <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {samples.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">Or try a sample</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setTranscript(s.transcript);
                  setTitle("");
                }}
                disabled={loading}
                className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm transition hover:border-ink/30"
              >
                <FileText size={14} className="text-muted" /> {s.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}