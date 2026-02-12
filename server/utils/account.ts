export const generateAccountNumber = (): string => {
  return Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(10, "0");
};
