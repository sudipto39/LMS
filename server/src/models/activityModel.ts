// import mongoose, { Schema, Document, Types } from 'mongoose';

// export type ActivityType =
//   | 'push'
//   | 'milestone'
//   | 'review'
//   | 'submission'
//   | 'project'
//   | 'comment'
//   | 'system';

// export interface Activity extends Document {
//   actor?: Types.ObjectId;        // User who caused the activity
//   project?: Types.ObjectId;      // Related project
//   milestone?: Types.ObjectId;    // Related milestone 

//   type: ActivityType;
//   message: string;

//   metadata?: Record<string, any>; // commitId, branch, repo, etc.
//   createdAt: Date;
// }

// const activitySchema = new Schema<Activity>(
//   {
//     actor: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//     },
//     project: {
//       type: Schema.Types.ObjectId,
//       ref: 'Project',
//     },
//     milestone: {
//       type: Schema.Types.ObjectId,
//       ref: 'Milestone',
//     },
//     type: {
//       type: String,
//       enum: [
//         'push',
//         'milestone',
//         'review',
//         'submission',
//         'project',
//         'comment',
//         'system',
//       ],
//       required: true,
//     },
//     message: {
//       type: String,
//       required: true,
//     },
//     metadata: {
//       type: Schema.Types.Mixed,
//       default: {},
//     },
//   },
//   { timestamps: true }
// );

// activitySchema.index({ project: 1, createdAt: -1 });
// activitySchema.index({ actor: 1, createdAt: -1 });
// activitySchema.index({ type: 1, createdAt: -1 });

// const ActivityModel = mongoose.model<Activity>('Activity', activitySchema);
// export default ActivityModel;

import mongoose, { Schema, Types } from "mongoose";

export type ActivityType =
  | "push"
  | "milestone"
  | "review"
  | "submission"
  | "project"
  | "comment"
  | "system";

const activitySchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    milestone: {
      type: Schema.Types.ObjectId,
      ref: "Milestone",
    },
    type: {
      type: String,
      enum: [
        "push",
        "milestone",
        "review",
        "submission",
        "project",
        "comment",
        "system",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

export type Activity = mongoose.InferSchemaType<typeof activitySchema>;

const ActivityModel = mongoose.model("Activity", activitySchema);

export default ActivityModel;