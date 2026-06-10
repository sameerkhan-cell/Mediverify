import { ethers } from "ethers";
import { prisma } from "../../db/client";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const PRIVATE_KEY = process.env.BLOCKCHAIN_SIGNER_KEY || "";
const RPC_URL = process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology";

// ABI Fragment for the core functions
const MEDIVERIFY_ABI = [
    "function registerBatch(string _batchId, string _medicineName, uint256 _totalPills, uint256 _expiryDate) external",
    "function registerPill(string _pillQR, string _batchId, uint256 _pillNumber) external",
    "function verifyPill(string _pillQR, string _location, string _status) external",
    "function batches(string) view returns (string batchId, string medicineName, uint256 totalPills, uint256 expiryDate, address manufacturer, bool isRegistered, bool isRecalled)",
    "function getPillHistory(string _pillQR) view returns (tuple(uint256 timestamp, string location, string status)[])",
    "event BatchRegistered(string indexed batchId, string medicineName, address manufacturer)",
    "event PillVerified(string indexed pillQR, string status, string location, uint256 timestamp)"
];

export class BlockchainService {
    private static provider = new ethers.JsonRpcProvider(RPC_URL);
    private static wallet = (() => {
        try {
            return PRIVATE_KEY && PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000"
                ? new ethers.Wallet(PRIVATE_KEY, this.provider)
                : null;
        } catch (e) {
            console.warn("[BLOCKCHAIN] Failed to initialize wallet with provided key. Blockchain features will be disabled.");
            return null;
        }
    })();

    static getContract() {
        if (!this.wallet) throw new Error("Blockchain signer not configured.");
        return new ethers.Contract(CONTRACT_ADDRESS, MEDIVERIFY_ABI, this.wallet);
    }

    static async anchorBatch(batch: any) {
        try {
            const contract = this.getContract();
            const tx = await contract.registerBatch(
                batch.batchNumber,
                batch.medicine.name,
                batch.totalPillsGenerated,
                Math.floor(new Date(batch.expiryDate).getTime() / 1000)
            );

            const receipt = await tx.wait();

            await prisma.batch.update({
                where: { id: batch.id },
                data: {
                    txHash: receipt.hash,
                    blockchainStatus: "CONFIRMED"
                }
            });

            return receipt.hash;
        } catch (error) {
            console.error("Blockchain Batch Error:", error);
            throw error;
        }
    }

    static async anchorVerification(qrCode: string, location: string, status: string) {
        try {
            const contract = this.getContract();
            const tx = await contract.verifyPill(qrCode, location, status);
            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error("Blockchain Verify Error:", error);
            return null;
        }
    }

    static async getOnChainHistory(qrCode: string) {
        try {
            const contract = new ethers.Contract(CONTRACT_ADDRESS, MEDIVERIFY_ABI, this.provider);
            return await contract.getPillHistory(qrCode);
        } catch (error) {
            return [];
        }
    }
}
