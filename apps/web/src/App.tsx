import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Landing } from '@/pages/Landing.tsx'
import { Onboard } from '@/pages/Onboard.tsx'
import { Room } from '@/pages/Room.tsx'
import { Market } from '@/pages/Market.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster theme="light" position="bottom-right" />
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
