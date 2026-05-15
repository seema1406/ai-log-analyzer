import { useState, useEffect, useRef } from "react";

const SAMPLE_LOGS = [
  "[2026-05-15 08:01:23] INFO  app.server    - Server started on port 3000",
  "[2026-05-15 08:01:45] INFO  app.db        - Database connection established",
  "[2026-05-15 08:03:12] WARN  app.auth      - Failed login attempt for user: admin@example.com",
  "[2026-05-15 08:05:34] ERROR app.api       - NullPointerException at /api/users line 142",
  "[2026-05-15 08:06:01] INFO  app.server    - GET /api/health 200 12ms",
  "[2026-05-15 08:07:45] WARN  app.memory    - Memory usage at 78% - threshold approaching",
  "[2026-05-15 08:08:23] ERROR app.db        - Connection timeout after 30s - retrying (1/3)",
  "[2026-05-15 08:09:10] INFO  app.cache     - Cache hit ratio: 94.2%",
  "[2026-05-15 08:10:55] CRITICAL app.security - Brute force detected: 50 failed attempts from 192.168.1.105",
  "[2026-05-15 08:11:30] ERROR app.api       - 500 Internal Server Error /api/orders",
  "[2026-05-15 08:12:15] INFO  app.server    - POST /api/login 200 45ms",
  "[2026-05-15 08:13:44] WARN  app.disk      - Disk usage at 85% on /var/log",
  "[2026-05-15 08:14:20] INFO  app.backup    - Daily backup completed successfully",
  "[2026-05-15 08:15:33] ERROR app.network   - Connection refused to microservice-payments:8080",
  "[2026-05-15 08:16:10] CRITICAL app.server  - CPU spike detected: 98% utilization for 60s",
  "[2026-05-15 08:17:45] INFO  app.auth      - User token refreshed: user_8821",
  "[2026-05-15 08:18:22] WARN  app.api       - Slow query detected: 4.2s on /api/reports",
  "[2026-05-15 08:19:05] ERROR app.db        - Deadlock detected in transaction pool",
  "[2026-05-15 08:20:30] INFO  app.server    - Deployment v2.4.1 completed",
  "[2026-05-15 08:21:15] WARN  app.auth      - JWT token expiring soon for 12 sessions",
];

function parseLog(line) {
  const match = line.match(/\[(.+?)\]\s+(INFO|WARN|ERROR|CRITICAL)\s+(\S+)\s+-\s+(.+)/);
  if (!match) return null;
  return { timestamp: match[1], level: match[2], source: match[3], message: match[4], raw: line };
}

function detectAnomalies(logs) {
  const anomalies = [];
  const errorCount = logs.filter(l => l.level === "ERROR" || l.level === "CRITICAL").length;
  const criticals = logs.filter(l => l.level === "CRITICAL");
  const warnCount = logs.filter(l => l.level === "WARN").length;

  if (criticals.length > 0) {
    criticals.forEach(c => anomalies.push({ type: "CRITICAL", message: c.message, source: c.source, time: c.timestamp }));
  }
  if (errorCount > 3) {
    anomalies.push({ type: "HIGH_ERROR_RATE", message: `${errorCount} errors detected — investigate immediately`, source: "Anomaly Engine", time: "Now" });
  }
  if (warnCount > 4) {
    anomalies.push({ type: "WARN_SPIKE", message: `${warnCount} warnings in log batch — system stress likely`, source: "Anomaly Engine", time: "Now" });
  }
  const bruteForce = logs.find(l => l.message.toLowerCase().includes("brute force"));
  if (bruteForce) {
    anomalies.push({ type: "SECURITY", message: "Brute force attack pattern detected!", source: "Security Monitor", time: bruteForce.timestamp });
  }
  return anomalies;
}

