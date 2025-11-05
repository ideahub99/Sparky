
import React from 'react';
import type { User } from '../types';
import { LogoIcon } from './icons';

interface HeaderProps {
  user: User;
  credits: number;
  onUpgrade: () => void;
  onTogglePlan: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, credits, onUpgrade, onTogglePlan }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <LogoIcon className="h-8 w-8 text-indigo-400" />
          <h1 className="text-xl font-bold text-white">My Face AI</h1>
        </div>
        <div className="flex items-center gap-4">
           {/* This toggle is for demo purposes to easily switch between user states */}
           <button onClick={onTogglePlan} className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">
            Toggle Plan
          </button>
          <div className="text-right">
            <p className="font-semibold">{user.username}</p>
            <p className="text-sm text-gray-400">
              <span className="font-bold text-indigo-400">{credits}</span> Credits
            </p>
          </div>
          {user.plan.name === 'Free' && (
            <button
              onClick={onUpgrade}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
