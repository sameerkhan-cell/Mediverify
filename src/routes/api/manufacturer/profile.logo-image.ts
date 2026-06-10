import { createAPIFileRoute } from "@/lib/api-route-helper";
import { ApiResponse } from "@/server/utils/api-response";
import fs from "node:fs/promises";
import path from "node:path";

export const Route = createAPIFileRoute("/api/manufacturer/profile/logo-image")({
    GET: async ({ request }: { request: Request }) => {
        try {
            const url = new URL(request.url);
            const mfgId = url.searchParams.get("mfgId");
            const fileName = url.searchParams.get("file");

            if (!mfgId || !fileName) {
                return Response.json(ApiResponse.error("Missing parameters.", 400), { status: 400 });
            }

            // Path traversal protection
            if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
                return Response.json(ApiResponse.error("Invalid file path.", 403), { status: 403 });
            }

            const filePath = path.join(process.cwd(), "storage", "company-logos", mfgId, fileName);

            try {
                const buffer = await fs.readFile(filePath);
                const ext = path.extname(fileName).toLowerCase();
                let contentType = "image/png";

                if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
                else if (ext === ".webp") contentType = "image/webp";

                return new Response(buffer, {
                    headers: {
                        "Content-Type": contentType,
                        "Cache-Control": "public, max-age=31536000, immutable",
                    },
                });
            } catch (e) {
                return Response.json(ApiResponse.error("Logo not found.", 404), { status: 404 });
            }
        } catch (error: any) {
            return Response.json(ApiResponse.error(error.message, 500), { status: 500 });
        }
    },
});
