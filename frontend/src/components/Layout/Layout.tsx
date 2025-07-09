import React from 'react';
import Header from './Header';
import { useTheme } from '../../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme}`}>
      <Header />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

export default Layout;
