import type { TrackerProgram } from './trackerTypes'

function stripAccents(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function collapseSpaces(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

export function normalizeName(s: string): string {
  return collapseSpaces(stripAccents(s))
}

export function normalizeLevel(level: string): string {
  return stripAccents(level)
    .replace(/\bprofissional\b/g, 'prof')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function universityBaseName(universityString: string): {
  name: string
  acronym: string | null
} {
  const trimmed = universityString.trim()
  const match = /^(.+?)(?:\s*\(([^)]*)\))?$/.exec(trimmed)
  if (!match) return { name: trimmed, acronym: null }
  const name = match[1].trim()
  const acronym = match[2] ? match[2].trim() : null
  return { name, acronym }
}

export function levelsMatch(savedLevel: string, availableLevelLabel: string): boolean {
  const a = normalizeLevel(savedLevel)
  const b = normalizeLevel(availableLevelLabel)
  if (!a || !b) return false
  if (a === b) return true
  if (a === 'ambos') return b.includes('mestrado') && b.includes('doutorado')
  if (b === 'ambos') return a.includes('mestrado') && a.includes('doutorado')
  const aProf = a.includes('prof')
  const bProf = b.includes('prof')
  if (aProf !== bProf) return false
  return a.includes(b) || b.includes(a)
}

export function findSavedProgram(
  programs: TrackerProgram[],
  university: { name: string; acronym: string },
  programName: string,
  levelLabel: string,
): TrackerProgram | null {
  const uniName = normalizeName(university.name)
  const uniAcronym = normalizeName(university.acronym)
  const targetName = normalizeName(programName)
  for (const p of programs) {
    const { name, acronym } = universityBaseName(p.university)
    const raw = normalizeName(p.university)
    const uniMatches =
      (uniName !== '' && (normalizeName(name) === uniName || raw === uniName)) ||
      (uniAcronym !== '' && acronym !== null && normalizeName(acronym) === uniAcronym) ||
      (uniAcronym !== '' && raw === uniAcronym)
    if (!uniMatches) continue
    if (normalizeName(p.name) !== targetName) continue
    if (!levelsMatch(p.level ?? '', levelLabel)) continue
    return p
  }
  return null
}
