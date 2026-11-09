import { Navigate, Route, Routes } from 'react-router'
import { Typography } from '@mui/material'
import CreatorLayout from './routes/CreatorLayout.tsx'
import CreatorSignIn from './routes/CreatorSignIn.tsx'
import NewEvent from './routes/NewEvent.tsx'

export default function App() {
  return (
    <Routes>
      <Route path='/creator/sign-in' element={<CreatorSignIn />} />

      <Route path='/creator' element={<CreatorLayout />}>
        <Route path='new-event' element={<NewEvent />} />
        {/* placeholder so the redirect after creating an event lands somewhere */}
        <Route
          path='events/:eventId'
          element={<Typography variant='h5'>Event page coming soon</Typography>}
        />
      </Route>

      <Route path='*' element={<Navigate to='/creator/sign-in' replace />} />
    </Routes>
  )
}
