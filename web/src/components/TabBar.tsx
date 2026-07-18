'use client'

interface Tab {
  key: string
  label: string
}

interface TabBarProps {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-[var(--border)]" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-6 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
            active === tab.key
              ? 'border-[var(--bg-primary)] text-white'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
