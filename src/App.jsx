import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ── THEME ── "Field Dossier" ──────────────────────────────────────────────
const C = {
  paper: "#F1EAD6",
  paperLine: "#DED1AD",
  panel: "#E9E0C5",
  panelHover: "#E2D7B6",
  ink: "#20231D",
  inkSoft: "#52503F",
  ledger: "#2F5233",
  ledgerDim: "#24401F",
  ledgerFaint: "rgba(47,82,51,0.10)",
  stamp: "#9C2B1F",
  stampFaint: "rgba(156,43,31,0.10)",
  gold: "#8C6A2F",
  muted: "#8A8369",
  border: "#D3C49C",
  borderHover: "#B7A578",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,900&family=Libre+Franklin:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    background:${C.paper};
    background-image: repeating-linear-gradient(180deg, transparent 0px, transparent 27px, ${C.paperLine} 28px);
    color:${C.ink};
    font-family:'Libre Franklin',sans-serif;
    -webkit-font-smoothing:antialiased;
    min-height:100vh;
  }
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes thunk{0%{opacity:0;transform:scale(1.5) rotate(-14deg)}55%{opacity:1;transform:scale(0.92) rotate(-7deg)}75%{transform:scale(1.04) rotate(-7deg)}100%{opacity:1;transform:scale(1) rotate(-7deg)}}
  @keyframes caret{0%,49%{opacity:1}50%,100%{opacity:0}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes scan{0%{background-position:0 -200px}100%{background-position:0 200px}}
  .fade-up{animation:fadeUp 0.5s ease forwards}
  .thunk{animation:thunk 0.5s cubic-bezier(.2,1.4,.5,1) forwards}
  .caret{animation:caret 1s steps(1) infinite}
  .spin{animation:spin 0.9s linear infinite}
  .scan{background:linear-gradient(180deg, transparent, ${C.ledgerFaint}, transparent);background-size:100% 200px;animation:scan 1.6s ease-in-out infinite}
  button{cursor:pointer;border:none;background:none;font-family:inherit}
  textarea,input{outline:none;font-family:inherit}
  textarea{resize:none}

  /* index-card folded corner */
  .idx-card{position:relative}
  .idx-card::after{
    content:"";position:absolute;top:0;right:0;width:0;height:0;
    border-style:solid;border-width:0 13px 13px 0;
    border-color:transparent ${C.paper} transparent transparent;
    filter:drop-shadow(-1px 1px 1px rgba(32,35,29,0.18));
  }

  /* folder tab nav item */
  .tab-item{clip-path:polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)}

  .stamp-seal{
    border:2px solid currentColor;
    border-radius:50%;
    position:relative;
    mix-blend-mode:multiply;
  }
  .stamp-seal::before{
    content:"";position:absolute;inset:5px;border:1px dashed currentColor;border-radius:50%;opacity:0.7;
  }
