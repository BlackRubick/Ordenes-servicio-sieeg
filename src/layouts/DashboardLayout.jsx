import React from 'react';
import Navbar from '../components/Navbar';

const DashboardLayout = ({ children }) => (
  <div className="min-h-screen bg-background flex flex-col fade-in">
    <Navbar />
    <main className="flex-1 flex flex-col gap-6 pt-24 px-4 pb-4">
      <section className="flex-1 rounded-2xl bg-card shadow-card p-6 overflow-auto">
        {children}
      </section>
    </main>
  </div>
);

export default DashboardLayout;
