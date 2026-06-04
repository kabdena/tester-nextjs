import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
} from 'docx';

export type ConvertVariant = {
  text: string;
  correct: boolean;
};

export type ConvertQuestion = {
  question: string;
  variants: ConvertVariant[];
  images: string[];
};

export type ConvertWarnings = {
  tablesFound: number;
  skippedNoVariants: number;
  questionsWithoutCorrect: number;
  imagesCount: number;
};

export type ConvertResult = {
  questions: ConvertQuestion[];
  warnings: ConvertWarnings;
};

// Удаляет zero-width и подобные невидимые символы, схлопывает пробелы.
const normalizeText = (raw: string): string =>
  raw
    .replace(/[​‌‍﻿⁠]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const QUESTION_NUMBER_RE = /^\s*\d+\s*[.)]\s+/;

// Минимальная длина пункта-списка, чтобы в «списочном» формате (где вопросы и
// варианты — всё <li>) считать его новым вопросом-виньеткой, а не вариантом.
const LIST_QUESTION_MIN_LEN = 140;

// Срезает ведущую нумерацию вопроса («12. », «3) ») и нормализует.
const stripQuestionNumber = (text: string): string =>
  normalizeText(text.replace(QUESTION_NUMBER_RE, ''));

// Срезает ведущий «+» (маркер правильного ответа) и нормализует.
const stripCorrectMarker = (text: string): string =>
  normalizeText(text.replace(/^\s*\+\s*/, ''));

const collectImages = (el: Element): string[] =>
  Array.from(el.querySelectorAll('img'))
    .map((img) => img.getAttribute('src') || '')
    .filter(Boolean);

type SourceItem = {
  kind: 'p' | 'li' | 'table';
  text: string;
  numbered: boolean;
  correct: boolean;
  images: string[];
};

type WorkingQuestion = ConvertQuestion & { hasCorrect: boolean };

// Собирает плоский упорядоченный список значимых узлов документа.
const collectItems = (root: Element): SourceItem[] => {
  const items: SourceItem[] = [];

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();

      if (tag === 'ol' || tag === 'ul') {
        walk(child);
        continue;
      }

      if (tag === 'table') {
        items.push({
          kind: 'table',
          text: '',
          numbered: false,
          correct: false,
          images: [],
        });
        continue;
      }

      if (tag === 'li' || tag === 'p' || /^h[1-6]$/.test(tag)) {
        const raw = child.textContent || '';
        const text = normalizeText(raw);
        const correct =
          !!child.querySelector('strong, b') || /^\s*\+/.test(text);
        items.push({
          kind: tag === 'li' ? 'li' : 'p',
          text,
          numbered: tag !== 'li' && QUESTION_NUMBER_RE.test(raw),
          correct,
          images: collectImages(child),
        });
        continue;
      }

      if (child.children.length) {
        walk(child);
      }
    }
  };

  walk(root);
  return items;
};

/**
 * Парсит HTML (от mammoth) теста в «нумерованном» формате. Поддерживает два
 * варианта вёрстки выгрузок Platonus:
 *  1) абзацный — вопрос это абзац с номером «N.», варианты идут списком <li>;
 *  2) списочный — и вопрос, и варианты являются пунктами <li> авто-нумерованного
 *     списка (номер не попадает в текст), вопрос-виньетка распознаётся по «?»
 *     либо по заметной длине.
 * Правильный вариант помечен жирным (<strong>) и/или префиксом «+».
 */
