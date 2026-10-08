"use client";

import { createContext, useContext } from "react";

type TourContextValue = {
  startTour: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({
  value,
  children,
}: {
  value: TourContextValue;
  children: React.ReactNode;
}) {
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  return useContext(TourContext);
}
