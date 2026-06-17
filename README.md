# Intelligent LeetCode Analyzer

## Overview

Intelligent LeetCode Analyzer is a full-stack AI-powered platform that helps users analyze their coding performance, predict future success rates, and receive personalized recommendations for improving problem-solving skills.

The project combines:

* MERN Stack (MongoDB, Express.js, React.js, Node.js)
* Machine Learning (XGBoost)
* FastAPI-based ML Service
* LeetCode Submission Analytics
* Interactive Dashboard

---
## Deployment Link
https://intelligent-leetcode-analyzer1.vercel.app/ 
https://intelligent-leetcode-backend.onrender.com/api/health
https://intelligent-leetcode-ml-service.onrender.com/

## Features

### User Performance Analytics

* Track coding submissions
* Monitor acceptance rates
* Analyze difficulty-wise performance
* View historical trends

### AI-Powered Prediction

* Predict future coding performance
* Estimate problem-solving success rates
* Generate intelligent recommendations

### Dashboard Visualization

* Interactive charts and graphs
* Performance summaries
* Progress tracking

### Data Management

* Store user submissions
* Retrieve historical records
* MongoDB Atlas integration

---

## Project Architecture

```text
Frontend (React)
        |
        v
Node.js + Express Backend
        |
        +---- MongoDB Atlas
        |
        +---- FastAPI ML Service
                     |
                     v
               XGBoost Model
```

---

## Tech Stack

### Frontend

* React.js
* Axios
* Recharts
* CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### Machine Learning

* Python
* FastAPI
* Pandas
* NumPy
* Scikit-Learn
* XGBoost

### Database

* MongoDB Atlas

---

## Folder Structure

```text
intelligent-leetcode-analyzer/
│
├── dashboard/                 # React Frontend
│
├── backend/                   # Node.js Backend
│
├── ml-service/                # FastAPI ML Service
│
├── leetcode-analyzer/         # Extension Components
│
├── leetcode-extension/        # VS Code Extension
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd intelligent-leetcode-analyzer
```

---

## Backend Setup

Navigate to backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create `.env`

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Run backend:

```bash
npm start
```

Backend runs on:

```text
http://localhost:5000
```

---

## Frontend Setup

Navigate to dashboard:

```bash
cd dashboard
```

Install dependencies:

```bash
npm install
```

Create `.env`

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ML_URL=http://localhost:8000
```

Start frontend:

```bash
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

---

## ML Service Setup

Navigate to ML service:

```bash
cd ml-service
```

Create virtual environment:

```bash
python -m venv venv
```

Activate environment:

Windows:

```bash
venv\Scripts\activate
```

Linux/Mac:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run FastAPI service:

```bash
uvicorn app:app --reload
```

ML Service runs on:

```text
http://localhost:8000
```

---

## API Endpoints

### Store Submission

```http
POST /api/submissions
```

### Get User Analytics

```http
GET /api/analytics/:userId
```

### Train Model

```http
POST /train
```

### Predict Performance

```http
POST /predict
```

---

## Machine Learning Workflow

1. Retrieve submission history from MongoDB.
2. Extract performance features.
3. Train XGBoost model.
4. Generate performance predictions.
5. Return recommendations to frontend dashboard.

---

## Deployment

### Frontend

Deploy using:

* Vercel
* Netlify

### Backend

Deploy using:

* Render
* Railway

### ML Service

Deploy using:

* Render
* Railway

### Database

* MongoDB Atlas

---

## Future Enhancements

* Real-time LeetCode API integration
* Personalized learning roadmap
* Interview readiness score
* Contest performance analysis
* AI-generated coding recommendations
* Resume and coding profile insights

---

## Contributors

Developed as an AI-powered coding analytics platform using MERN Stack and Machine Learning.

---

## License

This project is intended for educational and research purposes.
