import { useState } from 'react'
import { Button } from '@mui/material'
import LinkIcon from '@mui/icons-material/Link'

export default function CopyLinkButton({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked: nothing to do
    }
  }

  return (
    <Button size='small' startIcon={<LinkIcon />} onClick={() => void copy()}>
      {copied ? 'Copied' : label}
    </Button>
  )
}
