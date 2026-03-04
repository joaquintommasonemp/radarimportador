// app/api/analyze/route.js
// Nichos específicos curados para el mercado argentino
// Actualizados: Marzo 2026

const NICHOS = {
  deco: [
    "portavelas cemento minimalista",
    "maceta geometrica concrete",
    "difusor caña bambu hogar",
    "bandeja decorativa madera ratán",
    "espejo redondo boho pared",
    "cesto seagrass organizador",
    "marco fotos madera flotante",
    "tapiz macrame pared bohemio",
    "porta plantas colgante macrame",
    "vela soja aromatica artesanal",
    "organizador escritorio bambu",
    "perchero pared madera minimalista",
    "caja organizadora lino tapa",
    "lampara mesa ratan bohemia",
    "cuadro canvas minimalista líneas",
    "bowl ceramica hecho a mano",
    "jarron ceramica textura mate",
    "porta servilletas madera natural",
    "colgante pared plumas boho",
    "set posavasos corcho grabado",
  ],
  fitness: [
    "colchoneta yoga corcho antideslizante",
    "bandas resistencia latex set 5",
    "rueda abdominal doble rodamiento",
    "foam roller texturado masaje",
    "soga saltar crossfit speed",
    "pelota pilates antiestallido 65cm",
    "banda resistencia tela gluteos",
    "tobilleras lastre par 2kg",
    "manoplas boxeo muay thai principiante",
    "cinturon levantamiento pesas neoprene",
    "guantes fitness entrenamiento palma gel",
    "comba saltar digital contador",
    "rodillo masaje piernas recovery",
    "porta agua gym acero inoxidable",
    "mat yoga bolsa transporte incluida",
    "banda cadera resistencia booty",
    "timer intervalos entrenamiento",
    "cuerda batalla battle rope 9m",
    "soporte celular bicicleta fija",
    "grip entrenamiento pull up",
  ],
  mascotas: [
    "comedero lento perro silicona",
    "cama ortopedica perro espuma memoria",
    "juguete snuffle perro olfato",
    "bebedero fuente gato silencioso",
    "arnés reflectante perro mediano",
    "cortauñas mascotas seguridad tope",
    "cepillo autolimpiante pelo mascotas",
    "juguete dispensador premios perro",
    "arenero gato cubierto antiolor",
    "portador gato avion aprobado",
    "comedero elevado perro doble",
    "collar antipulgas natural",
    "juguete caña plumas gato",
    "manta polar mascotas lavable",
    "bolsa portasnacks entrenamiento perro",
    "cepillo dientes perro dedal",
    "rampa perro cama auto",
    "bebedero portatil perro viaje",
    "chaleco antiestres perro ansiedad",
    "plato lamedor snack perro",
  ],
  bebes: [
    "proyector musical cuna bebe",
    "set mordillo silicona libre bpa",
    "termometro frontal digital bebes",
    "juguete montessori madera 1 año",
    "bañera plegable recien nacido",
    "hamaca portatil bebe viaje",
    "set cepillo peine pelo bebe",
    "babero silicona con bolsillo",
    "cortauñas electrico seguro bebe",
    "monitor bebes audio bidireccional",
    "asiento bañera antideslizante",
    "set cubiertos aprendizaje bebe",
    "almohada lactancia multifuncion",
    "porta chupete estuche esterilizador",
    "juguete estimulacion temprana 0 6 meses",
    "mochila maternal impermeable",
    "cubre pañal tela reutilizable",
    "termometro agua baño bebe",
    "trampolin mini interior niños",
    "kit higiene bebe set completo",
  ],
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'deco'
  const base     = new URL(request.url).origin

  const nichos = NICHOS[category] || NICHOS.deco

  try {
    // Consultar ML para cada nicho en paralelo
    const results = await Promise.all(
      nichos.map(async (nicho) => {
        try {
          const mlRes  = await fetch(`${base}/api/ml?q=${encodeURIComponent(nicho)}`)
          const mlData = await mlRes.json()
          return {
            asin:       null,
            title:      nicho.charAt(0).toUpperCase() + nicho.slice(1),
            mlQuery:    nicho,
            priceUSD:   null,
            salesVolume: null,
            amazonURL:  `https://www.amazon.com/s?k=${encodeURIComponent(nicho)}`,
            ml:         mlData,
          }
        } catch {
          return { title: nicho, mlQuery: nicho, ml: null }
        }
      })
    )

    // Ordenar: mayor oportunidad primero
    results.sort((a, b) => (b.ml?.opportunityScore || 0) - (a.ml?.opportunityScore || 0))

    return Response.json({ results, total: results.length })

  } catch (err) {
    console.error('Analyze error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
