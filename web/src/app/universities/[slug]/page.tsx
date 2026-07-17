import { universities } from '@/lib/data'
import { slugify } from '@/lib/utils'
import UniversityDetail from '@/components/UniversityDetail'

export function generateStaticParams() {
  return universities.map((u) => ({
    slug: slugify(u.name),
  }))
}

export default function Page({ params }: { params: { slug: string } }) {
  return <UniversityDetail slug={params.slug} />
}
