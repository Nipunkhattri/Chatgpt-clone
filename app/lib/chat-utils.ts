export function generateChatTitle(query: string, maxLength: number = 50): string {
  if (!query || query.trim().length === 0) {
    return 'New Chat';
  }

  let title = query.trim().replace(/\s+/g, ' ');

  const prefixes = [
    /^(hi|hello|hey|greetings),?\s*/i,
    /^(can you|could you|please|would you)\s+/i,
    /^(i need|i want|i would like)\s+/i,
    /^(help me|assist me)\s+/i
  ];
  
  prefixes.forEach(prefix => {
    title = title.replace(prefix, '');
  });

  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (title.length > maxLength) {
    const truncated = title.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.7) {
      title = truncated.substring(0, lastSpace);
    } else {
      title = truncated;
    }
    
    if (title.length < query.trim().length) {
      title += '...';
    }
  }

  title = title.replace(/[.,;:]+$/, '');

  return title || 'New Chat';
}

export function validateChatTitle(title: string, maxLength: number = 100): string | null {
  if (!title || typeof title !== 'string') {
    return null;
  }

  const cleaned = title.trim().replace(/\s+/g, ' ');
  
  if (cleaned.length === 0 || cleaned.length > maxLength) {
    return null;
  }

  return cleaned;
}