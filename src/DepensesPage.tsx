import { useState, useMemo } from "react"

// ── Palette ────────────────────────────────────────────────
const C = {
  g:   "#2d5b3d", gl:  "#3d7a52", gp:  "#e6efe9",
  cr:  "#f7f4ee", cr2: "#eeebe3",
  tx:  "#1a2a1f", tm:  "#6b8c74",
  rd:  "#c0392b", rp:  "#fdecea",
  bl:  "#2471a3", bp:  "#eaf4fb",
  gd:  "#b7860b", dp:  "#fef9e7",
  or:  "#ca6f1e", op:  "#fdf2e9",
  pu:  "#7d3c98", pp:  "#f4ecf7",
  wh:  "#ffffff", br:  "#dde8e0",
}

const euro = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
const formatDate = (d: string) => { const [y, m, j] = d.split("-"); return `${j}/${m}/${y}` }
const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]

// ── Catégories détaillées ──────────────────────────────────

type CategorieDep =
  | "gestion" | "copropriete"
  | "assurance_habitation" | "assurance_loyers" | "assurance_pno" | "assurance_emprunteur"
  | "entretien" | "location_frais" | "plateforme" | "comptabilite"
  | "abonnement_elec" | "abonnement_internet" | "abonnement_eau" | "abonnement_gaz"
  | "taxe_fonciere" | "taxe_habitation" | "taxe_sejour" | "cfe" | "charges_sociales"
  | "divers" | "petits_travaux" | "petit_mobilier"
  | "interets_emprunt" | "amortissement"
  | "autre"

interface CatInfo { label: string; emoji: string; bg: string; color: string; ded: boolean }

const CAT_CONFIG: Record<CategorieDep, CatInfo> = {
  gestion:              { label:"Frais de gestion",          emoji:"📋", bg:C.gp,  color:C.g,  ded:true  },
  copropriete:          { label:"Charges de copropriété",    emoji:"🏢", bg:C.bp,  color:C.bl, ded:true  },
  assurance_habitation: { label:"Assurance habitation",      emoji:"🏠", bg:C.pp,  color:C.pu, ded:true  },
  assurance_loyers:     { label:"Assurance loyers impayés",  emoji:"🛡️", bg:C.pp,  color:C.pu, ded:true  },
  assurance_pno:        { label:"Assurance PNO",             emoji:"🛡️", bg:C.pp,  color:C.pu, ded:true  },
  assurance_emprunteur: { label:"Assurance emprunteur",      emoji:"🔒", bg:C.pp,  color:C.pu, ded:false },
  entretien:            { label:"Ménage & entretien",        emoji:"🧹", bg:C.gp,  color:C.g,  ded:true  },
  location_frais:       { label:"Frais de location",         emoji:"📝", bg:C.gp,  color:C.g,  ded:true  },
  plateforme:           { label:"Frais de plateformes",      emoji:"📱", bg:C.op,  color:C.or, ded:true  },
  comptabilite:         { label:"Frais de comptabilité",     emoji:"📊", bg:C.gp,  color:C.g,  ded:true  },
  abonnement_elec:      { label:"Électricité",               emoji:"⚡", bg:C.dp,  color:C.gd, ded:true  },
  abonnement_internet:  { label:"Internet / Téléphone",      emoji:"📡", bg:C.dp,  color:C.gd, ded:true  },
  abonnement_eau:       { label:"Eau",                       emoji:"💧", bg:C.bp,  color:C.bl, ded:true  },
  abonnement_gaz:       { label:"Gaz",                       emoji:"🔥", bg:C.op,  color:C.or, ded:true  },
  taxe_fonciere:        { label:"Taxe foncière",             emoji:"🏛️", bg:C.dp,  color:C.gd, ded:true  },
  taxe_habitation:      { label:"Taxe d'habitation",         emoji:"🏛️", bg:C.dp,  color:C.gd, ded:false },
  taxe_sejour:          { label:"Taxe de séjour",            emoji:"🏖️", bg:C.dp,  color:C.gd, ded:false },
  cfe:                  { label:"CFE",                       emoji:"📜", bg:C.dp,  color:C.gd, ded:true  },
  charges_sociales:     { label:"Charges sociales SSI",      emoji:"👥", bg:C.cr2, color:C.tm, ded:true  },
  divers:               { label:"Dépenses diverses",         emoji:"📌", bg:C.cr2, color:C.tm, ded:true  },
  petits_travaux:       { label:"Petits travaux < 600 €",    emoji:"🔧", bg:C.op,  color:C.or, ded:true  },
  petit_mobilier:       { label:"Petit mobilier < 600 €",    emoji:"🪑", bg:C.op,  color:C.or, ded:true  },
  interets_emprunt:     { label:"Intérêts d'emprunt",        emoji:"🏦", bg:C.cr2, color:C.tm, ded:true  },
  amortissement:        { label:"Amortissement",             emoji:"📉", bg:C.cr2, color:C.tm, ded:true  },
  autre:                { label:"Autre",                     emoji:"📄", bg:C.cr2, color:C.tm, ded:true  },
}

