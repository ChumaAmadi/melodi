import { useState, useEffect } from 'react';

export interface UseSpotifyProfileResult {
  spotifyProfileImage: string | null;
  isLoadingProfileImage: boolean;
  profileImageError: boolean;
}

export default function useSpotifyProfile(): UseSpotifyProfileResult {
  const [spotifyProfileImage, setSpotifyProfileImage] = useState<string | null>(null);
  const [isLoadingProfileImage, setIsLoadingProfileImage] = useState(true);
  const [profileImageError, setProfileImageError] = useState(false);

  useEffect(() => {
    const fetchSpotifyProfile = async () => {
      setIsLoadingProfileImage(true);
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
            setProfileImageError(false);
          } else {
            console.log("No Spotify images in API response, using fallback:", data.fallbackImage);
            // If no Spotify images but we have a fallback
            if (data.fallbackImage && !data.fallbackImage.includes('facebook')) {
              setSpotifyProfileImage(data.fallbackImage);
            } else {
              setProfileImageError(true);
            }
          }
        } else {
          const errorText = await response.text();
          console.error("Error fetching Spotify profile:", errorText);
          setProfileImageError(true);
        }
      } catch (error) {
        console.error("Error in fetchSpotifyProfile:", error);
        setProfileImageError(true);
      } finally {
        setIsLoadingProfileImage(false);
      }
    };

    fetchSpotifyProfile();
  }, []);

  return {
    spotifyProfileImage,
    isLoadingProfileImage,
    profileImageError
  };
} 