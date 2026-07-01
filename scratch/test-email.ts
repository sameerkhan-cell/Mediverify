import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import path from "path";

// Load .env
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function testEmail() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    console.log("SMTP Config Loaded:");
    console.log({ host, port, secure, user });

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        family: 4,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
    });

    try {
        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: `MediVerify <${user}>`,
            to: "rizwanasaeed.321@gmail.com",
            subject: "MediVerify Test Email",
            text: "Hello! This is a test email from MediVerify to confirm SMTP connection."
        });
        console.log("SUCCESS! Message sent: %s", info.messageId);
    } catch (error: any) {
        console.error("ERROR! Failed to send email:", error.message || error);
    }
}

testEmail();
