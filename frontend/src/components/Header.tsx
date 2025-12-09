import React from 'react';
import { Video } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HeaderProps {
    children?: React.ReactNode;
    className?: string;
}

const Header: React.FC<HeaderProps> = ({ children, className }) => {
    return (
        <div className={cn("flex justify-between items-center mb-12", className)}>
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="p-3 bg-blue-600 rounded-lg">
                    <Video className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Reccord
                </h1>
            </Link>
            <div className="flex items-center gap-4">
                {children}
            </div>
        </div>
    );
};

export default Header;
