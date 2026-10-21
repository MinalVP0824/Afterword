import {
  ArrowRight, CalendarDays, Check, FileDown, FileText, GitBranch, History,
  ListChecks, MessageCircleQuestion, Pencil, RefreshCw, ScanSearch, Sparkles, User,
} from "lucide-react";

const STEPS = [
  { icon: FileText, title: "Extract", text: "Reads the transcript and pulls out the summary, decisions, tasks and follow-ups." },
  { icon: ScanSearch, title: "Validate", text: "Checks every task for a missing owner, a vague deadline or an unclear goal." },
  { icon: MessageCircleQuestion, title: "Clarify", text: "Turns each gap into a direct question, instead of guessing the answer." },
  { icon: RefreshCw, title: "Update", text: "Applies your answers and checks again. A vague reply gets asked again." },
  { icon: Sparkles, title: "Reflect", text: "Spots which follow-ups are now settled and crosses them off with a reason." },
];

const FEATURES = [
  { icon: CalendarDays, title: "Real dates, not vibes", text: '"By Friday" and "end of the month" become actual dates on the calendar.' },
  { icon: ListChecks, title: "Decisions stay separate", text: "What was agreed is kept apart from what was only discussed." },
  { icon: Pencil, title: "You stay in control", text: "Edit any task by hand. The agent re-checks it straight away." },
  { icon: History, title: "Remembers every meeting", text: "Past meetings and every answer you gave are saved for later." },
  { icon: FileDown, title: "Share in one click", text: "Export clean notes as Markdown or a printable PDF report." },
  { icon: GitBranch, title: "Model independent", text: "Runs on Groq, Gemini or OpenAI by changing one setting." },
];

function HeroDemo() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* transcript card */}
      <div className="rise rounded-2xl border border-line bg-card p-5 shadow-sm">
        <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">Transcript</p>
        <div className="mt-3 space-y-2 text-sm leading-relaxed">
          <p><span className="font-medium">Ananya:</span> Karthik, posters are yours. When can you finish them?</p>
          <p>
            <span className="font-medium">Karthik:</span> I'll try to get the first drafts done{" "}
            <span className="rounded bg-accent-soft px-1 font-medium text-accent underline decoration-accent/40 decoration-wavy underline-offset-4">
              soon
            </span>
            .
          </p>
          <p>
            <span className="font-medium">Ananya:</span>{" "}
            <span className="rounded bg-accent-soft px-1 font-medium text-accent underline decoration-accent/40 decoration-wavy underline-offset-4">
              Someone
            </span>{" "}
            needs to update the website.
          </p>
        </div>
      </div>

      {/* arrow */}
      <div className="flex justify-center py-2 text-muted">
        <ArrowRight size={18} className="rotate-90" />
      </div>

      {/* task card */}
      <div className="rise rounded-2xl border border-accent/30 bg-card p-5 shadow-[inset_3px_0_0_var(--color-accent)]" style={{ animationDelay: "150ms" }}>
        <p className="text-[15px] font-medium">Create the first drafts of the event posters</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1">
            <User size={12} /> Karthik
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-accent">
            <CalendarDays size={12} /> "soon"
          </span>
        </div>
      </div>

      {/* agent question bubble */}
      <div
        className="rise relative mt-3 ml-6 rounded-2xl bg-ink p-4 text-paper shadow-lg sm:ml-12"
        style={{ animationDelay: "300ms" }}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-paper/60 uppercase">
          <Sparkles size={12} /> Afterword asks
        </p>
        <p className="mt-1.5 text-sm leading-snug">
          The posters were given the deadline "soon". What is the exact date?
        </p>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-paper/10 px-3 py-2 text-sm">
          <span>28 Oct</span>
          <span className="flex items-center gap-1 text-xs text-green-300">
            <Check size={13} /> Wed, 28 Oct
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onStart, githubUrl }) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <span className="font-display text-4xl tracking-tight italic">Afterword</span>
          <div className="flex items-center gap-2">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-lg px-3 py-2 text-sm text-muted hover:bg-line/50 hover:text-ink sm:block"
              >
                GitHub
              </a>
            )}
            <button
              onClick={onStart}
              className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-[15px] font-medium text-paper transition hover:bg-ink/85"
            >
              Open app <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-16 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-24 lg:pb-28">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-muted uppercase">
            <span className="h-px w-10 bg-accent" />
            Meeting notes that ask back
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-[4rem]">
            Every meeting ends.
            <br />
            <span className="italic text-accent">The work shouldn't</span>
            <br />
            <span className="italic text-accent">get lost.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            Paste a transcript. Afterword turns it into decisions, tasks with real owners and real dates,
            and asks you about anything the meeting left vague.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onStart}
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent/90"
            >
              Analyse a meeting <ArrowRight size={16} />
            </button>
            <a href="#how" className="rounded-lg px-4 py-3 text-sm font-medium text-ink hover:bg-line/50">
              See how it works
            </a>
          </div>
        </div>

        <HeroDemo />
      </section>

      {/* Problem strip */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-3">
          {[
            ['"Someone should..."', "Tasks that belong to everyone end up belonging to no one."],
            ['"...soon."', "Deadlines nobody can put on a calendar quietly slip."],
            ['"Let\'s look into it."', "Actions so vague that nobody knows when they are done."],
          ].map(([quote, text]) => (
            <div key={quote}>
              <p className="font-display text-2xl italic">{quote}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 lg:py-28">
        <p className="text-[11px] font-semibold tracking-wider text-accent uppercase">How it works</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight tracking-tight lg:text-5xl">
          Not just a summary. <span className="italic">An agent that checks its own work.</span>
        </h2>

        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative rounded-2xl border border-line bg-card p-5">
              <span className="font-display text-sm text-muted italic">0{i + 1}</span>
              <Icon size={22} className="mt-4 text-ink" />
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 flex items-center gap-2 text-sm text-muted">
          <RefreshCw size={14} /> Steps 3 to 5 repeat until every task is clear.
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
          <p className="text-[11px] font-semibold tracking-wider text-accent uppercase">Features</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight lg:text-5xl">
            Built for the hour <span className="italic">after</span> the meeting.
          </h2>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 font-medium">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-20 lg:flex-row lg:items-center">
          <h2 className="max-w-xl font-display text-4xl leading-tight tracking-tight lg:text-5xl">
            Your next meeting deserves a <span className="italic text-orange-300">better afterword.</span>
          </h2>
          <button
            onClick={onStart}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:bg-white"
          >
            Try it with a sample meeting <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}