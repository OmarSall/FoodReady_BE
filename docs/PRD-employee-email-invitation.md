# PRD: Employee Email Invitation

## 1. Background & Problem Statement

When a company owner creates a new employee account, the system generates an
`inviteToken` and stores it in the database. Currently, there is no automated
way to deliver this token to the employee - an administrator must manually
retrieve the token from the database, construct the invitation link by hand,
and send it via an external tool (e.g. Postman).

**Current flow (manual):**
1. Owner creates an employee via `POST /employees`
2. Admin opens pgAdmin and manually copies the `inviteToken` from the database
3. Admin opens Postman and sends `POST /authentication/set-password` with the token and a temporary password - on behalf of the employee
4. Admin communicates the temporary password to the employee through an external channel.

**Target flow (automated):**
1. Owner creates an employee via the `EmployeesPage` form
2. System automatically sends an invitation email to the employee
3. Employee clicks the link → lands on `/set-password?token=xxx`
4. Employee sets their password → account is active → redirect to `/login`

---

## 2. Goal

Eliminate the manual step of delivering the invitation token. The entire
onboarding flow should be fully automatic and require zero administrator
intervention.

---

## 3. Scope

### In scope

**Backend:**
- New `MailModule` with `MailService` (Nodemailer + SMTP)
- `EmployeesService.createForCompany` sends an invitation email after
  successful employee creation (fire-and-forget)
- New SMTP environment variables added to Joi validation schema
- New `SET_PASSWORD` entry in `API_ENDPOINTS`

**Frontend (`apps/customer-portal`):**
- New page: `SetPasswordPage` + `SetPasswordForm`
- New route: `/set-password` (publicly accessible, outside `GuestRoute`
  and `ProtectedRoute`)
- New API function: `setPassword` in `authenticationApi.ts`
- New constants in `ROUTES` and `API_ENDPOINTS`
- `LoginForm` updated to display a success message after invite activation

### Out of scope
- Resend invitation endpoint
- Email open / click tracking
- Styled HTML email templates (MJML, React Email)
- Queue-based sending (BullMQ) for delivery resilience
- Password change flow for already-authenticated employees

---

## 4. User Stories

> As a company owner,
> when I create a new employee via the form,
> I want the employee to automatically receive an invitation email with a
> password setup link,
> so that they can activate their account without any manual intervention.

> As a new employee,
> when I click the invitation link from my email,
> I want to see a password setup form,
> so that I can create a password and log into the system.

---

## 5. Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | After `POST /employees` succeeds, an invitation email is sent to the new employee's address |
| AC-2 | The email contains a link in the format: `{FRONTEND_URL}/set-password?token={inviteToken}` |
| AC-3 | A mail delivery failure does **not** roll back the employee record — the invite token remains valid and the error is logged |
| AC-4 | The email does not contain sensitive data (e.g. `passwordHash`, full Employee object) |
| AC-5 | All SMTP variables are validated by Joi at application startup |
| AC-6 | Navigating to `/set-password?token=xxx` renders the password setup form |
| AC-7 | After a successful password setup, the user is redirected to `/login` with a success message |
| AC-8 | An expired or invalid token returns HTTP 400 — the frontend displays a clear error message |
| AC-9 | The `/set-password` route is accessible without authentication (outside `GuestRoute`) |
| AC-10 | `MailService` is unit-testable with a mocked Nodemailer transport |
| AC-11 | `EmployeesService.createForCompany` is unit-testable with a mocked `MailService` |

---

## 6. Technical Design

### 6.1 Backend — new `MailModule`

```
src/
  mail/
    mail.module.ts
    mail.service.ts
    mail.service.spec.ts
```

**`MailService`** exposes one public method:

```ts
sendInvitation(options: {
  to: string;
  employeeName: string;
  inviteToken: string;
}): Promise<void>
```

Builds the invitation link:
```
{FRONTEND_URL}/set-password?token={inviteToken}
```

Sends an HTML email with a plain-text fallback via Nodemailer SMTP.
The transport is injected as a provider token so it can be swapped for a
mock in tests.

`MailModule` exports `MailService` and is explicitly imported by
`EmployeesModule` (not global).

---

### 6.2 Backend — updated `EmployeesService`

After the Prisma `$transaction` in `createForCompany` completes successfully:

```ts
this.mailService
  .sendInvitation({
    to: employeeDto.email,
    employeeName: employeeDto.name,
    inviteToken,
  })
  .catch((error) => {
    this.logger.error('Failed to send invitation email', error);
  });
// No await — fire-and-forget, errors do not propagate to the caller
```

---

### 6.3 Backend — new environment variables

Add to the Joi validation schema in `AppModule`:

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `SMTP_HOST` | string | `smtp.mailgun.org` | SMTP server hostname |
| `SMTP_PORT` | number | `587` | SMTP port |
| `SMTP_USER` | string | `no-reply@foodready.app` | SMTP username |
| `SMTP_PASSWORD` | string | `secret` | SMTP password |
| `SMTP_FROM` | string | `FoodReady <no-reply@foodready.app>` | Sender display address |

---

### 6.4 Frontend — new `/set-password` route

Added in `App.tsx` **outside** both `GuestRoute` and `ProtectedRoute`
so the route is accessible regardless of authentication state:

