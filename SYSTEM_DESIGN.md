# System Design — Society Maintenance Tracker

## Overview

The Society Maintenance Tracker is a three-tier web application: a React frontend, Express REST API, and SQLite database. Role-based JWT authentication separates resident and admin capabilities. The design prioritizes a clear complaint lifecycle, immutable-style status history, configurable overdue detection, secure photo handling, and asynchronous email notifications.

## Complaint History Model

Every complaint follows a strict status lifecycle: **Open → In Progress → Resolved**. Resolved complaints are closed and no longer accept status or priority changes.

Status changes are never overwritten. Instead, each transition is appended to a dedicated `complaint_history` table with four key fields: the new status, an optional admin note, the actor (user ID of whoever made the change), and a server-generated timestamp. The main `complaints` row holds the current status for fast queries and filtering, while `complaint_history` provides the full audit trail residents see on the detail page.

When a resident submits a complaint, the system creates the complaint row with status `Open` and immediately inserts the first history record ("Complaint submitted"). Admin updates call the same `addHistory` helper, ensuring every change is recorded consistently before an email is dispatched.

This append-only history design avoids data loss, supports accountability (who changed what and when), and scales simply without JSON blob parsing. Residents can trust that their view reflects every step taken on their issue.

## Overdue Detection

Overdue handling uses two complementary mechanisms: **automatic detection** and **manual admin flagging**.

A configurable threshold (`overdue_days` in the `settings` table, default 7) defines how long a non-resolved complaint may remain open before it is considered overdue. Before listing complaints or loading the dashboard, the API runs `refreshOverdueFlags()`, which executes a single SQL update: any complaint where status is not `Resolved` and `julianday('now') - julianday(created_at) > threshold` gets `is_overdue = 1`.

Admins can also manually flag a complaint via `PATCH /complaints/:id/flag-overdue` when they want to escalate before the threshold is reached. Resolved complaints clear the overdue flag automatically on status update.

The admin complaint list sorts overdue items first, then by priority (High → Medium → Low), then by creation date. The dashboard exposes a dedicated overdue count alongside breakdowns by status and category, giving admins immediate visibility into backlog health.

## Photo Handling

Complaint photos are optional. Uploads use Multer with disk storage under `backend/uploads/`. Each filename is randomized (timestamp + random suffix) to prevent collisions and path traversal. Only image MIME types (JPEG, PNG, GIF, WebP) are accepted, with a 5 MB size limit.

The database stores only the relative path (e.g. `/uploads/1234-photo.jpg`). The Express server serves this directory as static files. The frontend displays images via the same path, proxied through Vite in development. For production, the uploads folder must persist on the host or be migrated to object storage; the schema supports swapping the stored value to a full URL without structural changes.

Photos are tied to the complaint at creation time and are not modified afterward, keeping the submission record stable.

## Notification Flow

Email is handled by Nodemailer with SMTP credentials from environment variables. If SMTP is not configured, the service logs the intended message to the console so local development works without external dependencies.

**Status change notifications:** When an admin updates a complaint status, the API loads the resident's email, calls `notifyStatusChange`, and sends a plain-text message with the complaint ID, new status, and optional note. This happens after the database update and history insert, so the email reflects committed state.

**Important notice notifications:** When an admin posts a notice with `is_important: true`, the notice is saved and pinned to the top of the notice board. The API then queries all resident emails and sends each a notification with the title and content. Non-important notices appear on the board only, with no email blast.

Both flows are fire-and-forget async calls; email failures are logged but do not roll back the primary operation, ensuring admin actions always succeed even if the mail server is temporarily unavailable.

## Security and API Design

JWT tokens encode user id, name, email, and role. Middleware validates tokens on protected routes; a separate `requireRole` guard restricts admin-only endpoints. Residents can only read their own complaints; admins see all with filter parameters.

The API follows REST conventions with JSON bodies, consistent error shapes (`{ error: "message" }`), and resource-oriented URLs. CORS is restricted to the configured frontend origin.

## Conclusion

This architecture delivers the assignment requirements with minimal dependencies: SQLite avoids external DB setup, append-only history preserves complaint transparency, SQL-based overdue refresh keeps detection efficient, Multer handles photos simply, and Nodemailer integrates with any free SMTP tier for production deployment.
