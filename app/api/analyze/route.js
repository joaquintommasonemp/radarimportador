// app/api/analyze/route.js
// Trae productos de Keepa Y su situación en ML en una sola llamada

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'deco'
  const minSales = searchParams.get('minSales') || '1000'
  const base     = new URL(request.url).origin

  try {
    // 1. Traer productos de Keepa
    const keepaRes = await fetch(`${base}/api/keepa?category=${category}&minSales=${minSales}`)
    const keepaData = await keepaRes.json()

    if (keepaData.error) return Response.json({ error: keepaData.error }, { status: 500 })
    if (!keepaData.products?.length) return Response.json({ results: [] })

    // 2. Para cada producto, consultar ML en paralelo (máx 10 a la vez)
    const chunk = keepaData.products.slice(0, 10)
    const results = await Promise.all(
      chunk.map(async (product) => {
        try {
          const mlRes  = await fetch(`${base}/api/ml?q=${encodeURIComponent(product.mlQuery)}`)
          const mlData = await mlRes.json()
          return { ...product, ml: mlData }
        } catch {
          return { ...product, ml: null }
        }
      })
    )

    // Ordenar por mejor oportunidad (score ML alto + ventas Amazon altas)
    results.sort((a, b) => {
      const scoreA = (a.ml?.opportunityScore || 0) * 0.6 + (Math.min((a.monthlySold || 0) / 1000, 5)) * 0.4
      const scoreB = (b.ml?.opportunityScore || 0) * 0.6 + (Math.min((b.monthlySold || 0) / 1000, 5)) * 0.4
      return scoreB - scoreA
    })

    return Response.json({ results, total: keepaData.total })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
