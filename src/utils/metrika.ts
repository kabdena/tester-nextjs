const METRIKA_COUNTER_ID = 101586893;

declare global {
  interface Window {
    ym?: (counterId: number, action: string, payload: unknown) => void;
  }
}

export const reachGoal = (goal: string) => {
  if (typeof window !== 'undefined') {
    window.ym?.(METRIKA_COUNTER_ID, 'reachGoal', goal);
  }
};

// Параметры визита. Только обезличенные значения: никаких идентификаторов
// пользователя и содержимого тестов.
export const sendVisitParams = (
  params: Record<string, string | boolean>,
  attempt = 0,
) => {
  if (typeof window === 'undefined') return;
  if (window.ym) {
    window.ym(METRIKA_COUNTER_ID, 'params', params);
  } else if (attempt < 20) {
    // Скрипт Метрики подключается после гидратации — подождём его.
    setTimeout(() => sendVisitParams(params, attempt + 1), 500);
  }
};
