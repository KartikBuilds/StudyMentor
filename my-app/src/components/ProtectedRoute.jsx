import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Lock } from 'lucide-react';

// Demo mode - set to true to bypass all authentication
const DEMO_MODE = true;

const ProtectedRoute = ({ children, requireAuth = true }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    // In demo mode, always allow access to all routes
    if (DEMO_MODE) {
        return children;
    }

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-100 max-w-md mx-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                    <p className="text-gray-600 mb-6">
                        You need to sign in to access this page. Please log in to continue.
                    </p>
                    <Navigate
                        to="/login"
                        state={{ from: location }}
                        replace
                    />
                </div>
            </div>
        );
    }

    // If user is authenticated but route doesn't require auth, or if route requires auth and user is authenticated
    return children;
};

// Higher-order component for protecting routes
export const withAuthProtection = (Component, requireAuth = true) => {
    return function ProtectedComponent(props) {
        return (
            <ProtectedRoute requireAuth={requireAuth}>
                <Component {...props} />
            </ProtectedRoute>
        );
    };
};

// Component for routes that should only be accessible to non-authenticated users (like login/register)
export const PublicOnlyRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isAuthenticated) {
        // Redirect to intended destination or dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        return <Navigate to={from} replace />;
    }

    return children;
};

export default ProtectedRoute;