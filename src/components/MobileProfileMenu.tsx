'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { signOut } from "next-auth/react";

interface MobileProfileMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userName: string;
  profileImage: string | null;
  isLoadingProfileImage: boolean;
}

export default function MobileProfileMenu({ 
  isOpen, 
  setIsOpen, 
  userName, 
  profileImage,
  isLoadingProfileImage
}: MobileProfileMenuProps) {
  if (!isOpen) return null;
  
  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
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
  
  // Render avatar with initial fallback
  const renderAvatar = (size: number = 48) => {
    const initial = userName?.charAt(0) || '?';
    
    if (isLoadingProfileImage) {
      return (
        <div className="relative animate-pulse">
          <div 
            className="flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full ring-2 ring-white/10"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <span className="text-white font-medium" style={{ fontSize: `${size / 2.5}px` }}>{initial}</span>
          </div>
        </div>
      );
    }
    
    if (profileImage) {
      return (
        <div className="relative">
          {/* Fallback underneath */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <span className="text-white font-medium" style={{ fontSize: `${size / 2.5}px` }}>{initial}</span>
          </div>
          
          <img
            src={profileImage}
            alt={userName || "User"}
            className="relative z-10 rounded-full border-2 border-white/10"
            style={{ width: `${size}px`, height: `${size}px`, objectFit: 'cover' }}
          />
        </div>
      );
    }
    
    return (
      <div 
        className="flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full ring-2 ring-white/10"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <span className="text-white font-medium" style={{ fontSize: `${size / 2.5}px` }}>{initial}</span>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 z-[9999] flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Content */}
      <div className="fixed inset-x-0 bottom-0 top-20 flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 rounded-t-xl shadow-xl overflow-y-auto border-t border-white/10">
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            {renderAvatar(56)}
            <div>
              <p className="font-medium text-white text-lg">{userName}</p>
              <p className="text-sm text-purple-300">Signed in</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 inline-flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
          >
            <span className="sr-only">Close menu</span>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 py-6 px-6 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleLinkClick}
              className="block py-3 px-4 text-base font-medium text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="py-6 px-6 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="block w-full text-left py-3 px-4 text-base font-medium text-red-400 rounded-lg hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
} 