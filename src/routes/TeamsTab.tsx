import { useOutletContext } from 'react-router'
import type { Doc } from '../../convex/_generated/dataModel'
import TeamSection from './TeamSection'
import CopyLinkButton from '../components/CopyLinkButton'

/** Both dashboards provide this via <Outlet context={…} />. */
export type EventTabContext = { event: Doc<'events'> }

export default function TeamsTab() {
  const { event } = useOutletContext<EventTabContext>()

  return (
    <>
      <TeamSection eventId={event._id} canCreate={event.status !== 'ended'} />
      <CopyLinkButton
        path={`/events/${event._id}/teams`}
        label='Copy participant link'
      />
    </>
  )
}
