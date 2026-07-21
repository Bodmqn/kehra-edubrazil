import { universities as allUniversities } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import DetailsContent from './content'

export async function generateStaticParams() {
  const { data } = await supabase.from('universities').select('id')
  if (data && data.length > 0) {
    return data.map((u) => ({ id: u.id }))
  }
  return allUniversities.map((u) => ({ id: u.id }))
}

export default function AdminUniversityDetailsPage() {
  return <DetailsContent />
}
