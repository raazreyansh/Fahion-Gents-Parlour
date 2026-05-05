# Fashion Gents Parlour Launch Checklist

## Credentials
- Supabase project URL and service role key are configured in Render only.
- Firebase Google auth credentials are configured in API/mobile/admin environment stores.
- Platform UPI ID, barber UPI ID, payee names, monthly fee, ₹20 booking advance, and ₹2 booking platform charge are configured.

## Store Readiness
- Android package: `com.fashiongents.parlour`.
- iOS bundle: `com.fashiongents.parlour`.
- Privacy policy includes Google auth, booking history, payment processors, and delete account.
- Internal testing covers Google login, Pay at Salon, booking deposit UPI components, platform fee UPI details, cancellation, and reminders.

## Operations
- Owner account is seeded as role `owner`.
- Staff users are assigned role `staff`, not shared passwords.
- GSTIN is stored when the proprietor provides it.
- Dashboard access restriction is handled manually until automated UPI reconciliation is added.
- Pay at Salon bookings do not require OTP verification.
