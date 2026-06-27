import { useState } from "react";
import { C } from "../../../constants/colors.js";
import { DB } from "../../../config/database.js";
import { toast } from "../../../hooks/useToast.jsx";
import { Card, Btn, Input, Badge } from "../../Shared/SharedComponents.jsx";


export const YoutubePlaylistManager = () => {
  const [playlists, setPlaylists] = useState(() => DB.get("youtubePlaylists") || []);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: "", playlistId: "", description: "", subject: "", videosCount: 0 });

  const save = () => {
    if (!form.title || !form.playlistId) { toast("Title and Playlist ID required!", "error"); return; }
    const updated = editItem
      ? playlists.map(p => p.id === editItem.id ? { ...p, ...form } : p)
      : [...playlists, { ...form, id: Date.now() }];
    setPlaylists(updated); DB.set("youtubePlaylists", updated); resetForm();
  };

  const resetForm = () => {
    setForm({ title: "", playlistId: "", description: "", subject: "", videosCount: 0 });
    setEditItem(null); setShowForm(false);
  };

  const edit = (p) => {
    setEditItem(p); setForm(p); setShowForm(true);
  };

  const del = (id) => {
    const u = playlists.filter(p => p.id !== id); setPlaylists(u); DB.set("youtubePlaylists", u);
  };

  const youtubeLink = (id) => `https://www.youtube.com/playlist?list=${id}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>🎬 YouTube Playlists</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>Link educational YouTube playlists</p>
        </div>
        <Btn variant="primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>+ Add Playlist</Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24, border: `1px solid ${C.primary}44`, background: `${C.primary}06` }}>
          <h3 style={{ color: C.text, margin: "0 0 22px", fontSize: 17 }}>{editItem ? "✏️ Edit Playlist" : "➕ New Playlist"}</h3>

          <div style={{ marginBottom: 14 }}>
            <Input label="PLAYLIST TITLE *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Physics Complete Course" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Input label="YOUTUBE PLAYLIST ID *" value={form.playlistId} onChange={e => setForm({ ...form, playlistId: e.target.value })} placeholder="PLxxxxxxxxxxxxxx" />
            <Input label="SUBJECT" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Physics / Chemistry / Math" />
            <Input label="NUMBER OF VIDEOS" value={form.videosCount} onChange={e => setForm({ ...form, videosCount: parseInt(e.target.value) })} type="number" />
          </div>

          <div>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>DESCRIPTION</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Playlist description..."
              style={{ width: "100%", padding: 10, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontFamily: "inherit", minHeight: 60 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="primary" onClick={save}>{editItem ? "✅ Update" : "✅ Add Playlist"}</Btn>
            <Btn variant="ghost" onClick={resetForm}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {playlists.map(p => (
          <Card key={p.id} style={{ border: `1px solid ${C.danger}33` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 24, lineHeight: 1 }}>🎬</div>
              <h3 style={{ color: C.text, margin: 0, fontSize: 14, fontWeight: 800, flex: 1 }}>{p.title}</h3>
            </div>

            {p.subject && <Badge style={{ background: `${C.primary}22`, color: C.primary, marginBottom: 10 }}>📚 {p.subject}</Badge>}
            <p style={{ color: C.textMuted, fontSize: 12, margin: "8px 0", lineHeight: 1.4 }}>{p.description}</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${C.border}`, marginTop: 10 }}>
              <div style={{ fontSize: 12, color: C.textMuted }}>🎥 {p.videosCount} videos</div>
              <div style={{ fontSize: 11, color: C.danger, fontWeight: 600 }}>YouTube</div>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <Btn variant="primary" size="sm" onClick={() => window.open(youtubeLink(p.playlistId), "_blank")}>🔗 Open</Btn>
              <Btn variant="ghost" size="sm" onClick={() => edit(p)}>✏️</Btn>
              <Btn variant="danger" size="sm" onClick={() => del(p.id)}>🗑️</Btn>
            </div>
          </Card>
        ))}
      </div>

      {playlists.length === 0 && (
        <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
          <p style={{ color: C.textMuted }}>No playlists linked yet. Add your first educational playlist!</p>
        </Card>
      )}
    </div>
  );
};
