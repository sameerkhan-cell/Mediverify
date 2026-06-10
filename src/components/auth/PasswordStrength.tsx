import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PasswordStrengthProps {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score === 2) return { score, label: "Fair", color: "bg-warning" };
  if (score === 3) return { score, label: "Good", color: "bg-[oklch(0.65_0.18_200)]" };
  if (score === 4) return { score, label: "Strong", color: "bg-success" };
  return { score, label: "Very Strong", color: "bg-success" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;
  const { score, label, color } = getStrength(password);

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i <= score ? color : "bg-border"
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            style={{ transformOrigin: "left" }}
          />
        ))}
      </div>
      <p className={cn(
        "text-[11px] font-medium transition-colors duration-300",
        score <= 1 ? "text-destructive" :
        score === 2 ? "text-warning" :
        score >= 3 ? "text-success" : ""
      )}>
        Password strength: {label}
      </p>
    </div>
  );
}
