import React, { useEffect, useState } from "react";

const API = "http://localhost:5000";      // files base
const ENDPOINT = `${API}/api`;            // JSON base

const withBase = (src) => {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return src.startsWith("/") ? `${API}${src}` : `${API}/${src}`;
};

export default function AdminServices() {
  const [doc, setDoc] = useState(null);
  const [msg, setMsg] = useState("");

  // files
  const [heroBg, setHeroBg] = useState(null);
  const [serviceFiles, setServiceFiles] = useState({}); // { idx: File }

  useEffect(() => { load(); }, []);

  const normalize = (d) => ({
    _id: d?._id || null,
    hero: {
      title: d?.hero?.title || "Our Services",
      subtitle: d?.hero?.subtitle || "",
      bgImage: d?.hero?.bgImage || "",
    },
    services: Array.isArray(d?.services) ? d.services : [],
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await fetch(`${ENDPOINT}/services`);
      const data = await res.json();
      setDoc(normalize(data));
    } catch (e) {
      console.error(e);
      setDoc(normalize({}));
      setMsg("Failed to load. Defaults loaded.");
    }
  };

  // helpers
  const setHeroField = (k, v) => setDoc((s) => ({ ...s, hero: { ...s.hero, [k]: v } }));
  const updateService = (idx, key, val) =>
    setDoc((s) => {
      const arr = [...s.services];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...s, services: arr };
    });

  const addService = () =>
    setDoc((s) => ({
      ...s,
      services: [...s.services, { title: "", description: "", points: [], image: "" }],
    }));
  const removeService = (idx) =>
    setDoc((s) => {
      setServiceFiles((m) => reindexMap(m, idx));
      return { ...s, services: s.services.filter((_, i) => i !== idx) };
    });

  // points
  const addPoint = (sIdx) =>
    setDoc((s) => {
      const arr = [...s.services];
      const pts = Array.isArray(arr[sIdx].points) ? [...arr[sIdx].points] : [];
      pts.push("");
      arr[sIdx] = { ...arr[sIdx], points: pts };
      return { ...s, services: arr };
    });

  const updatePoint = (sIdx, pIdx, val) =>
    setDoc((s) => {
      const arr = [...s.services];
      const pts = [...(arr[sIdx].points || [])];
      pts[pIdx] = val;
      arr[sIdx] = { ...arr[sIdx], points: pts };
      return { ...s, services: arr };
    });

  const removePoint = (sIdx, pIdx) =>
    setDoc((s) => {
      const arr = [...s.services];
      const pts = [...(arr[sIdx].points || [])].filter((_, i) => i !== pIdx);
      arr[sIdx] = { ...arr[sIdx], points: pts };
      return { ...s, services: arr };
    });

  const reindexMap = (map, removedIdx) => {
    const next = {};
    Object.keys(map).forEach((k) => {
      const i = Number(k);
      if (i < removedIdx) next[i] = map[i];
      else if (i > removedIdx) next[i - 1] = map[i];
    });
    return next;
  };

  const save = async () => {
    if (!doc) return;
    setMsg("");
    try {
      const fd = new FormData();

      fd.append("hero", JSON.stringify({
        title: doc.hero.title,
        subtitle: doc.hero.subtitle,
      }));

      // keep existing image path string in payload; controller will replace if a file is provided
      fd.append("services", JSON.stringify(
        (doc.services || []).map(({ title, description, points, image }) => ({
          title,
          description,
          points: Array.isArray(points) ? points : [],
          image,
        }))
      ));

      if (heroBg) fd.append("heroBg", heroBg);
      Object.entries(serviceFiles).forEach(([i, f]) => f && fd.append(`serviceImgs${i}`, f));

      const url = doc._id ? `${ENDPOINT}/services/${encodeURIComponent(doc._id)}` : `${ENDPOINT}/services`;
      const method = doc._id ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);

      await load();
      setHeroBg(null);
      setServiceFiles({});
      setMsg("Saved ✔");
    } catch (e) {
      console.error(e);
      setMsg("Save failed ❌");
    }
  };

  const del = async () => {
    if (!doc?._id) return;
    if (!window.confirm("Delete Services content?")) return;
    try {
      const res = await fetch(`${ENDPOINT}/services/${encodeURIComponent(doc._id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setDoc(normalize({}));
      setMsg("Deleted ✔ (Save to create new)");
    } catch (e) {
      console.error(e);
      setMsg("Delete failed ❌");
    }
  };

  if (!doc) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={title}>Services Admin</div>
          <div style={muted}>{doc._id ? <>ID: <code>{doc._id}</code></> : "New document (Save to create)"}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} style={btnPrimary}>Save</button>
          <button onClick={del} disabled={!doc._id} style={btnDanger}>Delete</button>
        </div>
      </div>

      {msg && <div style={notice}>{msg}</div>}

      {/* HERO */}
      <Card title="Hero" action={
        <label style={btnGhost}>
          Upload Hero BG
          <input type="file" onChange={(e) => setHeroBg((e.target.files && e.target.files[0]) || null)} style={{ display: "none" }}/>
        </label>
      }>
        <Input label="Title" value={doc.hero.title} onChange={(v) => setHeroField("title", v)} />
        <Textarea label="Subtitle" value={doc.hero.subtitle} onChange={(v) => setHeroField("subtitle", v)} />
        <div style={muted}>{heroBg?.name || withBase(doc.hero.bgImage) || "No hero image selected"}</div>
      </Card>

      {/* SERVICES */}
      <Card title="Services" action={<button style={btnGhost} onClick={addService}>Add Service</button>}>
        {doc.services.map((s, i) => (
          <SubCard key={i} title={`Service #${i + 1}`} onRemove={() => removeService(i)}>
            <Input label="Title" value={s.title} onChange={(v) => updateService(i, "title", v)} />
            <Textarea label="Description" value={s.description} onChange={(v) => updateService(i, "description", v)} />

            {/* Points */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>Points</div>
                <button style={btnGhost} onClick={() => addPoint(i)}>Add Point</button>
              </div>
              {(s.points || []).map((p, pIdx) => (
                <div key={pIdx} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8 }}>
                  <input
                    value={p}
                    onChange={(e) => updatePoint(i, pIdx, e.target.value)}
                    placeholder="Bullet point"
                    style={input}
                  />
                  <button style={btnSmallDanger} onClick={() => removePoint(i, pIdx)}>Remove</button>
                </div>
              ))}
            </div>

            {/* Image */}
            <label style={btnGhost}>
              Upload Image
              <input
                type="file"
                onChange={(e) => setServiceFiles((m) => ({ ...m, [i]: (e.target.files && e.target.files[0]) || null }))}
                style={{ display: "none" }}
              />
            </label>
            <div style={muted}>{serviceFiles[i]?.name || withBase(s.image) || "No image selected"}</div>
          </SubCard>
        ))}
      </Card>

      <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
        <button onClick={save} style={btnPrimary}>Save</button>
        <button onClick={del} disabled={!doc._id} style={btnDanger}>Delete</button>
      </div>
    </div>
  );
}

