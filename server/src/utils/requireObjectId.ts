import mongoose from 'mongoose';
import { AppError } from './appError.js';

export const requireObjectId = (id?: string) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid id', 400);
  }
  return new mongoose.Types.ObjectId(id);
};