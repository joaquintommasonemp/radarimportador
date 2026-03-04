# 🚀 Radar Importador — Setup completo

## 1. Conseguir API Key de Keepa

1. Andá a https://keepa.com → creá cuenta
2. Luego https://keepa.com/api → suscribite (~€19/mes)
3. Copiá tu API Key

## 2. Correr localmente (para probar)

```bash
# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env.local
# Editá .env.local y pegá tu KEEPA_API_KEY

# Correr en desarrollo
npm run dev
# Abrí http://localhost:3000
```

## 3. Deploy en Vercel (gratis)

### Opción A — Upload directo
1. Vercel.com → New Project → Upload folder
2. Subís esta carpeta
3. En "Environment Variables" agregás: KEEPA_API_KEY = tu_key
4. Deploy

### Opción B — Con GitHub
1. Subís el proyecto a un repo de GitHub
2. Vercel → Import from GitHub
3. Agregás la env variable KEEPA_API_KEY
4. Deploy automático en cada push

## 4. Cómo funciona

```
Usuario elige categoría + ventas mínimas
         ↓
/api/analyze (Next.js server)
         ↓
/api/keepa → Keepa API (filtra +1000 ventas/mes en Amazon USA)
         ↓
/api/ml    → MercadoLibre API (saturación real en Argentina)
         ↓
Dashboard muestra productos ordenados por oportunidad
```

## Costos

| Servicio    | Costo      |
|-------------|------------|
| Vercel      | Gratis     |
| MercadoLibre API | Gratis |
| Keepa API   | ~€19/mes   |
| **Total**   | **~€19/mes** |

## Próximos pasos opcionales

- [ ] Supabase para guardar histórico de saturación ML
- [ ] Alertas por email cuando aparece nueva oportunidad
- [ ] Tipo de cambio automático (API del BCRA)
- [ ] Exportar a CSV
