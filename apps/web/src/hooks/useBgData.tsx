import { create } from 'zustand'
import { BgDataItem, BgDataType } from '../types'

interface BgDataState {
  // 数据状态
  personalities: BgDataItem[]
  intentions: BgDataItem[]
  resources: BgDataItem[]
  accountStyles: BgDataItem[]
  
  // 当前选择的项目
  currentPersonality: BgDataItem | null
  currentIntention: BgDataItem | null
  currentResource: BgDataItem | null
  currentAccountStyle: BgDataItem | null
  
  // 加载状态
  isLoading: boolean
  
  // 从服务器刷新数据
  refreshUserBackground: () => Promise<void>
  
  // 数据操作
  addItem: (type: BgDataType, item: Omit<BgDataItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateItem: (id: string, updates: Partial<Pick<BgDataItem, 'name' | 'description' | 'content'>>) => Promise<boolean>
  deleteItem: (id: string) => Promise<boolean>
  
  // 当前选择项操作
  setCurrentItem: (type: BgDataType, item: BgDataItem | null) => void
  getCurrentItem: (type: BgDataType) => BgDataItem | null
  
  // 本地状态操作（用于乐观更新）
  setData: (data: { personalities: BgDataItem[], intentions: BgDataItem[], resources: BgDataItem[], accountStyles: BgDataItem[] }) => void
  setLoading: (loading: boolean) => void
  clearAllData: () => void
}

export const useBgData = create<BgDataState>()((set, _get) => ({
      // 初始状态
      personalities: [],
      intentions: [],
      resources: [],
      accountStyles: [],
      
      // 当前选择的项目
      currentPersonality: null,
      currentIntention: null,
      currentResource: null,
      currentAccountStyle: null,
      
      isLoading: false,
      
      // 从服务器刷新数据
      refreshUserBackground: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/user-bg')
          if (!response.ok) {
            throw new Error('Failed to fetch user background data')
          }
          
          const result = await response.json()
          set({
            personalities: result.data.personalities || [],
            intentions: result.data.intentions || [],
            resources: result.data.resources || [],
            accountStyles: result.data.accountStyles || [],
            isLoading: false,
          })
        } catch (error) {
          console.error('Error refreshing user background:', error)
          set({ isLoading: false })
        }
      },
      
      // 新增项目
      addItem: async (type: BgDataType, item) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/user-bg', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type,
              ...item,
            }),
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create item')
          }
          
          const result = await response.json()
          const newItem = result.data
          
          // 更新本地状态
          set((state) => ({
            [type]: [...state[type], newItem],
            isLoading: false,
          }))
          
          return true
        } catch (error) {
          console.error('Error adding item:', error)
          set({ isLoading: false })
          return false
        }
      },
      
      // 更新项目
      updateItem: async (id: string, updates) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`/api/user-bg/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...updates,
            }),
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update item')
          }
          
          const result = await response.json()
          const updatedItem = result.data
          
          // 更新本地状态
          set((state) => {
            const updateArray = (items: BgDataItem[]) =>
              items.map((item) => (item.id === id ? updatedItem : item))
            
            return {
              personalities: updateArray(state.personalities),
              intentions: updateArray(state.intentions),
              resources: updateArray(state.resources),
              accountStyles: updateArray(state.accountStyles),
              isLoading: false,
            }
          })
          
          return true
        } catch (error) {
          console.error('Error updating item:', error)
          set({ isLoading: false })
          return false
        }
      },
      
      // 删除项目
      deleteItem: async (id: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`/api/user-bg/${id}`, {
            method: 'DELETE',
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete item')
          }
          
          // 更新本地状态
          set((state) => {
            const filterArray = (items: BgDataItem[]) =>
              items.filter((item) => item.id !== id)
            
            // 检查被删除的项目是否是当前选择项，如果是则清除
            const newState: any = {
              personalities: filterArray(state.personalities),
              intentions: filterArray(state.intentions),
              resources: filterArray(state.resources),
              accountStyles: filterArray(state.accountStyles),
              isLoading: false,
            }
            
            // 清除当前选择项（如果被删除）
            if (state.currentPersonality?.id === id) {
              newState.currentPersonality = null
            }
            if (state.currentIntention?.id === id) {
              newState.currentIntention = null
            }
            if (state.currentResource?.id === id) {
              newState.currentResource = null
            }
            if (state.currentAccountStyle?.id === id) {
              newState.currentAccountStyle = null
            }
            
            return newState
          })
          
          return true
        } catch (error) {
          console.error('Error deleting item:', error)
          set({ isLoading: false })
          return false
        }
      },
      
      // 设置当前选择项
      setCurrentItem: (type: BgDataType, item: BgDataItem | null) => {
        switch (type) {
          case 'personalities':
            set({ currentPersonality: item })
            break
          case 'intentions':
            set({ currentIntention: item })
            break
          case 'resources':
            set({ currentResource: item })
            break
          case 'accountStyles':
            set({ currentAccountStyle: item })
            break
        }
      },
      
      // 获取当前选择项
      getCurrentItem: (type: BgDataType) => {
        const state = _get()
        switch (type) {
          case 'personalities':
            return state.currentPersonality
          case 'intentions':
            return state.currentIntention
          case 'resources':
            return state.currentResource
          case 'accountStyles':
            return state.currentAccountStyle
          default:
            return null
        }
      },
      
      // 设置数据
      setData: (data) => {
        set(data)
      },
      
      // 设置加载状态
      setLoading: (loading) => {
        set({ isLoading: loading })
      },
      
      // 清除所有数据
      clearAllData: () => {
        set({
          personalities: [],
          intentions: [],
          resources: [],
          accountStyles: [],
          currentPersonality: null,
          currentIntention: null,
          currentResource: null,
          currentAccountStyle: null,
        })
      },
    })) 