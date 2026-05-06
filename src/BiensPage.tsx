import { useState, useEffect } from "react"
import { supabase } from "./supabase"

const C = {
  g:   "#2d5b3d",
  gl:  "#3d7a52",
  gp:  "#e6efe9",
  cr:  "#f7f4ee",
  cr2: "#eeebe3",
  tx:  "#1a2a1f",
  tm:  "#6b8c74",
  rd:  "#c0392b",
  rp:  "#fdecea",
  bl:  "#2471a3",
  bp:  "#eaf4fb",
  wh:  "#ffffff",
  br:  "#dde8e0",
}

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })

// ── Types (schéma DB) ──────────────────────────────────────
type TypeBien = "appartement" | "maison" | "garage" | "local" | "autre"
type Regime   = "micro-foncier" | "reel" | "LMNP-micro" | "LMNP-reel"

interface Bien {
  id:            string
  owner_id:      string
  nom:           string
  adresse:       string | null
  type:          TypeBien | null
  surface_m2:    number | null
  nb_pieces:     number | null
  date_achat:    string | null
  prix_achat:    number | null
  regime_fiscal: Regime
  notes:         string | null
  created_at:    string
  updated_at:    string
}

const TYPE_LABELS: Record<TypeBien, string> = {
  appartement: "Appartement",
  maison:      "Maison",
  garage:      "Garage / Cave",
  local:       "Local commercial",
  autre:       "Autre",
}

const TYPE_EMOJI: Record<TypeBien, string> = {
  appartement: "🏠",
  maison:      "🏡",
  garage:      "🅿️",
  local:       "🏪",
  autre:       "🏗",
}

const REGIME_LABELS: Record<Regime, string> = {
  "micro-foncier": "Micro-foncier",
  "reel":          "Réel",
  "LMNP-micro":    "LMNP Micro-BIC",
  "LMNP-reel":     "LMNP Réel",
}

// ── Primitives UI ──────────────────────────────────────────

function Badge({ label, bg = C.gp, color = C.g }: { label: string; bg?: string; color?: string }) {
  return (
    <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:20, background:bg, color, fontSize:11, fontWeight:700 }}>
      {label}
    </span>
  )
}

function FieldInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>
        {label}
      </label>
      <input
        style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.br}`, borderRadius:8, fontSize:14, fontFamily:"inherit", color:C.tx, background:C.cr, outline:"none", boxSizing:"border-box" }}
        {...props}
      />
    </div>
  )
}

function FieldSelect({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>
        {label}
      </label>
      <select
        style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.br}`, borderRadius:8, fontSize:14, fontFamily:"inherit", color:C.tx, background:C.cr, outline:"none", boxSizing:"border-box" }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

