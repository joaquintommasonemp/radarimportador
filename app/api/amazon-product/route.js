// app/api/amazon-product/route.js
// Extrae nombre del producto desde una URL de Amazon

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) return Response.json({ error: 'Falta URL' }, { status: 400 })

  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/product\/([A-Z0-9]{10})/i)
  const asin = asinMatch ? asinMatch[1] : null

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    })

    if (!res.ok) return Response.json({ error: `Amazon error ${res.status}` }, { status: res.status })

    const html = await res.text()

    // Extraer título
    const titleMatch = html.match(/id="productTitle"[^>]*>\s*([^<]+)\s*</)
      || html.match(/<title>([^|<]+)/)
    const title = titleMatch ? titleMatch[1].trim() : null

    // Extraer precio
    const priceMatch = html.match(/class="a-price-whole">([^<]+)</)
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g,'')) : null

    // Extraer imagen
    const imgMatch = html.match(/"hiRes":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/)
      || html.match(/id="landingImage"[^>]*src="([^"]+)"/)
    const image = imgMatch ? imgMatch[1] : null

    // Extraer ventas mensuales
    const boughtMatch = html.match(/([\d.]+[Kk]?\+?\s*(?:mil\+?\s*)?(?:comprados?|bought)[^<]{0,30}(?:mes|month))/i)
    const salesVolume = boughtMatch ? boughtMatch[1].trim() : null

    // Rating y reviews
    const ratingMatch = html.match(/([\d.]+) (?:out of 5|de 5)/)
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null
    const reviewsMatch = html.match(/([\d,]+)\s*(?:global ratings|valoraciones globales)/)
    const reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(/,/g,'')) : null

    if (!title) return Response.json({ error: 'No se pudo leer el producto. Amazon puede estar bloqueando — intentá con otro link.' }, { status: 422 })

    return Response.json({ asin, title, price, image, salesVolume, rating, reviews, url })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
