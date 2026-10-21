import { useState } from "react";
import {
  CalendarDays, Check, CheckCircle2, CircleDot, Download, Gavel, ListChecks,
  MessageSquareText, Printer, Trash2, Users,
} from "lucide-react";
import { formatDate, initials, todayISO } from "../utils";
import { downloadMarkdown } from "../export";
import TaskCard from "./TaskCard";
import ClarifyPanel from "./ClarifyPanel";

function Section({ icon: Icon, title, count, children }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={16} className="text-muted" />
        <h3 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{title}</h3>
        {count !== undefined && (
          <span className="rounded-full bg-line/70 px-2 py-0.5 text-[11px] font-medium text-muted">{count}</span>
        )}
      </div>
      {children}
    </section>
  );
}

export default function MeetingView({ meeting, onClarify, onUpdateTask, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ready = meeting.tasks.filter((t) => t.status === "ready").length;
  const pending = meeting.tasks.length - ready;
  const progress = meeting.tasks.length ? Math.round((ready / meeting.tasks.length) * 100) : 100;
  const resolved = meeting.resolved_follow_ups || [];

  // tasks that still need answers go first
  const tasks = [...meeting.tasks].sort((a, b) => (a.status === b.status ? 0 : a.status === "ready" ? 1 : -1));

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:py-14 print:px-0 print:py-0">
      {/* Brand header, only shown in the printed PDF */}
      <div className="mb-10 hidden items-end justify-between border-b-2 border-ink pb-4 print:flex">
        <div>
          <p className="font-display text-5xl leading-none tracking-tight italic">Afterword</p>
          <p className="mt-2 text-sm text-muted">Meetings, made into action.</p>
        </div>
        <div className="text-right text-xs text-muted">
          <p className="text-[11px] font-semibold tracking-wider uppercase">Meeting notes</p>
          <p className="mt-1">Exported {formatDate(todayISO(), true)}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <CalendarDays size={14} /> {formatDate(meeting.meeting_date, true)}
          </p>
          <h2 className="mt-2 font-display text-3xl leading-tight tracking-tight lg:text-4xl">{meeting.title}</h2>
          {meeting.participants.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex -space-x-2">
                {meeting.participants.map((p) => (
                  <span
                    key={p}
                    title={p}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper bg-ink text-[11px] font-semibold text-paper"
                  >
                    {initials(p)}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <Users size={14} /> {meeting.participants.join(", ")}
              </span>
            </div>
          )}
        </div>

        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm print:hidden">
            <span className="text-muted">Delete this meeting?</span>
            <button onClick={() => onDelete(meeting.id)} className="rounded-md bg-accent px-3 py-1.5 text-white">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="rounded-md px-3 py-1.5 text-muted hover:bg-line/50">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-1 print:hidden">
            <button
              onClick={() => downloadMarkdown(meeting)}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted hover:bg-line/50 hover:text-ink"
            >
              <Download size={14} /> Markdown
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted hover:bg-line/50 hover:text-ink"
            >
              <Printer size={14} /> PDF
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted hover:bg-line/50 hover:text-ink"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Tasks", value: meeting.tasks.length },
          { label: "Ready", value: ready, color: "text-ok" },
          { label: "Need answers", value: pending, color: pending ? "text-accent" : "" },
          { label: "Decisions", value: meeting.decisions.length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-card px-4 py-3">
            <p className={`font-display text-3xl ${s.color || ""}`}>{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-ok transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted">{progress}% of tasks are clear and ready to go</p>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px] print:block">
        {/* Left column */}
        <div className="min-w-0">
          <Section icon={MessageSquareText} title="Summary">
            <p className="font-display text-lg leading-relaxed">{meeting.summary}</p>
            {meeting.key_points.length > 0 && (
              <ul className="mt-5 space-y-2">
                {meeting.key_points.map((k, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink/85">
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted" /> {k}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section icon={Gavel} title="Decisions" count={meeting.decisions.length}>
            {meeting.decisions.length === 0 ? (
              <p className="text-sm text-muted">No final decisions were made in this meeting.</p>
            ) : (
              <div className="space-y-2">
                {meeting.decisions.map((d) => (
                  <div key={d.id} className="flex items-start gap-3 rounded-xl border border-line bg-card px-4 py-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" />
                    <div>
                      <p className="text-[15px]">{d.decision}</p>
                      {d.made_by && <p className="mt-0.5 text-xs text-muted">Decided by {d.made_by}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section icon={ListChecks} title="Action items" count={meeting.tasks.length}>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted">No action items were found.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((t, i) => (
                  <TaskCard key={t.id} task={t} index={i} onSave={(taskId, changes) => onUpdateTask(meeting.id, taskId, changes)} />
                ))}
              </div>
            )}
          </Section>

          <Section icon={CircleDot} title="Follow-ups" count={meeting.follow_ups.length}>
            {meeting.follow_ups.length === 0 && resolved.length === 0 ? (
              <p className="text-sm text-muted">Nothing to follow up on.</p>
            ) : (
              <ul className="space-y-2">
                {meeting.follow_ups.map((f, i) => (
                  <li key={f} className="rise flex gap-3 rounded-xl border border-dashed border-line px-4 py-3 text-[15px]">
                    <span className="font-display text-muted italic">{i + 1}.</span> {f}
                  </li>
                ))}
                {resolved.map((f) => (
                  <li key={f.text} className="rise flex gap-3 rounded-xl bg-ok-soft px-4 py-3">
                    <Check size={16} className="mt-0.5 shrink-0 text-ok" />
                    <div>
                      <p className="text-[15px] text-muted line-through">{f.text}</p>
                      <p className="mt-0.5 text-xs text-ok">{f.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Footer, only shown in the printed PDF */}
          <p className="mt-12 hidden border-t border-line pt-4 text-center text-xs text-muted print:block">
            Generated with <span className="font-display italic">Afterword</span>
          </p>
        </div>

        {/* Right column (hidden when printing) */}
        <div className="lg:mt-10 print:hidden">
          <div className="lg:sticky lg:top-8">
            <ClarifyPanel
              key={meeting.id}
              clarifications={meeting.clarifications}
              onSubmit={(answers) => onClarify(meeting.id, answers)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}