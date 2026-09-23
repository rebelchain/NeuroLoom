import { type ReactNode } from 'react'
import { SectionBackground } from '@/components/SectionBackground'
import { cn } from '@/lib/utils'

type PageHeroProps = {
  badge?: string
  title: string
  accent?: string
  subtitle: string
  media: { kind: 'video' | 'image'; src: string; opacity?: number }
  actions?: ReactNode
}

export function PageHero({ badge, title, accent, subtitle, media, actions }: PageHeroProps) {
  return (
    <div className="relative -mx-6 rounded-b-3xl overflow-hidden liquid-glass-strong animate-fade-in-up mb-8">
      
      <SectionBackground
        kind={media.kind}
        src={media.src}
        opacity={media.opacity ?? 100}
        grain
        overlay="linear-gradient(to bottom, rgba(4,6,13,0.66), rgba(4,6,13,0.62) 42%, rgba(4,6,13,0.86))"
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[300px] border border-primary/[0.07] rounded-full spin-slow pointer-events-none" />
      <div className="orb w-72 h-72 bg-info/10 top-[-120px] right-[8%]" style={{ animationDelay: '1s', animationDuration: '9s' }} />

      <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            {badge && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass text-[11px] uppercase tracking-[0.18em] text-primary mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {badge}
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white">
              {title} {accent && <span className="gradient-text-shimmer">{accent}</span>}
            </h1>
            <p className="text-sm md:text-base text-gray-400 mt-2.5 leading-relaxed">{subtitle}</p>
          </div>
          {actions && <div className="relative z-10">{actions}</div>}
        </div>
      </div>
    </div>
  )
}