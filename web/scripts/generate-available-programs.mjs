import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CSV_PATH = path.join(__dirname, '../../brazil_graduate_courses.csv')
const OUT_PATH = path.join(__dirname, '../src/lib/available-programs.ts')

const universities = [
  { id: '1', name: 'Universidade Estadual de Roraima' },
  { id: '2', name: 'Universidade Estadual do Tocantins' },
  { id: '3', name: 'Universidade Federal Rural da Amazônia' },
  { id: '4', name: 'Universidade Federal de Rondônia' },
  { id: '5', name: 'Universidade Federal de Roraima' },
  { id: '6', name: 'Universidade Federal do Acre' },
  { id: '7', name: 'Universidade Federal do Amapá' },
  { id: '8', name: 'Universidade Federal do Amazonas' },
  { id: '9', name: 'Universidade Federal do Norte do Tocantins' },
  { id: '10', name: 'Universidade Federal do Oeste do Pará' },
  { id: '11', name: 'Universidade Federal do Pará' },
  { id: '12', name: 'Universidade Federal do Sul e Sudeste do Pará' },
  { id: '13', name: 'Universidade Federal do Tocantins' },
  { id: '14', name: 'Universidade do Estado do Amazonas' },
  { id: '15', name: 'Universidade do Estado do Pará' },
  { id: '16', name: 'Universidade Estadual Vale do Acaraú' },
  { id: '17', name: 'Universidade Estadual da Paraíba' },
  { id: '18', name: 'Universidade Estadual da Região Tocantina do Maranhão' },
  { id: '19', name: 'Universidade Estadual de Alagoas' },
  { id: '20', name: 'Universidade Estadual de Ciências da Saúde de Alagoas' },
  { id: '21', name: 'Universidade Estadual de Feira de Santana' },
  { id: '22', name: 'Universidade Estadual de Santa Cruz' },
  { id: '23', name: 'Universidade Estadual do Ceará' },
  { id: '24', name: 'Universidade Estadual do Maranhão' },
  { id: '25', name: 'Universidade Estadual do Piauí' },
  { id: '26', name: 'Universidade Estadual do Sudoeste da Bahia' },
  { id: '27', name: 'Universidade Federal Rural de Pernambuco' },
  { id: '28', name: 'Universidade Federal Rural do Semi-Árido' },
  { id: '29', name: 'Universidade Federal da Bahia' },
  { id: '30', name: 'Universidade Federal da Lusofonia Afro-Brasileira' },
  { id: '31', name: 'Universidade Federal da Paraíba' },
  { id: '32', name: 'Universidade Federal de Alagoas' },
  { id: '33', name: 'Universidade Federal de Campina Grande' },
  { id: '34', name: 'Universidade Federal de Pernambuco' },
  { id: '35', name: 'Universidade Federal de Sergipe' },
  { id: '36', name: 'Universidade Federal do Agreste de Pernambuco' },
  { id: '37', name: 'Universidade Federal do Cariri' },
  { id: '38', name: 'Universidade Federal do Ceará' },
  { id: '39', name: 'Universidade Federal do Delta do Parnaíba' },
  { id: '40', name: 'Universidade Federal do Maranhão' },
  { id: '41', name: 'Universidade Federal do Oeste da Bahia' },
  { id: '42', name: 'Universidade Federal do Piauí' },
  { id: '43', name: 'Universidade Federal do Recôncavo da Bahia' },
  { id: '44', name: 'Universidade Federal do Rio Grande do Norte' },
  { id: '45', name: 'Universidade Federal do Sul da Bahia' },
  { id: '46', name: 'Universidade Federal do Vale do São Francisco' },
  { id: '47', name: 'Universidade Regional do Cariri' },
  { id: '48', name: 'Universidade de Pernambuco' },
  { id: '49', name: 'Universidade do Estado da Bahia' },
  { id: '50', name: 'Universidade do Estado do Rio Grande do Norte' },
  { id: '51', name: 'Universidade Estadual de Goiás' },
  { id: '52', name: 'Universidade Estadual de Mato Grosso do Sul' },
  { id: '53', name: 'Universidade Federal da Grande Dourados' },
  { id: '54', name: 'Universidade Federal de Catalão' },
  { id: '55', name: 'Universidade Federal de Goiás' },
  { id: '56', name: 'Universidade Federal de Jataí' },
  { id: '57', name: 'Universidade Federal de Mato Grosso' },
  { id: '58', name: 'Universidade Federal de Mato Grosso do Sul' },
  { id: '59', name: 'Universidade Federal de Rondonópolis' },
  { id: '60', name: 'Universidade de Brasília' },
  { id: '61', name: 'Universidade do Estado de Mato Grosso' },
  { id: '62', name: 'Fundação Centro Universitário Zona Oeste do Rio de Janeiro' },
  { id: '63', name: 'Universidade Estadual Paulista "Júlio de Mesquita Filho"' },
  { id: '64', name: 'Universidade Estadual de Campinas' },
  { id: '65', name: 'Universidade Estadual de Montes Claros' },
  { id: '66', name: 'Universidade Estadual do Norte Fluminense' },
  { id: '67', name: 'Universidade Federal Fluminense' },
  { id: '68', name: 'Universidade Federal Rural do Rio de Janeiro' },
  { id: '69', name: 'Universidade Federal de Alfenas' },
  { id: '70', name: 'Universidade Federal de Itajubá' },
  { id: '71', name: 'Universidade Federal de Juiz de Fora' },
  { id: '72', name: 'Universidade Federal de Lavras' },
  { id: '73', name: 'Universidade Federal de Minas Gerais' },
  { id: '74', name: 'Universidade Federal de Ouro Preto' },
  { id: '75', name: 'Universidade Federal de São Carlos' },
  { id: '76', name: 'Universidade Federal de São João del-Rei' },
  { id: '77', name: 'Universidade Federal de São Paulo' },
  { id: '78', name: 'Universidade Federal de Uberlândia' },
  { id: '79', name: 'Universidade Federal de Viçosa' },
  { id: '80', name: 'Universidade Federal do ABC' },
  { id: '81', name: 'Universidade Federal do Espírito Santo' },
  { id: '82', name: 'Universidade Federal do Estado do Rio de Janeiro' },
  { id: '83', name: 'Universidade Federal do Rio de Janeiro' },
  { id: '84', name: 'Universidade Federal do Triângulo Mineiro' },
  { id: '85', name: 'Universidade Federal dos Vales do Jequitinhonha e Mucuri' },
  { id: '86', name: 'Universidade Virtual do Estado de São Paulo' },
  { id: '87', name: 'Universidade de São Paulo' },
  { id: '88', name: 'Universidade do Estado de Minas Gerais' },
  { id: '89', name: 'Universidade do Estado do Rio de Janeiro' },
  { id: '90', name: 'Universidade Estadual de Londrina' },
  { id: '91', name: 'Universidade Estadual de Maringá' },
  { id: '92', name: 'Universidade Estadual de Ponta Grossa' },
  { id: '93', name: 'Universidade Estadual do Centro-Oeste' },
  { id: '94', name: 'Universidade Estadual do Norte do Paraná' },
  { id: '95', name: 'Universidade Estadual do Oeste do Paraná' },
  { id: '96', name: 'Universidade Estadual do Paraná' },
  { id: '97', name: 'Universidade Estadual do Rio Grande do Sul' },
  { id: '98', name: 'Universidade Federal da Fronteira Sul' },
  { id: '99', name: 'Universidade Federal da Integração Latino-Americana' },
  { id: '100', name: 'Universidade Federal de Ciências da Saúde de Porto Alegre' },
  { id: '101', name: 'Universidade Federal de Pelotas' },
  { id: '102', name: 'Universidade Federal de Santa Catarina' },
  { id: '103', name: 'Universidade Federal de Santa Maria' },
  { id: '104', name: 'Universidade Federal do Pampa' },
  { id: '105', name: 'Universidade Federal do Paraná' },
  { id: '106', name: 'Universidade Federal do Rio Grande' },
  { id: '107', name: 'Universidade Federal do Rio Grande do Sul' },
  { id: '108', name: 'Universidade Tecnológica Federal do Paraná' },
  { id: '109', name: 'Universidade do Estado de Santa Catarina' },
]

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[""]/g, '')
    .replace(/[-,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[""]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const LEVEL_MAP = {
  'MESTRADO': 'Mestrado',
  'DOUTORADO': 'Doutorado',
  'MESTRADO/DOUTORADO': 'Mestrado e Doutorado',
  'MESTRADO PROFISSIONAL': 'Mestrado Profissional',
  'DOUTORADO PROFISSIONAL': 'Doutorado Profissional',
  'MESTRADO PROFISSIONAL/DOUTORADO PROFISSIONAL': 'Mestrado e Doutorado Profissional',
}

const TYPE_MAP = {
  'ACADÊMICO': 'Acadêmico',
  'PROFISSIONAL': 'Profissional',
}

function parseCSV(text) {
  const rows = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line) continue
    if (i === 0) continue

    const fields = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())

    if (fields.length >= 6) {
      rows.push({
        University: fields[0],
        Program: fields[1],
        Level: fields[2],
        Type: fields[3],
        CAPES_Score: fields[4],
        Status: fields[5],
      })
    }
  }
  return rows
}

