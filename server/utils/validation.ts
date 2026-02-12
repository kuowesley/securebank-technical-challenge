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


