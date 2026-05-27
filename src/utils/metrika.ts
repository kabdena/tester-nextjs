const METRIKA_COUNTER_ID = 101586893;

declare global {
  interface Window {
    ym?: (counterId: number, action: string, goal: string) => void;
  }
}

export const reachGoal = (goal: string) => {
  if (typeof window !== 'undefined') {
    window.ym?.(METRIKA_COUNTER_ID, 'reachGoal', goal);
  }
};
