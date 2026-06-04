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

/**
 * Парсит HTML (полученный из mammoth) «нумерованного» формата выгрузки:
 * вопрос — абзац, начинающийся с «N.»; варианты — пункты списка <li> под ним;
 * правильный вариант помечен жирным (<strong>) и/или префиксом «+».
 */
export const parseSourceHtml = (html: string): ConvertResult => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const questions: ConvertQuestion[] = [];
  const warnings: ConvertWarnings = {
    tablesFound: 0,
    skippedNoVariants: 0,
    questionsWithoutCorrect: 0,
    imagesCount: 0,
  };

  let current: ConvertQuestion | null = null;

  const finishCurrent = () => {
    if (!current) return;
    if (current.variants.length === 0) {
      warnings.skippedNoVariants += 1;
    } else {
      // Правильный вариант должен идти первым — целевой парсер берёт его по позиции.
      const correctIndex = current.variants.findIndex((v) => v.correct);
      if (correctIndex > 0) {
        const [correct] = current.variants.splice(correctIndex, 1);
        current.variants.unshift(correct);
      }
      if (correctIndex === -1) {
        warnings.questionsWithoutCorrect += 1;
      }
      questions.push(current);
    }
    current = null;
  };

  const addVariant = (li: Element) => {
    if (!current) return;
    const rawText = li.textContent || '';
    const isCorrect =
      !!li.querySelector('strong, b') || /^\s*\+/.test(normalizeText(rawText));
    const text = stripCorrectMarker(rawText);
    if (!text) return;
    current.variants.push({ text, correct: isCorrect });
  };

  // Рекурсивный обход верхнего уровня по порядку появления узлов.
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();

      if (tag === 'ol' || tag === 'ul') {
        walk(child);
        continue;
      }

      if (tag === 'li') {
        addVariant(child);
        continue;
      }

      if (tag === 'table') {
        warnings.tablesFound += 1;
        continue;
      }

      if (tag === 'p' || /^h[1-6]$/.test(tag)) {
        const text = child.textContent || '';
        const images = collectImages(child);

        if (QUESTION_NUMBER_RE.test(text)) {
          finishCurrent();
          current = {
            question: stripQuestionNumber(text),
            variants: [],
            images,
          };
          warnings.imagesCount += images.length;
          continue;
        }

        // Абзац без номера: продолжение текста вопроса (если вариантов ещё нет),
        // иначе — заголовок-разделитель между вопросами, игнорируем.
        if (current && current.variants.length === 0) {
          const extra = normalizeText(text);
          if (extra) {
            current.question = normalizeText(`${current.question} ${extra}`);
          }
          if (images.length) {
            current.images.push(...images);
            warnings.imagesCount += images.length;
          }
        } else if (current && images.length) {
          current.images.push(...images);
          warnings.imagesCount += images.length;
        }
        continue;
      }

      // Прочие контейнеры — заходим внутрь.
      if (child.children.length) {
        walk(child);
      }
    }
  };

  walk(doc.body);
  finishCurrent();

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
