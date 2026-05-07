import { useState, useEffect, useMemo } from "react"
import { supabase } from "./supabase"
import { MODE_DETENTION_LABELS, REGIME_FISCAL_LABELS } from "./AddBienModal"

// ── Palette ────────────────────────────────────────────────
const C = {
  g:"#2d5b3d", gl:"#3d7a52", gp:"#e6efe9",
  cr:"#f7f4ee", cr2:"#eeebe3",
  tx:"#1a2a1f", tm:"#6b8c74",
  rd:"#c0392b", rp:"#fdecea",
  bl:"#2471a3", bp:"#eaf4fb",
  gd:"#b7860b", dp:"#fef9e7",
  or:"#ca6f1e", op:"#fdf2e9",
  wh:"#ffffff", br:"#dde8e0",
}

const euro = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
const pct  = (n: number) => `${n.toFixed(1)} %`

// ── Types ──────────────────────────────────────────────────

interface RawBien {
  id: string; nom: string; adresse: string | null; type: string; notes: string | null
}
interface RawLot {
  id: string; bien_id: string; nom: string
}
interface RawRecette {
  id: string; bien_id: string; lot_id: string | null
  type: string; montant: number; date_encaissement: string
}
interface RawDepense {
  id: string; bien_id: string; lot_id: string | null
  categorie: string; montant: number; date_depense: string; deductible: boolean
}
interface RawLocataire {
  id: string; bien_id: string; lot_id: string | null
  statut: string; date_sortie: string | null
}

interface Alert { label: string; days: number; urgent: boolean }

interface BienStat {
  id: string; nom: string; adresse: string | null; type: string
  modeDetention: string; regimeFiscal: string; valeurAchat: number
  nbLots: number
  revAnnuel: number; depAnnuel: number; depDeductibles: number
  capitalRembourse: number
  cashflow: number; cashflowMensuel: number; enrichissement: number
  rentaBrute: number; rentaNette: number
  lotsActifs: number; lotsTotal: number; tauxOccupation: number
  alerts: Alert[]
}

interface GlobalStat {
  nbBiens: number
  revAnnuel: number; depAnnuel: number
  cashflow: number; cashflowMensuel: number
  capitalRembourse: number; enrichissement: number
  rentaBrute: number
  tauxOccupation: number
  biens: BienStat[]
}

// ── Helpers ────────────────────────────────────────────────

function parseMeta(notes: string | null): Record<string, string> {
  try { return JSON.parse(notes ?? "{}") } catch { return {} }
}

function moisEcoules(year: number): number {
  const now = new Date()
  return year === now.getFullYear() ? now.getMonth() + 1 : 12
}

function daysUntil(dateStr: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const d   = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / 86_400_000)
}

// ── Sous-composants ────────────────────────────────────────

function KpiCard({ label, value, sub, color = C.tx, bg = C.wh }: {
  label: string; value: string; sub?: string; color?: string; bg?: string
}) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "14px 12px", border: bg === C.wh ? `1px solid ${C.br}` : "none", textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.tm, marginTop: 4, textTransform: "uppercase", letterSpacing: ".05em", lineHeight: 1.3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: C.tm, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: C.cr, borderRadius: 9, padding: "9px 10px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.tm, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3, lineHeight: 1.2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 900, color: color ?? C.tx, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

function OccupationBar({ actifs, total }: { actifs: number; total: number }) {
  if (total === 0) return null
  const pct = Math.round(actifs / total * 100)
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.tm, marginBottom: 3 }}>
        <span>Taux d'occupation</span>
        <span style={{ fontWeight: 700, color: pct >= 80 ? C.g : pct >= 50 ? C.gd : C.rd }}>{pct} %</span>
      </div>
      <div style={{ height: 5, background: C.cr2, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 80 ? C.g : pct >= 50 ? C.gd : C.rd, borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 10, color: C.tm, marginTop: 3 }}>{actifs}/{total} lot{total > 1 ? "s" : ""} occupé{actifs > 1 ? "s" : ""}</div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────

