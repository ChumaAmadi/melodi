import { useState, useRef, useEffect } from 'react';
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from 'next/link';

interface ProfileMenuProps {
  userName: string;
  userImage: string;
}

export default function ProfileMenu({ userName, userImage }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Journal', href: '/journal' },
    { label: 'Profile', href: '/profile' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 focus:outline-none group"
      >
        <span className="text-sm text-white group-hover:text-purple-200 transition-colors">{userName}</span>
        <Image
          src={userImage}
          alt={userName}
          width={40}
          height={40}
          className="rounded-full ring-2 ring-white/10 group-hover:ring-purple-400 transition-all transform group-hover:scale-105 duration-200"
        />
      </button>

      <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-lg border border-white/10 overflow-hidden z-50 transition-all duration-200 origin-top-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-sm font-medium text-white">{userName}</p>
        </div>

        <div className="py-1">
          {menuItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors transform hover:translate-x-1 duration-200"
              onClick={() => setIsOpen(false)}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="border-t border-white/10 py-1">
          <button
            onClick={() => signOut()}
            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-all duration-200 hover:translate-x-1"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
} 