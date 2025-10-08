import React, { useEffect, useState } from "react";

const API = "https://admin.theproxima.org";    // base
const ENDPOINT = `${API}/api`;          // JSON + images
const withBase = (src) => (!src ? "" : /^https?:\/\//i.test(src) ? src : `${API}${src.startsWith("/") ? "" : "/"}${src}`);


export default function AdminGallery() {
  const [doc, setDoc] = useState(null);
  const [msg, setMsg] = useState("");

  // files
  const [heroBg, setHeroBg] = useState(null);
  // eventFiles: key = `${yIdx}-${eIdx}` → FileList or Array<File>
  const [eventFiles, setEventFiles] = useState({}); // { '0-1': [File, ...] }

  useEffect(() => { load(); }, []);

  const normalize = (d) => ({
    _id: d?._id || null,
    hero: {
      title: d?.hero?.title || "Our Gallery",
      subtitle: d?.hero?.subtitle || "",
      bgImage: d?.hero?.bgImage || "",
    },
    years: Array.isArray(d?.years) ? d.years : [],
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await fetch(`${ENDPOINT}/gallery`);
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
  const addYear = () =>
    setDoc((s) => ({ ...s, years: [...s.years, { year: new Date().getFullYear(), events: [] }] }));
  const removeYear = (yIdx) =>
    setDoc((s) => ({ ...s, years: s.years.filter((_, i) => i !== yIdx) }));

  const setYearValue = (yIdx, val) =>
    setDoc((s) => {
      const years = [...s.years];
      years[yIdx] = { ...years[yIdx], year: Number(val) || '' };
      return { ...s, years };
    });

  const addEvent = (yIdx) =>
    setDoc((s) => {
      const years = [...s.years];
      const evs = [...(years[yIdx]?.events || [])];
      evs.push({ title: "", images: [] });
      years[yIdx] = { ...years[yIdx], events: evs };
      return { ...s, years };
    });

  const removeEvent = (yIdx, eIdx) =>
    setDoc((s) => {
      const years = [...s.years];
      const evs = (years[yIdx]?.events || []).filter((_, i) => i !== eIdx);
      years[yIdx] = { ...years[yIdx], events: evs };
      // reindex file map
      setEventFiles((m) => {
        const next = {};
        Object.entries(m).forEach(([k, files]) => {
          const [y,e] = k.split("-").map(Number);
          if (y !== yIdx) next[k] = files;
          else if (y === yIdx && e > eIdx) next[`${y}-${e-1}`] = files;
        });
        return next;
      });
      return { ...s, years };
    });

  const setEventTitle = (yIdx, eIdx, v) =>
    setDoc((s) => {
      const years = [...s.years];
      const evs = [...(years[yIdx]?.events || [])];
      evs[eIdx] = { ...evs[eIdx], title: v };
      years[yIdx] = { ...years[yIdx], events: evs };
      return { ...s, years };
    });

  const removeExistingImage = (yIdx, eIdx, imgIdx) =>
    setDoc((s) => {
      const years = [...s.years];
      const evs = [...(years[yIdx]?.events || [])];
      const imgs = [...(evs[eIdx]?.images || [])].filter((_, i) => i !== imgIdx);
      evs[eIdx] = { ...evs[eIdx], images: imgs };
      years[yIdx] = { ...years[yIdx], events: evs };
      return { ...s, years };
    });

  const onPickEventImages = (yIdx, eIdx, fileList) => {
    const key = `${yIdx}-${eIdx}`;
    const arr = Array.from(fileList || []);
    setEventFiles((m) => ({ ...m, [key]: (m[key] || []).concat(arr) }));
  };

  const clearPicked = (yIdx, eIdx) => {
    const key = `${yIdx}-${eIdx}`;
    setEventFiles((m) => {
      const next = { ...m };
      delete next[key];
      return next;
    });
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

      fd.append("years", JSON.stringify(
        (doc.years || []).map((y) => ({
          year: Number(y.year) || new Date().getFullYear(),
          events: (y.events || []).map((e) => ({
            title: e.title,
            images: e.images, // keep existing paths; backend deletes removed, appends new
          })),
        }))
      ));

      if (heroBg) fd.append("heroBg", heroBg);

      // attach new event images (Multiple allowed)
      Object.entries(eventFiles).forEach(([key, files]) => {
        const [yIdx, eIdx] = key.split("-").map(Number);
        files.forEach((f) => fd.append(`eventImgs${yIdx}_${eIdx}`, f));
      });

      const url = doc._id ? `${ENDPOINT}/gallery/${encodeURIComponent(doc._id)}` : `${ENDPOINT}/gallery`;
      const method = doc._id ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);

      await load();
      setHeroBg(null);
      setEventFiles({});
      setMsg("Saved ✔");
    } catch (e) {
      console.error(e);
      setMsg("Save failed ❌");
    }
  };

  const del = async () => {
    if (!doc?._id) return;
    if (!window.confirm("Delete the Gallery content?")) return;
    try {
      const res = await fetch(`${ENDPOINT}/gallery/${encodeURIComponent(doc._id)}`, { method: "DELETE" });
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
          <div style={title}>Gallery Admin</div>
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

      {/* YEARS + EVENTS */}
      <Card title="Years" action={<button style={btnGhost} onClick={addYear}>Add Year</button>}>
        {(doc.years || []).map((y, yi) => (
          <div key={yi} style={{ ...subCard, marginBottom: 12 }}>
            <div style={subHead}>
              <div style={{ fontWeight: 600 }}>Year #{yi + 1}</div>
              <button style={btnSmallDanger} onClick={() => removeYear(yi)}>Remove Year</button>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <Input label="Year" value={y.year} onChange={(v) => setYearValue(yi, v)} type="number" />

              {/* Events */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>Events</div>
                  <button style={btnGhost} onClick={() => addEvent(yi)}>Add Event</button>
                </div>

                {(y.events || []).map((e, ei) => {
                  const key = `${yi}-${ei}`;
                  const picks = eventFiles[key]?.map((f) => f.name).join(", ");
                  return (
                    <div key={ei} style={{ ...subCard, background: "#f9fafb" }}>
                      <div style={subHead}>
                        <div style={{ fontWeight: 500 }}>Event #{ei + 1}</div>
                        <button style={btnSmallDanger} onClick={() => removeEvent(yi, ei)}>Remove Event</button>
                      </div>

                      <Input label="Event Title" value={e.title} onChange={(v) => setEventTitle(yi, ei, v)} />

                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={labelStyle}>Existing Images</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                          {(e.images || []).map((img, ii) => (
                            <div key={ii} style={{ position: "relative", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                              <img src={withBase(img)} alt={`img-${ii}`} style={{ width: "100%", height: 100, objectFit: "cover" }} />
                              <button
                                onClick={() => removeExistingImage(yi, ei, ii)}
                                style={{ position: "absolute", top: 6, right: 6, background: "#991b1b", color: "#fff", border: "none", borderRadius: 6, padding: "2px 6px", fontSize: 12, cursor: "pointer" }}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <label style={btnGhost}>
                          Add Images
                          <input type="file" multiple onChange={(e) => onPickEventImages(yi, ei, e.target.files)} style={{ display: "none" }}/>
                        </label>
                        {picks && <div style={muted}>Picked: {picks}</div>}
                        {eventFiles[key]?.length ? (
                          <button style={btnSmallDanger} onClick={() => clearPicked(yi, ei)}>Clear Picks</button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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

/* small UI helpers (inline styles) */
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
