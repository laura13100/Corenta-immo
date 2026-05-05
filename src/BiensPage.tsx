import { useState } from "react"

// ── Palette (identique à App.tsx) ─────────────────────────
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

// ── Types ──────────────────────────────────────────────────
type TypeBien = "appartement" | "maison" | "garage" | "local" | "autre"
type Statut   = "loue" | "vacant"
type Regime   = "micro-foncier" | "reel" | "LMNP-micro" | "LMNP-reel"

interface Bien {
  id: string
  nom: string
  adresse: string
  type: TypeBien
  regime: Regime
  statut: Statut
  locataire?: string
  loyer_hc: number
  charges: number
  depenses: number
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

// ── Données fictives ───────────────────────────────────────
const MOCK_BIENS: Bien[] = [
  {
    id: "b1",
    nom: "Appartement Gambetta",
    adresse: "12 rue Gambetta, 69003 Lyon",
    type: "appartement",
    regime: "LMNP-micro",
    statut: "loue",
    locataire: "Sophie Martin",
    loyer_hc: 850,
    charges: 80,
    depenses: 420,
  },
  {
    id: "b2",
    nom: "Studio Confluence",
    adresse: "8 avenue du Confluent, 69002 Lyon",
    type: "appartement",
    regime: "micro-foncier",
    statut: "loue",
    locataire: "Thomas Durand",
    loyer_hc: 620,
    charges: 50,
    depenses: 280,
  },
  {
    id: "b3",
    nom: "Garage Bellecour",
    adresse: "5 place Bellecour, 69002 Lyon",
    type: "garage",
    regime: "micro-foncier",
    statut: "loue",
    locataire: "Marie Blanc",
    loyer_hc: 120,
    charges: 0,
    depenses: 15,
  },
  {
    id: "b4",
    nom: "T2 Croix-Rousse",
    adresse: "34 montée de la Boucle, 69004 Lyon",
    type: "appartement",
    regime: "reel",
    statut: "vacant",
    loyer_hc: 780,
    charges: 70,
    depenses: 350,
  },
]

// ── Primitives UI ──────────────────────────────────────────

function Badge({
  label,
  bg = C.gp,
  color = C.g,
}: {
  label: string
  bg?: string
  color?: string
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  )
}

function FieldInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          color: C.gl,
          textTransform: "uppercase",
          letterSpacing: ".05em",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        style={{
          width: "100%",
          padding: "9px 11px",
          border: `1.5px solid ${C.br}`,
          borderRadius: 8,
          fontSize: 14,
          fontFamily: "inherit",
          color: C.tx,
          background: C.cr,
          outline: "none",
          boxSizing: "border-box",
        }}
        {...props}
      />
    </div>
  )
}

