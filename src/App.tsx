import { Route, Routes, Navigate } from 'react-router'
import CreatorLayout from './layouts/CreatorLayout'
import SignInLayout from './layouts/SignInLayout'
import CreatorSignIn from './routes/CreatorSignIn'
import NewEvent from './routes/NewEvent'
import CreatorEvents from './routes/CreatorEvents'
import EventDashboard from './routes/dashboards/EventDashboard'
import TeamsTab from './routes/dashboards/tabs/TeamsTab'
import ManagersTab from './routes/dashboards/tabs/ManagersTab'
import DetailsTab from './routes/dashboards/tabs/DetailsTab'
import ChallengeTab from './routes/dashboards/tabs/ChallengeTab'

import ManagerLayout from './layouts/ManagerLayout'
import ManagerSignIn from './routes/ManagerSignIn'
import ManagerDashboard from './routes/dashboards/ManagerDashboard'

import ParticipantLayout from './layouts/ParticipantLayout'
import Home from './routes/Home'
import JoinTeam from './routes/JoinTeam'
import OpenTeams from './routes/OpenTeams'
import TeamLobby from './routes/TeamLobby'

import Play from './routes/play/Play'
import ChallengeLayout from './layouts/ChallengeLayout'
import ChallengeScreen from './routes/challenges/ChallengeScreen'

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
          <Route path='challenges' element={<ChallengeTab />} />
          <Route path='details' element={<DetailsTab />} />
          <Route path='managers' element={<ManagersTab />} />
        </Route>
      </Route>

      <Route path='/manager' element={<ManagerLayout />}>
        <Route element={<ManagerDashboard />}>
          <Route index element={<Navigate to='teams' replace />} />
          <Route path='teams' element={<TeamsTab />} />
          <Route path='challenges' element={<ChallengeTab />} />
          <Route path='details' element={<DetailsTab />} />
        </Route>
      </Route>

      <Route element={<ParticipantLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/join/:code' element={<JoinTeam />} />
        <Route path='/events/:eventId/teams' element={<OpenTeams />} />
        <Route path='/events/:eventId/team' element={<TeamLobby />} />
        <Route path="/events/:eventId/play" element={<Play />} />
      </Route>

      <Route path="/events/:eventId/challenge" element={<ChallengeLayout />}>
        <Route index element={<ChallengeScreen />} />
      </Route>

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}
