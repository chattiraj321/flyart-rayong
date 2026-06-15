'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Inbox, PlusCircle } from 'lucide-react';

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Students',
      href: '/students',
      icon: Users,
    },
    {
      label: 'Inquiries',
      href: '/inquiries',
      icon: Inbox,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-t border-[#eae7df] py-2 px-6 flex justify-around items-center pointer-events-auto shadow-lg pb-safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-[2px]'}`} />
              <span className="text-[10px] font-medium mt-1 tracking-wide">{item.label}</span>
              {isActive && (
                <span className="absolute -top-1 w-1 h-1 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
        
        {/* Quick check-in shortcut trigger or create student */}
        <Link
          href="/students?add=true"
          className="flex flex-col items-center justify-center bg-primary text-white p-2.5 rounded-full shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-200 -mt-5 border-4 border-[#fbfaf7]"
          title="Quick Add Student"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.5px]" />
        </Link>
      </div>
    </nav>
  );
}