interface CatGroup { id: string; label: string; emoji: string; color: string; bg: string; cats: CategorieDep[] }

const CAT_GROUPS: CatGroup[] = [
  { id:"gestion",    label:"Frais de gestion & admin.",  emoji:"📋", color:C.g,  bg:C.gp,  cats:["gestion","copropriete","entretien","location_frais","plateforme","comptabilite"] },
  { id:"assurance",  label:"Assurances",                 emoji:"🛡️", color:C.pu, bg:C.pp,  cats:["assurance_habitation","assurance_loyers","assurance_pno","assurance_emprunteur"] },
  { id:"abonnement", label:"Abonnements",                emoji:"⚡", color:C.gd, bg:C.dp,  cats:["abonnement_elec","abonnement_internet","abonnement_eau","abonnement_gaz"] },
  { id:"taxes",      label:"Taxes & prélèvements",       emoji:"🏛️", color:C.gd, bg:C.dp,  cats:["taxe_fonciere","taxe_habitation","taxe_sejour","cfe","charges_sociales"] },
  { id:"travaux",    label:"Travaux & mobilier",         emoji:"🔧", color:C.or, bg:C.op,  cats:["petits_travaux","petit_mobilier"] },
  { id:"emprunt",    label:"Emprunt & financement",      emoji:"🏦", color:C.tm, bg:C.cr2, cats:["interets_emprunt","amortissement"] },
  { id:"autre",      label:"Autres dépenses",            emoji:"📌", color:C.tm, bg:C.cr2, cats:["divers","autre"] },
]

const DEFAULT_CAT: CategorieDep = "gestion"

// ── Biens de référence ─────────────────────────────────────
const BIENS_REF = [
  { id:"b1", nom:"Appartement Gambetta" },
  { id:"b2", nom:"Studio Confluence"    },
  { id:"b3", nom:"Garage Bellecour"     },
  { id:"b4", nom:"T2 Croix-Rousse"     },
]

// ── Données de démonstration ───────────────────────────────
interface Depense {
  id: string; bien_id: string; bien_nom: string
  categorie: CategorieDep; montant: number; date: string
  description?: string; deductible: boolean
}

