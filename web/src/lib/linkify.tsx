import React from 'react'

const URL_REGEX = /(https?:\/\/[^\s]+)/g

export function hasUrl(text: string): boolean {
  return /https?:\/\/[^\s]+/.test(text)
}

export function linkifyText(text: string): React.ReactNode {
  const parts = text.split(URL_REGEX)
  return parts.map((part, i) => {
    if (i % 2 === 0) return <React.Fragment key={i}>{part}</React.Fragment>
    const href = part.replace(/[.,;:!?)\]]+$/, '')
    return (
      <a
        key={i}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[var(--bg-accent)] underline underline-offset-2 hover:brightness-90"
        onClick={(e) => e.stopPropagation()}
      >
        {href}
      </a>
    )
  })
}