import React from 'react';
import { Sparkles } from 'lucide-react';

export function FeatureCard({ title, description, icon: Icon = Sparkles, className = '', children }) {
    return (
        <div className={`bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6 flex flex-col items-center text-center transition-all duration-200 hover:shadow-xl ${className}`}>
            <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">{description}</p>
            {children}
        </div>
    );
}