export const parseSourceHtml = (html: string): ConvertResult => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const items = collectItems(doc.body);

  // Определяем формат: если нумерованных абзацев мало относительно числа
  // правильных меток — значит вопросы свёрстаны списком (вариант 2).
  const numberedP = items.filter((i) => i.kind === 'p' && i.numbered).length;
  const correctCount = items.filter((i) => i.correct).length;
  const listMode = numberedP < Math.max(5, correctCount * 0.3);

  const working: WorkingQuestion[] = [];
  let current: WorkingQuestion | null = null;
  let pendingImages: string[] = [];
  let tablesFound = 0;

  const startQuestion = (
    question: string,
    images: string[],
  ): WorkingQuestion => {
    const q: WorkingQuestion = {
      question,
      variants: [],
      images: [...pendingImages, ...images],
      hasCorrect: false,
    };
    pendingImages = [];
    working.push(q);
    return q;
  };

  for (const it of items) {
    if (it.kind === 'table') {
      tablesFound += 1;
      continue;
    }

    const endsWithQuestion = it.text.endsWith('?');

    let isStart = false;
    if (it.kind === 'p' && it.numbered) {
      isStart = true;
    } else if (current === null) {
      isStart = endsWithQuestion;
    } else if (endsWithQuestion) {
      // «?» начинает новый вопрос, только если у текущего уже есть варианты —
      // иначе это продолжение многострочного ствола вопроса.
      isStart = current.variants.length > 0;
    } else if (
      listMode &&
      it.kind === 'li' &&
      current.hasCorrect &&
      !it.correct &&
      it.text.length >= LIST_QUESTION_MIN_LEN
    ) {
      isStart = true;
    }

    if (isStart) {
      current = startQuestion(
        it.kind === 'p' ? stripQuestionNumber(it.text) : it.text,
        it.images,
      );
      continue;
    }

    if (current === null) {
      pendingImages.push(...it.images);
      continue;
    }

    current.images.push(...it.images);

    if (it.kind === 'li') {
      const text = stripCorrectMarker(it.text);
      if (text) {
        current.variants.push({ text, correct: it.correct });
        if (it.correct) current.hasCorrect = true;
      }
    } else if (current.variants.length === 0 && it.text) {
      // Абзац без номера до первого варианта — продолжение ствола вопроса.
      current.question = normalizeText(`${current.question} ${it.text}`);
    }
  }

  const questions: ConvertQuestion[] = [];
  const warnings: ConvertWarnings = {
    tablesFound,
    skippedNoVariants: 0,
    questionsWithoutCorrect: 0,
    imagesCount: 0,
  };

  for (const q of working) {
    if (q.variants.length === 0) {
      warnings.skippedNoVariants += 1;
      continue;
    }
    // Правильный вариант должен идти первым — целевой парсер берёт его по позиции.
    const correctIndex = q.variants.findIndex((v) => v.correct);
    if (correctIndex > 0) {
      const [correct] = q.variants.splice(correctIndex, 1);
      q.variants.unshift(correct);
    }
    if (correctIndex === -1) {
      warnings.questionsWithoutCorrect += 1;
    }
    warnings.imagesCount += q.images.length;
    questions.push({
      question: q.question,
      variants: q.variants,
      images: q.images,
    });
  }

  return { questions, warnings };
};

type ParsedImage = { data: Uint8Array; type: 'jpg' | 'png' | 'gif' | 'bmp' };

// data:image/...;base64,XXXX → бинарные данные + тип для ImageRun.
const parseDataUri = (uri: string): ParsedImage | null => {
  const match = /^data:image\/([a-zA-Z0-9.+-]+);base64,(.*)$/.exec(uri);
  if (!match) return null;

  const rawType = match[1].toLowerCase();
  const type: ParsedImage['type'] =
    rawType === 'jpeg' || rawType === 'jpg'
      ? 'jpg'
      : rawType === 'png'
        ? 'png'
        : rawType === 'gif'
          ? 'gif'
          : rawType === 'bmp'
            ? 'bmp'
            : 'png';

  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { data: bytes, type };
  } catch {
    return null;
  }
};

/**
 * Собирает .docx в формате тестера: каждый вопрос — абзац «<question>…»,
 * затем картинки, затем варианты «<variant>…» (правильный первым, с «+»).
 */
export const buildTesterDocx = (questions: ConvertQuestion[]): Promise<Blob> => {
  const children: Paragraph[] = [];

  for (const q of questions) {
    children.push(
      new Paragraph({ children: [new TextRun(`<question>${q.question}`)] }),
    );

    for (const img of q.images) {
      const parsed = parseDataUri(img);
      if (!parsed) continue;
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: parsed.type,
              data: parsed.data,
              transformation: { width: 400, height: 300 },
            }),
          ],
        }),
      );
    }

    for (const v of q.variants) {
      const suffix = v.correct ? '+' : '';
      children.push(
        new Paragraph({
          children: [new TextRun(`<variant>${v.text}${suffix}`)],
        }),
      );
    }

    // Пустой абзац-разделитель между вопросами.
    children.push(new Paragraph({ children: [] }));
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
};
