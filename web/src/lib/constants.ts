import type { Region, UniversityType } from './types'

export const REGIONS: { key: Region; label: string; color: string }[] = [
  { key: 'Norte', label: 'Norte', color: '#009739' },
  { key: 'Nordeste', label: 'Nordeste', color: '#FEDD00' },
  { key: 'Centro-Oeste', label: 'Centro-Oeste', color: '#002776' },
  { key: 'Sudeste', label: 'Sudeste', color: '#FF6B35' },
  { key: 'Sul', label: 'Sul', color: '#7C3AED' },
]

export const UNIVERSITY_TYPES: { key: UniversityType; label: string }[] = [
  { key: 'Federal', label: 'Federal' },
  { key: 'State', label: 'State' },
]

export const STATES_BY_REGION: Record<Region, string[]> = {
  Norte: ['Acre', 'Amapá', 'Amazonas', 'Pará', 'Rondônia', 'Roraima', 'Tocantins'],
  Nordeste: [
    'Alagoas',
    'Bahia',
    'Ceará',
    'Maranhão',
    'Paraíba',
    'Pernambuco',
    'Piauí',
    'Rio Grande do Norte',
    'Sergipe',
  ],
  'Centro-Oeste': ['Distrito Federal', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul'],
  Sudeste: ['Espírito Santo', 'Minas Gerais', 'Rio de Janeiro', 'São Paulo'],
  Sul: ['Paraná', 'Rio Grande do Sul', 'Santa Catarina'],
}

export const ALL_STATES = Object.values(STATES_BY_REGION).flat()

export const PROGRAM_FIELDS = [
  'Computer Science',
  'Engineering',
  'Health Sciences',
  'Humanities',
  'Social Sciences',
  'Biological Sciences',
  'Physical Sciences',
  'Mathematics',
  'Arts & Literature',
  'Law',
  'Economics & Business',
  'Education',
  'Agriculture',
  'Environmental Sciences',
  'Linguistics & Languages',
  'Other',
]

export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Universities', href: '/universities' },
  { label: 'Map', href: '/map' },
  { label: 'My Tracker', href: '/tracker' },
  { label: 'About', href: '/about' },
]
