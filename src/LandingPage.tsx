import { useState } from "react"

const C = {
  g:  "#2d5b3d", gl: "#3d7a52", gp: "#e6efe9",
  cr: "#f7f4ee", cr2: "#eeebe3",
  tx: "#1a2a1f", tm: "#6b8c74",
  wh: "#ffffff", br: "#dde8e0",
  gd: "#b7860b",
}

const SERVICES = [
  {
    icon: "🏡",
    titre: "Conciergerie Locale",
    desc: "Accueil des voyageurs, remise des clés, état des lieux, ménage et linge — nous gérons chaque séjour comme si c'était le nôtre.",
    points: ["Accueil & départ personnalisés", "Ménage & linge hôtelier", "État des lieux entrée/sortie"],
  },
  {
    icon: "💻",
    titre: "Conciergerie Digitale",
    desc: "Gestion en ligne de vos annonces, optimisation tarifaire et communication avec les voyageurs 7j/7 pour maximiser votre taux d'occupation.",
    points: ["Création & optimisation d'annonces", "Gestion des calendriers", "Communication voyageurs 24/7"],
  },
  {
    icon: "🔑",
    titre: "Sous-location",
    desc: "Nous prenons en charge votre bien en sous-location : garantie de loyer mensuel fixe, zéro vacance locative et aucune gestion à votre charge.",
    points: ["Loyer garanti chaque mois", "Aucune vacance locative", "Remise en état incluse"],
  },
]

const BIENS = [
  { icon: "🏙", type: "Appartement", ville: "Lyon Centre", surface: "42 m²", dispo: "Disponible" },
  { icon: "🏘", type: "Studio", ville: "Villeurbanne", surface: "28 m²", dispo: "En gestion" },
  { icon: "🏠", type: "Maison", ville: "Bron", surface: "85 m²", dispo: "En gestion" },
]

