import { useState } from "react";
import { AlertCircle, CalendarDays, Check, Pencil, User, X } from "lucide-react";
import { formatDate } from "../utils";

const PRIORITY = {
  high: { label: "High", dot: "bg-red-500" },
  medium: { label: "Medium", dot: "bg-amber-400" },
  low: { label: "Low", dot: "bg-slate-300" },
};

export default function TaskCard({ task, onSave, index }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const ready = task.status === "ready";
  const p = PRIORITY[task.priority] || PRIORITY.medium;

  function startEdit() {
    setForm({
      description: task.description,
      owner: task.owner || "",
      deadline: task.deadline || task.deadline_text || "",
      priority: task.priority,
    });
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const changes = {};
    if (form.description.trim() && form.description.trim() !== task.description) changes.description = form.description;
    if (form.owner.trim() && form.owner.trim() !== task.owner) changes.owner = form.owner;
    if (form.deadline.trim() && form.deadline.trim() !== (task.deadline || task.deadline_text)) changes.deadline = form.deadline;
    if (form.priority !== task.priority) changes.priority = form.priority;
    try {
      if (Object.keys(changes).length) await onSave(task.id, changes);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full rounded-md border border-line bg-paper/50 px-2.5 py-1.5 text-sm outline-none focus:border-ink/40";

  if (editing) {
    return (
      <div className="rounded-xl border border-ink/20 bg-card p-4 shadow-sm">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className={`${input} resize-none`}
        />
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Owner" className={input} />
          <input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="Deadline, e.g. 28 Oct" className={input} />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={input}>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted hover:bg-paper">
            <X size={14} /> Cancel
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1 rounded-md bg-ink px-3 py-1.5 text-sm text-paper disabled:opacity-60">
            <Check size={14} /> {saving ? "Saving" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ animationDelay: `${index * 40}ms` }}
      className={`rise group rounded-xl border bg-card p-4 transition ${
        ready ? "border-line" : "border-accent/30 shadow-[inset_3px_0_0_var(--color-accent)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] leading-snug font-medium">{task.description}</p>
        <button
          onClick={startEdit}
          title="Edit task"
          className="shrink-0 rounded-md p-1 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-paper hover:text-ink print:hidden"
        >
          <Pencil size={14} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${task.owner ? "bg-paper" : "bg-accent-soft text-accent"}`}>
          <User size={12} /> {task.owner || "No owner"}
        </span>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${task.deadline ? "bg-paper" : "bg-accent-soft text-accent"}`}>
          <CalendarDays size={12} />
          {task.deadline ? formatDate(task.deadline) : task.deadline_text ? `"${task.deadline_text}"` : "No deadline"}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1">
          <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} /> {p.label}
        </span>
        {ready && (
          <span className="ml-auto flex items-center gap-1 font-medium text-ok">
            <Check size={13} /> Ready
          </span>
        )}
      </div>

      {!ready && task.issues.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-dashed border-line pt-3">
          {task.issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-accent">
              <AlertCircle size={13} className="mt-px shrink-0" /> {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}