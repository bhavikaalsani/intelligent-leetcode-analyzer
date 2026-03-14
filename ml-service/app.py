from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import pandas as pd
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

app = FastAPI()

# ✅ CORS FIX (THIS SOLVES YOUR NETWORK ERROR)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = MongoClient("mongodb+srv://leetcode_user:1234567890@cluster0.oyxxp2k.mongodb.net/leetcode_analyzer?retryWrites=true&w=majority")
db = client["leetcode_analyzer"]
collection = db["submissions"]

@app.get("/ml/debug/count")
def debug_count():
    count = collection.count_documents({})
    return {"count": count}

model = None
enc_topic = LabelEncoder()
enc_diff = LabelEncoder()

def train_model():
    global model, enc_topic, enc_diff

    data = list(collection.find())
    print("Training rows:", len(data))

    if len(data) < 2:
        raise HTTPException(status_code=400, detail="Not enough data to train model")

    df = pd.DataFrame(data)

    df["status"] = df["status"].apply(lambda x: 1 if x == "AC" else 0)
    df["topic"] = df["topic"].astype(str).str.lower()
    df["difficulty"] = df["difficulty"].astype(str).str.lower()

    df["topic_enc"] = enc_topic.fit_transform(df["topic"])
    df["difficulty_enc"] = enc_diff.fit_transform(df["difficulty"])

    X = df[["topic_enc", "difficulty_enc"]]
    y = df["status"]

    model = XGBClassifier(n_estimators=50, eval_metric="logloss")
    model.fit(X, y)

@app.get("/ml/train")
def train():
    train_model()
    return {"message": "Model trained"}

@app.get("/ml/predict")
def predict(topic: str, difficulty: str):
    global model

    if model is None:
        train_model()

    topic = topic.lower().strip()
    difficulty = difficulty.lower().strip()

    # ✅ HANDLE UNSEEN LABELS SAFELY
    if topic not in enc_topic.classes_:
        return {"predicted_acceptance_probability": 0.5}

    if difficulty not in enc_diff.classes_:
        return {"predicted_acceptance_probability": 0.5}

    t = enc_topic.transform([topic])[0]
    d = enc_diff.transform([difficulty])[0]

    pred = model.predict_proba([[t, d]])[0][1]

    return {
        "predicted_acceptance_probability": round(float(pred), 3)
    }


