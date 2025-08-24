'use client';

import { useEffect, useState } from 'react';
import SignInSignOn from "./SignInSignOn";
import Nav from "@/app/components/comm/Nav";
import UserDropdown from "./UserDropdown";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header({ user }: { user: any }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const headerHeight = '60px'; // Set your header height here
  const pathname = usePathname();
  const activeClasses =
    'text-blue-600 hover:text-blue-700 bg-blue-50';
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false); // Hide on scroll down
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true); // Show on scroll up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href; // Match only if pathname is exactly href
    //return pathname === href || pathname.startsWith(href + '/');

};


  return (
    <>
      <header
        className={`px-4 py-3 flex items-center justify-between w-full fixed top-0 left-0 right-0 bg-white shadow-md z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ height: headerHeight }}
      >
        <Nav />
        <div className="flex items-center gap-3">
          {user ? (
            <UserDropdown user={user} />
          ) : (
            <SignInSignOn />
          )}
        </div>
      </header>
    </>
  );
}