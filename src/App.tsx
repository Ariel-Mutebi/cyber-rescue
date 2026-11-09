import { Navigate, Route, Routes } from 'react-router'
import CreatorLayout from './routes/CreatorLayout'
import CreatorSignIn from './routes/CreatorSignIn'
import NewEvent from './routes/NewEvent'
import EventPage from './routes/EventPage'

export default function App() {
  return (
    <Routes>
      <Route path='/creator/sign-in' element={<CreatorSignIn />} />

      <Route path='/creator' element={<CreatorLayout />}>
        <Route path='new-event' element={<NewEvent />} />
        <Route path='events/:eventId' element={<EventPage />} />
      </Route>

      <Route path='*' element={<Navigate to='/creator/sign-in' replace />} />
    </Routes>
  )
}
