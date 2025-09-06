import React from 'react';
import { AdmissionsSidebar } from '@/components/AdmissionsSidebar';
import{ DifficultyLevelManager}  from '@/components/difficulty-levels/DifficultyLevelManager';

export default function DifficultyLevels() {
  return (
    <div className="flex h-screen bg-background">
      <AdmissionsSidebar />
      
      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 md:p-6 pt-16 md:pt-6">
          <DifficultyLevelManager />
        </div>
      </main>
    </div>
  );
}