const levelColor = { INFO: "#22d3a5", WARN: "#f59e0b", ERROR: "#f43f5e", CRITICAL: "#c026d3" };
const levelBg = { INFO: "#0f2922", WARN: "#2a1f08", ERROR: "#2a0a10", CRITICAL: "#1e0a24" };

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Sora:wght@300;500;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080d14; color: #c8d8e8; font-family: 'Sora', sans-serif; }

  .app { min-height: 100vh; background: #080d14; padding: 24px; }

  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #1a2535; }
  .header-icon { width: 42px; height: 42px; background: linear-gradient(135deg, #00f5a0, #00d9f5); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .header-title { font-size: 22px; font-weight: 700; color: #e8f4ff; letter-spacing: -0.5px; }
  .header-sub { font-size: 12px; color: #4a6080; margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
  .live-badge { margin-left: auto; display: flex; align-items: center; gap: 6px; background: #0f2218; border: 1px solid #22d3a5; border-radius: 20px; padding: 5px 12px; font-size: 11px; color: #22d3a5; font-family: 'JetBrains Mono', monospace; }
  .live-dot { width: 7px; height: 7px; background: #22d3a5; border-radius: 50%; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }

  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .stat-card { background: #0d1520; border: 1px solid #1a2535; border-radius: 14px; padding: 18px; position: relative; overflow: hidden; transition: border-color 0.2s; }
  .stat-card:hover { border-color: #2a3a50; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .stat-card.info::before { background: #22d3a5; }
  .stat-card.warn::before { background: #f59e0b; }
  .stat-card.error::before { background: #f43f5e; }
  .stat-card.critical::before { background: #c026d3; }
  .stat-label { font-size: 11px; color: #4a6080; text-transform: uppercase; letter-spacing: 1px; font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }
  .stat-value { font-size: 32px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
  .stat-card.info .stat-value { color: #22d3a5; }
  .stat-card.warn .stat-value { color: #f59e0b; }
  .stat-card.error .stat-value { color: #f43f5e; }
  .stat-card.critical .stat-value { color: #c026d3; }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

  .panel { background: #0d1520; border: 1px solid #1a2535; border-radius: 14px; overflow: hidden; }
  .panel-header { padding: 14px 18px; border-bottom: 1px solid #1a2535; display: flex; align-items: center; justify-content: space-between; }
  .panel-title { font-size: 13px; font-weight: 600; color: #8ab4d4; text-transform: uppercase; letter-spacing: 0.8px; font-family: 'JetBrains Mono', monospace; }
  .panel-body { padding: 16px; }

  .anomaly-item { display: flex; gap: 12px; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid; animation: slideIn 0.3s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  .anomaly-item.CRITICAL { background: #1e0a24; border-color: #6b0d7a; }
  .anomaly-item.HIGH_ERROR_RATE { background: #2a0a10; border-color: #7a1020; }
  .anomaly-item.WARN_SPIKE { background: #2a1f08; border-color: #7a5008; }
  .anomaly-item.SECURITY { background: #1a0a2a; border-color: #6020b0; }
  .anomaly-badge { font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding: 2px 7px; border-radius: 4px; height: fit-content; white-space: nowrap; }
  .anomaly-item.CRITICAL .anomaly-badge { background: #c026d3; color: #fff; }
  .anomaly-item.HIGH_ERROR_RATE .anomaly-badge { background: #f43f5e; color: #fff; }
  .anomaly-item.WARN_SPIKE .anomaly-badge { background: #f59e0b; color: #000; }
  .anomaly-item.SECURITY .anomaly-badge { background: #7c3aed; color: #fff; }
  .anomaly-msg { font-size: 12px; color: #c8d8e8; line-height: 1.5; }
  .anomaly-src { font-size: 10px; color: #4a6080; font-family: 'JetBrains Mono', monospace; margin-top: 2px; }

  .chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 100px; padding: 0 4px; }
  .bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .bar { width: 100%; border-radius: 3px 3px 0 0; transition: height 0.5s ease; min-height: 2px; }
  .bar-label { font-size: 9px; color: #4a6080; font-family: 'JetBrains Mono', monospace; }

  .log-stream { font-family: 'JetBrains Mono', monospace; font-size: 11px; max-height: 340px; overflow-y: auto; }
  .log-stream::-webkit-scrollbar { width: 4px; }
  .log-stream::-webkit-scrollbar-track { background: #0d1520; }
  .log-stream::-webkit-scrollbar-thumb { background: #1a2535; border-radius: 2px; }
  .log-line { display: flex; gap: 10px; padding: 5px 8px; border-radius: 5px; margin-bottom: 2px; align-items: flex-start; transition: background 0.15s; }
  .log-line:hover { background: #111d2a; }
  .log-time { color: #2a4060; white-space: nowrap; font-size: 10px; padding-top: 1px; }
  .log-level { font-weight: 700; min-width: 58px; font-size: 10px; padding-top: 1px; }
  .log-source { color: #3a6080; min-width: 90px; font-size: 10px; padding-top: 1px; }
  .log-msg { color: #a8c0d8; flex: 1; line-height: 1.5; }

  .filter-row { display: flex; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #1a2535; flex-wrap: wrap; }
  .filter-btn { padding: 4px 12px; border-radius: 20px; border: 1px solid #1a2535; background: transparent; color: #4a6080; font-size: 11px; font-family: 'JetBrains Mono', monospace; cursor: pointer; transition: all 0.15s; }
  .filter-btn:hover { border-color: #2a3a50; color: #8ab4d4; }
  .filter-btn.active-INFO { border-color: #22d3a5; color: #22d3a5; background: #0f2922; }
  .filter-btn.active-WARN { border-color: #f59e0b; color: #f59e0b; background: #2a1f08; }
  .filter-btn.active-ERROR { border-color: #f43f5e; color: #f43f5e; background: #2a0a10; }
  .filter-btn.active-CRITICAL { border-color: #c026d3; color: #c026d3; background: #1e0a24; }
  .filter-btn.active-ALL { border-color: #8ab4d4; color: #8ab4d4; background: #0d1a28; }

  .upload-area { border: 2px dashed #1a2535; border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; }
  .upload-area:hover { border-color: #22d3a5; background: #0f1e18; }
  .upload-text { font-size: 13px; color: #4a6080; }
  .upload-text span { color: #22d3a5; }

  .ai-btn { background: linear-gradient(135deg, #00f5a0, #00d9f5); border: none; border-radius: 8px; padding: 10px 20px; color: #080d14; font-weight: 700; font-size: 13px; cursor: pointer; font-family: 'Sora', sans-serif; transition: opacity 0.2s; width: 100%; margin-top: 10px; }
  .ai-btn:hover { opacity: 0.88; }
  .ai-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .ai-response { background: #0a1a10; border: 1px solid #1a3a28; border-radius: 10px; padding: 14px; margin-top: 12px; font-size: 12px; line-height: 1.8; color: #90d4b8; font-family: 'JetBrains Mono', monospace; white-space: pre-wrap; }

  .health-ring { display: flex; justify-content: center; align-items: center; height: 120px; }
  .ring-wrap { position: relative; width: 100px; height: 100px; }
  .ring-label { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
  .ring-pct { font-size: 22px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #22d3a5; }
  .ring-sub { font-size: 9px; color: #4a6080; }

  .no-anomaly { text-align: center; padding: 24px; color: #2a4060; font-size: 12px; font-family: 'JetBrains Mono', monospace; }

  .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid #080d14; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px; vertical-align: middle; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function LogAnalyzer() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [anomalies, setAnomalies] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    const parsed = SAMPLE_LOGS.map(parseLog).filter(Boolean);
    setLogs(parsed);
    setAnomalies(detectAnomalies(parsed));
  }, []);

  useEffect(() => {
    if (!streaming) return;
    let i = 0;
    const interval = setInterval(() => {
      const newLog = {
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        level: ["INFO", "INFO", "INFO", "WARN", "ERROR"][Math.floor(Math.random() * 5)],
        source: ["app.server", "app.db", "app.api", "app.auth"][Math.floor(Math.random() * 4)],
        message: ["Request processed in 12ms", "Cache miss for key user_9982", "Slow query: 3.1s", "Rate limit applied to 10.0.0.5", "Service responded 200 OK"][Math.floor(Math.random() * 5)],
        raw: ""
      };
      setLogs(prev => {
        const updated = [...prev, newLog].slice(-50);
        setAnomalies(detectAnomalies(updated));
        return updated;
      });
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
      if (++i > 30) { clearInterval(interval); setStreaming(false); }
    }, 1200);
    streamRef.current = interval;
    return () => clearInterval(interval);
  }, [streaming]);

  const counts = { INFO: 0, WARN: 0, ERROR: 0, CRITICAL: 0 };
  logs.forEach(l => counts[l.level] = (counts[l.level] || 0) + 1);
  const total = logs.length || 1;
  const healthScore = Math.max(0, Math.round(100 - ((counts.ERROR * 5 + counts.CRITICAL * 15 + counts.WARN * 1) / total) * 100));

  const filtered = filter === "ALL" ? logs : logs.filter(l => l.level === filter);

  const maxCount = Math.max(...Object.values(counts), 1);
  const barData = [
    { label: "INFO", count: counts.INFO, color: "#22d3a5" },
    { label: "WARN", count: counts.WARN, color: "#f59e0b" },
    { label: "ERROR", count: counts.ERROR, color: "#f43f5e" },
    { label: "CRIT", count: counts.CRITICAL, color: "#c026d3" },
  ];

  async function runAiAnalysis() {
    setAiLoading(true);
    setAiAnalysis("");
    const summary = `Log batch: ${total} total. INFO: ${counts.INFO}, WARN: ${counts.WARN}, ERROR: ${counts.ERROR}, CRITICAL: ${counts.CRITICAL}. System health score: ${healthScore}%. Anomalies found: ${anomalies.length}. Key issues: ${anomalies.map(a => a.message).join("; ")}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are an expert DevOps SRE AI assistant. Analyze log data and provide concise incident diagnosis, root cause assessment, and actionable remediation steps. Format your response with clear sections: DIAGNOSIS, ROOT CAUSE, and IMMEDIATE ACTIONS. Keep it technical and actionable.",
          messages: [{ role: "user", content: `Analyze this log summary and provide incident response guidance:\n\n${summary}` }]
        })
      });
      const data = await res.json();
      setAiAnalysis(data.content?.[0]?.text || "No analysis returned.");
    } catch {
      setAiAnalysis("⚠️ AI analysis unavailable. Check your connection.");
    }
    setAiLoading(false);
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split("\n").filter(Boolean);
      const parsed = lines.map(parseLog).filter(Boolean);
      if (parsed.length > 0) {
        setLogs(parsed);
        setAnomalies(detectAnomalies(parsed));
        setAiAnalysis("");
      }
    };
    reader.readAsText(file);
  }

  const circumference = 2 * Math.PI * 40;
  const strokeDash = circumference * (healthScore / 100);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <div className="header-icon">🔍</div>
          <div>
            <div className="header-title">AI Log Analyzer & Monitoring System</div>
            <div className="header-sub">anomaly_detection_engine v1.0 · python_backend · real_time</div>
          </div>
          <div className="live-badge">
            <div className="live-dot" />
            MONITORING
          </div>
        </div>

        <div className="stats-grid">
          {[["INFO", "info", "✅"], ["WARN", "warn", "⚠️"], ["ERROR", "error", "❌"], ["CRITICAL", "critical", "🚨"]].map(([lvl, cls, icon]) => (
            <div key={lvl} className={`stat-card ${cls}`}>
              <div className="stat-label">{icon} {lvl} events</div>
              <div className="stat-value">{counts[lvl] || 0}</div>
            </div>
          ))}
        </div>

        <div className="grid2">
          {/* Anomaly Panel */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">⚡ Anomaly Alerts</span>
              <span style={{ fontSize: 11, color: "#f43f5e", fontFamily: "JetBrains Mono" }}>{anomalies.length} detected</span>
            </div>
            <div className="panel-body" style={{ maxHeight: 260, overflowY: "auto" }}>
              {anomalies.length === 0
                ? <div className="no-anomaly">✓ No anomalies detected</div>
                : anomalies.map((a, i) => (
                  <div key={i} className={`anomaly-item ${a.type}`}>
                    <span className="anomaly-badge">{a.type.replace("_", " ")}</span>
                    <div>
                      <div className="anomaly-msg">{a.message}</div>
                      <div className="anomaly-src">{a.source} · {a.time}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Chart + Health */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">📊 Log Distribution</span>
              <span style={{ fontSize: 11, color: "#4a6080", fontFamily: "JetBrains Mono" }}>{total} total</span>
            </div>
            <div className="panel-body" style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <div className="chart-bars" style={{ flex: 1 }}>
                {barData.map(b => (
                  <div key={b.label} className="bar-group">
                    <div className="bar" style={{ height: `${(b.count / maxCount) * 80}px`, background: b.color, opacity: 0.85 }} />
                    <div className="bar-label">{b.label}</div>
                    <div className="bar-label" style={{ color: b.color }}>{b.count}</div>
                  </div>
                ))}
              </div>
              <div className="health-ring">
                <div className="ring-wrap">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1a2535" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={healthScore > 70 ? "#22d3a5" : healthScore > 40 ? "#f59e0b" : "#f43f5e"} strokeWidth="8"
                      strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
                  </svg>
                  <div className="ring-label">
                    <div className="ring-pct" style={{ color: healthScore > 70 ? "#22d3a5" : healthScore > 40 ? "#f59e0b" : "#f43f5e" }}>{healthScore}%</div>
                    <div className="ring-sub">HEALTH</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Log Stream */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <span className="panel-title">📋 Live Log Stream</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStreaming(s => !s)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${streaming ? "#f43f5e" : "#22d3a5"}`, background: "transparent", color: streaming ? "#f43f5e" : "#22d3a5", fontSize: 11, cursor: "pointer", fontFamily: "JetBrains Mono" }}>
                {streaming ? "⏹ Stop" : "▶ Simulate"}
              </button>
            </div>
          </div>
          <div className="filter-row">
            {["ALL", "INFO", "WARN", "ERROR", "CRITICAL"].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? `active-${f}` : ""}`} onClick={() => setFilter(f)}>{f} {f !== "ALL" ? `(${counts[f] || 0})` : `(${total})`}</button>
            ))}
          </div>
          <div className="log-stream" style={{ padding: 12 }}>
            {filtered.map((l, i) => (
              <div key={i} className="log-line">
                <span className="log-time">{l.timestamp.slice(11)}</span>
                <span className="log-level" style={{ color: levelColor[l.level] }}>{l.level}</span>
                <span className="log-source">{l.source}</span>
                <span className="log-msg" style={{ background: levelBg[l.level], padding: "0 4px", borderRadius: 3 }}>{l.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* AI Analysis */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">🤖 AI Incident Analysis</span>
          </div>
          <div className="panel-body">
            <label className="upload-area">
              <input type="file" accept=".log,.txt" style={{ display: "none" }} onChange={handleFileUpload} />
              <div className="upload-text">📁 Drop your <span>.log</span> or <span>.txt</span> file here, or click to upload</div>
            </label>
            <button className="ai-btn" onClick={runAiAnalysis} disabled={aiLoading}>
              {aiLoading ? <><span className="spinner" />Analyzing logs...</> : "⚡ Run AI Analysis"}
            </button>
            {aiAnalysis && <div className="ai-response">{aiAnalysis}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
