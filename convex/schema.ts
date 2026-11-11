import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export const TEAM_SIZE = 3
export const ROLES = ['scout', 'analyst', 'operator'] as const

export default defineSchema({
  ...authTables,

  // Creators (verified email) and managers (temporary username/password)
  users: defineTable({
    // fields Convex Auth expects
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    // ours
    accountType: v.union(v.literal('creator'), v.literal('manager')),
    managerOfEventId: v.optional(v.id('events')),
    createdBy: v.optional(v.id('users')),
    expiresAt: v.optional(v.number()),
  })
    .index('email', ['email']) // required by Convex Auth
    .index('by_event', ['managerOfEventId'])
    .index('by_expires_at', ['expiresAt']), // cron cleanup of temporary accounts

  events: defineTable({
    creatorId: v.id('users'),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.number(),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    status: v.union(
      v.literal('scheduled'),
      v.literal('live'),
      v.literal('ended'),
    ),
    tripleLockWindowMs: v.number(), // 30_000
  }).index('by_creator', ['creatorId']).index('by_status_and_scheduled_at', ['status', 'scheduledAt']),

  // One-off identity: handle only, no personal info.
  // The raw session token lives in the browser; only its hash is stored.
  participants: defineTable({
    eventId: v.id('events'),
    handle: v.string(),
    tokenHash: v.string(),
  })
    .index('by_token', ['tokenHash'])
    .index('by_event_and_handle', ['eventId', 'handle']), // reject duplicate handles

  // Team rooms (always TEAM_SIZE members)
  teams: defineTable({
    eventId: v.id('events'),
    name: v.string(),
    createdBy: v.id('users'),
    joinCode: v.string(), // powers the shareable join link
    memberCount: v.number(), // 0..TEAM_SIZE; full when === TEAM_SIZE
    unlockedAt: v.optional(v.number()), // set when the triple-lock succeeds
    score: v.number(),
    lastSolvedAt: v.optional(v.number()), // leaderboard tie-breaker
  })
    .index('by_join_code', ['joinCode'])
    .index('by_event', ['eventId'])
    // open rooms: eventId == X and memberCount < TEAM_SIZE
    .index('by_event_and_member_count', ['eventId', 'memberCount'])
    // leaderboard: score, then who solved earliest
    .index('by_event_and_score', ['eventId', 'score', 'lastSolvedAt']),

  teamMembers: defineTable({
    teamId: v.id('teams'),
    eventId: v.id('events'),
    participantId: v.id('participants'),
    seat: v.number(), // 0..2, fixed for the whole event
    joinedAt: v.number(),
  })
    .index('by_team', ['teamId'])
    .index('by_event_and_participant', ['eventId', 'participantId']), // one team per event

  // Triple-lock: one press per participant, upserted
  lockPresses: defineTable({
    teamId: v.id('teams'),
    participantId: v.id('participants'),
    pressedAt: v.number(),
  })
    .index('by_team', ['teamId'])
    .index('by_team_and_participant', ['teamId', 'participantId']),

  // Challenge library: owned by a creator, reusable across events.
  // Never return a whole document to a participant: always project only the
  // fields their role may see (scout / analyst / operator), and never flagHash.
  challenges: defineTable({
    ownerId: v.id('users'),
    title: v.string(),
    story: v.string(), // shared framing every role sees
    difficulty: v.union(v.literal(1), v.literal(2), v.literal(3)),
    points: v.number(),
    flagFormat: v.string(),
    flagHash: v.string(), // sha256 of the normalised flag
    // each role sees only its own piece
    scout: v.object({
      title: v.string(), // e.g. 'Evidence'
      body: v.optional(v.string()), // markdown / raw text
      fileId: v.optional(v.id('_storage')), // image or file evidence
    }),
    analyst: v.object({
      title: v.string(), // e.g. 'Briefing'
      body: v.string(), // markdown
    }),
    operator: v.object({
      title: v.string(), // e.g. 'Toolbox'
      body: v.string(), // markdown briefing: tools, flag format hints
      startDir: v.string(), // cwd of the simulated shell
      // Virtual filesystem preloaded into just-bash. Content is inline text.
      files: v.array(v.object({ path: v.string(), content: v.string() })),
    }),
    // hints a team can unlock, each costing points
    hints: v.array(v.object({
      afterSeconds: v.number(), // earliest the hint can be requested
      text: v.string(),
      penalty: v.number(),
    })),
    debrief: v.string(), // what the team learned, shown after solving
  }).index('by_owner', ['ownerId']),

  // Which library challenges an event uses, and in what order
  eventChallenges: defineTable({
    eventId: v.id('events'),
    challengeId: v.id('challenges'),
    order: v.number(), // position in the event's sequence
  })
    .index('by_event_and_order', ['eventId', 'order'])
    .index('by_challenge', ['challengeId']), // check usage before deleting a challenge

  // A team's progress through one challenge
  teamChallenges: defineTable({
    teamId: v.id('teams'),
    challengeId: v.id('challenges'),
    eventId: v.id('events'),
    rotation: v.number(), // 0 for the team's first challenge, then 1, 2...
    status: v.union(v.literal('active'), v.literal('solved')),
    hintsUsed: v.number(),
    startedAt: v.number(),
    solvedAt: v.optional(v.number()),
    pointsAwarded: v.optional(v.number()), // points minus hint penalties, fixed at solve time
  })
    .index('by_team', ['teamId'])
    .index('by_team_and_challenge', ['teamId', 'challengeId']),

  // Audit log of every flag attempt (rate limiting uses the rate-limiter component)
  submissions: defineTable({
    teamId: v.id('teams'),
    challengeId: v.id('challenges'),
    participantId: v.id('participants'),
    correct: v.boolean(),
    submittedAt: v.number(),
  })
    .index('by_team_and_challenge', ['teamId', 'challengeId'])
    .index('by_participant', ['participantId']),

  // Team chat; managers can post when helping a stuck team
  messages: defineTable({
    teamId: v.id('teams'),
    author: v.union(
      v.object({ kind: v.literal('participant'), id: v.id('participants') }),
      v.object({ kind: v.literal('manager'), id: v.id('users') }),
    ),
    body: v.string(),
  }).index('by_team', ['teamId']),

  feedback: defineTable({
    eventId: v.id('events'),
    participantId: v.id('participants'),
    rating: v.number(),
    comments: v.optional(v.string()),
  })
    .index('by_event', ['eventId'])
    .index('by_event_and_participant', ['eventId', 'participantId']), // one per person

  certificates: defineTable({
    eventId: v.id('events'),
    participantId: v.id('participants'),
    code: v.string(), // verification code
    issuedAt: v.number(),
  })
    .index('by_participant', ['participantId'])
    .index('by_code', ['code']),
})
