# Village Express - User Guide & Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Features by Role](#features-by-role)
5. [Support System](#support-system)
6. [Booking Flow](#booking-flow)
7. [Setup & Deployment](#setup--deployment)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Testing](#testing)

---

## Project Overview

Village Express is a hyperlocal logistics platform designed for rural and semi-urban areas in India. It enables users to send parcels through a network of local delivery points, captains (delivery riders), and point managers.

### Key Features
- **Multi-segment routing**: Parcels travel through multiple points via different captains
- **Role-based access control**: Different interfaces for customers, captains, point managers, and admins
- **Real-time tracking**: Track parcels at each segment of the journey
- **COD support**: Cash on delivery with remittance tracking
- **Wallet system**: Digital wallet for payments and withdrawals
- **Support system**: Comprehensive ticket management with SLA tracking
- **Commission management**: Automated commission calculation for captains and point managers

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Custom JWT-based auth
- **File Storage**: Local storage (configurable for S3/Cloudinary)

### Project Structure
```
village-express/
├── apps/
│   └── web/                 # Next.js web application
│       ├── app/            # App router pages
│       ├── components/     # Reusable components
│       └── lib/            # Utilities and helpers
├── packages/
│   └── db/                 # Database package
│       ├── prisma/         # Prisma schema
│       └── seed.ts         # Database seeders
└── turbo.json              # Turborepo configuration
```

---

## User Roles & Permissions

### 1. Super Admin
- **Access Level**: 100
- **Permissions**: Full system access including role management, permission management, and all operational features
- **Default Credentials**: admin@villageexpress.in / VE@2026

### 2. Admin
- **Access Level**: 80
- **Permissions**: Operations management, user approval, booking management, pricing, payments, reports
- **Cannot**: Manage roles and permissions

### 3. Franchise Owner
- **Access Level**: 60
- **Permissions**: Regional operations, location management, captain assignments within region

### 4. Point Manager
- **Access Level**: 40
- **Permissions**: 
  - View and assign bookings within their location
  - Manage parcel handoffs
  - COD collection and remittance
  - View commission reports
  - Create support tickets

### 5. Captain
- **Access Level**: 20
- **Permissions**:
  - View assigned bookings
  - Update booking status (Picked up, In transit, Delivered)
  - View earnings and request withdrawals
  - Create support tickets

### 6. Customer
- **Access Level**: 10
- **Permissions**:
  - Create bookings
  - Track parcels
  - Make payments
  - View order history
  - Create support tickets

---

## Features by Role

### Customer Features

#### Creating a Booking
1. Navigate to "New Booking"
2. Enter pickup and drop locations
3. Provide parcel details (weight, type, description)
4. Select delivery priority (Standard, Express, Overnight)
5. Choose payment method (UPI, Card, COD, Wallet)
6. Confirm booking

#### Tracking Parcels
- View real-time status updates
- See current location and assigned captain
- View estimated delivery time
- Access delivery proof (photo/signature)

#### Wallet Management
- Add funds via UPI/Card
- View transaction history
- Use wallet balance for bookings

### Captain Features

#### Viewing Assignments
- See list of assigned pickups and deliveries
- View customer contact details
- Get navigation to pickup/drop locations

#### Updating Status
- Mark parcels as "Picked up"
- Update to "In transit"
- Complete delivery with proof (photo, signature, OTP verification)

#### Earnings & Withdrawals
- View daily/weekly earnings
- Request withdrawals to bank account or UPI
- View payout history

#### Support
- Report issues with bookings
- Request technical support for app issues
- KYC verification support

### Point Manager Features

#### Booking Management
- View all bookings for assigned location
- Assign captains to segments
- Hand off parcels between captains
- Manage parcel storage

#### COD Management
- Collect COD payments from customers
- Record collection details
- Remit collected amounts to main account
- View remittance history

#### Commission Tracking
- View commission earnings
- Track payout status
- Generate commission reports

### Admin Features

#### User Management
- Approve/reject new user registrations
- Manage user roles
- View user activity logs

#### Location Management
- Add new delivery points
- Manage point assignments
- Configure service areas

#### Support Management
- View all support tickets
- Assign tickets to agents
- Use canned response templates
- Track SLA compliance
- View satisfaction ratings

#### Analytics Dashboard
- Booking statistics
- Revenue reports
- Support ticket analytics
- SLA performance metrics

---

## Support System

### Ticket Categories
- **PAYMENT**: Payment failures, refunds, wallet issues
- **BOOKING**: Delivery delays, wrong delivery, damaged parcels
- **ONBOARDING**: KYC verification, account approval
- **GENERAL**: General inquiries
- **TECHNICAL**: App crashes, GPS issues, notifications

### Issue Types
#### Booking Issues
- DELAY: Delivery delay
- WRONG_DELIVERY: Delivered to wrong address
- DAMAGED: Parcel damaged in transit
- DELIVERY_PROOF: Missing delivery proof
- OTP_ISSUE: OTP verification problems
- PAYMENT_FAILURE: Payment failed during booking

#### Captain Issues
- APP_CRASH: Captain app crashes
- GPS_LOCATION: GPS/location issues
- NOTIFICATIONS: Notification problems
- VEHICLE_EQUIPMENT: Vehicle/equipment issues

#### Point Manager Issues
- COMMISSION_DISPUTE: Commission calculation disputes
- PAYOUT_DELAY: Payout delays
- COD_REMITTANCE: COD collection/remittance issues

### SLA Policies
- **URGENT**: 2 hours response time
- **HIGH**: 8 hours response time
- **MEDIUM**: 24 hours response time
- **LOW**: 48 hours response time

### Canned Responses
Pre-written response templates for common issues:
- Delivery delay responses
- Payment failure assistance
- KYC verification status
- General greetings

### Satisfaction Rating
After ticket resolution, users can rate their support experience:
- 1-5 star rating
- Optional text comment
- Used for support quality analytics

---

## Booking Flow

### Standard Booking Process

1. **Customer creates booking**
   - Selects pickup and drop locations
   - Provides parcel details
   - Chooses delivery priority
   - Makes payment

2. **System assigns route**
   - Finds optimal route through multiple points
   - Calculates price based on distance and weight
   - Assigns point managers to each segment

3. **Point manager receives parcel**
   - Customer hands parcel to local point
   - Point manager records receipt
   - Status: "Received at point"

4. **Captain assignment**
   - Point manager assigns captain for first segment
   - Captain receives notification
   - Status: "Assigned"

5. **Pickup**
   - Captain picks up parcel
   - Status: "Picked up"

6. **In transit**
   - Captain travels to next point
   - Status: "In transit"

7. **Handoff**
   - Captain hands parcel to next point manager
   - Status: "Handed off"
   - Process repeats for each segment

8. **Final delivery**
   - Last captain delivers to recipient
   - Collects delivery proof (photo/signature/OTP)
   - Status: "Delivered"

### Multi-Segment Routing Example

**Route**: Jagitial → Malial → Poodoor → Gangadhara → Karimnagar

1. Customer drops parcel at Jagitial point
2. Captain 1 picks up and delivers to Malial point
3. Captain 2 picks up from Malial, delivers to Poodoor
4. Captain 3 picks up from Poodoor, delivers to Gangadhara
5. Captain 4 picks up from Gangadhara, delivers to Karimnagar customer

Each segment has:
- Assigned captain
- Point manager at origin
- Point manager at destination
- Estimated time and distance

---

## Setup & Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- npm or yarn

### Local Development Setup

1. **Clone repository**
```bash
git clone <repository-url>
cd village-express
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create `.env` file in root and `packages/db/.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Run database migrations**
```bash
cd packages/db
npx prisma db push
```

5. **Seed database**
```bash
npx tsx seed.ts
```

6. **Start development server**
```bash
cd apps/web
npm run dev
```

Access application at `http://localhost:3000`

### Production Deployment

#### Database Setup (Neon)
1. Create Neon PostgreSQL database
2. Copy connection string
3. Update `DATABASE_URL` in environment variables
4. Run `npx prisma db push` to sync schema
5. Run `npx tsx seed.ts` to populate initial data

#### Vercel Deployment
1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth
- `NEXTAUTH_URL`: Production URL

---

## Database Schema

### Core Models

#### User
- User accounts with authentication
- Roles and permissions
- Profile information

#### Location
- Delivery points and hubs
- Geographic coordinates
- Service areas

#### Booking
- Parcel delivery bookings
- Multi-segment routing
- Status tracking

#### CaptainProfile
- Captain KYC details
- Vehicle information
- Availability status

#### PointManagerProfile
- Point manager details
- Assigned location
- Shop information

#### SupportTicket
- Support tickets with SLA tracking
- Issue categorization
- Satisfaction ratings

#### Wallet
- User wallet balance
- Transaction history

#### CommissionLedger
- Commission calculations
- Payout tracking

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking details
- `PUT /api/bookings/[id]` - Update booking
- `PATCH /api/bookings/[id]/status` - Update status

### Support
- `GET /api/support-tickets` - List tickets
- `POST /api/support-tickets` - Create ticket
- `GET /api/support-tickets/[id]` - Get ticket details
- `PUT /api/support-tickets/[id]` - Update ticket
- `POST /api/support-tickets/[id]/messages` - Add message
- `GET /api/canned-responses` - List canned responses
- `POST /api/canned-responses` - Create canned response

### Users
- `GET /api/users` - List users
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]/approve` - Approve user
- `PATCH /api/users/[id]/status` - Update user status

### Locations
- `GET /api/locations` - List locations
- `POST /api/locations` - Create location
- `GET /api/locations/[id]` - Get location details

### Wallet
- `GET /api/wallet` - Get wallet balance
- `POST /api/wallet/recharge` - Recharge wallet
- `POST /api/wallet/withdraw` - Request withdrawal

---

## Testing

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@villageexpress.in | VE@2026 |
| Admin | admin2@villageexpress.in | Admin@123 |
| Point Manager | pm@villageexpress.in | Pm@123 |
| Captain | captain@villageexpress.in | Captain@123 |
| Customer | customer@villageexpress.in | Customer@123 |

### Running Tests

#### E2E Tests
```bash
cd apps/web
npm run test:e2e
```

#### Unit Tests
```bash
npm run test
```

### Test Scenarios

#### Booking Flow Test
1. Login as customer
2. Create new booking
3. Verify booking created
4. Login as point manager
5. Assign captain
6. Login as captain
7. Update status to "Picked up"
8. Update status to "Delivered"
9. Verify booking completed

#### Support System Test
1. Login as customer
2. Create support ticket
3. Login as admin
4. View ticket in admin dashboard
5. Assign ticket to agent
6. Add response using canned template
7. Resolve ticket
8. Login as customer
9. Submit satisfaction rating

---

## Support & Troubleshooting

### Common Issues

#### Database Connection Failed
- Verify DATABASE_URL is correct
- Check database is accessible
- Ensure SSL mode is enabled for Neon

#### Authentication Issues
- Clear browser cookies
- Verify user is approved
- Check role permissions

#### Booking Creation Failed
- Verify locations exist
- Check pricing rules are configured
- Ensure sufficient wallet balance

### Getting Help
- Create support ticket through the application
- Email: support@villageexpress.in
- Documentation: [Link to docs]

---

## Version History

### v1.0.0 (Current)
- Initial release
- Multi-segment routing
- Support system with SLA tracking
- Wallet and payment integration
- COD management
- Commission tracking

---

## License

Copyright © 2026 Village Express. All rights reserved.
