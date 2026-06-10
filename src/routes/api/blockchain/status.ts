import { createAPIFileRoute } from "@/lib/api-route-helper";
import { BlockchainService } from "@/server/services/blockchain/blockchain.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/blockchain/status")({
    GET: async () => {
        try {
            const isConfigured = !!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS && !!process.env.BLOCKCHAIN_SIGNER_KEY;
            return Response.json(ApiResponse.success({
                network: "Polygon Amoy Testnet",
                contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
                status: isConfigured ? "OPERATIONAL" : "PENDING_CONFIGURATION"
            }));
        } catch (e) {
            return Response.json(ApiResponse.error("Blockchain network unreachable", 503), { status: 503 });
        }
    },
});
