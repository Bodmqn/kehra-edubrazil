export interface University {
  id: string
  sno: number
  name: string
  acronym: string
  region: Region
  state: string
  type: UniversityType
  sigaa_url: string | null
  school_url: string | null
  lat: number | null
  lng: number | null
  logo_url: string | null
}

export interface Program {
  id: string
  university_id: string
  name: string
  level: 'Mestrado' | 'Doutorado' | 'Ambos'
  field: string | null
  deadline: string | null
  status: 'Aberto' | 'Fechado' | 'Em Breve'
  edital_url: string | null
  scraped_at: string | null
}

export interface UniversityDetail {
  id: string
  university_id: string
  about_text: string | null
  history: string | null
  website_description: string | null
  wikipedia_url: string | null
  scraped_at: string | null
}

export interface StudyGuide {
  id: string
  state: string
  city: string | null
  content_type: 'cost_of_living' | 'housing' | 'climate' | 'transport' | 'visa' | 'language'
  content_json: Record<string, unknown>
}

export type Region = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'

export type UniversityType = 'Federal' | 'State'

export interface ProgramWithUniversity extends Program {
  university_name: string
  university_acronym: string
  university_region: string
  university_type: string
}

export interface AvailableProgram {
  name: string
  levelLabel: string
  typeLabel: string
  capesScore: string
  status: string
}

export interface ScrapeLog {
  id: string
  university_id: string
  status: 'success' | 'error' | 'partial'
  programs_found: number
  errors: string | null
  scraped_at: string
}
