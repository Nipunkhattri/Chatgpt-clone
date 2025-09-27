/**
 * Generates a concise, meaningful title from a user query
 * @param query - The user's query/message
 * @param maxLength - Maximum length of the generated title (default: 50)
 * @returns A clean, readable title
 */
export function generateChatTitle(query: string, maxLength: number = 50): string {
  if (!query || query.trim().length === 0) {
    return 'New Chat';
  }

  // Remove excessive whitespace and normalize
  let title = query.trim().replace(/\s+/g, ' ');

  // Remove common chat prefixes
  const prefixes = [
    /^(hi|hello|hey|greetings),?\s*/i,
    /^(can you|could you|please|would you)\s+/i,
    /^(i need|i want|i would like)\s+/i,
    /^(help me|assist me)\s+/i
  ];
  
  prefixes.forEach(prefix => {
    title = title.replace(prefix, '');
  });

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // If still too long, truncate at word boundary
  if (title.length > maxLength) {
    const truncated = title.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.7) {
      title = truncated.substring(0, lastSpace);
    } else {
      title = truncated;
    }
    
    // Add ellipsis if truncated
    if (title.length < query.trim().length) {
      title += '...';
    }
  }

  // Remove trailing punctuation except for question marks and exclamation points
  title = title.replace(/[.,;:]+$/, '');

  return title || 'New Chat';
}

/**
 * Validates and cleans a user-provided title
 * @param title - The title to validate
 * @param maxLength - Maximum allowed length
 * @returns Cleaned title or null if invalid
 */
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