```tsx
<Route path={ROUTES.SET_PASSWORD} element={<SetPasswordPage />} />
<Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
```

---

### 6.5 Frontend — new constants

**`routes.ts`:**
```ts
SET_PASSWORD: '/set-password',
```

**`api.ts`:**
```ts
AUTHENTICATION: {
  LOGIN: '/authentication/log-in',
  LOGOUT: '/authentication/log-out',
  CURRENT_USER: '/authentication',
  SET_PASSWORD: '/authentication/set-password',  // new
}
```

---

### 6.6 Frontend — new API function

**`authenticationApi.ts`:**
```ts
export interface SetPasswordPayload {
  token: string;
  password: string;
}

export function setPassword(payload: SetPasswordPayload): Promise<void> {
  return request('POST', API_ENDPOINTS.AUTHENTICATION.SET_PASSWORD, {
    body: payload,
  });
}
```

---

### 6.7 Frontend — new components

```
src/components/Auth/
  SetPasswordPage/
    SetPasswordPage.tsx
    SetPasswordPage.module.css
    SetPasswordForm/
      SetPasswordForm.tsx
      SetPasswordForm.module.css
```

**`SetPasswordPage`** responsibilities:
- Reads `token` from `useSearchParams()`
- If token is missing → redirect to `/` immediately
- Calls `setPassword({ token, password })`
- On success → `navigate(ROUTES.LOGIN, { state: { inviteSuccess: true } })`
- On API error → displays error message inside the form

**`SetPasswordForm`** fields:
- `password` — min 8 characters, `type="password"`
- `confirmPassword` — must match `password`
- Reuses existing `FormInput` component
- Styled identically to `LoginForm` / `CompanyOwnerForm`
  (dark theme, green gradient button, CSS Modules)

**`LoginForm`** — minor update:
- If `location.state?.inviteSuccess === true` → display banner:
  `"Password set successfully. You can now log in."`

---

## 7. TDD Plan — Red → Green → Refactor

### Cycle 1 — `MailService.sendInvitation` (BE)

**Red:** Write a spec that:
- Creates `MailService` with a mocked Nodemailer transport
- Calls `sendInvitation({ to, employeeName, inviteToken })`
- Asserts `transport.sendMail` was called exactly once
- Asserts the `to` field matches the provided email address
- Asserts the email body contains the full invitation link with the token

**Green:** Implement `MailService` with a real Nodemailer transport
until all assertions pass.

**Refactor:** Extract link construction into a private helper method;
add plain-text fallback alongside the HTML body.

---

### Cycle 2 — `EmployeesService.createForCompany` with mail (BE)

**Red:** Write / extend a spec that:
- Mocks `PrismaService` and `MailService`
- After successful `createForCompany`, asserts `mailService.sendInvitation`
  was called with the correct `to`, `employeeName`, and a non-empty `inviteToken`
- Asserts that if `mailService.sendInvitation` rejects,
  `createForCompany` still resolves (fire-and-forget — no throw)

**Green:** Inject `MailService`, add fire-and-forget call with `Logger.error`.

**Refactor:** Extract error logging into a private method.

---

### Cycle 3 — `SetPasswordPage` (FE, React Testing Library)

**Red:** Write a spec that:
- Renders `SetPasswordPage` with a token in the URL (`?token=abc123`)
- Fills in `password` and `confirmPassword`
- Asserts `setPassword` API was called with `{ token: 'abc123', password }`
- Asserts redirect to `/login` after success

**Green:** Implement `SetPasswordPage` and `SetPasswordForm`.

**Refactor:** Extract token-reading logic into a custom hook `useInviteToken`.

---

## 8. File Checklist

### Backend
- [ ] `src/mail/mail.module.ts`
- [ ] `src/mail/mail.service.ts`
- [ ] `src/mail/mail.service.spec.ts`
- [ ] `src/employees/employees.module.ts` — import `MailModule`
- [ ] `src/employees/employees.service.ts` — inject `MailService`, fire-and-forget
- [ ] `src/employees/employees.service.spec.ts` — new / updated tests
- [ ] `src/app.module.ts` — Joi schema updated with SMTP vars
- [ ] `.env.example` — SMTP vars added

### Frontend
- [ ] `src/constants/routes.ts` — `SET_PASSWORD`
- [ ] `src/constants/api.ts` — `SET_PASSWORD` endpoint
- [ ] `src/api/authenticationApi.ts` — `setPassword()`
- [ ] `src/components/Auth/SetPasswordPage/SetPasswordPage.tsx`
- [ ] `src/components/Auth/SetPasswordPage/SetPasswordPage.module.css`
- [ ] `src/components/Auth/SetPasswordPage/SetPasswordForm/SetPasswordForm.tsx`
- [ ] `src/components/Auth/SetPasswordPage/SetPasswordForm/SetPasswordForm.module.css`
- [ ] `src/App.tsx` — new `/set-password` route
- [ ] `src/components/Auth/LoginPage/LoginForm/LoginForm.tsx` — invite success message

### Dependencies
- [ ] `nodemailer` + `@types/nodemailer` added to BE `package.json`

---

## 9. Follow-up Opportunities

- `POST /employees/:id/resend-invitation` — resend expired invitation
- Styled HTML email template (MJML / React Email)
- Queue-based mail sending (BullMQ) for delivery resilience at scale
- Password change flow for already-authenticated employees