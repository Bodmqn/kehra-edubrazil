import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function slugify(text) {
  return text.toLowerCase()
    .replace(/[\u201C\u201D\u0022]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const dataPath = join(__dirname, '..', 'src', 'lib', 'data.ts')
const content = readFileSync(dataPath, 'utf-8')
const nameMatches = content.matchAll(/name:\s*'([^']+)'/g)
const slugs = []
for (const m of nameMatches) {
  slugs.push(slugify(m[1]))
}

const baseUrl = 'https://kehra-edubrazil.netlify.app'
const staticPages = ['', 'universities', 'map', 'matching', 'tracker']

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for (const p of staticPages) {
  xml += `  <url><loc>${baseUrl}/${p}</loc></url>\n`
}
for (const s of slugs) {
  xml += `  <url><loc>${baseUrl}/universities/${s}</loc></url>\n`
}
xml += '</urlset>'

writeFileSync(join(__dirname, '..', 'public', 'sitemap.xml'), xml)
console.log(`Generated sitemap with ${slugs.length} university slugs`)
