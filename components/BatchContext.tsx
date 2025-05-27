"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface BatchAction {
  id: string;
  label: string;
  data: any;
}

interface BatchContextType {
  batch: BatchAction[];
  addAction: (action: BatchAction) => void;
  removeAction: (id: string) => void;
  clearBatch: () => void;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export function useBatch() {
  const ctx = useContext(BatchContext);
  if (!ctx) throw new Error("useBatch must be used within a BatchProvider");
  return ctx;
}

export function BatchProvider({ children }: { children: ReactNode }) {
  const [batch, setBatch] = useState<BatchAction[]>([]);

  const addAction = (action: BatchAction) => {
    setBatch((prev) => [...prev, action]);
  };
  const removeAction = (id: string) => {
    setBatch((prev) => prev.filter((a) => a.id !== id));
  };
  const clearBatch = () => setBatch([]);

  return (
    <BatchContext.Provider value={{ batch, addAction, removeAction, clearBatch }}>
      {children}
    </BatchContext.Provider>
  );
}
