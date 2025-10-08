import React, { useEffect, useState } from "react";

const API = "https://admin.theproxima.org/api"; // your temporary backend url

export default function AdminHome() {
  const [doc, setDoc] = useState(null);
  const [msg, setMsg] = useState("");

  // File states
  const [heroFiles, setHeroFiles] = useState([]);                 // File[]
  const [welcomeCardFiles, setWelcomeCardFiles] = useState({});   // { [idx]: File }
  const [aboutFiles, setAboutFiles] = useState({});               // { [idx]: File }
  const [confFiles, setConfFiles] = useState({});                 // { [idx]: File }
  const [sustainFile, setSustainFile] = useState(null);           // File
  const [testiFiles, setTestiFiles] = useState({});               // { [idx]: File }

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setMsg("");
    try {
      const res = await fetch(`${API}/home`);
      const data = await res.json();
      setDoc(normalizeDoc(data));
    } catch (e) {
      console.error(e);
      setMsg("Failed to load data");
    }
  };

  // Ensure shapes exist so inputs don't break
  const normalizeDoc = (d) => ({
    _id: d?._id || null,
    hero: {
      images: Array.isArray(d?.hero?.images) ? d.hero.images : [],
      heading: d?.hero?.heading || "THE PROXIMA",
      subheading: d?.hero?.subheading || "",
      buttonText: d?.hero?.buttonText || "Explore Conferences",
    },
    welcome: {
      heading: d?.welcome?.heading || "Welcome to Proxima",
      content: d?.welcome?.content || "",
      cards: Array.isArray(d?.welcome?.cards) ? d.welcome.cards : [],
    },
    stats: Array.isArray(d?.stats) ? d.stats : [],
    about: Array.isArray(d?.about) ? d.about : [],
    conferences: Array.isArray(d?.conferences) ? d.conferences : [],
    sustainableConferences: {
      content: d?.sustainableConferences?.content || "",
      image: d?.sustainableConferences?.image || "",
      imageAlt: d?.sustainableConferences?.imageAlt || "Sustainable Conferences",
    },
    testimonials: Array.isArray(d?.testimonials) ? d.testimonials : [],
  });

  // ------- Change helpers -------
  const setHeroField = (key, val) => setDoc((s) => ({ ...s, hero: { ...s.hero, [key]: val } }));
  const setWelcomeField = (key, val) =>
    setDoc((s) => ({ ...s, welcome: { ...s.welcome, [key]: val } }));

  const updateArrayItem = (section, idx, key, val) =>
    setDoc((s) => {
      const arr = [...s[section]];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...s, [section]: arr };
    });

  const updateWelcomeCard = (idx, key, val) =>
    setDoc((s) => {
      const cards = [...s.welcome.cards];
      cards[idx] = { ...cards[idx], [key]: val };
      return { ...s, welcome: { ...s.welcome, cards } };
    });

  // Add / Remove items — explicit functions (fixes your crash)
  const addWelcomeCard = () =>
    setDoc((s) => ({ ...s, welcome: { ...s.welcome, cards: [...s.welcome.cards, { image: "", title: "", desc: "" }] } }));

  const removeWelcomeCard = (idx) =>
    setDoc((s) => {
      const cards = s.welcome.cards.filter((_, i) => i !== idx);
      // reindex files
      setWelcomeCardFiles((m) => {
        const next = {};
        Object.keys(m).forEach((k) => {
          const i = Number(k);
          if (i < idx) next[i] = m[i];
          else if (i > idx) next[i - 1] = m[i];
        });
        return next;
      });
      return { ...s, welcome: { ...s.welcome, cards } };
    });

  const addStat = () =>
    setDoc((s) => ({ ...s, stats: [...s.stats, { label: "", value: 0, suffix: "" }] }));
  const removeStat = (idx) =>
    setDoc((s) => ({ ...s, stats: s.stats.filter((_, i) => i !== idx) }));

  const addAbout = () =>
    setDoc((s) => ({ ...s, about: [...s.about, { image: "", heading: "", content: "" }] }));
  const removeAbout = (idx) =>
    setDoc((s) => {
      setAboutFiles((m) => reindexFileMap(m, idx));
      return { ...s, about: s.about.filter((_, i) => i !== idx) };
    });

  const addConference = () =>
    setDoc((s) => ({ ...s, conferences: [...s.conferences, { title: "", img: "", text: "", link: "" }] }));
  const removeConference = (idx) =>
    setDoc((s) => {
      setConfFiles((m) => reindexFileMap(m, idx));
      return { ...s, conferences: s.conferences.filter((_, i) => i !== idx) };
    });

  const addTestimonial = () =>
    setDoc((s) => ({ ...s, testimonials: [...s.testimonials, { name: "", affiliation: "", comment: "", photo: "" }] }));
  const removeTestimonial = (idx) =>
    setDoc((s) => {
      setTestiFiles((m) => reindexFileMap(m, idx));
      return { ...s, testimonials: s.testimonials.filter((_, i) => i !== idx) };
    });

  const reindexFileMap = (map, removedIdx) => {
    const next = {};
    Object.keys(map).forEach((k) => {
      const i = Number(k);
      if (i < removedIdx) next[i] = map[i];
      else if (i > removedIdx) next[i - 1] = map[i];
    });
    return next;
  };

  // ------- Save / Delete -------
  const save = async () => {
    if (!doc) return;
    setMsg("");
    try {
      const fd = new FormData();

      // JSON fields
      fd.append("hero", JSON.stringify({
        heading: doc.hero.heading,
        subheading: doc.hero.subheading,
        buttonText: doc.hero.buttonText,
      }));
      fd.append("welcome", JSON.stringify({
        heading: doc.welcome.heading,
        content: doc.welcome.content,
        cards: doc.welcome.cards.map(({ image, title, desc }) => ({ image, title, desc })),
      }));
      fd.append("stats", JSON.stringify(doc.stats));
      fd.append("about", JSON.stringify(doc.about));
      fd.append("conferences", JSON.stringify(doc.conferences));
      fd.append("sustainableConferences", JSON.stringify({
        content: doc.sustainableConferences.content,
        imageAlt: doc.sustainableConferences.imageAlt,
      }));
      fd.append("testimonials", JSON.stringify(doc.testimonials));

      // Files
      heroFiles.forEach((f) => fd.append("heroImages", f));
      Object.entries(welcomeCardFiles).forEach(([i, f]) => f && fd.append(`welcomeCardImgs${i}`, f));
      Object.entries(aboutFiles).forEach(([i, f]) => f && fd.append(`aboutImgs${i}`, f));
      Object.entries(confFiles).forEach(([i, f]) => f && fd.append(`conferenceImgs${i}`, f));
      if (sustainFile) fd.append("sustainImage", sustainFile);
      Object.entries(testiFiles).forEach(([i, f]) => f && fd.append(`testimonialPhotos${i}`, f));

      const url = doc._id ? `${API}/homme/${encodeURIComponent(doc._id)}` : `${API}/home`;
      const method = doc._id ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);

      await load();
      setHeroFiles([]);
      setWelcomeCardFiles({});
      setAboutFiles({});
      setConfFiles({});
      setSustainFile(null);
      setTestiFiles({});

      setMsg("Saved successfully ✔");
    } catch (e) {
      console.error(e);
      setMsg("Save failed ❌");
    }
  };

  const del = async () => {
    if (!doc?._id) return;
    if (!window.confirm("Delete the Home document and uploaded files?")) return;
    try {
      const res = await fetch(`${API}/home/${encodeURIComponent(doc._id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setDoc(normalizeDoc({}));
      setMsg("Deleted ✔ (press Save to create new)");
    } catch (e) {
      console.error(e);
      setMsg("Delete failed ❌");
    }
  };

  if (!doc) return <div style={{ padding: 20 }}>Loading…</div>;

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={title}>Home Admin</div>
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
          Upload Images
          <input type="file" multiple onChange={(e) => setHeroFiles(Array.from(e.target.files || []))} style={{ display: "none" }}/>
        </label>
      }>
        <Row>
          <Input label="Heading" value={doc.hero.heading} onChange={(v) => setHeroField("heading", v)} />
          <Input label="Subheading" value={doc.hero.subheading} onChange={(v) => setHeroField("subheading", v)} />
        </Row>
        <Row>
          <Input label="Button Text" value={doc.hero.buttonText} onChange={(v) => setHeroField("buttonText", v)} />
        </Row>
        <div style={muted}>
          {heroFiles.length ? `Selected ${heroFiles.length} new file(s)` : `Existing images: ${doc.hero.images.length}`}
        </div>
      </Card>

      {/* WELCOME */}
      <Card title="Welcome" action={<button style={btnGhost} onClick={addWelcomeCard}>Add Card</button>}>
        <Input label="Heading" value={doc.welcome.heading} onChange={(v) => setWelcomeField("heading", v)} />
        <Textarea label="Content" value={doc.welcome.content} onChange={(v) => setWelcomeField("content", v)} />
        {doc.welcome.cards.map((c, i) => (
          <SubCard key={i} title={`Card #${i + 1}`} onRemove={() => removeWelcomeCard(i)}>
            <Input label="Title" value={c.title || ""} onChange={(v) => updateWelcomeCard(i, "title", v)} />
            <Input label="Description" value={c.desc || ""} onChange={(v) => updateWelcomeCard(i, "desc", v)} />
            <label style={btnGhost}>
              Upload Image
              <input type="file" onChange={(e) => setWelcomeCardFiles((m) => ({ ...m, [i]: (e.target.files && e.target.files[0]) || null }))} style={{ display: "none" }}/>
            </label>
            <div style={muted}>{welcomeCardFiles[i]?.name || c.image || "No image selected"}</div>
          </SubCard>
        ))}
      </Card>

      {/* STATS */}
      <Card title="Stats" action={<button style={btnGhost} onClick={addStat}>Add Stat</button>}>
        {doc.stats.map((s, i) => (
          <SubCard key={i} title={`Stat #${i + 1}`} onRemove={() => removeStat(i)}>
            <Row>
              <Input label="Label" value={s.label} onChange={(v) => updateArrayItem("stats", i, "label", v)} />
              <Input type="number" label="Value" value={s.value} onChange={(v) => updateArrayItem("stats", i, "value", Number(v || 0))} />
              <Input label="Suffix" value={s.suffix || ""} onChange={(v) => updateArrayItem("stats", i, "suffix", v)} />
            </Row>
          </SubCard>
        ))}
      </Card>

      {/* ABOUT */}
      <Card title="About" action={<button style={btnGhost} onClick={addAbout}>Add Block</button>}>
        {doc.about.map((a, i) => (
          <SubCard key={i} title={`Block #${i + 1}`} onRemove={() => removeAbout(i)}>
            <Input label="Heading" value={a.heading} onChange={(v) => updateArrayItem("about", i, "heading", v)} />
            <Textarea label="Content" value={a.content} onChange={(v) => updateArrayItem("about", i, "content", v)} />
            <label style={btnGhost}>
              Upload Image
              <input type="file" onChange={(e) => setAboutFiles((m) => ({ ...m, [i]: (e.target.files && e.target.files[0]) || null }))} style={{ display: "none" }}/>
            </label>
            <div style={muted}>{aboutFiles[i]?.name || a.image || "No image selected"}</div>
          </SubCard>
        ))}
      </Card>

      {/* CONFERENCES */}
      <Card title="Conferences" action={<button style={btnGhost} onClick={addConference}>Add Conference</button>}>
        {doc.conferences.map((c, i) => (
          <SubCard key={i} title={`Conference #${i + 1}`} onRemove={() => removeConference(i)}>
            <Row>
              <Input label="Title" value={c.title} onChange={(v) => updateArrayItem("conferences", i, "title", v)} />
              <Input label="Link" value={c.link || ""} onChange={(v) => updateArrayItem("conferences", i, "link", v)} />
            </Row>
            <Textarea label="Text" value={c.text} onChange={(v) => updateArrayItem("conferences", i, "text", v)} />
            <label style={btnGhost}>
              Upload Image
              <input type="file" onChange={(e) => setConfFiles((m) => ({ ...m, [i]: (e.target.files && e.target.files[0]) || null }))} style={{ display: "none" }}/>
            </label>
            <div style={muted}>{confFiles[i]?.name || c.img || "No image selected"}</div>
          </SubCard>
        ))}
      </Card>

      {/* SUSTAINABLE */}
      <Card title="Sustainable Conferences" action={
        <label style={btnGhost}>
          Upload Image
          <input type="file" onChange={(e) => setSustainFile((e.target.files && e.target.files[0]) || null)} style={{ display: "none" }}/>
        </label>
      }>
        <Textarea
          label="Content"
          value={doc.sustainableConferences.content}
          onChange={(v) =>
            setDoc((s) => ({ ...s, sustainableConferences: { ...s.sustainableConferences, content: v } }))
          }
        />
        <Input
          label="Image Alt"
          value={doc.sustainableConferences.imageAlt}
          onChange={(v) =>
            setDoc((s) => ({ ...s, sustainableConferences: { ...s.sustainableConferences, imageAlt: v } }))
          }
        />
        <div style={muted}>{sustainFile?.name || doc.sustainableConferences.image || "No image selected"}</div>
      </Card>

      {/* TESTIMONIALS */}
      <Card title="Testimonials" action={<button style={btnGhost} onClick={addTestimonial}>Add Testimonial</button>}>
        {doc.testimonials.map((t, i) => (
          <SubCard key={i} title={`Testimonial #${i + 1}`} onRemove={() => removeTestimonial(i)}>
            <Row>
              <Input label="Name" value={t.name} onChange={(v) => updateArrayItem("testimonials", i, "name", v)} />
              <Input label="Affiliation" value={t.affiliation || ""} onChange={(v) => updateArrayItem("testimonials", i, "affiliation", v)} />
            </Row>
            <Textarea label="Comment" value={t.comment} onChange={(v) => updateArrayItem("testimonials", i, "comment", v)} />
            <label style={btnGhost}>
              Upload Photo
              <input type="file" onChange={(e) => setTestiFiles((m) => ({ ...m, [i]: (e.target.files && e.target.files[0]) || null }))} style={{ display: "none" }}/>
            </label>
            <div style={muted}>{testiFiles[i]?.name || t.photo || "No image selected"}</div>
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

/* ---------------- UI bits (no libs) ---------------- */
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
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? e.target.value : e.target.value)}
        style={input}
      />
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

/* ---------------- Inline styles ---------------- */
const page   = { minHeight: "100vh", background: "#f3f4f6", padding: 16, color: "#111827",marginTop: "5%" };
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
const btnDanger  = { background: "#dc2626", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600, opacity: 1, boxShadow: "0 4px 10px rgba(220,38,38,0.25)" };
const btnGhost   = { background: "#111827", color: "white", border: "1px solid #111827", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 };
const btnSmallDanger = { background: "#991b1b", color: "white", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 };
