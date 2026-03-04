import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcrypt";
import { config } from "../config/env.js";

const SALT_ROUNDS = 12;

export interface User extends Document {
  name: string;
  universityId: string;
  email: string;
  password: string;
  phoneNumber: string;
  department: string;
  role: "student" | "supervisor" | "admin";
  course?: Types.ObjectId;
  batch?: Types.ObjectId;
  isVerified: boolean;
  verifyCode?: string;
  verifyCodeExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  passwordChangedAt?: Date;

  isCorrectPassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    universityId: {
      type: String,
      required: [true, "University ID is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Email is invalid"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "supervisor", "admin"],
      default: "student",
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyCode: String,
    verifyCodeExpiry: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
  },
  { timestamps: true },
);

// Password hashing
userSchema.pre<User>("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);

  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

// Password comparison
userSchema.methods.isCorrectPassword = async function (
  this: User,
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Optional post-save hook
userSchema.post<User>("save", async function (doc) {
  if (config.EMAIL_VERIFICATION && doc.isNew && doc.verifyCode) {
    console.log("📧 Email verification code:", doc.verifyCode);
  }
});

const UserModel = mongoose.model<User>("User", userSchema);
export default UserModel;
