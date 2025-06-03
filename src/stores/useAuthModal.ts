import { create } from 'zustand';

type AuthModalState = {
  isOpen: boolean;
  activeTab: 'login' | 'signup';
  openModal: (tab: 'login' | 'signup') => void;
  closeModal: () => void;
};

export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  activeTab: 'login',
  openModal: (tab) => set({ isOpen: true, activeTab: tab }),
  closeModal: () => set({ isOpen: false }),
}));
