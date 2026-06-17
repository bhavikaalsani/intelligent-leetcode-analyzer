# Deployment

This project has three deployable services:

1. `dashboard`: React static site.
2. `backend`: Express API.
3. `ml-service`: FastAPI prediction service.

## Backend

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Environment variables:

```bash
MONGO_URI=your_mongodb_connection_string
ML_SERVICE_URL=https://your-ml-service-url
CORS_ORIGINS=https://your-dashboard-url,http://localhost:3000
PORT=5000
```

## ML Service

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
python -m uvicorn app:app --host 0.0.0.0 --port $PORT
```

Environment variables:

```bash
PYTHON_VERSION=3.11.9
MONGO_URI=your_mongodb_connection_string
CORS_ORIGINS=https://your-dashboard-url,http://localhost:3000
```

## Dashboard

Build command:

```bash
npm install && npm run build
```

Publish directory:

```bash
build
```

Environment variables:

```bash
REACT_APP_API_URL=https://your-backend-url
```

The dashboard calls the backend only. The backend calls the ML service with `ML_SERVICE_URL`, which avoids exposing an internal ML URL to the browser.
