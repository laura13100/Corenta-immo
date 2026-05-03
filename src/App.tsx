import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
  }, [])

  async function login() {
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError('Email ou mot de passe incorrect')
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  if (loading) return <div>Chargement...</div>

  if (!user) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#f7f4ee'}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 32px',width:320,boxShadow:'0 4px 24px rgba(0,0,0,.10)'}}>
        <div style={{fontSize:26,fontWeight:900,color:'#2d5b3d',marginBottom:4}}><span style={{fontWeight:300}}>Co</span>renta</div>
        <div style={{fontSize:13,color:'#6b8c74',marginBottom:28}}>Gestion immobilière</div>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
          style={{width:'100%',padding:'10px 12px',border:'1.5px solid #dde8e0',borderRadius:8,fontSize:14,marginBottom:12,boxSizing:'border-box'}}/>
        <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)}
          style={{width:'100%',padding:'10px 12px',border:'1.5px solid #dde8e0',borderRadius:8,fontSize:14,marginBottom:16,boxSizing:'border-box'}}/>
        {authError && <div style={{color:'#c0392b',fontSize:13,marginBottom:12}}>{authError}</div>}
        <button onClick={login} style={{width:'100%',padding:'11px',background:'#2d5b3d',color:'#fff',border:'none',borderRadius:9,fontWeight:700,fontSize:15,cursor:'pointer'}}>
          Se connecter
        </button>
      </div>
    </div>
  )

  return (
    <div style={{fontFamily:'sans-serif',minHeight:'100vh',background:'#f7f4ee'}}>
      <div style={{background:'#2d5b3d',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:22,fontWeight:900,color:'#fff'}}><span style={{fontWeight:300}}>Co</span>renta</div>
        <button onClick={logout} style={{background:'rgba(255,255,255,.15)',border:'none',color:'#fff',padding:'6px 14px',borderRadius:8,cursor:'pointer'}}>Déconnexion</button>
      </div>
      <div style={{maxWidth:600,margin:'40px auto',padding:'0 16px',textAlign:'center'}}>
        <div style={{fontSize:18,fontWeight:700,color:'#2d5b3d'}}>✅ Connecté : {user.email}</div>
      </div>
    </div>
  )
}
