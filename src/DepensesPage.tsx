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
  or:  "#ca6f1e",
  op:  "#fdf2e9",
  pu:  "#7d3c98",
  pp:  "#f4ecf7",
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
type CategorieDep =
  | "copropriete"
  | "travaux"
  | "assurance"
  | "taxe_fonciere"
  | "credit"
  | "gestion"
  | "autre"

interface Depense {
  id: string
  bien_id: string
  bien_nom: string
  categorie: CategorieDep
  montant: number
  date: string        // YYYY-MM-DD
  description?: string
  deductible: boolean
}

const CAT_CONFIG: Record<CategorieDep, { label: string; emoji: string; bg: string; color: string }> = {
  copropriete:   { label: "Charges copro",    emoji: "🏢", bg: C.bp, color: C.bl },
  travaux:       { label: "Travaux",           emoji: "🔧", bg: C.op, color: C.or },
  assurance:     { label: "Assurance",         emoji: "🛡️", bg: C.pp, color: C.pu },
  taxe_fonciere: { label: "Taxe foncière",     emoji: "🏛️", bg: C.dp, color: C.gd },
  credit:        { label: "Crédit immobilier", emoji: "🏦", bg: C.cr2, color: C.tm },
  gestion:       { label: "Frais de gestion",  emoji: "📋", bg: C.gp, color: C.g  },
  autre:         { label: "Autres",            emoji: "📌", bg: C.cr2, color: C.tm },
}

// ── Biens de référence ─────────────────────────────────────
const BIENS_REF = [
  { id: "b1", nom: "Appartement Gambetta" },
  { id: "b2", nom: "Studio Confluence"    },
  { id: "b3", nom: "Garage Bellecour"     },
  { id: "b4", nom: "T2 Croix-Rousse"     },
]

