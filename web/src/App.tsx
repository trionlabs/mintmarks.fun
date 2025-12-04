import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LazyMotion, domAnimation } from 'framer-motion'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { SmoothScroll } from '@/components/SmoothScroll'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { CreateMark } from '@/pages/CreateMark'
import { MyMarks } from '@/pages/MyMarks'
import { TestMint } from '@/pages/TestMint'
import { ComponentShowcase } from '@/pages/ComponentShowcase'
import { HeroDemo } from '@/pages/HeroDemo'
import { TestCenter } from '@/pages/TestCenter'

// Lenis smooth scroll styles
import 'lenis/dist/lenis.css'

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
        {/* Dev-only debug page */}
        <Route path="/test-center" element={<TestCenter />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <LazyMotion features={domAnimation}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <SmoothScroll>
                <AppContent />
              </SmoothScroll>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </LazyMotion>
    </BrowserRouter>
  )
}

export default App
