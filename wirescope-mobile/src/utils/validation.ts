export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule[];
}

export interface ValidationErrors {
  [fieldName: string]: string;
}

export const validateField = (value: string, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    if (rule.required && (!value || value.trim() === '')) {
      return rule.message;
    }
    
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message;
    }
    
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message;
    }
    
    if (rule.custom && !rule.custom(value)) {
      return rule.message;
    }
  }
  
  return null;
};

export const validateForm = (data: any, rules: ValidationRules): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  Object.keys(rules).forEach(fieldName => {
    const value = data[fieldName] || '';
    const fieldRules = rules[fieldName];
    const error = validateField(value, fieldRules);
    
    if (error) {
      errors[fieldName] = error;
    }
  });
  
  return errors;
};

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Common validation rules
export const commonRules = {
  email: [
    { required: true, message: 'Email is required' },
    { 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      message: 'Please enter a valid email address' 
    },
  ],
  password: [
    { required: true, message: 'Password is required' },
    { minLength: 8, message: 'Password must be at least 8 characters long' },
  ],
  name: [
    { required: true, message: 'Name is required' },
    { minLength: 2, message: 'Name must be at least 2 characters long' },
  ],
  required: (message: string = 'This field is required') => [
    { required: true, message },
  ],
};