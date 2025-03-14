"use client"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';

interface NavigationMenuBarProps {
    hasUnsavedChanges?: boolean;
    clearUnsavedChanges?: () => void;
}

export function NavigationMenuBar({ hasUnsavedChanges = false, clearUnsavedChanges = () => {} }: NavigationMenuBarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleNavigation = (e: React.MouseEvent, path: string) => {
        if (hasUnsavedChanges) {
            const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
            if (confirmed) {
                clearUnsavedChanges();
                navigate(path);
            } else {
                e.preventDefault();
            }
        } else {
            navigate(path);
        }
    };

    // Function to determine if a nav item is active
    const isActive = (path: string): boolean => {
        if (path === '/home') {
            return location.pathname === '/home' || location.pathname === '/';
        }
        return location.pathname === path;
    };
    const activeNavClass = "text-blue-700";

    return(
        <header className="relative z-50 flex items-center justify-between m-0 pt-0 px-7 bg-slate-100">
            <div>
                <a href="/" className="font-outfit font-bold text-2xl text-blue-600">Travefai</a>
            </div>

            <div className="flex flex-1 justify-center">
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="text-lg bg-transparent hover:bg-slate-200">About</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink asChild>
                                    <div className="w-[400px] p-4 bg-white shadow-lg rounded-md">
                                        <h3 className="text-lg font-semibold mb-2">Powered by advanced AI</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Our platform delivers tailored itineraries for points of interest, dining, and activities with ease. Whether you're after adventure or relaxation, Travefai curates every aspect of your trip in just a few clicks.
                                        </p>
                                        
                                    </div>
                                </NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger 
                                className={`text-lg bg-transparent hover:bg-slate-200 cursor-pointer ${isActive('/home') ? activeNavClass : ''}`}
                                onClick={(e) => handleNavigation(e, '/home')}
                            >
                                Home
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink asChild>
                                    <div className="w-[400px] p-4 bg-white shadow-lg rounded-md">
                                        <h3 className="text-lg font-semibold mb-2">Your Travel Dashboard</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Access your saved trips, recent activities, and discover new destinations all in one place. Your travel planning starts here.
                                        </p>
                                        <div className="space-y-3">
                                            {['1. View saved trips', '2. Resume planning', '3. Explore cities'].map((step, index) => (
                                                <div key={index} className="flex items-start">
                                                    <div className="bg-blue-100 text-blue-600 rounded-md p-2 mr-3">
                                                        <span className="text-sm font-semibold">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{step.split('. ')[1]}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {index === 0 && 'Access all your saved itineraries in one place'}
                                                            {index === 1 && 'Continue working on trips you\'ve started planning'}
                                                            {index === 2 && 'Look up attractions, restaurants and activities in your destination'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger 
                                className={`text-lg bg-transparent hover:bg-slate-200 cursor-pointer ${isActive('/createtrip') ? activeNavClass : ''}`}
                                onClick={(e) => handleNavigation(e, '/createtrip')}
                            >
                                Plan  
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink asChild>
                                    <div className="w-[400px] p-4 bg-white shadow-lg rounded-md">
                                        <h3 className="text-lg font-semibold mb-2">Plan Your Next Trip</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Create a custom itinerary tailored to your preferences in minutes. Our AI helps you discover the best attractions, restaurants, and activities.
                                        </p>
                                        <div className="space-y-3">
                                            {['1. Select city', '2. Select dates', '3. Select preferences', '4. Generate Trip'].map((step, index) => (
                                                <div key={index} className="flex items-start">
                                                    <div className="bg-blue-100 text-blue-600 rounded-md p-2 mr-3">
                                                        <span className="text-sm font-semibold">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{step.split('. ')[1]}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {index === 0 && 'Choose your destination from our global database'}
                                                            {index === 1 && 'Set your travel dates and trip duration'}
                                                            {index === 2 && 'Tell us your interests, activities and food preferences'}
                                                            {index === 3 && 'Let our AI create your perfect travel itinerary'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger 
                                className={`text-lg bg-transparent hover:bg-slate-200 ${
                                    location.pathname === '/home' && sessionStorage.getItem('scrollToTrips') === 'true' ? activeNavClass : ''
                                }`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    
                                    // Check if we're already on the homepage
                                    if (window.location.pathname === '/home' || window.location.pathname === '/') {
                                        // Scroll to the trips section smoothly
                                        const tripsSection = document.getElementById('trips-section');
                                        if (tripsSection) {
                                            tripsSection.scrollIntoView({ 
                                                behavior: 'smooth',
                                                block: 'start'
                                            });
                                            
                                            // Make the section visible by removing opacity-0 class
                                            tripsSection.classList.remove('opacity-0');
                                        }
                                    } else {
                                        // If not on homepage, navigate to homepage and then scroll
                                        // Store a flag in sessionStorage to indicate we need to scroll
                                        sessionStorage.setItem('scrollToTrips', 'true');
                                        handleNavigation(e, '/home');
                                    }
                                }}
                            >
                                Trips
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink asChild>
                                    <div className="w-[400px] p-4 bg-white shadow-lg rounded-md">
                                        <h3 className="text-lg font-semibold mb-2">Manage Your Trips</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Access, edit and organize all your saved itineraries. Customize your plans, share with friends, and keep track of your travel history.
                                        </p>
                                        <div className="space-y-3">
                                            {['1. View itineraries', '2. Edit plans', '3. Share & export'].map((step, index) => (
                                                <div key={index} className="flex items-start">
                                                    <div className="bg-blue-100 text-blue-600 rounded-md p-2 mr-3">
                                                        <span className="text-sm font-semibold">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{step.split('. ')[1]}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {index === 0 && 'Browse through all your planned destinations'}
                                                            {index === 1 && 'Modify schedules and add/remove activities'}
                                                            {index === 2 && 'Share your plans with travel companions'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>          
                    </NavigationMenuList>        
                </NavigationMenu>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-1">
                    <div className="hover:opacity-45 px-2 py-1 transition-opacity">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.5} 
                            stroke="currentColor" 
                            className="size-10"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" 
                            />
                        </svg>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className=" bg-white">
                    <DropdownMenuItem 
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}