import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authService } from "@/services/auth";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ease } from "@/lib/motion";

export const Route = createFileRoute("/auth/verify-mfa")({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            email: (search.email as string) || "",
            rememberMe: (search.rememberMe as boolean) || false,
        };
    },
    component: VerifyMfaPage,
});

const schema = z.object({
    code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must be numeric"),
});

type FormData = z.infer<typeof schema>;

function VerifyMfaPage() {
    const { email, rememberMe } = Route.useSearch();
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [isResending, setIsResending] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        if (!email) {
            navigate({ to: "/auth/login" });
        }
    }, [email, navigate]);

    const onSubmit = async (data: FormData) => {
        setServerError(null);
        const res = await authService.verifyMfa(email, data.code);

        if (!res.success || !res.data) {
            setServerError(res.error?.message ?? "Verification failed. Please check the code.");
            return;
        }

        signIn(res.data, rememberMe);
        toast.success("Security verification successful", {
            description: `Welcome back, ${res.data.user.fullName}`,
        });

        // Redirect to dashboard
        const role = res.data.user.role;
        if (role === "manufacturer") {
            navigate({ to: "/dashboard/manufacturer" });
        } else if (role === "pharmacy") {
            navigate({ to: "/dashboard/pharmacy" });
        } else {
            navigate({ to: "/dashboard/patient" });
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        setServerError(null);
        try {
            const result = await authService.resendMfa(email);
            if (result.success) {
                const emailed = result.data?.emailed ?? false;
                const description =
                    result.message ||
                    (emailed
                        ? `Check your inbox at ${result.data?.email ?? email}.`
                        : "Email is not configured. Open the terminal where you ran npm run dev — the 6-digit code is printed there.");
                if (emailed) {
                    toast.success("New code sent", { description, duration: 8000 });
                } else {
                    toast.info("New code generated", { description, duration: 10000 });
                }
            } else {
                const message = result.error?.message ?? "Failed to resend code.";
                setServerError(message);
                toast.error(message);
            }
        } catch {
            const message = "An error occurred. Please try again.";
            setServerError(message);
            toast.error(message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <AuthLayout
            title="Secure Verification"
            subtitle="Enter the 6-digit security code sent to your registered contact."
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
                className="space-y-6"
            >
                <div className="flex flex-col items-center justify-center space-y-2 py-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Verification code sent to</p>
                        <p className="text-sm font-bold text-foreground">{email}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Verification Code
                        </label>
                        <div className="relative">
                            <input
                                {...register("code")}
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                className="h-12 w-full rounded-xl border border-border/60 bg-secondary/20 px-4 text-center text-2xl font-black tracking-[0.5em] transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                                autoComplete="one-time-code"
                            />
                        </div>
                        {errors.code && (
                            <p className="mt-1 text-xs font-medium text-destructive">{errors.code.message}</p>
                        )}
                    </div>

                    {serverError && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20"
                        >
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                            {serverError}
                        </motion.div>
                    )}

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-12 w-full rounded-xl bg-gradient-primary shadow-elegant transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                Verify & Continue <ShieldCheck className="h-4 w-4" />
                            </span>
                        )}
                    </Button>
                </form>

                <div className="flex flex-col items-center gap-4 pt-2">
                    <button
                        onClick={handleResend}
                        disabled={isResending}
                        className="text-xs font-semibold text-primary/80 transition-colors hover:text-primary disabled:opacity-50"
                    >
                        {isResending ? "Sending code..." : "Didn't receive a code? Resend"}
                    </button>

                    <button
                        onClick={() => navigate({ to: "/auth/login" })}
                        className="flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-3 w-3" /> Back to login
                    </button>
                </div>
            </motion.div>
        </AuthLayout>
    );
}
