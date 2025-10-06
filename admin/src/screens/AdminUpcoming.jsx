import React, { useEffect, useState } from "react";

const API = "http://localhost:5000";
const ENDPOINT = `${API}/api`;

const withBase = (src) => {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  let p = src.replace(/\/{2,}/g, "/").trim();
  if (p.startsWith("/api/")) return `${API}${p}`;
  if (p.startsWith("/uploads")) p = `/api${p}`;
  else if (p.startsWith("uploads")) p = `/api/${p}`;
  else if (!p.startsWith("/")) p = `/api/${p}`;
  return `${API}${p}`;
};

export default function AdminUpcoming() {
  const [doc, setDoc] = useState(null);
  const [msg, setMsg] = useState("");

  const [heroBg, setHeroBg] = useState(null);
  const [eventFiles, setEventFiles] = useState({}); // { idx: File }

  useEffect(() => { load(); }, []);

  const normalize = (d) => ({
    _id: d?._id || null,
    hero: {
      title: d?.hero?.title || "Upcoming Events",
      subtitle: d?.hero?.subtitle || "",
      bgImage: d?.hero?.bgImage || "",
    },
    events: Array.isArray(d?.events) ? d.events : [],
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await fetch(`${ENDPOINT}/upcoming`);
      const data = await res.json();
      setDoc(normalize(data));
    } catch (e) {
      console.error(e);
      setDoc(normalize({}));
      setMsg("Failed to load. Defaults loaded.");
    }
  };

  const setHero = (k, v) => setDoc((s) => ({ ...s, hero: { ...s.hero, [k]: v } }));
  const addEvent = () => setDoc((s) => ({ ...s, events: [...s.events, { title: "", startDate: "", endDate: "", country: "", city: "", image: "", website: "" }] }));
  const removeEvent = (idx) => setDoc((s) => ({ ...s, events: s.events.filter((_, i) => i !== idx) }));
  const setEvent = (idx, k, v) => setDoc((s) => { const arr = [...s.events]; arr[idx] = { ...arr[idx], [k]: v }; return { ...s, events: arr }; });

  const save = async () => {
    if (!doc) return;
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("hero", JSON.stringify({ title: doc.hero.title, subtitle: doc.hero.subtitle }));
      fd.append("events", JSON.stringify(doc.events.map(e => ({
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        country: e.country,
        city: e.city,
        image: e.image,   // keep existing path; replaced if file sent
        website: e.website
      }))));

      if (heroBg) fd.append("heroBg", heroBg);
      Object.entries(eventFiles).forEach(([i, f]) => { if (f) fd.append(`eventImg${i}`, f); });

      const url = doc._id ? `${ENDPOINT}/upcoming/${encodeURIComponent(doc._id)}` : `${ENDPOINT}/upcoming`;
      const method = doc._id ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      if (!res.ok) throw new Error(`Save failed ${res.status}`);

      await load();
      setMsg("Saved ✔");
      setHeroBg(null);
      setEventFiles({});
    } catch (e) {
      console.error(e);
      setMsg("Save failed ❌");
    }
  };

  const del = async () => {
    if (!doc?._id) return;
    if (!window.confirm("Delete Upcoming content?")) return;
    try {
      const res = await fetch(`${ENDPOINT}/upcoming/${encodeURIComponent(doc._id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDoc(normalize({}));
      setMsg("Deleted ✔ (Save to create new)");
    } catch (e) { console.error(e); setMsg("Delete failed ❌"); }
  };

  if (!doc) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={title}>Upcoming Events — Admin</div>
          <div style={muted}>{doc._id ? <>ID: <code>{doc._id}</code></> : "New document (Save to create)"}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} style={btnPrimary}>Save</button>
          <button onClick={del} disabled={!doc._id} style={btnDanger}>Delete</button>
        </div>
      </div>

      {msg && <div style={notice}>{msg}</div>}

      <Card title="Hero" action={
        <label style={btnGhost}>
          Upload Hero BG
          <input type="file" onChange={(e) => setHeroBg((e.target.files && e.target.files[0]) || null)} style={{ display: "none" }} />
        </label>
      }>
        <Input label="Title" value={doc.hero.title} onChange={(v) => setHero("title", v)} />
        <Textarea label="Subtitle" value={doc.hero.subtitle} onChange={(v) => setHero("subtitle", v)} />
        <div style={muted}>{heroBg?.name || withBase(doc.hero.bgImage) || "No hero image selected"}</div>
      </Card>

      <Card title="Events" action={<button style={btnGhost} onClick={addEvent}>Add Event</button>}>
        {doc.events.map((e, i) => (
          <div key={i} style={subCard}>
            <div style={subHead}>
              <div style={{ fontWeight: 600 }}>Event #{i + 1}</div>
              <button style={btnSmallDanger} onClick={() => removeEvent(i)}>Remove</button>
            </div>

            <Input label="Title" value={e.title} onChange={(v) => setEvent(i, "title", v)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Input type="date" label="Start Date" value={e.startDate?.slice(0,10) || ""} onChange={(v) => setEvent(i, "startDate", v)} />
              <Input type="date" label="End Date"   value={e.endDate?.slice(0,10) || ""}   onChange={(v) => setEvent(i, "endDate", v)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Input label="Country" value={e.country} onChange={(v) => setEvent(i, "country", v)} />
              <Input label="City"    value={e.city}    onChange={(v) => setEvent(i, "city", v)} />
            </div>
            <Input label="Website (https://…)" value={e.website} onChange={(v) => setEvent(i, "website", v)} />

            <label style={btnGhost}>
              Upload Image
              <input type="file" onChange={(ev) => setEventFiles((m) => ({ ...m, [i]: (ev.target.files && ev.target.files[0]) || null }))} style={{ display: "none" }} />
            </label>
            <div style={muted}>{eventFiles[i]?.name || withBase(e.image) || "No image selected"}</div>
          </div>
        ))}
      </Card>

      <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
        <button onClick={save} style={btnPrimary}>Save</button>
        <button onClick={del} disabled={!doc._id} style={btnDanger}>Delete</button>
      </div>
    </div>
  );
}

/* UI helpers */
function Card({ title, action, children }) {
  return (
    <div style={card}>
      <div style={cardHead}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div>{action}</div>
      </div>
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
    </div>
  );
}
function Input({ label, value, onChange, type = "text" }) {
  return (
    <label style={field}>
      <div style={labelStyle}>{label}</div>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={input} />
    </label>
  );
}
function Textarea({ label, value, onChange }) {
  return (
    <label style={field}>
      <div style={labelStyle}>{label}</div>
      <textarea value={value ?? ""} rows={3} onChange={(e) => onChange(e.target.value)} style={textarea} />
    </label>
  );
}

/* styles */
const page   = { minHeight: "100vh",maxWidth:'50%',width:'100%', background: "#f3f4f6", padding: 16, color: "#111827", marginTop: '5%' };
const header = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 };
const title  = { fontSize: 22, fontWeight: 700 };
const muted  = { fontSize: 12, color: "#6b7280" };
const notice = { background: "#ecfeff", border: "1px solid #a5f3fc", color: "#0369a1", padding: 8, borderRadius: 6, marginBottom: 12 };

const card    = { background: "white", border: "1px solid #e5e7eb", boxShadow: "0 6px 16px rgba(17,24,39,0.06)", borderRadius: 12, padding: 14, marginBottom: 14 };
const cardHead= { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 };

const subCard = { border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fbfbfb", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" };
const subHead = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 };

const field   = { display: "grid", gap: 6 };
const labelStyle = { fontSize: 12, color: "#374151" };
const input   = { padding: "10px 12px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 10, outline: "none" };
const textarea= { padding: "10px 12px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 10, outline: "none", resize: "vertical" };

const btnPrimary = { background: "#2563eb", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600 };
const btnDanger  = { background: "#dc2626", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600 };
const btnGhost   = { background: "#111827", color: "white", border: "1px solid #111827", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 };
const btnSmallDanger = { background: "#991b1b", color: "white", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 };
