import { useState, useMemo, useRef } from "react"

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

const formatDate = (d: string) => {
  const [y, m, j] = d.split("-")
  return `${j}/${m}/${y}`
}

// ── Types ──────────────────────────────────────────────────
type CategorieDoc = "bail" | "diagnostic" | "facture" | "assurance" | "impot" | "autre"

interface Document {
  id: string
  bien_id: string
  bien_nom: string
  categorie: CategorieDoc
  nom: string
  date: string        // YYYY-MM-DD
  description?: string
  taille?: string
  type_fichier: string
  simule?: boolean    // fichier ajouté manuellement (pas de vrai fichier)
}

const CAT_CONFIG: Record<CategorieDoc, { label: string; emoji: string; bg: string; color: string }> = {
  bail:        { label: "Bail",        emoji: "📜", bg: C.gp,  color: C.g  },
  diagnostic:  { label: "Diagnostic",  emoji: "🔍", bg: C.bp,  color: C.bl },
  facture:     { label: "Facture",     emoji: "🧾", bg: C.op,  color: C.or },
  assurance:   { label: "Assurance",   emoji: "🛡️", bg: C.pp,  color: C.pu },
  impot:       { label: "Impôt",       emoji: "🏛️", bg: C.dp,  color: C.gd },
  autre:       { label: "Autre",       emoji: "📄", bg: C.cr2, color: C.tm },
}

// ── Biens de référence ─────────────────────────────────────
const BIENS_REF = [
  { id: "b1", nom: "Appartement Gambetta" },
  { id: "b2", nom: "Studio Confluence"    },
  { id: "b3", nom: "Garage Bellecour"     },
  { id: "b4", nom: "T2 Croix-Rousse"     },
]

// ── Données fictives ───────────────────────────────────────
const MOCK_DOCUMENTS: Document[] = [
  // Appartement Gambetta
  { id:"dc01", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"bail",       nom:"Bail meublé — Sophie Martin",       date:"2024-09-01", description:"Bail de location meublée 1 an renouvelable",    taille:"245 Ko",  type_fichier:"PDF" },
  { id:"dc02", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"diagnostic", nom:"DPE 2024 — Gambetta",               date:"2024-08-15", description:"Diagnostic performance énergétique · Classe C", taille:"1,2 Mo",  type_fichier:"PDF" },
  { id:"dc03", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"assurance",  nom:"Attestation PNO 2026",              date:"2026-01-01", description:"Assurance propriétaire non occupant 2026",       taille:"312 Ko",  type_fichier:"PDF" },
  { id:"dc04", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"impot",      nom:"Taxe foncière 2025",                date:"2025-09-20", description:"Avis de taxe foncière 2025 — 1 240 €",          taille:"189 Ko",  type_fichier:"PDF" },
  { id:"dc05", bien_id:"b1", bien_nom:"Appartement Gambetta", categorie:"facture",    nom:"Facture plombier mars 2026",        date:"2026-03-12", description:"Remplacement robinetterie salle de bain — 320 €", taille:"87 Ko", type_fichier:"PDF" },

  // Studio Confluence
  { id:"dc06", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"bail",       nom:"Bail meublé — Thomas Durand",       date:"2025-05-01", description:"Bail de location meublée signé le 01/05/2025",  taille:"231 Ko",  type_fichier:"PDF" },
  { id:"dc07", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"diagnostic", nom:"DPE 2023 — Confluence",             date:"2023-04-20", description:"Diagnostic performance énergétique · Classe D", taille:"980 Ko",  type_fichier:"PDF" },
  { id:"dc08", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"assurance",  nom:"Attestation PNO 2026",              date:"2026-01-01", description:"Assurance propriétaire non occupant 2026",       taille:"298 Ko",  type_fichier:"PDF" },
  { id:"dc09", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"facture",    nom:"Facture peinture fév. 2026",        date:"2026-02-22", description:"Réfection peinture complète — 1 200 €",         taille:"156 Ko",  type_fichier:"PDF" },
  { id:"dc10", bien_id:"b2", bien_nom:"Studio Confluence",    categorie:"impot",      nom:"Taxe foncière 2025",                date:"2025-09-20", description:"Avis de taxe foncière 2025 — 680 €",            taille:"175 Ko",  type_fichier:"PDF" },

  // Garage Bellecour
  { id:"dc11", bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"bail",       nom:"Bail parking — Marie Blanc",        date:"2023-06-01", description:"Bail location parking, reconduit tacitement",   taille:"98 Ko",   type_fichier:"PDF" },
  { id:"dc12", bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"assurance",  nom:"Attestation assurance garage 2026", date:"2026-01-01", description:"Assurance garage 2026",                         taille:"142 Ko",  type_fichier:"PDF" },
  { id:"dc13", bien_id:"b3", bien_nom:"Garage Bellecour",     categorie:"impot",      nom:"Taxe foncière 2025",                date:"2025-09-20", description:"Avis de taxe foncière 2025 — 210 €",            taille:"168 Ko",  type_fichier:"PDF" },

  // T2 Croix-Rousse
  { id:"dc14", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"diagnostic", nom:"DPE 2024 — Croix-Rousse",          date:"2024-11-05", description:"Diagnostic performance énergétique · Classe E", taille:"1,1 Mo",  type_fichier:"PDF" },
  { id:"dc15", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"facture",    nom:"Facture chauffe-eau fév. 2026",     date:"2026-02-18", description:"Remplacement chauffe-eau — 1 200 €",            taille:"203 Ko",  type_fichier:"PDF" },
  { id:"dc16", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"facture",    nom:"Facture peinture mars 2026",        date:"2026-03-10", description:"Réfection peinture salon et chambre — 450 €",   taille:"178 Ko",  type_fichier:"PDF" },
  { id:"dc17", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"assurance",  nom:"Attestation PNO 2026",              date:"2026-01-01", description:"Assurance propriétaire non occupant 2026",       taille:"287 Ko",  type_fichier:"PDF" },
  { id:"dc18", bien_id:"b4", bien_nom:"T2 Croix-Rousse",     categorie:"autre",      nom:"Rapport diagnostics complet",       date:"2026-05-20", description:"Dossier diagnostics complet pour mise en location", taille:"2,3 Mo", type_fichier:"PDF" },
]

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