`;

// ── DATA ─────────────────────────────────────────────────────────────────
const TICKER = ["EV adoption India 2026", "SaaS churn benchmarks", "Gen Z fintech signals", "EdTech TAM SE Asia", "D2C margin analysis", "AI tools SMB market", "Neobank competitive map", "Healthtech trends 2027"];

const QUICK = [
  { label: "EV market India", q: "What is the EV market size in India and key growth drivers in 2026?" },
  { label: "EdTech TAM", q: "Analyze the total addressable market for AI-powered EdTech in India targeting JEE students" },
  { label: "Fintech trends", q: "Top 5 emerging trends in Indian fintech shaping 2027-2030" },
  { label: "Neobank landscape", q: "Competitive landscape of neobanks in Southeast Asia 2026" },
  { label: "D2C growth", q: "What is driving D2C brand growth in Tier 2 and Tier 3 Indian cities?" },
  { label: "AI SaaS pricing", q: "How are B2B SaaS companies pricing AI features in 2026?" },
];

const SECTION_TABS = ["01", "02", "03", "04", "05", "06"];
const INDUSTRIES = ["Fintech", "EdTech", "D2C / Consumer", "SaaS", "Healthtech", "Other"];

const CONFIDENCE_MAP = {
  High: { word: "VERIFIED", color: C.ledger },
  Medium: { word: "PRELIMINARY", color: C.gold },
  Low: { word: "DEVELOPING", color: C.stamp },
};

// ── SMALL COMPONENTS ────────────────────────────────────────────────────
function FileTag({ children, color = C.ledger }) {
  return (
    <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, color, border: `1px solid ${color}55`, background: `${color}12`, borderRadius: 3, padding: "2px 7px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function Seal({ confidence = "High", small = false }) {
  const cfg = CONFIDENCE_MAP[confidence] || CONFIDENCE_MAP.High;
  const size = small ? 64 : 92;
  return (
    <div className="thunk stamp-seal" style={{ width: size, height: size, color: cfg.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-7deg)" }}>
      <div style={{ textAlign: "center", lineHeight: 1.15 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: small ? 9 : 11, letterSpacing: "0.06em" }}>{cfg.word}</div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: small ? 7 : 8, opacity: 0.8, marginTop: 2 }}>ANALYST SEAL</div>
      </div>
    </div>
  );
}

function Spinner({ size = 16, color = C.ledger }) {
  return <div className="spin" style={{ width: size, height: size, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: "50%" }} />;
}

function SkeletonLine({ h = 14, w = "100%", mb = 8 }) {
  return <div className="scan" style={{ height: h, width: w, borderRadius: 2, marginBottom: mb, background: C.panel, border: `1px solid ${C.border}` }} />;
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 30, height: 30, borderRadius: 4, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", color: C.paper, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>MP</div>
      <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em", color: C.ink }}>
        MarketPulse
      </span>
    </div>
  );
}

function TickerBar() {
  const items = [...TICKER, ...TICKER];
  return (
    <div style={{ overflow: "hidden", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.panel, padding: "7px 0" }}>
      <div style={{ display: "flex", gap: 40, whiteSpace: "nowrap", width: "max-content" }}>
        {items.map((t, i) => (
          <span key={i} style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: C.inkSoft, letterSpacing: "0.05em" }}>
            ▸ {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── LANDING ──────────────────────────────────────────────────────────────
function Landing({ onEnter }) {
  const [q, setQ] = useState("");
  const [placeholder, setPlaceholder] = useState(0);
  const textRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setPlaceholder(p => (p + 1) % QUICK.length), 3400);
    return () => clearInterval(t);
  }, []);

  const submit = () => { if (q.trim()) onEnter(q.trim()); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
        <Logo />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onEnter()} style={{ fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", color: C.inkSoft, padding: "8px 14px", border: `1px solid ${C.border}` }}>
            Sign in
          </button>
          <button onClick={() => onEnter()} style={{ fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, color: C.paper, background: C.ink, padding: "8px 16px" }}>
            Open a file →
          </button>
        </div>
      </nav>

      <TickerBar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 20px 36px", textAlign: "center" }}>
        <Seal confidence="High" />

        <h1 className="fade-up" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(30px, 5.6vw, 56px)", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.01em", margin: "22px 0 18px", maxWidth: 760, color: C.ink }}>
          Market research that cost<br />
          <span style={{ textDecoration: `line-through 3px ${C.stamp}80`, textDecorationSkipInk: "none" }}>₹8 lakh.</span>{" "}
          Now it's a <span style={{ color: C.ledger, fontStyle: "italic" }}>filed report</span> for ₹999.
        </h1>

        <p className="fade-up" style={{ fontSize: 16, color: C.inkSoft, marginBottom: 18, maxWidth: 500, lineHeight: 1.65 }}>
          Investor-ready research for Indian founders — TAM/SAM/SOM, competitor strategy, and regulatory exposure. Not a generic answer engine.
        </p>

        <div className="fade-up" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 30 }}>
          <FileTag>🔎 Live web-grounded</FileTag>
          <FileTag color={C.gold}>📊 TAM → SAM → SOM</FileTag>
          <FileTag color={C.stamp}>🇮🇳 RBI/SEBI-aware</FileTag>
        </div>

        {/* "Open a case" index card */}
        <div className="fade-up idx-card" style={{ width: "100%", maxWidth: 620, background: C.panel, border: `1px solid ${C.ink}`, padding: 4, marginBottom: 10, textAlign: "left" }}>
          <div style={{ padding: "13px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>QUERY — TYPE TO OPEN A FILE</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted }}>NO. {String(Date.now()).slice(-4)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
              <input
                ref={textRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder={QUICK[placeholder].q}
                style={{ flex: 1, background: "none", fontSize: 14, color: C.ink, fontFamily: "'IBM Plex Mono',monospace" }}
              />
              <span className="caret" style={{ width: 7, height: 16, background: C.ledger, flexShrink: 0 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button onClick={submit} style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 12, color: C.paper, background: C.ledger, padding: "9px 18px", letterSpacing: "0.04em" }}>
                FILE & ANALYZE →
              </button>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 44 }}>No card required · first 3 files free</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 660, marginBottom: 56 }}>
          {QUICK.map(({ label, q: qv }) => (
            <button key={label} className="idx-card" onClick={() => { setQ(qv); textRef.current?.focus(); }}
              style={{ fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: C.inkSoft, background: C.paper, border: `1px solid ${C.border}`, padding: "7px 16px 7px 12px" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 0, width: "100%", maxWidth: 660, border: `1px solid ${C.border}` }}>
          {[
            { v: "10 min", l: "Avg. turnaround" },
            { v: "$12/mo", l: "Starting price" },
            { v: "40+", l: "Sources cited" },
            { v: "6", l: "Sections per file" },
          ].map(({ v, l }, i) => (
            <div key={l} style={{ padding: "16px 12px", textAlign: "center", borderLeft: i ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: C.ink }}>{v}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, fontFamily: "'IBM Plex Mono',monospace" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "36px 20px", borderTop: `1px solid ${C.border}` }}>
        <p style={{ textAlign: "center", fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: C.muted, letterSpacing: "0.1em", marginBottom: 16 }}>RATE CARD</p>
        <div style={{ display: "flex", gap: 0, justifyContent: "center", flexWrap: "wrap", maxWidth: 660, margin: "0 auto", border: `1px solid ${C.border}` }}>
          {[
            { name: "Free", price: "₹0", note: "3 lifetime files" },
            { name: "Starter", price: "₹999/mo", note: "5 files / month" },
            { name: "Pro", price: "₹2,999/mo", note: "25 files + API", hot: true },
          ].map(({ name, price, note, hot }, i) => (
            <button key={name} onClick={() => onEnter()}
              style={{ flex: 1, minWidth: 150, background: hot ? C.ledgerFaint : "transparent", borderLeft: i ? `1px solid ${C.border}` : "none", padding: "16px 18px", textAlign: "center" }}>
              {hot && <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: C.gold, marginBottom: 6, letterSpacing: "0.08em" }}>★ MOST FILED</div>}
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: "'IBM Plex Mono',monospace" }}>{name}</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: hot ? C.ledger : C.ink, margin: "4px 0" }}>{price}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{note}</div>
            </button>
          ))}
        </div>
      </div>

      <footer style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "center", gap: 20, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: C.muted }}>
        <span>© 2026 MARKETPULSE</span>
        <span>BUILT IN INDIA</span>
        <span>POWERED BY CLAUDE</span>
      </footer>
    </div>
  );
}

// ── REPORT SKELETON ────────────────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ background: C.panel, border: `1px solid ${C.ink}`, padding: 22, marginBottom: 10 }}>
        <SkeletonLine h={10} w="26%" mb={14} />
        <SkeletonLine h={24} w="70%" mb={10} />
        <SkeletonLine h={12} mb={6} />
        <SkeletonLine h={12} w="85%" mb={0} />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: C.paper, border: `1px solid ${C.border}`, padding: 18, marginBottom: 8 }}>
          <SkeletonLine h={14} w="32%" mb={12} />
          <SkeletonLine h={11} mb={6} />
          <SkeletonLine h={11} w="80%" mb={0} />
        </div>
      ))}
      <p style={{ textAlign: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.muted, marginTop: 14, letterSpacing: "0.06em" }}>
        ▸ ANALYST DRAFTING IN PROGRESS…
      </p>
    </div>
  );
}

// ── EXHIBITS (key points + charts) ─────────────────────────────────────
const tickStyle = { fill: C.inkSoft, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" };
const tooltipStyle = { background: C.panel, border: `1px solid ${C.ink}`, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: C.ink, borderRadius: 0 };
const legendStyle = { fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.inkSoft };

function ExhibitFrame({ letter, title, caption, children }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.border}`, padding: "18px 20px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.ledger, fontWeight: 700, flexShrink: 0 }}>EXHIBIT {letter}</span>
        <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 600, color: C.ink }}>{title}</h3>
      </div>
      {caption && <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 12 }}>{caption}</p>}
      {children}
    </div>
  );
}

