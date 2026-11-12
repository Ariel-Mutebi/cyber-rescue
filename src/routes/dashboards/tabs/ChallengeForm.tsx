import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useMutation, useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import { ConvexError } from 'convex/values'
import type { Id } from '../../../../convex/_generated/dataModel'
import { api } from '../../../../convex/_generated/api'

type Difficulty = 1 | 2 | 3

type FormState = {
  title: string
  story: string
  difficulty: Difficulty
  points: string
  flagFormat: string
  flag: string
  scoutTitle: string
  scoutBody: string
  analystTitle: string
  analystBody: string
  operatorTitle: string
  operatorBody: string
  startDir: string
  files: { path: string; content: string }[]
  hints: { minutes: string; penalty: string; text: string }[]
  debrief: string
}

type StringKey = {
  [K in keyof FormState]: FormState[K] extends string ? K : never
}[keyof FormState]

const initialState: FormState = {
  title: '',
  story: '',
  difficulty: 1,
  points: '100',
  flagFormat: 'CTF{...}',
  flag: '',
  scoutTitle: 'Evidence',
  scoutBody: '',
  analystTitle: 'Briefing',
  analystBody: '',
  operatorTitle: 'Toolbox',
  operatorBody: '',
  startDir: '/home/user',
  files: [],
  hints: [],
  debrief: '',
}

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))

type ChallengeDoc = NonNullable<FunctionReturnType<typeof api.challenges.get>>

// Bridges the stored shape (nested, numbers, seconds) to form shape
// (flat, strings, minutes). Inverse of the `payload` built in handleSave.
function fromChallenge(c: ChallengeDoc): FormState {
  return {
    title: c.title,
    story: c.story,
    difficulty: c.difficulty,
    points: String(c.points),
    flagFormat: c.flagFormat,
    flag: '',
    scoutTitle: c.scout.title,
    scoutBody: c.scout.body ?? '',
    analystTitle: c.analyst.title,
    analystBody: c.analyst.body,
    operatorTitle: c.operator.title,
    operatorBody: c.operator.body,
    startDir: c.operator.startDir,
    files: c.operator.files.map((f) => ({ path: f.path, content: f.content })),
    hints: c.hints.map((h) => ({
      minutes: String(h.afterSeconds / 60),
      penalty: String(h.penalty),
      text: h.text,
    })),
    debrief: c.debrief,
  }
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {hint && (
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        )}
      </Box>
      {children}
    </Stack>
  )
}

