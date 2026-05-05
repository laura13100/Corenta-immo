import { useState, useMemo } from "react"

// ── Palette ────────────────────────────────────────────────
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
  gd:  "#b7860b",
  dp:  "#fef9e7",
  wh:  "#ffffff",
  br:  "#dde8e0",
}

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })

const formatDate = (d: string) => {
  const [y, m, j] = d.split("-")
  return `${j}/${m}/${y}`
}

const MOIS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
]

// ── Types ──────────────────────────────────────────────────
type TypeRecette = "loyer" | "charges" | "depot_garantie" | "autre"

interface Recette {
  id: string
  bien_id: string
  bien_nom: string
  locataire?: string
  type: TypeRecette
  montant: number
  date: string        // YYYY-MM-DD
  description?: string
}

const TYPE_CONFIG: Record<TypeRecette, { label: string; bg: string; color: string }> = {
  loyer:           { label: "Loyer",           bg: C.gp, color: C.g  },
  charges:         { label: "Charges",         bg: C.bp, color: C.bl },
  depot_garantie:  { label: "Dépôt garantie",  bg: C.dp, color: C.gd },
  autre:           { label: "Autre revenu",    bg: C.cr2, color: C.tm },
}

// ── Références biens (pour le formulaire) ─────────────────
const BIENS_REF = [
  { id: "b1", nom: "Appartement Gambetta" },
  { id: "b2", nom: "Studio Confluence"    },
  { id: "b3", nom: "Garage Bellecour"     },
  { id: "b4", nom: "T2 Croix-Rousse"     },
]

// ── Données fictives ───────────────────────────────────────
const MOCK_RECETTES: Recette[] = [
  // ── Janvier 2026
  { id:"r01", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"loyer",   montant:850,  date:"2026-01-05", description:"Loyer janvier 2026" },
  { id:"r02", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"charges", montant:80,   date:"2026-01-05", description:"Charges janvier 2026" },
  { id:"r03", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"loyer",   montant:620,  date:"2026-01-03", description:"Loyer janvier 2026" },
  { id:"r04", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"charges", montant:50,   date:"2026-01-03", description:"Charges janvier 2026" },
  { id:"r05", bien_id:"b3", bien_nom:"Garage Bellecour",     locataire:"Marie Blanc",    type:"loyer",   montant:120,  date:"2026-01-07", description:"Loyer janvier 2026" },

  // ── Février 2026
  { id:"r06", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"loyer",   montant:850,  date:"2026-02-05", description:"Loyer février 2026" },
  { id:"r07", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"charges", montant:80,   date:"2026-02-05", description:"Charges février 2026" },
  { id:"r08", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"loyer",   montant:620,  date:"2026-02-03", description:"Loyer février 2026" },
  { id:"r09", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"charges", montant:50,   date:"2026-02-03", description:"Charges février 2026" },
  { id:"r10", bien_id:"b3", bien_nom:"Garage Bellecour",     locataire:"Marie Blanc",    type:"loyer",   montant:120,  date:"2026-02-07", description:"Loyer février 2026" },

  // ── Mars 2026
  { id:"r11", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"loyer",   montant:850,  date:"2026-03-05", description:"Loyer mars 2026" },
  { id:"r12", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"charges", montant:80,   date:"2026-03-05", description:"Charges mars 2026" },
  { id:"r13", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"loyer",   montant:620,  date:"2026-03-03", description:"Loyer mars 2026" },
  { id:"r14", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"charges", montant:50,   date:"2026-03-03", description:"Charges mars 2026" },
  { id:"r15", bien_id:"b3", bien_nom:"Garage Bellecour",     locataire:"Marie Blanc",    type:"loyer",   montant:120,  date:"2026-03-07", description:"Loyer mars 2026" },
  { id:"r16", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"autre",   montant:150,  date:"2026-03-18", description:"Remboursement sinistre assurance" },

  // ── Avril 2026
  { id:"r17", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"loyer",   montant:850,  date:"2026-04-05", description:"Loyer avril 2026" },
  { id:"r18", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"charges", montant:80,   date:"2026-04-05", description:"Charges avril 2026" },
  { id:"r19", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"loyer",   montant:620,  date:"2026-04-03", description:"Loyer avril 2026" },
  { id:"r20", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"charges", montant:50,   date:"2026-04-03", description:"Charges avril 2026" },
  { id:"r21", bien_id:"b3", bien_nom:"Garage Bellecour",     locataire:"Marie Blanc",    type:"loyer",   montant:120,  date:"2026-04-07", description:"Loyer avril 2026" },

  // ── Mai 2026
  { id:"r22", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"loyer",   montant:850,  date:"2026-05-05", description:"Loyer mai 2026" },
  { id:"r23", bien_id:"b1", bien_nom:"Appartement Gambetta", locataire:"Sophie Martin",  type:"charges", montant:80,   date:"2026-05-05", description:"Charges mai 2026" },
  { id:"r24", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"loyer",   montant:620,  date:"2026-05-03", description:"Loyer mai 2026" },
  { id:"r25", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"charges", montant:50,   date:"2026-05-03", description:"Charges mai 2026" },
  { id:"r26", bien_id:"b3", bien_nom:"Garage Bellecour",     locataire:"Marie Blanc",    type:"loyer",   montant:120,  date:"2026-05-07", description:"Loyer mai 2026" },
  { id:"r27", bien_id:"b2", bien_nom:"Studio Confluence",    locataire:"Thomas Durand",  type:"depot_garantie", montant:620, date:"2026-05-01", description:"Dépôt de garantie" },
]

