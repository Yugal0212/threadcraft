import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

// ─── Router context ──────────────────────────────────────────────────────────

interface RouterContextValue {
  path: string
  search: Record<string, string>
  navigate: (to: string) => void
}

const RouterContext = createContext<RouterContextValue>({
  path: '/',
  search: {},
  navigate: () => {},
})

function parseHash(): { path: string; search: Record<string, string> } {
  const raw = window.location.hash.slice(1) || '/'
  const [pathPart, queryPart] = raw.split('?')
  const path = pathPart || '/'
  const search: Record<string, string> = {}
  if (queryPart) {
    queryPart.split('&').forEach((pair) => {
      const [k, v] = pair.split('=')
      if (k) search[decodeURIComponent(k)] = decodeURIComponent(v ?? '')
    })
  }
  return { path, search }
}

export function Router({ children }: { children: ReactNode }) {
  const [state, setState] = useState(parseHash)

  useEffect(() => {
    const handler = () => setState(parseHash())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = (to: string) => {
    window.location.hash = to
  }

  return (
    <RouterContext.Provider value={{ ...state, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

// ─── Public hooks ────────────────────────────────────────────────────────────

export function useRouter(): RouterContextValue {
  return useContext(RouterContext)
}

/** Extract a named path segment, e.g. '/product/:id' → id value */
export function usePathParam(index: number): string {
  const { path } = useRouter()
  const segments = path.split('/').filter(Boolean)
  return segments[index] ?? ''
}

// ─── Link component ──────────────────────────────────────────────────────────

interface LinkProps {
  to: string
  className?: string
  children: ReactNode
  onClick?: () => void
}

export function Link({ to, className, children, onClick }: LinkProps) {
  const { navigate } = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick?.()
    navigate(to)
  }

  return (
    <a href={`#${to}`} className={className} onClick={handleClick}>
      {children}
    </a>
  )
}
