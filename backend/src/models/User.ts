import mongoose, { Schema } from "mongoose";

export type RoleType = "STUDENT | ADMIN | EXAMINER";

export interface IUser extends Document {
    name: string,
    email: string,
    role: RoleType,
    password: string,
    comparePassword(candidatePassword: string): Promise<boolean>,
    isActive: Boolean
}

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ["STUDENT", "ADMIN", "EXAMINER"],
        default: "STUDENT"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
    const bcrypt = import("bcryptjs");

    return (await bcrypt).compare(candidatePassword, this.password);
}

export default mongoose.model<IUser>("User", UserSchema);