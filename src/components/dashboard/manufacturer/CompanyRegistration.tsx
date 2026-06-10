import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Building2, ShieldCheck, FileText, Phone, Globe, MapPin, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth";
import { useAuth } from "@/lib/auth-context";
import { ease } from "@/lib/motion";

const schema = z.object({
    taxId: z.string().min(5, "Tax ID must be at least 5 characters"),
    registrationNumber: z.string().min(5, "Registration Number is required"),
    businessAddress: z.string().min(10, "Full business address is required"),
    businessPhone: z.string().min(8, "Valid contact number is required"),
    businessEmail: z.string().email("Enter a valid business email"),
    website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export function CompanyRegistrationForm() {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const [step, setStep] = React.useState<1 | 2>(1);
    const [registeredEmail, setRegisteredEmail] = React.useState("");
    const [otp, setOtp] = React.useState("");
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [isSendingOtp, setIsSendingOtp] = React.useState(false);
    const [lastOtpEmail, setLastOtpEmail] = React.useState("");
    const [lastOtpSentAt, setLastOtpSentAt] = React.useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const sendOtpToBusinessEmail = React.useCallback(async (email: string) => {
        const parsed = z.string().email().safeParse(email.trim());
        if (!parsed.success || isSendingOtp) return;

        const now = Date.now();
        const isSameEmailCooldown = email === lastOtpEmail && now - lastOtpSentAt < 60_000;
        if (isSameEmailCooldown) return;

        setIsSendingOtp(true);
        try {
            await authService.sendCompanyOtp(email);
            setLastOtpEmail(email);
            setLastOtpSentAt(now);
            toast.success("Verification code sent", {
                description: `A 6-digit OTP has been sent to ${email}.`,
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to send verification code.");
        } finally {
            setIsSendingOtp(false);
        }
    }, [isSendingOtp, lastOtpEmail, lastOtpSentAt]);

    const onDetailsSubmit = async (data: FormData) => {
        try {
            await authService.registerCompany(data);
            setRegisteredEmail(data.businessEmail);
            setLastOtpEmail(data.businessEmail);
            setLastOtpSentAt(Date.now());
            toast.success("Details Saved", {
                description: "A verification code has been sent to " + data.businessEmail,
            });
            setStep(2);
        } catch (error: any) {
            toast.error(error.message || "Failed to submit registration.");
        }
    };

    const onOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error("Please enter a valid 6-digit code.");
            return;
        }

        setIsVerifying(true);
        try {
            await authService.verifyCompanyOtp(otp);
            updateUser({ isVerified: true });
            toast.success("Company Verified!", {
                description: "Welcome to your manufacturer dashboard.",
            });
            navigate({ to: "/dashboard/manufacturer", replace: true });
        } catch (error: any) {
            toast.error(error.message || "Invalid or expired verification code.");
        } finally {
            setIsVerifying(false);
        }
    };

    if (step === 2) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card-premium p-8 max-w-xl mx-auto"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Verify Business Email</h2>
                        <p className="text-sm text-muted-foreground">We've sent a 6-digit code to <span className="text-foreground font-semibold">{registeredEmail}</span></p>
                    </div>
                </div>

                <form onSubmit={onOtpSubmit} className="space-y-6">
                    <div className="flex justify-center gap-2">
                        <input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="h-16 w-full max-w-[300px] text-center text-4xl font-black tracking-[0.5em] rounded-2xl border border-border/60 bg-secondary/20 focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                            placeholder="000000"
                            autoFocus
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isVerifying || otp.length !== 6}
                        className="h-12 w-full rounded-xl bg-gradient-primary shadow-elegant transition-all hover:scale-[1.01] active:scale-[0.99] font-bold"
                    >
                        {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Finalize"}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                        Didn't receive the code?{" "}
                        <button
                            type="button"
                            onClick={() => void sendOtpToBusinessEmail(registeredEmail)}
                            disabled={isSendingOtp}
                            className="text-primary font-bold hover:underline disabled:opacity-50"
                        >
                            {isSendingOtp ? "Sending..." : "Resend code"}
                        </button>{" "}
                        or{" "}
                        <button type="button" onClick={() => setStep(1)} className="text-primary font-bold hover:underline">Go back</button>.
                    </p>
                </form>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="card-premium p-8"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Company Registration</h2>
                    <p className="text-sm text-muted-foreground">Complete your profile to unlock medicine batch registration and QR generation.</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="h-3 w-3" /> Tax ID / NTN
                                </label>
                                <input
                                    {...register("taxId")}
                                    className="h-11 w-full rounded-xl border border-border/60 bg-secondary/20 px-4 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                                    placeholder="e.g. 1234567-8"
                                />
                                {errors.taxId && <p className="text-[10px] text-destructive font-medium">{errors.taxId.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> Drug License / Reg No.
                                </label>
                                <input
                                    {...register("registrationNumber")}
                                    className="h-11 w-full rounded-xl border border-border/60 bg-secondary/20 px-4 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                                    placeholder="e.g. LIC-MFG-2026-X"
                                />
                                {errors.registrationNumber && <p className="text-[10px] text-destructive font-medium">{errors.registrationNumber.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Registered Business Address
                            </label>
                            <textarea
                                {...register("businessAddress")}
                                className="min-h-[100px] w-full rounded-xl border border-border/60 bg-secondary/20 p-4 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none"
                                placeholder="Enter the full legal address of your manufacturing facility..."
                            />
                            {errors.businessAddress && <p className="text-[10px] text-destructive font-medium">{errors.businessAddress.message}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> Business Phone
                                </label>
                                <input
                                    {...register("businessPhone")}
                                    className="h-11 w-full rounded-xl border border-border/60 bg-secondary/20 px-4 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                                    placeholder="+92 300 1234567"
                                />
                                {errors.businessPhone && <p className="text-[10px] text-destructive font-medium">{errors.businessPhone.message}</p>}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="h-3 w-3" /> Business Email
                                    </label>
                                    <input
                                        {...register("businessEmail")}
                                        className="h-11 w-full rounded-xl border border-border/60 bg-secondary/20 px-4 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                                        placeholder="regulatory@company.com"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        A verification code will be sent to this email after you submit the form.
                                    </p>
                                    {errors.businessEmail && <p className="text-[10px] text-destructive font-medium">{errors.businessEmail.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="h-3 w-3" /> Official Website (Optional)
                                    </label>
                                    <input
                                        {...register("website")}
                                        className="h-11 w-full rounded-xl border border-border/60 bg-secondary/20 px-4 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                                        placeholder="https://www.company.com"
                                    />
                                    {errors.website && <p className="text-[10px] text-destructive font-medium">{errors.website.message}</p>}
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-12 w-full rounded-xl bg-gradient-primary shadow-elegant transition-all hover:scale-[1.01] active:scale-[0.99] font-bold"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Submit for Verification"
                            )}
                        </Button>
                    </form>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl bg-secondary/30 border border-border/40 p-6 space-y-4">
                        <h4 className="font-bold flex items-center gap-2 text-primary">
                            <Info className="h-4 w-4" /> Why verify?
                        </h4>
                        <ul className="space-y-3">
                            {[
                                "Enable Medicine Batch Registration",
                                "Generate Unique Pill Level QR Codes",
                                "Access Supply Chain Monitoring",
                                "Receive Regulatory Compliance Alerts",
                                "Verify Authenticity to Global Markets"
                            ].map((item, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-primary" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl bg-warning/5 border border-warning/20 p-6">
                        <p className="text-[11px] font-bold text-warning-foreground uppercase tracking-widest mb-2">Legal Notice</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Submitting false information is a violation of DRAP regulations and may lead to immediate account suspension and legal action.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
