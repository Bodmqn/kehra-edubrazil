import { universities } from '@/lib/data'
import { slugify } from '@/lib/utils'
import UniversityDetail from '@/components/UniversityDetail'
import type { University } from '@/lib/types'
import type { Metadata } from 'next'

export function generateStaticParams() {
  return universities.map((u) => ({
    slug: slugify(u.name),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const u = universities.find((x) => slugify(x.name) === slug)
  if (!u) return { title: 'University Not Found' }
  return {
    title: `${u.name} (${u.acronym}) — Graduate Programs`,
    description: `Browse Masters and PhD programs at ${u.name} (${u.acronym}), a ${u.type.toLowerCase()} university in ${u.state}, Brazil.`,
  }
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
