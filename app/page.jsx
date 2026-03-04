'use client'
import { useState, useCallback } from 'react'

const CATEGORIES = [
  { id: 'deco',     label: 'Deco & Hogar',  icon: '🏠' },
  { id: 'fitness',  label: 'Fitness',        icon: '💪' },
  { id: 'mascotas', label: 'Mascotas',       icon: '🐾' },
  { id: 'bebes',    label: 'Bebés & Niños',  icon: '👶' },
]

const SAT_CONFIG = {
  virgen: { label: 'VIRGEN',      color: '#10b981', bg: '#10b98115', border: '#10b98133' },
  baja:   { label: 'BAJA COMP.',  color: '#34d399', bg: '#34d39915', border: '#34d39933' },
  media:  { label: 'COMP. MEDIA', color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b33' },
  alta:   { label: 'SATURADO',    color: '#ef4444', bg: '#ef444415', border: '#ef444433' },
}

function Spinner({ size = 16, color = '#f59e0b' }) {
  return <span style={{ display:'inline-block', width:size, height:size, border:`2px solid ${color}33`, borderTop:`2px solid ${color}`, borderRadius:'50%', animation:'spin 0.7s linear infinite', verticalAlign:'middle' }} />
}

function ScoreDial({ score }) {
  const color = score >= 8 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444'
  const r = 18, circ = 2 * Math.PI * r
  const dash = (score / 10) * circ
  return (
    <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
      <svg width="52" height="52" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="#1f2937" strokeWidth="4" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
        <span style={{ color, fontWeight:800, fontSize:14, lineHeight:1 }}>{score}</span>
        <span style={{ color:'#4b5563', fontSize:8 }}>/10</span>
      </div>
    </div>
  )
}

function SatBadge({ saturation }) {
  const cfg = SAT_CONFIG[saturation] || SAT_CONFIG.media
  return <span style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700, letterSpacing:1, whiteSpace:'nowrap' }}>{cfg.label}</span>
}

function StatBox({ label, value, sub, highlight }) {
  return (
    <div style={{ background:'#060910', borderRadius:10, padding:'12px 14px', border:'1px solid #1f2937' }}>
      <div style={{ color:'#4b5563', fontSize:10, marginBottom:4, letterSpacing:1 }}>{label}</div>
      <div style={{ color:highlight||'#f9fafb', fontWeight:800, fontSize:20, fontFamily:'monospace' }}>{value}</div>
      {sub && <div style={{ color:'#374151', fontSize:10, marginTop:2 }}>{sub}</div>}
    </div>
  )
}

function MarginCalc({ priceUSA }) {
  const [usd, setUsd]   = useState(priceUSA || '')
  const [peso, setPeso] = useState('')
  const usdNum  = parseFloat(usd) || 0
  const pesoNum = parseFloat(peso) || 800
  const kgs         = Math.max(0.5, pesoNum / 1000)
  const courierUSD  = kgs <= 1 ? 15 : 15 + (kgs - 1) * 8
  const totalUSD    = usdNum + courierUSD
  const ARS         = 1250
  const costoARS    = Math.round(totalUSD * ARS)
  const precioSug   = Math.round(costoARS * 1.5)
  const margenPesos = precioSug - costoARS
  const margenPct   = usdNum > 0 ? Math.round((margenPesos / precioSug) * 100) : 0

  return (
    <div style={{ background:'#060910', borderRadius:12, padding:16, border:'1px solid #1f2937', marginTop:12 }}>
      <div style={{ color:'#f59e0b', fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:12 }}>💰 CALCULADORA DE MARGEN</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        <div>
          <div style={{ color:'#6b7280', fontSize:10, marginBottom:4 }}>Precio compra USD</div>
          <input value={usd} onChange={e=>setUsd(e.target.value)} type="number"
            style={{ width:'100%', padding:'8px 10px', background:'#0d1117', border:'1px solid #1f2937', borderRadius:8, color:'#f9fafb', fontSize:13, outline:'none', fontFamily:'monospace' }} />
        </div>
        <div>
          <div style={{ color:'#6b7280', fontSize:10, marginBottom:4 }}>Peso (gramos)</div>
          <input value={peso} onChange={e=>setPeso(e.target.value)} type="number" placeholder="800"
            style={{ width:'100%', padding:'8px 10px', background:'#0d1117', border:'1px solid #1f2937', borderRadius:8, color:'#f9fafb', fontSize:13, outline:'none', fontFamily:'monospace' }} />
        </div>
      </div>
      {usdNum > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
          <StatBox label="COURIER EST." value={`$${courierUSD.toFixed(0)}`} sub="USD" />
          <StatBox label="COSTO TOTAL" value={`$${costoARS.toLocaleString('es-AR')}`} sub="ARS" />
          <StatBox label="PRECIO SUGERIDO" value={`$${precioSug.toLocaleString('es-AR')}`} sub="ARS" highlight="#f59e0b" />
          <StatBox label="MARGEN" value={`${margenPct}%`} highlight={margenPct>=40?'#10b981':margenPct>=25?'#f59e0b':'#ef4444'} />
        </div>
      )}
      <div style={{ color:'#374151', fontSize:10, marginTop:8 }}>* TC estimado $1250 ARS/USD · Ajustá según cotización actual</div>
    </div>
  )
}

