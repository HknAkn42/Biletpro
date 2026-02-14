// Input Validation Schema
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  numeric?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class Validator {
  static validate(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      // Required validation
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors.push({ field, message: `${field} zorunludur` });
        continue;
      }

      // Skip other validations if field is empty and not required
      if (!value && !rule.required) continue;

      const stringValue = value.toString();

      // Length validation
      if (rule.minLength && stringValue.length < rule.minLength) {
        errors.push({ 
          field, 
          message: `${field} en az ${rule.minLength} karakter olmalıdır` 
        });
      }

      if (rule.maxLength && stringValue.length > rule.maxLength) {
        errors.push({ 
          field, 
          message: `${field} en fazla ${rule.maxLength} karakter olabilir` 
        });
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(stringValue)) {
        errors.push({ 
          field, 
          message: `${field} formatı geçersiz` 
        });
      }

      // Email validation
      if (rule.email && !this.isValidEmail(stringValue)) {
        errors.push({ field, message: 'Geçerli bir e-posta adresi giriniz' });
      }

      // Phone validation
      if (rule.phone && !this.isValidPhone(stringValue)) {
        errors.push({ field, message: 'Geçerli bir telefon numarası giriniz' });
      }

      // Numeric validation
      if (rule.numeric && !this.isNumeric(stringValue)) {
        errors.push({ field, message: `${field} sadece rakamlardan oluşmalıdır` });
      }
    }

    return errors;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+90|0)?[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/[^0-9+]/g, ''));
  }

  static isNumeric(value: string): boolean {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
  }

  static sanitizeHtml(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}

// Common Validation Rules
export const CommonRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },
  email: {
    required: true,
    email: true,
    maxLength: 100
  },
  phone: {
    required: true,
    phone: true
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/
  },
  price: {
    required: true,
    numeric: true,
    pattern: /^\d+(\.\d{1,2})?$/
  }
};