const FAQ = [
  {
    q: "Comment fonctionne la sous-location ?",
    r: "Vous nous confiez votre bien, nous le gérons en sous-location. Vous recevez un loyer mensuel fixe, garanti et versé à date fixe, sans vous préoccuper de rien.",
  },
  {
    q: "Quels types de biens acceptez-vous ?",
    r: "Appartements, studios, maisons, lofts — du moment que le bien est propre et conforme à la réglementation de location courte durée ou longue durée.",
  },
  {
    q: "Quelle est votre zone géographique ?",
    r: "Nous opérons principalement sur la métropole de Lyon et ses communes environnantes. Contactez-nous pour toute demande hors zone.",
  },
  {
    q: "Comment démarrer avec Corenta ?",
    r: "C'est simple : envoyez-nous un message, nous organisons une visite du bien et vous recevez une proposition sous 48h.",
  },
]

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({ nom: "", email: "", tel: "", message: "" })
  const [sent, setSent] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div style={{ fontFamily: "'Figtree',sans-serif", background: C.wh, color: C.tx, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        a{text-decoration:none;color:inherit}
        button{cursor:pointer;font-family:inherit}
        .btn-primary{
          background:${C.g};color:#fff;border:none;
          padding:13px 28px;border-radius:10px;font-weight:700;font-size:15px;
          transition:background .2s,transform .1s;
        }
        .btn-primary:hover{background:${C.gl};transform:translateY(-1px)}
        .btn-outline{
          background:transparent;color:${C.g};
          border:2px solid ${C.g};
          padding:11px 24px;border-radius:10px;font-weight:700;font-size:14px;
          transition:all .2s;
        }
        .btn-outline:hover{background:${C.gp}}
        .btn-white{
          background:#fff;color:${C.g};border:none;
          padding:13px 28px;border-radius:10px;font-weight:700;font-size:15px;
          transition:transform .15s,box-shadow .15s;
          box-shadow:0 2px 12px rgba(0,0,0,.12);
        }
        .btn-white:hover{transform:translateY(-1px);box-shadow:0 4px 18px rgba(0,0,0,.16)}
        .card{
          background:#fff;border-radius:16px;
          border:1px solid ${C.br};
          box-shadow:0 2px 16px rgba(45,91,61,.06);
          transition:transform .2s,box-shadow .2s;
        }
        .card:hover{transform:translateY(-3px);box-shadow:0 6px 28px rgba(45,91,61,.13)}
        input,textarea,select{
          width:100%;padding:12px 14px;border-radius:10px;
          border:1.5px solid ${C.br};font-size:14px;font-family:inherit;
          background:${C.cr};color:${C.tx};outline:none;
          transition:border-color .2s,box-shadow .2s;
        }
        input:focus,textarea:focus{border-color:${C.g};box-shadow:0 0 0 3px ${C.gp}}
        @media(max-width:768px){
          .hero-btns{flex-direction:column!important}
          .services-grid{grid-template-columns:1fr!important}
          .biens-grid{grid-template-columns:1fr!important}
          .contact-grid{grid-template-columns:1fr!important}
          .nav-links{display:none!important}
          .hero-title{font-size:36px!important}
        }
      `}</style>

      {/* ── NAVIGATION ─────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,.95)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.br}`,
        padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ cursor: "pointer" }} onClick={() => scrollTo("hero")}>
          <span style={{ fontSize: 22, fontWeight: 900, color: C.g, letterSpacing: "-0.5px" }}>
            <span style={{ fontWeight: 300 }}>Co</span>renta
          </span>
          <span style={{ fontSize: 11, color: C.tm, fontWeight: 500, marginLeft: 6 }}>Conciergerie & Location</span>
        </div>

        <div className="nav-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[["services", "Services"], ["biens", "Nos biens"], ["faq", "FAQ"], ["contact", "Contact"]].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", color: C.tm, fontSize: 14, fontWeight: 600,
              padding: "4px 0", cursor: "pointer", transition: "color .2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = C.g)}
              onMouseLeave={e => (e.currentTarget.style.color = C.tm)}
            >
              {label}
            </button>
          ))}
          <button className="btn-outline" onClick={onLogin} style={{ fontSize: 13, padding: "8px 18px" }}>
            Espace propriétaire
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section id="hero" style={{
        background: `linear-gradient(135deg, ${C.g} 0%, #1e3d2a 60%, #162e1f 100%)`,
        padding: "90px 32px 100px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: .06,
          backgroundImage: `radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px),
                            radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative", textAlign: "center" }}>
          <div style={{
            display: "inline-block", background: "rgba(255,255,255,.12)",
            border: "1px solid rgba(255,255,255,.2)",
            borderRadius: 100, padding: "6px 18px", marginBottom: 28,
            fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.85)",
          }}>
            Conciergerie · Sous-location · Gestion locative
          </div>
          <h1 className="hero-title" style={{
            fontSize: 52, fontWeight: 900, color: "#fff",
            lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 20,
          }}>
            Votre bien,<br />
            <span style={{ color: "#a8d4b8" }}>géré comme il mérite</span>
          </h1>
          <p style={{
            fontSize: 17, color: "rgba(255,255,255,.7)", lineHeight: 1.7,
            maxWidth: 520, margin: "0 auto 40px",
          }}>
            Corenta prend en charge votre logement de A à Z — conciergerie locale, gestion digitale ou sous-location garantie. Vous encaissez, nous gérons.
          </p>
          <div className="hero-btns" style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
            <button className="btn-white" onClick={() => scrollTo("contact")}>
              Obtenir un devis gratuit
            </button>
            <button onClick={() => scrollTo("services")} style={{
              background: "transparent", border: "2px solid rgba(255,255,255,.4)",
              color: "rgba(255,255,255,.85)", borderRadius: 10,
              padding: "13px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer",
              transition: "all .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.1)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
            >
              Nos services →
            </button>
          </div>

          <div style={{
            marginTop: 60, display: "flex", justifyContent: "center", gap: 48,
            flexWrap: "wrap",
          }}>
            {[["100%", "Taux de satisfaction"], ["48h", "Délai de réponse"], ["0€", "Frais cachés"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#a8d4b8" }}>{val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", fontWeight: 500, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────── */}
      <section id="services" style={{ padding: "80px 32px", background: C.cr }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: C.gl, textTransform: "uppercase", marginBottom: 10 }}>
              Ce que nous faisons
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: C.g, letterSpacing: "-0.8px", marginBottom: 12 }}>
              Nos services
            </h2>
            <p style={{ color: C.tm, fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Trois formules pour répondre à tous les profils de propriétaires.
            </p>
          </div>

          <div className="services-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {SERVICES.map((s) => (
              <div key={s.titre} className="card" style={{ padding: "30px 26px" }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{s.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: C.g, marginBottom: 10 }}>{s.titre}</h3>
                <p style={{ fontSize: 14, color: C.tm, lineHeight: 1.65, marginBottom: 18 }}>{s.desc}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                  {s.points.map(p => (
                    <li key={p} style={{ fontSize: 13, color: C.tx, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: C.g, fontWeight: 800, marginTop: 1 }}>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BIENS ──────────────────────────────────────────── */}
      <section id="biens" style={{ padding: "80px 32px", background: C.wh }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: C.gl, textTransform: "uppercase", marginBottom: 10 }}>
              Notre portefeuille
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: C.g, letterSpacing: "-0.8px", marginBottom: 12 }}>
              Biens en gestion
            </h2>
            <p style={{ color: C.tm, fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Des logements sélectionnés, entretenus et optimisés pour des séjours parfaits.
            </p>
          </div>

          <div className="biens-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, marginBottom: 36 }}>
            {BIENS.map((b) => (
              <div key={b.ville + b.type} className="card" style={{ overflow: "hidden" }}>
                <div style={{
                  height: 140, background: `linear-gradient(135deg, ${C.gp} 0%, ${C.cr2} 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52,
                }} />
                <div style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: C.tx }}>{b.type}</div>
                      <div style={{ fontSize: 13, color: C.tm, marginTop: 2 }}>📍 {b.ville}</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                      background: b.dispo === "Disponible" ? C.gp : C.cr2,
                      color: b.dispo === "Disponible" ? C.g : C.tm,
                    }}>
                      {b.dispo}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: C.tm, marginTop: 8, fontWeight: 600 }}>
                    📐 {b.surface}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <button className="btn-primary" onClick={onLogin}>
              Voir tous les biens →
            </button>
          </div>
        </div>
      </section>

      {/* ── POURQUOI CORENTA ───────────────────────────────── */}
      <section style={{
        padding: "80px 32px",
        background: `linear-gradient(135deg, ${C.g} 0%, #1e3d2a 100%)`,
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: "-0.8px", marginBottom: 14 }}>
            Pourquoi choisir Corenta ?
          </h2>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: 16, maxWidth: 500, margin: "0 auto 52px" }}>
            Une équipe de proximité, des outils digitaux performants, et une seule obsession : la rentabilité de votre bien.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24 }}>
            {[
              { icon: "🤝", titre: "Relation de confiance", desc: "Transparence totale sur les revenus et dépenses de votre bien." },
              { icon: "📊", titre: "Reporting mensuel", desc: "Bilan complet chaque mois : encaissements, charges, taux d'occupation." },
              { icon: "⚡", titre: "Réactivité", desc: "Interventions rapides, disponibilité 7j/7 pour vous et vos locataires." },
              { icon: "🔒", titre: "Loyer garanti", desc: "En sous-location : versement fixe et ponctuel, quoi qu'il arrive." },
            ].map(item => (
              <div key={item.titre} style={{
                background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 14, padding: "24px 20px", textAlign: "left",
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontWeight: 800, color: "#fff", fontSize: 15, marginBottom: 7 }}>{item.titre}</div>
                <div style={{ color: "rgba(255,255,255,.55)", fontSize: 13, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: "80px 32px", background: C.cr }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: C.gl, textTransform: "uppercase", marginBottom: 10 }}>
              Questions fréquentes
            </div>
            <h2 style={{ fontSize: 34, fontWeight: 900, color: C.g, letterSpacing: "-0.8px" }}>
              Vous avez des questions ?
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQ.map((item, i) => (
              <div key={i} className="card" style={{ overflow: "hidden" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", background: "none", border: "none",
                    padding: "18px 22px", display: "flex", justifyContent: "space-between",
                    alignItems: "center", gap: 16, textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 15, color: C.tx }}>{item.q}</span>
                  <span style={{
                    fontSize: 18, color: C.g, fontWeight: 700, flexShrink: 0,
                    transform: openFaq === i ? "rotate(45deg)" : "none",
                    transition: "transform .2s",
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 22px 18px", fontSize: 14, color: C.tm, lineHeight: 1.7 }}>
                    {item.r}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────── */}
      <section id="contact" style={{ padding: "80px 32px", background: C.wh }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: C.gl, textTransform: "uppercase", marginBottom: 10 }}>
              Parlons de votre projet
            </div>
            <h2 style={{ fontSize: 34, fontWeight: 900, color: C.g, letterSpacing: "-0.8px", marginBottom: 12 }}>
              Contactez-nous
            </h2>
            <p style={{ color: C.tm, fontSize: 16 }}>
              Réponse garantie sous 48h.
            </p>
          </div>

          <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.g, marginBottom: 4 }}>Email</div>
                <div style={{ fontSize: 15, color: C.tx }}>contact@corenta.fr</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.g, marginBottom: 4 }}>Téléphone</div>
                <div style={{ fontSize: 15, color: C.tx }}>+33 6 XX XX XX XX</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.g, marginBottom: 4 }}>Zone d'intervention</div>
                <div style={{ fontSize: 15, color: C.tx }}>Métropole de Lyon & alentours</div>
              </div>
              <div style={{
                background: C.gp, borderRadius: 12, padding: "20px 22px",
                border: `1px solid ${C.br}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.g, marginBottom: 6 }}>🕐 Disponibilité</div>
                <div style={{ fontSize: 13, color: C.tm, lineHeight: 1.6 }}>
                  Lun–Ven : 9h–19h<br />
                  Sam : 10h–17h<br />
                  Urgences 7j/7
                </div>
              </div>
            </div>

            {sent ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", textAlign: "center", padding: "40px",
                background: C.gp, borderRadius: 16, border: `1px solid ${C.br}`,
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: C.g, marginBottom: 8 }}>
                  Message envoyé !
                </div>
                <div style={{ color: C.tm, fontSize: 14 }}>
                  Nous vous répondons dans les 48h.
                </div>
              </div>
            ) : (
              <form onSubmit={handleContact} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.tm, display: "block", marginBottom: 6 }}>Nom *</label>
                    <input
                      required
                      placeholder="Votre nom"
                      value={contactForm.nom}
                      onChange={e => setContactForm(p => ({ ...p, nom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.tm, display: "block", marginBottom: 6 }}>Email *</label>
                    <input
                      required type="email"
                      placeholder="votre@email.fr"
                      value={contactForm.email}
                      onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.tm, display: "block", marginBottom: 6 }}>Téléphone</label>
                  <input
                    placeholder="+33 6 XX XX XX XX"
                    value={contactForm.tel}
                    onChange={e => setContactForm(p => ({ ...p, tel: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.tm, display: "block", marginBottom: 6 }}>Votre projet *</label>
                  <textarea
                    required rows={4}
                    placeholder="Décrivez votre bien et vos besoins…"
                    value={contactForm.message}
                    onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                    style={{ resize: "vertical" }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: 4 }}>
                  Envoyer ma demande →
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{
        background: C.tx, color: "rgba(255,255,255,.5)",
        padding: "36px 32px", textAlign: "center",
      }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: "#fff", letterSpacing: "-0.5px", marginBottom: 6 }}>
          <span style={{ fontWeight: 300 }}>Co</span>renta
        </div>
        <div style={{ fontSize: 12, marginBottom: 20 }}>Conciergerie & Location — Métropole de Lyon</div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          {[["services", "Services"], ["biens", "Nos biens"], ["faq", "FAQ"], ["contact", "Contact"]].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", color: "rgba(255,255,255,.45)",
              fontSize: 13, cursor: "pointer", transition: "color .2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.45)")}
            >
              {label}
            </button>
          ))}
          <button onClick={onLogin} style={{
            background: "none", border: "none", color: "rgba(255,255,255,.45)",
            fontSize: 13, cursor: "pointer", transition: "color .2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.45)")}
          >
            Espace propriétaire
          </button>
        </div>
        <div style={{ fontSize: 11, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 16 }}>
          © {new Date().getFullYear()} Corenta — Tous droits réservés
        </div>
      </footer>
    </div>
  )
}
