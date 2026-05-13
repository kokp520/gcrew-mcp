const complexKeywords = ["refactor", "architect", "debug", "design", "implement", "重構", "設計", "除錯", "實作"];

export function autoAssignModel(title: string, description: string, context?: string): string | undefined {
  const fullContent = (title + description + (context || "")).toLowerCase();
  const isComplex = complexKeywords.some(kw => fullContent.includes(kw));
  const isShort = fullContent.length < 200;

  if (isShort && !isComplex) {
    return "gemini-1.5-flash";
  }
  
  return undefined;
}
