import Logger from 'argon-logger';

export const logger = new Logger();

export function hasOwn(obj, prop) {
    if (obj && typeof obj === 'object') {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }
    return false;
}