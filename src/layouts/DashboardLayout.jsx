import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const SCROLL_KEY_PREFIX = 'dashboard_scroll:';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const scrollContainerRef = React.useRef(null);

  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const storageKey = `${SCROLL_KEY_PREFIX}${location.pathname}`;
    const savedValue = sessionStorage.getItem(storageKey);
    const savedScrollTop = Number(savedValue);

    if (Number.isFinite(savedScrollTop) && savedScrollTop > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = savedScrollTop;
        });
      });
    }

    const persistScroll = () => {
      sessionStorage.setItem(storageKey, String(scrollContainer.scrollTop || 0));
    };

    const handlePageHide = () => persistScroll();
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      persistScroll();
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col fade-in">
      <Navbar />
      <main className="flex-1 flex flex-col gap-6 pt-24 px-4 pb-4">
        <section id="dashboard-scroll-container" ref={scrollContainerRef} className="flex-1 rounded-2xl bg-card shadow-card p-6 overflow-auto">
          {children}
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
