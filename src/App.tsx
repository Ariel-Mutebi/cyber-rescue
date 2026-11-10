import { Route, Routes, Navigate } from 'react-router'
import CreatorLayout from './routes/CreatorLayout'
import SignInLayout from './routes/SignInLayout'
import CreatorSignIn from './routes/CreatorSignIn'
import NewEvent from './routes/NewEvent'
import EventDashboard from './routes/EventDashboard'
import TeamsTab from './routes/TeamsTab'
import ManagersTab from './routes/ManagersTab'
import CreatorEvents from './routes/CreatorEvents'

import ManagerLayout from './routes/ManagerLayout'
import ManagerSignIn from './routes/ManagerSignIn'
import ManagerDashboard from './routes/ManagerDashboard'

import ParticipantLayout from './routes/ParticipantLayout'
import Home from './routes/Home'
import JoinTeam from './routes/JoinTeam'
import OpenTeams from './routes/OpenTeams'
import TeamLobby from './routes/TeamLobby'

export default function App() {
  return (
    <Routes>
      <Route element={<SignInLayout />}>
        <Route path='/creator/sign-in' element={<CreatorSignIn />} />
        <Route path='/manager/sign-in' element={<ManagerSignIn />} />
      </Route>

      <Route path='/creator' element={<CreatorLayout />}>
        <Route index element={<Navigate to='events' replace />} />
        <Route path='events' element={<CreatorEvents />} />
        <Route path='new-event' element={<NewEvent />} />
        <Route path='events/:eventId' element={<EventDashboard />}>
          <Route index element={<Navigate to='teams' replace />} />
          <Route path='teams' element={<TeamsTab />} />
          <Route path='managers' element={<ManagersTab />} />
        </Route>
      </Route>

      <Route path='/manager' element={<ManagerLayout />}>
        <Route element={<ManagerDashboard />}>
          <Route index element={<Navigate to='teams' replace />} />
          <Route path='teams' element={<TeamsTab />} />
        </Route>
      </Route>

      <Route element={<ParticipantLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/join/:code' element={<JoinTeam />} />
        <Route path='/events/:eventId/teams' element={<OpenTeams />} />
        <Route path='/events/:eventId/team' element={<TeamLobby />} />
      </Route>

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}
