import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: null,
  candidate: null,
  
  setToken: (token) => set({ token }),
  setCandidate: (candidate) => set({ candidate }),
  
  logout: () => set({ token: null, candidate: null }),
}));

