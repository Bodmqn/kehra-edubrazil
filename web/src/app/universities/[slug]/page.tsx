import { universities } from '@/lib/data'
import { slugify } from '@/lib/utils'
import UniversityDetail from '@/components/UniversityDetail'
import type { University } from '@/lib/types'

export function generateStaticParams() {
  return universities.map((u) => ({
    slug: slugify(u.name),
  }))
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const university: University | undefined = universities.find(
    (u) => slugify(u.name) === slug,
  )
  return <UniversityDetail slug={slug} fallbackUniversity={university ?? null} />
}
