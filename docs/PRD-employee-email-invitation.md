# PRD: Employee Email Invitation

---

# Part 1 - Non-Technical

## 1. Background & Problem Statement

When a company owner creates a new employee account, there is currently no
automated way to notify the employee. An administrator must manually access
the database, copy a one-time token, and set the employee's password on their
behalf - meaning the admin knows the employee's password, which is a security
concern.

**Current flow (manual — admin-only workaround):**
1. Owner creates an employee via the Employees page
2. Admin opens the database and manually copies the invite token
3. Admin sets the employee's password on their behalf using an external tool
4. Admin communicates the temporary password to the employee through a
   separate channel (e.g. chat, email)

**Target flow (automated):**
1. Owner creates an employee via the Employees page
2. System automatically sends an invitation email to the employee
3. Employee clicks the link and lands on a password setup page
4. Employee sets their own password and can immediately log in

---

## 2. Goal

Eliminate all manual steps from the employee onboarding flow. The process
should be fully automatic and require zero administrator intervention, while
ensuring the employee is the only person who knows their own password.

---

## 3. User Stories

> As a company owner,
> when I create a new employee via the form,
> I want the employee to automatically receive an invitation email with a
> password setup link,
> so that they can activate their account without any manual intervention.

> As a new employee,
> when I click the invitation link from my email,
> I want to see a password setup form,
> so that I can set my own password and log into the system independently.

---

## 4. Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | After an employee is created, an invitation email is automatically sent to their address |
| AC-2 | The email contains a secure, one-time link for the employee to set their password |
| AC-3 | If the email fails to send, the employee account is still created — the link remains valid and the error is recorded internally |
| AC-4 | The email does not contain any sensitive information |
| AC-5 | The password setup page is publicly accessible via the invitation link |
| AC-6 | After setting their password, the employee is redirected to the login page with a confirmation message |
| AC-7 | An invalid or expired invitation link shows a clear error message |

---

## 5. Out of Scope

- Resending invitation emails
- Tracking email opens or clicks
- Styled / branded HTML email templates
- Password change flow for already-authenticated employees

---

## 6. Follow-up Opportunities

- Resend invitation endpoint for expired links
- Branded HTML email template
- Resilient email delivery via a message queue

---

---

# Part 2 — Technical

## 7. Scope

### Backend
- New `MailModule` with `MailService` (Nodemailer + SMTP)
- `EmployeesService.createForCompany` sends an invitation email after
  successful employee creation (fire-and-forget)
- New SMTP environment variables added to Joi validation schema
- New `SET_PASSWORD` entry in `API_ENDPOINTS`

### Frontend (`apps/customer-portal`)
- New page: `SetPasswordPage` + `SetPasswordForm`
- New route: `/set-password` (publicly accessible, outside `GuestRoute`
  and `ProtectedRoute`)
- New API function: `setPassword` in `authenticationApi.ts`
- New constants in `ROUTES` and `API_ENDPOINTS`
- `LoginForm` updated to display a success message after invite activation

---

## 8. Technical Design

### 8.1 Backend — new `MailModule`

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

`FRONTEND_URL` may contain multiple comma-separated origins (for CORS) —
only the first value is used for the invitation link.

Sends an HTML email with a plain-text fallback via Nodemailer SMTP.
The transport is injected as a provider token so it can be swapped for a
mock in tests.

`MailModule` exports `MailService` and is explicitly imported by
`EmployeesModule` (not global).

---

### 8.2 Backend — updated `EmployeesService`

`inviteToken` is generated before the Prisma `$transaction` so it is
available both inside the transaction and for the mail call after it:

```ts
const inviteToken = randomBytes(32).toString('hex');

const employee = await this.prismaService.$transaction(async (tx) => {
  // ...create employee with inviteToken
});

this.sendInvitationEmail(employeeDto.email, employeeDto.name, inviteToken);

return employee;
```

Fire-and-forget pattern — no `await`, errors are caught and logged via
`Logger.error`, and do not propagate to the caller:

```ts
private sendInvitationEmail(email: string, name: string, inviteToken: string): void {
  this.mailService
    .sendInvitation({ to: email, employeeName: name, inviteToken })
    .catch((error: unknown) => {
      this.logger.error('Failed to send invitation email', error);
    });
}
```

---

### 8.3 Backend — new environment variables