function InfoRow({ label, value, bold = false, color }: { label:string; value:string; bold?:boolean; color?:string }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.br}`, fontSize:13 }}>
      <span style={{ color:C.tm }}>{label}</span>
      <span style={{ fontWeight:bold ? 800 : 600, color:color ?? C.tx }}>{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>
      {children}
    </div>
  )
}

// ── Carte bien ─────────────────────────────────────────────

function BienCard({ bien, onClick }: { bien: Bien; onClick: () => void }) {
  const emoji = TYPE_EMOJI[bien.type ?? "autre"] ?? "🏗"
  const label = TYPE_LABELS[bien.type ?? "autre"] ?? "Autre"

  return (
    <div
      onClick={onClick}
      style={{ background:C.wh, borderRadius:14, padding:"18px 20px", marginBottom:12, boxShadow:"0 1px 10px rgba(45,91,61,.07)", border:`1.5px solid ${C.br}`, cursor:"pointer", transition:"all .18s" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform="translateY(-2px)"; el.style.boxShadow="0 4px 20px rgba(45,91,61,.14)" }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform=""; el.style.boxShadow="0 1px 10px rgba(45,91,61,.07)" }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:20 }}>{emoji}</span>
            <span style={{ fontWeight:800, fontSize:16, color:C.tx }}>{bien.nom}</span>
          </div>
          {bien.adresse && (
            <div style={{ fontSize:12, color:C.tm, marginBottom:8 }}>📍 {bien.adresse}</div>
          )}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
            <Badge label={label} />
            <Badge label={REGIME_LABELS[bien.regime_fiscal]} bg={C.bp} color={C.bl} />
            {bien.surface_m2 != null && (
              <Badge label={`${bien.surface_m2} m²`} bg={C.cr2} color={C.tm} />
            )}
          </div>
        </div>

        <div style={{ textAlign:"right", flexShrink:0 }}>
          {bien.prix_achat != null ? (
            <>
              <div style={{ fontSize:10, color:C.tm, textTransform:"uppercase", marginBottom:2 }}>Valeur d'achat</div>
              <div style={{ fontSize:18, fontWeight:900, color:C.g }}>{euro(bien.prix_achat)}</div>
            </>
          ) : (
            <div style={{ fontSize:22, color:C.cr2 }}>—</div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Fiche détail ───────────────────────────────────────────

type TabKey = "infos" | "recettes" | "depenses" | "documents"

function BienDetail({
  bien,
  onBack,
  onDelete,
}: {
  bien:     Bien
  onBack:   () => void
  onDelete: (id: string) => void
}) {
  const [tab, setTab]         = useState<TabKey>("infos")
  const [deleting, setDeleting] = useState(false)

  const emoji = TYPE_EMOJI[bien.type ?? "autre"] ?? "🏗"
  const label = TYPE_LABELS[bien.type ?? "autre"] ?? "Autre"

  const tabs: { key: TabKey; label: string }[] = [
    { key:"infos",     label:"📋 Infos" },
    { key:"recettes",  label:"💰 Recettes" },
    { key:"depenses",  label:"📉 Dépenses" },
    { key:"documents", label:"📎 Documents" },
  ]

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer « ${bien.nom} » et toutes ses données ?`)) return
    setDeleting(true)
    onDelete(bien.id)
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.g, fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:16, fontFamily:"inherit", padding:0 }}
      >
        ← Retour à la liste
      </button>

      {/* Header gradient */}
      <div style={{ background:`linear-gradient(135deg,${C.g},${C.gl})`, borderRadius:16, padding:"20px 22px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:22, fontWeight:900, color:"#fff", marginBottom:4 }}>
              {emoji} {bien.nom}
            </div>
            {bien.adresse && (
              <div style={{ fontSize:13, color:"rgba(255,255,255,.75)", marginBottom:12 }}>
                📍 {bien.adresse}
              </div>
            )}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Badge label={label} bg="rgba(255,255,255,.2)" color="#fff" />
              <Badge label={REGIME_LABELS[bien.regime_fiscal]} bg="rgba(255,255,255,.15)" color="rgba(255,255,255,.9)" />
              {bien.surface_m2 != null && (
                <Badge label={`${bien.surface_m2} m²`} bg="rgba(255,255,255,.1)" color="rgba(255,255,255,.8)" />
              )}
            </div>
          </div>
          {bien.prix_achat != null && (
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.6)", textTransform:"uppercase", marginBottom:2 }}>Valeur d'achat</div>
              <div style={{ fontSize:24, fontWeight:900, color:"#a8d5b5" }}>{euro(bien.prix_achat)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ padding:"7px 14px", borderRadius:9, border:`1.5px solid ${tab===t.key?C.g:C.br}`, background:tab===t.key?C.g:C.wh, color:tab===t.key?"#fff":C.tx, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Onglet Infos */}
      {tab === "infos" && (
        <div>
          <div style={{ background:C.wh, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.br}`, marginBottom:12 }}>
            <SectionTitle>Informations générales</SectionTitle>
            <InfoRow label="Type de bien"  value={label} />
            <InfoRow label="Régime fiscal" value={REGIME_LABELS[bien.regime_fiscal]} />
            {bien.surface_m2 != null && <InfoRow label="Surface"      value={`${bien.surface_m2} m²`} />}
            {bien.nb_pieces  != null && <InfoRow label="Nb de pièces" value={String(bien.nb_pieces)} />}
            {bien.prix_achat != null && <InfoRow label="Prix d'achat" value={euro(bien.prix_achat)} bold />}
            {bien.date_achat          && <InfoRow label="Date d'achat" value={new Date(bien.date_achat).toLocaleDateString("fr-FR")} />}
            {bien.notes               && <InfoRow label="Notes"        value={bien.notes} />}
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ width:"100%", padding:"11px 0", borderRadius:10, border:`1.5px solid ${C.rd}`, background:"transparent", color:C.rd, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}
          >
            {deleting ? "Suppression…" : "🗑 Supprimer ce bien"}
          </button>
        </div>
      )}

      {/* Onglets à venir */}
      {tab !== "infos" && (
        <div style={{ background:C.wh, borderRadius:14, padding:"56px 20px", border:`1px solid ${C.br}`, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>
            {tab === "recettes" ? "💰" : tab === "depenses" ? "📉" : "📎"}
          </div>
          <div style={{ fontWeight:700, fontSize:15, color:C.tx, marginBottom:6 }}>
            {tab === "recettes" ? "Recettes" : tab === "depenses" ? "Dépenses" : "Documents"}
          </div>
          <div style={{ color:C.tm, fontSize:13 }}>
            Cette section sera connectée à Supabase à la prochaine étape.
          </div>
        </div>
      )}
    </div>
  )
}

// ── Formulaire ajout ───────────────────────────────────────

interface FormState {
  nom:           string
  adresse:       string
  type:          TypeBien
  regime_fiscal: Regime
  surface_m2:    string
  nb_pieces:     string
  prix_achat:    string
  date_achat:    string
  notes:         string
}

const EMPTY_FORM: FormState = {
  nom:           "",
  adresse:       "",
  type:          "appartement",
  regime_fiscal: "micro-foncier",
  surface_m2:    "",
  nb_pieces:     "",
  prix_achat:    "",
  date_achat:    "",
  notes:         "",
}

function AddBienModal({ onClose, onSave }: { onClose: () => void; onSave: (b: Bien) => void }) {
  const [form, setForm]     = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.nom.trim()) return
    setSaving(true)
    setError("")
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from("biens")
      .insert({
        owner_id:      user!.id,
        nom:           form.nom.trim(),
        adresse:       form.adresse.trim()  || null,
        type:          form.type,
        regime_fiscal: form.regime_fiscal,
        surface_m2:    form.surface_m2  ? parseFloat(form.surface_m2)  : null,
        nb_pieces:     form.nb_pieces   ? parseInt(form.nb_pieces)     : null,
        prix_achat:    form.prix_achat  ? parseFloat(form.prix_achat)  : null,
        date_achat:    form.date_achat  || null,
        notes:         form.notes.trim() || null,
      })
      .select()
      .single()
    setSaving(false)
    if (error) { setError("Erreur : " + error.message); return }
    onSave(data as Bien)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:900, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:C.wh, borderRadius:"18px 18px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto" }}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontWeight:800, fontSize:17, color:C.g }}>Nouveau bien</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.tm }}>✕</button>
        </div>

        <FieldInput
          label="Nom du bien *"
          placeholder="Ex. Appartement Gambetta"
          value={form.nom}
          onChange={set("nom")}
        />
        <FieldInput
          label="Adresse"
          placeholder="12 rue de la Paix, 75001 Paris"
          value={form.adresse}
          onChange={set("adresse")}
        />

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <FieldSelect label="Type de bien" value={form.type} onChange={set("type")}>
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
            <option value="garage">Garage / Cave</option>
            <option value="local">Local commercial</option>
            <option value="autre">Autre</option>
          </FieldSelect>
          <FieldSelect label="Régime fiscal" value={form.regime_fiscal} onChange={set("regime_fiscal")}>
            <option value="micro-foncier">Micro-foncier</option>
            <option value="reel">Réel</option>
            <option value="LMNP-micro">LMNP Micro-BIC</option>
            <option value="LMNP-reel">LMNP Réel</option>
          </FieldSelect>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <FieldInput label="Surface (m²)"  type="number" placeholder="45"  value={form.surface_m2} onChange={set("surface_m2")} />
          <FieldInput label="Nb de pièces"  type="number" placeholder="3"   value={form.nb_pieces}  onChange={set("nb_pieces")} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <FieldInput label="Prix d'achat (€)" type="number" placeholder="200 000" value={form.prix_achat}  onChange={set("prix_achat")} />
          <FieldInput label="Date d'achat"     type="date"                          value={form.date_achat}  onChange={set("date_achat")} />
        </div>

        <FieldInput
          label="Notes (optionnel)"
          placeholder="Observations, travaux prévus…"
          value={form.notes}
          onChange={set("notes")}
        />

        {error && (
          <div style={{ background:C.rp, color:C.rd, borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:14, fontWeight:600 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !form.nom.trim()}
          style={{
            width:"100%", padding:"13px 0", borderRadius:10,
            background: form.nom.trim() ? C.g : C.cr2,
            color:      form.nom.trim() ? "#fff" : C.tm,
            border:"none", fontWeight:800, fontSize:15,
            cursor: form.nom.trim() ? "pointer" : "not-allowed",
            fontFamily:"inherit", transition:"background .15s",
          }}
        >
          {saving ? "Enregistrement…" : "Enregistrer le bien"}
        </button>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────

export default function BiensPage() {
  const [biens, setBiens]       = useState<Bien[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")
  const [selected, setSelected] = useState<Bien | null>(null)
  const [showAdd, setShowAdd]   = useState(false)

  useEffect(() => { loadBiens() }, [])

  async function loadBiens() {
    setLoading(true)
    const { data, error } = await supabase
      .from("biens")
      .select("*")
      .order("created_at", { ascending: false })
    setLoading(false)
    if (error) { setError(error.message); return }
    setBiens(data ?? [])
  }

  async function deleteBien(id: string) {
    const { error } = await supabase.from("biens").delete().eq("id", id)
    if (!error) {
      setBiens(prev => prev.filter(b => b.id !== id))
      setSelected(null)
    }
  }

  const totalSurface = biens.reduce((s, b) => s + (b.surface_m2 ?? 0), 0)
  const totalValeur  = biens.reduce((s, b) => s + (b.prix_achat  ?? 0), 0)

  // Vue détail
  if (selected) {
    return (
      <BienDetail
        bien={selected}
        onBack={() => setSelected(null)}
        onDelete={deleteBien}
      />
    )
  }

  return (
    <>
      {/* En-tête */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.tx, margin:0, lineHeight:1.2 }}>Mes biens</h1>
          <div style={{ fontSize:13, color:C.tm, marginTop:3 }}>
            {loading
              ? "Chargement…"
              : `${biens.length} bien${biens.length !== 1 ? "s" : ""} enregistré${biens.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"10px 18px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}
        >
          + Ajouter un bien
        </button>
      </div>

      {/* Barre de stats */}
      {!loading && biens.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:22 }}>
          {[
            { label:"Biens",        value: String(biens.length),                                color:C.tx },
            { label:"Surface tot.", value: totalSurface > 0 ? `${totalSurface} m²` : "—",       color:C.g  },
            { label:"Valeur tot.",  value: totalValeur  > 0 ? euro(totalValeur)    : "—",       color:C.g  },
          ].map(s => (
            <div key={s.label} style={{ background:C.wh, borderRadius:12, padding:"14px 12px", border:`1px solid ${C.br}`, textAlign:"center" }}>
              <div style={{ fontSize:17, fontWeight:900, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:C.tm, marginTop:3, textTransform:"uppercase", letterSpacing:".05em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.tm }}>
          <div style={{ fontSize:32, marginBottom:10, opacity:.4 }}>⏳</div>
          <div>Chargement des biens…</div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{ background:C.rp, border:`1px solid ${C.rd}`, borderRadius:12, padding:"14px 16px", color:C.rd, fontWeight:600, fontSize:13, marginBottom:16 }}>
          ⚠️ {error}
        </div>
      )}

      {/* État vide */}
      {!loading && !error && biens.length === 0 && (
        <div style={{ background:C.wh, borderRadius:16, padding:"60px 20px", textAlign:"center", border:`1px solid ${C.br}` }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🏡</div>
          <div style={{ fontWeight:700, fontSize:17, marginBottom:6 }}>Aucun bien enregistré</div>
          <div style={{ color:C.tm, fontSize:13, marginBottom:20 }}>
            Ajoutez votre premier bien immobilier.
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"11px 22px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}
          >
            + Ajouter un bien
          </button>
        </div>
      )}

      {/* Liste */}
      {!loading && biens.map(b => (
        <BienCard key={b.id} bien={b} onClick={() => setSelected(b)} />
      ))}

      {/* Modal */}
      {showAdd && (
        <AddBienModal
          onClose={() => setShowAdd(false)}
          onSave={bien => setBiens(prev => [bien, ...prev])}
        />
      )}
    </>
  )
}