const ANNEES_DISPO = [2026, 2025]

// ── Primitives UI ──────────────────────────────────────────

function Badge({ label, bg = C.gp, color = C.g }: { label: string; bg?: string; color?: string }) {
  return (
    <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:20, background:bg, color, fontSize:11, fontWeight:700 }}>
      {label}
    </span>
  )
}

function FieldSelect({
  label, value, onChange, children,
}: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:10, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:3 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width:"100%", padding:"8px 10px", border:`1.5px solid ${C.br}`, borderRadius:8, fontSize:13, fontFamily:"inherit", color:C.tx, background:C.cr, outline:"none", boxSizing:"border-box" }}
      >
        {children}
      </select>
    </div>
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

// ── Ligne de recette ───────────────────────────────────────

function RecetteLigne({ r }: { r: Recette }) {
  const cfg = TYPE_CONFIG[r.type]
  return (
    <div
      style={{
        display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        padding:"11px 0", borderBottom:`1px solid ${C.br}`, gap:12,
      }}
    >
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", marginBottom:4 }}>
          <Badge label={cfg.label} bg={cfg.bg} color={cfg.color} />
          <span style={{ fontSize:12, color:C.tm }}>{r.bien_nom}</span>
          {r.locataire && (
            <span style={{ fontSize:11, color:C.tm }}>· 👤 {r.locataire}</span>
          )}
        </div>
        {r.description && (
          <div style={{ fontSize:13, color:C.tx, fontWeight:500 }}>{r.description}</div>
        )}
        <div style={{ fontSize:11, color:C.tm, marginTop:2 }}>📅 {formatDate(r.date)}</div>
      </div>
      <div style={{ fontWeight:800, fontSize:15, color:C.g, flexShrink:0, whiteSpace:"nowrap" }}>
        +{euro(r.montant)}
      </div>
    </div>
  )
}

// ── Modal ajout d'une recette ──────────────────────────────

interface FormState {
  bien_id: string
  type: TypeRecette
  montant: string
  date: string
  description: string
  locataire: string
}

const today = new Date().toISOString().slice(0, 10)

