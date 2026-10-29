export const TEXT_PADDING_X = 30;
export const TEXT_PADDING_Y = 20;
export const LINE_HEIGHT_FACTOR = 1.2;

export const drawWrappedText = (
  ctx,
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  justify = true
) => {
  if (!text) return 0;

  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  const words = text.split(" ");
  const lines = [];
  let currentLine = [];

  const larguraDisponivelTexto = maxWidth - TEXT_PADDING_X * 2;

  words.forEach((word) => {
    const testLine = [...currentLine, word].join(" ");
    const metrics = ctx.measureText(testLine);

    if (metrics.width > larguraDisponivelTexto && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [word];
    } else {
      currentLine.push(word);
    }
  });
  lines.push(currentLine);

  const xEsquerdo = x - maxWidth / 2 + TEXT_PADDING_X;

  lines.forEach((lineWords, index) => {
    const isLastLine = index === lines.length - 1;
    const currentY = y + TEXT_PADDING_Y + index * lineHeight;

    if (!justify || isLastLine || lineWords.length <= 1) {
      ctx.fillText(lineWords.join(" "), xEsquerdo, currentY);
    } else {
      const totalWordsWidth = lineWords.reduce(
        (sum, word) => sum + ctx.measureText(word).width,
        0
      );

      const totalSpaceWidth = larguraDisponivelTexto - totalWordsWidth;
      const spaceBetweenWords = totalSpaceWidth / (lineWords.length - 1);

      let currentX = xEsquerdo;

      lineWords.forEach((word) => {
        ctx.fillText(word, currentX, currentY);
        currentX += ctx.measureText(word).width + spaceBetweenWords;
      });
    }
  });

  return lines.length * lineHeight + TEXT_PADDING_Y * 2;
};

export const getTextBoxSize = (
  ctx,
  text,
  fontSize,
  fontFamily,
  maxWidth
) => {
  ctx.font = `${fontSize}px "${fontFamily}", sans-serif`;

  const words = text.split(" ");

  let line = "";
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && line !== "") {
      lines.push(line);
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }

  lines.push(line);

  const lineHeight = fontSize * LINE_HEIGHT_FACTOR;

  const width = Math.min(
    Math.max(...lines.map((l) => ctx.measureText(l).width)),
    maxWidth
  );

  return {
    width: width + TEXT_PADDING_X * 2,
    height: lines.length * lineHeight + TEXT_PADDING_Y * 2,
  };
};

export const createTextBoxMeasurer = () => {
  const textBoxCache = new Map();

  return (ctx, text, size, font, maxWidth) => {
    const key = text + size + font + maxWidth;

    if (textBoxCache.has(key)) {
      return textBoxCache.get(key);
    }

    const result = getTextBoxSize(ctx, text, size, font, maxWidth);
    textBoxCache.set(key, result);

    return result;
  };
};
