import './globals.css'

export const metadata = {
  title: 'Radar Importador — Amazon USA × MercadoLibre ARG',
  description: 'Detectá productos con +1000 ventas mensuales en Amazon y baja saturación en ML Argentina',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
