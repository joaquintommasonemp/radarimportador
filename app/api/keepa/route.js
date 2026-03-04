// app/api/keepa/route.js
// Consulta la API de Keepa para traer productos con +1000 ventas/mes
// Docs: https://keepa.com/#!discuss/t/request-products/161

// Mapeo de categorías a IDs de Amazon (rootCategory)
const CATEGORY_MAP = {
  'deco':     690080011,   // Home Décor
  'hogar':    1055398,     // Home & Kitchen
  'fitness':  3407801,     // Sports & Outdoors
  'mascotas': 2619533011,  // Pet Supplies
  'bebes':    165797011,   // Baby
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category  = searchParams.get('category') || 'deco'
  const minSales  = parseInt(searchParams.get('minSales') || '1000')
  const apiKey    = process.env.KEEPA_API_KEY

  if (!apiKey) {
    return Response.json({ error: 'KEEPA_API_KEY no configurada en variables de entorno' }, { status: 500 })
  }

  const categoryId = CATEGORY_MAP[category] || CATEGORY_MAP['deco']

  try {
    // Keepa Product Finder — filtra por ventas mensuales estimadas y categoría
    const params = new URLSearchParams({
      key: apiKey,
      domain: '1',           // Amazon.com (USA)
      category: categoryId,
      sortBy: '1',           // sort by sales rank
      perPage: '50',
      page: '0',
      // Filtros de ventas mensuales (Keepa usa "monthlySold")
      monthlySoldMin: minSales,
      // Solo productos FBA o Amazon (más confiables)
      isAmazon: '0',
      hasReviews: '1',
      // Excluir variantes
      isParent: '1',
    })

    const res = await fetch(
      `https://api.keepa.com/query?${params}`,
      { next: { revalidate: 3600 } } // cache 1 hora
    )

    if (!res.ok) {
      const errText = await res.text()
      return Response.json({ error: `Keepa API error ${res.status}: ${errText}` }, { status: res.status })
    }

    const data = await res.json()

    if (!data.asinList || data.asinList.length === 0) {
      return Response.json({ products: [], total: 0 })
    }

    // Buscar detalles de los productos encontrados
    const asins = data.asinList.slice(0, 20).join(',')
    const detailRes = await fetch(
      `https://api.keepa.com/product?key=${apiKey}&domain=1&asin=${asins}&stats=1&offers=20`,
      { next: { revalidate: 3600 } }
    )

    const detailData = await detailRes.json()
    const products = (detailData.products || []).map(p => ({
      asin:         p.asin,
      title:        p.title,
      brand:        p.brand,
      image:        p.imagesCSV ? `https://images-na.ssl-images-amazon.com/images/I/${p.imagesCSV.split(',')[0]}` : null,
      priceUSD:     p.stats?.current?.[1] ? (p.stats.current[1] / 100).toFixed(2) : null,
      salesRank:    p.stats?.current?.[3] || null,
      monthlySold:  p.monthlySold || null,
      rating:       p.stats?.rating ? (p.stats.rating / 10).toFixed(1) : null,
      reviews:      p.stats?.reviewCount || null,
      weight:       p.packageWeight || null,   // gramos
      category:     category,
      amazonURL:    `https://www.amazon.com/dp/${p.asin}`,
      // Búsqueda sugerida para ML (título simplificado)
      mlQuery:      simplifyTitle(p.title),
    }))

    return Response.json({ products, total: data.total || products.length })

  } catch (err) {
    console.error('Keepa error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

function simplifyTitle(title = '') {
  // Quita palabras en inglés muy específicas y deja lo útil para buscar en ML
  return title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .split(/[-,|]/)[0]
    .trim()
    .substring(0, 60)
}