const MOCK_DEPENSES: Depense[] = [
  // Appartement Gambetta
  { id:"d01",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"interets_emprunt",  montant:420,  date:"2026-01-01", description:"Intérêts crédit — jan.",          deductible:true  },
  { id:"d01b", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"amortissement",      montant:300,  date:"2026-01-01", description:"Capital remboursé — jan.",         deductible:false },
  { id:"d02",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"copropriete",        montant:180,  date:"2026-01-10", description:"Charges copropriété T1 2026",      deductible:true  },
  { id:"d03",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"gestion",            montant:85,   date:"2026-01-05", description:"Honoraires agence — jan.",         deductible:true  },
  { id:"d07",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"interets_emprunt",  montant:420,  date:"2026-02-01", description:"Intérêts crédit — fév.",          deductible:true  },
  { id:"d07b", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"amortissement",      montant:300,  date:"2026-02-01", description:"Capital remboursé — fév.",         deductible:false },
  { id:"d08",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"gestion",            montant:85,   date:"2026-02-05", description:"Honoraires agence — fév.",        deductible:true  },
  { id:"d13",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"interets_emprunt",  montant:420,  date:"2026-03-01", description:"Intérêts crédit — mar.",          deductible:true  },
  { id:"d13b", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"amortissement",      montant:300,  date:"2026-03-01", description:"Capital remboursé — mar.",         deductible:false },
  { id:"d14",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"gestion",            montant:85,   date:"2026-03-05", description:"Honoraires agence — mar.",        deductible:true  },
  { id:"d15",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"assurance_pno",      montant:42,   date:"2026-03-15", description:"Assurance PNO — mar.",            deductible:true  },
  { id:"d21",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"interets_emprunt",  montant:420,  date:"2026-04-01", description:"Intérêts crédit — avr.",          deductible:true  },
  { id:"d21b", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"amortissement",      montant:300,  date:"2026-04-01", description:"Capital remboursé — avr.",         deductible:false },
  { id:"d22",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"gestion",            montant:85,   date:"2026-04-05", description:"Honoraires agence — avr.",        deductible:true  },
  { id:"d23",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"copropriete",        montant:180,  date:"2026-04-10", description:"Charges copropriété T2 2026",      deductible:true  },
  { id:"d24",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"taxe_fonciere",      montant:1240, date:"2026-04-15", description:"Taxe foncière 2026 (acompte)",     deductible:true  },
  { id:"d30",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"interets_emprunt",  montant:420,  date:"2026-05-01", description:"Intérêts crédit — mai",           deductible:true  },
  { id:"d30b", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"amortissement",      montant:300,  date:"2026-05-01", description:"Capital remboursé — mai",          deductible:false },
  { id:"d31",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"gestion",            montant:85,   date:"2026-05-05", description:"Honoraires agence — mai",         deductible:true  },
  { id:"d32",  bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"assurance_pno",      montant:42,   date:"2026-05-15", description:"Assurance PNO — mai",             deductible:true  },

  // Studio Confluence
  { id:"d04",  bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"interets_emprunt",  montant:310,  date:"2026-01-01", description:"Intérêts crédit — jan.",          deductible:true  },
  { id:"d04b", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"amortissement",      montant:230,  date:"2026-01-01", description:"Capital remboursé — jan.",         deductible:false },
  { id:"d05",  bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"copropriete",        montant:95,   date:"2026-01-10", description:"Charges copropriété T1 2026",      deductible:true  },
  { id:"d09",  bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"interets_emprunt",  montant:310,  date:"2026-02-01", description:"Intérêts crédit — fév.",          deductible:true  },
  { id:"d09b", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"amortissement",      montant:230,  date:"2026-02-01", description:"Capital remboursé — fév.",         deductible:false },
  { id:"d16",  bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"interets_emprunt",  montant:310,  date:"2026-03-01", description:"Intérêts crédit — mar.",          deductible:true  },
  { id:"d16b", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"amortissement",      montant:230,  date:"2026-03-01", description:"Capital remboursé — mar.",         deductible:false },
  { id:"d17",  bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"copropriete",        montant:95,   date:"2026-03-10", description:"Charges copropriété T2 2026",      deductible:true  },
  { id:"d25",  bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"interets_emprunt",  montant:310,  date:"2026-04-01", description:"Intérêts crédit — avr.",          deductible:true  },
  { id:"d25b", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"amortissement",      montant:230,  date:"2026-04-01", description:"Capital remboursé — avr.",         deductible:false },
  { id:"d26",  bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"taxe_fonciere",      montant:680,  date:"2026-04-15", description:"Taxe foncière 2026 (acompte)",     deductible:true  },
  { id:"d33",  bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"interets_emprunt",  montant:310,  date:"2026-05-01", description:"Intérêts crédit — mai",           deductible:true  },
  { id:"d33b", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"amortissement",      montant:230,  date:"2026-05-01", description:"Capital remboursé — mai",          deductible:false },
  { id:"d34",  bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"copropriete",        montant:95,   date:"2026-05-10", description:"Régularisation charges copro",     deductible:true  },

  // Garage Bellecour
  { id:"d06",  bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance_pno",      montant:12,   date:"2026-01-15", description:"Assurance garage — jan.",         deductible:true  },
  { id:"d10",  bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance_pno",      montant:12,   date:"2026-02-15", description:"Assurance garage — fév.",        deductible:true  },
  { id:"d18",  bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance_pno",      montant:12,   date:"2026-03-15", description:"Assurance garage — mar.",         deductible:true  },
  { id:"d27",  bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance_pno",      montant:12,   date:"2026-04-15", description:"Assurance garage — avr.",         deductible:true  },
  { id:"d28",  bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"taxe_fonciere",      montant:210,  date:"2026-04-15", description:"Taxe foncière 2026 (acompte)",     deductible:true  },
  { id:"d35",  bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance_pno",      montant:12,   date:"2026-05-15", description:"Assurance garage — mai",          deductible:true  },

  // T2 Croix-Rousse
  { id:"d11",  bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"petits_travaux",     montant:1200, date:"2026-02-20", description:"Remplacement chauffe-eau",         deductible:true  },
  { id:"d12",  bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"assurance_pno",      montant:38,   date:"2026-02-15", description:"Assurance PNO — fév.",            deductible:true  },
  { id:"d19",  bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"petits_travaux",     montant:450,  date:"2026-03-08", description:"Peinture salon et chambre",        deductible:true  },
  { id:"d20",  bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"assurance_pno",      montant:38,   date:"2026-03-15", description:"Assurance PNO — mar.",            deductible:true  },
  { id:"d29",  bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"assurance_pno",      montant:38,   date:"2026-04-15", description:"Assurance PNO — avr.",            deductible:true  },
  { id:"d36",  bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"autre",              montant:95,   date:"2026-05-20", description:"Frais diagnostics DPE",            deductible:true  },
  { id:"d37",  bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"assurance_pno",      montant:38,   date:"2026-05-15", description:"Assurance PNO — mai",             deductible:true  },
  { id:"d38",  bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"comptabilite",       montant:120,  date:"2026-01-20", description:"Honoraires comptable T1",          deductible:true  },
  { id:"d39",  bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"abonnement_elec",    montant:45,   date:"2026-02-10", description:"Facture EDF — fév.",              deductible:true  },
  { id:"d40",  bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"abonnement_elec",    montant:45,   date:"2026-03-10", description:"Facture EDF — mar.",              deductible:true  },
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

function DepenseLigne({ d, onEdit, onDelete }: { d: Depense; onEdit: () => void; onDelete: () => void }) {
  const cfg = CAT_CONFIG[d.categorie]
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"10px 0", borderBottom:`1px solid ${C.br}`, gap:12 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", marginBottom:3 }}>
          <span style={{ fontSize:13 }}>{cfg.emoji}</span>
          <span style={{ fontSize:13, fontWeight:600, color:C.tx }}>{d.description || cfg.label}</span>
          {!d.deductible && <Badge label="Non déductible" bg={C.rp} color={C.rd} />}
        </div>
        <div style={{ fontSize:11, color:C.tm }}>📅 {formatDate(d.date)} · {d.bien_nom}</div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontWeight:800, fontSize:15, color:d.deductible ? C.rd : C.tm, whiteSpace:"nowrap", marginBottom:6 }}>
          −{euro(d.montant)}
        </div>
        <div style={{ display:"flex", gap:4, justifyContent:"flex-end" }}>
          <button
            onClick={onEdit}
            style={{ background:"none", border:`1px solid ${C.br}`, borderRadius:7, padding:"3px 8px", fontSize:11, fontWeight:700, color:C.gl, cursor:"pointer", fontFamily:"inherit" }}
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            style={{ background:"none", border:`1px solid ${C.br}`, borderRadius:7, padding:"3px 8px", fontSize:11, fontWeight:700, color:C.rd, cursor:"pointer", fontFamily:"inherit" }}
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal dépense ──────────────────────────────────────────

interface FormState {
  bien_id:     string
  categorie:   CategorieDep
  montant:     string
  date:        string
  description: string
  deductible:  boolean
}

const today = new Date().toISOString().slice(0, 10)

function DepenseModal({ onClose, onSave, initialValues }: {
  onClose: () => void
  onSave: (d: Depense) => void
  initialValues?: Depense
}) {
  const isEdit = !!initialValues
  const [form, setForm] = useState<FormState>({
    bien_id:     initialValues?.bien_id            ?? BIENS_REF[0].id,
    categorie:   initialValues?.categorie          ?? DEFAULT_CAT,
    montant:     initialValues?.montant.toString() ?? "",
    date:        initialValues?.date               ?? today,
    description: initialValues?.description        ?? "",
    deductible:  initialValues?.deductible         ?? true,
  })

  const setField = (key: keyof FormState) => (v: string | boolean) =>
    setForm(f => ({ ...f, [key]: v }))

  const handleCatChange = (cat: CategorieDep) => {
    setForm(f => ({ ...f, categorie: cat, deductible: CAT_CONFIG[cat].ded }))
  }

  const bienNom = BIENS_REF.find(b => b.id === form.bien_id)?.nom ?? ""
  const canSave = !!form.montant && parseFloat(form.montant) > 0 && !!form.date

  const handleSave = () => {
    if (!canSave) return
    onSave({
      id:          isEdit ? initialValues!.id : Date.now().toString(),
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

  const cfg = CAT_CONFIG[form.categorie]

  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:900, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:C.wh, borderRadius:"18px 18px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:540, maxHeight:"92vh", overflowY:"auto" }}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontWeight:800, fontSize:17, color:C.rd }}>
            {isEdit ? "Modifier la dépense" : "Nouvelle dépense"}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.tm }}>✕</button>
        </div>

        {/* Catégorie — select avec groupes */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>
            Catégorie
          </label>
          {/* Aperçu catégorie sélectionnée */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:9, background:cfg.bg, marginBottom:8 }}>
            <span style={{ fontSize:18 }}>{cfg.emoji}</span>
            <span style={{ fontSize:13, fontWeight:700, color:cfg.color }}>{cfg.label}</span>
          </div>
          <select
            value={form.categorie}
            onChange={e => handleCatChange(e.target.value as CategorieDep)}
            style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.br}`, borderRadius:8, fontSize:13, fontFamily:"inherit", color:C.tx, background:C.cr, outline:"none", boxSizing:"border-box" }}
          >
            {CAT_GROUPS.map(g => (
              <optgroup key={g.id} label={`${g.emoji} ${g.label}`}>
                {g.cats.map(cat => (
                  <option key={cat} value={cat}>{CAT_CONFIG[cat].emoji} {CAT_CONFIG[cat].label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Bien */}
        <div style={{ marginBottom:12 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>
            Bien concerné
          </label>
          <select
            value={form.bien_id}
            onChange={e => setField("bien_id")(e.target.value)}
            style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.br}`, borderRadius:8, fontSize:14, fontFamily:"inherit", color:C.tx, background:C.cr, outline:"none", boxSizing:"border-box" }}
          >
            {BIENS_REF.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </select>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <FieldInput
            label="Montant (€) *"
            type="number" min="0" step="0.01" placeholder="0.00"
            value={form.montant}
            onChange={e => setField("montant")(e.target.value)}
          />
          <FieldInput
            label="Date *"
            type="date"
            value={form.date}
            onChange={e => setField("date")(e.target.value)}
          />
        </div>

        <FieldInput
          label="Description"
          placeholder="Ex. Charges copro T2 2026"
          value={form.description}
          onChange={e => setField("description")(e.target.value)}
        />

        {/* Déductible */}
        <div
          onClick={() => setField("deductible")(!form.deductible)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10, background: form.deductible ? C.gp : C.rp, cursor:"pointer", marginBottom:16 }}
        >
          <div style={{ width:20, height:20, borderRadius:6, background: form.deductible ? C.g : C.rd, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {form.deductible && <span style={{ color:"#fff", fontSize:13, fontWeight:900 }}>✓</span>}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color: form.deductible ? C.g : C.rd }}>
              {form.deductible ? "Déductible fiscalement" : "Non déductible"}
            </div>
            <div style={{ fontSize:11, color:C.tm }}>
              {form.deductible ? "Comptabilisée dans le bilan fiscal" : "Ex. remboursement capital emprunt"}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{ width:"100%", padding:"13px 0", borderRadius:10, background: canSave ? C.rd : C.cr2, color: canSave ? "#fff" : C.tm, border:"none", fontWeight:800, fontSize:15, cursor: canSave ? "pointer" : "not-allowed", fontFamily:"inherit" }}
        >
          {isEdit ? "Enregistrer les modifications" : "Enregistrer la dépense"}
        </button>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>(MOCK_DEPENSES)
  const [filterBien,   setFilterBien]   = useState("")
  const [filterAnnee,  setFilterAnnee]  = useState(2026)
  const [filterMois,   setFilterMois]   = useState(0)
  const [filterGroupe, setFilterGroupe] = useState("")
  const [showAdd,  setShowAdd]  = useState(false)
  const [editItem, setEditItem] = useState<Depense | null>(null)

  const filtered = useMemo(() => {
    return depenses.filter(d => {
      const [y, m] = d.date.split("-")
      if (parseInt(y) !== filterAnnee)              return false
      if (filterMois && parseInt(m) !== filterMois) return false
      if (filterBien && d.bien_id !== filterBien)   return false
      if (filterGroupe) {
        const g = CAT_GROUPS.find(g => g.id === filterGroupe)
        if (g && !(g.cats as string[]).includes(d.categorie)) return false
      }
      return true
    })
  }, [depenses, filterBien, filterAnnee, filterMois, filterGroupe])

  const totalPeriode    = filtered.reduce((s, d) => s + d.montant, 0)
  const totalDeductible = filtered.filter(d => d.deductible).reduce((s, d) => s + d.montant, 0)
  const nbMoisActifs    = useMemo(() => new Set(filtered.map(d => d.date.slice(0, 7))).size, [filtered])
  const moyMensuelle    = nbMoisActifs > 0 ? totalPeriode / nbMoisActifs : 0

  // Groupement par groupe de catégorie → sous-groupe par catégorie
  const groupedByCat = useMemo(() => {
    return CAT_GROUPS
      .filter(g => !filterGroupe || g.id === filterGroupe)
      .map(g => {
        const items = filtered
          .filter(d => (g.cats as string[]).includes(d.categorie))
          .sort((a, b) => b.date.localeCompare(a.date))
        const total    = items.reduce((s, d) => s + d.montant, 0)
        const totalDed = items.filter(d => d.deductible).reduce((s, d) => s + d.montant, 0)
        const byCat: Partial<Record<CategorieDep, Depense[]>> = {}
        for (const d of items) {
          if (!byCat[d.categorie]) byCat[d.categorie] = []
          byCat[d.categorie]!.push(d)
        }
        return { g, items, total, totalDed, byCat }
      })
  }, [filtered, filterGroupe])

  function handleDelete(id: string) {
    if (window.confirm("Supprimer cette dépense ?"))
      setDepenses(prev => prev.filter(d => d.id !== id))
  }

  function handleSaveAdd(d: Depense) {
    setDepenses(prev => [d, ...prev])
    const annee = parseInt(d.date.split("-")[0])
    if (annee !== filterAnnee) setFilterAnnee(annee)
    setFilterMois(0)
    if (filterBien && filterBien !== d.bien_id) setFilterBien("")
  }

  function handleSaveEdit(updated: Depense) {
    setDepenses(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  return (
    <>
      {/* ── En-tête ──────────────────────────────────────── */}
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

      {/* ── Filtres ───────────────────────────────────────── */}
      <div style={{ background:C.wh, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.br}`, marginBottom:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <FieldSelect label="Bien" value={filterBien} onChange={setFilterBien}>
          <option value="">Tous les biens</option>
          {BIENS_REF.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </FieldSelect>
        <FieldSelect label="Groupe de dépenses" value={filterGroupe} onChange={setFilterGroupe}>
          <option value="">Tous les groupes</option>
          {CAT_GROUPS.map(g => <option key={g.id} value={g.id}>{g.emoji} {g.label}</option>)}
        </FieldSelect>
        <FieldSelect label="Année" value={filterAnnee.toString()} onChange={v => setFilterAnnee(parseInt(v))}>
          {ANNEES_DISPO.map(a => <option key={a} value={a}>{a}</option>)}
        </FieldSelect>
        <FieldSelect label="Mois" value={filterMois.toString()} onChange={v => setFilterMois(parseInt(v))}>
          <option value="0">Tous les mois</option>
          {MOIS_FR.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </FieldSelect>
      </div>

      {/* ── Stats globales ────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label: filterMois ? "Total du mois" : "Total période", value: euro(totalPeriode),    color: C.rd },
          { label: "Dont déductibles",  value: euro(totalDeductible),       color: C.g  },
          { label: "Nb dépenses",       value: filtered.length.toString(),  color: C.tx },
          { label: "Moy. mensuelle",    value: euro(moyMensuelle),          color: C.gd },
        ].map(s => (
          <div key={s.label} style={{ background:C.wh, borderRadius:12, padding:"14px 12px", border:`1px solid ${C.br}`, textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:900, color:s.color, lineHeight:1.2 }}>{s.value}</div>
            <div style={{ fontSize:10, color:C.tm, marginTop:3, textTransform:"uppercase", letterSpacing:".05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Synthèse par groupe (toujours affichée) ──────── */}
      <div style={{ background:C.wh, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.br}`, marginBottom:18 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:12 }}>
          Synthèse par catégorie
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {CAT_GROUPS.map((g, i) => {
            const montant = filtered
              .filter(d => (g.cats as string[]).includes(d.categorie))
              .reduce((s, d) => s + d.montant, 0)
            const pct = totalPeriode > 0 ? Math.round(montant / totalPeriode * 100) : 0
            const isLast = i === CAT_GROUPS.length - 1
            return (
              <div
                key={g.id}
                onClick={() => setFilterGroupe(filterGroupe === g.id ? "" : g.id)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 6px", borderBottom: isLast ? "none" : `1px solid ${C.br}`, cursor:"pointer", borderRadius: filterGroupe === g.id ? 8 : 0, background: filterGroupe === g.id ? g.bg : "transparent" }}
              >
                <span style={{ fontSize:15, width:24, textAlign:"center", flexShrink:0 }}>{g.emoji}</span>
                <span style={{ flex:1, fontSize:13, color:C.tx, fontWeight:filterGroupe === g.id ? 700 : 400 }}>{g.label}</span>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                  {pct > 0 && (
                    <span style={{ fontSize:10, color:g.color, background:g.bg, padding:"1px 7px", borderRadius:8, fontWeight:700 }}>{pct}%</span>
                  )}
                  <span style={{ fontSize:13, fontWeight:800, color: montant > 0 ? C.rd : C.tm, minWidth:80, textAlign:"right" }}>
                    {montant > 0 ? `−${euro(montant)}` : "—"}
                  </span>
                </div>
              </div>
            )
          })}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 6px", borderTop:`2px solid ${C.br}`, marginTop:4 }}>
            <span style={{ fontSize:13, fontWeight:800, color:C.tx }}>Total</span>
            <span style={{ fontSize:14, fontWeight:900, color:C.rd }}>−{euro(totalPeriode)}</span>
          </div>
        </div>
      </div>

      {/* ── Liste groupée par catégorie ───────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ background:C.wh, borderRadius:14, padding:"56px 20px", textAlign:"center", border:`1px solid ${C.br}` }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📉</div>
          <div style={{ fontWeight:700, fontSize:15, color:C.tx, marginBottom:6 }}>Aucune dépense</div>
          <div style={{ color:C.tm, fontSize:13, marginBottom:20 }}>Modifiez les filtres ou ajoutez une dépense.</div>
          <button onClick={() => setShowAdd(true)} style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"11px 22px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
            + Ajouter une dépense
          </button>
        </div>
      ) : (
        groupedByCat
          .filter(({ items }) => items.length > 0)
          .map(({ g, items, total, totalDed, byCat }) => (
            <div key={g.id} style={{ marginBottom:20 }}>
              {/* En-tête de groupe */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:`linear-gradient(90deg,${g.bg},${g.bg}88)`, borderRadius:"10px 10px 0 0", borderLeft:`4px solid ${g.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>{g.emoji}</span>
                  <span style={{ fontWeight:800, fontSize:14, color:g.color }}>{g.label}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:g.color, background:`${g.color}22`, padding:"1px 7px", borderRadius:8 }}>
                    {items.length}
                  </span>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:900, fontSize:15, color:C.rd }}>−{euro(total)}</div>
                  {totalDed < total && (
                    <div style={{ fontSize:10, color:C.tm }}>dont {euro(totalDed)} déductible</div>
                  )}
                </div>
              </div>

              {/* Sous-groupes par catégorie spécifique */}
              <div style={{ background:C.wh, border:`1px solid ${C.br}`, borderTop:"none", borderRadius:"0 0 10px 10px", overflow:"hidden" }}>
                {g.cats
                  .filter(cat => (byCat[cat]?.length ?? 0) > 0)
                  .map((cat, ci, arr) => {
                    const cfg = CAT_CONFIG[cat]
                    const catItems = byCat[cat]!
                    const catTotal = catItems.reduce((s, d) => s + d.montant, 0)
                    const isLastCat = ci === arr.length - 1
                    return (
                      <div key={cat} style={{ borderBottom: isLastCat ? "none" : `1px solid ${C.br}` }}>
                        {/* Sous-en-tête catégorie */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 16px", background:C.cr }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:13 }}>{cfg.emoji}</span>
                            <span style={{ fontSize:12, fontWeight:700, color:cfg.color, textTransform:"uppercase", letterSpacing:".05em" }}>{cfg.label}</span>
                          </div>
                          <span style={{ fontSize:12, fontWeight:800, color:C.rd }}>−{euro(catTotal)}</span>
                        </div>
                        {/* Items */}
                        <div style={{ padding:"0 16px" }}>
                          {catItems.map(d => (
                            <DepenseLigne key={d.id} d={d} onEdit={() => setEditItem(d)} onDelete={() => handleDelete(d.id)} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))
      )}

      {/* ── Modals ────────────────────────────────────────── */}
      {showAdd && (
        <DepenseModal
          onClose={() => setShowAdd(false)}
          onSave={d => { handleSaveAdd(d); setShowAdd(false) }}
        />
      )}
      {editItem && (
        <DepenseModal
          initialValues={editItem}
          onClose={() => setEditItem(null)}
          onSave={updated => { handleSaveEdit(updated); setEditItem(null) }}
        />
      )}
    </>
  )
}
