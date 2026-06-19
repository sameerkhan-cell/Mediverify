# Graph Report - Mediverify  (2026-06-18)

## Corpus Check
- 225 files · ~109,189 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 529 nodes · 490 edges · 17 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 13 edges
2. `VerificationEngine` - 12 edges
3. `ManufacturerDocumentService` - 11 edges
4. `fetch()` - 9 edges
5. `handleAction()` - 9 edges
6. `BatchService` - 8 edges
7. `QRService` - 8 edges
8. `normalizeCatastrophicSsrResponse()` - 6 edges
9. `useAuth()` - 6 edges
10. `getManufacturerForUser()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `normalizeCatastrophicSsrResponse()` --calls--> `consumeLastCapturedError()`  [INFERRED]
  src\server.ts → src\lib\error-capture.ts
- `fetch()` --calls--> `handleAction()`  [INFERRED]
  src\server.ts → src\components\download-center\DownloadCenter.tsx
- `fetch()` --calls--> `handleVerify()`  [INFERRED]
  src\server.ts → src\routes\dashboard\pharmacy.tsx
- `fetch()` --calls--> `handleResend()`  [INFERRED]
  src\server.ts → src\routes\auth\verify-mfa.tsx
- `handleAction()` --calls--> `exportQRCanvasToPng()`  [INFERRED]
  src\components\download-center\DownloadCenter.tsx → src\services\qr\qr-generator.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (14): AuditLogService, ZIPExportService, BatchService, main(), MonitoringService, PDFSheetService, main(), main() (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (11): CacheService, dismiss(), handleLogout(), checkReturning(), handleReturningSubmit(), authorizeRequest(), ManufacturerProfileService, toDbData() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (10): JwtService, onSubmit(), onSubmit(), save(), validatePassword(), AuthService, getMailerTransporter(), isPlaceholderCredential() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (14): handleAction(), setStatus(), ExportService, PrintingService, buildBoxQrCode(), buildPillQrCode(), createBatch(), createPillRecords() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (13): handleResend(), onSubmit(), handleVerify(), consumeLastCapturedError(), renderErrorPage(), getStoredSession(), authFetch(), profileRequest() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (11): computeComplianceMetrics(), daysRemaining(), enrichDocumentExpiry(), getEffectiveStatus(), isExpired(), getManufacturerForUser(), logAudit(), ManufacturerDocumentService (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (6): handleSend(), verify(), FraudEngine, handleVerify(), SMSSimulator, VerificationService

### Community 7 - "Community 7"
Cohesion: 0.1
Nodes (7): useDashboard(), DesktopSidebar(), Page(), IntelligencePage(), ProfilePage(), BatchDetailPanel(), useAuth()

### Community 8 - "Community 8"
Cohesion: 0.26
Nodes (2): AIService, VerificationEngine

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (4): handleClose(), handleReset(), handleClose(), reset()

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (2): BlockchainService, QRService

### Community 12 - "Community 12"
Cohesion: 0.32
Nodes (4): handleMouseLeave(), handleMouseMove(), handleLeave(), handleMouse()

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (2): RealtimeEmitter, RealtimeService

### Community 17 - "Community 17"
Cohesion: 0.4
Nodes (1): AdminService

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (1): MedicineService

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (1): AnalyticsService

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (1): ApiError

## Knowledge Gaps
- **1 isolated node(s):** `RealtimeEmitter`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (18 nodes): `AIService`, `.calculateDynamicRisk()`, `.generateRecommendations()`, `.predictFraudOutbreak()`, `VerificationEngine`, `.calculateRisk()`, `.generateMessage()`, `.generateWarnings()`, `.handleFakeResult()`, `.isAnomalous()`, `.logVerification()`, `.verify()`, `.verifyBatchNumber()`, `.verifyBox()`, `.verifyCarton()`, `.verifyPill()`, `ai.service.ts`, `verification.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (15 nodes): `BlockchainService`, `.anchorBatch()`, `.anchorVerification()`, `.getContract()`, `.getOnChainHistory()`, `.registerBatch()`, `QRService`, `.formatBoxCode()`, `.formatCartonCode()`, `.formatPillCode()`, `.generatePNGBuffer()`, `.generateSVG()`, `.saveAsset()`, `blockchain.service.ts`, `qr.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (7 nodes): `RealtimeEmitter`, `RealtimeService`, `.broadcastVerification()`, `.emit()`, `.getLiveFeed()`, `.on()`, `realtime.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (5 nodes): `AdminService`, `.blacklistPharmacy()`, `.getNationalRiskMetrics()`, `.issueRecall()`, `admin.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (4 nodes): `MedicineService`, `.createBatch()`, `.getMedicineAnalytics()`, `medicine.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (3 nodes): `AnalyticsService`, `.getGlobalFraudMetrics()`, `analytics.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (3 nodes): `api-response.ts`, `ApiError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `authorizeRequest()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `normalizeCatastrophicSsrResponse()` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `fetch()` connect `Community 4` to `Community 3`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `fetch()` (e.g. with `handleAction()` and `handleVerify()`) actually correct?**
  _`fetch()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `handleAction()` (e.g. with `.generateBoxQrPdf()` and `fetch()`) actually correct?**
  _`handleAction()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RealtimeEmitter` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._