import { models, Schema } from "mongoose";
import User from "./user";

interface IAdmin {
  permissions?: string[];
  bio?: string;
  instagram?: {
    username?: string;
    profilePicture?: string;
    followersCount?: number;
    connected?: boolean;
  };
}

const AdminSchema = new Schema<IAdmin>({
  permissions: { type: [String], default: ["manage-users", "view-reports", "approve-content", "manage-deals"] },
  bio: { type: String, default: "" },
  instagram: {
    username: { type: String },
    profilePicture: { type: String },
    followersCount: { type: Number },
    connected: { type: Boolean, default: false }
  }
});

export const Admin = models.Admin || User.discriminator<IAdmin>("Admin", AdminSchema);
