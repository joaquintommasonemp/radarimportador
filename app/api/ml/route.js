// app/api/ml/route.js
// Proxy server-side para evitar CORS y procesar datos de ML Argentina

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query) return Response.json({ error: 'Falta parámetro q' }, { status: 400 })

  try {
    const url = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(query)}&limit=50`
    const res = await fetch(url, { next: { revalidate: 300 } }) // cache 5 min

    if (!res.ok) return Response.json({ error: `ML error ${res.status}` }, { status: res.status })

    const data = await res.json()
    const results = data.results || []

    if (results.length === 0) {
      return Response.json({ totalListings: 0, avgPrice: 0, minPrice: 0, maxPrice: 0, goldSellers: 0, topListings: [], opportunityScore: 10, saturation: 'virgen' })
    }

    const prices   = results.map(r => r.price).filter(Boolean)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    const total    = data.paging?.total || results.length
    const gold     = results.filter(r => r.seller?.seller_reputation?.level_id === '5_green').length

    // Score de oportunidad 1-10 (10 = máxima oportunidad)
    let score = 10
    if (total > 50)   score -= 1
    if (total > 150)  score -= 2
    if (total > 400)  score -= 2
    if (total > 800)  score -= 1
    if (gold > 1)     score -= 1
    if (gold > 3)     score -= 1
    if (gold > 6)     score -= 1
    score = Math.max(1, score)

    const saturation = total === 0 ? 'virgen' : total < 80 ? 'baja' : total < 400 ? 'media' : 'alta'

    const topListings = results.slice(0, 5).map(r => ({
      title:     r.title,
      price:     r.price,
      sold:      r.sold_quantity || 0,
      isGold:    r.seller?.seller_reputation?.level_id === '5_green',
      url:       r.permalink,
      thumbnail: r.thumbnail,
    }))

    return Response.json({ totalListings: total, avgPrice, minPrice, maxPrice, goldSellers: gold, topListings, opportunityScore: score, saturation })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
