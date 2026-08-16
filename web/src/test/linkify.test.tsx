import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { hasUrl, linkifyText } from '@/lib/linkify'

describe('hasUrl', () => {
  it('returns true when the text contains an http(s) link', () => {
    expect(hasUrl('Check https://ufba.br/en for details')).toBe(true)
    expect(hasUrl('See http://example.com now')).toBe(true)
  })

  it('returns false when there is no link', () => {
    expect(hasUrl('Send transcripts to USP')).toBe(false)
    expect(hasUrl('')).toBe(false)
  })

  it('ignores bare domains without a scheme', () => {
    expect(hasUrl('Visit www.ufba.br')).toBe(false)
  })
})

describe('linkifyText', () => {
  it('returns the text unchanged when it has no URL', () => {
    expect(renderToStaticMarkup(<>{linkifyText('Send transcripts to USP')}</>)).toBe(
      'Send transcripts to USP'
    )
  })

  it('wraps a URL in a link that opens in a new tab', () => {
    const html = renderToStaticMarkup(<>{linkifyText('Check https://ufba.br/en now')}</>)
    expect(html).toContain('<a href="https://ufba.br/en"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('wraps multiple URLs in separate links', () => {
    const html = renderToStaticMarkup(
      <>
        {linkifyText('See https://ufba.br and https://usp.br/en/graduate')}
      </>
    )
    expect(html).toContain('<a href="https://ufba.br"')
    expect(html).toContain('<a href="https://usp.br/en/graduate"')
  })

  it('strips trailing punctuation from the link', () => {
    const html = renderToStaticMarkup(<>{linkifyText('See https://ufba.br/en.')}</>)
    expect(html).toContain('<a href="https://ufba.br/en"')
    expect(html).not.toContain('href="https://ufba.br/en."')
  })

  it('leaves bare domains without a scheme untouched', () => {
    const html = renderToStaticMarkup(<>{linkifyText('Visit www.ufba.br')}</>)
    expect(html).toBe('Visit www.ufba.br')
  })
})