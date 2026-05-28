import { create } from 'zustand'

export type ToolType = 
  | 'home'
  | 'merge'
  | 'split'
  | 'compress'
  | 'image-to-pdf'
  | 'word-to-pdf'
  | 'excel-to-pdf'
  | 'pdf-to-word'
  | 'pdf-to-excel'

interface AppState {
  activeTool: ToolType
  setActiveTool: (tool: ToolType) => void
  processingQueue: string[]
  addToQueue: (jobId: string) => void
  removeFromQueue: (jobId: string) => void
  isProcessing: boolean
  setIsProcessing: (val: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTool: 'home',
  setActiveTool: (tool) => set({ activeTool: tool }),
  processingQueue: [],
  addToQueue: (jobId) => set((state) => ({ processingQueue: [...state.processingQueue, jobId] })),
  removeFromQueue: (jobId) => set((state) => ({ 
    processingQueue: state.processingQueue.filter(id => id !== jobId) 
  })),
  isProcessing: false,
  setIsProcessing: (val) => set({ isProcessing: val }),
}))
