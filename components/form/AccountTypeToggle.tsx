import React from 'react';
import { Briefcase, Star } from 'lucide-react';

type AccountType = 'Brand' | 'Influencer';

interface AccountTypeToggleProps {
  selectedType: AccountType | undefined;
  onChange: (type: AccountType) => void;
}

const AccountTypeToggle: React.FC<AccountTypeToggleProps> = ({
  selectedType,
  onChange,
}) => {
  return (
    <div className="flex gap-4 w-full mb-6" role="group" aria-label="Select account type">
      <button
        type="button"
        onClick={() => onChange('Brand')}
        aria-pressed={selectedType === 'Brand'}
        className={`toggle-btn flex-1 flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 relative
          ${selectedType === 'Brand' 
            ? 'bg-gradient-to-r from-[#0EA5E9] to-[#0284c7] text-white border-transparent shadow-lg transform scale-[1.02]' 
            : 'bg-gray-800/80 text-slate-300 border border-gray-700 hover:bg-[#0EA5E9]/20 hover:border-[#0EA5E9]/50 hover:text-[#0EA5E9]'
          }
          focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-1 focus:ring-offset-gray-900 active:scale-[0.98]`}
      >
        {selectedType === 'Brand' && (
          <div className="absolute inset-0 rounded-xl bg-cyan-400/20 animate-pulse pointer-events-none"></div>
        )}
        <Briefcase className={`${selectedType === 'Brand' ? 'w-5 h-5' : 'w-4 h-4'}`} />
        <span>Brand</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('Influencer')}
        aria-pressed={selectedType === 'Influencer'}
        className={`toggle-btn flex-1 flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 relative
          ${selectedType === 'Influencer' 
            ? 'bg-gradient-to-r from-[#ef4698] to-[#e11d8f] text-white border-transparent shadow-lg transform scale-[1.02]' 
            : 'bg-gray-800/80 text-slate-300 border border-gray-700 hover:bg-[#ef4698]/20 hover:border-[#ef4698]/50 hover:text-[#ef4698]'
          }
          focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:ring-offset-1 focus:ring-offset-gray-900 active:scale-[0.98]`}
      >
        {selectedType === 'Influencer' && (
          <div className="absolute inset-0 rounded-xl bg-pink-400/20 animate-pulse pointer-events-none"></div>
        )}
        <Star className={`${selectedType === 'Influencer' ? 'w-5 h-5' : 'w-4 h-4'}`} />
        <span>Influencer</span>
      </button>
    </div>
  );
};

export default AccountTypeToggle;
