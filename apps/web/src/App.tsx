import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Landing } from '@/pages/Landing.tsx'
import { Onboard } from '@/pages/Onboard.tsx'
import { Room } from '@/pages/Room.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboard" element={<Onboard />} />
        <Route path="/room" element={<Room />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
