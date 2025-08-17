'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Pomodoro' },
  { href: '/audio', label: 'Audio' },
  { href: '/categories', label: 'Categories' }
];

export default function Nav() {
  const pathname = usePathname();


  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href; // Match only if pathname is exactly href
    //return pathname === href || pathname.startsWith(href + '/');

};

  const baseClasses =
    'px-2 py-1 text-gray-600 hover:text-gray-800 transition-colors rounded-md';
  const activeClasses =
    'text-blue-600 hover:text-blue-700 bg-blue-50';

  return (
    <nav className="flex items-center space-x-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${baseClasses} ${isActive(item.href) ? activeClasses : ''}`}
          aria-current={isActive(item.href) ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