function KeyTakeaways({ points }) {
  if (!points?.length) return null;
  return (
    <div style={{ borderTop: `1px dashed ${C.border}`, marginTop: 16, paddingTop: 14 }}>
      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.08em", marginBottom: 10 }}>ANALYST'S TOP FINDINGS</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {points.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, color: C.stamp, flexShrink: 0, border: `1px solid ${C.stamp}50`, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
            <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55, fontWeight: 500 }}>{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TamSamSomFunnel({ data }) {
  if (!data?.tam?.valueUsdBn) return null;
  const tamVal = data.tam.valueUsdBn || 1;
  const rows = [
    { key: "tam", label: "TAM", color: C.ledger, ...data.tam },
    { key: "sam", label: "SAM", color: C.ledgerDim, ...data.sam },
    { key: "som", label: "SOM", color: C.gold, ...data.som },
  ].filter(r => r.valueUsdBn != null);

  return (
    <ExhibitFrame letter="A" title="TAM → SAM → SOM Funnel" caption="Total, serviceable, and obtainable market — the framework investors actually ask for">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r) => {
          const widthPct = Math.max(16, Math.min(100, (r.valueUsdBn / tamVal) * 100));
          return (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 36, flexShrink: 0, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, color: r.color }}>{r.label}</span>
              <div style={{ flex: 1, background: `${C.border}50`, height: 32, position: "relative" }}>
                <div style={{ width: `${widthPct}%`, height: "100%", background: r.color, display: "flex", alignItems: "center", paddingLeft: 10, transition: "width 0.4s ease" }}>
                  <span style={{ color: C.paper, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>${r.valueUsdBn}B</span>
                </div>
              </div>
              <span style={{ width: 200, flexShrink: 0, fontSize: 11.5, color: C.muted, lineHeight: 1.4 }}>{r.note}</span>
            </div>
          );
        })}
      </div>
    </ExhibitFrame>
  );
}

