"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ModelContextType {
  modelName: string;
  setModelName: (name: string) => void;
  modelConfig: any;
  setModelConfig: (config: any) => void;
  modelConfigs: any[];
  setModelConfigs: (configs: any[]) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [modelName, setModelName] = useState("gpt-4");
  const [modelConfig, setModelConfig] = useState({});
  const [modelConfigs, setModelConfigs] = useState([]);

  return (
    <ModelContext.Provider
      value={{
        modelName,
        setModelName,
        modelConfig,
        setModelConfig,
        modelConfigs,
        setModelConfigs,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
} 