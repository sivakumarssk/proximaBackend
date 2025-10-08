import { useEffect, useState } from "react";

const API = "https://admin.theproxima.org";
const ENDPOINT = `${API}/api`;

export default function AdminNewsletter() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async (p = 1) => {
    setLoading(true);
    setMsg("");
    const params = new URLSearchParams({ page: p, limit });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const res = await fetch(`${ENDPOINT}/newsletter?${params.toString()}`);
      const json = await res.json();
      if (json?.success) {
        setRows(json.data || []);
        setPage(json.page || 1);
        setPages(json.pages || 1);
        setTotal(json.total || 0);
      } else {
        setMsg("Failed to load.");
      }
    } catch (e) {
      console.error(e);
      setMsg("Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); /* eslint-disable-line */ }, []);

  const changeStatus = async (id, st) => {
    try {
      const res = await fetch(`${ENDPOINT}/newsletter/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: st }),
      });
      if (res.ok) load(page);
    } catch (e) { console.error(e); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this subscriber?")) return;
    try {
      const res = await fetch(`${ENDPOINT}/newsletter/${id}`, { method: "DELETE" });
      if (res.ok) load(page);
    } catch (e) { console.error(e); }
  };

  const exportCSV = () => {
    const header = ["email", "status", "createdAt", "updatedAt"];
    const lines = [header.join(",")];
    rows.forEach(r => {
      lines.push([r.email, r.status, r.createdAt, r.updatedAt].map(v => `"${(v||"").toString().replace(/"/g,'""')}"`).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={pagestyle}>
      <div style={header}>
        <div>
          <div style={title}>Newsletter Subscribers</div>
          <div style={muted}>{total} total</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => load(page)} style={btnGhost}>Refresh</button>
          <button onClick={exportCSV} style={btnPrimary}>Export CSV</button>
        </div>
      </div>

      {msg && <div style={notice}>{msg}</div>}

      <div style={card}>
        <div style={filters}>
          <input placeholder="Search email" value={q} onChange={(e)=>setQ(e.target.value)} style={input}/>
          <select value={status} onChange={(e)=>setStatus(e.target.value)} style={input}>
            <option value="">All</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
          <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} style={input}/>
          <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} style={input}/>
          <button onClick={()=>load(1)} style={btnPrimary}>Filter</button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Email</th>
                <th style={th}>Status</th>
                <th style={th}>Created</th>
                <th style={th}>Updated</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 12 }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 12 }}>No subscribers found</td></tr>
              ) : rows.map(r => (
                <tr key={r._id}>
                  <td style={td}>{r.email}</td>
                  <td style={td}>{r.status}</td>
                  <td style={td}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td style={td}>{new Date(r.updatedAt).toLocaleString()}</td>
                  <td style={td}>
                    <div style={{ display:"flex", gap:6 }}>
                      {r.status !== 'subscribed' && <button onClick={()=>changeStatus(r._id,'subscribed')} style={btnSmall}>Subscribe</button>}
                      {r.status !== 'unsubscribed' && <button onClick={()=>changeStatus(r._id,'unsubscribed')} style={btnSmallAlt}>Unsubscribe</button>}
                      <button onClick={()=>del(r._id)} style={btnSmallDanger}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={pager}>
          <button disabled={page<=1} onClick={()=>load(page-1)} style={btnGhost}>‹ Prev</button>
          <div style={muted}>Page {page} / {pages}</div>
          <button disabled={page>=pages} onClick={()=>load(page+1)} style={btnGhost}>Next ›</button>
        </div>
      </div>
    </div>
  );
}

/* minimal styles to look nice without Tailwind here (your admin area) */
const pagestyle   = { minHeight: "100vh", background: "#f3f4f6", padding: 16, color: "#111827", maxWidth:'70%',width:'100%',marginLeft:'15%', marginTop: '5%' };
const header = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 };
const title  = { fontSize: 22, fontWeight: 700 };
const muted  = { fontSize: 12, color: "#6b7280" };
const notice = { background: "#ecfeff", border: "1px solid #a5f3fc", color: "#0369a1", padding: 8, borderRadius: 6, marginBottom: 12 };

const card   = { background: "white", border: "1px solid #e5e7eb", boxShadow: "0 6px 16px rgba(17,24,39,0.06)", borderRadius: 12, padding: 14, marginBottom: 14 };
const filters= { display: "grid", gridTemplateColumns: "1fr 160px 160px 160px 120px", gap: 8, marginBottom: 10 };
const input  = { padding: "10px 12px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 10, outline: "none" };
const table  = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
const th     = { textAlign: "left", fontWeight: 700, fontSize: 13, color: "#374151", borderBottom: "1px solid #e5e7eb", padding: "10px 8px" };
const td     = { fontSize: 13, color: "#111827", borderBottom: "1px solid #f3f4f6", padding: "10px 8px", verticalAlign: "top" };

const pager  = { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 };
const btnGhost = { background: "#111827", color: "#fff", border: "1px solid #111827", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 };
const btnPrimary = { background: "#2563eb", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 600 };
const btnSmall = { background: "#2563eb", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 };
const btnSmallAlt = { background: "#4b5563", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 };
const btnSmallDanger = { background: "#dc2626", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 };
