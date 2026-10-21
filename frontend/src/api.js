const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Can't reach the backend. Is the FastAPI server running on port 8000?");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail)) message = data.detail.map((d) => d.msg).join(", ");
    } catch {
      /* response had no JSON body */
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  health: () => request("/api/health"),
  samples: () => request("/api/samples"),
  listMeetings: () => request("/api/meetings"),
  getMeeting: (id) => request(`/api/meetings/${id}`),
  analyze: (body) => request("/api/analyze", { method: "POST", body: JSON.stringify(body) }),
  clarify: (id, answers) =>
    request(`/api/meetings/${id}/clarify`, { method: "POST", body: JSON.stringify({ answers }) }),
  updateTask: (id, taskId, changes) =>
    request(`/api/meetings/${id}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(changes) }),
  deleteMeeting: (id) => request(`/api/meetings/${id}`, { method: "DELETE" }),
};