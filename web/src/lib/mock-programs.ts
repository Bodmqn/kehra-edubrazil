import type { Program } from './types'

const programNames: Record<string, { name: string; field: string }[]> = {
  USP: [
    { name: 'Mestrado em Ciência da Computação', field: 'Computer Science' },
    { name: 'Doutorado em Ciência da Computação', field: 'Computer Science' },
    { name: 'Mestrado em Engenharia Elétrica', field: 'Engineering' },
    { name: 'Doutorado em Engenharia Elétrica', field: 'Engineering' },
    { name: 'Mestrado em Física', field: 'Physical Sciences' },
    { name: 'Doutorado em Física', field: 'Physical Sciences' },
    { name: 'Mestrado em Biologia Molecular', field: 'Biological Sciences' },
    { name: 'Doutorado em Biologia Molecular', field: 'Biological Sciences' },
  ],
  UNICAMP: [
    { name: 'Mestrado em Engenharia Mecânica', field: 'Engineering' },
    { name: 'Doutorado em Engenharia Mecânica', field: 'Engineering' },
    { name: 'Mestrado em Química', field: 'Physical Sciences' },
    { name: 'Doutorado em Química', field: 'Physical Sciences' },
    { name: 'Mestrado em Economia', field: 'Economics & Business' },
    { name: 'Doutorado em Economia', field: 'Economics & Business' },
  ],
  UFRJ: [
    { name: 'Mestrado em Medicina', field: 'Health Sciences' },
    { name: 'Doutorado em Medicina', field: 'Health Sciences' },
    { name: 'Mestrado em Oceanografia', field: 'Environmental Sciences' },
    { name: 'Doutorado em Oceanografia', field: 'Environmental Sciences' },
    { name: 'Mestrado em Direito', field: 'Law' },
  ],
}

const defaultPrograms = [
  { name: 'Mestrado em Administração', field: 'Economics & Business' },
  { name: 'Doutorado em Administração', field: 'Economics & Business' },
  { name: 'Mestrado em Letras', field: 'Linguistics & Languages' },
  { name: 'Doutorado em Letras', field: 'Linguistics & Languages' },
  { name: 'Mestrado em Educação', field: 'Education' },
  { name: 'Doutorado em Educação', field: 'Education' },
]

function randomDate(from: Date, to: Date): string {
  const date = new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()))
  return date.toISOString().split('T')[0]
}

export function getMockPrograms(acronym: string, universityId: string): Program[] {
  const programs = programNames[acronym] || defaultPrograms

  return programs.map((p, index) => {
    const isOpen = index % 3 !== 2
    return {
      id: `${universityId}-prog-${index}`,
      university_id: universityId,
      name: p.name,
      level: p.name.startsWith('Doutorado') ? 'Doutorado' : 'Mestrado',
      field: p.field,
      deadline: randomDate(new Date('2026-08-01'), new Date('2026-12-15')),
      status: isOpen ? 'Aberto' : Math.random() > 0.5 ? 'Fechado' : 'Em Breve',
      edital_url: null,
      scraped_at: new Date().toISOString(),
    }
  })
}
