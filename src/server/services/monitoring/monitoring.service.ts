export class MonitoringService {
    static logEvent(level: "INFO" | "WARN" | "ERROR", category: string, message: string, metadata: any = {}) {
        const log = {
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
            ...metadata
        };

        // In production, this would stream to Sentry/CloudWatch/Datadog
        console.log(`[${log.level}] [${log.category}] ${log.message}`, metadata);
    }

    static trackPerformance(name: string, durationMs: number) {
        if (durationMs > 500) {
            this.logEvent("WARN", "PERFORMANCE", `Slow operation: ${name}`, { durationMs });
        }
    }
}
