import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoutes = () => {
    // Retrieve the token from storage
    const token = sessionStorage.getItem('token');

    // If token exists, render the child routes (Outlet)
    // Otherwise, redirect to the login page
    return token ? <Outlet /> : <Navigate to='/' replace />;
};

export default ProtectedRoutes;
