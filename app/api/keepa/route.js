// app/api/keepa/route.js
// Lee Amazon Best Sellers directamente — sin API key, sin costo
// Páginas públicas actualizadas cada hora por Amazon

const CATEGORIES = {
  deco:     { url: 'https://www.amazon.com/Best-Sellers-Home-Kitchen-Home-Dcor-Accents/zgbs/home-garden/1063306', label: 'Deco & Hogar' },
  fitness:  { url: 'https://www.amazon.com/Best-Sellers-Sports-Outdoors-Exercise-Fitness/zgbs/sporting-goods/3407731', label: 'Fitness' },
  mascotas: { url: 'https://www.amazon.com/Best-Sellers-Pet-Supplies/zgbs/pet-supplies', label: 'Mascotas' },
  bebes:    { url: 'https://www.amazon.com/Best-Sellers-Baby/zgbs/baby-products', label: 'Bebés' },
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'deco'
  const cat = CATEGORIES[category] || CATEGORIES.deco

  try {
    const res = await fetch(cat.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 3600 } // cache 1 hora
    })

    if (!res.ok) {
      return Response.json({ error: `Amazon respondió con error ${res.status}` }, { status: res.status })
    }

    const html = await res.text()

    // Extraer productos del HTML de Best Sellers
    const products = parseAmazonBestSellers(html, category)

    return Response.json({ products, total: products.length, category: cat.label })

  } catch (err) {
    console.error('Amazon scrape error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

function parseAmazonBestSellers(html, category) {
  const products = []

  // Extraer bloques de producto — Amazon usa patrones consistentes en Best Sellers
  const asinMatches = [...html.matchAll(/data-asin="([A-Z0-9]{10})"/g)]
  const seen = new Set()

  for (const match of asinMatches) {
    const asin = match[1]
    if (seen.has(asin) || !asin) continue
    seen.add(asin)

    // Buscar el bloque HTML alrededor de este ASIN
    const pos = match.index
    const block = html.substring(Math.max(0, pos - 200), pos + 2000)

    // Título
    const titleMatch = block.match(/class="[^"]*p13n-sc-[^"]*"[^>]*>\s*<span[^>]*>([^<]{10,150})<\/span>/)
      || block.match(/alt="([^"]{10,150})"/)
      || block.match(/title="([^"]{10,150})"/)
    const title = titleMatch ? titleMatch[1].trim() : null
    if (!title) continue

    // Precio
    const priceMatch = block.match(/\$(\d+\.?\d*)/)
    const price = priceMatch ? parseFloat(priceMatch[1]) : null

    // Rating
    const ratingMatch = block.match(/([\d.]+) out of 5/)
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null

    // Imagen
    const imgMatch = block.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/)
    const image = imgMatch ? imgMatch[1] : null

    // "bought in past month" — el dato clave
    const boughtMatch = block.match(/([\d.]+[Kk]?)\+?\s*bought in past month/i)
    const salesVolume = boughtMatch ? boughtMatch[0] : null
    const monthlySold = salesVolume ? parseSales(boughtMatch[1]) : null

    // Rank en best sellers
    const rankMatch = block.match(/#(\d+)\s+in/)
    const rank = rankMatch ? parseInt(rankMatch[1]) : products.length + 1

    products.push({
      asin,
      title,
      image,
      priceUSD: price,
      rating,
      salesVolume,
      monthlySold,
      rank,
      amazonURL: `https://www.amazon.com/dp/${asin}`,
      mlQuery: simplifyForML(title),
      category,
    })

    if (products.length >= 20) break
  }

  return products.sort((a, b) => (a.rank || 99) - (b.rank || 99))
}

function parseSales(str = '') {
  if (!str) return null
  const num = parseFloat(str)
  const isK = str.toLowerCase().includes('k')
  return isK ? num * 1000 : num
}

function simplifyForML(title = '') {
  const stopWords = ['with', 'for', 'and', 'set', 'pack', 'piece', 'inch', 'premium', 'professional', 'the', 'of', 'in', 'a', 'an']
  return title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .split(/[-,|]/)[0]
    .split(' ')
    .filter(w => w.length > 2 && !stopWords.includes(w.toLowerCase()))
    .slice(0, 4)
    .join(' ')
    .trim()
}
