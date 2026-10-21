const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_KEY = "afterword_token";

let onUnauthorized = () => {};

export const session = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
  // App.jsx registers what should happen when the token is rejected (log out)
  onUnauthorized: (fn) => {
    onUnauthorized = fn;
  },
};

async function request(path, options = {}) {
  const token = session.getToken();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
    // a rejected token on a protected route means the session is over
    if (res.status === 401 && token && !path.startsWith("/api/auth/login")) {
      session.clear();
      onUnauthorized();
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  health: () => request("/api/health"),
  samples: () => request("/api/samples"),

  signup: (body) => request("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/api/auth/me"),

  listMeetings: () => request("/api/meetings"),
  getMeeting: (id) => request(`/api/meetings/${id}`),
  analyze: (body) => request("/api/analyze", { method: "POST", body: JSON.stringify(body) }),
  clarify: (id, answers) =>
    request(`/api/meetings/${id}/clarify`, { method: "POST", body: JSON.stringify({ answers }) }),
  updateTask: (id, taskId, changes) =>
    request(`/api/meetings/${id}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(changes) }),
  deleteMeeting: (id) => request(`/api/meetings/${id}`, { method: "DELETE" }),
};