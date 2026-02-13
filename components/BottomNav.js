'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { label: '首页', icon: '🏠', path: '/' },
        { label: '空间', icon: '👥', path: '/space', activeCheck: (p) => p.startsWith('/space') },
        { label: '通知', icon: '🔔', path: '/notifications', badge: 0 },
        { label: '账户', icon: '👤', path: '/account', activeCheck: (p) => p === '/account' },
    ];

    return (
        <nav className="mobile-bottom-nav">
            {navItems.map((item) => {
                const isActive = item.activeCheck ? item.activeCheck(pathname) : pathname === item.path;
                return (
                    <Link key={item.path} href={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
