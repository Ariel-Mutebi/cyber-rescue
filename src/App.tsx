import { Route, Routes } from 'react-router'
import CreatorLayout from './routes/CreatorLayout'
import CreatorSignIn from './routes/CreatorSignIn'
import NewEvent from './routes/NewEvent'
import EventPage from './routes/EventPage'

import ManagerLayout from './routes/ManagerLayout'
import ManagerSignIn from './routes/ManagerSignIn'
import ManagerHome from './routes/ManagerHome'

import ParticipantLayout from './routes/ParticipantLayout'
import JoinTeam from './routes/JoinTeam'
import OpenTeams from './routes/OpenTeams'
import TeamLobby from './routes/TeamLobby'

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

      <Route element={<ParticipantLayout />}>
        <Route path='/join/:code' element={<JoinTeam />} />
        <Route path='/events/:eventId/teams' element={<OpenTeams />} />
        <Route path='/events/:eventId/team' element={<TeamLobby />} />
      </Route>
    </Routes>
  )
}
