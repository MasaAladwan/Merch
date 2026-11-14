import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-xl border-b border-ink/5">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-extrabold tracking-[0.2em] text-sm">
          MERCH<span className="text-accent">.</span>
        </Link>
        <nav className="flex items-center gap-6 sm:gap-8 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `transition-colors ${isActive ? 'text-ink' : 'text-ink/60 hover:text-ink'}`
            }
          >
            Showroom
          </NavLink>
          <NavLink
            to="/saved"
            className={({ isActive }) =>
              `transition-colors ${isActive ? 'text-ink' : 'text-ink/60 hover:text-ink'}`
            }
          >
            Saved
          </NavLink>
        </nav>
        <div className="hidden sm:block text-[11px] uppercase tracking-widest text-ink/50">
          3D · AR Preview
        </div>
      </div>
    </header>
  )
}
