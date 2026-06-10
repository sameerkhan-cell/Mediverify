import bcrypt from "bcryptjs";

export class PasswordService {
    private static readonly SALT_ROUNDS = 12;

    static async hash(password: string): Promise<string> {
        return await bcrypt.hash(password, this.SALT_ROUNDS);
    }

    static async compare(password: string, hash: string | null | undefined): Promise<boolean> {
        if (!hash) return false;
        return await bcrypt.compare(password, hash);
    }

    /**
     * Validate password strength
     * - Min 8 chars
     * - Uppercase, Lowercase, Number
     */
    static validate(password: string): boolean {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;
    }
}
