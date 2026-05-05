# Fashion Gents Parlour

Full-stack salon booking and management platform based on `FashionGentsParlour_PRD_v1.pdf`.

## Apps
- `apps/mobile`: Expo customer app for Android, iOS, and web preview.
- `apps/admin-web`: Netlify-ready Vite React admin dashboard.
- `apps/api`: Render-ready Express API.
- `packages/shared`: service catalog, booking rules, schemas, and design tokens.

## Local Setup
```bash
npm install
npm test
npm run build
npm run dev:api
npm run dev:admin
npm run dev:mobile
```

Copy `.env.example` to `.env` for local API settings. Platform fee and booking deposit payment details are generated from configured UPI IDs.

## Database
Apply Supabase schema and seed data:
```bash
supabase db push
supabase db execute --file supabase/seed.sql
```

Create Supabase Storage buckets:
- `service-images`
- `booking-qrcodes`

## Deployment
- Admin web: Netlify, using `netlify.toml`.
- API: Render, using `render.yaml`.
- Mobile: Expo EAS build after Firebase and app store metadata are finalized.

## Implemented v1 Surface
- Complete PRD service catalog and shared booking calculations.
- Pay at Salon booking flow without OTP verification.
- UPI platform fee payment details endpoint.
- UPI booking deposit details: ₹20 barber advance plus ₹2 platform charge. Standard UPI deep links cannot split one payment across two UPI IDs, so the API exposes separate barber and platform payment intents unless a split-settlement aggregator is added later.
- Admin schedule, availability toggle, services management, earnings, analytics, billing badge surface, and CSV action.
- Customer home, service selection, date/time selection, confirmation, bookings, and profile screens.