Add to the Joi validation schema in `AppModule`:

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `SMTP_HOST` | string | `smtp.mailgun.org` | SMTP server hostname |
| `SMTP_PORT` | number | `587` | SMTP port |
| `SMTP_USER` | string | `no-reply@foodready.app` | SMTP username |
| `SMTP_PASSWORD` | string | `secret` | SMTP password |
| `SMTP_FROM` | string | `FoodReady <no-reply@foodready.app>` | Sender display address |

---

### 8.4 Frontend — new `/set-password` route

Added in `App.tsx` **outside** both `GuestRoute` and `ProtectedRoute`
so the route is accessible regardless of authentication state:

```tsx
<Route path={ROUTES.SET_PASSWORD} element={<SetPasswordPage />} />
```

---

### 8.5 Frontend — new constants

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
  SET_PASSWORD: '/authentication/set-password',
}
```

---

### 8.6 Frontend — new API function

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

### 8.7 Frontend — new components

```
src/components/Auth/
  SetPasswordPage/
    SetPasswordPage.tsx
    SetPasswordPage.module.css
    useInviteToken.ts
    SetPasswordForm/
      SetPasswordForm.tsx
      SetPasswordForm.module.css
```

**`useInviteToken`** — custom hook that reads the token from URL search
params and redirects to `/` if missing.

**`SetPasswordPage`** responsibilities:
- Uses `useInviteToken` to get the token
- Calls `setPassword({ token, password })`
- On success → `navigate(ROUTES.LOGIN, { state: { inviteSuccess: true } })`
- On API error → displays error message inside the form

**`SetPasswordForm`** fields:
- `password` — min 8 characters, `type="password"`
- `confirmPassword` — must match `password`
- Reuses existing `FormInput` component
- Styled identically to `LoginForm` / `CompanyOwnerForm`

**`LoginForm`** — minor update:
- If `location.state?.inviteSuccess === true` → display success banner

---

## 9. TDD Plan — Red → Green → Refactor

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

**Red:** Write a spec that:
- Mocks `PrismaService` and `MailService`
- After successful `createForCompany`, asserts `mailService.sendInvitation`
  was called with the correct `to`, `employeeName`, and a non-empty `inviteToken`
- Asserts that if `mailService.sendInvitation` rejects,
  `createForCompany` still resolves (fire-and-forget — no throw)

**Green:** Inject `MailService`, add fire-and-forget call with `Logger.error`.

**Refactor:** Extract email sending logic into a private method.

---

### Cycle 3 — `SetPasswordPage` (FE, Vitest + React Testing Library)

**Red:** Write a spec that:
- Renders `SetPasswordPage` with a token in the URL (`?token=abc123`)
- Fills in `password` and `confirmPassword`
- Asserts `setPassword` API was called with `{ token: 'abc123', password }`
- Asserts redirect to `/login` after success
- Asserts error message is displayed when API rejects

**Green:** Implement `SetPasswordPage` and `SetPasswordForm`.

**Refactor:** Extract token-reading logic into a custom hook `useInviteToken`.

---

## 10. File Checklist

### Backend
- [x] `src/mail/mail.module.ts`
- [x] `src/mail/mail.service.ts`
- [x] `src/mail/mail.service.spec.ts`
- [x] `src/employees/employees.module.ts` — import `MailModule`
- [x] `src/employees/employees.service.ts` — inject `MailService`, fire-and-forget
- [x] `src/employees/employees.service.spec.ts`
- [x] `src/app.module.ts` — Joi schema updated with SMTP vars
- [x] `.env.example` — SMTP vars added

### Frontend
- [x] `src/constants/routes.ts` — `SET_PASSWORD`
- [x] `src/constants/api.ts` — `SET_PASSWORD` endpoint
- [x] `src/api/authenticationApi.ts` — `setPassword()`
- [x] `src/components/Auth/SetPasswordPage/SetPasswordPage.tsx`
- [x] `src/components/Auth/SetPasswordPage/SetPasswordPage.module.css`
- [x] `src/components/Auth/SetPasswordPage/useInviteToken.ts`
- [x] `src/components/Auth/SetPasswordPage/SetPasswordForm/SetPasswordForm.tsx`
- [x] `src/components/Auth/SetPasswordPage/SetPasswordForm/SetPasswordForm.module.css`
- [x] `src/App.tsx` — new `/set-password` route
- [x] `src/components/Auth/LoginPage/LoginForm/LoginForm.tsx` — invite success message

### Dependencies
- [x] `nodemailer` + `@types/nodemailer` added to BE `package.json`