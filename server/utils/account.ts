import crypto from "crypto";

export const generateAccountNumber = (): string => {
  // Generate a secure random integer between 0 and 9,999,999,999
  const num = crypto.randomInt(0, 10000000000);
  return num.toString().padStart(10, "0");
};