// ── Données fictives ───────────────────────────────────────
const MOCK_DEPENSES: Depense[] = [
  // ── Janvier 2026
  { id:"d01", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"credit",        montant:720,   date:"2026-01-01", description:"Mensualité crédit janvier",       deductible:false },
  { id:"d02", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"copropriete",   montant:180,   date:"2026-01-10", description:"Charges copropriété T1 2026",     deductible:true  },
  { id:"d03", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"gestion",       montant:85,    date:"2026-01-05", description:"Honoraires agence janvier",        deductible:true  },
  { id:"d04", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"credit",        montant:540,   date:"2026-01-01", description:"Mensualité crédit janvier",       deductible:false },
  { id:"d05", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"copropriete",   montant:95,    date:"2026-01-10", description:"Charges copropriété T1 2026",     deductible:true  },
  { id:"d06", bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance",     montant:12,    date:"2026-01-15", description:"Assurance garage janvier",        deductible:true  },

  // ── Février 2026
  { id:"d07", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"credit",        montant:720,   date:"2026-02-01", description:"Mensualité crédit février",      deductible:false },
  { id:"d08", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"gestion",       montant:85,    date:"2026-02-05", description:"Honoraires agence février",       deductible:true  },
  { id:"d09", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"credit",        montant:540,   date:"2026-02-01", description:"Mensualité crédit février",      deductible:false },
  { id:"d10", bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance",     montant:12,    date:"2026-02-15", description:"Assurance garage février",       deductible:true  },
  { id:"d11", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"travaux",       montant:1200,  date:"2026-02-20", description:"Remplacement chauffe-eau",        deductible:true  },
  { id:"d12", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"assurance",     montant:38,    date:"2026-02-15", description:"Assurance PNO février",           deductible:true  },

  // ── Mars 2026
  { id:"d13", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"credit",        montant:720,   date:"2026-03-01", description:"Mensualité crédit mars",         deductible:false },
  { id:"d14", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"gestion",       montant:85,    date:"2026-03-05", description:"Honoraires agence mars",          deductible:true  },
  { id:"d15", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"assurance",     montant:42,    date:"2026-03-15", description:"Assurance PNO mars",              deductible:true  },
  { id:"d16", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"credit",        montant:540,   date:"2026-03-01", description:"Mensualité crédit mars",         deductible:false },
  { id:"d17", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"copropriete",   montant:95,    date:"2026-03-10", description:"Charges copropriété T2 2026",     deductible:true  },
  { id:"d18", bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance",     montant:12,    date:"2026-03-15", description:"Assurance garage mars",           deductible:true  },
  { id:"d19", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"travaux",       montant:450,   date:"2026-03-08", description:"Peinture salon et chambre",       deductible:true  },
  { id:"d20", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"assurance",     montant:38,    date:"2026-03-15", description:"Assurance PNO mars",              deductible:true  },

  // ── Avril 2026
  { id:"d21", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"credit",        montant:720,   date:"2026-04-01", description:"Mensualité crédit avril",        deductible:false },
  { id:"d22", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"gestion",       montant:85,    date:"2026-04-05", description:"Honoraires agence avril",         deductible:true  },
  { id:"d23", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"copropriete",   montant:180,   date:"2026-04-10", description:"Charges copropriété T2 2026",     deductible:true  },
  { id:"d24", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"taxe_fonciere", montant:1240,  date:"2026-04-15", description:"Taxe foncière 2026 (acompte)",    deductible:true  },
  { id:"d25", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"credit",        montant:540,   date:"2026-04-01", description:"Mensualité crédit avril",        deductible:false },
  { id:"d26", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"taxe_fonciere", montant:680,   date:"2026-04-15", description:"Taxe foncière 2026 (acompte)",    deductible:true  },
  { id:"d27", bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance",     montant:12,    date:"2026-04-15", description:"Assurance garage avril",          deductible:true  },
  { id:"d28", bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"taxe_fonciere", montant:210,   date:"2026-04-15", description:"Taxe foncière 2026 (acompte)",    deductible:true  },
  { id:"d29", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"assurance",     montant:38,    date:"2026-04-15", description:"Assurance PNO avril",             deductible:true  },

  // ── Mai 2026
  { id:"d30", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"credit",        montant:720,   date:"2026-05-01", description:"Mensualité crédit mai",          deductible:false },
  { id:"d31", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"gestion",       montant:85,    date:"2026-05-05", description:"Honoraires agence mai",           deductible:true  },
  { id:"d32", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"assurance",     montant:42,    date:"2026-05-15", description:"Assurance PNO mai",               deductible:true  },
  { id:"d33", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"credit",        montant:540,   date:"2026-05-01", description:"Mensualité crédit mai",          deductible:false },
  { id:"d34", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"copropriete",   montant:95,    date:"2026-05-10", description:"Régularisation charges copro",    deductible:true  },
  { id:"d35", bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance",     montant:12,    date:"2026-05-15", description:"Assurance garage mai",            deductible:true  },
  { id:"d36", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"autre",         montant:95,    date:"2026-05-20", description:"Frais de diagnostics DPE",        deductible:true  },
  { id:"d37", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"assurance",     montant:38,    date:"2026-05-15", description:"Assurance PNO mai",               deductible:true  },
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

// ── Ligne de dépense ───────────────────────────────────────

function DepenseLigne({ d }: { d: Depense }) {
  const cfg = CAT_CONFIG[d.categorie]
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"11px 0", borderBottom:`1px solid ${C.br}`, gap:12 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", marginBottom:4 }}>
          <Badge label={`${cfg.emoji} ${cfg.label}`} bg={cfg.bg} color={cfg.color} />
          <span style={{ fontSize:12, color:C.tm }}>{d.bien_nom}</span>
          {!d.deductible && (
            <Badge label="Non déductible" bg={C.rp} color={C.rd} />
          )}
        </div>
        {d.description && (
          <div style={{ fontSize:13, color:C.tx, fontWeight:500 }}>{d.description}</div>
        )}
        <div style={{ fontSize:11, color:C.tm, marginTop:2 }}>📅 {formatDate(d.date)}</div>
      </div>
      <div style={{ fontWeight:800, fontSize:15, color:C.rd, flexShrink:0, whiteSpace:"nowrap" }}>
        −{euro(d.montant)}
      </div>
    </div>
  )
}

// ── Modal ajout d'une dépense ──────────────────────────────

interface FormState {
  bien_id:     string
  categorie:   CategorieDep
  montant:     string
  date:        string
  description: string
  deductible:  boolean
}

const today = new Date().toISOString().slice(0, 10)

function AddDepenseModal({ onClose, onSave }: { onClose: () => void; onSave: (d: Depense) => void }) {
  const [form, setForm] = useState<FormState>({
    bien_id:     BIENS_REF[0].id,
    categorie:   "copropriete",
    montant:     "",
    date:        today,
    description: "",
    deductible:  true,
  })

  const set = (key: keyof FormState) => (v: string | boolean) =>
    setForm(f => ({ ...f, [key]: v }))

  const bienNom  = BIENS_REF.find(b => b.id === form.bien_id)?.nom ?? ""
  const canSave  = !!form.montant && !!form.date

  const handleSave = () => {
    if (!canSave) return
    onSave({
      id:          Date.now().toString(),
      bien_id:     form.bien_id,
      bien_nom:    bienNom,
      categorie:   form.categorie,
      montant:     parseFloat(form.montant),
      date:        form.date,
      description: form.description || undefined,
      deductible:  form.deductible,
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
          <div style={{ fontWeight:800, fontSize:17, color:C.rd }}>Nouvelle dépense</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.tm }}>✕</button>
        </div>

        {/* Catégorie */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>
            Catégorie
          </label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {(Object.entries(CAT_CONFIG) as [CategorieDep, typeof CAT_CONFIG[CategorieDep]][]).map(([k, v]) => (
              <button
                key={k}
                onClick={() => set("categorie")(k)}
                style={{
                  padding:"9px 10px", borderRadius:9, textAlign:"left",
                  border:`2px solid ${form.categorie === k ? v.color : C.br}`,
                  background: form.categorie === k ? v.bg : C.wh,
                  cursor:"pointer", fontFamily:"inherit",
                  display:"flex", alignItems:"center", gap:6,
                }}
              >
                <span style={{ fontSize:16 }}>{v.emoji}</span>
                <span style={{ fontSize:12, fontWeight:700, color: form.categorie === k ? v.color : C.tm }}>
                  {v.label}
                </span>
              </button>
            ))}
          </div>
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
          label="Description"
          placeholder="Ex. Charges copro T2 2026"
          value={form.description}
          onChange={e => set("description")(e.target.value)}
        />

        {/* Déductible */}
        <div
          onClick={() => set("deductible")(!form.deductible)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10, background: form.deductible ? C.gp : C.rp, cursor:"pointer", marginBottom:16 }}
        >
          <div style={{ width:20, height:20, borderRadius:6, background: form.deductible ? C.g : C.rd, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {form.deductible && <span style={{ color:"#fff", fontSize:13, fontWeight:900 }}>✓</span>}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color: form.deductible ? C.g : C.rd }}>
              {form.deductible ? "Dépense déductible fiscalement" : "Dépense non déductible"}
            </div>
            <div style={{ fontSize:11, color:C.tm }}>
              {form.deductible ? "Sera comptabilisée dans le bilan fiscal" : "Ex. remboursement capital emprunt"}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            width:"100%", padding:"13px 0", borderRadius:10,
            background: canSave ? C.rd : C.cr2,
            color: canSave ? "#fff" : C.tm,
            border:"none", fontWeight:800, fontSize:15,
            cursor: canSave ? "pointer" : "not-allowed",
            fontFamily:"inherit", transition:"background .15s",
          }}
        >
          Enregistrer la dépense
        </button>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>(MOCK_DEPENSES)
  const [filterBien,  setFilterBien]  = useState("")
  const [filterAnnee, setFilterAnnee] = useState(2026)
  const [filterMois,  setFilterMois]  = useState(0)
  const [showAdd, setShowAdd] = useState(false)

  // ── Filtrage ───────────────────────────────────────────
  const filtered = useMemo(() => {
    return depenses.filter(d => {
      const [y, m] = d.date.split("-")
      if (parseInt(y) !== filterAnnee)              return false
      if (filterMois && parseInt(m) !== filterMois) return false
      if (filterBien && d.bien_id !== filterBien)   return false
      return true
    })
  }, [depenses, filterBien, filterAnnee, filterMois])

  // ── Totaux ─────────────────────────────────────────────
  const totalPeriode    = filtered.reduce((s, d) => s + d.montant, 0)
  const totalDeductible = filtered.filter(d => d.deductible).reduce((s, d) => s + d.montant, 0)
  const nbMoisActifs    = useMemo(() => new Set(filtered.map(d => d.date.slice(0, 7))).size, [filtered])
  const moyMensuelle    = nbMoisActifs > 0 ? totalPeriode / nbMoisActifs : 0

  // ── Groupement par mois ────────────────────────────────
  const grouped = useMemo(() => {
    const groups: Record<string, Depense[]> = {}
    filtered.forEach(d => {
      const key = d.date.slice(0, 7)
      if (!groups[key]) groups[key] = []
      groups[key].push(d)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => {
        const [y, m] = key.split("-")
        return {
          key,
          label: `${MOIS_FR[parseInt(m) - 1]} ${y}`,
          total: items.reduce((s, d) => s + d.montant, 0),
          items: [...items].sort((a, b) => b.date.localeCompare(a.date)),
        }
      })
  }, [filtered])

  return (
    <>
      {/* ── En-tête ─────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.tx, margin:0, lineHeight:1.2 }}>Dépenses</h1>
          <div style={{ fontSize:13, color:C.tm, marginTop:3 }}>
            {filtered.length} dépense{filtered.length !== 1 ? "s" : ""} · {filterAnnee}
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
      <div style={{ background:C.wh, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.br}`, marginBottom:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
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

      {/* ── Stats ────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label: filterMois ? "Total du mois" : "Total annuel", value: euro(totalPeriode),    color: C.rd },
          { label: "Dont déductibles",  value: euro(totalDeductible), color: C.g  },
          { label: "Nb dépenses",       value: filtered.length.toString(), color: C.tx },
          { label: "Moy. mensuelle",    value: euro(moyMensuelle),    color: C.gd },
        ].map(s => (
          <div key={s.label} style={{ background:C.wh, borderRadius:12, padding:"14px 12px", border:`1px solid ${C.br}`, textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:900, color:s.color, lineHeight:1.2 }}>{s.value}</div>
            <div style={{ fontSize:10, color:C.tm, marginTop:3, textTransform:"uppercase", letterSpacing:".05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Répartition par catégorie ─────────────────────── */}
      {filtered.length > 0 && (
        <div style={{ background:C.wh, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.br}`, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>
            Répartition par catégorie
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {(Object.entries(CAT_CONFIG) as [CategorieDep, typeof CAT_CONFIG[CategorieDep]][]).map(([k, v]) => {
              const montant = filtered.filter(d => d.categorie === k).reduce((s, d) => s + d.montant, 0)
              if (!montant) return null
              const pct = Math.round(montant / totalPeriode * 100)
              return (
                <div key={k} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:v.bg, borderRadius:20 }}>
                  <span style={{ fontSize:13 }}>{v.emoji}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:v.color }}>{v.label}</span>
                  <span style={{ fontSize:12, fontWeight:900, color:v.color }}>{euro(montant)}</span>
                  <span style={{ fontSize:10, color:v.color, opacity:.7 }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Liste groupée par mois ───────────────────────── */}
      {grouped.length === 0 ? (
        <div style={{ background:C.wh, borderRadius:14, padding:"56px 20px", textAlign:"center", border:`1px solid ${C.br}` }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📉</div>
          <div style={{ fontWeight:700, fontSize:15, color:C.tx, marginBottom:6 }}>Aucune dépense</div>
          <div style={{ color:C.tm, fontSize:13, marginBottom:20 }}>Modifiez les filtres ou ajoutez une dépense.</div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"11px 22px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}
          >
            + Ajouter une dépense
          </button>
        </div>
      ) : (
        grouped.map(group => (
          <div key={group.key} style={{ marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`2px solid ${C.rd}`, marginBottom:2 }}>
              <span style={{ fontWeight:800, fontSize:15, color:C.rd }}>{group.label}</span>
              <span style={{ fontWeight:800, fontSize:15, color:C.rd }}>−{euro(group.total)}</span>
            </div>
            <div style={{ background:C.wh, borderRadius:12, padding:"0 16px", border:`1px solid ${C.br}` }}>
              {group.items.map(d => <DepenseLigne key={d.id} d={d} />)}
            </div>
          </div>
        ))
      )}

      {/* ── Modal ────────────────────────────────────────── */}
      {showAdd && (
        <AddDepenseModal
          onClose={() => setShowAdd(false)}
          onSave={d => {
            setDepenses(prev => [d, ...prev])
            const annee = parseInt(d.date.split("-")[0])
            if (annee !== filterAnnee) setFilterAnnee(annee)
            setFilterMois(0)
            if (filterBien && filterBien !== d.bien_id) setFilterBien("")
          }}
        />
      )}
    </>
  )
}
