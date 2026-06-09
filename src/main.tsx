/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { Suspense, lazy } from 'react';
import App from './App';
import ProtectedRoute from './ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

const Dashboard = lazy(() => import('./Dashboard'));
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '684113538725-1bkdm6t6gq96i2es8nl5pcb6vl54apu8.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><div className="ui-spinner" style={{ width: 40, height: 40, color: 'var(--accent-primary)' }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="ui-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="ui-spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div></div>}>
                      <Dashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
