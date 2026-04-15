import 'bootstrap/dist/css/bootstrap.min.css'
import 'antd/dist/reset.css'
import './globals.css'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '../hooks/AuthContext'

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!googleClientId) {
    console.warn('Chưa cấu hình Google Client ID. Đăng nhập Google sẽ không hoạt động.')
  }

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}