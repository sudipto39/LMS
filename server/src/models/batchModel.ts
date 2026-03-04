import mongoose, { Schema, Document, Types } from "mongoose";

export interface Batch extends Document {
  name: string;

  course: Types.ObjectId;

  startYear: number;
  endYear: number;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<Batch>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    startYear: {
      type: Number,
      required: true,
    },

    endYear: {
      type: Number,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

batchSchema.index({ course: 1, startYear: 1 });

const BatchModel = mongoose.model<Batch>("Batch", batchSchema);

export default BatchModel;