
// app/api/analyze/route.js

// Traducción de términos comunes inglés → español para buscar en ML Argentina
const TRANSLATIONS = {
  'yoga mat': 'colchoneta yoga',
  'resistance bands': 'bandas resistencia',
  'massage gun': 'masajeador percusion',
  'water fountain': 'bebedero automatico',
  'dog toy': 'juguete perro',
  'cat toy': 'juguete gato',
  'pet bed': 'cama mascotas',
  'pet grooming': 'cortapelos mascotas',
  'baby monitor': 'monitor bebe',
  'baby toy': 'juguete bebe',
  'montessori': 'montessori',
  'baby bath': 'bañera bebe',
  'baby carrier': 'portabebe',
  'wall decor': 'cuadro decorativo',
  'candle holder': 'portavelas',
  'picture frame': 'marco foto',
  'home decor': 'decoracion hogar',
  'kitchen organizer': 'organizador cocina',
  'bamboo': 'bambu',
  'vacuum sealer': 'envasadora vacio',
  'air purifier': 'purificador aire',
  'jump rope': 'soga saltar',
  'fitness tracker': 'smartwatch fitness',
  'storage': 'organizador',
  'diffuser': 'difusor',
  'humidifier': 'humidificador',
  'led light': 'tira led',
  'shower': 'ducha',
  'towel': 'toalla',
  'pillow': 'almohada',
  'blanket': 'manta',
  'bottle': 'botella',
  'backpack': 'mochila',
}

function translateForML(title = '') {
  let query = title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .split(/[-,|]/)[0]
    .toLowerCase()
    .trim()

  // Intentar traducción directa de frases conocidas
  for (const [en, es] of Object.entries(TRANSLATIONS)) {
    if (query.includes(en)) {
      query = query.replace(en, es)
      break
    }
  }

  // Quedarse con las primeras 3-4 palabras útiles
  const stopWords = ['with', 'for', 'and', 'set', 'pack', 'piece', 'inch', 'premium', 'professional', 'the', 'of', 'in', 'a', 'an', 'new', 'best']
  const words = query
    .split(' ')
    .filter(w => w.length > 2 && !stopWords.includes(w))
    .slice(0, 3)

  return words.join(' ').trim()
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'deco'
  const minSales = searchParams.get('minSales') || '500'
  const base     = new URL(request.url).origin

  try {
    // 1. Traer productos de Amazon Best Sellers
    const keepaRes  = await fetch(`${base}/api/keepa?category=${category}&minSales=${minSales}`)
    const keepaData = await keepaRes.json()

    if (keepaData.error) return Response.json({ error: keepaData.error }, { status: 500 })
    if (!keepaData.products?.length) return Response.json({ results: [], total: 0 })

    // 2. Consultar ML para cada producto en paralelo
    const products = keepaData.products.slice(0, 20)

    const results = await Promise.all(
      products.map(async (product) => {
        try {
          // Traducir query al español para ML
          const mlQuery = translateForML(product.title)
          const mlRes   = await fetch(`${base}/api/ml?q=${encodeURIComponent(mlQuery)}`)
          const mlData  = await mlRes.json()
          return { ...product, mlQuery, ml: mlData }
        } catch {
          return { ...product, ml: null }
        }
      })
    )

    // Ordenar: primero los de mayor oportunidad en ML
    results.sort((a, b) => {
      const scoreA = (a.ml?.opportunityScore || 0)
      const scoreB = (b.ml?.opportunityScore || 0)
      return scoreB - scoreA
    })

    return Response.json({ results, total: results.length })

  } catch (err) {
    console.error('Analyze error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
