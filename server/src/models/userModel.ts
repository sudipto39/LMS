import mongoose, {Schema, Document, type Date} from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export interface User extends Document {
    name: string;
    email: string;
    password: string;
    phoneNumber: number;
    department: string;
    yearOfStudy: number;
    semester: number;
    yearOfPassingOut: number;
    dateOfBirth: Date;
    role: string;
    verifyCode: string;
    passwordChangedAt: number;
    isCorrectPassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<User> = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'is invalid']
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    phoneNumber: {
        type: Number,
        required: [true, "Phone number is required"]
    },
    department: {
        type: String,
        required: [true, "Department is required"]
    },
    yearOfStudy: {
        type: Number,
        required: [true, "Year of study is required"]
    },
    semester: {
        type: Number,
        required: true
    },
    yearOfPassingOut: {
        type: Number,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    role :{
        type : String,
        default : "student"
    },
    verifyCode :{
        type : String
    },
    passwordChangedAt: Date,
}, {timestamps: true});

userSchema.pre<User>("save", async function () {
  if (!this.isModified("password")) return;
  if (!this.password) return;

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);

  if (!this.isNew) {
    this.passwordChangedAt = Date.now()- 1000;
  }
});

userSchema.methods.isCorrectPassword = async function (
  this: User,
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const userrModel = mongoose.model<User>('User', userSchema);

export default userrModel;