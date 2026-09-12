import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Landing } from '@/pages/Landing.tsx'
import { Onboard } from '@/pages/Onboard.tsx'
import { Room } from '@/pages/Room.tsx'
import { Market } from '@/pages/Market.tsx'

function AppToaster() {
  const { pathname } = useLocation()
  return <Toaster theme={pathname === '/' ? 'light' : 'dark'} position="bottom-right" />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppToaster />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/market" element={<Market />} />
        <Route path="/onboard" element={<Onboard />} />
        <Route path="/room" element={<Room />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
