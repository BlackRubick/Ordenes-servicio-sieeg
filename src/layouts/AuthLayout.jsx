import React from 'react';

const AuthLayout = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-background fade-in">
    <div className="w-full max-w-md p-8 rounded-2xl shadow-soft bg-white/80 backdrop-blur-xs">
      {children}
    </div>
  </div>
);

export default AuthLayout;
