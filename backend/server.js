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

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL ||
  "https://leetcode-ml-service.onrender.com";

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
    const submission = new Submission(req.body);
    await submission.save();
    res.status(201).json({ message: "Submission saved", submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission save failed" });
  }
});

app.get("/api/submissions", async (req, res) => {
  const data = await Submission.find().sort({ timestamp: -1 });
  res.json(data);
});

/* ===================== AUTH ===================== */

const sessions = new Map();

app.post("/api/auth/login", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username required" });
  }

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
  const ac = await Submission.countDocuments({ status: "AC" });

  const accuracy =
    total === 0 ? 0 : ((ac / total) * 100).toFixed(2);

  res.json({
    totalSubmissions: total,
    accepted: ac,
    accuracy: `${accuracy}%`,
  });
});

app.get("/api/stats/by-topic", async (req, res) => {
  const data = await Submission.aggregate([
    { $group: { _id: { $toLower: "$topic" }, total: { $sum: 1 } } },
    { $project: { topic: "$_id", total: 1, _id: 0 } },
  ]);

  res.json(data);
});

app.get("/api/stats/by-difficulty", async (req, res) => {
  const data = await Submission.aggregate([
    { $group: { _id: "$difficulty", total: { $sum: 1 } } },
    { $project: { difficulty: "$_id", total: 1, _id: 0 } },
  ]);

  res.json(data);
});

app.get("/api/stats/by-day", async (req, res) => {
  const data = await Submission.aggregate([
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$timestamp",
          },
        },
        total: { $sum: 1 },
      },
    },
    { $project: { date: "$_id", total: 1, _id: 0 } },
    { $sort: { date: 1 } },
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
          ac: {
            $sum: {
              $cond: [{ $eq: ["$status", "AC"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          topic: "$_id",
          accuracy: { $divide: ["$ac", "$total"] },
        },
      },
      { $sort: { accuracy: 1 } },
      { $limit: 1 },
    ]);

    const weakestTopic =
      stats.length > 0 ? stats[0].topic : "array";

    const mlURL = `${ML_SERVICE_URL}/ml/predict?topic=${weakestTopic}&difficulty=easy`;

    console.log("Calling ML:", mlURL);

   const mlRes = await fetch(mlURL);

const text = await mlRes.text();
console.log("ML RAW RESPONSE:", text);

const mlData = JSON.parse(text);

    res.json({
      topic: weakestTopic,
      probability: mlData.predicted_acceptance_probability,
    });
  } catch (err) {
    console.error("ML ERROR:", err);

    res.status(500).json({
      error: "ML prediction failed",
    });
  }
});

/* ===================== RECOMMEND NEXT ===================== */

app.get("/api/ml/recommend-next/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const stats = await Submission.aggregate([
      { $match: { username } },
      {
        $group: {
          _id: "$topic",
          total: { $sum: 1 },
          ac: {
            $sum: {
              $cond: [{ $eq: ["$status", "AC"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          topic: "$_id",
          accuracy: { $divide: ["$ac", "$total"] },
        },
      },
      { $sort: { accuracy: 1 } },
      { $limit: 1 },
    ]);

    const weakestTopic =
      stats.length > 0 ? stats[0].topic : "Array";

    res.json({
      recommendedTopic: weakestTopic,
      reason: "This topic has your lowest acceptance rate",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Recommendation failed",
    });
  }
});

/* ===================== PRACTICE PLAN ===================== */

app.get("/api/practice-plan/:username", (req, res) => {
  const plan = [
    {
      title: "Two Sum",
      topic: "Array",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/two-sum/",
    },
    {
      title: "Valid Parentheses",
      topic: "Stack",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/valid-parentheses/",
    },
    {
      title: "Binary Tree Inorder Traversal",
      topic: "Tree",
      difficulty: "Medium",
      url:
        "https://leetcode.com/problems/binary-tree-inorder-traversal/",
    },
  ];

  res.json({ plan });
});

/* ===================== DEBUG ===================== */

app.get("/api/ml/debug", async (req, res) => {
  try {
    const url = `${ML_SERVICE_URL}/ml/predict?topic=array&difficulty=easy`;

    const response = await fetch(url);
    const data = await response.text();

    res.json({
      ml_url_called: url,
      ml_response: data,
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

/* ===================== SERVER ===================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
