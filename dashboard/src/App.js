import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer
} from "recharts";

function App() {
  const [summary, setSummary] = useState(null);
  const [byTopic, setByTopic] = useState([]);
  const [byDifficulty, setByDifficulty] = useState([]);
  const [recent, setRecent] = useState([]);

  const [username, setUsername] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem("user"));

  const [recommendation, setRecommendation] = useState(null);
  const [mlProb, setMlProb] = useState(null);
  const [leetcodeStats, setLeetcodeStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const API = "http://127.0.0.1:5000";
  const ML_API = "http://127.0.0.1:8000";

  // ---------- AUTH ----------
  const login = async () => {
    if (!username) return alert("Enter username");
    try {
      const res = await axios.post(`${API}/api/auth/login`, { username });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", res.data.username);
      setToken(res.data.token);
      setLoggedInUser(res.data.username);
      alert("Login successful");
    } catch {
      alert("Login failed");
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setLoggedInUser(null);
    setUsername("");
  };

  // ---------- GLOBAL STATS ----------
  const loadGlobal = async () => {
    try {
      setLoading(true);
      const [s, t, d, r] = await Promise.all([
        axios.get(`${API}/api/stats/summary`),
        axios.get(`${API}/api/stats/by-topic`),
        axios.get(`${API}/api/stats/by-difficulty`),
        axios.get(`${API}/api/submissions`)
      ]);
      setSummary(s.data);
      setByTopic(t.data || []);
      setByDifficulty(d.data || []);
      setRecent((r.data || []).slice(0, 5));
    } catch (err) {
      alert("Backend not reachable on port 5000");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- USER FEATURES ----------
  const loadUserRecommendation = async () => {
    if (!username) return alert("Enter username");
    try {
      const rec = await axios.get(`${API}/api/ml/recommend-next/${username}`);
      setRecommendation(rec.data);
    } catch {
      alert("Recommendation API failed");
    }
  };

  const loadMLPrediction = async () => {
    try {
      const res = await axios.get(
        `${ML_API}/ml/predict?topic=array&difficulty=easy`
      );
      setMlProb(res.data.predicted_acceptance_probability);
    } catch {
      alert("ML service not running on port 8000");
    }
  };

  const loadLeetCodeProfile = async () => {
    if (!username) return alert("Enter LeetCode username");
    try {
      const res = await axios.get(`${API}/api/leetcode/profile/${username}`);
      setLeetcodeStats(res.data);
    } catch {
      alert("LeetCode user not found");
    }
  };

  useEffect(() => {
    loadGlobal();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1>🚀 Intelligent LeetCode Analyzer</h1>

      {/* LOGIN */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Enter username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        {!token ? (
          <button onClick={login}>🔐 Login</button>
        ) : (
          <>
            <span>✅ {loggedInUser}</span>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={loadUserRecommendation}>🎯 Recommend</button>
        <button onClick={loadMLPrediction}>🤖 ML Predict</button>
        <button onClick={loadLeetCodeProfile}>📊 LeetCode Stats</button>
        <button onClick={loadGlobal}>🌍 Global Stats</button>
      </div>

      {loading && <p>Loading data...</p>}

      {/* CARDS */}
      {recommendation && (
        <div className="card">
          <h3>🎯 Recommendation</h3>
          <b>{recommendation.recommendedTopic}</b>
          <p>{recommendation.reason}</p>
        </div>
      )}

      {mlProb !== null && (
        <div className="card">
          <h3>🤖 ML Prediction</h3>
          <p>Acceptance Probability: <b>{Math.round(mlProb * 100)}%</b></p>
        </div>
      )}

      {leetcodeStats && (
        <div className="card">
          <h3>📊 Real-Time LeetCode Stats</h3>
          <p>Easy: {leetcodeStats.easy}</p>
          <p>Medium: {leetcodeStats.medium}</p>
          <p>Hard: {leetcodeStats.hard}</p>
          <p>Total: {leetcodeStats.total}</p>
        </div>
      )}

      {summary && (
        <div className="card">
          <h3>📌 Summary</h3>
          <p>Total: {summary.totalSubmissions}</p>
          <p>Accepted: {summary.accepted}</p>
          <p>Accuracy: {summary.accuracy}</p>
        </div>
      )}

      {/* CHARTS (fixed layout) */}
      <h3>📊 By Topic</h3>
<div style={{ width: "100%", height: 320, background: "#020617", borderRadius: 12, padding: 12 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={byTopic}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
      <XAxis dataKey="topic" stroke="#cbd5f5" />
      <YAxis stroke="#cbd5f5" />
      <Tooltip
        contentStyle={{ background: "#020617", border: "1px solid #334155", color: "#eaf0f6" }}
        labelStyle={{ color: "#7dd3fc" }}
      />
      <Bar dataKey="total" fill="#38bdf8" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>

<h3>📊 By Difficulty</h3>
<div style={{ width: "100%", height: 320, background: "#020617", borderRadius: 12, padding: 12 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={byDifficulty}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
      <XAxis dataKey="difficulty" stroke="#cbd5f5" />
      <YAxis stroke="#cbd5f5" />
      <Tooltip
        contentStyle={{ background: "#020617", border: "1px solid #334155", color: "#eaf0f6" }}
        labelStyle={{ color: "#7dd3fc" }}
      />
      <Bar dataKey="total" fill="#22c55e" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>

      {/* RECENT */}
      <h3>🕒 Recent Submissions</h3>
      <ul>
        {recent.map(r => (
          <li key={r._id}>
            {r.username} – {r.topic} – {r.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;