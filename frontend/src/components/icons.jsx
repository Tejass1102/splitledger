function Icon({ size = 20, className = '', children, ...props }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
            {...props}
        >
            {children}
        </svg>
    )
}

export function SunIcon(props) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
        </Icon>
    )
}

export function MoonIcon(props) {
    return (
        <Icon {...props}>
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </Icon>
    )
}

export function MenuIcon(props) {
    return (
        <Icon {...props}>
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
        </Icon>
    )
}

export function CloseIcon(props) {
    return (
        <Icon {...props}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </Icon>
    )
}

export function BellIcon(props) {
    return (
        <Icon {...props}>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </Icon>
    )
}

export function ChevronDownIcon(props) {
    return (
        <Icon {...props}>
            <path d="m6 9 6 6 6-6" />
        </Icon>
    )
}

export function ChevronLeftIcon(props) {
    return (
        <Icon {...props}>
            <path d="m15 18-6-6 6-6" />
        </Icon>
    )
}

export function ChevronRightIcon(props) {
    return (
        <Icon {...props}>
            <path d="m9 18 6-6-6-6" />
        </Icon>
    )
}

export function PlusIcon(props) {
    return (
        <Icon {...props}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </Icon>
    )
}

export function LogoutIcon(props) {
    return (
        <Icon {...props}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
        </Icon>
    )
}

export function DashboardIcon(props) {
    return (
        <Icon {...props}>
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
        </Icon>
    )
}

export function ExpensesIcon(props) {
    return (
        <Icon {...props}>
            <path d="M22 17 13.5 8.5 8.5 13.5 2 7" />
            <path d="M16 17h6v-6" />
        </Icon>
    )
}

export function IncomesIcon(props) {
    return (
        <Icon {...props}>
            <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
            <path d="M16 7h6v6" />
        </Icon>
    )
}

export function GroupsIcon(props) {
    return (
        <Icon {...props}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Icon>
    )
}

export function CategoriesIcon(props) {
    return (
        <Icon {...props}>
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
        </Icon>
    )
}

export function ProfileIcon(props) {
    return (
        <Icon {...props}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </Icon>
    )
}