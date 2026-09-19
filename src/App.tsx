import React, { useState, useEffect } from 'react';
import { CustomerEntryPage } from './components/customer/CustomerEntryPage';
import { CustomerShell } from './components/customer/CustomerShell';
import { StaffPortal } from './components/staff/StaffPortal';
import { StaffAuthProvider } from './contexts/StaffAuthContext';

type Route = 'ENTRY' | 'CUSTOMER' | 'STAFF' | 'ADMIN';

export default function App() {
  const [route, setRoute] = useState<Route>('CUSTOMER');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    
    // Check for /e/:token pattern (e.g., /e/12345-abcde)
    const entryMatch = path.match(/^\/e\/([^/]+)/);
    if (entryMatch) {
      setToken(entryMatch[1]);
      setRoute('ENTRY');
      return;
    }

    // Portal routes
    const search = new URLSearchParams(window.location.search);
    const portalParam = search.get('portal')?.toLowerCase();

    if (path === '/admin' || portalParam === 'admin') {
      setRoute('ADMIN');
      return;
    }
    if (path === '/staff' || portalParam === 'staff') {
      setRoute('STAFF');
      return;
    }
    
    // Default to customer shell
    setRoute('CUSTOMER');
  }, []);

  // Handle entry token resolution success
  const handleEntryResolved = () => {
    // Clear the URL path to standard customer mode without reloading
    window.history.replaceState({}, '', '/');
    setRoute('CUSTOMER');
  };

  const navigatePortal = (target: 'customer' | 'staff' | 'admin') => {
    if (target === 'customer') {
      window.history.pushState({}, '', '/');
      setRoute('CUSTOMER');
    } else {
      window.history.pushState({}, '', `/${target}`);
      setRoute(target.toUpperCase() as Route);
    }
  };

  // Render the appropriate route
  if (route === 'ENTRY' && token) {
    return <CustomerEntryPage token={token} onResolved={handleEntryResolved} />;
  }

  if (route === 'STAFF' || route === 'ADMIN') {
    return (
      <StaffAuthProvider>
        <StaffPortal 
          portalMode={route.toLowerCase() as 'staff' | 'admin'} 
          navigatePortal={navigatePortal} 
        />
      </StaffAuthProvider>
    );
  }

  // Customer shell (handles its own session phases via TableSessionContext)
  return <CustomerShell />;
}