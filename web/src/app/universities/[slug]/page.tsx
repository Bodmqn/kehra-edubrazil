import { universities } from '@/lib/data'
import { slugify } from '@/lib/utils'
import UniversityDetail from '@/components/UniversityDetail'
import type { University } from '@/lib/types'

export function generateStaticParams() {
  return universities.map((u) => ({
    slug: slugify(u.name),
  }))
}

export default function Page({ params }: { params: { slug: string } }) {
  const university: University | undefined = universities.find(
    (u) => slugify(u.name) === params.slug,
  )
  return <UniversityDetail slug={params.slug} fallbackUniversity={university ?? null} />
}
