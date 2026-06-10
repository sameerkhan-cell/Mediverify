import { EventEmitter } from "events";
import { prisma } from "../../db/client";

class RealtimeEmitter extends EventEmitter { }
const emitter = new RealtimeEmitter();

export class RealtimeService {
    static emit(eventType: string, payload: any) {
        emitter.emit(eventType, payload);

        // Log to database for persistence
        prisma.liveEvent.create({
            data: {
                eventType,
                entityType: payload.type || null,
                entityId: payload.id || null,
                payload: JSON.stringify(payload)
            }
        }).catch(console.error);
    }

    static on(eventType: string, callback: (payload: any) => void) {
        emitter.on(eventType, callback);
    }

    static async getLiveFeed() {
        return await prisma.liveEvent.findMany({
            orderBy: { createdAt: "desc" },
            take: 20
        });
    }

    /**
     * Broadcast verification event
     */
    static broadcastVerification(verification: any) {
        this.emit("verification:new", {
            id: verification.id,
            status: verification.status,
            location: verification.location,
            timestamp: new Date()
        });

        if (verification.status !== "GENUINE") {
            this.emit("fraud:alert", {
                severity: "HIGH",
                code: verification.code,
                message: `Suspicious verification detected in ${verification.location}`
            });
        }
    }
}
