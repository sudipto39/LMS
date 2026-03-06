import mongoose, { Schema, Document, Types } from "mongoose";

export interface Course extends Document {
  name: string;
  code: string;
  school: string;

  durationYears: number;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<Course>(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },

    code: {
      type: String,
      // required: [true, "Course code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    school: {
      type: String,
      required: true,
      trim: true,
    },

    durationYears: {
      type: Number,
      default: 4,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const CourseModel = mongoose.model<Course>("Course", courseSchema);

export default CourseModel;