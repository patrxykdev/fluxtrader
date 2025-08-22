// frontend/src/components/builder/builderStore.ts
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import api from '../../api';
import type { Condition, StrategyConfiguration, IndicatorType, ExitCondition } from './types';

interface BuilderState {
  conditions: Condition[];
  logicalOperator: 'AND' | 'OR';
  action: 'LONG' | 'SHORT';
  exitCondition: ExitCondition;
  savedStrategies: Array<{ id: number; name: string }>;
  
  // Actions
  setLogicalOperator: (operator: 'AND' | 'OR') => void;
  setAction: (action: 'LONG' | 'SHORT') => void;
  setExitCondition: (exitCondition: ExitCondition) => void;
  addCondition: () => void;
  updateCondition: (id: string, field: keyof Condition, value: any) => void;
  removeCondition: (id: string) => void;
  resetBuilder: () => void;
  saveStrategy: (name: string) => Promise<any>;
  fetchSavedStrategies: () => Promise<void>;
  loadStrategy: (id: number) => any;
  deleteStrategy: (strategyId: number) => Promise<void>;
}

const initialState = {
  conditions: [{ 
    id: nanoid(), 
    indicator: 'RSI' as IndicatorType, 
    operator: 'less_than' as const, 
    value: '30',
    period: 14
  }],
  logicalOperator: 'AND' as const,
  action: 'LONG' as const,
  exitCondition: {
    type: 'manual' as const
  },
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  ...initialState,
  savedStrategies: [],

  setLogicalOperator: (operator) => set({ logicalOperator: operator }),
  setAction: (action) => set({ action: action }),
  setExitCondition: (exitCondition) => set({ exitCondition }),
  
  addCondition: () => {
    const newCondition: Condition = { 
      id: nanoid(), 
      indicator: 'MACD', 
      operator: 'crosses_above', 
      value: 'Signal Line',
      fast_period: 12,
      slow_period: 26,
      signal_period: 9
    };
    set(state => ({ conditions: [...state.conditions, newCondition] }));
  },
  
  updateCondition: (id, field, value) => {
    set(state => ({ 
      conditions: state.conditions.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      ) 
    }));
  },
  
  removeCondition: (id) => {
    set(state => ({ conditions: state.conditions.filter(c => c.id !== id) }));
  },
  
  resetBuilder: () => set(initialState),
  
  saveStrategy: async (name) => {
    const { conditions, logicalOperator, action, fetchSavedStrategies } = get();
    const trimmedName = name.trim();
    if (!trimmedName || conditions.length === 0) { 
      throw new Error('Please provide a name and add at least one condition.'); 
    }
    if (get().savedStrategies.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) { 
      throw new Error(`A strategy named "${trimmedName}" already exists.`); 
    }
    const strategyConfiguration: StrategyConfiguration = { conditions, logicalOperator, action, exitCondition: get().exitCondition };
    const response = await api.post('/api/strategies/', { name: trimmedName, configuration: strategyConfiguration });
    fetchSavedStrategies();
    return response;
  },

  fetchSavedStrategies: async () => {
    try {
      const response = await api.get('/api/strategies/');
      set({ savedStrategies: response.data });
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    }
  },

  loadStrategy: async (strategyId) => {
    try {
      const response = await api.get(`/api/strategies/${strategyId}/`);
      const strategy = response.data;
      
      // Update the builder state with the loaded strategy
      set({
        conditions: strategy.configuration.conditions || [],
        logicalOperator: strategy.configuration.logicalOperator || 'AND',
        action: strategy.configuration.action || 'LONG',
        exitCondition: strategy.configuration.exitCondition || { type: 'manual' }
      });
      
      return strategy;
    } catch (error) {
      console.error('Failed to load strategy:', error);
      return null;
    }
  },

  deleteStrategy: async (strategyId) => {
    if (!strategyId) return;
    await api.delete(`/api/strategies/${strategyId}/`);
    get().fetchSavedStrategies();
    get().resetBuilder();
  }
}));