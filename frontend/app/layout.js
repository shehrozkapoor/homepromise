import '../style/global.css'

export const metadata = {
  title: 'HOME PROMISE',
  description: 'DEVELOPED by valueans.com',
}

export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
