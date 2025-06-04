'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
// Import hooks from @telegram-apps for use within the client-side component
import { useRawInitData } from '@telegram-apps/sdk-react';
import { isTMA } from '@telegram-apps/bridge';

// Explicitly import NextImage to avoid conflict with global Image if any
import NextImage from 'next/image'; 



// --- INTERFACES (as provided in your original code) ---
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_bot?: boolean;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

interface ParsedInitData {
  query_id?: string;
  user?: TelegramUser;
  receiver?: TelegramUser;
  start_param?: string;
  auth_date: number;
  hash: string;
}

interface InitDataObject {
  user?: TelegramUser;
}

// --- SVG ICONS (as provided in your original code) ---
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500 dark:text-gray-400">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500 dark:text-gray-400">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500 dark:text-gray-400">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500 dark:text-gray-400">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
  </svg>
);


const LoginButton = dynamic(() => import('../../../components/LoginButton').catch(err => {
  // Optional: Add error handling for the dynamic import itself
  console.error("Failed to load LoginButton:", err);
  // Fallback UI, ensure it's a valid React component
  const FallbackButton = () => <p>Error loading login button.</p>;
  FallbackButton.displayName = 'LoginButtonFallback';
  return FallbackButton;
}), { ssr: false });



const ProfileLogicLoader = ({
  setProfileData,
  setIsLoadingParent
}: {
  setProfileData: (data: {
    name: string;
    username: string;
    memberSince: string;
    avatarUrl: string;
  }) => void;
  setIsLoadingParent: (loading: boolean) => void;
}) => {
  // Hooks like useRawInitData and isTMA are safe to call here because this component
  // will only render on the client-side.
  const rawInitData = useRawInitData(); // From @telegram-apps/sdk-react

  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [isLoadingEnvironmentCheck, setIsLoadingEnvironmentCheck] = useState(true);

  // Store rawInitData in local state to handle potential updates from the hook
  // Explicitly type currentInitData as string | undefined
  const [currentInitData, setCurrentInitData] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Update currentInitData when rawInitData changes.
    // This is now type-safe.
    setCurrentInitData(rawInitData);
  }, [rawInitData]);

  useEffect(() => {
    // This effect runs only on the client because ProfileLogicLoader is SSR-disabled.
    const performClientSideChecks = async () => {
      setIsLoadingEnvironmentCheck(true);
      try {
        const tmaResult = await isTMA(); // From @telegram-apps/bridge
        setIsTelegramEnv(tmaResult);
      } catch (error) {
        console.error('Error checking Telegram environment:', error);
        setIsTelegramEnv(false); // Default to false on error
      }
      setIsLoadingEnvironmentCheck(false);
      // Signal to the parent component that initial environment checks are complete.
      setIsLoadingParent(false);
    };

    performClientSideChecks();
  }, [setIsLoadingParent]); // Only depends on setIsLoadingParent to avoid re-runs

  const parsedTelegramUser = useMemo(() => {
    // This memoization runs only on the client.
    // It depends on currentInitData (from useRawInitData) and isTelegramEnv (from isTMA).
    if (isLoadingEnvironmentCheck || !currentInitData) {
      // If still loading environment info or no init data, return null.
      return null;
    }

    let user: TelegramUser | null = null;
    // Check if currentInitData is a string (expected format for URLSearchParams)
    if (typeof currentInitData === 'string' && currentInitData) {
      try {
        // URLSearchParams is a browser API, safe here.
        const params = new URLSearchParams(currentInitData);
        const userParam = params.get('user');
        if (userParam) {
          user = JSON.parse(userParam) as TelegramUser;
        }
      } catch (e) {
        console.error('Failed to parse currentInitData from URLSearchParams:', e);
        // Fallback: Try parsing as a direct JSON string if URLSearchParams fails
        try {
          const parsedData: ParsedInitData = JSON.parse(currentInitData);
          user = parsedData.user || null;
        } catch (e2) {
          console.error('Failed to parse currentInitData as direct JSON:', e2);
        }
      }
    } else if (typeof currentInitData === 'object' && currentInitData !== null) {
      // Handle cases where rawInitData might directly return an object
      // (as hinted by InitDataObject in the original code)
      // This case might not be reached if rawInitData from the hook is always string | undefined
      user = (currentInitData as InitDataObject).user || null;
    }
    return user;
  }, [isLoadingEnvironmentCheck, currentInitData]);

  useEffect(() => {
    // This effect updates the profile data in the parent component.
    // It runs when parsedTelegramUser, isTelegramEnv, or isLoadingEnvironmentCheck changes.
    if (isLoadingEnvironmentCheck) {
      // Do nothing if environment checks are still in progress.
      return;
    }

    if (!isTelegramEnv || !parsedTelegramUser) {
      // If not in Telegram environment or user data is not available/parsed.
      setProfileData({
        name: parsedTelegramUser ? 'User Data Incomplete' : (isTelegramEnv ? 'User Not Found' : 'Not a Telegram Environment'),
        username: 'N/A',
        memberSince: 'N/A',
        avatarUrl: '/placeholder-user.jpg', // Ensure you have this placeholder image
      });
    } else {
      // If user data is available and parsed.
      const userFullName = [parsedTelegramUser.first_name, parsedTelegramUser.last_name].filter(Boolean).join(' ');
      setProfileData({
        name: userFullName || 'Telegram User',
        username: parsedTelegramUser.username ? `@${parsedTelegramUser.username}` : 'N/A',
        memberSince: 'Today', // Placeholder, replace with actual data if available
        avatarUrl: parsedTelegramUser.photo_url || '/placeholder-user.jpg',
      });
    }
  }, [parsedTelegramUser, isTelegramEnv, isLoadingEnvironmentCheck, setProfileData]);

  // This component's purpose is to run logic and update parent state; it doesn't render UI itself.
  return null;
};
ProfileLogicLoader.displayName = 'ProfileLogicLoader'; // Added display name

