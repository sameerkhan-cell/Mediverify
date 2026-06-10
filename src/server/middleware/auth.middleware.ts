import { JwtService } from "../auth/jwt.service";
import { ApiError } from "../utils/api-response";

export async function authorizeRequest(request: Request, allowedRoles?: string[]) {
    const authHeader = request.headers.get("Authorization");
    console.log(`[AUTH_DEBUG] Received Header: "${authHeader}"`);

    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader === "Bearer ") {
        throw new ApiError(401, "Authentication required.");
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = JwtService.verifyAccessToken(token);

        if (allowedRoles && !allowedRoles.includes(payload.role)) {
            throw new ApiError(403, "Insufficient permissions for this action.");
        }

        return payload;
    } catch (error) {
        throw new ApiError(401, "Invalid or expired session.");
    }
}
