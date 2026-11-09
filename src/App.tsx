import { Route, Routes } from 'react-router'
import CreatorLayout from './routes/CreatorLayout'
import CreatorSignIn from './routes/CreatorSignIn'
import NewEvent from './routes/NewEvent'
import EventPage from './routes/EventPage'

import ManagerLayout from './routes/ManagerLayout'
import ManagerSignIn from './routes/ManagerSignIn'
import ManagerHome from './routes/ManagerHome'

export default function App() {
  return (
    <Routes>
      <Route path='/creator/sign-in' element={<CreatorSignIn />} />

      <Route path='/creator' element={<CreatorLayout />}>
        <Route path='new-event' element={<NewEvent />} />
        <Route path='events/:eventId' element={<EventPage />} />
      </Route>

      <Route path='/manager/sign-in' element={<ManagerSignIn />} />

      <Route path='/manager' element={<ManagerLayout />}>
        <Route index element={<ManagerHome />} />
      </Route>
    </Routes>
  )
}
