import { useState, useCallback } from 'react';
import { CrewMember } from '../types';
import { INITIAL_CREW } from '../data/mockData';

export const useCrew = () => {
  const [crew, setCrew] = useState<CrewMember[]>(INITIAL_CREW);
  const [isCrewOpen, setIsCrewOpen] = useState(false);

  const inviteFriend = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const initials = trimmed
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const colors = [
      'bg-[#ffb59c] text-[#5c1900]',
      'bg-[#ffb86d] text-[#492900]',
      'bg-[#ff5449] text-white',
      'bg-[#353436] text-[#ffdcbd]',
    ];

    setCrew((prev) => {
      const color = colors[prev.length % colors.length];
      const newMember: CrewMember = {
        id: `crew-${Date.now()}`,
        name: trimmed,
        initials: initials || 'FR',
        color,
        itemCount: 0,
      };
      return [...prev, newMember];
    });
  }, []);

  return {
    crew,
    isCrewOpen,
    setIsCrewOpen,
    inviteFriend,
    crewCount: crew.length,
  };
};