// ── Zone d'upload visuelle ─────────────────────────────────

function UploadZone({ onFileSelect }: { onFileSelect: (nom: string) => void }) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setFileName(file.name)
    onFileSelect(file.name)
    setTimeout(() => setFileName(null), 3000)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      style={{
        border: `2px dashed ${dragging ? C.g : C.br}`,
        borderRadius: 14,
        padding: "28px 20px",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? C.gp : C.wh,
        transition: "all .2s",
        marginBottom: 16,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display:"none" }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />

      {fileName ? (
        <>
          <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
          <div style={{ fontWeight:700, fontSize:14, color:C.g, marginBottom:4 }}>Fichier sélectionné</div>
          <div style={{ fontSize:13, color:C.tm, fontWeight:500 }}>{fileName}</div>
          <div style={{ fontSize:11, color:C.tm, marginTop:4 }}>
            Remplissez le formulaire pour finaliser l'ajout
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize:36, marginBottom:8 }}>☁️</div>
          <div style={{ fontWeight:700, fontSize:15, color:C.g, marginBottom:4 }}>
            Glisser un fichier ici
          </div>
          <div style={{ fontSize:13, color:C.tm, marginBottom:8 }}>
            ou cliquer pour parcourir vos fichiers
          </div>
          <div
            style={{
              display:"inline-block", padding:"4px 12px", borderRadius:20,
              background:C.cr2, fontSize:11, color:C.tm, fontWeight:600,
            }}
          >
            PDF · JPG · PNG — max 10 Mo
          </div>
        </>
      )}
    </div>
  )
}

// ── Carte document ─────────────────────────────────────────

