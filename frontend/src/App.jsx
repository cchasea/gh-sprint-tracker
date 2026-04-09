import { useEffect, useState } from "react";
import axios from "axios";
import BurndownChart from "./BurndownChart";

axios.defaults.withCredentials = true;

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // check login
  useEffect(() => {
    axios.get(`${API}/me`)
      .then(res => setUser(res.data))
      .catch(() => {});
  }, []);

  // load repos after login
  useEffect(() => {
    if (!user) return;
    axios.get(`${API}/repos`)
      .then(res => setRepos(res.data));
  }, [user]);

  const login = () => {
    window.location.href = `${API}/auth/github`;
  };

  const trackRepo = async (repo) => {
    await axios.post(`${API}/track`, {
      owner: repo.owner,
      name: repo.name,
      githubRepoId: repo.id
    });
  };

  const syncRepo = async (repo) => {
    await axios.post(`${API}/sync/${repo.owner}/${repo.name}`);
  };

  const loadMetrics = async (repo) => {
    const res = await axios.get(`${API}/metrics/${repo.owner}/${repo.name}`);
    setMetrics(res.data.burndown);
    setSelected(repo);
  };

// UI 
  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h1>GitHub Sprint Tracker</h1>
        <button onClick={login}>Login with GitHub</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Logged in as {user.login}</h2>

      <h3>Your Repos</h3>

      {repos.map(r => (
        <div key={r.id} style={{ marginBottom: 10 }}>
          <b>{r.owner}/{r.name}</b>

          <button onClick={() => trackRepo(r)}>Track</button>
          <button onClick={() => syncRepo(r)}>Sync</button>
          <button onClick={() => loadMetrics(r)}>View</button>
        </div>
      ))}

      {selected && metrics && (
        <>
          <h3>Burndown: {selected.name}</h3>
          <BurndownChart data={metrics} />
        </>
      )}
    </div>
  );
}