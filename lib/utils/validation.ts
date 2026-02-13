export const MIN_AGE = 18;
export const MAX_AGE = 120;

export const validateDateOfBirth = (value: string) => {
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(value);
  if (!match) {
    return { valid: false, message: "Date of birth must be a valid date" };
  }

  const [yearString, monthString, dayString] = value.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return { valid: false, message: "Date of birth must be a valid date" };
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { valid: false, message: "Date of birth must be a valid date" };
  }

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (date > todayDate) {
    return { valid: false, message: "Date of birth cannot be in the future" };
  }

  let age = todayDate.getFullYear() - year;
  const monthDiff = todayDate.getMonth() - (month - 1);
  if (monthDiff < 0 || (monthDiff === 0 && todayDate.getDate() < day)) {
    age -= 1;
  }

  if (age < MIN_AGE) {
    return { valid: false, message: `You must be at least ${MIN_AGE} years old` };
  }

  if (age > MAX_AGE) {
    return { valid: false, message: `Age must be ${MAX_AGE} or younger` };
  }

  return { valid: true, message: undefined };
};

export const MIN_PASSWORD_LENGTH = 12;
export const COMMON_PASSWORDS = [
  "password",
  "12345678",
  "qwerty",
  "letmein",
  "admin",
  "welcome",
  "iloveyou",
  "123456789",
  "password1",
  "abc123",
];

export const validatePassword = (value: string) => {
  const errors: string[] = [];

  if (value.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (COMMON_PASSWORDS.includes(value.toLowerCase())) {
    errors.push("Password is too common");
  }

  if (!/[a-z]/.test(value)) {
    errors.push("Password must contain a lowercase letter");
  }

  if (!/[A-Z]/.test(value)) {
    errors.push("Password must contain an uppercase letter");
  }

  if (!/\d/.test(value)) {
    errors.push("Password must contain a number");
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    errors.push("Password must contain a symbol");
  }

  return { valid: errors.length === 0, errors };
};

export const normalizeCardNumber = (value: string) => {
  return value.replace(/[\s-]/g, "");
};

export const isValidCardNumber = (value: string) => {
  const normalized = normalizeCardNumber(value);
  if (!/^\d{13,19}$/.test(normalized)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;
  for (let i = normalized.length - 1; i >= 0; i -= 1) {
    let digit = Number(normalized[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

export const isValidBankAccountNumber = (value: string) => /^\d{4,17}$/.test(value);

export const VALID_STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "AS", "GU", "MP", "PR", "VI"
];

export const validateState = (value: string) => {
  if (!VALID_STATE_CODES.includes(value.toUpperCase())) {
    return { valid: false, message: "Invalid state code" };
  }
  return { valid: true };
};

export const normalizePhoneNumber = (value: string) => {
  return value.replace(/[\s\-\(\)\.]/g, "");
};

export const validatePhoneNumber = (value: string) => {
  const normalized = normalizePhoneNumber(value);
  if (!/^\+?[1-9]\d{7,14}$/.test(normalized)) {
    return { valid: false, message: "Invalid phone number (E.164 format expected)" };
  }
  return { valid: true };
};

export const COMMON_TYPOS = [".con", ".cmo", ".cm", "@gamil.com", "@yaho.com"];
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateEmail = (value: string) => {
  if (!EMAIL_REGEX.test(value)) {
    return { valid: false, message: "Invalid email address" };
  }
  for (const typo of COMMON_TYPOS) {
    if (value.toLowerCase().endsWith(typo)) {
      const corrected = value.replace(new RegExp(`${typo}$`), ".com");
      return {
        valid: false,
        message: `Did you mean ${corrected}?`,
      };
    }
  }
  return { valid: true };
};
