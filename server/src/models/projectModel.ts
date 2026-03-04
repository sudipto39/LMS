import mongoose, { Schema, Document, Types } from 'mongoose';
import type { User } from './userModel.js';

export type ProjectStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface Project extends Document {
  title: string;
  description: string;

  owner: Types.ObjectId | User;
  supervisor?: Types.ObjectId | User;

  course?: Types.ObjectId;
  batch?: Types.ObjectId;

  repoUrl?: string;

  status: ProjectStatus;

  technologies?: string[];

  startDate?: Date;
  endDate?: Date;

  isActive: boolean;
}

const projectSchema = new Schema<Project>(
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
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    repoUrl: {
      type: String,
      trim: true,
      unique: true,
      required: true,
      sparse: true, // allow multiple nulls
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'archived'],
      default: 'draft',
    },
    technologies: [{ type: String, trim: true }],
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true, // soft delete / visibility
    },
  },
  { timestamps: true }
);

// Indexes for dashboards
projectSchema.index({ supervisor: 1, status: 1 });
projectSchema.index({ owner: 1 });

const ProjectModel = mongoose.model<Project>('Project', projectSchema);
export default ProjectModel;
