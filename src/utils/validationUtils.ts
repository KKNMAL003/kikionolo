import * as Yup from 'yup';
import { t } from './i18n';

// Common validation patterns
const patterns = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{4,10}$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  hexColor: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
  ipAddress: /^(\d{1,3}\.){3}\d{1,3}$/,
} as const;

// Common validation error messages
const messages = {
  required: (field: string) => t('validation.required', { field }),
  email: t('validation.email'),
  min: (field: string, min: number) =>
    t('validation.min', { field, min }),
  max: (field: string, max: number) =>
    t('validation.max', { field, max }),
  minLength: (field: string, length: number) =>
    t('validation.minLength', { field, length }),
  maxLength: (field: string, length: number) =>
    t('validation.maxLength', { field, length }),
  url: t('validation.url'),
  phone: t('validation.phone'),
  username: t('validation.username'),
  password: t('validation.password'),
  hexColor: t('validation.hexColor'),
  ipAddress: t('validation.ipAddress'),
  match: (field: string, otherField: string) =>
    t('validation.match', { field, otherField }),
  oneOf: (field: string, values: string[]) =>
    t('validation.oneOf', { field, values: values.join(', ') }),
} as const;

// Common validation rules
export const validationRules = {
  required: (field: string) =>
    Yup.string().required(messages.required(field)),
  
  email: (field = 'Email') =>
    Yup.string()
      .email(messages.email)
      .required(messages.required(field)),
  
  password: (field = 'Password') =>
    Yup.string()
      .min(8, messages.minLength(field, 8))
      .matches(patterns.password, messages.password)
      .required(messages.required(field)),
  
  confirmPassword: (field = 'Password', confirmField = 'Confirm Password') =>
    Yup.string()
      .oneOf([Yup.ref(field.toLowerCase())], messages.match(confirmField, field))
      .required(messages.required(confirmField)),
  
  username: (field = 'Username') =>
    Yup.string()
      .min(3, messages.minLength(field, 3))
      .max(20, messages.maxLength(field, 20))
      .matches(patterns.username, messages.username)
      .required(messages.required(field)),
  
  phone: (field = 'Phone') =>
    Yup.string()
      .matches(patterns.phone, messages.phone)
      .required(messages.required(field)),
  
  url: (field = 'URL') =>
    Yup.string()
      .matches(patterns.url, messages.url)
      .required(messages.required(field)),
  
  hexColor: (field = 'Color') =>
    Yup.string()
      .matches(patterns.hexColor, messages.hexColor)
      .required(messages.required(field)),
  
  ipAddress: (field = 'IP Address') =>
    Yup.string()
      .matches(patterns.ipAddress, messages.ipAddress)
      .required(messages.required(field)),
  
  number: (field: string, min?: number, max?: number) => {
    let schema = Yup.number().typeError(t('validation.number', { field }));
    
    if (min !== undefined) {
      schema = schema.min(min, messages.min(field, min));
    }
    
    if (max !== undefined) {
      schema = schema.max(max, messages.max(field, max));
    }
    
    return schema.required(messages.required(field));
  },
  
  array: (field: string, min?: number, max?: number) => {
    let schema = Yup.array();
    
    if (min !== undefined) {
      schema = schema.min(min, t('validation.array.min', { field, min }));
    }
    
    if (max !== undefined) {
      schema = schema.max(max, t('validation.array.max', { field, max }));
    }
    
    return schema.required(messages.required(field));
  },
} as const;

/**
 * Create a validation schema for a form
 */
export const createValidationSchema = <T extends Record<string, any>>(
  schema: Record<keyof T, Yup.AnySchema>
) => {
  return Yup.object().shape(schema);
};

/**
 * Validate a value against a schema
 */
export const validateField = async <T>(
  value: T,
  schema: Yup.Schema<T>
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    await schema.validate(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return { isValid: false, error: error.message };
    }
    return { isValid: false, error: t('validation.unknown') };
  }
};

/**
 * Validate multiple fields at once
 */
export const validateFields = async <T extends Record<string, any>>(
  values: T,
  schema: Yup.ObjectSchema<Record<keyof T, Yup.AnySchema>>
): Promise<{ isValid: boolean; errors: Record<keyof T, string> }> => {
  try {
    await schema.validate(values, { abortEarly: false });
    return { isValid: true, errors: {} as Record<keyof T, string> };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      const errors = error.inner.reduce<Record<string, string>>((acc, curr) => {
        if (curr.path) {
          acc[curr.path] = curr.message;
        }
        return acc;
      }, {});
      
      return {
        isValid: false,
        errors: errors as Record<keyof T, string>,
      };
    }
    
    return {
      isValid: false,
      errors: Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: t('validation.unknown') }),
        {}
      ) as Record<keyof T, string>,
    };
  }
};

/**
 * Create a form validator function
 */
export const createFormValidator = <T extends Record<string, any>>(
  schema: Yup.ObjectSchema<Record<keyof T, Yup.AnySchema>>
) => {
  return async (values: T) => {
    try {
      await schema.validate(values, { abortEarly: false });
      return {};
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return error.inner.reduce<Record<string, string>>((errors, err) => {
          if (err.path) {
            errors[err.path] = err.message;
          }
          return errors;
        }, {});
      }
      return {};
    }
  };
};

/**
 * Create a field validator function
 */
export const createFieldValidator = <T>(
  schema: Yup.Schema<T>
): ((value: T) => Promise<string | undefined>) => {
  return async (value: T) => {
    try {
      await schema.validate(value);
      return undefined;
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return error.message;
      }
      return t('validation.unknown');
    }
  };
};

/**
 * Debounced validation
 */
export const debouncedValidation = <T>(
  validate: (value: T) => Promise<string | undefined>,
  delay: number = 500
) => {
  let timeout: NodeJS.Timeout;
  
  return (value: T): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(async () => {
        const error = await validate(value);
        resolve(error);
      }, delay);
    });
  };
};

/**
 * Validate if a value is a valid email
 */
export const isEmail = (value: string): boolean => {
  return patterns.email.test(value);
};

/**
 * Validate if a value is a valid URL
 */
export const isUrl = (value: string): boolean => {
  return patterns.url.test(value);
};

/**
 * Validate if a value is a valid phone number
 */
export const isPhone = (value: string): boolean => {
  return patterns.phone.test(value);
};

/**
 * Validate if a value is a valid username
 */
export const isUsername = (value: string): boolean => {
  return patterns.username.test(value);
};

/**
 * Validate if a value is a strong password
 */
export const isStrongPassword = (value: string): boolean => {
  return patterns.password.test(value);
};

/**
 * Validate if a value is a valid hex color
 */
export const isHexColor = (value: string): boolean => {
  return patterns.hexColor.test(value);
};

/**
 * Validate if a value is a valid IP address
 */
export const isIpAddress = (value: string): boolean => {
  return patterns.ipAddress.test(value);
};

export default {
  // Schemas
  validationRules,
  createValidationSchema,
  
  // Validation functions
  validateField,
  validateFields,
  createFormValidator,
  createFieldValidator,
  debouncedValidation,
  
  // Type validators
  isEmail,
  isUrl,
  isPhone,
  isUsername,
  isStrongPassword,
  isHexColor,
  isIpAddress,
  
  // Patterns
  patterns,
  
  // Messages
  messages,
};
