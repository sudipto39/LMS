import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { config } from "../config/env.js";

const SALT_ROUNDS = 12;

/**
 * USER INTERFACE
 */
export interface User extends Document {
  name: string;
  universityId: string;
  email: string;
  password: string;
  phoneNumber: number;
  department: string;
  session: number;
  role: string;

  // Email verification
  isVerified: boolean;
  verifyCode?: string;
  verifyCodeExpiry?: Date;

  passwordChangedAt?: Date;

  isCorrectPassword(candidatePassword: string): Promise<boolean>;
}

/**
 * USER SCHEMA
 */
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
      select: false, // 🔐 important
    },
    phoneNumber: {
      type: Number,
      required: [true, "Phone number is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
    },
    session: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      default: "student",
    },

    // Email verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyCode: {
      type: String,
    },
    verifyCodeExpiry: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

/**
 * PASSWORD HASHING
 */
userSchema.pre<User>("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);

  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

/**
 * PASSWORD COMPARISON
 */
userSchema.methods.isCorrectPassword = async function (
  this: User,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * POST-SAVE EMAIL HOOK (optional)
 */
userSchema.post<User>("save", async function (doc) {
  if (config.EMAIL_VERIFICATION && doc.isNew && doc.verifyCode) {
    console.log("📧 Email verification code:", doc.verifyCode);
    // await emailService.sendVerificationEmail(...)
  }
});

/**
 * MODEL
 */
const UserModel = mongoose.model<User>("User", userSchema);
export default UserModel;
