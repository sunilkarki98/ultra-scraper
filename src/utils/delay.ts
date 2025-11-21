/**
 * randomDelay
 * Pauses execution for a random time between min and max milliseconds.
 */
export const randomDelay = async (min = 500, max = 1500): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise((resolve) => setTimeout(resolve, delay));
};