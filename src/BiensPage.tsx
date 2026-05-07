import { useState, useEffect } from "react"
import { supabase } from "./supabase"

const C = {
  g:   "#2d5b3d", gl:  "#3d7a52", gp:  "#e6efe9",
  cr:  "#f7f4ee", cr2: "#eeebe3",
  tx:  "#1a2a1f", tm:  "#6b8c74",
  rd:  "#c0392b", rp:  "#fdecea",
  bl:  "#2471a3", bp:  "#eaf4fb",
  wh:  "#ffffff", br:  "#dde8e0",
}

const euro = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })

type TypeBien      = "appartement" | "maison" | "garage" | "local" | "autre"
type Statut        = "loue" | "vacant"
type ModeDetention = "nom-propre" | "indivision" | "sci-ir" | "sci-is" | "sarl-famille" | "sas" | "holding" | "autre"
type RegimeFiscal  = "foncier-micro" | "foncier-reel" | "lmnp-micro" | "lmnp-reel" | "lmp" | "is" | "autre"

interface BienSimple {
  kind: "simple"
  id: string; nom: string; adresse: string
  type: TypeBien; mode_detention: ModeDetention; regime_fiscal: RegimeFiscal; statut: Statut
  locataire?: string
  loyer_hc: number; charges: number; depenses: number
}

interface Lot {
  id: string; immeuble_id: string; nom: string
  type: TypeBien; regime_fiscal: RegimeFiscal; statut: Statut
  locataire?: string
  loyer_hc: number; charges: number; depenses: number
}

interface Immeuble {
  kind: "immeuble"
  id: string; nom: string; adresse: string
  mode_detention: ModeDetention; regime_fiscal: RegimeFiscal; lots: Lot[]
}

type Bien = BienSimple | Immeuble

const TYPE_LABELS: Record<TypeBien, string> = {
  appartement: "Appartement", maison: "Maison",
  garage: "Garage / Cave", local: "Local commercial", autre: "Autre",
}
const TYPE_EMOJI: Record<TypeBien, string> = {
  appartement: "🏠", maison: "🏡", garage: "🅿️", local: "🏪", autre: "🏗",
}
const MODE_DETENTION_LABELS: Record<ModeDetention, string> = {
  "nom-propre":    "Nom propre",
  "indivision":    "Indivision",
  "sci-ir":        "SCI à l'IR",
  "sci-is":        "SCI à l'IS",
  "sarl-famille":  "SARL de famille",
  "sas":           "SAS",
  "holding":       "Holding",
  "autre":         "Autre",
}
const REGIME_FISCAL_LABELS: Record<RegimeFiscal, string> = {
  "foncier-micro": "Revenus fonciers — micro",
  "foncier-reel":  "Revenus fonciers — réel",
  "lmnp-micro":    "LMNP micro-BIC",
  "lmnp-reel":     "LMNP réel",
  "lmp":           "LMP",
  "is":            "IS",
  "autre":         "Autre",
}

// ── Mapping DB → types locaux ──────────────────────────────

function parseMeta(row: any): Record<string, string> {
  try { return JSON.parse(row.notes || "{}") } catch { return {} }
}

function parseRegimeFiscal(v: string): RegimeFiscal {
  // compatibilité avec les anciennes valeurs stockées
  const compat: Record<string, RegimeFiscal> = {
    "micro-foncier": "foncier-micro",
    "reel":          "foncier-reel",
    "LMNP-micro":    "lmnp-micro",
    "LMNP-reel":     "lmnp-reel",
  }
  const valid: RegimeFiscal[] = ["foncier-micro","foncier-reel","lmnp-micro","lmnp-reel","lmp","is","autre"]
  if (valid.includes(v as RegimeFiscal)) return v as RegimeFiscal
  return compat[v] ?? "foncier-micro"
}

function rowToSimple(row: any): BienSimple {
  const meta = parseMeta(row)
  return {
    kind: "simple",
    id: row.id, nom: row.nom, adresse: row.adresse ?? "",
    type: (row.type ?? "appartement") as TypeBien,
    mode_detention: (meta.mode_detention ?? "nom-propre") as ModeDetention,
    regime_fiscal: parseRegimeFiscal(row.regime_fiscal ?? "foncier-micro"),
    statut: "vacant", loyer_hc: 0, charges: 0, depenses: 0,
  }
}

function rowToImmeuble(row: any, lots: Lot[]): Immeuble {
  const meta = parseMeta(row)
  return {
    kind: "immeuble",
    id: row.id, nom: row.nom, adresse: row.adresse ?? "",
    mode_detention: (meta.mode_detention ?? "nom-propre") as ModeDetention,
    regime_fiscal: parseRegimeFiscal(row.regime_fiscal ?? "foncier-reel"),
    lots,
  }
}

function rowToLot(row: any, meta: Record<string, string>): Lot {
  return {
    id: row.id, immeuble_id: meta.parent ?? "",
    nom: row.nom,
    type: (row.type ?? "appartement") as TypeBien,
    regime_fiscal: parseRegimeFiscal(row.regime_fiscal ?? "foncier-micro"),
    statut: "vacant", loyer_hc: 0, charges: 0, depenses: 0,
  }
}

