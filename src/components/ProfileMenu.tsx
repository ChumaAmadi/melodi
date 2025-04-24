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

// Simplified MobileMenu to avoid issues with Headless UI
function MobileMenu({ 
  isOpen, 
  setIsOpen, 
  userName, 
  renderAvatar, 
  menuItems, 
  handleLinkClick, 
  handleSignOut 
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userName: string;
  renderAvatar: (size?: number) => JSX.Element;
  menuItems: { label: string; href: string }[];
  handleLinkClick: () => void;
  handleSignOut: () => void;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Content */}
      <div className="fixed inset-x-0 bottom-0 top-20 flex flex-col bg-white dark:bg-gray-900 rounded-t-xl shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {renderAvatar(48)}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{userName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Signed in</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="sr-only">Close menu</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-6">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleLinkClick}
                className="block py-3 px-4 text-base font-medium text-gray-900 dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="py-6 px-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="block w-full text-left py-3 px-4 text-base font-medium text-red-600 dark:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileMenu({ userName, userImage, isWhiteHeader = false }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [spotifyProfileImage, setSpotifyProfileImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // Add debugging for user image prop
  useEffect(() => {
    console.log("ProfileMenu component mounted with userImage:", userImage);
  }, [userImage]);

  // Fetch Spotify profile image when component mounts
  useEffect(() => {
    const fetchSpotifyProfile = async () => {
      setIsLoadingImage(true);
      try {
        console.log("Attempting to fetch Spotify profile");
        
        // Add a random query parameter to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/user/profile?t=${timestamp}`, {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache' }
        });
        
        console.log("Profile API response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Profile API data:", data);
          
          // Check if we have Spotify images available
          if (data.images && data.images.length > 0) {
            const imageUrl = data.images[0].url;
            console.log("Setting Spotify profile image from API response:", imageUrl);
            setSpotifyProfileImage(imageUrl);
            setImageError(false);
          } else {
            console.log("No Spotify images in API response, using fallback:", data.fallbackImage);
            // If no Spotify images but we have a fallback
            if (data.fallbackImage && !data.fallbackImage.includes('facebook')) {
              setSpotifyProfileImage(data.fallbackImage);
            } else {
              setImageError(true);
            }
          }
        } else {
          const errorText = await response.text();
          console.error("Error fetching Spotify profile:", errorText);
          setImageError(true);
        }
      } catch (error) {
        console.error("Error in fetchSpotifyProfile:", error);
        setImageError(true);
      } finally {
        setIsLoadingImage(false);
      }
    };

    fetchSpotifyProfile();
  }, []);

  // Reset image error when userImage changes
  useEffect(() => {
    setImageError(false);
  }, [userImage]);

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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Image error event triggered:", event);
    console.error("Failed to load profile image:", (event.target as HTMLImageElement).src);
    setImageError(true);
  };

  // Helper function to check if an image URL is from Facebook's CDN which will likely cause CORS errors
  const isFacebookImage = (url: string): boolean => {
    return url?.includes('fbcdn.net') || url?.includes('facebook.com') || false;
  };

  // Render avatar - either image or fallback
  const renderAvatar = (size: number = 40) => {
    const initial = userName?.charAt(0) || '?';
    
    // Show loading state while fetching image
    if (isLoadingImage) {
      console.log("Showing loading state for avatar");
      return (
        <div className="relative animate-pulse">
          <div 
            className={`flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full ${isWhiteHeader ? 'ring-2 ring-gray-200' : 'ring-2 ring-white/10'}`}
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <span className="text-white font-medium" style={{ fontSize: `${size / 2.5}px` }}>{initial}</span>
          </div>
        </div>
      );
    }
    
    // Use Spotify profile image if available
    if (spotifyProfileImage && !imageError) {
      console.log("Rendering avatar with Spotify image:", spotifyProfileImage);
      return (
        <div className="relative">
          {/* Always include the fallback underneath in case the image fails */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <span className="text-white font-medium" style={{ fontSize: `${size / 2.5}px` }}>{initial}</span>
          </div>
          
          <img
            src={spotifyProfileImage}
            alt={userName || "User"}
            className={`relative z-10 rounded-full ${isWhiteHeader ? 'border-2 border-gray-200' : 'border-2 border-white/10'}`}
            style={{ width: `${size}px`, height: `${size}px`, objectFit: 'cover' }}
            onError={handleImageError}
          />
        </div>
      );
    }
    
    // If no image or there was an error, use initials fallback
    console.log("Using initials fallback for avatar");
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full ${isWhiteHeader ? 'ring-2 ring-gray-200' : 'ring-2 ring-white/10'}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <span className="text-white font-medium" style={{ fontSize: `${size / 2.5}px` }}>{initial}</span>
      </div>
    );
  };

  return (
    <div 
      className="relative" 
      ref={menuRef}
      style={{ position: 'relative', zIndex: 10000 }}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center focus:outline-none"
        aria-haspopup="true"
        aria-expanded="false"
        data-state={isOpen ? "open" : "closed"}
      >
        {renderAvatar()}
      </button>
      
      {/* Desktop Dropdown */}
      {!isMobile && (
        <Transition
          show={isOpen}
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div 
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
            style={{ zIndex: 10000 }}
          >
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300">Signed in as</p>
                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{userName}</p>
              </div>
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleLinkClick}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </Transition>
      )}
      
      {/* Mobile Menu as separate component */}
      {isMobile && (
        <MobileMenu
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          userName={userName}
          renderAvatar={renderAvatar}
          menuItems={menuItems}
          handleLinkClick={handleLinkClick}
          handleSignOut={handleSignOut}
        />
      )}
    </div>
  );
} 