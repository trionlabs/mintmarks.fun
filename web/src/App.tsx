import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { CreateMark } from '@/pages/CreateMark'
import { MyMarks } from '@/pages/MyMarks'

function AppContent() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateMark />} />
        <Route path="/marks" element={<MyMarks />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