function FieldSelect({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          color: C.gl,
          textTransform: "uppercase",
          letterSpacing: ".05em",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <select
        style={{
          width: "100%",
          padding: "9px 11px",
          border: `1.5px solid ${C.br}`,
          borderRadius: 8,
          fontSize: 14,
          fontFamily: "inherit",
          color: C.tx,
          background: C.cr,
          outline: "none",
          boxSizing: "border-box",
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

function InfoRow({
  label,
  value,
  bold = false,
  color,
}: {
  label: string
  value: string
  bold?: boolean
  color?: string
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: `1px solid ${C.br}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: C.tm }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: color ?? C.tx }}>
        {value}
      </span>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.gl,
        textTransform: "uppercase",
        letterSpacing: ".07em",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  )
}

// ── Carte bien (vue liste) ─────────────────────────────────

function BienCard({ bien, onClick }: { bien: Bien; onClick: () => void }) {
  const cashflow = bien.loyer_hc + bien.charges - bien.depenses
  const loue     = bien.statut === "loue"

  return (
    <div
      onClick={onClick}
      style={{
        background: C.wh,
        borderRadius: 14,
        padding: "18px 20px",
        marginBottom: 12,
        boxShadow: "0 1px 10px rgba(45,91,61,.07)",
        border: `1.5px solid ${C.br}`,
        cursor: "pointer",
        transition: "all .18s",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform   = "translateY(-2px)"
        el.style.boxShadow   = "0 4px 20px rgba(45,91,61,.14)"
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform  = ""
        el.style.boxShadow  = "0 1px 10px rgba(45,91,61,.07)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>

        {/* Colonne gauche */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>{TYPE_EMOJI[bien.type]}</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: C.tx }}>{bien.nom}</span>
          </div>
          <div style={{ fontSize: 12, color: C.tm, marginBottom: 8 }}>
            📍 {bien.adresse}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Badge label={TYPE_LABELS[bien.type]} />
            <Badge
              label={loue ? "Loué" : "Vacant"}
              bg={loue ? C.gp : C.rp}
              color={loue ? C.g : C.rd}
            />
            <Badge label={REGIME_LABELS[bien.regime]} bg={C.bp} color={C.bl} />
          </div>
          {loue && bien.locataire && (
            <div style={{ fontSize: 12, color: C.tm, marginTop: 8 }}>
              👤 {bien.locataire}
            </div>
          )}
        </div>

        {/* Colonne droite — chiffres clés */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: C.tm, textTransform: "uppercase", marginBottom: 2 }}>
            Cash-flow / mois
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: cashflow >= 0 ? C.g : C.rd,
              lineHeight: 1.1,
            }}
          >
            {cashflow >= 0 ? "+" : ""}{euro(cashflow)}
          </div>
          <div style={{ fontSize: 11, color: C.tm, marginTop: 6 }}>
            Loyer {euro(bien.loyer_hc)} HC
          </div>
          <div style={{ fontSize: 11, color: C.tm }}>
            Charges {euro(bien.charges)} / mois
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Fiche détail d'un bien ─────────────────────────────────

type TabKey = "infos" | "recettes" | "depenses" | "documents"

function BienDetail({ bien, onBack }: { bien: Bien; onBack: () => void }) {
  const [tab, setTab] = useState<TabKey>("infos")
  const cashflow = bien.loyer_hc + bien.charges - bien.depenses
  const loue     = bien.statut === "loue"

  const tabs: { key: TabKey; label: string }[] = [
    { key: "infos",      label: "📋 Infos" },
    { key: "recettes",   label: "💰 Recettes" },
    { key: "depenses",   label: "📉 Dépenses" },
    { key: "documents",  label: "📎 Documents" },
  ]

  return (
    <div>
      {/* Retour */}
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: C.g,
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          marginBottom: 16,
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        ← Retour à la liste
      </button>

      {/* Header bien */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.g}, ${C.gl})`,
          borderRadius: 16,
          padding: "20px 22px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
              {TYPE_EMOJI[bien.type]} {bien.nom}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginBottom: 12 }}>
              📍 {bien.adresse}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Badge label={TYPE_LABELS[bien.type]}    bg="rgba(255,255,255,.2)"  color="#fff" />
              <Badge
                label={loue ? "Loué" : "Vacant"}
                bg={loue ? "rgba(168,213,181,.35)" : "rgba(192,57,43,.35)"}
                color={loue ? "#a8d5b5" : "#f5a89a"}
              />
              <Badge label={REGIME_LABELS[bien.regime]} bg="rgba(255,255,255,.15)" color="rgba(255,255,255,.9)" />
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", textTransform: "uppercase", marginBottom: 2 }}>
              Cash-flow / mois
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: cashflow >= 0 ? "#a8d5b5" : "#f5a89a",
                lineHeight: 1.1,
              }}
            >
              {cashflow >= 0 ? "+" : ""}{euro(cashflow)}
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "7px 14px",
              borderRadius: 9,
              border: `1.5px solid ${tab === t.key ? C.g : C.br}`,
              background: tab === t.key ? C.g : C.wh,
              color: tab === t.key ? "#fff" : C.tx,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu onglet Infos */}
      {tab === "infos" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

          {/* Locataire */}
          <div
            style={{
              background: C.wh,
              borderRadius: 14,
              padding: "18px 20px",
              border: `1px solid ${C.br}`,
            }}
          >
            <SectionTitle>Locataire</SectionTitle>
            {loue && bien.locataire ? (
              <>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>
                  👤 {bien.locataire}
                </div>
                <Badge label="Bail en cours" bg={C.gp} color={C.g} />
              </>
            ) : (
              <div style={{ color: C.rd, fontWeight: 700, fontSize: 14 }}>
                🔴 Bien vacant
              </div>
            )}
          </div>

          {/* Finances */}
          <div
            style={{
              background: C.wh,
              borderRadius: 14,
              padding: "18px 20px",
              border: `1px solid ${C.br}`,
            }}
          >
            <SectionTitle>Finances / mois</SectionTitle>
            <InfoRow label="Loyer HC"    value={euro(bien.loyer_hc)} />
            <InfoRow label="Charges"     value={euro(bien.charges)} />
            <InfoRow label="Dépenses"    value={euro(bien.depenses)} />
            <InfoRow
              label="Cash-flow"
              value={(cashflow >= 0 ? "+" : "") + euro(cashflow)}
              bold
              color={cashflow >= 0 ? C.g : C.rd}
            />
          </div>

          {/* Infos générales — pleine largeur */}
          <div
            style={{
              background: C.wh,
              borderRadius: 14,
              padding: "18px 20px",
              border: `1px solid ${C.br}`,
              gridColumn: "1 / -1",
            }}
          >
            <SectionTitle>Informations</SectionTitle>
            <InfoRow label="Type de bien"   value={TYPE_LABELS[bien.type]} />
            <InfoRow label="Régime fiscal"  value={REGIME_LABELS[bien.regime]} />
            <InfoRow label="Loyer annuel"   value={euro(bien.loyer_hc * 12)} />
            <InfoRow label="Charges annuelles" value={euro(bien.charges * 12)} />
            <InfoRow
              label="Résultat annuel estimé"
              value={(cashflow * 12 >= 0 ? "+" : "") + euro(cashflow * 12)}
              bold
              color={cashflow >= 0 ? C.g : C.rd}
            />
          </div>

        </div>
      )}

      {/* Onglets à venir */}
      {tab !== "infos" && (
        <div
          style={{
            background: C.wh,
            borderRadius: 14,
            padding: "56px 20px",
            border: `1px solid ${C.br}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {tab === "recettes" ? "💰" : tab === "depenses" ? "📉" : "📎"}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.tx, marginBottom: 6 }}>
            {tab === "recettes"
              ? "Recettes"
              : tab === "depenses"
              ? "Dépenses"
              : "Documents"}
          </div>
          <div style={{ color: C.tm, fontSize: 13 }}>
            Cette section sera disponible à la prochaine étape.
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal ajout d'un bien ──────────────────────────────────

interface FormState {
  nom: string
  adresse: string
  type: TypeBien
  regime: Regime
  locataire: string
  loyer_hc: string
  charges: string
  depenses: string
}

const EMPTY_FORM: FormState = {
  nom: "",
  adresse: "",
  type: "appartement",
  regime: "micro-foncier",
  locataire: "",
  loyer_hc: "",
  charges: "",
  depenses: "",
}

function AddBienModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (b: Bien) => void
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  const cashflowPreview =
    (parseFloat(form.loyer_hc) || 0) +
    (parseFloat(form.charges) || 0) -
    (parseFloat(form.depenses) || 0)

  const handleSave = () => {
    if (!form.nom.trim()) return
    onSave({
      id: Date.now().toString(),
      nom: form.nom.trim(),
      adresse: form.adresse.trim(),
      type: form.type,
      regime: form.regime,
      statut: form.locataire.trim() ? "loue" : "vacant",
      locataire: form.locataire.trim() || undefined,
      loyer_hc: parseFloat(form.loyer_hc) || 0,
      charges:  parseFloat(form.charges)  || 0,
      depenses: parseFloat(form.depenses) || 0,
    })
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        zIndex: 900,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.wh,
          borderRadius: "18px 18px 0 0",
          padding: "24px 20px 36px",
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* En-tête */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 17, color: C.g }}>
            Nouveau bien
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: C.tm,
            }}
          >
            ✕
          </button>
        </div>

        {/* Champs */}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldSelect label="Type de bien" value={form.type} onChange={set("type")}>
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
            <option value="garage">Garage / Cave</option>
            <option value="local">Local commercial</option>
            <option value="autre">Autre</option>
          </FieldSelect>
          <FieldSelect label="Régime fiscal" value={form.regime} onChange={set("regime")}>
            <option value="micro-foncier">Micro-foncier</option>
            <option value="reel">Réel</option>
            <option value="LMNP-micro">LMNP Micro-BIC</option>
            <option value="LMNP-reel">LMNP Réel</option>
          </FieldSelect>
        </div>

        <FieldInput
          label="Locataire actuel"
          placeholder="Nom du locataire (vide = vacant)"
          value={form.locataire}
          onChange={set("locataire")}
        />

        {/* Séparateur */}
        <div style={{ height: 1, background: C.br, margin: "4px 0 16px" }} />
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.gl,
            textTransform: "uppercase",
            letterSpacing: ".05em",
            marginBottom: 14,
          }}
        >
          Finances mensuelles
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <FieldInput
            label="Loyer HC (€)"
            type="number"
            placeholder="0"
            value={form.loyer_hc}
            onChange={set("loyer_hc")}
          />
          <FieldInput
            label="Charges (€)"
            type="number"
            placeholder="0"
            value={form.charges}
            onChange={set("charges")}
          />
          <FieldInput
            label="Dépenses (€)"
            type="number"
            placeholder="0"
            value={form.depenses}
            onChange={set("depenses")}
          />
        </div>

        {/* Aperçu cash-flow (si au moins un champ rempli) */}
        {(form.loyer_hc || form.charges || form.depenses) && (
          <div
            style={{
              background: cashflowPreview >= 0 ? C.gp : C.rp,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: C.tm }}>Cash-flow estimé / mois</span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: cashflowPreview >= 0 ? C.g : C.rd,
              }}
            >
              {cashflowPreview >= 0 ? "+" : ""}
              {euro(cashflowPreview)}
            </span>
          </div>
        )}

        <button
          onClick={handleSave}
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 10,
            background: form.nom.trim() ? C.g : C.cr2,
            color: form.nom.trim() ? "#fff" : C.tm,
            border: "none",
            fontWeight: 800,
            fontSize: 15,
            cursor: form.nom.trim() ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            transition: "background .15s",
          }}
        >
          Enregistrer le bien
        </button>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────

export default function BiensPage() {
  const [biens, setBiens]     = useState<Bien[]>(MOCK_BIENS)
  const [selected, setSelected] = useState<Bien | null>(null)
  const [showAdd, setShowAdd]   = useState(false)

  // Totaux
  const nbLoues        = biens.filter(b => b.statut === "loue").length
  const totalLoyer     = biens.reduce((s, b) => s + b.loyer_hc, 0)
  const totalCharges   = biens.reduce((s, b) => s + b.charges, 0)
  const totalCashflow  = biens.reduce(
    (s, b) => s + b.loyer_hc + b.charges - b.depenses,
    0
  )

  // Vue détail
  if (selected) {
    return (
      <BienDetail
        bien={selected}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <>
      {/* En-tête */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: C.tx,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Mes biens
          </h1>
          <div style={{ fontSize: 13, color: C.tm, marginTop: 3 }}>
            {biens.length} bien{biens.length !== 1 ? "s" : ""} ·{" "}
            {nbLoues} loué{nbLoues !== 1 ? "s" : ""}
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            background: C.g,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + Ajouter un bien
        </button>
      </div>

      {/* Barre de stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 22,
        }}
      >
        {[
          { label: "Biens",            value: biens.length.toString(),                         color: C.tx },
          { label: "Loués",            value: `${nbLoues} / ${biens.length}`,                  color: C.g  },
          { label: "Loyers HC / mois", value: euro(totalLoyer),                                color: C.g  },
          {
            label: "Cash-flow / mois",
            value: (totalCashflow >= 0 ? "+" : "") + euro(totalCashflow),
            color: totalCashflow >= 0 ? C.g : C.rd,
          },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: C.wh,
              borderRadius: 12,
              padding: "14px 12px",
              border: `1px solid ${C.br}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 900, color: s.color }}>
              {s.value}
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.tm,
                marginTop: 3,
                textTransform: "uppercase",
                letterSpacing: ".05em",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Liste ou état vide */}
      {biens.length === 0 ? (
        <div
          style={{
            background: C.wh,
            borderRadius: 16,
            padding: "60px 20px",
            textAlign: "center",
            border: `1px solid ${C.br}`,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
            Aucun bien enregistré
          </div>
          <div style={{ color: C.tm, fontSize: 13, marginBottom: 20 }}>
            Ajoutez votre premier bien immobilier.
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: C.g,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px 22px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            + Ajouter un bien
          </button>
        </div>
      ) : (
        biens.map(b => (
          <BienCard key={b.id} bien={b} onClick={() => setSelected(b)} />
        ))
      )}

      {/* Modal ajout */}
      {showAdd && (
        <AddBienModal
          onClose={() => setShowAdd(false)}
          onSave={bien => setBiens(prev => [...prev, bien])}
        />
      )}
    </>
  )
}