// Dynamically import the ProfileLogicLoader component with SSR disabled.
// Using Promise.resolve because ProfileLogicLoader is defined in the same file.
const DynamicProfileLogic = dynamic(() => Promise.resolve(ProfileLogicLoader), {
  ssr: false,
});


// --- MAIN PAGE COMPONENT ---
export default function FinanceProfilePage() {
  // State for the profile data to be displayed.
  const [profileData, setProfileData] = useState({
    name: 'Guest',
    username: '',
    memberSince: 'N/A',
    avatarUrl: '/placeholder-user.jpg',
  });

  // isLoading state: true until DynamicProfileLogic signals it's done with initial client-side checks.
  const [isLoading, setIsLoading] = useState(true);

  // isClientMounted state: ensures DynamicProfileLogic is only rendered after client mount.
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    // Set isClientMounted to true once the component has mounted on the client.
    setIsClientMounted(true);
  }, []);


  if (!isClientMounted) {
    // During SSR or before the client has mounted, show a minimal loading state or return null.
    // This prevents attempting to render DynamicProfileLogic on the server.
      return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <p className="text-black">Initializing Profile...</p>
      </div>
    );
  }

  // Once the client has mounted, DynamicProfileLogic can be rendered.
  // It will handle its internal loading and then update the `isLoading` state via setIsLoadingParent.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 font-sans">
      {/* Render DynamicProfileLogic only on the client. It will manage data fetching. */}
      {isClientMounted && <DynamicProfileLogic setProfileData={setProfileData} setIsLoadingParent={setIsLoading} />}

      {isLoading ? (
        // Show a loading message while DynamicProfileLogic is performing its initial checks.
        <p className="text-lg text-black">Loading profile data...</p>
      ) : (
        // Once loading is complete, render the profile UI with the fetched data.
        <div className="w-full max-w-md bg-black text-white rounded-xl shadow-2xl p-6 md:p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <NextImage // Use the aliased import NextImage
                alt="User Avatar"
                className="rounded-full object-cover border-4 border-gray-700"
                height={120}
                src={profileData.avatarUrl}
                style={{ aspectRatio: '120/120', objectFit: 'cover' }}
                width={120}
                onError={(e) => { 
                  // The event target for next/image's onError is HTMLImageElement
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-user.jpg'; 
                }}
                // unoptimized // Uncomment if needed
              />
              <button
                aria-label="Change Profile Picture"
                className="absolute bottom-0 right-0 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 shadow-md transition-colors duration-150"
              >
                <CameraIcon />
              </button>
            </div>
            <h2 className="text-2xl font-bold text-white">{profileData.name}</h2>
            <p className="text-gray-400">{profileData.username}</p>
          </div>

          <div className="space-y-4 my-6">
            <div className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg">
              <UserIcon />
              <span className="text-gray-300">{profileData.name}</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg">
              <MailIcon />
              <span className="text-gray-300">{profileData.username || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg">
              <CalendarIcon />
              <span className="text-gray-300">Member since {profileData.memberSince}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-700 pt-6">
            <h3 className="text-xl font-semibold text-white mb-4">Account Settings</h3>
            <div className="space-y-2">
                <a href="#" className="block text-gray-300 hover:underline hover:text-white transition-colors">Edit Profile</a>
                <a href="#" className="block text-gray-300 hover:underline hover:text-white transition-colors">Change Password</a>
                <a href="#" className="block text-gray-300 hover:underline hover:text-white transition-colors">Notifications</a>
            </div>
          </div>

          <div className="mt-8">
            {/* LoginButton is already dynamically imported with ssr: false */}
            <LoginButton />
          </div>
        </div>
      )}
    </div>
  );
}
