# Admin Provisioning Release Checklist

## Migration
- Run `supabase db push` and verify new columns on `profiles`:
  - `admin_created`
  - `must_reset_password`
  - `onboarding_required`
  - `onboarding_completed`
- Verify new tables:
  - `admin_provisioned_credentials`
  - `admin_audit_events`
  - `admin_activity_feed`
  - `support_tickets`
  - `support_ticket_messages`
  - `portfolio_contracts`

## Functional E2E
- Admin creates a user from `Benutzerverwaltung`.
- Success modal returns temporary password and allows copy.
- New user login redirects to `/auth/first-password-reset`.
- User sets a new password and is redirected to `/onboarding`.
- User submits onboarding form and reaches `/dashboard`.
- User can open product dashboards (`Festgeld`, `Tagesgeld`, `Flexgeld+`).
- Admin can open:
  - `/admin/contracts`
  - `/admin/support-mailbox`
  - `/admin/activity-feed`

## Security / Hardening
- Ensure `admin-create-user` edge function is deployed and only accessible by admin role.
- Ensure RLS policies are defined for all new tables before production rollout.
- Confirm temporary passwords are visible only to admin users with audit logging enabled.
- Rate-limit edge function by IP/user in your deployment layer.

## Regression
- Self-registration still works (`/register`).
- Existing admin pages still load (`/admin/banks`, `/admin/offers`, `/admin/applications`).
- Existing user dashboard tabs continue to work.
