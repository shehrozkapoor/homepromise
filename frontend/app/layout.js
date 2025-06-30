import '../style/global.css'
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'HOME PROMISE',
  description: 'DEVELOPED by valueans.com',
}

export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <body>
        <AuthProvider>
        {children}
        </AuthProvider>
        </body>
    </html>
  )
}
