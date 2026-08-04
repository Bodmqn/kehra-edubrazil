import { describe, it, expect } from 'vitest'
import {
  normalizeName,
  normalizeLevel,
  universityBaseName,
  levelsMatch,
  findSavedProgram,
} from '@/lib/savedProgramUtils'
import type { TrackerProgram } from '@/lib/trackerTypes'

function prog(partial: Partial<TrackerProgram>): TrackerProgram {
  return {
    id: 'id',
    name: 'CIÊNCIA DE DADOS',
    university: 'Universidade de Brasília (UnB)',
    deadline: null,
    level: 'Mestrado',
    programUrl: null,
    stage: 'saved',
    priority: 'medium',
    notes: '',
    checklist: [],
    reminderDays: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

describe('normalizeName', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeName('Universidade Federal do Ceará')).toBe('universidade federal do ceara')
  })

  it('collapses extra whitespace', () => {
    expect(normalizeName('  USP  ')).toBe('usp')
  })
})

describe('normalizeLevel', () => {
  it('normalizes profissional variant', () => {
    expect(normalizeLevel('Mestrado Profissional')).toBe('mestrado prof')
  })

  it('normalizes combined levels with accents', () => {
    expect(normalizeLevel('Mestrado e Doutorado')).toBe('mestrado e doutorado')
  })
})

describe('universityBaseName', () => {
  it('parses name with acronym', () => {
    expect(universityBaseName('Universidade de Brasília (UnB)')).toEqual({
      name: 'Universidade de Brasília',
      acronym: 'UnB',
    })
  })

  it('returns null acronym when none present', () => {
    expect(universityBaseName('Universidade de São Paulo')).toEqual({
      name: 'Universidade de São Paulo',
      acronym: null,
    })
  })
})

describe('levelsMatch', () => {
  it('matches exact levels', () => {
    expect(levelsMatch('Mestrado', 'Mestrado')).toBe(true)
    expect(levelsMatch('Mestrado e Doutorado', 'Mestrado e Doutorado')).toBe(true)
  })

  it('matches Ambos against combined level labels', () => {
    expect(levelsMatch('Ambos', 'Mestrado e Doutorado')).toBe(true)
    expect(levelsMatch('Mestrado e Doutorado', 'Ambos')).toBe(true)
  })

  it('matches when saved level is contained in the label', () => {
    expect(levelsMatch('Mestrado', 'Mestrado e Doutorado')).toBe(true)
  })

  it('rejects professional vs academic mismatch', () => {
    expect(levelsMatch('Mestrado', 'Mestrado Profissional')).toBe(false)
    expect(levelsMatch('Mestrado Profissional', 'Mestrado e Doutorado')).toBe(false)
  })

  it('rejects unrelated levels', () => {
    expect(levelsMatch('Doutorado', 'Mestrado')).toBe(false)
  })
})

describe('findSavedProgram', () => {
  const uni = { name: 'Universidade de Brasília', acronym: 'UnB' }

  it('matches by acronym even when names differ', () => {
    const programs = [
      prog({ id: 'a1', university: 'UnB', name: 'CIÊNCIA DE DADOS', level: 'Mestrado' }),
    ]
    const found = findSavedProgram(programs, uni, 'CIÊNCIA DE DADOS', 'Mestrado')
    expect(found?.id).toBe('a1')
  })

  it('matches by full university name', () => {
    const programs = [
      prog({ university: 'Universidade de Brasília (UnB)', name: 'DIREITO', level: 'Mestrado e Doutorado' }),
    ]
    const found = findSavedProgram(programs, uni, 'DIREITO', 'Mestrado e Doutorado')
    expect(found).not.toBeNull()
  })

  it('matches Ambos saved level against combined label', () => {
    const programs = [prog({ university: 'UnB', name: 'DIREITO', level: 'Ambos' })]
    const found = findSavedProgram(programs, uni, 'DIREITO', 'Mestrado e Doutorado')
    expect(found).not.toBeNull()
  })

  it('rejects wrong program name', () => {
    const programs = [prog({ university: 'UnB', name: 'DIREITO', level: 'Mestrado' })]
    expect(findSavedProgram(programs, uni, 'ECONOMIA', 'Mestrado')).toBeNull()
  })

  it('rejects wrong university', () => {
    const programs = [prog({ university: 'Universidade de São Paulo (USP)', name: 'MESTRADO', level: 'Mestrado' })]
    expect(findSavedProgram(programs, uni, 'MESTRADO', 'Mestrado')).toBeNull()
  })

  it('rejects same name on a professional variant', () => {
    const programs = [
      prog({ university: 'UnB', name: 'ADMINISTRAÇÃO', level: 'Mestrado' }),
    ]
    expect(findSavedProgram(programs, uni, 'ADMINISTRAÇÃO', 'Mestrado e Doutorado Profissional')).toBeNull()
  })
})