/* UI bits */
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
function SubCard({ title, onRemove, children }) {
  return (
    <div style={subCard}>
      <div style={subHead}>
        <div style={{ fontWeight: 500 }}>{title}</div>
        <button onClick={onRemove} style={btnSmallDanger}>Remove</button>
      </div>
      <div style={{ display: "grid", gap: 8 }}>{children}</div>
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
      <textarea value={value ?? ""} rows={4} onChange={(e) => onChange(e.target.value)} style={textarea} />
    </label>
  );
}

/* styles */
const page   = { minHeight: "100vh",maxWidth:'50%',width:'100%', background: "#f3f4f6", padding: 16, color: "#111827",marginTop: '5%' };
const header = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 };
const title  = { fontSize: 22, fontWeight: 700 };
const muted  = { fontSize: 12, color: "#6b7280" };
const notice = { background: "#ecfeff", border: "1px solid #a5f3fc", color: "#0369a1", padding: 8, borderRadius: 6, marginBottom: 12 };

const card    = { background: "white", border: "1px solid #e5e7eb", boxShadow: "0 6px 16px rgba(17,24,39,0.06)", borderRadius: 12, padding: 14, marginBottom: 14 };
const cardHead= { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 };

const subCard = { border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, background: "#fbfbfb" };
const subHead = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 };

const field   = { display: "grid", gap: 6 };
const labelStyle = { fontSize: 12, color: "#374151" };
const input   = { padding: "10px 12px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 10, outline: "none" };
const textarea= { padding: "10px 12px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 10, outline: "none", resize: "vertical" };

const btnPrimary = { background: "#2563eb", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600 };
const btnDanger  = { background: "#dc2626", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600 };
const btnGhost   = { background: "#111827", color: "white", border: "1px solid #111827", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 };
const btnSmallDanger = { background: "#991b1b", color: "white", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 };
