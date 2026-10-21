import { useCallback, useEffect, useState } from "react";
import { Loader2, Menu } from "lucide-react";
import { api, session } from "./api";
import Sidebar from "./components/Sidebar";
import NewMeeting from "./components/NewMeeting";
import MeetingView from "./components/MeetingView";
import Landing from "./components/Landing";
import Auth from "./components/Auth";

const GITHUB_URL = "https://github.com/MinalVP0824/afterword";

export default function App() {
  const [view, setView] = useState("landing"); // "landing", "auth" or "app"
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [meetings, setMeetings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");

  const resetMeetings = useCallback(() => {
    setMeetings([]);
    setSelectedId(null);
    setMeeting(null);
    setError("");
  }, []);

  // If the backend rejects the token (expired or invalid), send the user to log in
  useEffect(() => {
    session.onUnauthorized(() => {
      setUser(null);
      resetMeetings();
      setView("auth");
    });
  }, [resetMeetings]);

  // On page load, check if a saved token is still valid
  useEffect(() => {
    if (!session.getToken()) {
      setCheckingSession(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => session.clear())
      .finally(() => setCheckingSession(false));
  }, []);

  const refreshList = useCallback(() => {
    api.listMeetings().then(setMeetings).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (user) refreshList();
  }, [user, refreshList]);

  function openApp() {
    setView(user ? "app" : "auth");
  }

  function handleAuthed(loggedInUser) {
    resetMeetings();
    setUser(loggedInUser);
    setView("app");
  }

  function logout() {
    session.clear();
    setUser(null);
    resetMeetings();
    setSidebarOpen(false);
    setView("landing");
  }

  async function openMeeting(id) {
    setSidebarOpen(false);
    setSelectedId(id);
    setError("");
    setLoadingMeeting(true);
    try {
      setMeeting(await api.getMeeting(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMeeting(false);
    }
  }

  function startNew() {
    setSidebarOpen(false);
    setSelectedId(null);
    setMeeting(null);
    setError("");
  }

  function handleCreated(result) {
    setMeeting(result);
    setSelectedId(result.id);
    refreshList();
  }

  async function handleClarify(id, answers) {
    const updated = await api.clarify(id, answers);
    setMeeting(updated);
    refreshList();
  }

  async function handleUpdateTask(id, taskId, changes) {
    const updated = await api.updateTask(id, taskId, changes);
    setMeeting(updated);
    refreshList();
  }

  async function handleDelete(id) {
    await api.deleteMeeting(id);
    startNew();
    refreshList();
  }

  if (view === "landing") {
    return <Landing onStart={openApp} githubUrl={GITHUB_URL} />;
  }

  if (checkingSession) {
    return (
      <div className="flex h-screen items-center justify-center text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (view === "auth" || !user) {
    return <Auth onAuthed={handleAuthed} onBack={() => setView("landing")} />;
  }

  return (
    <div className="flex h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
      <div className="contents print:hidden">
        <Sidebar
          user={user}
          meetings={meetings}
          selectedId={selectedId}
          onSelect={openMeeting}
          onNew={startNew}
          onHome={() => setView("landing")}
          onLogout={logout}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 overflow-y-auto print:overflow-visible">
        {/* mobile top bar */}
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden print:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-md p-1.5 hover:bg-line/60">
            <Menu size={20} />
          </button>
          <span className="font-display text-xl italic">Afterword</span>
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-3xl px-5">
            <p className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">{error}</p>
          </div>
        )}

        {loadingMeeting ? (
          <div className="flex h-[70vh] items-center justify-center text-muted">
            <Loader2 className="animate-spin" />
          </div>
        ) : meeting ? (
          <MeetingView
            meeting={meeting}
            onClarify={handleClarify}
            onUpdateTask={handleUpdateTask}
            onDelete={handleDelete}
          />
        ) : (
          <NewMeeting onCreated={handleCreated} />
        )}
      </main>
    </div>
  );
}