// Build lookup from normalized name to university data (id + slug)
const nameLookup = {}
for (const u of universities) {
  nameLookup[normalizeName(u.name)] = { id: u.id, slug: slugify(u.name) }
}

const csvText = readFileSync(CSV_PATH, 'utf-8')
const rows = parseCSV(csvText)

const availablePrograms = {}
let matched = 0
let unmatchedNames = new Set()

for (const row of rows) {
  const normalized = normalizeName(row.University)
  const uni = nameLookup[normalized]

  if (uni) {
    matched++
    const slug = uni.slug
    if (!availablePrograms[slug]) availablePrograms[slug] = []
    availablePrograms[slug].push({
      name: row.Program,
      levelLabel: LEVEL_MAP[row.Level] || row.Level,
      typeLabel: TYPE_MAP[row.Type] || row.Type,
      capesScore: row.CAPES_Score,
      status: row.Status === 'EM FUNCIONAMENTO' ? 'active' : 'deactivated',
    })
  } else {
    unmatchedNames.add(row.University)
  }
}

const unmatched = unmatchedNames.size

// Sort programs alphabetically within each university
for (const slug of Object.keys(availablePrograms)) {
  availablePrograms[slug].sort((a, b) => a.name.localeCompare(b.name))
}

let output = `// Auto-generated from brazil_graduate_courses.csv
import type { AvailableProgram } from './types'

export const availablePrograms: Record<string, AvailableProgram[]> = {\n`

const slugs = Object.keys(availablePrograms).sort()
for (const slug of slugs) {
  const programs = availablePrograms[slug]
  output += `  '${slug}': [\n`
  for (const p of programs) {
    output += `    { name: ${JSON.stringify(p.name)}, levelLabel: ${JSON.stringify(p.levelLabel)}, typeLabel: ${JSON.stringify(p.typeLabel)}, capesScore: ${JSON.stringify(p.capesScore)}, status: ${JSON.stringify(p.status)} },\n`
  }
  output += '  ],\n'
}

output += '}\n'

writeFileSync(OUT_PATH, output, 'utf-8')

console.log(`\nDone! Generated ${OUT_PATH}`)
console.log(`  CSV rows parsed: ${rows.length}`)
console.log(`  Matched: ${matched}`)
console.log(`  Unmatched universities: ${unmatched}`)
if (unmatchedNames.size > 0) {
  console.log(`  Unmatched names:`)
  for (const name of unmatchedNames) {
    console.log(`    - "${name}"`)
  }
}
console.log(`  Universities with programs: ${Object.keys(availablePrograms).length}`)
