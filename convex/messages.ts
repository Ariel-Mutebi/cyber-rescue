import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireParticipant } from './lib/participant'
import { getTeamMembership } from './lib/membership'

const MAX_BODY = 2_000

export const send = mutation({
  args: { token: v.string(), body: v.string() },
  handler: async (ctx, { token, body }) => {
    const participant = await requireParticipant(ctx, token)
    const membership = await getTeamMembership(ctx, participant)
    if (membership === null) throw new ConvexError('Join a team first')

    const trimmed = body.trim()
    if (trimmed.length === 0) throw new ConvexError('Message cannot be empty')
    if (trimmed.length > MAX_BODY) {
      throw new ConvexError(`Message too long (max ${MAX_BODY})`)
    }

    await ctx.db.insert('messages', {
      teamId: membership.teamId,
      author: { kind: 'participant', id: participant._id },
      body: trimmed,
    })
  },
})

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const participant = await requireParticipant(ctx, token)
    const membership = await getTeamMembership(ctx, participant)
    if (membership === null) return null

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_team', (q) => q.eq('teamId', membership.teamId))
      .collect()

    return Promise.all(
      messages.map(async (m) => {
        let handle = 'unknown'
        if (m.author.kind === 'participant') {
          const p = await ctx.db.get(m.author.id)
          handle = p?.handle ?? 'unknown'
        } else {
          const u = await ctx.db.get(m.author.id)
          handle = u?.name ?? 'Manager'
        }
        return {
          _id: m._id,
          handle,
          kind: m.author.kind,
          isMe: m.author.kind === 'participant' && m.author.id === participant._id,
          body: m.body,
        }
      }),
    )
  },
})
