export function parseOllamaJson(text: string): unknown {
  const cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Try direct JSON
  if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
    try {
      return JSON.parse(cleanText);
    } catch {
      // continue
    }
  }

  // Try fenced code block
  const jsonBlockMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    return JSON.parse(jsonBlockMatch[1]);
  }

  // Fallback to substring between first { and last }
  const jsonStart = cleanText.indexOf('{');
  const jsonEnd = cleanText.lastIndexOf('}') + 1;
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    const jsonStr = cleanText.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonStr);
  }

  throw new Error('No valid JSON found in response');
}