function RegulatoryRadar({ items }) {
  if (!items?.length) return null;
  const impactColor = { High: C.stamp, Medium: C.gold, Low: C.ledger };
  return (
    <ExhibitFrame letter="D" title="India Regulatory Radar" caption="Compliance touchpoints that shape go-to-market timing and cost">
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {items.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderLeft: `2px solid ${(impactColor[r.impact] || C.ledger)}80`, paddingLeft: 10 }}>
            <FileTag color={impactColor[r.impact] || C.ledger}>{r.authority}</FileTag>
            <p style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55, flex: 1 }}>{r.requirement}</p>
          </div>
        ))}
      </div>
    </ExhibitFrame>
  );
}

function TamDeltaBanner({ delta }) {
  if (!delta) return null;
  const up = delta.newTam >= delta.priorTam;
  const pct = delta.priorTam ? Math.abs(((delta.newTam - delta.priorTam) / delta.priorTam) * 100).toFixed(0) : 0;
  const dateStr = new Date(delta.priorDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, background: up ? C.ledgerFaint : C.stampFaint, border: `1px solid ${(up ? C.ledger : C.stamp)}40`, padding: "10px 14px", marginBottom: 10, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>
      <span style={{ color: up ? C.ledger : C.stamp, fontWeight: 700 }}>{up ? "▲" : "▼"} TAM {up ? "UP" : "DOWN"} {pct}%</span>
      <span style={{ color: C.inkSoft }}>vs ${delta.priorTam}B filed {dateStr} for this venture</span>
    </div>
  );
}

function buildInvestorMemo(report) {
  const lines = [report.title, "", report.summary, ""];
  if (report.tamSamSom?.tam) {
    lines.push(`TAM: $${report.tamSamSom.tam.valueUsdBn}B — ${report.tamSamSom.tam.note || ""}`);
    if (report.tamSamSom.sam) lines.push(`SAM: $${report.tamSamSom.sam.valueUsdBn}B — ${report.tamSamSom.sam.note || ""}`);
    if (report.tamSamSom.som) lines.push(`SOM: $${report.tamSamSom.som.valueUsdBn}B — ${report.tamSamSom.som.note || ""}`);
    lines.push("");
  }
  if (report.keyTakeaways?.length) {
    lines.push("Key findings:");
    report.keyTakeaways.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    lines.push("");
  }
  if (report.sources?.length) {
    lines.push("Sources:");
    report.sources.forEach((s, i) => lines.push(`[${i + 1}] ${s}`));
  }
  return lines.join("\n");
}

function CompetitorChart({ data }) {
  if (!data?.length) return null;
  const sorted = [...data].sort((a, b) => (b.marketSharePct || 0) - (a.marketSharePct || 0));
  return (
    <ExhibitFrame letter="B" title="Competitive Landscape" caption="Estimated market share by player">
      <ResponsiveContainer width="100%" height={Math.max(160, sorted.length * 40)}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 24, left: 6, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.border} horizontal={false} />
          <XAxis type="number" tick={tickStyle} axisLine={{ stroke: C.border }} tickLine={false} unit="%" />
          <YAxis type="category" dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} width={120} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Market share"]} />
          <Bar dataKey="marketSharePct" fill={C.ledger} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        {sorted.map((c, i) => (
          c.strategy ? (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: C.inkSoft, borderLeft: `2px solid ${C.ledger}50`, paddingLeft: 10 }}>
              <span style={{ fontWeight: 700, color: C.ink, flexShrink: 0 }}>{c.name}:</span> {c.strategy}
            </div>
          ) : null
        ))}
      </div>
    </ExhibitFrame>
  );
}

