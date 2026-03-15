// backend/server.js

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import Submission from "./models/Submission.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ===================== ENV VARIABLES ===================== */
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://leetcode-ml-service.onrender.com";

/* ===================== DB ===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

/* ===================== BASIC ===================== */
app.get("/", (req, res) => {
  res.send("LeetCode Analyzer API is running");
});

/* ===================== SUBMISSIONS ===================== */
app.post("/api/submissions", async (req, res) => {
  try {
    console.log("📥 Incoming submission from extension:", req.body);

    const submission = new Submission(req.body);
    await submission.save();

    res.status(201).json({ message: "Submission saved", submission });
  } catch (err) {
    console.error("❌ Error saving submission:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/submissions", async (req, res) => {
  const data = await Submission.find().sort({ timestamp: -1 });
  res.json(data);
});

// Simple in-memory sessions (demo purpose)
const sessions = new Map();

app.post("/api/auth/login", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const token = Math.random().toString(36).slice(2);
  sessions.set(token, { username });

  res.json({ token, username });
});

app.get("/api/auth/me", (req, res) => {
  const token = req.headers.authorization;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json(sessions.get(token));
});

/* ===================== ANALYTICS ===================== */
app.get("/api/stats/summary", async (req, res) => {
  const total = await Submission.countDocuments();
  const acCount = await Submission.countDocuments({ status: "AC" });
  const accuracy = total === 0 ? 0 : ((acCount / total) * 100).toFixed(2);
  res.json({ totalSubmissions: total, accepted: acCount, accuracy: `${accuracy}%` });
});

app.get("/api/stats/by-topic", async (req, res) => {
  const data = await Submission.aggregate([
    { $group: { _id: { $toLower: "$topic" }, total: { $sum: 1 } } },
    { $project: { _id: 0, topic: "$_id", total: 1 } }
  ]);
  res.json(data);
});

app.get("/api/stats/by-difficulty", async (req, res) => {
  const data = await Submission.aggregate([
    { $group: { _id: "$difficulty", total: { $sum: 1 } } },
    { $project: { _id: 0, difficulty: "$_id", total: 1 } }
  ]);
  res.json(data);
});

app.get("/api/stats/by-day", async (req, res) => {
  const data = await Submission.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        total: { $sum: 1 }
      }
    },
    { $project: { _id: 0, date: "$_id", total: 1 } },
    { $sort: { date: 1 } }
  ]);
  res.json(data);
});

/* ===================== ML PREDICTION ===================== */
app.get("/api/ml/predict-dynamic/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const stats = await Submission.aggregate([
      { $match: { username } },
      {
        $group: {
          _id: { $toLower: "$topic" },
          total: { $sum: 1 },
          ac: { $sum: { $cond: [{ $eq: ["$status", "AC"] }, 1, 0] } }
        }
      },
      {
        $project: {
          topic: "$_id",
          accuracy: { $cond: [{ $eq: ["$total", 0] }, 0, { $divide: ["$ac", "$total"] }] }
        }
      },
      { $sort: { accuracy: 1 } },
      { $limit: 1 }
    ]);

    if (!stats.length) {
      return res.status(404).json({ error: "No submissions for user" });
    }

    const weakestTopic = stats[0].topic;

    const mlRes = await fetch(
      `${ML_SERVICE_URL}/ml/predict?topic=${weakestTopic}&difficulty=easy`
    );
    const mlData = await mlRes.json();

    res.json({
      topic: weakestTopic,
      probability: mlData.predicted_acceptance_probability
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ML prediction failed" });
  }
});

app.get("/api/ml/recommend-next/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const stats = await Submission.aggregate([
      { $match: { username } },
      {
        $group: {
          _id: "$topic",
          total: { $sum: 1 },
          ac: { $sum: { $cond: [{ $eq: ["$status", "AC"] }, 1, 0] } }
        }
      },
      {
        $project: {
          topic: "$_id",
          accuracy: { $cond: [{ $eq: ["$total", 0] }, 0, { $divide: ["$ac", "$total"] }] }
        }
      },
      { $sort: { accuracy: 1 } }
    ]);

    if (!stats.length) {
      return res.json({ recommendedTopic: "Array", reason: "No data yet. Start with basics!" });
    }

    const weakestTopic = stats[0].topic;

    // Call ML API for probability (optional)
   try {
    const mlURL = `${process.env.ML_SERVICE_URL}/ml/predict?topic=array&difficulty=easy`;
    console.log("Calling ML:", mlURL);

    const mlRes = await fetch(mlURL);

    if (!mlRes.ok) {
        throw new Error("ML service responded with error");
    }

    const mlData = await mlRes.json();

    res.json({
        topic: "array",
        probability: mlData.predicted_acceptance_probability
    });

} catch (err) {
    console.error("ML ERROR:", err);
    res.status(500).json({ error: "ML prediction failed" });
}
    const mlData = await mlRes.json();

    res.json({
      recommendedTopic: weakestTopic,
      probability: mlData.predicted_acceptance_probability,
      reason: "This topic has your lowest acceptance rate."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Recommendation failed" });
  }
});

/* ===================== PRACTICE PLAN ===================== */
app.get("/api/practice-plan/:username", async (req, res) => {
  const plan = [
    { title: "Two Sum", topic: "Array", difficulty: "Easy", url: "https://leetcode.com/problems/two-sum/" },
    { title: "Valid Parentheses", topic: "Stack", difficulty: "Easy", url: "https://leetcode.com/problems/valid-parentheses/" },
    { title: "Binary Tree Inorder Traversal", topic: "Tree", difficulty: "Medium", url: "https://leetcode.com/problems/binary-tree-inorder-traversal/" }
  ];

  res.json({ plan });
});

/* ===================== REAL LEETCODE PROFILE ===================== */
app.get("/api/leetcode/profile/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": `https://leetcode.com/${username}/`,
        "User-Agent": "Mozilla/5.0",
        "Origin": "https://leetcode.com",
      },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `,
        variables: { username },
      }),
    });

    const data = await response.json();

    if (!data?.data?.matchedUser) {
      return res.status(404).json({ error: "User not found on LeetCode" });
    }

    const stats = data.data.matchedUser.submitStats.acSubmissionNum;

    res.json({
      easy: stats.find(s => s.difficulty === "Easy")?.count || 0,
      medium: stats.find(s => s.difficulty === "Medium")?.count || 0,
      hard: stats.find(s => s.difficulty === "Hard")?.count || 0,
      total: stats.find(s => s.difficulty === "All")?.count || 0,
    });
  } catch (err) {
    console.error("LeetCode API error:", err);
    res.status(500).json({ error: "Failed to fetch LeetCode data" });
  }
});

app.get("/api/ml/debug", async (req, res) => {
  try {
    const url = `${process.env.ML_SERVICE_URL}/ml/predict?topic=array&difficulty=easy`;
    console.log("Calling ML URL:", url);

    const response = await fetch(url);
    const data = await response.text();

    res.send({
      ml_url_called: url,
      ml_response: data
    });

  } catch (err) {
    res.send({
      error: err.message
    });
  }
});

/* ===================== SERVER ===================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
