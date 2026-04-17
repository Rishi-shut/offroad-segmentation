import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from "@clerk/react"
import { dark } from "@clerk/themes"

/**
 * Custom Clerk appearance configuration
 * Matches the app's dark glassmorphic design system:
 *   - bg-dark: #09090b
 *   - bg-panel: #18181b
 *   - primary: #3b82f6
 *   - border: #3f3f46
 *   - text: #f4f4f5 / #a1a1aa
 */
const clerkAppearance = {
  baseTheme: dark,
  variables: {
    // Core colors
    colorPrimary: '#3b82f6',
    colorBackground: '#09090b',
    colorInputBackground: '#18181b',
    colorInputText: '#f4f4f5',
    colorText: '#f4f4f5',
    colorTextSecondary: '#a1a1aa',
    colorDanger: '#ef4444',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorNeutral: '#a1a1aa',

    // Typography
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyButtons: "'Inter', sans-serif",
    fontSize: '0.95rem',

    // Shape
    borderRadius: '12px',
    spacingUnit: '4px',
  },
  elements: {
    // Card (the modal container)
    card: {
      backgroundColor: '#09090b',
      border: '1px solid #3f3f46',
      borderRadius: '20px',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
    },

    // Header area
    headerTitle: {
      color: '#f4f4f5',
      fontWeight: '700',
      fontSize: '1.4rem',
    },
    headerSubtitle: {
      color: '#a1a1aa',
    },

    // Social buttons (Google, GitHub, etc.)
    socialButtonsBlockButton: {
      backgroundColor: '#18181b',
      border: '1px solid #3f3f46',
      color: '#f4f4f5',
      borderRadius: '10px',
      '&:hover': {
        backgroundColor: '#27272a',
        borderColor: '#3b82f6',
      },
    },
    socialButtonsBlockButtonText: {
      color: '#f4f4f5',
      fontWeight: '500',
    },

    // Divider
    dividerLine: {
      backgroundColor: '#3f3f46',
    },
    dividerText: {
      color: '#71717a',
    },

    // Form fields
    formFieldLabel: {
      color: '#a1a1aa',
      fontWeight: '500',
    },
    formFieldInput: {
      backgroundColor: '#18181b',
      border: '1px solid #3f3f46',
      color: '#f4f4f5',
      borderRadius: '10px',
      '&::placeholder': {
        color: '#71717a',
      },
      '&:focus': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)',
      },
    },
    formFieldInputShowPasswordButton: {
      color: '#71717a',
      '&:hover': {
        color: '#a1a1aa',
      },
    },

    // Primary button (Continue, Sign In, etc.)
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      borderRadius: '10px',
      fontWeight: '600',
      fontSize: '0.95rem',
      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
      '&:hover': {
        background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
        boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
      },
    },

    // Footer links
    footerActionLink: {
      color: '#3b82f6',
      fontWeight: '500',
      '&:hover': {
        color: '#60a5fa',
      },
    },
    footerActionText: {
      color: '#71717a',
    },

    // "Powered by Clerk" badge
    footerPages: {
      color: '#52525b',
    },

    // User button (avatar in the dashboard header)
    userButtonAvatarBox: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
    },
    userButtonPopoverCard: {
      backgroundColor: '#09090b',
      border: '1px solid #3f3f46',
      borderRadius: '16px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
    },
    userButtonPopoverActionButton: {
      '&:hover': {
        backgroundColor: '#18181b',
      },
    },

    // User profile modal
    profileSectionPrimaryButton: {
      color: '#3b82f6',
    },

    // Internal page (org switcher, etc.)
    navbarButton: {
      color: '#a1a1aa',
      '&:hover': {
        backgroundColor: '#18181b',
        color: '#f4f4f5',
      },
    },

    // Alert banners
    alert: {
      backgroundColor: '#18181b',
      border: '1px solid #3f3f46',
      borderRadius: '10px',
    },

    // OTP input
    otpCodeFieldInput: {
      backgroundColor: '#18181b',
      border: '1px solid #3f3f46',
      color: '#f4f4f5',
      borderRadius: '10px',
    },
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      afterSignOutUrl="/"
      appearance={clerkAppearance}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