function FinancialChart({ data }) {
  if (!data?.length) return null;
  return (
    <ExhibitFrame letter="C" title="Segment Economics — Illustrative P&L" caption="Representative revenue, cost & profit trajectory, US$ million (illustrative, not company-specific)">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false} />
          <XAxis dataKey="year" tick={tickStyle} axisLine={{ stroke: C.border }} tickLine={false} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`$${v}M`, n]} />
          <Legend wrapperStyle={legendStyle} />
          <Bar dataKey="revenueUsdM" name="Revenue" fill={C.ledger} />
          <Bar dataKey="costsUsdM" name="Costs" fill={C.stamp} fillOpacity={0.65} />
          <Bar dataKey="profitUsdM" name="Profit" fill={C.gold} />
        </BarChart>
      </ResponsiveContainer>
    </ExhibitFrame>
  );
}

// ── REPORT DISPLAY ──────────────────────────────────────────────────────
function ReportDisplay({ report, tamDelta }) {
  const [copied, setCopied] = useState(false);
  if (!report) return null;
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildInvestorMemo(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error("Clipboard write failed:", e);
    }
  };

  return (
    <div className="fade-up">
      <TamDeltaBanner delta={tamDelta} />

      {/* Cover sheet */}
      <div style={{ background: C.panel, border: `1px solid ${C.ink}`, padding: "24px 24px 20px", marginBottom: 10, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.ledger, letterSpacing: "0.1em", marginBottom: 10 }}>
              CASE FILE · OPENED {today.toUpperCase()}
            </p>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: C.ink, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{report.title}</h2>
          </div>
          <Seal confidence={report.confidence || "High"} small />
        </div>
        <div style={{ borderTop: `1px dashed ${C.border}`, marginTop: 16, paddingTop: 14 }}>
          <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.7 }}>{report.summary}</p>
        </div>
        <KeyTakeaways points={report.keyTakeaways} />
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${C.border}` }}>
          <button onClick={handleCopy} style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 11, color: copied ? C.ledger : C.ink, border: `1px solid ${copied ? C.ledger : C.ink}`, padding: "8px 14px", letterSpacing: "0.04em" }}>
            {copied ? "COPIED ✓" : "COPY AS INVESTOR MEMO"}
          </button>
        </div>
      </div>

      <TamSamSomFunnel data={report.tamSamSom} />
      <CompetitorChart data={report.competitors} />
      <FinancialChart data={report.financials} />
      <RegulatoryRadar items={report.regulatory} />

      {/* Sections as file tabs */}
      {(report.sections || []).map((s, i) => (
        <div key={i} style={{ background: C.paper, border: `1px solid ${C.border}`, padding: "18px 20px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.ledger, fontWeight: 700, flexShrink: 0 }}>TAB {SECTION_TABS[i] || i + 1}</span>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 600, color: C.ink }}>{s.heading}</h3>
          </div>
          <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.75, marginBottom: s.bullets?.length ? 12 : 0 }}>{s.content}</p>
          {s.bullets?.length > 0 && (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
              {s.bullets.map((b, j) => (
                <li key={j} style={{ display: "flex", gap: 9, fontSize: 12.5, color: C.inkSoft, alignItems: "flex-start", borderLeft: `2px solid ${C.ledger}50`, paddingLeft: 10 }}>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {/* Sources */}
      {report.sources?.length > 0 && (
        <div style={{ border: `1px solid ${C.border}`, padding: 16, marginTop: 2 }}>
          <p style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: C.muted, letterSpacing: "0.08em", marginBottom: 10 }}>REFERENCES CITED</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {report.sources.map((src, i) => (
              <p key={i} style={{ fontSize: 12, color: C.muted, fontFamily: "'IBM Plex Mono',monospace" }}>[{i + 1}] {src}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── REPORT GENERATION (shared) ─────────────────────────────────────────
async function generateReport(question, context = {}) {
  const { ventureName, industry } = context;
  const contextLine = [
    ventureName ? `Venture: ${ventureName}` : null,
    industry ? `Industry vertical: ${industry}` : null,
  ].filter(Boolean).join("\n");

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 6500,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: `You are MarketPulse AI — a senior market research analyst specializing in fundraising-stage research for Indian startup founders, with deep expertise in Indian fintech, edtech, and consumer-tech regulation (RBI, SEBI, UIDAI, NPCI, DPDP Act, MeitY).

Use web search to ground your numbers in current, real data before writing the report — do not rely solely on prior knowledge for market sizing, competitor funding, or regulatory status, since these change frequently.

