import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import { ChevronDownIcon, LogoutIcon, ProfileIcon } from './icons'

const itemClass =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

export default function AccountMenu() {
    const { user, logout } = useAuth()
    const [open, setOpen] = useState(false)
    const containerRef = useRef(null)

    // Close on outside click or Escape
    useEffect(() => {
        if (!open) return undefined

        function handlePointerDown(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
        }
        function handleKeyDown(e) {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open])

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setOpen((current) => !current)}
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={open}
                className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
                <Avatar name={user.name} />
                <ChevronDownIcon
                    size={16}
                    className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl bg-elevated shadow-lg ring-1 ring-line">
                    <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                        <Avatar name={user.name} />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                            {user.email && (
                                <p className="truncate text-xs text-muted">{user.email}</p>
                            )}
                        </div>
                    </div>
                    <div className="p-1">
                        <Link to="/profile" onClick={() => setOpen(false)} className={itemClass}>
                            <ProfileIcon size={18} className="text-muted" />
                            Profile
                        </Link>
                        <button
                            onClick={() => {
                                setOpen(false)
                                logout()
                            }}
                            className={itemClass}
                        >
                            <LogoutIcon size={18} className="text-muted" />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}