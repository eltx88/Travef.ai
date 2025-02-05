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
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';

export function NavigationMenuBar() {
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return(
        <header className="relative z-10 flex items-center justify-between m-0 pt-0 px-7">
            <div>
                <a href="/" className="font-outfit font-bold text-2xl text-blue-600">Travefai</a>
            </div>

            <div className="flex flex-1 justify-center">
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="text-lg">About</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink asChild>
                                    <div className="w-[400px] p-4 bg-white shadow-lg rounded-md">
                                        <h3 className="text-lg font-semibold mb-2">Powered by advanced AI</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Our platform delivers tailored itineraries for points of interest, dining, and activities with ease. Whether you're after adventure or relaxation, Travefai curates every aspect of your trip in just a few clicks.
                                        </p>
                                        <div className="space-y-3">
                                            {['1. Select preferences and date', '2. Choose points of interest', '3. Generate itinerary'].map((step, index) => (
                                                <div key={index} className="flex items-start">
                                                    <div className="bg-blue-100 text-blue-600 rounded-md p-2 mr-3">
                                                        <span className="text-sm font-semibold">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{step.split('. ')[1]}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {index === 0 && 'Tell us what you like and when you want to travel'}
                                                            {index === 1 && 'Pick the attractions and activities you want to experience'}
                                                            {index === 2 && 'We\'ll create a personalized travel plan just for you'}
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
                                className="text-lg cursor-pointer"
                                onClick={() => navigate('/home')}
                            >
                                Home
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink>
                                </NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger 
                                className="text-lg cursor-pointer"
                                onClick={() => navigate('/createtrip')}
                            >
                                Plan  
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink>
                                </NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="text-lg">Trips</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink></NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>          
                    </NavigationMenuList>        
                </NavigationMenu>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-1">
                    <div className="hover:opacity-45 transition-opacity">
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
                <DropdownMenuContent className="w-[1px] bg-white">
                    <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => navigate('/profile')}
                    >
                        Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={handleLogout}
                    >
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}