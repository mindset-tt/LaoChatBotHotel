// String manipulation utilities
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const camelToTitle = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export const kebabToTitle = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .split('-')
    .map(word => capitalizeFirst(word))
    .join(' ');
};

export const snakeToTitle = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .split('_')
    .map(word => capitalizeFirst(word))
    .join(' ');
};

// Generate initials from a name
export const getInitials = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return '';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Generate a random ID
export const generateId = (length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Safe JSON parsing
export const safeJsonParse = <T>(json: string, defaultValue: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
};
