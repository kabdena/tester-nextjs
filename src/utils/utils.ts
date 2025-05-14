export const getEndOfTheWord = (n: number, wordEnds: string[]) => {
  n = Math.abs(n) % 100;
  const n1 = n % 10;

  if (n > 10 && n < 20) {
    return wordEnds[2];
  }

  if (n1 > 1 && n1 < 5) {
    return wordEnds[1];
  }

  if (n1 === 1) {
    return wordEnds[0];
  }

  return wordEnds[2];
};
