# Graph Report - Mediverify  (2026-06-02)

## Corpus Check
- 184 files · ~87,233 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 412 nodes · 334 edges · 16 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 10 edges
2. `VerificationEngine` - 9 edges
3. `handleAction()` - 8 edges
4. `normalizeCatastrophicSsrResponse()` - 6 edges
5. `FraudEngine` - 6 edges
6. `fetch()` - 5 edges
7. `JwtService` - 5 edges
8. `BlockchainService` - 5 edges
9. `CacheService` - 5 edges
10. `QRService` - 5 edges

## Surprising Connections (you probably didn't know these)
- `fetch()` --calls--> `handleResend()`  [INFERRED]
  src\server.ts → src\routes\auth\verify-mfa.tsx
- `normalizeCatastrophicSsrResponse()` --calls--> `consumeLastCapturedError()`  [INFERRED]
  src\server.ts → src\lib\error-capture.ts
- `handleAction()` --calls--> `exportQRCanvasToPng()`  [INFERRED]
  src\components\download-center\DownloadCenter.tsx → src\services\qr\qr-generator.ts
- `handleAction()` --calls--> `triggerDownload()`  [INFERRED]
  src\components\download-center\DownloadCenter.tsx → src\services\qr\qr-generator.ts
- `brandedErrorResponse()` --calls--> `renderErrorPage()`  [INFERRED]
  src\server.ts → src\lib\error-page.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (12): JwtService, onSubmit(), POST(), resend(), onSubmit(), handleResend(), onSubmit(), save() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (9): handleMouseLeave(), handleMouseMove(), CacheService, dismiss(), handleLogout(), authorizeRequest(), handleLeave(), handleMouse() (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (14): handleAction(), setStatus(), ExportService, PrintingService, buildBoxQrCode(), buildPillQrCode(), createBatch(), createPillRecords() (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (5): BlockchainService, ZIPExportService, BatchService, PDFSheetService, QRService

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (6): handleSend(), verify(), FraudEngine, handleVerify(), SMSSimulator, VerificationService

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (4): handleClose(), handleReset(), handleClose(), reset()

### Community 6 - "Community 6"
Cohesion: 0.26
Nodes (2): AIService, VerificationEngine

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (5): useDashboard(), DesktopSidebar(), Page(), Page(), useAuth()

### Community 8 - "Community 8"
Cohesion: 0.27
Nodes (7): consumeLastCapturedError(), renderErrorPage(), brandedErrorResponse(), fetch(), getServerEntry(), isCatastrophicSsrErrorBody(), normalizeCatastrophicSsrResponse()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (2): RealtimeEmitter, RealtimeService

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (1): AdminService

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (2): clearSession(), getStoredSession()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (1): MedicineService

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (1): MonitoringService

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (1): AnalyticsService

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (1): ApiError

## Knowledge Gaps
- **1 isolated node(s):** `RealtimeEmitter`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 6`** (15 nodes): `AIService`, `.calculateDynamicRisk()`, `.generateRecommendations()`, `.predictFraudOutbreak()`, `VerificationEngine`, `.calculateRisk()`, `.generateMessage()`, `.generateWarnings()`, `.handleFakeResult()`, `.logVerification()`, `.verify()`, `.verifyBox()`, `.verifyPill()`, `ai.service.ts`, `verification.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (7 nodes): `RealtimeEmitter`, `RealtimeService`, `.broadcastVerification()`, `.emit()`, `.getLiveFeed()`, `.on()`, `realtime.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (5 nodes): `AdminService`, `.blacklistPharmacy()`, `.getNationalRiskMetrics()`, `.issueRecall()`, `admin.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (5 nodes): `clearSession()`, `getStoredSession()`, `handleResponse()`, `storeSession()`, `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (4 nodes): `MedicineService`, `.createBatch()`, `.getMedicineAnalytics()`, `medicine.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (4 nodes): `MonitoringService`, `.logEvent()`, `.trackPerformance()`, `monitoring.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (3 nodes): `AnalyticsService`, `.getGlobalFraudMetrics()`, `analytics.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (3 nodes): `api-response.ts`, `ApiError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthService` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `normalizeCatastrophicSsrResponse()` connect `Community 8` to `Community 1`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `handleAction()` (e.g. with `.generateBoxQrPdf()` and `.generatePillQrSheetPdf()`) actually correct?**
  _`handleAction()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `normalizeCatastrophicSsrResponse()` (e.g. with `.get()` and `consumeLastCapturedError()`) actually correct?**
  _`normalizeCatastrophicSsrResponse()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RealtimeEmitter` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._