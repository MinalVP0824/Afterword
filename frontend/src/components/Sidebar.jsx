import { CheckCircle2, MessageCircleQuestion, Plus, X } from "lucide-react";
import { formatDate } from "../utils";

export default function Sidebar({ meetings, selectedId, onSelect, onNew, open, onClose }) {
  return (
    <>
      {/* dark overlay on mobile when the sidebar is open */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-ink/30 lg:hidden ${open ? "block" : "hidden"}`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-paper transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between px-6 pt-7 pb-6">
          <div>
            <h1 className="font-display text-3xl italic tracking-tight">Afterword</h1>
            <p className="mt-1 text-xs text-muted">Meetings, made into action.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-line/60 lg:hidden">
            <X size={18} />
          </button>
        </div>

        <div className="px-4">
          <button
            onClick={onNew}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/85"
          >
            <Plus size={16} /> New meeting
          </button>
        </div>

        <p className="mt-8 px-6 text-[11px] font-semibold tracking-wider text-muted uppercase">
          Past meetings
        </p>

        <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
          {meetings.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted">Nothing here yet. Analyse your first meeting.</p>
          )}
          {meetings.map((m) => {
            const active = m.id === selectedId;
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                  active ? "bg-card shadow-sm ring-1 ring-line" : "hover:bg-line/50"
                }`}
              >
                <p className="truncate text-sm font-medium">{m.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span>{formatDate(m.meeting_date)}</span>
                  <span>·</span>
                  {m.open_questions > 0 ? (
                    <span className="flex items-center gap-1 text-accent">
                      <MessageCircleQuestion size={12} /> {m.open_questions} open
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-ok">
                      <CheckCircle2 size={12} /> All clear
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}