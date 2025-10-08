import React, { useEffect, useState } from "react";

const API = "https://admin.theproxima.org";      // for files
const ENDPOINT = `${API}/api`;            // for JSON

const withBase = (src) => {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return src.startsWith("/") ? `${API}${src}` : `${API}/${src}`;
};

export default function AdminAbout() {
  const [doc, setDoc] = useState(null);
  const [msg, setMsg] = useState("");

  // files
  const [heroBg, setHeroBg] = useState(null);
  const [sectionFiles, setSectionFiles] = useState({}); // {idx: File}

  useEffect(() => {
    load();
  }, []);

  const normalize = (d) => ({
    _id: d?._id || null,
    hero: {
      title: d?.hero?.title || "About Proxima",
      subtitle: d?.hero?.subtitle || "",
      bgImage: d?.hero?.bgImage || "",
    },
    contentSections: Array.isArray(d?.contentSections) ? d.contentSections : [],
    counters: Array.isArray(d?.counters) ? d.counters : [],
    approach: Array.isArray(d?.approach) ? d.approach : [],
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await fetch(`${ENDPOINT}/aboutus`);
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
  const updateArrayItem = (section, idx, key, val) =>
    setDoc((s) => {
      const arr = [...s[section]];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...s, [section]: arr };
    });

  const addSection = () =>
    setDoc((s) => ({ ...s, contentSections: [...s.contentSections, { heading: "", description: "", image: "" }] }));
  const removeSection = (idx) =>
    setDoc((s) => {
      setSectionFiles((m) => reindexFiles(m, idx));
      return { ...s, contentSections: s.contentSections.filter((_, i) => i !== idx) };
    });

  const addCounter = () =>
    setDoc((s) => ({ ...s, counters: [...s.counters, { title: "", number: "" }] }));
  const removeCounter = (idx) =>
    setDoc((s) => ({ ...s, counters: s.counters.filter((_, i) => i !== idx) }));

  const addApproach = () =>
    setDoc((s) => ({ ...s, approach: [...s.approach, { title: "", text: "", color: "border-blue-500" }] }));
  const removeApproach = (idx) =>
    setDoc((s) => ({ ...s, approach: s.approach.filter((_, i) => i !== idx) }));

  const reindexFiles = (map, removedIdx) => {
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

      fd.append("contentSections", JSON.stringify(
        (doc.contentSections || []).map(({ heading, description, image }) => ({ heading, description, image }))
      ));

      fd.append("counters", JSON.stringify(doc.counters || []));
      fd.append("approach", JSON.stringify(doc.approach || []));

      if (heroBg) fd.append("heroBg", heroBg);
      Object.entries(sectionFiles).forEach(([i, f]) => { if (f) fd.append(`sectionImgs${i}`, f); });

      const url = doc._id ? `${ENDPOINT}/aboutus/${encodeURIComponent(doc._id)}` : `${ENDPOINT}/aboutus`;
      const method = doc._id ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);

      await load();
      setHeroBg(null);
      setSectionFiles({});
      setMsg("Saved ✔");
    } catch (e) {
      console.error(e);
      setMsg("Save failed ❌");
    }
  };

  const del = async () => {
    if (!doc?._id) return;
    if (!window.confirm("Delete About Us content?")) return;
    try {
      const res = await fetch(`${ENDPOINT}/aboutus/${encodeURIComponent(doc._id)}`, { method: "DELETE" });
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
          <div style={title}>About Admin</div>
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

      {/* CONTENT SECTIONS */}
      <Card title="Content Sections" action={<button style={btnGhost} onClick={addSection}>Add Section</button>}>
        {doc.contentSections.map((s, i) => (
          <SubCard key={i} title={`Section #${i + 1}`} onRemove={() => removeSection(i)}>
            <Input label="Heading" value={s.heading} onChange={(v) => updateArrayItem("contentSections", i, "heading", v)} />
            <Textarea label="Description" value={s.description} onChange={(v) => updateArrayItem("contentSections", i, "description", v)} />
            <label style={btnGhost}>
              Upload Image
              <input type="file" onChange={(e) => setSectionFiles((m) => ({ ...m, [i]: (e.target.files && e.target.files[0]) || null }))} style={{ display: "none" }}/>
            </label>
            <div style={muted}>{sectionFiles[i]?.name || withBase(s.image) || "No image selected"}</div>
          </SubCard>
        ))}
      </Card>

      {/* COUNTERS */}
      <Card title="Counters" action={<button style={btnGhost} onClick={addCounter}>Add Counter</button>}>
        {doc.counters.map((c, i) => (
          <SubCard key={i} title={`Counter #${i + 1}`} onRemove={() => removeCounter(i)}>
            <Row>
              <Input label="Title" value={c.title} onChange={(v) => updateArrayItem("counters", i, "title", v)} />
              <Input label="Number (e.g., 124+)" value={c.number} onChange={(v) => updateArrayItem("counters", i, "number", v)} />
            </Row>
          </SubCard>
        ))}
      </Card>

      {/* APPROACH */}
<Card title="Our Approach" action={<button style={btnGhost} onClick={addApproach}>Add Item</button>}>
  {doc.approach.map((a, i) => (
    <SubCard key={i} title={`Item #${i + 1}`} onRemove={() => removeApproach(i)}>
      <Input label="Title" value={a.title} onChange={(v) => updateArrayItem("approach", i, "title", v)} />
      <Textarea label="Text" value={a.text} onChange={(v) => updateArrayItem("approach", i, "text", v)} />

      {/* Tailwind class (legacy) – keep if you still want preset brand classes */}
      <Input
        label="Tailwind Border Class (optional, e.g., border-blue-500)"
        value={a.color || ""}
        onChange={(v) => updateArrayItem("approach", i, "color", v)}
      />

      {/* NEW: color picker (wins over Tailwind class if set) */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={labelStyle}>Pick Border Color</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="color"
            value={a.colorHex || "#3b82f6"}
            onChange={(e) => updateArrayItem("approach", i, "colorHex", e.target.value)}
            style={{
              width: 44, height: 36, border: "1px solid #d1d5db", borderRadius: 8, padding: 0, cursor: "pointer"
            }}
          />
          <div
            title={a.colorHex || ""}
            style={{
              height: 36,
              borderRadius: 8,
              flex: 1,
              border: "1px solid #e5e7eb",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px"
            }}
          >
            <span style={{ fontSize: 13, color: "#374151" }}>
              {a.colorHex ? a.colorHex : "No hex selected (using Tailwind class)"}
            </span>
            <span
              style={{
                width: 20, height: 20, borderRadius: 4,
                background: a.colorHex || "transparent",
                border: a.colorHex ? "1px solid #d1d5db" : "1px dashed #d1d5db"
              }}
            />
          </div>
        </div>
      </div>
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

/* --- tiny UI bits (inline styles; no libs) --- */
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
function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;
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
const page   = { minHeight: "100vh",maxWidth:'50%',width:'100%', background: "#f3f4f6", padding: 16, color: "#111827",marginTop: "5%" };
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

const btnPrimary = { background: "#2563eb", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 10px rgba(37,99,235,0.3)" };
const btnDanger  = { background: "#dc2626", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600 };
const btnGhost   = { background: "#111827", color: "white", border: "1px solid #111827", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 };
const btnSmallDanger = { background: "#991b1b", color: "white", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 };