export default function DashboardPage({ an, onGoBiens }: { an: number; onGoBiens: () => void }) {
  const [stats,   setStats]   = useState<GlobalStat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [an])

  async function load() {
    setLoading(true)
    const [bienRes, lotRes, recRes, depRes, locRes] = await Promise.all([
      supabase.from("biens").select("id, nom, adresse, type, notes").order("nom"),
      supabase.from("lots").select("id, bien_id, nom"),
      supabase.from("recettes")
        .select("id, bien_id, lot_id, type, montant, date_encaissement")
        .gte("date_encaissement", `${an}-01-01`)
        .lte("date_encaissement", `${an}-12-31`),
      supabase.from("depenses")
        .select("id, bien_id, lot_id, categorie, montant, date_depense, deductible")
        .gte("date_depense", `${an}-01-01`)
        .lte("date_depense", `${an}-12-31`),
      supabase.from("locataires").select("id, bien_id, lot_id, statut, date_sortie"),
    ])

    const rawBiens = (bienRes.data ?? []) as RawBien[]
    const rawLots  = (lotRes.data  ?? []) as RawLot[]
    const rawRec   = (recRes.data  ?? []) as RawRecette[]
    const rawDep   = (depRes.data  ?? []) as RawDepense[]
    const rawLoc   = (locRes.data  ?? []) as RawLocataire[]

    const me = moisEcoules(an)

    // Index lots par bien
    const lotsByBien = new Map<string, RawLot[]>()
    for (const l of rawLots) {
      if (!lotsByBien.has(l.bien_id)) lotsByBien.set(l.bien_id, [])
      lotsByBien.get(l.bien_id)!.push(l)
    }

    // Alertes de bail (date_sortie dans les 90 prochains jours)
    const alertsByBien = new Map<string, Alert[]>()
    const now = new Date(); now.setHours(0, 0, 0, 0)
    for (const loc of rawLoc) {
      if (!loc.date_sortie || loc.statut === "parti") continue
      const days = daysUntil(loc.date_sortie)
      if (days >= 0 && days <= 90) {
        if (!alertsByBien.has(loc.bien_id)) alertsByBien.set(loc.bien_id, [])
        alertsByBien.get(loc.bien_id)!.push({ label: "Fin de bail", days, urgent: days <= 30 })
      }
    }

    // Calcul par bien
    const bienStats: BienStat[] = rawBiens.map(b => {
      const meta = parseMeta(b.notes)
      const valeurAchat = parseFloat(meta.valeurAchat ?? "0") || 0

      const lots  = lotsByBien.get(b.id) ?? []
      const nbLots = lots.length

      const bRec = rawRec.filter(r => r.bien_id === b.id)
      const bDep = rawDep.filter(d => d.bien_id === b.id)
      const bLoc = rawLoc.filter(l => l.bien_id === b.id)

      // Revenus (tout sauf dépôt de garantie pour le cash-flow)
      const revAnnuel = bRec
        .filter(r => r.type !== "depot_garantie")
        .reduce((s, r) => s + Number(r.montant), 0)

      // Dépenses totales
      const depAnnuel = bDep.reduce((s, d) => s + Number(d.montant), 0)

      // Dépenses déductibles (pour rentabilité nette)
      const depDeductibles = bDep
        .filter(d => d.deductible)
        .reduce((s, d) => s + Number(d.montant), 0)

      // Capital remboursé = catégorie "amortissement"
      const capitalRembourse = bDep
        .filter(d => d.categorie === "amortissement")
        .reduce((s, d) => s + Number(d.montant), 0)

      const cashflow        = revAnnuel - depAnnuel
      const cashflowMensuel = cashflow / me
      const enrichissement  = cashflow + capitalRembourse

      // Rentabilité
      const rentaBrute = valeurAchat > 0 ? (revAnnuel / me * 12) / valeurAchat * 100 : 0
      const rentaNette = valeurAchat > 0 ? ((revAnnuel - depDeductibles) / me * 12) / valeurAchat * 100 : 0

      // Taux d'occupation
      let lotsTotal  = nbLots > 0 ? nbLots : 1  // bien simple = 1 "lot" virtuel
      let lotsActifs = 0
      if (nbLots > 0) {
        // Immeuble : compte les lots avec locataire actif
        const lotsIds = new Set(lots.map(l => l.id))
        const locsActifs = bLoc.filter(l => l.lot_id && lotsIds.has(l.lot_id) && l.statut !== "parti")
        lotsActifs = new Set(locsActifs.map(l => l.lot_id)).size
      } else {
        // Bien simple : 1 si locataire actif
        lotsTotal = 1
        lotsActifs = bLoc.some(l => !l.lot_id && l.statut !== "parti") ? 1 : 0
      }
      const tauxOccupation = lotsTotal > 0 ? lotsActifs / lotsTotal * 100 : 0

      return {
        id: b.id, nom: b.nom, adresse: b.adresse, type: b.type,
        modeDetention: meta.mode_detention ?? "",
        regimeFiscal:  meta.regime_fiscal  ?? "",
        valeurAchat, nbLots,
        revAnnuel, depAnnuel, depDeductibles,
        capitalRembourse, cashflow, cashflowMensuel, enrichissement,
        rentaBrute, rentaNette,
        lotsActifs, lotsTotal, tauxOccupation,
        alerts: alertsByBien.get(b.id) ?? [],
      }
    })

    // Global
    const revAnnuelG      = bienStats.reduce((s, b) => s + b.revAnnuel, 0)
    const depAnnuelG      = bienStats.reduce((s, b) => s + b.depAnnuel, 0)
    const cashflowG       = revAnnuelG - depAnnuelG
    const capitalG        = bienStats.reduce((s, b) => s + b.capitalRembourse, 0)
    const enrichissementG = cashflowG + capitalG
    const valTotale       = bienStats.reduce((s, b) => s + b.valeurAchat, 0)
    const rentaBruteG     = valTotale > 0 ? (revAnnuelG / me * 12) / valTotale * 100 : 0
    const locsActifsG     = bienStats.reduce((s, b) => s + b.lotsActifs, 0)
    const lotsTotalG      = bienStats.reduce((s, b) => s + b.lotsTotal, 0)
    const tauxOccG        = lotsTotalG > 0 ? locsActifsG / lotsTotalG * 100 : 0

    setStats({
      nbBiens:        rawBiens.length,
      revAnnuel:      revAnnuelG,
      depAnnuel:      depAnnuelG,
      cashflow:       cashflowG,
      cashflowMensuel: cashflowG / me,
      capitalRembourse: capitalG,
      enrichissement: enrichissementG,
      rentaBrute:     rentaBruteG,
      tauxOccupation: tauxOccG,
      biens: bienStats,
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200, color:C.tm, fontSize:14 }}>
        Chargement…
      </div>
    )
  }

  if (!stats) return null

  const { biens } = stats
  const me = moisEcoules(an)

  return (
    <>
      {/* ── En-tête ───────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.tx, margin:0, lineHeight:1.2 }}>Tableau de bord</h1>
          <div style={{ fontSize:13, color:C.tm, marginTop:3 }}>
            {stats.nbBiens} bien{stats.nbBiens !== 1 ? "s" : ""} · {an}
            {me < 12 && <span style={{ color:C.gd }}> · {me} mois de données</span>}
          </div>
        </div>
      </div>

      {/* ── Synthèse globale ──────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg,${C.g},${C.gl})`, borderRadius:16, padding:"20px 18px", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:12 }}>
          Portefeuille — {an}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
          {[
            { label:"Biens",     value: stats.nbBiens.toString(),     color:"#fff"     },
            { label:"Revenus",   value: euro(stats.revAnnuel),        color:"#a8d5b5"  },
            { label:"Charges",   value: euro(stats.depAnnuel),        color:"#f5a89a"  },
            { label:"Cash-flow", value: euro(stats.cashflow),         color: stats.cashflow >= 0 ? "#a8d5b5" : "#f5a89a" },
          ].map(s => (
            <div key={s.label} style={{ textAlign:"center", padding:"8px 4px" }}>
              <div style={{ fontSize:18, fontWeight:900, color:s.color, lineHeight:1.1 }}>{s.value}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.55)", marginTop:3, textTransform:"uppercase", letterSpacing:".05em" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
          {[
            { label:"Moy. mensuel",  value: euro(stats.cashflowMensuel),  color: stats.cashflowMensuel >= 0 ? "#a8d5b5" : "#f5a89a" },
            { label:"Capital remb.", value: euro(stats.capitalRembourse),  color:"#a8d8f5" },
            { label:"Enrichissement",value: euro(stats.enrichissement),    color: stats.enrichissement >= 0 ? "#a8d5b5" : "#f5a89a" },
            { label:"Rent. brute",   value: stats.rentaBrute > 0 ? pct(stats.rentaBrute) : "—", color:"#f5d98a" },
          ].map(s => (
            <div key={s.label} style={{ textAlign:"center", padding:"8px 4px", background:"rgba(0,0,0,.12)", borderRadius:10 }}>
              <div style={{ fontSize:14, fontWeight:900, color:s.color, lineHeight:1.1 }}>{s.value}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.5)", marginTop:3, textTransform:"uppercase", letterSpacing:".04em", lineHeight:1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Taux d'occupation global ──────────────────────── */}
      {stats.lotsTotal > 1 && (
        <div style={{ background:C.wh, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.br}`, marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.tx }}>Taux d'occupation global</span>
            <span style={{ fontSize:16, fontWeight:900, color: stats.tauxOccupation >= 80 ? C.g : stats.tauxOccupation >= 50 ? C.gd : C.rd }}>
              {Math.round(stats.tauxOccupation)} %
            </span>
          </div>
          <div style={{ height:7, background:C.cr2, borderRadius:4, overflow:"hidden" }}>
            <div style={{ width:`${Math.round(stats.tauxOccupation)}%`, height:"100%", background: stats.tauxOccupation >= 80 ? C.g : stats.tauxOccupation >= 50 ? C.gd : C.rd, borderRadius:4, transition:"width .5s" }} />
          </div>
          <div style={{ fontSize:11, color:C.tm, marginTop:5 }}>
            {stats.locsActifs ?? biens.reduce((s, b) => s + b.lotsActifs, 0)}/{stats.lotsTotal} unité{stats.lotsTotal > 1 ? "s" : ""} occupée{stats.locsActifs !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* ── État vide ─────────────────────────────────────── */}
      {biens.length === 0 && (
        <div style={{ background:C.wh, borderRadius:14, padding:"56px 20px", textAlign:"center", border:`1px solid ${C.br}` }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🏡</div>
          <div style={{ fontWeight:700, fontSize:17, color:C.tx, marginBottom:6 }}>Aucun bien enregistré</div>
          <div style={{ color:C.tm, fontSize:13, marginBottom:20 }}>
            Ajoutez vos biens depuis la section <strong>Mes biens</strong>.
          </div>
          <button
            onClick={onGoBiens}
            style={{ background:C.g, color:"#fff", border:"none", borderRadius:10, padding:"11px 22px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}
          >
            → Aller à Mes biens
          </button>
        </div>
      )}

      {/* ── Cartes par bien ───────────────────────────────── */}
      {biens.map(b => {
        const isImm = b.nbLots > 0
        const cfColor = b.cashflowMensuel >= 0 ? C.g : C.rd
        return (
          <div
            key={b.id}
            style={{ background:C.wh, borderRadius:14, padding:"18px 20px", marginBottom:14, border:`1.5px solid ${C.br}`, boxShadow:"0 1px 10px rgba(45,91,61,.07)" }}
          >
            {/* En-tête bien */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:14 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:20 }}>{isImm ? "🏢" : "🏠"}</span>
                  <span style={{ fontWeight:800, fontSize:16, color:C.tx }}>{b.nom}</span>
                </div>
                {b.adresse && <div style={{ fontSize:12, color:C.tm, marginBottom:6 }}>📍 {b.adresse}</div>}
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  <span style={{ background:C.gp, color:C.g, fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20 }}>{b.type}</span>
                  {b.modeDetention && (
                    <span style={{ background:"#f0edf8", color:"#6c3fc7", fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20 }}>
                      {MODE_DETENTION_LABELS[b.modeDetention] ?? b.modeDetention}
                    </span>
                  )}
                  {b.regimeFiscal && (
                    <span style={{ background:C.bp, color:C.bl, fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20 }}>
                      {REGIME_FISCAL_LABELS[b.regimeFiscal] ?? b.regimeFiscal}
                    </span>
                  )}
                  {isImm && (
                    <span style={{ background:C.bp, color:C.bl, fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20 }}>
                      {b.nbLots} lot{b.nbLots > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              {/* Cash-flow mensuel — chiffre principal */}
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:10, color:C.tm, textTransform:"uppercase", letterSpacing:".06em", marginBottom:2 }}>Cash-flow / mois</div>
                <div style={{ fontSize:26, fontWeight:900, color:cfColor, lineHeight:1.1 }}>
                  {b.cashflowMensuel >= 0 ? "+" : ""}{euro(b.cashflowMensuel)}
                </div>
                <div style={{ fontSize:11, color:C.tm, marginTop:2 }}>moy. sur {me} mois</div>
              </div>
            </div>

            {/* Grille KPI */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:7, marginBottom:10 }}>
              <MiniStat label="Revenus annuels"      value={euro(b.revAnnuel)}                                              color={C.g}  />
              <MiniStat label="Dépenses annuelles"   value={euro(b.depAnnuel)}                                              color={C.rd} />
              <MiniStat label="Capital remboursé"    value={euro(b.capitalRembourse)}                                       color={C.bl} />
              <MiniStat label="Enrichissement"       value={(b.enrichissement >= 0 ? "+" : "") + euro(b.enrichissement)}   color={b.enrichissement >= 0 ? C.g : C.rd} />
            </div>

            {/* Rentabilité */}
            {b.valeurAchat > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:10 }}>
                <div style={{ background:C.dp, borderRadius:9, padding:"9px 10px" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.gd, textTransform:"uppercase", letterSpacing:".05em", marginBottom:3 }}>Rent. brute</div>
                  <div style={{ fontSize:16, fontWeight:900, color:C.gd }}>{pct(b.rentaBrute)}</div>
                  <div style={{ fontSize:10, color:C.tm }}>sur {euro(b.valeurAchat)}</div>
                </div>
                <div style={{ background:C.gp, borderRadius:9, padding:"9px 10px" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.gl, textTransform:"uppercase", letterSpacing:".05em", marginBottom:3 }}>Rent. nette</div>
                  <div style={{ fontSize:16, fontWeight:900, color:b.rentaNette >= 0 ? C.g : C.rd }}>{pct(b.rentaNette)}</div>
                  <div style={{ fontSize:10, color:C.tm }}>charges déductibles incluses</div>
                </div>
              </div>
            )}

            {/* Taux d'occupation */}
            {isImm && <OccupationBar actifs={b.lotsActifs} total={b.lotsTotal} />}
            {!isImm && b.lotsTotal === 1 && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background: b.lotsActifs > 0 ? C.g : C.cr2, border: `2px solid ${b.lotsActifs > 0 ? C.g : C.br}` }} />
                <span style={{ fontSize:11, color:C.tm }}>{b.lotsActifs > 0 ? "Locataire en place" : "Vacant"}</span>
              </div>
            )}

            {/* Alertes bail */}
            {b.alerts.length > 0 && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10, paddingTop:10, borderTop:`1px solid ${C.br}` }}>
                {b.alerts.map((a, i) => (
                  <span
                    key={i}
                    style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:10, background: a.urgent ? C.rp : C.dp, color: a.urgent ? C.rd : C.gd }}
                  >
                    ⚠️ {a.label} · J−{a.days}
                  </span>
                ))}
              </div>
            )}

            {/* Aucune donnée pour ce bien */}
            {b.revAnnuel === 0 && b.depAnnuel === 0 && (
              <div style={{ marginTop:10, padding:"8px 12px", background:C.cr2, borderRadius:8, fontSize:12, color:C.tm, textAlign:"center" }}>
                Aucune recette ni dépense enregistrée pour {an}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
