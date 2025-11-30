import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LazyMotion, domAnimation } from 'framer-motion'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { CreateMark } from '@/pages/CreateMark'
import { MyMarks } from '@/pages/MyMarks'
import { TestMint } from '@/pages/TestMint'
import { ComponentShowcase } from '@/pages/ComponentShowcase'
import { HeroDemo } from '@/pages/HeroDemo'

function AppContent() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateMark />} />
        <Route path="/marks" element={<MyMarks />} />
        <Route path="/marks/test" element={<TestMint />} />
        <Route path="/showcase" element={<ComponentShowcase />} />
        <Route path="/hero" element={<HeroDemo />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <LazyMotion features={domAnimation} strict>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </LazyMotion>
    </BrowserRouter>
  )
}

export default App