Given a research question, produce a comprehensive market research report formatted the way an investor expects to see it, with supporting chart data.

CRITICAL: Your FINAL message must be ONLY valid JSON — no markdown, no backticks, no explanation before or after. Exactly this structure:
{
  "title": "Specific report title",
  "confidence": "High",
  "summary": "2-3 sentence executive summary with the single most important number or finding",
  "keyTakeaways": ["Most important finding, one punchy sentence", "Second finding", "Third finding", "Fourth finding"],
  "tamSamSom": {
    "tam": {"valueUsdBn": 4.5, "note": "short description of total addressable market"},
    "sam": {"valueUsdBn": 1.8, "note": "short description of serviceable addressable market"},
    "som": {"valueUsdBn": 0.3, "note": "short description of realistic 3-5yr obtainable share"}
  },
  "competitors": [
    {"name": "Real company name", "marketSharePct": 28, "strategy": "One short clause on their core strategy"},
    {"name": "Real company name", "marketSharePct": 19, "strategy": "One short clause"},
    {"name": "Real company name", "marketSharePct": 12, "strategy": "One short clause"},
    {"name": "Others / long tail", "marketSharePct": 41, "strategy": "Fragmented regional and niche players"}
  ],
  "financials": [
    {"year": "2026", "revenueUsdM": 50, "costsUsdM": 38, "profitUsdM": 12},
    {"year": "2027", "revenueUsdM": 72, "costsUsdM": 51, "profitUsdM": 21},
    {"year": "2028", "revenueUsdM": 98, "costsUsdM": 66, "profitUsdM": 32},
    {"year": "2029", "revenueUsdM": 130, "costsUsdM": 84, "profitUsdM": 46}
  ],
  "regulatory": [
    {"authority": "RBI", "requirement": "short description of the compliance requirement", "impact": "High"},
    {"authority": "SEBI", "requirement": "short description", "impact": "Medium"},
    {"authority": "DPDP Act", "requirement": "short description", "impact": "Medium"}
  ],
  "sections": [
    {"heading": "Market Size & TAM", "content": "3-4 sentence paragraph with specific numbers in INR and USD", "bullets": ["point 1 with data", "point 2 with data", "point 3 with data"]},
    {"heading": "Key Players & Competitive Landscape", "content": "paragraph naming real companies and their positions", "bullets": ["competitor 1 with market share or funding", "competitor 2", "competitor 3"]},
    {"heading": "Growth Drivers & Tailwinds", "content": "paragraph on macro and micro drivers", "bullets": ["driver 1", "driver 2", "driver 3"]},
    {"heading": "Risks & Headwinds", "content": "honest risk assessment", "bullets": ["risk 1", "risk 2", "risk 3"]},
    {"heading": "3-Year Outlook (2026-2029)", "content": "forward-looking projections with specific numbers", "bullets": ["projection 1", "projection 2", "projection 3"]},
    {"heading": "Strategic Opportunities", "content": "actionable opportunities for startups or investors", "bullets": ["opportunity 1", "opportunity 2", "opportunity 3"]}
  ],
  "sources": ["Source 1 (year)", "Source 2 (year)", "Source 3 (year)", "Source 4 (year)", "Source 5 (year)"]
}

