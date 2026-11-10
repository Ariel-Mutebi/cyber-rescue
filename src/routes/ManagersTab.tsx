import { useOutletContext } from 'react-router'
import ManagerSection from './ManagerSection'
import type { EventTabContext } from './TeamsTab'

export default function ManagersTab() {
  const { event } = useOutletContext<EventTabContext>()

  return (
    <ManagerSection eventId={event._id} canAdd={event.status !== 'ended'} />
  )
}
