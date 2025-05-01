import Otp from "@/models/otp";
import { NextResponse } from "next/server";
import { connect } from '@/lib/mongoose';

connect();

export async function POST(req: Request) {
   try {
     const { email, otp } = await req.json();
     console.log("Verifying OTP for email:", email, "Received OTP:", otp);
     
     if (!otp) {
       console.log("Empty OTP received");
       return NextResponse.json({ error: "Verification code is required" }, { status: 472 });
     }
     
     // Normalize the OTP by trimming whitespace and ensuring it's a string
     const normalizedOtp = String(otp).trim();
     console.log("Normalized OTP:", normalizedOtp);
     
     const storedOtp = await Otp.findOne({ email });
     
     if (!storedOtp) {
       console.log("No OTP found in database for email:", email);
       return NextResponse.json({ error: "No verification code found for this email" }, { status: 472 });
     }
     
     console.log("Stored OTP in DB:", storedOtp.otp, "Expiry:", storedOtp.expiresAt);
     
     // Check if OTP is expired
     if (storedOtp.expiresAt < new Date()) {
       console.log("OTP expired at:", storedOtp.expiresAt, "Current time:", new Date());
       await Otp.deleteOne({ email }); // Clean up expired OTP
       return NextResponse.json({ error: "Verification code has expired" }, { status: 472 });
     }
     
     // Normalize the stored OTP as well for consistent comparison
     const normalizedStoredOtp = String(storedOtp.otp).trim();
     
     // Compare normalized values
     if (normalizedStoredOtp !== normalizedOtp) {
       console.log("OTP mismatch - Stored:", normalizedStoredOtp, "Received:", normalizedOtp);
       return NextResponse.json({ error: "Invalid verification code" }, { status: 472 });
     }
   
     console.log("OTP verified successfully for email:", email);
     await Otp.deleteOne({ email }); // Remove OTP after successful verification
     return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 });

   } catch (error:any) {
     console.error("OTP verification error:", error);
     return NextResponse.json({ error: "Failed to verify OTP", details: error.message }, { status: 500 });
   }
}
  