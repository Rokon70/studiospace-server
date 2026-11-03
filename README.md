# StudioSpace Server

Express + TypeScript + MongoDB API for StudioSpace.

- `GET /api/studios` (search, category, sort, limit) · `GET /api/studios/:id`
- `POST / PUT / DELETE /api/studios` (JWT cookie required, owner only for edit/delete)
- `POST /api/bookings` with overlap detection against Confirmed bookings (409 on clash)
- `GET /api/bookings/mine`, `GET /api/bookings/requests`, `PATCH /api/bookings/:id/cancel`, `PATCH /api/bookings/:id/status`
- `GET/POST /api/wishlist`

## Run

```
npm install
cp .env.example .env   # fill in values
npm run seed           # optional sample data
npm run dev
```
Deploy on Render: build `npm install && npm run build`, start `npm start`.
