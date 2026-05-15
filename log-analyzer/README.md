# 🔍 AI Log Analyzer & Monitoring System

A real-time log analysis and monitoring dashboard powered by AI. Automatically detects anomalies, classifies log events, and provides AI-driven incident diagnosis using Claude AI.

---

## 🚀 Features

- **Real-Time Log Stream** — Live log ingestion with color-coded severity levels
- **Anomaly Detection Engine** — Automatically detects brute force attacks, CPU spikes, high error rates, and more
- **System Health Score** — Dynamic health percentage calculated from error/critical event weightings
- **AI Incident Analysis** — One-click AI-powered root cause analysis and remediation steps
- **Log File Upload** — Upload your own `.log` or `.txt` files for instant analysis
- **Live Simulation** — Simulate real-time log streaming directly in the browser

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| AI Engine | Claude AI (Anthropic API) |
| Styling | CSS-in-JS |
| Build Tool | Create React App |

---

## ⚡ How to Run

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
log-analyzer/
├── src/
│   ├── index.js          # React entry point
│   └── LogAnalyzer.jsx   # Main application component
├── public/
│   └── index.html
├── samples/
│   └── sample.log        # Sample log file for testing
└── package.json
```

---

## 🤖 AI Analysis

Click the **"Run AI Analysis"** button on the dashboard to get:
- **Diagnosis** — What is happening in the system
- **Root Cause** — Why it is happening
- **Immediate Actions** — Step-by-step remediation guide

You can also upload your own log file using the upload area above the button.

---

## 👩‍💻 Author

**Seema Mukhiya** — DevOps & AI Engineer  
[LinkedIn](https://linkedin.com/in/seema-mukhiya-887918233) · [GitHub](https://github.com/Seema1406)
