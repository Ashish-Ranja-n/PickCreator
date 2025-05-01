import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000) }, // 5 mins expiration
});

const Otp = mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
export default Otp;