function ChallengeForm({
  eventId,
  challengeId,
  initial,
  onClose,
}: {
  eventId: Id<'events'>
  challengeId?: Id<'challenges'>
  initial: FormState
  onClose: () => void
}) {
  const create = useMutation(api.challenges.create)
  const update = useMutation(api.challenges.update)
  const remove = useMutation(api.challenges.remove)
  const editing = challengeId !== undefined

  const [form, setForm] = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const bind = (key: StringKey) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(key, e.target.value),
  })

  function setFile(i: number, patch: Partial<FormState['files'][number]>) {
    set(
      'files',
      form.files.map((f, j) => (j === i ? { ...f, ...patch } : f)),
    )
  }

  function setHint(i: number, patch: Partial<FormState['hints'][number]>) {
    set(
      'hints',
      form.hints.map((h, j) => (j === i ? { ...h, ...patch } : h)),
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title,
        story: form.story,
        difficulty: form.difficulty,
        points: num(form.points),
        flagFormat: form.flagFormat,
        scout: { title: form.scoutTitle, body: form.scoutBody },
        analyst: { title: form.analystTitle, body: form.analystBody },
        operator: {
          title: form.operatorTitle,
          body: form.operatorBody,
          startDir: form.startDir,
          files: form.files,
        },
        hints: form.hints
          .map((h) => ({
            afterSeconds: Math.round(num(h.minutes) * 60),
            penalty: num(h.penalty),
            text: h.text,
          }))
          .sort((a, b) => a.afterSeconds - b.afterSeconds),
        debrief: form.debrief,
      }

      if (challengeId !== undefined) {
        await update({
          challengeId,
          ...payload,
          // Stored flag is a hash the client never sees; blank = keep.
          ...(form.flag.trim() !== '' && { flag: form.flag }),
        })
      } else {
        await create({ eventId, ...payload, flag: form.flag })
      }
      onClose()
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : 'Something went wrong')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (challengeId === undefined) return
    if (!window.confirm('Delete this challenge?')) return

    setSaving(true)
    setError(null)
    try {
      await remove({ challengeId })
      onClose()
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <Dialog
      fullScreen
      open
      onClose={onClose}
    >
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {editing ? 'Edit challenge' : 'New challenge'}
          </Typography>
          {editing && (
            <Button variant="outlined" color="error" disabled={saving} onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button variant="outlined" color="success" onClick={handleSave} disabled={saving}>
            Save
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={5}>
          <Section title="Basics">
            <TextField label="Title" fullWidth {...bind('title')} />
            <TextField
              label="Story"
              helperText="Shown to all three roles"
              multiline
              minRows={3}
              fullWidth
              {...bind('story')}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Difficulty"
                sx={{ minWidth: 160 }}
                value={form.difficulty}
                onChange={(e) =>
                  set('difficulty', Number(e.target.value) as Difficulty)
                }
              >
                <MenuItem value={1}>Easy</MenuItem>
                <MenuItem value={2}>Medium</MenuItem>
                <MenuItem value={3}>Hard</MenuItem>
              </TextField>
              <TextField label="Points" type="number" {...bind('points')} />
            </Stack>
          </Section>

          <Section title="Flag">
            <TextField
              label={editing ? 'New flag' : 'Flag'}
              helperText={
                editing ? 'Leave blank to keep the current flag' : undefined
              }
              fullWidth
              {...bind('flag')}
            />
            <TextField
              label="Flag format"
              helperText="Shown to the team, e.g. CTF{...}"
              fullWidth
              {...bind('flagFormat')}
            />
          </Section>

          <Section
            title="Scout"
            hint="Only the Scout sees this. Put the raw evidence here."
          >
            <TextField label="Title" fullWidth {...bind('scoutTitle')} />
            <TextField
              label="Evidence (markdown)"
              multiline
              minRows={4}
              fullWidth
              {...bind('scoutBody')}
            />
          </Section>

          <Section
            title="Analyst"
            hint="Only the Analyst sees this: the key, the rules, what to look for."
          >
            <TextField label="Title" fullWidth {...bind('analystTitle')} />
            <TextField
              label="Briefing (markdown)"
              multiline
              minRows={4}
              fullWidth
              {...bind('analystBody')}
            />
          </Section>

          <Section
            title="Operator"
            hint="Only the Operator sees this, plus the terminal and its files."
          >
            <TextField label="Title" fullWidth {...bind('operatorTitle')} />
            <TextField
              label="Briefing (markdown)"
              multiline
              minRows={4}
              fullWidth
              {...bind('operatorBody')}
            />
            <TextField
              label="Start directory"
              helperText="Absolute path the shell starts in"
              fullWidth
              {...bind('startDir')}
            />

            {form.files.map((f, i) => (
              <Stack key={i} spacing={1}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="File path"
                    size="small"
                    fullWidth
                    value={f.path}
                    onChange={(e) => setFile(i, { path: e.target.value })}
                  />
                  <Button
                    variant="contained"
                    onClick={() =>
                      set(
                        'files',
                        form.files.filter((_, j) => j !== i),
                      )
                    }
                  >
                    Remove
                  </Button>
                </Stack>
                <TextField
                  label="Content"
                  multiline
                  minRows={2}
                  fullWidth
                  sx={{ '& textarea': { fontFamily: 'monospace' } }}
                  value={f.content}
                  onChange={(e) => setFile(i, { content: e.target.value })}
                />
              </Stack>
            ))}
            <Box>
              <Button
                onClick={() =>
                  set('files', [
                    ...form.files,
                    { path: `${form.startDir}/`, content: '' },
                  ])
                }
              >
                Add file
              </Button>
            </Box>
          </Section>

          <Section title="Hints" hint="Each costs points once the team unlocks it.">
            {form.hints.map((h, i) => (
              <Stack key={i} direction="row" spacing={1}>
                <TextField
                  label="After (min)"
                  type="number"
                  size="small"
                  sx={{ width: 120 }}
                  value={h.minutes}
                  onChange={(e) => setHint(i, { minutes: e.target.value })}
                />
                <TextField
                  label="Penalty"
                  type="number"
                  size="small"
                  sx={{ width: 120 }}
                  value={h.penalty}
                  onChange={(e) => setHint(i, { penalty: e.target.value })}
                />
                <TextField
                  label="Hint text"
                  size="small"
                  multiline
                  fullWidth
                  value={h.text}
                  onChange={(e) => setHint(i, { text: e.target.value })}
                />
                <Button
                  color="error"
                  onClick={() =>
                    set(
                      'hints',
                      form.hints.filter((_, j) => j !== i),
                    )
                  }
                >
                  Remove
                </Button>
              </Stack>
            ))}
            <Box>
              <Button
                onClick={() =>
                  set('hints', [
                    ...form.hints,
                    { minutes: '5', penalty: '10', text: '' },
                  ])
                }
              >
                Add hint
              </Button>
            </Box>
          </Section>

          <Section
            title="Debrief"
            hint="Shown after the team solves it. What did they just learn?"
          >
            <TextField multiline minRows={3} fullWidth {...bind('debrief')} />
          </Section>
        </Stack>
      </Container>

      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setError(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Dialog>
  )
}

export default function ChallengeFormDialog({
  eventId,
  challengeId,
  onClose,
}: {
  eventId: Id<'events'>
  challengeId?: Id<'challenges'>
  onClose: () => void
}) {
  const challenge = useQuery(
    api.challenges.get,
    challengeId === undefined ? 'skip' : { challengeId },
  )

  useEffect(() => {
    if (challenge === null) onClose()
  }, [challenge, onClose])

  if (challengeId === undefined) {
    return (
      <ChallengeForm
        eventId={eventId}
        initial={initialState}
        onClose={onClose}
      />
    )
  }

  if (challenge === undefined) {
    return (
      <Dialog fullScreen open onClose={onClose}>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </Dialog>
    )
  }

  if (challenge === null) return null

  return (
    <ChallengeForm
      key={challengeId}
      eventId={eventId}
      challengeId={challengeId}
      initial={fromChallenge(challenge)}
      onClose={onClose}
    />
  )
}
