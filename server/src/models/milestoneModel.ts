import mongoose, { Schema, Document, Types } from 'mongoose';
import type { Project } from './projectModel.js';

export type MilestoneStatus =
  | 'pending'
  | 'in-progress'
  | 'submitted'
  | 'approved'
  | 'rejected';

export interface Milestone extends Document {
  title: string;
  description: string;

  project: Types.ObjectId | Project;
  order: number;

  dueDate?: Date;

  submittedAt?: Date;
  submittedBy?: Types.ObjectId;

  status: MilestoneStatus;

  supervisorFeedback?: string;

  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;

  studentNotes?: string;

  isActive: boolean;
}

const milestoneSchema = new Schema<Milestone>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    dueDate: Date,

    submittedAt: Date,
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    status: {
      type: String,
      enum: ['pending', 'in-progress', 'submitted', 'approved', 'rejected'],
      default: 'pending',
    },

    supervisorFeedback: {
      type: String,
      default: '',
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,

    studentNotes: {
      type: String,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
milestoneSchema.index({ project: 1, order: 1 });
milestoneSchema.index({ project: 1, status: 1 });
milestoneSchema.index({ dueDate: 1 });

const MilestoneModel = mongoose.model<Milestone>('Milestone', milestoneSchema);
export default MilestoneModel;
