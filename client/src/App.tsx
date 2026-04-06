import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { DevToolsProvider } from './contexts/DevToolsContext'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import ProblemReportsPage from './pages/ProblemReportsPage'
import ProblemReportDetailPage from './pages/ProblemReportDetailPage'
import DevToolsPage from './pages/DevToolsPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DevToolsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ProblemReportsPage />} />
                <Route path="reports/:reportId" element={<ProblemReportDetailPage />} />
                <Route path="dev-tools" element={<DevToolsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DevToolsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
