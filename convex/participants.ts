import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getParticipant, hashToken } from './lib/participant'
import { randomToken } from './lib/random'

const HANDLE_MAX = 20

export const register = mutation({
  args: { eventId: v.id('events'), handle: v.string() },
  handler: async (ctx, { eventId, handle: rawHandle }) => {
    const event = await ctx.db.get(eventId)
    if (event === null) throw new ConvexError('Event not found')
    if (event.status === 'ended') throw new ConvexError('This event has ended')

    const handle = rawHandle.trim().replace(/\s+/g, ' ').toLowerCase()
    if (handle.length < 2 || handle.length > HANDLE_MAX) {
      throw new ConvexError(`Handle must be 2-${HANDLE_MAX} characters`)
    }

    const taken = await ctx.db
      .query('participants')
      .withIndex('by_event_and_handle', (q) => q.eq('eventId', eventId).eq('handle', handle))
      .first()
    if (taken !== null) throw new ConvexError('That handle is taken. Try another.')

    // the raw token goes to the browser once; only its hash is stored
    const token = randomToken()
    const participantId = await ctx.db.insert('participants', {
      eventId,
      handle,
      tokenHash: await hashToken(token),
    })
    return { participantId, token }
  },
})

// Null when the token is unknown (cleared storage, stale token)
export const me = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const participant = await getParticipant(ctx, token)
    if (participant === null) return null
    return {
      _id: participant._id,
      eventId: participant.eventId,
      handle: participant.handle,
    }
  },
})
