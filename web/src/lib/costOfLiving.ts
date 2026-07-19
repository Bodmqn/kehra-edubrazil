export interface CostData {
  capital: string
  brlRange: string
  usdRange: string
  level: string
}

export const COST_OF_LIVING: Record<string, CostData> = {
  'Acre': { capital: 'Rio Branco', brlRange: 'R$ 2,800–4,000', usdRange: '$510–730', level: 'Medium' },
  'Alagoas': { capital: 'Maceió', brlRange: 'R$ 2,900–4,200', usdRange: '$530–760', level: 'Medium' },
  'Amapá': { capital: 'Macapá', brlRange: 'R$ 3,000–4,300', usdRange: '$550–780', level: 'Medium' },
  'Amazonas': { capital: 'Manaus', brlRange: 'R$ 3,200–4,800', usdRange: '$580–870', level: 'Medium-High' },
  'Bahia': { capital: 'Salvador', brlRange: 'R$ 3,200–5,000', usdRange: '$580–910', level: 'High' },
  'Ceará': { capital: 'Fortaleza', brlRange: 'R$ 3,000–4,700', usdRange: '$550–850', level: 'Medium' },
  'Distrito Federal': { capital: 'Brasília', brlRange: 'R$ 3,800–5,800', usdRange: '$690–1,050', level: 'High' },
  'Espírito Santo': { capital: 'Vitória', brlRange: 'R$ 3,500–5,300', usdRange: '$640–960', level: 'High' },
  'Goiás': { capital: 'Goiânia', brlRange: 'R$ 2,900–4,500', usdRange: '$530–820', level: 'Medium' },
  'Maranhão': { capital: 'São Luís', brlRange: 'R$ 2,700–4,100', usdRange: '$490–750', level: 'Low-Medium' },
  'Mato Grosso': { capital: 'Cuiabá', brlRange: 'R$ 3,000–4,600', usdRange: '$550–840', level: 'Medium' },
  'Mato Grosso do Sul': { capital: 'Campo Grande', brlRange: 'R$ 2,900–4,400', usdRange: '$530–800', level: 'Medium' },
  'Minas Gerais': { capital: 'Belo Horizonte', brlRange: 'R$ 3,200–4,900', usdRange: '$580–890', level: 'Medium-High' },
  'Pará': { capital: 'Belém', brlRange: 'R$ 3,000–4,500', usdRange: '$550–820', level: 'Medium' },
  'Paraíba': { capital: 'João Pessoa', brlRange: 'R$ 2,800–4,200', usdRange: '$510–760', level: 'Medium' },
  'Paraná': { capital: 'Curitiba', brlRange: 'R$ 3,400–5,200', usdRange: '$620–950', level: 'High' },
  'Pernambuco': { capital: 'Recife', brlRange: 'R$ 3,200–4,900', usdRange: '$580–890', level: 'High' },
  'Piauí': { capital: 'Teresina', brlRange: 'R$ 2,700–4,000', usdRange: '$490–730', level: 'Low' },
  'Rio de Janeiro': { capital: 'Rio de Janeiro', brlRange: 'R$ 4,000–6,500', usdRange: '$730–1,180', level: 'Very High' },
  'Rio Grande do Norte': { capital: 'Natal', brlRange: 'R$ 2,900–4,300', usdRange: '$530–780', level: 'Medium' },
  'Rio Grande do Sul': { capital: 'Porto Alegre', brlRange: 'R$ 3,300–5,000', usdRange: '$600–910', level: 'High' },
  'Rondônia': { capital: 'Porto Velho', brlRange: 'R$ 2,900–4,300', usdRange: '$530–780', level: 'Medium' },
  'Roraima': { capital: 'Boa Vista', brlRange: 'R$ 2,800–4,200', usdRange: '$510–760', level: 'Medium' },
  'Santa Catarina': { capital: 'Florianópolis', brlRange: 'R$ 3,700–5,800', usdRange: '$670–1,050', level: 'High' },
  'São Paulo': { capital: 'São Paulo', brlRange: 'R$ 4,300–7,000', usdRange: '$780–1,270', level: 'Very High' },
  'Sergipe': { capital: 'Aracaju', brlRange: 'R$ 2,800–4,100', usdRange: '$510–750', level: 'Medium' },
  'Tocantins': { capital: 'Palmas', brlRange: 'R$ 2,900–4,200', usdRange: '$530–760', level: 'Medium' },
}