function cf(b: BienSimple | Lot) { return b.loyer_hc + b.charges - b.depenses }
function immCf(imm: Immeuble)    { return imm.lots.reduce((s, l) => s + cf(l), 0) }

// ── Primitives UI ──────────────────────────────────────────

function Badge({ label, bg = C.gp, color = C.g }: { label: string; bg?: string; color?: string }) {
  return <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:20, background:bg, color, fontSize:11, fontWeight:700 }}>{label}</span>
}

function FieldInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>{label}</label>
      <input style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.br}`, borderRadius:8, fontSize:14, fontFamily:"inherit", color:C.tx, background:C.cr, outline:"none", boxSizing:"border-box" }} {...props} />
    </div>
  )
}

function FieldSelect({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>{label}</label>
      <select style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.br}`, borderRadius:8, fontSize:14, fontFamily:"inherit", color:C.tx, background:C.cr, outline:"none", boxSizing:"border-box" }} {...props}>{children}</select>
    </div>
  )
}

function InfoRow({ label, value, bold = false, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.br}`, fontSize:13 }}>
      <span style={{ color:C.tm }}>{label}</span>
      <span style={{ fontWeight:bold?800:600, color:color??C.tx }}>{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <div style={{ fontSize:11, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>{children}</div>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:900, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.wh, borderRadius:"18px 18px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontWeight:800, fontSize:17, color:C.g }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.tm }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function SaveBtn({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:"13px 0", borderRadius:10, background:disabled?C.cr2:C.g, color:disabled?C.tm:"#fff", border:"none", fontWeight:800, fontSize:15, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit" }}>
      {label}
    </button>
  )
}

function DetailBanner({ title, subtitle, cashflow, lots }: { title: string; subtitle?: string; cashflow: number; lots?: number }) {
  return (
    <div style={{ background:`linear-gradient(135deg,${C.g},${C.gl})`, borderRadius:16, padding:"20px 22px", marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:22, fontWeight:900, color:"#fff", marginBottom:4 }}>{title}</div>
          {subtitle && <div style={{ fontSize:13, color:"rgba(255,255,255,.75)", marginBottom:8 }}>📍 {subtitle}</div>}
          {lots !== undefined && <Badge label={`${lots} lot${lots!==1?"s":""}`} bg="rgba(255,255,255,.2)" color="#fff" />}
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.6)", textTransform:"uppercase", marginBottom:2 }}>Cash-flow / mois</div>
          <div style={{ fontSize:28, fontWeight:900, color:cashflow>=0?"#a8d5b5":"#f5a89a", lineHeight:1.1 }}>{cashflow>=0?"+":""}{euro(cashflow)}</div>
        </div>
      </div>
    </div>
  )
}

// ── Cards ──────────────────────────────────────────────────

function BienSimpleCard({ bien, onClick }: { bien: BienSimple; onClick: () => void }) {
  const c = cf(bien); const loue = bien.statut === "loue"
  return (
    <div onClick={onClick}
      style={{ background:C.wh, borderRadius:14, padding:"18px 20px", marginBottom:12, boxShadow:"0 1px 10px rgba(45,91,61,.07)", border:`1.5px solid ${C.br}`, cursor:"pointer", transition:"all .18s" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform="translateY(-2px)"; el.style.boxShadow="0 4px 20px rgba(45,91,61,.14)" }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform=""; el.style.boxShadow="0 1px 10px rgba(45,91,61,.07)" }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:20 }}>{TYPE_EMOJI[bien.type]}</span>
            <span style={{ fontWeight:800, fontSize:16, color:C.tx }}>{bien.nom}</span>
          </div>
          {bien.adresse && <div style={{ fontSize:12, color:C.tm, marginBottom:8 }}>📍 {bien.adresse}</div>}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <Badge label={TYPE_LABELS[bien.type]} />
            <Badge label={loue?"Loué":"Vacant"} bg={loue?C.gp:C.rp} color={loue?C.g:C.rd} />
            <Badge label={MODE_DETENTION_LABELS[bien.mode_detention]} bg="#f0edf8" color="#6c3fc7" />
            <Badge label={REGIME_FISCAL_LABELS[bien.regime_fiscal]} bg={C.bp} color={C.bl} />
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:10, color:C.tm, textTransform:"uppercase", marginBottom:2 }}>Cash-flow / mois</div>
          <div style={{ fontSize:22, fontWeight:900, color:c>=0?C.g:C.rd, lineHeight:1.1 }}>{c>=0?"+":""}{euro(c)}</div>
          <div style={{ fontSize:11, color:C.tm, marginTop:4 }}>Loyer {euro(bien.loyer_hc)} HC</div>
        </div>
      </div>
    </div>
  )
}

function LotRow({ lot, onClick }: { lot: Lot; onClick: () => void }) {
  const c = cf(lot); const loue = lot.statut === "loue"
  return (
    <div onClick={e => { e.stopPropagation(); onClick() }}
      style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:8, background:C.cr, marginBottom:4, cursor:"pointer", transition:"background .12s" }}
      onMouseEnter={e => (e.currentTarget.style.background = C.gp)}
      onMouseLeave={e => (e.currentTarget.style.background = C.cr)}
    >
      <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
        <span style={{ fontSize:15 }}>{TYPE_EMOJI[lot.type]}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:13, color:C.tx }}>{lot.nom}</div>
          {loue && lot.locataire && <div style={{ fontSize:11, color:C.tm }}>👤 {lot.locataire}</div>}
        </div>
        <Badge label={loue?"Loué":"Vacant"} bg={loue?C.gp:C.rp} color={loue?C.g:C.rd} />
      </div>
      <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
        <div style={{ fontWeight:800, fontSize:14, color:c>=0?C.g:C.rd }}>{c>=0?"+":""}{euro(c)}</div>
        <div style={{ fontSize:10, color:C.tm }}>/ mois</div>
      </div>
    </div>
  )
}

function ImmeubleCard({ immeuble, onClick, onAddLot, onClickLot }: {
  immeuble: Immeuble; onClick: () => void; onAddLot: () => void; onClickLot: (l: Lot) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const c = immCf(immeuble)
  const nbLoues = immeuble.lots.filter(l => l.statut === "loue").length
  const totalLoyer = immeuble.lots.reduce((s, l) => s + l.loyer_hc, 0)

  return (
    <div style={{ background:C.wh, borderRadius:14, marginBottom:12, boxShadow:"0 1px 10px rgba(45,91,61,.07)", border:`1.5px solid ${C.g}`, overflow:"hidden" }}>
      <div onClick={onClick} style={{ padding:"18px 20px", cursor:"pointer", transition:"background .15s" }}
        onMouseEnter={e => (e.currentTarget.style.background = C.gp)}
        onMouseLeave={e => (e.currentTarget.style.background = "")}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:20 }}>🏢</span>
              <span style={{ fontWeight:800, fontSize:16, color:C.tx }}>{immeuble.nom}</span>
              <Badge label="Immeuble" bg={C.g} color="#fff" />
            </div>
            {immeuble.adresse && <div style={{ fontSize:12, color:C.tm, marginBottom:8 }}>📍 {immeuble.adresse}</div>}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Badge label={`${immeuble.lots.length} lot${immeuble.lots.length!==1?"s":""}`} />
              <Badge label={`${nbLoues} loué${nbLoues!==1?"s":""}`} bg={nbLoues>0?C.gp:C.rp} color={nbLoues>0?C.g:C.rd} />
              <Badge label={MODE_DETENTION_LABELS[immeuble.mode_detention]} bg="#f0edf8" color="#6c3fc7" />
              <Badge label={REGIME_FISCAL_LABELS[immeuble.regime_fiscal]} bg={C.bp} color={C.bl} />
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontSize:10, color:C.tm, textTransform:"uppercase", marginBottom:2 }}>Cash-flow total / mois</div>
            <div style={{ fontSize:22, fontWeight:900, color:c>=0?C.g:C.rd, lineHeight:1.1 }}>{c>=0?"+":""}{euro(c)}</div>
            <div style={{ fontSize:11, color:C.tm, marginTop:4 }}>Loyers {euro(totalLoyer)} HC</div>
          </div>
        </div>
      </div>
      <div style={{ borderTop:`1px solid ${C.br}`, padding:"12px 16px 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <button onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
            style={{ background:"none", border:"none", fontSize:11, fontWeight:700, color:C.gl, cursor:"pointer", fontFamily:"inherit", textTransform:"uppercase", letterSpacing:".05em", padding:0 }}>
            {expanded ? "▼" : "▶"} Lots ({immeuble.lots.length})
          </button>
          <button onClick={e => { e.stopPropagation(); onAddLot() }}
            style={{ background:C.gp, color:C.g, border:"none", borderRadius:8, padding:"5px 12px", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            + Ajouter un lot
          </button>
        </div>
        {expanded && (
          immeuble.lots.length === 0
            ? <div style={{ color:C.tm, fontSize:13, padding:"6px 4px" }}>Aucun lot — ajoutez-en un.</div>
            : immeuble.lots.map(lot => <LotRow key={lot.id} lot={lot} onClick={() => onClickLot(lot)} />)
        )}
      </div>
    </div>
  )
}

// ── Vues détail ────────────────────────────────────────────

function PlaceholderTab({ tab }: { tab: string }) {
  const emoji = tab === "recettes" ? "💰" : tab === "depenses" ? "📉" : "📎"
  const label = tab === "recettes" ? "Recettes" : tab === "depenses" ? "Dépenses" : "Documents"
  return (
    <div style={{ background:C.wh, borderRadius:14, padding:"56px 20px", border:`1px solid ${C.br}`, textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{emoji}</div>
      <div style={{ fontWeight:700, fontSize:15, color:C.tx, marginBottom:6 }}>{label}</div>
      <div style={{ color:C.tm, fontSize:13 }}>Cette section sera disponible à la prochaine étape.</div>
    </div>
  )
}

function BienSimpleDetail({ bien, onBack }: { bien: BienSimple; onBack: () => void }) {
  const [tab, setTab] = useState<"infos"|"recettes"|"depenses"|"documents">("infos")
  const c = cf(bien); const loue = bien.statut === "loue"
  return (
    <div>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.g, fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:16, fontFamily:"inherit", padding:0 }}>
        ← Retour à la liste
      </button>
      <DetailBanner title={`${TYPE_EMOJI[bien.type]} ${bien.nom}`} subtitle={bien.adresse} cashflow={c} />
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {(["infos","recettes","depenses","documents"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 14px", borderRadius:9, border:`1.5px solid ${tab===t?C.g:C.br}`, background:tab===t?C.g:C.wh, color:tab===t?"#fff":C.tx, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            {t==="infos"?"📋 Infos":t==="recettes"?"💰 Recettes":t==="depenses"?"📉 Dépenses":"📎 Documents"}
          </button>
        ))}
      </div>
      {tab === "infos" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={{ background:C.wh, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.br}` }}>
            <SectionTitle>Locataire</SectionTitle>
            {loue && bien.locataire
              ? <><div style={{ fontWeight:800, fontSize:15, marginBottom:8 }}>👤 {bien.locataire}</div><Badge label="Bail en cours" /></>
              : <div style={{ color:C.rd, fontWeight:700, fontSize:14 }}>🔴 Bien vacant</div>}
          </div>
          <div style={{ background:C.wh, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.br}` }}>
            <SectionTitle>Finances / mois</SectionTitle>
            <InfoRow label="Loyer HC"  value={euro(bien.loyer_hc)} />
            <InfoRow label="Charges"   value={euro(bien.charges)} />
            <InfoRow label="Dépenses"  value={euro(bien.depenses)} />
            <InfoRow label="Cash-flow" value={(c>=0?"+":"")+euro(c)} bold color={c>=0?C.g:C.rd} />
          </div>
          <div style={{ background:C.wh, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.br}`, gridColumn:"1/-1" }}>
            <SectionTitle>Informations</SectionTitle>
            <InfoRow label="Type"                value={TYPE_LABELS[bien.type]} />
            <InfoRow label="Mode de détention"   value={MODE_DETENTION_LABELS[bien.mode_detention]} />
            <InfoRow label="Régime fiscal"        value={REGIME_FISCAL_LABELS[bien.regime_fiscal]} />
            <InfoRow label="Loyer annuel"         value={euro(bien.loyer_hc*12)} />
            <InfoRow label="Résultat annuel"      value={(c*12>=0?"+":"")+euro(c*12)} bold color={c>=0?C.g:C.rd} />
          </div>
        </div>
      )}
      {tab !== "infos" && <PlaceholderTab tab={tab} />}
    </div>
  )
}

