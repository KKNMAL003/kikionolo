// Comprehensive profile validation utilities

export interface ValidationRule {
  field: string;
  validator: (value: any) => boolean;
  message: string;
  required?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

// Email validation with comprehensive regex
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim());
};

// Phone validation (international format supported)
export const isValidPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // South African numbers: 10 digits starting with 0, or 11 digits starting with 27
  // International format: 7-15 digits
  return (
    (cleanPhone.length === 10 && cleanPhone.startsWith('0')) ||
    (cleanPhone.length === 11 && cleanPhone.startsWith('27')) ||
    (cleanPhone.length >= 7 && cleanPhone.length <= 15)
  );
};

// Name validation
export const isValidName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  
  const trimmedName = name.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 100 && /^[a-zA-Z\s'-]+$/.test(trimmedName);
};

// Address validation
export const isValidAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  
  const trimmedAddress = address.trim();
  return trimmedAddress.length >= 10 && trimmedAddress.length <= 500;
};

// Postal code validation (South African format)
export const isValidPostalCode = (postalCode: string): boolean => {
  if (!postalCode || typeof postalCode !== 'string') return false;
  
  return /^\d{4}$/.test(postalCode.trim());
};

// Define validation rules
export const profileValidationRules: ValidationRule[] = [
  {
    field: 'name',
    validator: isValidName,
    message: 'Name must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes',
    required: true
  },
  {
    field: 'email',
    validator: isValidEmail,
    message: 'Please enter a valid email address',
    required: false // Optional but must be valid if provided
  },
  {
    field: 'phone',
    validator: isValidPhone,
    message: 'Please enter a valid phone number (7-15 digits)',
    required: true
  },
  {
    field: 'streetAddress',
    validator: isValidAddress,
    message: 'Street address must be 10-500 characters long',
    required: true
  },
  {
    field: 'city',
    validator: (city: string) => {
      if (!city || typeof city !== 'string') return false;
      const trimmedCity = city.trim();
      return trimmedCity.length >= 2 && trimmedCity.length <= 100;
    },
    message: 'City must be 2-100 characters long',
    required: true
  },
  {
    field: 'postalCode',
    validator: isValidPostalCode,
    message: 'Postal code must be 4 digits (South African format)',
    required: false
  }
];

// Validate profile data
export const validateProfileData = (data: Record<string, any>): ValidationResult => {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};

  for (const rule of profileValidationRules) {
    const value = data[rule.field];
    const fieldErrors: string[] = [];

    // Check if required field is missing
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      fieldErrors.push(`${rule.field} is required`);
    }

    // If value exists, validate it
    if (value && typeof value === 'string' && value.trim()) {
      if (!rule.validator(value)) {
        fieldErrors.push(rule.message);
      }
    }

    // Store errors if any
    if (fieldErrors.length > 0) {
      errors[rule.field] = fieldErrors;
    }
  }

  // Additional cross-field validations
  if (data.email && !data.email.trim() && data.name) {
    warnings.email = ['Email is recommended for order confirmations and updates'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: Object.keys(warnings).length > 0 ? warnings : undefined
  };
};

// Real-time field validation
export const validateField = (fieldName: string, value: any): { isValid: boolean; error?: string } => {
  const rule = profileValidationRules.find(r => r.field === fieldName);
  
  if (!rule) {
    return { isValid: true };
  }

  // Check if required field is empty
  if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  // If value exists, validate it
  if (value && typeof value === 'string' && value.trim()) {
    if (!rule.validator(value)) {
      return { isValid: false, error: rule.message };
    }
  }

  return { isValid: true };
};

// Sanitize input data
export const sanitizeProfileData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Trim whitespace and normalize
      let sanitizedValue = value.trim();
      
      // Specific sanitization based on field type
      switch (key) {
        case 'email':
          sanitizedValue = sanitizedValue.toLowerCase();
          break;
        case 'name':
        case 'city':
        case 'state':
        case 'country':
          // Capitalize first letter of each word
          sanitizedValue = sanitizedValue.replace(/\b\w/g, l => l.toUpperCase());
          break;
        case 'phone':
          // Remove non-numeric characters except + at the beginning
          sanitizedValue = sanitizedValue.replace(/(?!^\+)\D/g, '');
          break;
        case 'postalCode':
          // Remove non-numeric characters
          sanitizedValue = sanitizedValue.replace(/\D/g, '');
          break;
      }
      
      sanitized[key] = sanitizedValue;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};