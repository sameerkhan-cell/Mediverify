import type { DocumentStatus, ManufacturerDocumentType } from "@prisma/client";
import { REQUIRED_COMPLIANCE_TYPES, type DocumentTypeValue } from "../validators/document.validator";

type DocumentRow = {
    documentType: ManufacturerDocumentType;
    status: DocumentStatus;
    expiryDate: Date | null;
    deletedAt: Date | null;
};

export type ComplianceProgress = {
    requiredDocuments: number;
    uploadedRequiredDocuments: number;
    approvedRequiredDocuments: number;
    complianceScore: number;
};

export type ComplianceMetrics = {
    complianceScore: number;
    totalDocuments: number;
    approvedDocuments: number;
    pendingDocuments: number;
    expiredDocuments: number;
    underReviewDocuments: number;
    rejectedDocuments: number;
    requiredDocumentsTotal: number;
    requiredDocumentsUploaded: number;
    requiredDocumentsApproved: number;
    nextExpiryDate: string | null;
    daysUntilNextExpiry: number | null;
    statusBreakdown: Record<DocumentStatus, number>;
    upcomingExpirations: Array<{
        documentId: string;
        documentName: string;
        documentType: string;
        expiryDate: string;
        daysRemaining: number;
        status: DocumentStatus;
    }>;
    progress: ComplianceProgress;
};

export function isExpired(expiryDate: Date | null): boolean {
    if (!expiryDate) return false;
    return expiryDate.getTime() < Date.now();
}

export function daysRemaining(expiryDate: Date | null): number | null {
    if (!expiryDate) return null;
    return Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function getEffectiveStatus(doc: {
    status: DocumentStatus;
    expiryDate: Date | null;
}): DocumentStatus {
    if (doc.status !== "EXPIRED" && isExpired(doc.expiryDate)) {
        return "EXPIRED";
    }
    return doc.status;
}

export function computeComplianceMetrics(
    documents: Array<
        DocumentRow & {
            id: string;
            documentName: string;
        }
    >
): ComplianceMetrics {
    const active = documents.filter((d) => !d.deletedAt);

    const statusBreakdown: Record<DocumentStatus, number> = {
        PENDING: 0,
        UNDER_REVIEW: 0,
        APPROVED: 0,
        REJECTED: 0,
        EXPIRED: 0,
    };

    for (const doc of active) {
        statusBreakdown[getEffectiveStatus(doc)] += 1;
    }

    const uploadedRequiredTypes = new Set<DocumentTypeValue>();
    const approvedRequiredTypes = new Set<DocumentTypeValue>();

    for (const doc of active) {
        if (!REQUIRED_COMPLIANCE_TYPES.includes(doc.documentType as DocumentTypeValue)) {
            continue;
        }
        uploadedRequiredTypes.add(doc.documentType as DocumentTypeValue);
        if (getEffectiveStatus(doc) === "APPROVED") {
            approvedRequiredTypes.add(doc.documentType as DocumentTypeValue);
        }
    }

    const requiredDocumentsTotal = REQUIRED_COMPLIANCE_TYPES.length;
    const requiredDocumentsUploaded = uploadedRequiredTypes.size;
    const requiredDocumentsApproved = approvedRequiredTypes.size;

    const complianceScore = Math.round(
        (requiredDocumentsApproved / requiredDocumentsTotal) * 100
    );

    const futureExpiries = active
        .filter((d) => d.expiryDate && daysRemaining(d.expiryDate)! > 0)
        .map((d) => ({
            date: d.expiryDate!,
            days: daysRemaining(d.expiryDate)!,
        }))
        .sort((a, b) => a.days - b.days);

    const nextExpiry = futureExpiries[0] ?? null;

    const upcomingExpirations = active
        .filter(
            (d) =>
                d.expiryDate &&
                daysRemaining(d.expiryDate)! <= 90 &&
                daysRemaining(d.expiryDate)! >= 0
        )
        .map((d) => ({
            documentId: d.id,
            documentName: d.documentName,
            documentType: d.documentType,
            expiryDate: d.expiryDate!.toISOString().slice(0, 10),
            daysRemaining: daysRemaining(d.expiryDate)!,
            status: getEffectiveStatus(d),
        }))
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

    const progress: ComplianceProgress = {
        requiredDocuments: requiredDocumentsTotal,
        uploadedRequiredDocuments: requiredDocumentsUploaded,
        approvedRequiredDocuments: requiredDocumentsApproved,
        complianceScore,
    };

    return {
        complianceScore,
        totalDocuments: active.length,
        approvedDocuments: statusBreakdown.APPROVED,
        pendingDocuments: statusBreakdown.PENDING,
        expiredDocuments: statusBreakdown.EXPIRED,
        underReviewDocuments: statusBreakdown.UNDER_REVIEW,
        rejectedDocuments: statusBreakdown.REJECTED,
        requiredDocumentsTotal,
        requiredDocumentsUploaded,
        requiredDocumentsApproved,
        nextExpiryDate: nextExpiry ? nextExpiry.date.toISOString().slice(0, 10) : null,
        daysUntilNextExpiry: nextExpiry ? nextExpiry.days : null,
        statusBreakdown,
        upcomingExpirations,
        progress,
    };
}

export function enrichDocumentExpiry<T extends { expiryDate: Date | null; status: DocumentStatus }>(
    doc: T
): T & {
    daysRemaining: number | null;
    effectiveStatus: DocumentStatus;
    isExpired: boolean;
} {
    const effectiveStatus = getEffectiveStatus(doc);
    return {
        ...doc,
        daysRemaining: daysRemaining(doc.expiryDate),
        effectiveStatus,
        isExpired: effectiveStatus === "EXPIRED",
    };
}
