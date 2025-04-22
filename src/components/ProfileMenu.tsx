'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';

interface ProfileMenuProps {
  userName: string;
  userImage: string;
  isWhiteHeader?: boolean;
}

export default function ProfileMenu({ userName, userImage, isWhiteHeader = false }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if on mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && !isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Prevent body scrolling when menu is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isMobile]);

  const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Journal', href: '/journal' },
    { label: 'Profile', href: '/profile' },
    { label: 'Settings', href: '/settings' },
  ];

  const handleSignOut = () => {
    setIsOpen(false);
    signOut();
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 focus:outline-none group"
      >
        <span className={`text-sm ${isWhiteHeader ? 'text-gray-800 group-hover:text-purple-700' : 'text-purple-300 group-hover:text-purple-200'} transition-colors`}>{userName}</span>
        <Image
          src={userImage}
          alt={userName}
          width={40}
          height={40}
          className={`rounded-full ${isWhiteHeader ? 'ring-2 ring-gray-200 group-hover:ring-purple-400' : 'ring-2 ring-white/10 group-hover:ring-purple-400'} transition-all transform group-hover:scale-105 duration-200`}
        />
      </button>

      {/* Desktop dropdown menu (only for desktop) */}
      {!isMobile && (
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
                onClick={handleLinkClick}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 py-1">
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-all duration-200 hover:translate-x-1"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
      
      {/* Mobile menu using Headless UI (only for mobile) */}
      {isMobile && (
        <Transition show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-[60]" onClose={setIsOpen}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full h-full fixed inset-0 transform overflow-hidden bg-gradient-to-br from-purple-900 to-blue-900 text-left align-middle shadow-xl transition-all">
                    <div className="flex flex-col h-full">
                      {/* Mobile header with close button */}
                      <div className="flex items-center justify-between p-5 border-b border-white/10">
                        <div className="flex items-center space-x-3">
                          <Image
                            src={userImage}
                            alt={userName}
                            width={48}
                            height={48}
                            className="rounded-full ring-2 ring-white/20"
                          />
                          <Dialog.Title as="p" className="text-lg font-medium text-white">
                            {userName}
                          </Dialog.Title>
                        </div>
                        <button 
                          onClick={() => setIsOpen(false)}
                          className="p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20"
                          aria-label="Close menu"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Mobile menu items */}
                      <div className="flex-1 overflow-y-auto p-5">
                        <div className="space-y-3">
                          {menuItems.map((item, index) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="block w-full p-4 text-center text-lg font-medium text-white bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200"
                              onClick={handleLinkClick}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                      
                      {/* Mobile sign out button */}
                      <div className="p-5 border-t border-white/10">
                        <button
                          onClick={handleSignOut}
                          className="block w-full p-4 text-center text-lg font-medium text-red-400 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </div>
  );
} 