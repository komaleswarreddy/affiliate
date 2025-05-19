import React from 'react';
import { Link } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const sidebarItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { 
      name: 'Affiliate Management', 
      path: '#',
      subItems: [
        { name: 'All Affiliates', path: '/affiliates/all' },
        { name: 'Pending Approvals', path: '/affiliates/pending' },
        { name: 'Affiliate Tiers', path: '/affiliates/tiers' },
      ],
    },
    { 
      name: 'Commissions', 
      path: '#',
      subItems: [
        { name: 'Commission Tiers', path: '/commissions/tiers' },
        { name: 'Product Commissions', path: '/commissions/products' },
        { name: 'Commission Rules', path: '/commissions/rules' },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold">Affiliate Platform</div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarItems.map((item) => (
            <div key={item.name}>
              {item.path !== '#' ? (
                <Link to={item.path} className="block py-2 px-4 rounded hover:bg-gray-700">
                  {item.name}
                </Link>
              ) : (
                <div>
                  <div className="flex justify-between items-center py-2 px-4">
                    <span>{item.name}</span>
                    {/* Add expand/collapse icon here */}
                  </div>
                  {item.subItems && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.name}>
                          <Link to={subItem.path} className="block py-2 px-4 rounded hover:bg-gray-700">
                            {subItem.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
      {/* Content area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AppLayout; 