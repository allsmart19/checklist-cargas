import { AuthProvider } from '@/contexts/AuthContext'
import { AppRoutes } from '@/routes/AppRoutes'
import { InstallPrompt } from '@/components/ui/InstallPrompt'

function App() {
  return (
    <AuthProvider>
     <InstallPrompt />
      <AppRoutes />
    </AuthProvider>
  )
}

export default App