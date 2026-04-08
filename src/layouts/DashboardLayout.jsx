import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const SCROLL_KEY_PREFIX = 'dashboard_scroll:';
const WINDOW_SCROLL_KEY_PREFIX = 'dashboard_window_scroll:';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const scrollContainerRef = React.useRef(null);

  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const storageKey = `${SCROLL_KEY_PREFIX}${location.pathname}`;
    const windowStorageKey = `${WINDOW_SCROLL_KEY_PREFIX}${location.pathname}`;
    const savedValue = sessionStorage.getItem(storageKey);
    const savedWindowValue = sessionStorage.getItem(windowStorageKey);
    const savedScrollTop = Number(savedValue);
    const savedWindowScroll = Number(savedWindowValue);

    if (Number.isFinite(savedScrollTop) && savedScrollTop > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = savedScrollTop;
        });
      });
    }

    if (Number.isFinite(savedWindowScroll) && savedWindowScroll > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedWindowScroll, behavior: 'auto' });
        });
      });
    }

    const persistScroll = () => {
      sessionStorage.setItem(storageKey, String(scrollContainer.scrollTop || 0));
      sessionStorage.setItem(windowStorageKey, String(window.scrollY || window.pageYOffset || 0));
    };

    // Persist as user scrolls so route transitions do not rely on unmount timing.
    const handleScroll = () => persistScroll();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Ensure restored value is available even if user navigates without additional scrolling.
    persistScroll();

    const handlePageHide = () => persistScroll();
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
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
