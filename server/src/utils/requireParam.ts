import { BadRequestError } from "./appError.js";

export const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (!value || Array.isArray(value)) {
    throw new BadRequestError(`Missing or invalid parameter: ${name}`);
  }
  return value;
};