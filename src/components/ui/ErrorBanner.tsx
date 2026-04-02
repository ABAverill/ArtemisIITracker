'use client'
interface Props {
  message: string
}
export function ErrorBanner({ message }: Props) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 backdrop-blur-md text-amber-400 font-mono text-xs tracking-wider">
      ⚠ {message}
    </div>
  )
}