function AddRecetteModal({ onClose, onSave }: { onClose: () => void; onSave: (r: Recette) => void }) {
  const [form, setForm] = useState<FormState>({
    bien_id:     BIENS_REF[0].id,
    type:        "loyer",
    montant:     "",
    date:        today,
    description: "",
    locataire:   "",
  })

  const set = (key: keyof FormState) => (v: string) =>
    setForm(f => ({ ...f, [key]: v }))

  const bienNom = BIENS_REF.find(b => b.id === form.bien_id)?.nom ?? ""
  const canSave = !!form.montant && !!form.date

  const handleSave = () => {
    if (!canSave) return
    onSave({
      id:          Date.now().toString(),
      bien_id:     form.bien_id,
      bien_nom:    bienNom,
      locataire:   form.locataire || undefined,
      type:        form.type,
      montant:     parseFloat(form.montant),
      date:        form.date,
      description: form.description || undefined,
    })
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
        {/* En-tête */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontWeight:800, fontSize:17, color:C.g }}>Nouvelle recette</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.tm }}>✕</button>
        </div>

        {/* Type */}
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {(Object.entries(TYPE_CONFIG) as [TypeRecette, typeof TYPE_CONFIG[TypeRecette]][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => set("type")(k)}
              style={{
                flex:1, padding:"8px 4px", borderRadius:9, border:`2px solid ${form.type === k ? v.color : C.br}`,
                background: form.type === k ? v.bg : C.wh, color: form.type === k ? v.color : C.tm,
                fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"inherit",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Bien */}
        <div style={{ marginBottom:12 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>
            Bien concerné
          </label>
          <select
            value={form.bien_id}
            onChange={e => set("bien_id")(e.target.value)}
            style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.br}`, borderRadius:8, fontSize:14, fontFamily:"inherit", color:C.tx, background:C.cr, outline:"none", boxSizing:"border-box" }}
          >
            {BIENS_REF.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </select>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <FieldInput
            label="Montant (€) *"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.montant}
            onChange={e => set("montant")(e.target.value)}
          />
          <FieldInput
            label="Date *"
            type="date"
            value={form.date}
            onChange={e => set("date")(e.target.value)}
          />
        </div>

        <FieldInput
          label="Locataire"
          placeholder="Nom du locataire"
          value={form.locataire}
          onChange={e => set("locataire")(e.target.value)}
        />
        <FieldInput
          label="Description"
          placeholder="Ex. Loyer mai 2026"
          value={form.description}
          onChange={e => set("description")(e.target.value)}
        />

        <button
          onClick={handleSave}
          style={{
            width:"100%", padding:"13px 0", borderRadius:10,
            background: canSave ? C.g : C.cr2,
            color: canSave ? "#fff" : C.tm,
            border:"none", fontWeight:800, fontSize:15,
            cursor: canSave ? "pointer" : "not-allowed",
            fontFamily:"inherit", transition:"background .15s",
          }}
        >
          Enregistrer la recette
        </button>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────

export default function RecettesPage() {
  const [recettes, setRecettes] = useState<Recette[]>(MOCK_RECETTES)
  const [filterBien, setFilterBien] = useState("")
  const [filterAnnee, setFilterAnnee] = useState(2026)
  const [filterMois, setFilterMois] = useState(0)    // 0 = tous
  const [showAdd, setShowAdd] = useState(false)

  // ── Filtrage ───────────────────────────────────────────
  const filtered = useMemo(() => {
    return recettes.filter(r => {
      const [y, m] = r.date.split("-")
      if (parseInt(y) !== filterAnnee)       return false
      if (filterMois && parseInt(m) !== filterMois) return false
      if (filterBien && r.bien_id !== filterBien)   return false
      return true
    })
  }, [recettes, filterBien, filterAnnee, filterMois])

  // ── Totaux ─────────────────────────────────────────────
  const totalPeriode = filtered.reduce((s, r) => s + r.montant, 0)
  const totalLoyers  = filtered.filter(r => r.type === "loyer").reduce((s, r) => s + r.montant, 0)
  const nbMoisActifs = useMemo(() => {
    const mois = new Set(filtered.map(r => r.date.slice(0, 7)))
    return mois.size
  }, [filtered])
  const moyMensuelle = nbMoisActifs > 0 ? totalPeriode / nbMoisActifs : 0

  // ── Groupement par mois ────────────────────────────────
  const grouped = useMemo(() => {
    const groups: Record<string, Recette[]> = {}
    filtered.forEach(r => {
      const key = r.date.slice(0, 7)
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => {
        const [y, m] = key.split("-")
        return {
          key,
          label: `${MOIS_FR[parseInt(m) - 1]} ${y}`,
          total: items.reduce((s, r) => s + r.montant, 0),
          items: [...items].sort((a, b) => b.date.localeCompare(a.date)),
        }
      })
  }, [filtered])

  return (
    <>
      {/* ── En-tête ─────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.tx, margin:0, lineHeight:1.2 }}>Recettes</h1>
          <div style={{ fontSize:13, color:C.tm, marginTop:3 }}>
            {filtered.length} encaissement{filtered.length !== 1 ? "s" : ""} · {filterAnnee}
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"10px 18px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}
        >
          + Ajouter
        </button>
      </div>

      {/* ── Filtres ──────────────────────────────────────── */}
      <div
        style={{
          background:C.wh, borderRadius:12, padding:"14px 16px",
          border:`1px solid ${C.br}`, marginBottom:16,
          display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12,
        }}
      >
        <FieldSelect label="Bien" value={filterBien} onChange={setFilterBien}>
          <option value="">Tous les biens</option>
          {BIENS_REF.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </FieldSelect>

        <FieldSelect label="Année" value={filterAnnee.toString()} onChange={v => setFilterAnnee(parseInt(v))}>
          {ANNEES_DISPO.map(a => <option key={a} value={a}>{a}</option>)}
        </FieldSelect>

        <FieldSelect label="Mois" value={filterMois.toString()} onChange={v => setFilterMois(parseInt(v))}>
          <option value="0">Tous les mois</option>
          {MOIS_FR.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </FieldSelect>
      </div>

      {/* ── Barre de stats ───────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { label: filterMois ? "Total du mois" : "Total annuel", value: euro(totalPeriode), color: C.g   },
          { label: "Dont loyers",    value: euro(totalLoyers),   color: C.g   },
          { label: "Nb opérations",  value: filtered.length.toString(), color: C.tx },
          { label: "Moy. mensuelle", value: euro(moyMensuelle),  color: C.gd  },
        ].map(s => (
          <div key={s.label} style={{ background:C.wh, borderRadius:12, padding:"14px 12px", border:`1px solid ${C.br}`, textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:900, color:s.color, lineHeight:1.2 }}>{s.value}</div>
            <div style={{ fontSize:10, color:C.tm, marginTop:3, textTransform:"uppercase", letterSpacing:".05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Répartition par type ─────────────────────────── */}
      {filtered.length > 0 && (
        <div
          style={{
            background:C.wh, borderRadius:12, padding:"14px 16px",
            border:`1px solid ${C.br}`, marginBottom:16,
            display:"flex", gap:8, flexWrap:"wrap",
          }}
        >
          {(Object.entries(TYPE_CONFIG) as [TypeRecette, typeof TYPE_CONFIG[TypeRecette]][]).map(([k, v]) => {
            const montant = filtered.filter(r => r.type === k).reduce((s, r) => s + r.montant, 0)
            if (!montant) return null
            return (
              <div key={k} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:v.bg, borderRadius:20 }}>
                <span style={{ fontSize:12, fontWeight:700, color:v.color }}>{v.label}</span>
                <span style={{ fontSize:12, fontWeight:900, color:v.color }}>{euro(montant)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Liste groupée par mois ───────────────────────── */}
      {grouped.length === 0 ? (
        <div style={{ background:C.wh, borderRadius:14, padding:"56px 20px", textAlign:"center", border:`1px solid ${C.br}` }}>
          <div style={{ fontSize:40, marginBottom:12 }}>💰</div>
          <div style={{ fontWeight:700, fontSize:15, color:C.tx, marginBottom:6 }}>Aucune recette</div>
          <div style={{ color:C.tm, fontSize:13, marginBottom:20 }}>Modifiez les filtres ou ajoutez une recette.</div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"11px 22px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}
          >
            + Ajouter une recette
          </button>
        </div>
      ) : (
        grouped.map(group => (
          <div key={group.key} style={{ marginBottom:20 }}>
            {/* En-tête de mois */}
            <div
              style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"8px 0", borderBottom:`2px solid ${C.g}`, marginBottom:2,
              }}
            >
              <span style={{ fontWeight:800, fontSize:15, color:C.g }}>{group.label}</span>
              <span style={{ fontWeight:800, fontSize:15, color:C.g }}>+{euro(group.total)}</span>
            </div>

            {/* Lignes du mois */}
            <div style={{ background:C.wh, borderRadius:12, padding:"0 16px", border:`1px solid ${C.br}` }}>
              {group.items.map(r => <RecetteLigne key={r.id} r={r} />)}
            </div>
          </div>
        ))
      )}

      {/* ── Modal ────────────────────────────────────────── */}
      {showAdd && (
        <AddRecetteModal
          onClose={() => setShowAdd(false)}
          onSave={r => {
            setRecettes(prev => [r, ...prev])
            // Ajuster les filtres pour voir la nouvelle recette
            const annee = parseInt(r.date.split("-")[0])
            if (annee !== filterAnnee) setFilterAnnee(annee)
            setFilterMois(0)
            if (filterBien && filterBien !== r.bien_id) setFilterBien("")
          }}
        />
      )}
    </>
  )
}
