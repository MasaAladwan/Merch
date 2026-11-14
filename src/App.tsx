import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Showroom from './pages/Showroom'
import Saved from './pages/Saved'

// The 3D stacks (model-viewer, three + react-three-fiber) live in these chunks,
// so the catalog never downloads them.
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Customizer = lazy(() => import('./pages/Customizer'))

export default function App() {
  return (
    <div className="min-h-full">
      <Navbar />
      <Suspense fallback={<div className="py-32 text-center text-sm text-ink/40">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Showroom />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/customize/:id" element={<Customizer />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="*" element={<Showroom />} />
        </Routes>
      </Suspense>
    </div>
  )
}
