import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  username: { type: String, required: true },
  problemUrl: { type: String, required: true },
  difficulty: { type: String },
  topic: { type: String },
  language: { type: String },
  status: { type: String }, // AC / TLE / WA
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Submission", submissionSchema);