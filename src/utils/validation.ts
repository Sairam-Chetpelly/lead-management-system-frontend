export const validateContactNumber = (contactNumber: string): { isValid: boolean; error?: string } => {
  if (!contactNumber) {
    return { isValid: false, error: 'Contact number is required' };
  }
  
  if (!/^\d{10}$/.test(contactNumber)) {
    return { isValid: false, error: 'Contact number must be exactly 10 digits' };
  }
  
  return { isValid: true };
};

export const formatContactNumber = (value: string): string => {
  // Remove all non-digit characters
  return value.replace(/\D/g, '').slice(0, 10);
};