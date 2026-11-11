import type { Doc } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

export async function getTeamMembership(
  ctx: QueryCtx,
  participant: Doc<'participants'>,
) {
  return await ctx.db
    .query('teamMembers')
    .withIndex('by_event_and_participant', (q) =>
      q.eq('eventId', participant.eventId).eq('participantId', participant._id),
    )
    .unique()
}
