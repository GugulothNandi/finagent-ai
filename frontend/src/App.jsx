import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const API = "http://localhost:5000";

const agentSteps = [
  {
    key: "research",
    label: "Research Agent",
    icon: "🔍",
    desc: "Scanning company data...",
  },
  {
    key: "financial",
    label: "Financial Agent",
    icon: "💰",
    desc: "Analyzing financials...",
  },
  {
    key: "market",
    label: "Market Agent",
    icon: "🌏",
    desc: "Evaluating market...",
  },
  { key: "risk", label: "Risk Agent", icon: "⚠️", desc: "Assessing risks..." },
  {
    key: "report",
    label: "Report Generator",
    icon: "📄",
    desc: "Compiling report...",
  },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("report");
  const [currentQuery, setCurrentQuery] = useState("");
  const [stockData, setStockData] = useState([]);
  const [realFinancials, setRealFinancials] = useState(null);

  // Auth state
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || "",
  );
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (token) fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${API}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(data);
    } catch {}
  };

  const handleAuth = async () => {
    setAuthError("");
    try {
      const endpoint = authMode === "login" ? "/api/login" : "/api/signup";
      const { data } = await axios.post(`${API}${endpoint}`, authForm);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name);
      setToken(data.token);
      setUserName(data.name);
    } catch (err) {
      setAuthError(err.response?.data?.error || "Auth failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setToken("");
    setUserName("");
    setHistory([]);
    setReport(null);
  };

  const analyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setReport(null);
    setSections(null);
    setStockData([]);
    setRealFinancials(null);
    setCurrentQuery(query);
    setActiveTab("report");

    for (let i = 0; i < agentSteps.length; i++) {
      setActiveStep(i);
      await new Promise((r) => setTimeout(r, 700));
    }

    try {
      const [reportRes, stockHistoryRes, realFinancialsRes] = await Promise.all(
        [
          axios.post(
            `${API}/api/analyze`,
            { query },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ),
          axios.post(`http://localhost:8000/stockhistory`, { query }),
          axios.post(`http://localhost:8000/realfinancials`, { query }),
        ],
      );

      setReport(reportRes.data.report);
      setSections(reportRes.data.sections);
      // stockhistory -> { ticker, data: [...] }
      setStockData(stockHistoryRes.data.data || []);
      // realfinancials -> { price, revenue, pe_ratio, market_cap, ... }
      setRealFinancials(realFinancialsRes.data);
      fetchHistory();
    } catch {
      setError("Analysis failed. Make sure all services are running.");
    }
    setLoading(false);
    setActiveStep(-1);
  };

  const downloadPDF = async () => {
    try {
      const response = await axios.post(
        `${API}/api/pdf`,
        { report, query: currentQuery },
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "research-report.pdf";
      a.click();
    } catch {
      alert("PDF download failed.");
    }
  };

  const loadReport = (item) => {
    setReport(item.report);
    setCurrentQuery(item.query);
    setSections(item.sections);
    setActiveTab("report");
  };

  // Format large numbers
  const fmt = (n) => {
    if (!n) return "N/A";
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n}`;
  };

  // Auth screen
  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.authWrap}>
          <div style={styles.authCard}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={styles.logoIcon}>◈</div>
              <h1 style={styles.authTitle}>FinAgent</h1>
              <p style={styles.authSub}>AI-Powered Investment Research</p>
            </div>

            <div style={styles.authTabs}>
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  onClick={() => setAuthMode(m)}
                  style={{
                    ...styles.authTab,
                    ...(authMode === m ? styles.authTabActive : {}),
                  }}
                >
                  {m === "login" ? "Login" : "Sign Up"}
                </button>
              ))}
            </div>

            {authMode === "signup" && (
              <input
                placeholder="Full Name"
                value={authForm.name}
                onChange={(e) =>
                  setAuthForm({ ...authForm, name: e.target.value })
                }
                style={styles.authInput}
              />
            )}
            <input
              placeholder="Email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
              style={styles.authInput}
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              style={styles.authInput}
            />

            {authError && <p style={styles.authError}>{authError}</p>}

            <button onClick={handleAuth} style={styles.authBtn}>
              {authMode === "login" ? "Login →" : "Create Account →"}
            </button>

            <p
              style={{
                textAlign: "center",
                color: "#475569",
                fontSize: 13,
                marginTop: 16,
              }}
            >
              {authMode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <span
                style={{ color: "#6366f1", cursor: "pointer" }}
                onClick={() =>
                  setAuthMode(authMode === "login" ? "signup" : "login")
                }
              >
                {authMode === "login" ? "Sign Up" : "Login"}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={styles.menuBtn}
            >
              ☰
            </button>
            <span style={styles.logoIcon2}>◈</span>
            <span style={styles.logoText}>FinAgent</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={styles.badge}>Multi-Agent AI Research</span>
            <span style={{ color: "#94a3b8", fontSize: 14 }}>
              👤 {userName}
            </span>
            <button onClick={logout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        {sidebarOpen && (
          <aside style={styles.sidebar}>
            <div style={styles.sidebarTitle}>
              <span style={{ color: "#6366f1" }}>◆</span> REPORT HISTORY
            </div>
            {history.length === 0 && (
              <div style={styles.sidebarEmpty}>
                No reports yet. Run your first analysis!
              </div>
            )}
            {history.map((item) => (
              <div
                key={item._id}
                style={styles.historyItem}
                onClick={() => loadReport(item)}
              >
                <div style={styles.historyQuery}>{item.query}</div>
                <div style={styles.historyDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </aside>
        )}

        {/* Main */}
        <main style={styles.main}>
          {/* Search */}
          <div style={styles.searchSection}>
            <p style={styles.eyebrow}>Multi-Agent Analysis</p>
            <h1 style={styles.heroTitle}>
              Investment Research <span style={styles.accent}>in seconds</span>
            </h1>
            <div style={styles.searchBox}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && analyze()}
                placeholder="e.g. Should Tesla invest in India?"
                style={styles.input}
                disabled={loading}
              />
              <button
                onClick={analyze}
                disabled={loading}
                style={{
                  ...styles.btn,
                  ...(loading ? styles.btnDisabled : {}),
                }}
              >
                {loading ? "Analyzing..." : "Analyze →"}
              </button>
            </div>
            <div style={styles.chips}>
              {["Analyze Tesla", "Amazon investment", "Apple vs Microsoft"].map(
                (q) => (
                  <button
                    key={q}
                    style={styles.chip}
                    onClick={() => setQuery(q)}
                  >
                    {q}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Agent Progress */}
          {loading && (
            <div style={styles.agentGrid}>
              {agentSteps.map((step, i) => (
                <div
                  key={step.key}
                  style={{
                    ...styles.agentCard,
                    ...(i === activeStep ? styles.agentActive : {}),
                    ...(i < activeStep ? styles.agentDone : {}),
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>
                    {step.icon}
                  </div>
                  <div style={styles.agentLabel}>{step.label}</div>
                  <div style={styles.agentDesc}>
                    {i < activeStep
                      ? "✓ Done"
                      : i === activeStep
                        ? step.desc
                        : "Waiting..."}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          {/* Results */}
          {report && (
            <div>
              {/* Real data cards */}
              {realFinancials && realFinancials.price && (
                <div style={styles.dataGrid}>
                  {[
                    {
                      label: "Stock Price",
                      value: `$${realFinancials.price}`,
                      color: "#6366f1",
                    },
                    {
                      label: "Market Cap",
                      value: fmt(realFinancials.market_cap),
                      color: "#10b981",
                    },
                    {
                      label: "Revenue",
                      value: fmt(realFinancials.revenue),
                      color: "#3b82f6",
                    },
                    {
                      label: "P/E Ratio",
                      value: realFinancials.pe_ratio?.toFixed(2) || "N/A",
                      color: "#f59e0b",
                    },
                    {
                      label: "52W High",
                      value: `$${realFinancials["52week_high"]}`,
                      color: "#8b5cf6",
                    },
                    {
                      label: "Analyst",
                      value:
                        realFinancials.recommendation
                          ?.toUpperCase()
                          .replace(/_/g, " ") || "N/A",
                      color: "#ec4899",
                    },
                  ].map((d) => (
                    <div
                      key={d.label}
                      style={{
                        ...styles.dataCard,
                        borderTop: `3px solid ${d.color}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          marginBottom: 6,
                        }}
                      >
                        {d.label}
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: d.color,
                        }}
                      >
                        {d.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div style={styles.tabs}>
                {["report", "charts"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      ...styles.tab,
                      ...(activeTab === tab ? styles.tabActive : {}),
                    }}
                  >
                    {tab === "report" ? "📄 Report" : "📊 Charts"}
                  </button>
                ))}
                <button onClick={downloadPDF} style={styles.pdfBtn}>
                  ⬇ Download PDF
                </button>
              </div>

              {/* Report Tab */}
              {activeTab === "report" && (
                <div style={styles.reportCard}>
                  <div style={styles.reportHeader}>
                    <h2 style={styles.reportTitle}>Research Report</h2>
                    <span style={styles.reportBadge}>AI Generated</span>
                  </div>
                  <div style={styles.divider} />
                  <div style={styles.reportBody}>
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Charts Tab */}
              {activeTab === "charts" && (
                <div style={{ display: "grid", gap: 24 }}>
                  {/* Stock Price Chart */}
                  {stockData.length > 0 && (
                    <div style={styles.chartCard}>
                      <h3 style={styles.chartTitle}>
                        📈 1 Year Stock Price History
                      </h3>
                      <div style={styles.divider} />
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={stockData.filter((_, i) => i % 5 === 0)}
                        >
                          <XAxis
                            dataKey="date"
                            stroke="#475569"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(d) => d.slice(5)}
                          />
                          <YAxis
                            stroke="#475569"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => `$${v}`}
                          />
                          <Tooltip
                            formatter={(v) => [`$${v}`, "Price"]}
                            contentStyle={{
                              background: "#1e293b",
                              border: "1px solid #334155",
                              borderRadius: 8,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#6366f1"
                            dot={false}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Financial Metrics */}
                  {realFinancials && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 24,
                      }}
                    >
                      {/* Key Metrics Bar Chart */}
                      <div style={styles.chartCard}>
                        <h3 style={styles.chartTitle}>
                          💰 Key Financial Metrics
                        </h3>
                        <div style={styles.divider} />
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart
                            data={[
                              {
                                name: "Revenue",
                                value: (realFinancials.revenue || 0) / 1e9,
                              },
                              {
                                name: "Profit",
                                value: (realFinancials.profit || 0) / 1e9,
                              },
                              {
                                name: "Mkt Cap",
                                value: (realFinancials.market_cap || 0) / 1e9,
                              },
                            ]}
                          >
                            <XAxis dataKey="name" stroke="#475569" />
                            <YAxis
                              stroke="#475569"
                              tickFormatter={(v) => `$${v}B`}
                            />
                            <Tooltip
                              formatter={(v) => [`$${v.toFixed(2)}B`]}
                              contentStyle={{
                                background: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: 8,
                              }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                              {["#6366f1", "#10b981", "#3b82f6"].map((c, i) => (
                                <Cell key={i} fill={c} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* 52 Week Range */}
                      <div style={styles.chartCard}>
                        <h3 style={styles.chartTitle}>
                          📊 52 Week Price Range
                        </h3>
                        <div style={styles.divider} />
                        <div style={{ padding: "20px 0" }}>
                          {realFinancials["52week_low"] &&
                            realFinancials["52week_high"] && (
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 12,
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "#ef4444",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Low: ${realFinancials["52week_low"]}
                                  </span>
                                  <span
                                    style={{
                                      color: "#10b981",
                                      fontWeight: 600,
                                    }}
                                  >
                                    High: ${realFinancials["52week_high"]}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    background: "#1e293b",
                                    borderRadius: 8,
                                    height: 12,
                                    position: "relative",
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "absolute",
                                      left: `${((realFinancials.price - realFinancials["52week_low"]) / (realFinancials["52week_high"] - realFinancials["52week_low"])) * 100}%`,
                                      top: -4,
                                      width: 20,
                                      height: 20,
                                      background: "#6366f1",
                                      borderRadius: "50%",
                                      transform: "translateX(-50%)",
                                      border: "3px solid #818cf8",
                                    }}
                                  />
                                  <div
                                    style={{
                                      background:
                                        "linear-gradient(to right, #ef4444, #10b981)",
                                      borderRadius: 8,
                                      height: "100%",
                                    }}
                                  />
                                </div>
                                <div
                                  style={{ textAlign: "center", marginTop: 20 }}
                                >
                                  <span
                                    style={{
                                      color: "#6366f1",
                                      fontSize: 24,
                                      fontWeight: 700,
                                    }}
                                  >
                                    ${realFinancials.price}
                                  </span>
                                  <p
                                    style={{
                                      color: "#64748b",
                                      fontSize: 13,
                                      marginTop: 4,
                                    }}
                                  >
                                    Current Price
                                  </p>
                                </div>

                                {/* Analyst recommendation */}
                                <div
                                  style={{ marginTop: 24, textAlign: "center" }}
                                >
                                  <div
                                    style={{
                                      display: "inline-block",
                                      background:
                                        realFinancials.recommendation === "buy"
                                          ? "#064e3b"
                                          : "#1e1b4b",
                                      border: `2px solid ${realFinancials.recommendation === "buy" ? "#10b981" : "#6366f1"}`,
                                      color:
                                        realFinancials.recommendation === "buy"
                                          ? "#10b981"
                                          : "#818cf8",
                                      padding: "10px 32px",
                                      borderRadius: 8,
                                      fontSize: 18,
                                      fontWeight: 700,
                                    }}
                                  >
                                    Analyst:{" "}
                                    {realFinancials.recommendation
                                      ?.toUpperCase()
                                      .replace(/_/g, " ")}
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e2e8f0",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  authWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  authCard: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: 40,
    width: 400,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 800,
    color: "#f1f5f9",
    margin: "8px 0 4px",
    letterSpacing: "-1px",
  },
  authSub: { color: "#64748b", fontSize: 14, margin: 0 },
  authTabs: {
    display: "flex",
    background: "#0a0a0f",
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  authTab: {
    flex: 1,
    background: "none",
    border: "none",
    color: "#64748b",
    padding: "8px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  authTabActive: { background: "#1e293b", color: "#f1f5f9" },
  authInput: {
    width: "100%",
    background: "#0a0a0f",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#f1f5f9",
    fontSize: 14,
    marginBottom: 12,
    boxSizing: "border-box",
    outline: "none",
  },
  authError: { color: "#ef4444", fontSize: 13, marginBottom: 12 },
  authBtn: {
    width: "100%",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "14px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  header: {
    borderBottom: "1px solid #1e293b",
    background: "rgba(10,10,15,0.9)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  menuBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: 20,
    cursor: "pointer",
  },
  logoIcon: {
    fontSize: 40,
    color: "#6366f1",
    textAlign: "center",
    marginBottom: 8,
  },
  logoIcon2: { fontSize: 20, color: "#6366f1" },
  logoText: { fontSize: 18, fontWeight: 700, color: "#f1f5f9" },
  badge: {
    fontSize: 12,
    color: "#6366f1",
    border: "1px solid #312e81",
    background: "#1e1b4b",
    padding: "4px 12px",
    borderRadius: 20,
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: 6,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
  },
  layout: { display: "flex", minHeight: "calc(100vh - 57px)" },
  sidebar: {
    width: 260,
    background: "#0d1117",
    borderRight: "1px solid #1e293b",
    padding: "24px 16px",
    overflowY: "auto",
    flexShrink: 0,
  },
  sidebarTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  sidebarEmpty: { fontSize: 13, color: "#334155", lineHeight: 1.6 },
  historyItem: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    cursor: "pointer",
  },
  historyQuery: {
    fontSize: 13,
    color: "#e2e8f0",
    marginBottom: 4,
    fontWeight: 500,
  },
  historyDate: { fontSize: 11, color: "#475569" },
  main: { flex: 1, padding: "40px", overflowY: "auto" },
  searchSection: { marginBottom: 32, maxWidth: 800 },
  eyebrow: {
    fontSize: 12,
    color: "#6366f1",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: 800,
    color: "#f1f5f9",
    marginBottom: 24,
    letterSpacing: "-1px",
  },
  accent: { color: "#6366f1" },
  searchBox: {
    display: "flex",
    gap: 10,
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: 6,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: 15,
    color: "#f1f5f9",
    padding: "10px 12px",
  },
  btn: {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnDisabled: { background: "#312e81", cursor: "not-allowed" },
  chips: { display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    background: "#111827",
    border: "1px solid #1e293b",
    color: "#94a3b8",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 12,
    cursor: "pointer",
  },
  agentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
    marginBottom: 32,
  },
  agentCard: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: "16px 12px",
    textAlign: "center",
    transition: "all 0.3s",
  },
  agentActive: {
    border: "1px solid #6366f1",
    background: "#1e1b4b",
    transform: "translateY(-3px)",
  },
  agentDone: { border: "1px solid #10b981", background: "#064e3b22" },
  agentLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#e2e8f0",
    marginBottom: 4,
  },
  agentDesc: { fontSize: 11, color: "#64748b" },
  errorBox: {
    background: "#450a0a",
    border: "1px solid #991b1b",
    color: "#fca5a5",
    borderRadius: 10,
    padding: "14px 20px",
    marginBottom: 24,
  },
  dataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  dataCard: {
    background: "#111827",
    borderRadius: 10,
    padding: "13px 12px",
    textAlign: "center",
    transition: "transform 0.2s ease",
  },
  tabs: { display: "flex", gap: 8, marginBottom: 24, alignItems: "center" },
  tab: {
    background: "#111827",
    border: "1px solid #1e293b",
    color: "#94a3b8",
    borderRadius: 8,
    padding: "8px 20px",
    fontSize: 14,
    cursor: "pointer",
  },
  tabActive: {
    background: "#1e1b4b",
    border: "1px solid #6366f1",
    color: "#818cf8",
  },
  pdfBtn: {
    marginLeft: "auto",
    background: "#064e3b",
    border: "1px solid #10b981",
    color: "#10b981",
    borderRadius: 8,
    padding: "8px 20px",
    fontSize: 14,
    cursor: "pointer",
  },
  reportCard: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: "32px",
  },
  reportHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  reportTitle: { fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  reportBadge: {
    fontSize: 12,
    background: "#1e1b4b",
    color: "#818cf8",
    border: "1px solid #312e81",
    padding: "4px 12px",
    borderRadius: 20,
  },
  divider: { height: 1, background: "#1e293b", marginBottom: 24 },
  reportBody: { color: "#cbd5e1", lineHeight: 1.8, fontSize: 15 },
  chartCard: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: "24px",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: "0 0 16px",
  },
};
