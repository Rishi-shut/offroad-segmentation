import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from "@clerk/react"
import { dark } from "@clerk/themes"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: '#3b82f6', colorBackground: '#18181b', colorText: '#f4f4f5' }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
