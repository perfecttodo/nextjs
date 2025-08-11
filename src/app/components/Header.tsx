'use client';

import { useEffect, useState } from 'react';
import GoogleLoginButton from "./GoogleLoginButton";
import Nav from "./Nav";
import Link from 'next/link';

export default function Header({ user }: { user: any }) {
  const [isFixed, setIsFixed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        // Scrolling down
        setIsFixed(false);
      } else {
        // Scrolling up
          setIsFixed(currentScrollY>0?true:false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  return (
    <>
    <header
    className={`px-4 py-3 flex items-center justify-between w-full transition-all duration-300 ${
      isFixed
        ? 'fixed top-0 left-0 right-0 bg-white shadow-md z-50 slide-in'
        : 'relative slide-out'
    }`}
    >
      <Nav />
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span>
              <Link href="/audio-manage" className="text-sm text-gray-600">
                Audio Manage
              </Link>
            </span>
            <span className="text-sm text-gray-600">{user.name || user.email}</span>
            <form action="/api/auth/logout" method="post">
              <button className="text-sm underline" type="submit">
                Logout
              </button>
            </form>
          </>
        ) : (
          <GoogleLoginButton />
        )}
      </div>
    </header>
     <style jsx>{`
      @keyframes slideIn {
        from {
          transform: translateY(-100%);
          opacity: 0.5;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(-20px);
          opacity: 0.7;
        }
      }

      .slide-in {
        animation: slideIn 0.4s ease-in-out forwards;
      }

      .slide-out {
        transform: translateY(0);
        opacity: 1;
        animation: none;
      }
    `}</style>
  </>
  );
}