'use client';

import { useAuth } from '@/context/AuthContext';
import { Bell, Settings } from 'lucide-react';

export default function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-4">
        <div>
          <h2 className="text-sm text-gray-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }).toUpperCase()}
          </h2>
          <h1 className="text-xl font-light tracking-wide mt-1">Executive Summary</h1>
        </div>
        
        <div className="flex items-center space-x-6">
          <button className="text-gray-700 hover:text-gray-900 transition-colors">
            <Bell size={20} />
          </button>
          <button className="text-gray-700 hover:text-gray-900 transition-colors">
            <Settings size={20} />
          </button>
          <div className="h-10 w-10 rounded-full bg-linear-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-semibold text-sm">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
