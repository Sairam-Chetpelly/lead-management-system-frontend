export interface ValidationError {
  field: string;
  message: string;
}

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Please enter your email address';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address (e.g., user@example.com)';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Please enter your phone number';
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) return 'Please enter a valid phone number (e.g., +1234567890)';
  return null;
};

export const validatePassword = (password: string, isEdit = false): string | null => {
  if (!isEdit && !password) return 'Please create a password';
  if (password && password.length < 6) return 'Password must be at least 6 characters long';
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') {
    const friendlyNames: { [key: string]: string } = {
      'Name': 'Please enter the name',
      'Role name': 'Please select a role',
      'Status name': 'Please enter the status name',
      'Centre name': 'Please enter the centre name',
      'Language name': 'Please enter the language name',
      'Type': 'Please select a type',
      'Description': 'Please enter a description',
      'Designation': 'Please enter the designation',
      'Role': 'Please select a role',
      'Status': 'Please select a status',
      'Status type': 'Please select a status type',
      'Language code': 'Please enter the language code'
    };
    return friendlyNames[fieldName] || `Please enter ${fieldName.toLowerCase()}`;
  }
  return null;
};

export const validateSlug = (slug: string): string | null => {
  if (!slug) return 'Identifier is required (this is auto-generated from the name)';
  const slugRegex = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) return 'Identifier can only contain lowercase letters, numbers, hyphens, and underscores';
  return null;
};

const friendlyErrorMessages: { [key: string]: string } = {
  // Duplicate/Unique errors
  'email already exists': 'This email address is already registered. Please use a different email.',
  'email already in use': 'This email address is already registered. Please use a different email.',
  'duplicate key error': 'This information already exists. Please use different details.',
  'slug already exists': 'This identifier is already taken. Please choose a different name.',
  'name already exists': 'This name is already taken. Please choose a different name.',
  'code already exists': 'This code is already in use. Please choose a different code.',
  
  // Validation errors
  'validation failed': 'Please check all required fields and try again.',
  'invalid email': 'Please enter a valid email address (e.g., user@example.com).',
  'invalid phone': 'Please enter a valid phone number.',
  'password too short': 'Password must be at least 6 characters long.',
  'required field missing': 'Please fill in all required fields.',
  
  // Permission errors
  'access denied': 'You do not have permission to perform this action.',
  'unauthorized': 'Please log in to continue.',
  'forbidden': 'You are not allowed to access this resource.',
  
  // Network/Server errors
  'network error': 'Connection problem. Please check your internet and try again.',
  'server error': 'Something went wrong on our end. Please try again in a moment.',
  'timeout': 'Request took too long. Please try again.',
  
  // Not found errors
  'not found': 'The requested item could not be found.',
  'user not found': 'User account not found.',
  'record not found': 'The requested record could not be found.',
};

export const extractErrorMessage = (error: any): string => {
  let errorMessage = '';
  
  // Extract the raw error message
  if (error.response?.data?.error) {
    errorMessage = error.response.data.error;
  } else if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  } else {
    return 'Something went wrong. Please try again.';
  }
  
  // Convert to lowercase for matching
  const lowerMessage = errorMessage.toLowerCase();
  
  // Check for specific error patterns
  for (const [pattern, friendlyMessage] of Object.entries(friendlyErrorMessages)) {
    if (lowerMessage.includes(pattern)) {
      return friendlyMessage;
    }
  }
  
  // Handle MongoDB duplicate key errors
  if (lowerMessage.includes('e11000') || lowerMessage.includes('duplicate')) {
    if (lowerMessage.includes('email')) {
      return 'This email address is already registered. Please use a different email.';
    } else if (lowerMessage.includes('slug')) {
      return 'This name is already taken. Please choose a different name.';
    } else if (lowerMessage.includes('code')) {
      return 'This code is already in use. Please choose a different code.';
    }
    return 'This information already exists. Please use different details.';
  }
  
  // Handle validation errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('required')) {
    return 'Please fill in all required fields correctly.';
  }
  
  // Handle network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Connection problem. Please check your internet and try again.';
  }
  
  // Return a cleaned up version of the original message if no pattern matches
  return errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1) + '. Please try again.';
};