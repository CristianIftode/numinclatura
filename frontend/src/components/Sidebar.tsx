import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
}

interface NavLink {
  to: string;
  text: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  
  const links: NavLink[] = [
    { to: '/dashboard', text: 'Главная' },
    { to: '/currencies', text: 'Валюты' },
    { to: '/categories', text: 'Справочник категорий' },
  ];

  return (
    <div className={`bg-gray-800 text-white h-full fixed left-0 top-0 transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="py-4">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center px-4 py-2 hover:bg-gray-700 transition-colors ${
              location.pathname === link.to ? 'bg-gray-700' : ''
            }`}
          >
            {isOpen && <span>{link.text}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 