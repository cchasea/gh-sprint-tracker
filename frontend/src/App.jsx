import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'
import { useEffect, useState } from 'react'

export default function App() {
  const api = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);

  // try to fetch current user (if logged in)
  useEffect(() => {
    axios
      .get(`${api}/me`, { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => {
        setUser(null); // not logged in is fine
      });
  }, [api]);

  // when have a user load repos
  useEffect(() => {
    if (!user) return;
    axios
      .get(`${api}/repos`, { withCredentials: true })
      .then(res => setRepos(res.data))
      .catch(err => {
        console.error('Error loading repos', err);
      });
  }, [user, api]);

  const login = () => {
    window.location.href = `${api}/auth/github`;
  };

  if (!user) {
    return (
      <div>
        <h1>GitHub Sprint Tracker</h1>
        <button onClick={login}>
          Login with GitHub
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>GitHub Sprint Tracker</h1>
      <p>Logged in as {user.login}</p>

      <h2>Your Repos</h2>
      {repos.map(r => (
        <div key={r.id}>
          {r.owner}/{r.name}
        </div>
      ))}
    </div>
  );
}