function DocumentCard({ doc }: { doc: Document }) {
  const cfg = CAT_CONFIG[doc.categorie]
  return (
    <div
      style={{
        background: C.wh,
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
        border: `1.5px solid ${C.br}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      {/* Icône catégorie */}
      <div
        style={{
          width: 44, height: 44, borderRadius: 10,
          background: cfg.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}
      >
        {cfg.emoji}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.tx, marginBottom: 4, lineHeight: 1.3 }}>
          {doc.nom}
          {doc.simule && (
            <span style={{ marginLeft: 6, fontSize: 10, background: C.dp, color: C.gd, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>
              simulé
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: doc.description ? 4 : 0 }}>
          <Badge label={`${cfg.emoji} ${cfg.label}`} bg={cfg.bg} color={cfg.color} />
          <span style={{ fontSize: 11, color: C.tm }}>{doc.bien_nom}</span>
          <span style={{ fontSize: 11, color: C.tm }}>· 📅 {formatDate(doc.date)}</span>
        </div>
        {doc.description && (
          <div style={{ fontSize: 12, color: C.tm, marginTop: 2 }}>{doc.description}</div>
        )}
        <div style={{ fontSize: 11, color: C.cr2.replace(C.cr2, C.tm), marginTop: 4, display: "flex", gap: 8 }}>
          <span style={{ background: C.cr2, padding: "2px 7px", borderRadius: 8, fontSize: 10, color: C.tm, fontWeight: 600 }}>
            {doc.type_fichier}
          </span>
          {doc.taille && (
            <span style={{ fontSize: 11, color: C.tm, paddingTop: 2 }}>{doc.taille}</span>
          )}
        </div>
      </div>

      {/* Bouton voir */}
      <button
        onClick={e => { e.stopPropagation(); alert("Ouverture du fichier non disponible en mode démo.") }}
        style={{
          flexShrink: 0,
          padding: "6px 12px",
          borderRadius: 8,
          border: `1.5px solid ${C.br}`,
          background: C.wh,
          color: C.tm,
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        👁 Voir
      </button>
    </div>
  )
}

// ── Modal ajout d'un document ──────────────────────────────

interface FormState {
  bien_id:      string
  categorie:    CategorieDoc
  nom:          string
  date:         string
  description:  string
  type_fichier: string
}

const today = new Date().toISOString().slice(0, 10)

function AddDocumentModal({
  nomFichierPrefill,
  onClose,
  onSave,
}: {
  nomFichierPrefill: string
  onClose: () => void
  onSave: (d: Document) => void
}) {
  const [form, setForm] = useState<FormState>({
    bien_id:      BIENS_REF[0].id,
    categorie:    "bail",
    nom:          nomFichierPrefill.replace(/\.[^.]+$/, "") || "",
    date:         today,
    description:  "",
    type_fichier: nomFichierPrefill.split(".").pop()?.toUpperCase() || "PDF",
  })

  const set = (key: keyof FormState) => (v: string) =>
    setForm(f => ({ ...f, [key]: v }))

  const bienNom = BIENS_REF.find(b => b.id === form.bien_id)?.nom ?? ""
  const canSave = !!form.nom.trim() && !!form.date

  const handleSave = () => {
    if (!canSave) return
    onSave({
      id:           Date.now().toString(),
      bien_id:      form.bien_id,
      bien_nom:     bienNom,
      categorie:    form.categorie,
      nom:          form.nom.trim(),
      date:         form.date,
      description:  form.description || undefined,
      taille:       nomFichierPrefill ? "— Ko" : undefined,
      type_fichier: form.type_fichier || "PDF",
      simule:       true,
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
        style={{ background:C.wh, borderRadius:"18px 18px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:540, maxHeight:"92vh", overflowY:"auto" }}
      >
        {/* En-tête */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontWeight:800, fontSize:17, color:C.g }}>Nouveau document</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.tm }}>✕</button>
        </div>

        {/* Zone upload dans le modal */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>
            Fichier
          </label>
          {nomFichierPrefill ? (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:C.gp, borderRadius:10 }}>
              <span style={{ fontSize:20 }}>✅</span>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:C.g }}>Fichier sélectionné</div>
                <div style={{ fontSize:12, color:C.tm }}>{nomFichierPrefill}</div>
              </div>
            </div>
          ) : (
            <div
              style={{ border:`2px dashed ${C.br}`, borderRadius:10, padding:"18px 16px", textAlign:"center", cursor:"default", background:C.cr }}
            >
              <div style={{ fontSize:24, marginBottom:4 }}>📄</div>
              <div style={{ fontSize:12, color:C.tm }}>Aucun fichier sélectionné</div>
              <div style={{ fontSize:11, color:C.tm, marginTop:2 }}>Fermez et utilisez la zone d'upload de la page principale</div>
            </div>
          )}
        </div>

        {/* Catégorie */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>
            Catégorie
          </label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
            {(Object.entries(CAT_CONFIG) as [CategorieDoc, typeof CAT_CONFIG[CategorieDoc]][]).map(([k, v]) => (
              <button
                key={k}
                onClick={() => set("categorie")(k)}
                style={{
                  padding:"8px 6px", borderRadius:9, textAlign:"center",
                  border:`2px solid ${form.categorie === k ? v.color : C.br}`,
                  background: form.categorie === k ? v.bg : C.wh,
                  cursor:"pointer", fontFamily:"inherit",
                }}
              >
                <div style={{ fontSize:18, marginBottom:2 }}>{v.emoji}</div>
                <div style={{ fontSize:11, fontWeight:700, color: form.categorie === k ? v.color : C.tm }}>
                  {v.label}
                </div>
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

        <FieldInput
          label="Nom du document *"
          placeholder="Ex. Bail meublé 2026 — Sophie Martin"
          value={form.nom}
          onChange={e => set("nom")(e.target.value)}
        />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <FieldInput
            label="Date du document *"
            type="date"
            value={form.date}
            onChange={e => set("date")(e.target.value)}
          />
          <FieldInput
            label="Format"
            placeholder="PDF"
            value={form.type_fichier}
            onChange={e => set("type_fichier")(e.target.value)}
          />
        </div>
        <FieldInput
          label="Description"
          placeholder="Ex. Bail 1 an renouvelable, signé le 01/09/2024"
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
          Enregistrer le document
        </button>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────

export default function DocumentsPage() {
  const [documents, setDocuments]     = useState<Document[]>(MOCK_DOCUMENTS)
  const [filterBien, setFilterBien]   = useState("")
  const [filterCat,  setFilterCat]    = useState("")
  const [showAdd, setShowAdd]         = useState(false)
  const [prefillNom, setPrefillNom]   = useState("")

  const openAddWithFile = (nom: string) => {
    setPrefillNom(nom)
    setShowAdd(true)
  }

  // ── Filtrage ───────────────────────────────────────────
  const filtered = useMemo(() => {
    return [...documents]
      .filter(d => {
        if (filterBien && d.bien_id !== filterBien) return false
        if (filterCat  && d.categorie !== filterCat) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [documents, filterBien, filterCat])

  // ── Comptages par catégorie ────────────────────────────
  const comptages = useMemo(() => {
    const c: Partial<Record<CategorieDoc, number>> = {}
    filtered.forEach(d => { c[d.categorie] = (c[d.categorie] ?? 0) + 1 })
    return c
  }, [filtered])

  return (
    <>
      {/* ── En-tête ─────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.tx, margin:0, lineHeight:1.2 }}>Documents</h1>
          <div style={{ fontSize:13, color:C.tm, marginTop:3 }}>
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button
          onClick={() => { setPrefillNom(""); setShowAdd(true) }}
          style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"10px 18px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}
        >
          + Ajouter
        </button>
      </div>

      {/* ── Zone d'upload ────────────────────────────────── */}
      <UploadZone onFileSelect={openAddWithFile} />

      {/* ── Filtres ──────────────────────────────────────── */}
      <div style={{ background:C.wh, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.br}`, marginBottom:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <FieldSelect label="Bien" value={filterBien} onChange={setFilterBien}>
          <option value="">Tous les biens</option>
          {BIENS_REF.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </FieldSelect>
        <FieldSelect label="Catégorie" value={filterCat} onChange={setFilterCat}>
          <option value="">Toutes catégories</option>
          {(Object.entries(CAT_CONFIG) as [CategorieDoc, typeof CAT_CONFIG[CategorieDoc]][]).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </FieldSelect>
      </div>

      {/* ── Pills catégories ──────────────────────────────── */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {(Object.entries(CAT_CONFIG) as [CategorieDoc, typeof CAT_CONFIG[CategorieDoc]][]).map(([k, v]) => {
          const n = comptages[k]
          if (!n) return null
          return (
            <button
              key={k}
              onClick={() => setFilterCat(filterCat === k ? "" : k)}
              style={{
                display:"flex", alignItems:"center", gap:5,
                padding:"5px 12px", borderRadius:20,
                border:`1.5px solid ${filterCat === k ? v.color : C.br}`,
                background: filterCat === k ? v.bg : C.wh,
                cursor:"pointer", fontFamily:"inherit",
              }}
            >
              <span style={{ fontSize:13 }}>{v.emoji}</span>
              <span style={{ fontSize:12, fontWeight:700, color: filterCat === k ? v.color : C.tm }}>{v.label}</span>
              <span style={{ fontSize:11, fontWeight:800, color: filterCat === k ? v.color : C.tm, background: filterCat === k ? v.color+"22" : C.cr2, padding:"1px 6px", borderRadius:10 }}>{n}</span>
            </button>
          )
        })}
      </div>

      {/* ── Liste ────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ background:C.wh, borderRadius:14, padding:"56px 20px", textAlign:"center", border:`1px solid ${C.br}` }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
          <div style={{ fontWeight:700, fontSize:15, color:C.tx, marginBottom:6 }}>Aucun document</div>
          <div style={{ color:C.tm, fontSize:13, marginBottom:20 }}>Modifiez les filtres ou ajoutez un document.</div>
          <button
            onClick={() => { setPrefillNom(""); setShowAdd(true) }}
            style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"11px 22px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}
          >
            + Ajouter un document
          </button>
        </div>
      ) : (
        filtered.map(d => <DocumentCard key={d.id} doc={d} />)
      )}

      {/* ── Modal ────────────────────────────────────────── */}
      {showAdd && (
        <AddDocumentModal
          nomFichierPrefill={prefillNom}
          onClose={() => { setShowAdd(false); setPrefillNom("") }}
          onSave={d => {
            setDocuments(prev => [d, ...prev])
            if (filterBien && filterBien !== d.bien_id) setFilterBien("")
            if (filterCat  && filterCat  !== d.categorie) setFilterCat("")
          }}
        />
      )}
    </>
  )
}
