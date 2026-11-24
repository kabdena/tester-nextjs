// Стабильные идентификаторы файлов и вопросов — на них держатся история
// попыток и «Работа над ошибками». Считаются локально, никуда не отправляются.

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

// Запасной хеш (FNV-1a, 2×32 бита) для окружений без WebCrypto
// (http не на localhost, очень старые браузеры).
const fallbackHash = (bytes: Uint8Array): string => {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < bytes.length; i++) {
    h1 = Math.imul(h1 ^ bytes[i], 0x01000193);
    h2 = Math.imul(h2 ^ bytes[i], 0x811c9dc5);
  }
  return (
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0')
  );
};

const sha256 = async (data: ArrayBuffer | Uint8Array): Promise<string> => {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      return toHex(await crypto.subtle.digest('SHA-256', bytes));
    } catch {
      // упадём в запасной вариант
    }
  }
  return fallbackHash(bytes);
};

const encode = (text: string) => new TextEncoder().encode(text);

// Нижний регистр, ё→е, схлопнутые пробелы, без завершающей пунктуации.
export const normalizeForId = (text: string): string =>
  text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .replace(/[\s.,;:!?…]+$/, '')
    .trim();

export const getFileId = async (content: ArrayBuffer): Promise<string> =>
  `f_${(await sha256(content)).slice(0, 32)}`;

// Для файлов, сохранённых до появления fileId: содержимого уже нет,
// поэтому ID считаем по имени и вопросам.
export const getLegacyFileId = async (
  name: string,
  questionIds: string[],
): Promise<string> =>
  `l_${(await sha256(encode(`${name}\u0000${questionIds.join(',')}`))).slice(0, 32)}`;

type IdentifiableQuestion = {
  question: string;
  variants: { text: string; correct: boolean }[];
};

// Вопрос = нормализованный текст вопроса + правильный ответ. Так один и тот же
// вопрос в другом файле или в исправленной версии банка узнаётся как тот же.
export const getQuestionId = async (
  question: IdentifiableQuestion,
): Promise<string> => {
  const correct = question.variants.find((v) => v.correct)?.text ?? '';
  const key = `${normalizeForId(question.question)}\u0000${normalizeForId(correct)}`;
  return `q_${(await sha256(encode(key))).slice(0, 32)}`;
};

// Проставляет id вопросам, у которых его ещё нет.
export const withQuestionIds = async <
  T extends IdentifiableQuestion & { id?: string },
>(
  questions: T[],
  extra?: Partial<T>,
): Promise<T[]> =>
  Promise.all(
    questions.map(async (q) => ({
      ...q,
      ...extra,
      id: q.id ?? (await getQuestionId(q)),
    })),
  );
