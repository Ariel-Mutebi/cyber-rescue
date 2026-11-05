import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'

export default function App() {
  const messages = useQuery(api.messages.list)
  const send = useMutation(api.messages.send)
  const [body, setBody] = useState('')

  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (!body.trim()) return
          await send({ body, author: "tester" })
          setBody("")
        }}
      >
        <input value={body} onChange={(e) => setBody(e.target.value)} />
        <button type="submit">Send</button>
      </form>

      {messages === undefined ? (
        <p>Loading…</p>
      ) : (
        messages.map((m) => (
          <p key={m._id}>
            {m.author}: {m.body}
          </p>
        ))
      )}
    </div>
  )
}
