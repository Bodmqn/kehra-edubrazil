import { universities as allUniversities } from '@/lib/data'
import ProgramsContent from './content'

export function generateStaticParams() {
  return allUniversities.map((u) => ({ id: u.id }))
}

export default function AdminProgramsPage() {
  return <ProgramsContent />
}