Rules:
- "confidence" must be exactly one of: "High", "Medium", "Low" — calibrate it honestly based on how much current data search actually surfaced.
- "keyTakeaways": exactly 4 items, each a single standalone sentence a founder could repeat in a pitch.
- "tamSamSom": som.valueUsdBn < sam.valueUsdBn <= tam.valueUsdBn, all in US$ billions, numeric only.
- "competitors": 3-5 real named players plus one "Others" bucket; marketSharePct values are numbers 0-100 and should roughly sum to 100. Prefer current funding/market-share data found via search over memory.
- "financials": exactly 4 years, numeric USD millions only — illustrative segment-level economics, not a real company's disclosed financials, and label it as such in tone.
- "regulatory": 3-5 entries naming real Indian regulators or laws that genuinely apply to this question (RBI, SEBI, IRDAI, UIDAI, NPCI, DPDP Act, MeitY, FSSAI, etc.) — omit ones that don't apply rather than padding the list. "impact" must be exactly High, Medium, or Low.
- Be specific everywhere: real companies, real numbers, real current events. Chart fields must be single numbers, never strings or ranges.`,
      messages: [{ role: "user", content: `Research question: ${question}${contextLine ? `\n\n${contextLine}` : ""}` }]
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");

  // With web search enabled, content may include multiple blocks (search calls,
  // search results, and one or more text blocks). The final text block holds
  // the synthesized JSON answer.
  const textBlocks = (data.content || []).filter(b => b.type === "text");
  const textBlock = textBlocks.length ? textBlocks[textBlocks.length - 1].text : "";

  let raw = textBlock.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) raw = raw.substring(firstBrace, lastBrace + 1);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("Unparsable model output:", raw);
    throw new Error("PARSE_FAIL");
  }
  if (!parsed.title || !Array.isArray(parsed.sections)) throw new Error("PARSE_FAIL");
  return parsed;
}

// ── DASHBOARD ────────────────────────────────────────────────────────────
function Dashboard({ onBack }) {
  const [query, setQuery] = useState("");
  const [ventureName, setVentureName] = useState("");
  const [industry, setIndustry] = useState("Fintech");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [tamDelta, setTamDelta] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [view, setView] = useState("new");
  const [selectedReport, setSelectedReport] = useState(null);
  const textRef = useRef(null);

  // Load persisted history on mount via the artifact storage API
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("reports-history");
        if (res && res.value) setHistory(JSON.parse(res.value));
      } catch (e) {
        // no history yet — fine
      } finally {
        setHistoryLoaded(true);
      }
    })();
  }, []);

  const persistHistory = async (next) => {
    setHistory(next);
    try {
      await window.storage.set("reports-history", JSON.stringify(next));
    } catch (e) {
      console.error("Could not save history:", e);
    }
  };

  const generate = async (q) => {
    const question = (q || query).trim();
    if (!question || loading) return;
    setLoading(true);
    setReport(null);
    setTamDelta(null);
    setError("");
    setView("new");
    setSelectedReport(null);

    const trimmedVenture = ventureName.trim();

    try {
      const parsed = await generateReport(question, { ventureName: trimmedVenture, industry });
      const newTam = parsed?.tamSamSom?.tam?.valueUsdBn ?? null;

      // If this report is tagged to a venture we've filed on before, surface
      // how the TAM estimate has moved — turns a one-off query into a tracked thread.
      if (trimmedVenture && newTam != null) {
        const prior = history.find(h => (h.ventureName || "").trim().toLowerCase() === trimmedVenture.toLowerCase() && h.tam != null);
        if (prior) setTamDelta({ priorTam: prior.tam, newTam, priorDate: prior.createdAt });
      }

      const entry = { id: Date.now(), query: question, ventureName: trimmedVenture, industry, tam: newTam, report: parsed, createdAt: new Date().toISOString() };
      setReport(parsed);
      await persistHistory([entry, ...history].slice(0, 30));
    } catch (err) {
      console.error(err);
      setError(
        err.message === "PARSE_FAIL"
          ? "The brief came back malformed — usually a sign the question was too broad. Try narrowing it (a sector, a geography, a timeframe)."
          : err.message || "Something went wrong opening this file. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const displayReport = selectedReport || report;
  const activeDelta = !selectedReport ? tamDelta : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar — filing drawer */}
      <div style={{ width: 230, flexShrink: 0, background: C.panel, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "16px 16px", borderBottom: `1px solid ${C.border}` }}>
          <Logo />
        </div>

        <div style={{ padding: "12px 0", flex: 1 }}>
          {[
            { id: "new", label: "NEW FILE" },
            { id: "history", label: `ARCHIVE (${history.length})` },
          ].map(({ id, label }) => (
            <button key={id} className="tab-item" onClick={() => { setView(id); setSelectedReport(null); }}
              style={{ width: "calc(100% - 12px)", display: "flex", alignItems: "center", padding: "10px 14px", marginBottom: 4, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: view === id ? C.paper : C.inkSoft, background: view === id ? C.ledger : "transparent", textAlign: "left" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ border: `1px solid ${C.ledger}40`, background: C.ledgerFaint, padding: "12px", marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: C.ledger, fontWeight: 700, marginBottom: 4, letterSpacing: "0.05em" }}>FREE PLAN</p>
            <p style={{ fontSize: 11, color: C.inkSoft, marginBottom: 9 }}>3 free files included</p>
            <button style={{ width: "100%", background: C.ink, color: C.paper, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, padding: "8px" }}>
              UPGRADE TO PRO →
            </button>
          </div>
          <button onClick={onBack} style={{ width: "100%", padding: "7px 4px", fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: C.muted, textAlign: "left" }}>
            ← BACK TO LOBBY
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "28px 28px", maxWidth: 820, overflowY: "auto" }}>

        {view === "new" && (
          <div>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 4, letterSpacing: "-0.01em" }}>Open a New File</h1>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Investor-ready research, grounded in live web search — TAM/SAM/SOM, competitor strategy, and India regulatory exposure.</p>

            <div className="idx-card" style={{ background: C.panel, border: `1px solid ${C.ink}`, padding: 16, marginBottom: 10, display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
              <div>
                <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.08em", marginBottom: 6 }}>VENTURE (OPTIONAL — TRACKS TAM OVER TIME)</p>
                <input
                  value={ventureName}
                  onChange={e => setVentureName(e.target.value)}
                  placeholder="e.g. Stark Wallet"
                  style={{ width: "100%", background: "none", fontSize: 13, color: C.ink, fontFamily: "'IBM Plex Mono',monospace", borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}
                />
              </div>
              <div>
                <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.08em", marginBottom: 6 }}>VERTICAL</p>
                <select value={industry} onChange={e => setIndustry(e.target.value)}
                  style={{ width: "100%", background: "none", fontSize: 13, color: C.ink, fontFamily: "'IBM Plex Mono',monospace", borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="idx-card" style={{ background: C.panel, border: `1px solid ${C.ink}`, padding: 16, marginBottom: 18 }}>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.08em", marginBottom: 10 }}>QUERY</p>
              <textarea
                ref={textRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
                placeholder="e.g. What is the TAM for AI tutoring apps targeting JEE students in India?"
                rows={3}
                style={{ width: "100%", background: "none", fontSize: 13, color: C.ink, lineHeight: 1.6, fontFamily: "'IBM Plex Mono',monospace" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 12, borderTop: `1px dashed ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: "'IBM Plex Mono',monospace" }}>⌘+Enter to file · 🔎 live web-grounded</span>
                <button onClick={() => generate()}
                  disabled={!query.trim() || loading}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: C.ledger, color: C.paper, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, padding: "10px 18px", opacity: (!query.trim() || loading) ? 0.45 : 1, letterSpacing: "0.04em" }}>
                  {loading ? <Spinner size={13} color={C.paper} /> : null}
                  {loading ? "RESEARCHING…" : "FILE & ANALYZE →"}
                </button>
              </div>
            </div>

            {!loading && !displayReport && !error && (
              <div>
                <p style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: C.muted, letterSpacing: "0.08em", marginBottom: 10 }}>QUICK-FILE TEMPLATES</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                  {QUICK.map(({ label, q: qv }) => (
                    <button key={label} className="idx-card" onClick={() => { setQuery(qv); textRef.current?.focus(); }}
                      style={{ textAlign: "left", background: C.paper, border: `1px solid ${C.border}`, padding: "12px 14px 12px 12px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: "'IBM Plex Mono',monospace" }}>{label}</p>
                      <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{qv}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && <ReportSkeleton />}

            {error && (
              <div style={{ background: `${C.stamp}10`, border: `1px solid ${C.stamp}50`, padding: "14px 16px", color: C.stamp, fontSize: 13, lineHeight: 1.6 }}>
                <strong style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, display: "block", marginBottom: 4 }}>FILE REJECTED</strong>
                {error}
              </div>
            )}

            {displayReport && !loading && <ReportDisplay report={displayReport} tamDelta={activeDelta} />}
          </div>
        )}

        {view === "history" && (
          <div>
            {selectedReport ? (
              <div>
                <button onClick={() => setSelectedReport(null)} style={{ fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: C.muted, marginBottom: 18 }}>
                  ← BACK TO ARCHIVE
                </button>
                <ReportDisplay report={selectedReport.report} />
              </div>
            ) : (
              <div>
                <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Archive</h1>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>Previously filed reports{historyLoaded ? "" : " (loading…)"}</p>
                {historyLoaded && history.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted, fontSize: 14, border: `1px dashed ${C.border}` }}>
                    The archive is empty. Open your first file →
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {history.map(entry => (
                      <button key={entry.id} onClick={() => setSelectedReport(entry)}
                        style={{ textAlign: "left", background: C.paper, border: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            {entry.ventureName && <FileTag color={C.gold}>{entry.ventureName}</FileTag>}
                            <p style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.report?.title || entry.query}</p>
                          </div>
                          <p style={{ fontSize: 11, color: C.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
                            {new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            {entry.tam != null ? ` · TAM $${entry.tam}B` : ""}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          <FileTag color={(CONFIDENCE_MAP[entry.report?.confidence] || CONFIDENCE_MAP.High).color}>{(CONFIDENCE_MAP[entry.report?.confidence] || CONFIDENCE_MAP.High).word}</FileTag>
                          <span style={{ color: C.muted, fontSize: 16 }}>›</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");

  return (
    <>
      <style>{css}</style>
      {page === "landing"
        ? <Landing onEnter={() => setPage("dashboard")} />
        : <Dashboard onBack={() => setPage("landing")} />
      }
    </>
  );
}