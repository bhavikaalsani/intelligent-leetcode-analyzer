import os

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder

load_dotenv()

app = FastAPI()

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    raise RuntimeError("MONGO_URI environment variable is required")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient(mongo_uri)
db = client["leetcode_analyzer"]
collection = db["submissions"]

model = None
enc_topic = LabelEncoder()
enc_diff = LabelEncoder()
baseline_probability = 0.5


@app.get("/")
def root():
    return {"ok": True, "service": "ml-service"}


@app.get("/ml/health")
def health():
    return {"ok": True}


@app.get("/ml/debug/count")
def debug_count():
    count = collection.count_documents({})
    return {"count": count}


def train_model():
    global model, enc_topic, enc_diff, baseline_probability

    data = list(collection.find())
    print("Training rows:", len(data))

    if len(data) < 2:
        model = None
        baseline_probability = 0.5
        return

    df = pd.DataFrame(data)
    required_columns = {"status", "topic", "difficulty"}
    missing = required_columns - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Training data is missing columns: {', '.join(sorted(missing))}",
        )

    df["status"] = df["status"].apply(lambda value: 1 if value == "AC" else 0)
    df["topic"] = df["topic"].astype(str).str.lower()
    df["difficulty"] = df["difficulty"].astype(str).str.lower()
    baseline_probability = float(df["status"].mean())

    if df["status"].nunique() < 2:
        model = None
        return

    df["topic_enc"] = enc_topic.fit_transform(df["topic"])
    df["difficulty_enc"] = enc_diff.fit_transform(df["difficulty"])

    x = df[["topic_enc", "difficulty_enc"]]
    y = df["status"]

    model = LogisticRegression(max_iter=1000)
    model.fit(x, y)


@app.get("/ml/train")
def train():
    train_model()
    return {
        "message": "Model trained" if model is not None else "Using baseline probability",
        "baseline_probability": round(baseline_probability, 3),
    }


@app.get("/ml/predict")
def predict(topic: str, difficulty: str):
    global model

    if model is None:
        train_model()

    if model is None:
        return {"predicted_acceptance_probability": round(baseline_probability, 3)}

    topic = topic.lower().strip()
    difficulty = difficulty.lower().strip()

    if topic not in enc_topic.classes_:
        return {"predicted_acceptance_probability": round(baseline_probability, 3)}

    if difficulty not in enc_diff.classes_:
        return {"predicted_acceptance_probability": round(baseline_probability, 3)}

    t = enc_topic.transform([topic])[0]
    d = enc_diff.transform([difficulty])[0]
    pred = model.predict_proba([[t, d]])[0][1]

    return {"predicted_acceptance_probability": round(float(pred), 3)}
