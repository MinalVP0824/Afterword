import { formatDate } from "./utils";

export function toMarkdown(m) {
  const lines = [];
  lines.push(`# ${m.title}`, "");
  lines.push(`**Date:** ${formatDate(m.meeting_date, true)}  `);
  if (m.participants.length) lines.push(`**Participants:** ${m.participants.join(", ")}`);
  lines.push("", "## Summary", "", m.summary, "");

  if (m.key_points.length) {
    lines.push("### Key points", "");
    m.key_points.forEach((k) => lines.push(`- ${k}`));
    lines.push("");
  }

  lines.push("## Decisions", "");
  if (m.decisions.length) {
    m.decisions.forEach((d) => lines.push(`- ${d.decision}${d.made_by ? ` *(decided by ${d.made_by})*` : ""}`));
  } else {
    lines.push("No final decisions were made.");
  }
  lines.push("");

  lines.push("## Action items", "");
  if (m.tasks.length) {
    lines.push("| Task | Owner | Deadline | Priority | Status |");
    lines.push("|---|---|---|---|---|");
    m.tasks.forEach((t) => {
      const deadline = t.deadline ? formatDate(t.deadline) : t.deadline_text ? `"${t.deadline_text}"` : "Not set";
      const status = t.status === "ready" ? "Ready" : "Needs clarification";
      const cell = (s) => String(s).replace(/\|/g, "/");
      lines.push(`| ${cell(t.description)} | ${cell(t.owner || "Not assigned")} | ${deadline} | ${t.priority} | ${status} |`);
    });
  } else {
    lines.push("No action items.");
  }
  lines.push("");

  lines.push("## Follow-ups", "");
  if (m.follow_ups.length) m.follow_ups.forEach((f) => lines.push(`- [ ] ${f}`));
  (m.resolved_follow_ups || []).forEach((f) => lines.push(`- [x] ~~${f.text}~~ (${f.reason})`));
  if (!m.follow_ups.length && !(m.resolved_follow_ups || []).length) lines.push("Nothing to follow up on.");
  lines.push("");

  const open = m.clarifications.filter((c) => !c.answered);
  if (open.length) {
    lines.push("## Still unclear", "");
    open.forEach((c) => lines.push(`- ${c.question}`));
    lines.push("");
  }

  lines.push("---", "*Generated with Afterword*");
  return lines.join("\n");
}

export function downloadMarkdown(m) {
  const blob = new Blob([toMarkdown(m)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  a.href = url;
  a.download = `${slug || "meeting"}-${m.meeting_date}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}