function LotDetail({ lot, immeuble, onBack }: { lot: Lot; immeuble: Immeuble; onBack: () => void }) {
  const [tab, setTab] = useState<"infos"|"recettes"|"depenses">("infos")
  const c = cf(lot); const loue = lot.statut === "loue"
  return (
    <div>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.g, fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:8, fontFamily:"inherit", padding:0 }}>
        ← Retour à {immeuble.nom}
      </button>
      <div style={{ fontSize:11, color:C.tm, marginBottom:12, fontWeight:600 }}>🏢 {immeuble.nom} › {lot.nom}</div>
      <DetailBanner title={`${TYPE_EMOJI[lot.type]} ${lot.nom}`} subtitle={immeuble.adresse} cashflow={c} />
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {(["infos","recettes","depenses"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 14px", borderRadius:9, border:`1.5px solid ${tab===t?C.g:C.br}`, background:tab===t?C.g:C.wh, color:tab===t?"#fff":C.tx, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            {t==="infos"?"📋 Infos":t==="recettes"?"💰 Recettes":"📉 Dépenses"}
          </button>
        ))}
      </div>
      {tab === "infos" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={{ background:C.wh, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.br}` }}>
            <SectionTitle>Locataire</SectionTitle>
            {loue && lot.locataire
              ? <><div style={{ fontWeight:800, fontSize:15, marginBottom:8 }}>👤 {lot.locataire}</div><Badge label="Bail en cours" /></>
              : <div style={{ color:C.rd, fontWeight:700, fontSize:14 }}>🔴 Lot vacant</div>}
          </div>
          <div style={{ background:C.wh, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.br}` }}>
            <SectionTitle>Finances / mois</SectionTitle>
            <InfoRow label="Loyer HC"  value={euro(lot.loyer_hc)} />
            <InfoRow label="Charges"   value={euro(lot.charges)} />
            <InfoRow label="Dépenses"  value={euro(lot.depenses)} />
            <InfoRow label="Cash-flow" value={(c>=0?"+":"")+euro(c)} bold color={c>=0?C.g:C.rd} />
          </div>
          <div style={{ background:C.wh, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.br}`, gridColumn:"1/-1" }}>
            <SectionTitle>Informations</SectionTitle>
            <InfoRow label="Immeuble"            value={immeuble.nom} />
            <InfoRow label="Type"                value={TYPE_LABELS[lot.type]} />
            <InfoRow label="Mode de détention"   value={MODE_DETENTION_LABELS[immeuble.mode_detention]} />
            <InfoRow label="Régime fiscal"        value={REGIME_FISCAL_LABELS[lot.regime_fiscal]} />
            <InfoRow label="Loyer annuel"         value={euro(lot.loyer_hc*12)} />
            <InfoRow label="Résultat annuel"      value={(c*12>=0?"+":"")+euro(c*12)} bold color={c>=0?C.g:C.rd} />
          </div>
        </div>
      )}
      {tab !== "infos" && <PlaceholderTab tab={tab} />}
    </div>
  )
}

function ImmeubleDetail({ immeuble, onBack, onAddLot, onClickLot }: {
  immeuble: Immeuble; onBack: () => void; onAddLot: () => void; onClickLot: (l: Lot) => void
}) {
  const [tab, setTab] = useState<"lots"|"infos"|"recettes"|"depenses">("lots")
  const c = immCf(immeuble)
  const nbLoues = immeuble.lots.filter(l => l.statut === "loue").length

  return (
    <div>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.g, fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:16, fontFamily:"inherit", padding:0 }}>
        ← Retour à la liste
      </button>
      <DetailBanner title={`🏢 ${immeuble.nom}`} subtitle={immeuble.adresse} cashflow={c} lots={immeuble.lots.length} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {(["lots","infos","recettes","depenses"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 14px", borderRadius:9, border:`1.5px solid ${tab===t?C.g:C.br}`, background:tab===t?C.g:C.wh, color:tab===t?"#fff":C.tx, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              {t==="lots"?"🏠 Lots":t==="infos"?"📋 Infos":t==="recettes"?"💰 Recettes":"📉 Dépenses"}
            </button>
          ))}
        </div>
        {tab === "lots" && (
          <button onClick={onAddLot} style={{ background:C.g, color:"#fff", border:"none", borderRadius:9, padding:"8px 16px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            + Ajouter un lot
          </button>
        )}
      </div>
      {tab === "lots" && (
        immeuble.lots.length === 0 ? (
          <div style={{ background:C.wh, borderRadius:14, padding:"48px 20px", textAlign:"center", border:`1px solid ${C.br}` }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🏠</div>
            <div style={{ fontWeight:700, fontSize:15, color:C.tx, marginBottom:6 }}>Aucun lot</div>
            <div style={{ color:C.tm, fontSize:13, marginBottom:20 }}>Ajoutez le premier lot de cet immeuble.</div>
            <button onClick={onAddLot} style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"11px 22px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>+ Ajouter un lot</button>
          </div>
        ) : (
          <div style={{ display:"grid", gap:10 }}>
            {immeuble.lots.map(lot => {
              const lc = cf(lot); const loue = lot.statut === "loue"
              return (
                <div key={lot.id} onClick={() => onClickLot(lot)}
                  style={{ background:C.wh, borderRadius:12, padding:"16px 20px", border:`1px solid ${C.br}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, transition:"background .12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.gp)}
                  onMouseLeave={e => (e.currentTarget.style.background = C.wh)}
                >
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:18 }}>{TYPE_EMOJI[lot.type]}</span>
                      <span style={{ fontWeight:800, fontSize:15, color:C.tx }}>{lot.nom}</span>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                      <Badge label={TYPE_LABELS[lot.type]} />
                      <Badge label={loue?"Loué":"Vacant"} bg={loue?C.gp:C.rp} color={loue?C.g:C.rd} />
                      <Badge label={REGIME_FISCAL_LABELS[lot.regime_fiscal]} bg={C.bp} color={C.bl} />
                      {loue && lot.locataire && <span style={{ fontSize:12, color:C.tm }}>👤 {lot.locataire}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:10, color:C.tm, textTransform:"uppercase" }}>Cash-flow</div>
                    <div style={{ fontWeight:900, fontSize:18, color:lc>=0?C.g:C.rd }}>{lc>=0?"+":""}{euro(lc)}</div>
                    <div style={{ fontSize:11, color:C.tm }}>{euro(lot.loyer_hc)} HC / mois</div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
      {tab === "infos" && (
        <div style={{ background:C.wh, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.br}` }}>
          <SectionTitle>Informations de l'immeuble</SectionTitle>
          <InfoRow label="Adresse"              value={immeuble.adresse || "—"} />
          <InfoRow label="Mode de détention"    value={MODE_DETENTION_LABELS[immeuble.mode_detention]} />
          <InfoRow label="Régime fiscal"        value={REGIME_FISCAL_LABELS[immeuble.regime_fiscal]} />
          <InfoRow label="Nombre de lots"       value={String(immeuble.lots.length)} />
          <InfoRow label="Lots loués"           value={`${nbLoues} / ${immeuble.lots.length}`} />
          <InfoRow label="Loyers totaux / mois" value={euro(immeuble.lots.reduce((s,l)=>s+l.loyer_hc,0))} />
          <InfoRow label="Cash-flow / mois"     value={(c>=0?"+":"")+euro(c)} bold color={c>=0?C.g:C.rd} />
          <InfoRow label="Cash-flow annuel"     value={(c*12>=0?"+":"")+euro(c*12)} bold color={c>=0?C.g:C.rd} />
        </div>
      )}
      {(tab === "recettes" || tab === "depenses") && <PlaceholderTab tab={tab} />}
    </div>
  )
}

// ── Modals ─────────────────────────────────────────────────

function TypeOptions() {
  return <>
    <option value="appartement">Appartement</option>
    <option value="maison">Maison</option>
    <option value="garage">Garage / Cave</option>
    <option value="local">Local commercial</option>
    <option value="autre">Autre</option>
  </>
}

function ModeDetentionOptions() {
  return <>
    <option value="nom-propre">Nom propre</option>
    <option value="indivision">Indivision</option>
    <option value="sci-ir">SCI à l'IR</option>
    <option value="sci-is">SCI à l'IS</option>
    <option value="sarl-famille">SARL de famille</option>
    <option value="sas">SAS</option>
    <option value="holding">Holding</option>
    <option value="autre">Autre</option>
  </>
}

function RegimeFiscalOptions() {
  return <>
    <option value="foncier-micro">Revenus fonciers — micro</option>
    <option value="foncier-reel">Revenus fonciers — réel</option>
    <option value="lmnp-micro">LMNP micro-BIC</option>
    <option value="lmnp-reel">LMNP réel</option>
    <option value="lmp">LMP</option>
    <option value="is">IS</option>
    <option value="autre">Autre</option>
  </>
}

function AddBienSimpleModal({ onClose, onSave }: { onClose: () => void; onSave: (f: any) => void }) {
  const [f, setF] = useState({ nom:"", adresse:"", type:"appartement", mode_detention:"nom-propre", regime_fiscal:"foncier-micro" })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  return (
    <Modal title="Nouveau bien simple" onClose={onClose}>
      <FieldInput label="Nom *" placeholder="Ex. Appartement Gambetta" value={f.nom} onChange={set("nom")} />
      <FieldInput label="Adresse" placeholder="12 rue de la Paix, 69001 Lyon" value={f.adresse} onChange={set("adresse")} />
      <FieldSelect label="Type" value={f.type} onChange={set("type")}><TypeOptions /></FieldSelect>
      <FieldSelect label="Mode de détention" value={f.mode_detention} onChange={set("mode_detention")}><ModeDetentionOptions /></FieldSelect>
      <FieldSelect label="Régime fiscal" value={f.regime_fiscal} onChange={set("regime_fiscal")}><RegimeFiscalOptions /></FieldSelect>
      <SaveBtn label="Enregistrer" disabled={!f.nom.trim()} onClick={() => { if (f.nom.trim()) onSave(f) }} />
    </Modal>
  )
}

function AddImmeubleModal({ onClose, onSave }: { onClose: () => void; onSave: (f: any) => void }) {
  const [f, setF] = useState({ nom:"", adresse:"", mode_detention:"nom-propre", regime_fiscal:"foncier-reel" })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  return (
    <Modal title="Nouvel immeuble" onClose={onClose}>
      <FieldInput label="Nom *" placeholder="Ex. Immeuble Confluence" value={f.nom} onChange={set("nom")} />
      <FieldInput label="Adresse" placeholder="8 quai Perrache, 69002 Lyon" value={f.adresse} onChange={set("adresse")} />
      <FieldSelect label="Mode de détention" value={f.mode_detention} onChange={set("mode_detention")}><ModeDetentionOptions /></FieldSelect>
      <FieldSelect label="Régime fiscal" value={f.regime_fiscal} onChange={set("regime_fiscal")}><RegimeFiscalOptions /></FieldSelect>
      <div style={{ background:C.gp, borderRadius:10, padding:"12px 14px", marginBottom:16, fontSize:13, color:C.g, fontWeight:600 }}>
        💡 Créé vide — vous ajouterez les lots ensuite.
      </div>
      <SaveBtn label="Créer l'immeuble" disabled={!f.nom.trim()} onClick={() => { if (f.nom.trim()) onSave(f) }} />
    </Modal>
  )
}

function AddLotModal({ immeuble, onClose, onSave }: { immeuble: Immeuble; onClose: () => void; onSave: (f: any) => void }) {
  const [f, setF] = useState({ nom:"", type:"appartement", regime_fiscal: immeuble.regime_fiscal })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  return (
    <Modal title={`Nouveau lot · ${immeuble.nom}`} onClose={onClose}>
      <FieldInput label="Nom du lot *" placeholder="Ex. Appt 1A – T3" value={f.nom} onChange={set("nom")} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <FieldSelect label="Type" value={f.type} onChange={set("type")}><TypeOptions /></FieldSelect>
        <FieldSelect label="Régime fiscal" value={f.regime_fiscal} onChange={set("regime_fiscal")}><RegimeFiscalOptions /></FieldSelect>
      </div>
      <SaveBtn label="Ajouter le lot" disabled={!f.nom.trim()} onClick={() => { if (f.nom.trim()) onSave(f) }} />
    </Modal>
  )
}

// ── Page principale ────────────────────────────────────────

type Selection =
  | { kind: "simple";   id: string }
  | { kind: "immeuble"; id: string }
  | { kind: "lot";      id: string; immeuble_id: string }

export default function BiensPage() {
  const [biens, setBiens]         = useState<Bien[]>([])
  const [loading, setLoading]     = useState(true)
  const [dbError, setDbError]     = useState("")
  const [selected, setSelected]   = useState<Selection | null>(null)
  const [showAdd, setShowAdd]     = useState<"simple" | "immeuble" | null>(null)
  const [addLotFor, setAddLotFor] = useState<string | null>(null)
  const [userId, setUserId]       = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
    load()
  }, [])

  async function load() {
    setLoading(true)
    setDbError("")
    const { data, error } = await supabase
      .from("biens")
      .select("*")
      .order("created_at", { ascending: true })
    setLoading(false)
    if (error) { setDbError(error.message); return }

    const rows = data ?? []
    const lotRows  = rows.filter(r => parseMeta(r).kind === "lot")
    const immRows  = rows.filter(r => parseMeta(r).kind === "immeuble")
    const simpRows = rows.filter(r => !["lot","immeuble"].includes(parseMeta(r).kind))

    const lots: Lot[] = lotRows.map(r => rowToLot(r, parseMeta(r)))
    const result: Bien[] = [
      ...simpRows.map(r => rowToSimple(r)),
      ...immRows.map(r => rowToImmeuble(r, lots.filter(l => l.immeuble_id === r.id))),
    ].sort((a, b) => a.nom.localeCompare(b.nom))

    setBiens(result)
  }

  async function handleAddSimple(f: any) {
    if (!userId) { setDbError("Utilisateur non connecté."); return }
    setShowAdd(null)
    const { data, error } = await supabase
      .from("biens")
      .insert({ owner_id: userId, nom: f.nom.trim(), adresse: f.adresse.trim() || null, type: f.type, regime_fiscal: f.regime_fiscal, notes: JSON.stringify({ mode_detention: f.mode_detention }) })
      .select().single()
    if (error) { setDbError(error.message); return }
    setBiens(prev => [...prev, rowToSimple(data)])
  }

  async function handleAddImmeuble(f: any) {
    if (!userId) { setDbError("Utilisateur non connecté."); return }
    setShowAdd(null)
    const { data, error } = await supabase
      .from("biens")
      .insert({ owner_id: userId, nom: f.nom.trim(), adresse: f.adresse.trim() || null, regime_fiscal: f.regime_fiscal, notes: JSON.stringify({ kind: "immeuble", mode_detention: f.mode_detention }) })
      .select().single()
    if (error) { setDbError(error.message); return }
    setBiens(prev => [...prev, rowToImmeuble(data, [])])
  }

  async function handleAddLot(immeubleId: string, f: any) {
    if (!userId) { setDbError("Utilisateur non connecté."); return }
    setAddLotFor(null)
    const { data, error } = await supabase
      .from("biens")
      .insert({ owner_id: userId, nom: f.nom.trim(), type: f.type, regime_fiscal: f.regime_fiscal, notes: JSON.stringify({ kind: "lot", parent: immeubleId }) })
      .select().single()
    if (error) { setDbError(error.message); return }
    const newLot = rowToLot(data, { kind: "lot", parent: immeubleId })
    setBiens(prev => prev.map(b =>
      b.kind === "immeuble" && b.id === immeubleId ? { ...b, lots: [...b.lots, newLot] } : b
    ))
  }

  const simples   = biens.filter((b): b is BienSimple => b.kind === "simple")
  const immeubles = biens.filter((b): b is Immeuble   => b.kind === "immeuble")
  const allUnits  = [...simples, ...immeubles.flatMap(i => i.lots)]
  const nbLoues   = allUnits.filter(u => u.statut === "loue").length
  const totalLoyer = allUnits.reduce((s, u) => s + u.loyer_hc, 0)
  const totalCF    = allUnits.reduce((s, u) => s + cf(u), 0)

  // Routing détail
  if (selected) {
    if (selected.kind === "simple") {
      const bien = simples.find(b => b.id === selected.id)
      if (!bien) { setSelected(null); return null }
      return <BienSimpleDetail bien={bien} onBack={() => setSelected(null)} />
    }
    if (selected.kind === "immeuble") {
      const imm = immeubles.find(b => b.id === selected.id)
      if (!imm) { setSelected(null); return null }
      return (
        <>
          <ImmeubleDetail
            immeuble={imm}
            onBack={() => setSelected(null)}
            onAddLot={() => setAddLotFor(imm.id)}
            onClickLot={lot => setSelected({ kind:"lot", id:lot.id, immeuble_id:imm.id })}
          />
          {addLotFor === imm.id && (
            <AddLotModal immeuble={imm} onClose={() => setAddLotFor(null)} onSave={f => handleAddLot(imm.id, f)} />
          )}
        </>
      )
    }
    if (selected.kind === "lot") {
      const imm = immeubles.find(b => b.id === selected.immeuble_id)
      const lot = imm?.lots.find(l => l.id === selected.id)
      if (!imm || !lot) { setSelected(null); return null }
      return <LotDetail lot={lot} immeuble={imm} onBack={() => setSelected({ kind:"immeuble", id:imm.id })} />
    }
  }

  return (
    <>
      {/* En-tête */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.tx, margin:0, lineHeight:1.2 }}>Mes biens</h1>
          <div style={{ fontSize:13, color:C.tm, marginTop:3 }}>
            {loading ? "Chargement…" : `${allUnits.length} unité${allUnits.length!==1?"s":""} · ${nbLoues} louée${nbLoues!==1?"s":""}`}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setShowAdd("simple")} style={{ background:C.wh, color:C.g, border:`1.5px solid ${C.g}`, borderRadius:10, padding:"10px 16px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            + Bien simple
          </button>
          <button onClick={() => setShowAdd("immeuble")} style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"10px 16px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            + Immeuble
          </button>
        </div>
      </div>

      {/* Erreur */}
      {dbError && (
        <div style={{ background:C.rp, border:`1px solid ${C.rd}`, borderRadius:12, padding:"14px 16px", color:C.rd, fontWeight:600, fontSize:13, marginBottom:16 }}>
          ⚠️ {dbError}
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.tm }}>
          <div style={{ fontSize:32, opacity:.4, marginBottom:10 }}>⏳</div>
          <div>Chargement…</div>
        </div>
      )}

      {/* Stats */}
      {!loading && allUnits.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:22 }}>
          {[
            { label:"Biens simples",    value:String(simples.length),                                                       color:C.tx },
            { label:"Immeubles",        value:`${immeubles.length} (${immeubles.flatMap(i=>i.lots).length} lots)`,           color:C.g  },
            { label:"Loyers HC / mois", value:euro(totalLoyer),                                                              color:C.g  },
            { label:"Cash-flow / mois", value:(totalCF>=0?"+":"")+euro(totalCF),                                            color:totalCF>=0?C.g:C.rd },
          ].map(s => (
            <div key={s.label} style={{ background:C.wh, borderRadius:12, padding:"14px 12px", border:`1px solid ${C.br}`, textAlign:"center" }}>
              <div style={{ fontSize:15, fontWeight:900, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:C.tm, marginTop:3, textTransform:"uppercase", letterSpacing:".05em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* État vide */}
      {!loading && allUnits.length === 0 && !dbError && (
        <div style={{ background:C.wh, borderRadius:16, padding:"60px 20px", textAlign:"center", border:`1px solid ${C.br}` }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🏡</div>
          <div style={{ fontWeight:700, fontSize:17, marginBottom:6 }}>Aucun bien enregistré</div>
          <div style={{ color:C.tm, fontSize:13, marginBottom:24 }}>Ajoutez un bien simple ou un immeuble multi-lots.</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => setShowAdd("simple")} style={{ background:C.wh, color:C.g, border:`1.5px solid ${C.g}`, borderRadius:10, padding:"11px 20px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>+ Bien simple</button>
            <button onClick={() => setShowAdd("immeuble")} style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"11px 20px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>+ Immeuble</button>
          </div>
        </div>
      )}

      {/* Liste */}
      {!loading && biens.map(b =>
        b.kind === "simple"
          ? <BienSimpleCard key={b.id} bien={b} onClick={() => setSelected({ kind:"simple", id:b.id })} />
          : <ImmeubleCard key={b.id} immeuble={b}
              onClick={() => setSelected({ kind:"immeuble", id:b.id })}
              onAddLot={() => setAddLotFor(b.id)}
              onClickLot={lot => setSelected({ kind:"lot", id:lot.id, immeuble_id:b.id })}
            />
      )}

      {/* Modals */}
      {showAdd === "simple"   && <AddBienSimpleModal onClose={() => setShowAdd(null)} onSave={handleAddSimple} />}
      {showAdd === "immeuble" && <AddImmeubleModal   onClose={() => setShowAdd(null)} onSave={handleAddImmeuble} />}
      {addLotFor && !selected && (() => {
        const imm = immeubles.find(b => b.id === addLotFor)
        return imm ? <AddLotModal immeuble={imm} onClose={() => setAddLotFor(null)} onSave={f => handleAddLot(addLotFor, f)} /> : null
      })()}
    </>
  )
}