function ProductRow({ product, index }) {
  const [open, setOpen] = useState(false)
  const ml    = product.ml
  const score = ml?.opportunityScore || 0

  return (
    <div style={{ background:'#0d1117', border:'1px solid #161f2e', borderRadius:14, marginBottom:8, overflow:'hidden' }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ padding:'14px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, userSelect:'none' }}>
        <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#1f2937' }}>
          {product.image
            ? <img src={product.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#374151', fontSize:18 }}>📦</div>
          }
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:'#f9fafb', fontWeight:700, fontSize:13, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{product.title}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            {product.rank && <span style={{ color:'#6b7280', fontSize:11 }}>#{product.rank} Best Seller</span>}
            {product.salesVolume && (
              <span style={{ background:'#10b98115', color:'#10b981', border:'1px solid #10b98133', borderRadius:20, padding:'1px 8px', fontSize:10, fontWeight:700 }}>
                {product.salesVolume}
              </span>
            )}
            {product.isBestSeller && <span style={{ background:'#f59e0b', color:'#000', borderRadius:20, padding:'1px 8px', fontSize:10, fontWeight:700 }}>BEST SELLER</span>}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ textAlign:'right' }}>
            {product.priceUSD && <div style={{ color:'#f59e0b', fontWeight:700, fontSize:14, fontFamily:'monospace' }}>${product.priceUSD}</div>}
            <div style={{ color:'#4b5563', fontSize:10 }}>Amazon USA</div>
          </div>
          {ml && <SatBadge saturation={ml.saturation} />}
          {ml && <ScoreDial score={score} />}
          <span style={{ color:'#374151', fontSize:12 }}>{open?'▲':'▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding:'0 18px 18px', borderTop:'1px solid #161f2e' }}>
          <div style={{ paddingTop:16 }}>
            {ml && !ml.error && (
              <div style={{ marginBottom:14 }}>
                <div style={{ color:'#6b7280', fontSize:10, letterSpacing:1, marginBottom:10 }}>SITUACIÓN EN MERCADOLIBRE ARGENTINA</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                  <StatBox label="PUBLICACIONES" value={ml.totalListings?.toLocaleString('es-AR')||'0'}
                    highlight={ml.totalListings<80?'#10b981':ml.totalListings<400?'#f59e0b':'#ef4444'} />
                  <StatBox label="PRECIO PROM." value={`$${ml.avgPrice?.toLocaleString('es-AR')}`} sub="ARS" highlight="#f59e0b" />
                  <StatBox label="ML LÍDERES" value={ml.goldSellers||0}
                    highlight={ml.goldSellers<=2?'#10b981':ml.goldSellers<=5?'#f59e0b':'#ef4444'} />
                  <StatBox label="OPORTUNIDAD" value={`${score}/10`}
                    highlight={score>=8?'#10b981':score>=5?'#f59e0b':'#ef4444'} />
                </div>
                {ml.topListings?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ color:'#374151', fontSize:10, letterSpacing:1, marginBottom:8 }}>TOP PUBLICACIONES EN ML</div>
                    {ml.topListings.map((item,i) => (
                      <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, marginBottom:5, background:'#111827', border:'1px solid #1f2937' }}>
                        {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width:32, height:32, borderRadius:5, objectFit:'cover', flexShrink:0 }} />}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ color:'#d1d5db', fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {item.isGold && <span style={{ background:'#d97706', color:'#000', fontSize:9, padding:'1px 5px', borderRadius:3, marginRight:5, fontWeight:700 }}>MLÍDER</span>}
                            {item.title}
                          </div>
                          {item.sold > 0 && <div style={{ color:'#4b5563', fontSize:10 }}>{item.sold} vendidos</div>}
                        </div>
                        <div style={{ color:'#f59e0b', fontWeight:700, fontSize:12, whiteSpace:'nowrap', fontFamily:'monospace' }}>${item.price?.toLocaleString('es-AR')}</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            <MarginCalc priceUSA={product.priceUSD} />
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <a href={product.amazonURL} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, display:'block', textAlign:'center', padding:'10px', background:'#1f2937', borderRadius:10, color:'#f59e0b', fontWeight:700, fontSize:12, border:'1px solid #37415133' }}>
                📦 Ver en Amazon USA ↗
              </a>
              <a href={`https://listado.mercadolibre.com.ar/${product.mlQuery?.replace(/ /g,'-')}`} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, display:'block', textAlign:'center', padding:'10px', background:'#166534', borderRadius:10, color:'#22c55e', fontWeight:700, fontSize:12, border:'1px solid #22c55e33' }}>
                🛒 Buscar en ML ARG ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [category, setCategory] = useState('deco')
  const [minSales, setMinSales] = useState(1000)
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [total,    setTotal]    = useState(null)

  const analyze = useCallback(async () => {
    setLoading(true)
    setError('')
    setResults([])
    setTotal(null)
    try {
      const res  = await fetch(`/api/analyze?category=${category}&minSales=${minSales}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const filtered = (data.results || []).filter(r => (r.ml?.opportunityScore || 0) >= 7)
      setResults(filtered)
      setTotal(data.total || 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [category, minSales])

  const best = results.filter(r => r.ml?.opportunityScore >= 7).length

  return (
    <div style={{ minHeight:'100vh', background:'#060910', fontFamily:'Syne, sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input::placeholder{color:#374151}a:hover{opacity:0.85}`}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(180deg,#0d1117 0%,#060910 100%)', borderBottom:'1px solid #1f2937', padding:'24px 24px 20px' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ fontSize:10, letterSpacing:5, color:'#f59e0b', marginBottom:6, fontWeight:600 }}>RADAR IMPORTADOR</div>
          <h1 style={{ fontSize:22, fontWeight:800, background:'linear-gradient(90deg,#f59e0b,#fcd34d)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:4 }}>
            Amazon USA × MercadoLibre ARG
          </h1>
          <p style={{ color:'#4b5563', fontSize:12 }}>Top productos Amazon Best Sellers · Saturación real de ML Argentina · Margen calculado</p>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'24px auto', padding:'0 16px' }}>

        {/* Controls */}
        <div style={{ background:'#0d1117', border:'1px solid #1f2937', borderRadius:16, padding:20, marginBottom:20 }}>
          <div style={{ display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div style={{ flex:1 }}>
              <div style={{ color:'#4b5563', fontSize:10, letterSpacing:1, marginBottom:8 }}>CATEGORÍA AMAZON</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={()=>setCategory(c.id)}
                    style={{ padding:'8px 14px', borderRadius:10, border:'1px solid', borderColor:category===c.id?'#f59e0b':'#1f2937', background:category===c.id?'#f59e0b18':'#111827', color:category===c.id?'#f59e0b':'#6b7280', fontSize:12, fontWeight:category===c.id?700:400, cursor:'pointer' }}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color:'#4b5563', fontSize:10, letterSpacing:1, marginBottom:8 }}>VENTAS MÍN./MES</div>
              <div style={{ display:'flex', gap:6 }}>
                {[500,1000,2000,5000].map(v => (
                  <button key={v} onClick={()=>setMinSales(v)}
                    style={{ padding:'8px 12px', borderRadius:10, border:'1px solid', borderColor:minSales===v?'#10b981':'#1f2937', background:minSales===v?'#10b98118':'#111827', color:minSales===v?'#10b981':'#6b7280', fontSize:12, fontWeight:minSales===v?700:400, cursor:'pointer', fontFamily:'monospace' }}>
                    {v>=1000?`${v/1000}k`:v}+
                  </button>
                ))}
              </div>
            </div>
            <button onClick={analyze} disabled={loading}
              style={{ padding:'10px 28px', borderRadius:12, border:'none', background:loading?'#1f2937':'linear-gradient(90deg,#d97706,#f59e0b)', color:loading?'#4b5563':'#000', fontWeight:800, fontSize:14, cursor:loading?'not-allowed':'pointer', whiteSpace:'nowrap' }}>
              {loading ? <><Spinner size={13} color="#888" />&nbsp;Analizando...</> : '🎯 Analizar'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background:'#7f1d1d22', border:'1px solid #ef444444', borderRadius:12, padding:'12px 16px', color:'#fca5a5', fontSize:13, marginBottom:16 }}>
            ⚠️ {error}
          </div>
        )}

        {results.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
            <div style={{ background:'#0d1117', border:'1px solid #1f2937', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ color:'#4b5563', fontSize:10, marginBottom:4 }}>PRODUCTOS ANALIZADOS</div>
              <div style={{ color:'#f9fafb', fontWeight:800, fontSize:24, fontFamily:'monospace' }}>{results.length}</div>
            </div>
            <div style={{ background:'#0d1117', border:'1px solid #10b98133', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ color:'#4b5563', fontSize:10, marginBottom:4 }}>OPORTUNIDADES (score 7+)</div>
              <div style={{ color:'#10b981', fontWeight:800, fontSize:24, fontFamily:'monospace' }}>{best}</div>
            </div>
            <div style={{ background:'#0d1117', border:'1px solid #1f2937', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ color:'#4b5563', fontSize:10, marginBottom:4 }}>FUENTE</div>
              <div style={{ color:'#f59e0b', fontWeight:700, fontSize:14 }}>Amazon Best Sellers</div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <Spinner size={32} />
            <div style={{ color:'#6b7280', fontSize:13, marginTop:16 }}>Leyendo Amazon Best Sellers + MercadoLibre Argentina...</div>
            <div style={{ color:'#374151', fontSize:12, marginTop:6 }}>Puede tardar 15-20 segundos</div>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ color:'#374151', fontSize:10, letterSpacing:2 }}>🟢 OPORTUNIDADES CON BAJA COMPETENCIA EN ML</div>
              <div style={{ flex:1, height:1, background:'#1f2937' }} />
              <div style={{ color:'#374151', fontSize:10 }}>Expandí para ver detalles →</div>
            </div>
            {results.map((p,i) => <ProductRow key={p.asin||i} product={p} index={i} />)}
          </div>
        ) : !loading && !error && (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🎯</div>
            <div style={{ color:'#f9fafb', fontWeight:700, fontSize:16, marginBottom:8 }}>Elegí una categoría y clickeá Analizar</div>
            <div style={{ color:'#6b7280', fontSize:13 }}>Analizá una categoría — solo vas a ver productos con baja competencia en ML Argentina</div>
          </div>
        )}
      </div>
    </div>
  )
}
