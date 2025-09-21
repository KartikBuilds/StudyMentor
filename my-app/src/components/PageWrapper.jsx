import React from 'react';

const PageWrapper = ({ title, children }) => {
    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto bg-white/80 dark:bg-gray-800/80 shadow-md rounded-lg p-6 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                {title && <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">{title}</h1>}
                {children}
            </div>
        </div>
    );
};

export default PageWrapper;
