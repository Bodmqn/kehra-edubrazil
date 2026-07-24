import { universities as allUniversities } from '@/lib/data'
import DetailsContent from './content'

export async function generateStaticParams() {
  return allUniversities.map((u) => ({ id: u.id }))
}

export default function AdminUniversityDetailsPage() {
  return <DetailsContent />
}
