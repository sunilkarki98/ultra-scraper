"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomDelay = void 0;
/**
 * randomDelay
 * Pauses execution for a random time between min and max milliseconds.
 */
const randomDelay = async (min = 500, max = 1500) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise((resolve) => setTimeout(resolve, delay));
};
exports.randomDelay = randomDelay;
