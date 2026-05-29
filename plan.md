# Courier Management System — Architecture Plan

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Location Management](#2-location-management)
3. [User Management](#3-user-management)
4. [Dynamic Roles & Permissions (RBAC)](#4-dynamic-roles--permissions-rbac)
5. [Booking System](#5-booking-system)
6. [Dynamic Pricing Engine](#6-dynamic-pricing-engine)
7. [Distance Calculation](#7-distance-calculation)
8. [Captain Assignment](#8-captain-assignment)
9. [Payment Integration](#9-payment-integration)
10. [Database Schema](#10-database-schema)
11. [API Endpoints](#11-api-endpoints)
12. [Frontend Requirements](#12-frontend-requirements) *(shadcn/ui + Next.js)*
13. [Security Considerations](#13-security-considerations)
14. [Future Scalability](#14-future-scalability)
15. [Technical Stack & Project Setup](#15-technical-stack--project-setup)

---

## 1. System Overview

The system must use a fully **location-driven operational model** instead of manual booking routing.

Bookings, point managers, pricing, and operational ownership must be automatically determined based on selected pickup and drop locations.

This architecture must behave like a real logistics network, not a simple CRUD courier system.

**Full operational flow:**
```
Customer Booking
→ Auto Point Manager Assignment (based on pickup location)
→ Point Manager Dashboard
→ Captain Assignment
→ Pickup
→ Transit
→ Delivery
```

---

## 2. Location Management

Locations must be created in the system **before** creating Point Managers or Captains.

### Location Fields

| Field         | Required | Notes                            |
|---------------|----------|----------------------------------|
| State         | Yes      |                                  |
| District      | Yes      |                                  |
| Mandal/Taluk  | No       | Optional                         |
| Village/Town  | Yes      |                                  |
| Point Name    | Yes      | Unique name for this location    |
| Pincode       | Yes      |                                  |
| Latitude      | Yes      | For distance calculation         |
| Longitude     | Yes      | For distance calculation         |
| Location Type | Yes      | POINT / HUB / WAREHOUSE          |
| Is Active     | Yes      | Default: true                    |

### Location Types

- **POINT** — Customer-facing pickup/drop point
- **HUB** — Intermediate transit center
- **WAREHOUSE** — Storage and distribution facility

### Example
```
State:      Telangana
District:   Karimnagar
Village:    Choppadandi
Point Name: Choppadandi Express Center
Type:       POINT
```

---

## 3. User Management

### 3.1 Common User Fields

| Field     | Required | Notes                  |
|-----------|----------|------------------------|
| id        | Yes      | UUID v4 — `@default(uuid())` in Prisma |
| name      | Yes      |                        |
| email     | No       | Unique if provided     |
| phone     | Yes      | Unique, used for OTP   |
| password  | No       | Only for non-OTP users |
| isActive  | Yes      | Default: true          |
| approvalStatus | Yes | PENDING / APPROVED / REJECTED (for Point Manager & Captain) |
| createdAt | Yes      | Auto                   |
| updatedAt | Yes      | Auto                   |

Users do not have a hardcoded `role` column. Roles are assigned dynamically through the `user_roles` table (see Section 4).

---

### 3.2 Customer Registration & Login

Customer login must be kept simple using **OTP-based authentication** only.

**Login Options:**
- Phone number → receive OTP via SMS
- Email → receive OTP via email

No password required for customers. On first OTP verification, the account is automatically created.

**Customer Profile Fields:**
- Name
- Phone number
- Email (optional)
- Default address (optional)

**Customer Capabilities:**
- View and edit their own profile (name, phone, email)
- View full order history / past bookings
- Track current active bookings
- Cancel a booking before it is picked up

---

### 3.3 Point Manager Self-Registration

Point Managers must be able to create their own accounts through a public registration form.

**Registration Fields:**

| Field         | Required | Notes                              |
|---------------|----------|---------------------------------|
| Name          | Yes      |                                    |
| Phone         | Yes      | Used for login and OTP             |
| Email         | Yes      |                                    |
| Password      | Yes      |                                    |
| Shop Name     | Yes      | Name of their branch/outlet        |
| Shop Location | Yes      | Must select from existing locations|
| Shop Photo    | Yes      | Upload image of the physical shop  |

**Approval Workflow:**

```
Point Manager submits registration
→ Account created with status: PENDING
→ Super Admin / Admin receives notification
→ Admin reviews profile and shop details
→ APPROVED  → Account goes live, Point Manager can log in
   REJECTED  → Applicant notified with reason
```

- Account is **not active** until explicitly approved by Super Admin or Admin
- Admin can approve, reject, or request corrections
- Super Admin can edit any field in a Point Manager's profile at any time

**Point Manager Assignment Rule:**

The selected Shop Location becomes the operational ownership area. All bookings with that pickup location automatically route to this Point Manager's dashboard.

---

### 3.4 Captain Self-Registration

Captains must be able to create their own accounts through a public registration form.

**Registration Fields (KYC):**

| Field           | Required | Notes                              |
|-----------------|----------|------------------------------------|
| Name            | Yes      |                                    |
| Phone           | Yes      | Used for login                     |
| Email           | No       | Optional                           |
| Password        | Yes      |                                    |
| Aadhaar Number  | Yes      | 12-digit national ID               |
| Aadhaar Photo   | Yes      | Upload front/back image            |
| Driving License | Yes      | License number                     |
| License Photo   | Yes      | Upload image                       |
| Vehicle Type    | Yes      | Bike / Auto / Mini-Van / Van       |
| Vehicle Number  | Yes      | Registration plate                 |
| Assigned District | Yes    | District they will operate in      |

**Approval Workflow:**

```
Captain submits registration
→ Account created with status: PENDING
→ Super Admin / Admin receives notification
→ Admin verifies KYC documents
→ APPROVED  → Captain account goes live
   REJECTED  → Applicant notified with reason
```

- Captain cannot log in or receive bookings until approved
- Super Admin can edit or correct any Captain profile field at any time

---

### 3.5 Super Admin Override

Super Admin must be able to **edit and correct any information** across the entire system, including:
- Any user's profile details
- Any Point Manager's shop details and location assignment
- Any Captain's KYC documents and vehicle details
- Any booking's assigned Point Manager or Captain
- Any pricing rule
- Any location record

---

### 3.6 Profile Self-Editing

All users (Customer, Captain, Point Manager, Admin) must be able to edit their own profile details:
- Name
- Phone number
- Email
- Password (change password flow with current password verification)
- Profile photo

Captains can additionally update:
- Vehicle type and number
- Availability status

Point Managers can additionally update:
- Shop photo
- Shop name (subject to admin review if changed)


---

## 4. Dynamic Roles & Permissions (RBAC)

Roles and permissions must **not be hardcoded**. They must be fully manageable through the database and admin API.

### 4.1 Role Management

Each role has:
- **Name** — Unique identifier (e.g., SUPER_ADMIN, POINT_MANAGER)
- **Description** — Human-readable explanation
- **Level** — Hierarchy level (higher level = more authority)
- **isActive** — Enable/disable role

### Role Hierarchy

```
SUPER_ADMIN     (Level 100)
  └── ADMIN               (Level 80)
        └── FRANCHISE_OWNER     (Level 60)
              └── POINT_MANAGER       (Level 40)
                    └── CAPTAIN             (Level 20)
                          └── CUSTOMER            (Level 10)
```

Higher level roles can be configured to inherit permissions from lower level roles.

### 4.2 Permission Management

Permissions are structured as `resource:action` strings.

**Format:** `<resource>:<action>`

| Resource  | Actions                                              |
|-----------|------------------------------------------------------|
| booking   | create, read, update, delete, assign_captain, cancel |
| location  | create, read, update, delete                         |
| user      | create, read, update, delete                         |
| pricing   | create, read, update, delete                         |
| captain   | read, assign                                         |
| role      | manage                                               |
| permission| manage                                               |
| report    | view, generate                                       |
| settings  | manage                                               |

### 4.3 Location-Based Permission Scopes

Permissions can be scoped to restrict access to specific geographic areas.

| Scope    | Description                                  |
|----------|----------------------------------------------|
| GLOBAL   | Access across all locations                  |
| REGION   | Access within operational region             |
| DISTRICT | Access within assigned district              |
| LOCATION | Access only to the user's assigned location  |

**Example:**
```
Point Manager → Choppadandi Express Center
  booking:read       (scope: LOCATION)  → Only sees Choppadandi bookings
  booking:assign_captain (scope: DISTRICT) → Can assign captains from Karimnagar district
```

### 4.4 User Role Assignment

- Each user has **one primary role**
- Users can have **additional secondary roles** (e.g., a Captain who is also a Customer)
- Each role assignment can include an `assignedLocationId` for location-scoped roles

### 4.5 Default Role Permissions (Seed Data)

These must be seeded on system initialization:

**SUPER_ADMIN**
- All permissions (GLOBAL scope)
- user: edit_any (override any user's profile or data)

**ADMIN**
- location: create, read, update, delete (GLOBAL)
- user: create, read, update, delete (GLOBAL)
- user: approve (approve Point Manager and Captain registrations)
- booking: assign_captain (GLOBAL — can allocate orders to any captain)
- role: manage (GLOBAL)
- permission: manage (GLOBAL)

**FRANCHISE_OWNER**
- location: create, read (REGION scope)
- user: create (REGION scope, POINT_MANAGER role only)
- report: view (REGION scope)

**POINT_MANAGER**
- booking: read, update (LOCATION scope)
- booking: assign_captain (DISTRICT scope — can allocate orders to captains in same district)
- captain: read, assign (DISTRICT scope)
- report: view (LOCATION scope)

**CAPTAIN**
- booking: read, update_status (assigned bookings only)
- location: read (assigned location only)

**CUSTOMER**
- booking: create (GLOBAL)
- booking: read (own bookings only)
- booking: cancel (own bookings only, before pickup status)
- profile: edit (own profile only)

### 4.6 Permission Checking Middleware

Every API request must pass through permission middleware:

```
1. Extract user identity from JWT token
2. Load user's roles from user_roles table
3. Load permissions for those roles from role_permissions table
4. Check if required permission exists with correct scope
5. GRANTED → proceed to endpoint
6. DENIED  → return 403 Forbidden
```

### 4.7 Permission Caching

- Cache user permissions after first load (Redis or in-memory)
- Cache TTL: 15 minutes (configurable)
- Invalidate cache immediately on role or permission change
- Fallback to database on cache miss

---

## 5. Booking System

### 5.1 Booking Creation Flow

Customer selects pickup and drop locations using cascading dropdowns:

```
Pickup:  State → District → Village/Town → Point
Drop:    State → District → Village/Town → Point
```

On submission, the system automatically:
1. Identifies the Point Manager assigned to the pickup location
2. Routes booking to that Point Manager's dashboard
3. Calculates price using the pricing engine
4. Calculates estimated delivery timeline

**No manual booking assignment to Point Managers is allowed.**

### 5.2 Booking Fields

| Field                | Notes                                        |
|----------------------|----------------------------------------------|
| id                   | Primary key                                  |
| customerId           | FK → users.id                                |
| pickupLocationId     | FK → locations.id                            |
| dropLocationId       | FK → locations.id                            |
| assignedPointManagerId | Auto-assigned from pickup location         |
| assignedCaptainId    | Assigned by Point Manager                    |
| parcelWeight         | In kg                                        |
| parcelType           | Documents / Fragile / General / Perishable   |
| deliveryPriority     | STANDARD / EXPRESS / OVERNIGHT               |
| status               | See §5.3 Booking Status Lifecycle |
| calculatedPrice      | Auto-calculated                              |
| estimatedDeliveryDate| Auto-calculated                              |
| createdAt            |                                              |
| updatedAt            |                                              |

### 5.3 Booking Status Lifecycle

#### Status Values

| Status | Meaning |
|--------|---------|
| PENDING | Booking created, awaiting payment |
| PAYMENT_FAILED | Payment attempt failed |
| CONFIRMED | Payment successful, awaiting captain assignment |
| ASSIGNED | Captain assigned, awaiting pickup |
| PICKED_UP | Captain collected the parcel from sender |
| IN_TRANSIT | Parcel is on the way to destination |
| OUT_FOR_DELIVERY | Captain is at the destination area |
| DELIVERED | Parcel delivered successfully |
| CANCELLED | Booking cancelled before pickup |
| RETURN_INITIATED | Return requested after delivery |
| RETURNED | Parcel returned to sender |

#### Allowed State Transitions

| From | To | Triggered By |
|------|----|--------------|
| PENDING | CONFIRMED | System (auto, on payment success) |
| PENDING | PAYMENT_FAILED | System (auto, on payment failure) |
| PAYMENT_FAILED | PENDING | Customer (retries payment) |
| CONFIRMED | ASSIGNED | Point Manager / Admin / Super Admin |
| CONFIRMED | CANCELLED | Customer / Admin / Super Admin (before pickup) |
| ASSIGNED | PICKED_UP | Captain |
| ASSIGNED | CANCELLED | Customer / Admin / Super Admin (before pickup) |
| PICKED_UP | IN_TRANSIT | Captain |
| IN_TRANSIT | OUT_FOR_DELIVERY | Captain |
| OUT_FOR_DELIVERY | DELIVERED | Captain |
| DELIVERED | RETURN_INITIATED | Customer / Admin |
| RETURN_INITIATED | RETURNED | Captain / Admin |

**Rules:**
- Cancellation is only allowed before PICKED_UP status
- Only the Captain assigned to the booking can update pickup/transit/delivery statuses
- Point Manager, Admin, and Super Admin can update any status
- Each status change must be logged to `audit_logs`

### 5.4 Booking Ownership Rules

1. Pickup location → determines Point Manager
2. Booking auto-appears in that Point Manager's dashboard
3. Point Manager assigns a Captain
4. Captain handles pickup → transit → delivery

---

## 6. Dynamic Pricing Engine

Price must be **automatically calculated** when a booking is created. No manual price entry.

### 6.1 Pricing Inputs

| Input             | Required | Notes                          |
|-------------------|----------|--------------------------------|
| Pickup Location   | Yes      | Source for distance calculation|
| Drop Location     | Yes      | Destination                    |
| Distance (km)     | Auto     | Calculated via Haversine       |
| Parcel Weight (kg)| Yes      |                                |
| Parcel Type       | Yes      | May affect fragile surcharge   |
| Delivery Priority | Yes      | EXPRESS/OVERNIGHT adds surcharge|
| Rural Surcharge   | Optional | Applied for remote locations   |

### 6.2 Pricing Rule Structure

Pricing rules are stored per route in the `pricing_rules` table:

```
Source Location → Destination Location
  Weight Slab: minWeight – maxWeight kg
  Base Price:  ₹X
  Per KM Rate: ₹Y per km
  Estimated Delivery Days: Z
```

### 6.3 Price Calculation Formula

```
distance        = haversine(pickup.lat, pickup.lng, drop.lat, drop.lng)
base_price      = lookup from pricing_rules (by route + weight slab)
distance_charge = distance × pricePerKm
priority_charge = base_price × priority_multiplier  (EXPRESS=1.5, OVERNIGHT=2.0)
rural_surcharge = flat fee if location.isRural = true
final_price     = base_price + distance_charge + priority_charge + rural_surcharge
```

### 6.4 Pricing Example

```
Route:    Karimnagar → Warangal
Distance: 72 km

Weight Slabs:
  0–2 kg  → ₹60 base
  2–5 kg  → ₹90 base
  5–10 kg → ₹140 base

A 3 kg STANDARD parcel:
  base_price      = ₹90
  distance_charge = 72 × ₹0.50 = ₹36
  final_price     = ₹126
```

### 6.5 Pricing Rules Managed By

- SUPER_ADMIN and ADMIN can create/update/delete pricing rules globally
- Pricing rules can be set per route pair or as a general fallback rule

### 6.6 Pricing Fallback Rule

When no route-specific pricing rule exists for a pickup → drop pair:

1. System looks for a **global default pricing rule** (`sourceLocationId = null` AND `destinationLocationId = null`)
2. If global default exists → apply it with distance-based calculation
3. If no default exists → **block booking**, show error: *"Delivery pricing is not available for this route. Please contact support."*
4. Admin receives an automatic email notification listing the blocked route so they can add a pricing rule

**Admin must always maintain at least one global default pricing rule to prevent booking failures.**

---

## 7. Distance Calculation

The system must calculate distance between two locations using their latitude/longitude.

### Primary Method: Haversine Formula
- No external API dependency
- Calculates straight-line (as-the-crow-flies) distance
- Sufficient for pricing and ETA estimation

### Future Method: Google Maps Distance Matrix API
- Road distance instead of straight-line
- More accurate ETAs
- Plug-in ready — system should be architected to swap calculation method

### Use Cases
- Dynamic pricing
- Estimated delivery time calculation
- Nearest captain suggestions
- Route optimization

---

## 8. Captain Assignment

### Assignment Rules
- Point Managers can only assign captains from:
  - Same district, OR
  - Same operational region (as configured)

### Captain Availability Tracking

| Field              | Notes                            |
|--------------------|----------------------------------|
| availabilityStatus | AVAILABLE / BUSY / OFF_DUTY      |
| currentCapacity    | Number of active assigned bookings|
| assignedLocationId | Captain's home location          |

### Captain Availability Toggle

| Status | Set By | Condition |
|--------|--------|-----------|
| AVAILABLE | Captain (manual) | Captain is ready to receive bookings |
| OFF_DUTY | Captain (manual) | Captain is not working (end of shift, day off) |
| BUSY | System (auto) | Captain has one or more active bookings (ASSIGNED → IN_TRANSIT) |

**Rules:**
- Captain manually toggles between AVAILABLE and OFF_DUTY from their dashboard
- System automatically sets BUSY when a booking is assigned to the captain
- System automatically restores previous status (AVAILABLE or OFF_DUTY) when the booking reaches DELIVERED or CANCELLED
- Captain cannot manually set themselves as BUSY
- Captains with OFF_DUTY or BUSY status are hidden from the assignment list

### Assignment Flow
1. Point Manager opens booking
2. System shows available captains (AVAILABLE status only) filtered by district
3. Point Manager selects captain
4. Captain receives email notification + push notification (if PWA installed)
5. Captain updates booking status through delivery workflow

---

## 9. Payment Integration

The platform must support online payment at the time of booking confirmation.

### 9.1 Supported Payment Methods

- UPI (GPay, PhonePe, Paytm)
- Debit / Credit Card
- Net Banking
- Cash on Delivery (COD) — optional, configurable per location

### 9.2 Payment Flow

```
Customer confirms booking
→ Pricing is calculated and shown
→ Customer selects payment method
→ Payment gateway processes transaction
→ On success → Booking is confirmed and routed to Point Manager
→ On failure → Booking is held, customer prompted to retry
```

### 9.3 Payment Status

| Status    | Meaning                                    |
|-----------|--------------------------------------------|
| PENDING   | Awaiting payment                           |
| PAID      | Payment successful, booking confirmed      |
| FAILED    | Payment failed, booking not confirmed      |
| REFUNDED  | Booking cancelled, amount returned         |
| COD       | Cash to be collected at delivery           |

### 9.4 Refund Rules

- Cancellation before pickup → Full refund
- Cancellation after pickup → No refund (configurable by admin)
- Refund is processed back to original payment method

### 9.5 Payment Fields (bookings table addition)

| Field             | Notes                               |
|-------------------|-------------------------------------|
| paymentStatus     | PENDING / PAID / FAILED / REFUNDED / COD |
| paymentMethod     | UPI / CARD / NETBANKING / COD       |
| paymentGatewayRef | Transaction ID from payment gateway |
| paidAt            | Timestamp of successful payment     |

### 9.6 Payment Gateway

- Use **Razorpay** as the primary payment gateway (India-ready, supports UPI/Cards/NetBanking)
- Architecture must support swapping to other gateways (Stripe, PayU) without core changes
- All payment keys must be stored in environment variables, never in code

---

## 10. Database Schema

### 10.0 ID Strategy

**All primary keys use UUID v4** (`@default(uuid())` in Prisma). No auto-increment integers.

| Reason | Detail |
|--------|--------|
| **Security** | UUIDs are non-guessable — users cannot enumerate records by incrementing an ID |
| **Distributed-safe** | Safe to generate IDs client-side or across multiple services without collision |
| **Prisma default** | `String @id @default(uuid())` — zero config needed |

**Human-readable IDs (display only):**

| Table | Field | Format | Example | Purpose |
|-------|-------|--------|---------|--------|
| `users` | `displayId` | `VE-` + role prefix + 4-digit number | `VE-PM-0042`, `VE-CAP-0017`, `VE-CUST-0301` | Support, internal ops |
| `bookings` | `bookingNumber` | `VE-BK-` + YYMMDD + 4-digit seq | `VE-BK-260526-0001` | Customer tracking, receipts |

**Role prefix mapping for `displayId`:**

| Role | Prefix | Example |
|------|--------|---------|
| SUPER_ADMIN | `VE-SA-` | `VE-SA-0001` |
| ADMIN | `VE-AD-` | `VE-AD-0003` |
| FRANCHISE_OWNER | `VE-FO-` | `VE-FO-0012` |
| POINT_MANAGER | `VE-PM-` | `VE-PM-0042` |
| CAPTAIN | `VE-CAP-` | `VE-CAP-0017` |
| CUSTOMER | `VE-CUST-` | `VE-CUST-0301` |

- `displayId` is auto-generated on user creation based on their primary role
- `bookingNumber` is auto-generated on booking creation using a DB sequence
- Both fields are **indexed** and **unique**
- Internal DB joins always use UUID `id` — display IDs are for UI/support only

---

### 10.1 locations
| Column       | Type    | Notes                          |
|--------------|---------|--------------------------------|
| id           | UUID    | Primary key `@default(uuid())` |
| state        | VARCHAR |                                |
| district     | VARCHAR |                                |
| mandal       | VARCHAR | Nullable                       |
| village      | VARCHAR |                                |
| pointName    | VARCHAR |                                |
| pincode      | VARCHAR |                                |
| latitude     | DECIMAL |                                |
| longitude    | DECIMAL |                                |
| locationType | ENUM    | POINT / HUB / WAREHOUSE        |
| isActive     | BOOLEAN | Default: true                  |
| createdAt    | TIMESTAMP|                               |
| updatedAt    | TIMESTAMP|                               |

### 10.2 users
| Column         | Type      | Notes                                    |
|----------------|-----------|------------------------------------------|
| id             | UUID      | Primary key `@default(uuid())`           |
| displayId      | VARCHAR   | Unique, human-readable (e.g. VE-PM-0042) |
| name           | VARCHAR   |                                          |
| email          | VARCHAR   | Unique, nullable                         |
| phone          | VARCHAR   | Unique                                   |
| password       | VARCHAR   | Hashed, nullable (OTP users have no pwd) |
| approvalStatus | ENUM      | PENDING / APPROVED / REJECTED            |
| isActive       | BOOLEAN   | Default: true                            |
| createdAt      | TIMESTAMP |                                          |
| updatedAt      | TIMESTAMP |                                          |

### 10.3 roles
| Column      | Type    | Notes                      |
|-------------|---------|----------------------------|
| id          | UUID    | Primary key `@default(uuid())` |
| name        | VARCHAR | Unique (e.g., POINT_MANAGER)|
| description | TEXT    |                            |
| level       | INT     | Hierarchy level            |
| isActive    | BOOLEAN | Default: true              |
| createdAt   | TIMESTAMP|                           |
| updatedAt   | TIMESTAMP|                           |

### 10.4 permissions
| Column      | Type    | Notes                        |
|-------------|---------|------------------------------|
| id          | UUID    | Primary key `@default(uuid())` |
| name        | VARCHAR | Unique (e.g., booking:create)|
| description | TEXT    |                              |
| resource    | VARCHAR | e.g., booking                |
| action      | VARCHAR | e.g., create                 |
| createdAt   | TIMESTAMP|                             |
| updatedAt   | TIMESTAMP|                             |

### 10.5 role_permissions
| Column       | Type    | Notes                              |
|--------------|---------|------------------------------------|
| id           | UUID    | Primary key `@default(uuid())`     |
| roleId       | FK      | → roles.id                         |
| permissionId | FK      | → permissions.id                   |
| scope        | ENUM    | GLOBAL / REGION / DISTRICT / LOCATION|
| createdAt    | TIMESTAMP|                                   |

### 10.6 user_roles
| Column             | Type    | Notes                          |
|--------------------|---------|--------------------------------|
| id                 | UUID    | Primary key `@default(uuid())` |
| userId             | FK      | → users.id                     |
| roleId             | FK      | → roles.id                     |
| isPrimary          | BOOLEAN | One primary role per user      |
| assignedLocationId | FK      | → locations.id (nullable)      |
| createdAt          | TIMESTAMP|                               |

### 10.7 point_manager_profiles
| Column         | Type      | Notes                          |
|----------------|-----------|--------------------------------|
| id             | UUID      | Primary key `@default(uuid())` |
| userId         | FK        | → users.id                     |
| shopName       | VARCHAR   |                                |
| shopLocationId | FK        | → locations.id                 |
| shopPhoto      | VARCHAR   | URL/path to uploaded image     |
| createdAt      | TIMESTAMP |                                |
| updatedAt      | TIMESTAMP |                                |

### 10.8 captain_profiles
| Column         | Type      | Notes                              |
|----------------|-----------|------------------------------------|
| id             | UUID      | Primary key `@default(uuid())`     |
| userId         | FK        | → users.id                         |
| aadhaarNumber  | VARCHAR   |                                    |
| aadhaarPhoto   | VARCHAR   | URL/path to uploaded image         |
| drivingLicense | VARCHAR   | License number                     |
| licensePhoto   | VARCHAR   | URL/path to uploaded image         |
| vehicleType    | ENUM      | BIKE / AUTO / MINI_VAN / VAN       |
| vehicleNumber  | VARCHAR   |                                    |
| districtId     | VARCHAR   | Operating district                 |
| createdAt      | TIMESTAMP |                                    |
| updatedAt      | TIMESTAMP |                                    |

### 10.9 bookings
| Column                 | Type    | Notes                              |
|------------------------|---------|------------------------------------|
| id                     | UUID    | Primary key `@default(uuid())`     |
| bookingNumber          | VARCHAR | Unique, e.g. `VE-BK-260526-0001`  |
| customerId             | FK      | → users.id               |
| pickupLocationId       | FK      | → locations.id           |
| dropLocationId         | FK      | → locations.id           |
| assignedPointManagerId | FK      | → users.id (auto-set)    |
| assignedCaptainId      | FK      | → users.id (nullable)    |
| parcelWeight           | DECIMAL |                          |
| parcelType             | ENUM    |                          |
| deliveryPriority       | ENUM    | STANDARD/EXPRESS/OVERNIGHT|
| status                 | ENUM    | Booking lifecycle status |
| calculatedPrice        | DECIMAL |                          |
| estimatedDeliveryDate  | DATE      |                                  |
| paymentStatus          | ENUM      | PENDING/PAID/FAILED/REFUNDED/COD |
| paymentMethod          | ENUM      | UPI/CARD/NETBANKING/COD          |
| paymentGatewayRef      | VARCHAR   | Gateway transaction ID           |
| paidAt                 | TIMESTAMP | Nullable                         |
| createdAt              | TIMESTAMP |                                  |
| updatedAt              | TIMESTAMP |                                  |

### 10.10 pricing_rules
| Column               | Type    | Notes                     |
|----------------------|---------|---------------------------|
| id                   | UUID    | Primary key `@default(uuid())` |
| sourceLocationId     | FK      | → locations.id (nullable for default)|
| destinationLocationId| FK      | → locations.id (nullable for default)|
| minWeight            | DECIMAL |                           |
| maxWeight            | DECIMAL |                           |
| basePrice            | DECIMAL |                           |
| pricePerKm           | DECIMAL |                           |
| estimatedDeliveryDays| INT     |                           |
| createdAt            | TIMESTAMP|                          |
| updatedAt            | TIMESTAMP|                          |

### 10.11 audit_logs
| Column    | Type    | Notes                                                |
|-----------|---------|------------------------------------------------------|
| id        | UUID    | Primary key `@default(uuid())`                       |
| userId    | FK      | → users.id                                           |
| action    | VARCHAR | e.g., permission_check / role_assigned               |
| resource  | VARCHAR | e.g., booking                                        |
| result    | ENUM    | GRANTED / DENIED                                     |
| ipAddress | VARCHAR |                                                      |
| userAgent | VARCHAR |                                                      |
| timestamp | TIMESTAMP|                                                     |

### 10.12 Relationships & Constraints

#### One-to-One Relationships

| Table A | Table B | Rule |
|---------|---------|------|
| users | point_manager_profiles | One user → one Point Manager profile. `userId` is UNIQUE in `point_manager_profiles`. |
| users | captain_profiles | One user → one Captain profile. `userId` is UNIQUE in `captain_profiles`. |

#### One-to-Many Relationships

| Parent | Child | Foreign Key | On Delete |
|--------|-------|-------------|-----------|
| locations | point_manager_profiles | `shopLocationId` | RESTRICT (cannot delete location if a Point Manager is assigned) |
| locations | bookings (pickup) | `pickupLocationId` | RESTRICT |
| locations | bookings (drop) | `dropLocationId` | RESTRICT |
| locations | user_roles | `assignedLocationId` | SET NULL |
| users | bookings (customer) | `customerId` | RESTRICT |
| users | bookings (point manager) | `assignedPointManagerId` | SET NULL |
| users | bookings (captain) | `assignedCaptainId` | SET NULL |
| users | user_roles | `userId` | CASCADE (delete roles when user deleted) |
| users | audit_logs | `userId` | SET NULL |
| roles | user_roles | `roleId` | RESTRICT (cannot delete role if users are assigned) |
| roles | role_permissions | `roleId` | CASCADE (delete permissions mapping when role deleted) |
| permissions | role_permissions | `permissionId` | CASCADE |
| locations | pricing_rules (source) | `sourceLocationId` | SET NULL |
| locations | pricing_rules (destination) | `destinationLocationId` | SET NULL |

#### Many-to-Many Relationships

| Relationship | Junction Table | Notes |
|---|---|---|
| roles ↔ permissions | `role_permissions` | One role can have many permissions; one permission can belong to many roles |
| users ↔ roles | `user_roles` | One user can have multiple roles; one role can be assigned to many users |

#### Unique Constraints

| Table | Unique Constraint | Purpose |
|-------|-------------------|---------|
| users | `email` (when not null) | No duplicate emails |
| users | `phone` | No duplicate phone numbers |
| roles | `name` | No duplicate role names |
| permissions | `name` | No duplicate permission strings |
| role_permissions | `(roleId, permissionId, scope)` | No duplicate permission assignments per scope |
| user_roles | `(userId, roleId)` | User cannot be assigned same role twice |
| point_manager_profiles | `userId` | One profile per Point Manager |
| captain_profiles | `userId` | One profile per Captain |
| point_manager_profiles | `shopLocationId` | One Point Manager per location |

#### Recommended Indexes

| Table | Index Columns | Reason |
|-------|---------------|--------|
| bookings | `pickupLocationId` | Auto-routing lookups |
| bookings | `assignedPointManagerId` | Point Manager dashboard queries |
| bookings | `assignedCaptainId` | Captain dashboard queries |
| bookings | `customerId` | Customer order history queries |
| bookings | `status` | Filter by booking status |
| bookings | `paymentStatus` | Payment status filtering |
| user_roles | `userId` | Permission resolution per user |
| user_roles | `roleId` | Roles-to-users lookup |
| role_permissions | `roleId` | Permissions per role lookup |
| locations | `(state, district, village)` | Cascading dropdown queries |
| captain_profiles | `districtId` | Captain availability filter by district |
| audit_logs | `userId` | Audit history per user |
| audit_logs | `timestamp` | Time-range audit queries |

---

## 11. API Endpoints

### Authentication
```
POST /api/auth/send-otp              (customer OTP login — phone or email)
POST /api/auth/verify-otp            (verify OTP, returns JWT)
POST /api/auth/login                 (password-based login for staff roles)
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/change-password
```

### Registration & Approval
```
POST /api/register/point-manager     (self-registration with shop details + photo)
POST /api/register/captain           (self-registration with KYC docs)
GET  /api/admin/pending-approvals    (list pending Point Managers and Captains)
PUT  /api/admin/approve/:userId      (approve registration)
PUT  /api/admin/reject/:userId       (reject with reason)
```

### Locations
```
GET    /api/locations
POST   /api/locations
GET    /api/locations/:id
PUT    /api/locations/:id
DELETE /api/locations/:id
GET    /api/locations/cascading?state=&district=   (for booking form dropdowns)
```

### Users
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id                (admin: edit any user's data)
DELETE /api/users/:id
GET    /api/users/:id/roles
POST   /api/users/:id/roles
DELETE /api/users/:id/roles/:roleId
GET    /api/users/:id/permissions
PUT    /api/profile/me               (self: edit own profile)
GET    /api/bookings/history         (customer: own order history)
```

### Roles
```
GET    /api/roles
POST   /api/roles
GET    /api/roles/:id
PUT    /api/roles/:id
DELETE /api/roles/:id
POST   /api/roles/:id/permissions/:permissionId
DELETE /api/roles/:id/permissions/:permissionId
```

### Permissions
```
GET    /api/permissions
POST   /api/permissions
GET    /api/permissions/:id
PUT    /api/permissions/:id
DELETE /api/permissions/:id
```

### Bookings
```
GET    /api/bookings
POST   /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id
DELETE /api/bookings/:id
POST   /api/bookings/:id/assign-captain  (Point Manager / Admin / Super Admin)
PUT    /api/bookings/:id/status
GET    /api/bookings/my                  (customer: own bookings + history)
GET    /api/bookings/point-manager       (point manager: location bookings)
```

### Payments
```
POST   /api/payments/initiate/:bookingId
POST   /api/payments/webhook             (Razorpay callback)
GET    /api/payments/:bookingId/status
POST   /api/payments/:bookingId/refund
```

### Pricing
```
GET    /api/pricing-rules
POST   /api/pricing-rules
PUT    /api/pricing-rules/:id
DELETE /api/pricing-rules/:id
POST   /api/pricing/calculate            (preview price before booking)
```

### Captains
```
GET    /api/captains/available?districtId=
PUT    /api/captains/:id/availability
```

---

## 12. Frontend Requirements

### 12.0 Technology Stack

**UI Library:** shadcn/ui

All UI components must be built using shadcn/ui. Do not use any other component library.

**Initialization command:**
```bash
npx shadcn@latest init --preset b7ClOweIy --template next --monorepo --pointer
```

**Framework:** Next.js (monorepo setup)

**Styling:** Tailwind CSS (bundled with shadcn/ui)

**Icons:** Lucide React (bundled with shadcn/ui)

**Key shadcn/ui components to use:**

| Component | Used For |
|-----------|----------|
| Button | All action buttons |
| Input | Form fields |
| Select | Cascading location dropdowns |
| Table | Booking lists, user lists, pricing rules |
| Dialog | Confirm actions, assign captain modal |
| Form + Zod | All form validation |
| Badge | Booking status, approval status |
| Card | Dashboard widgets, booking summary |
| Tabs | Dashboard sections (Pending / Active / Completed) |
| Sidebar | Navigation for admin, point manager, captain dashboards |
| Breadcrumb | Location selection hierarchy |
| Toast / Sonner | Success/error notifications |
| Avatar | User profile photos |
| DataTable | Sortable/filterable tables for admin views |

---

### 12.1 Booking Form — Cascading Location Selection

Dropdowns must cascade in order:

```
Pickup:  [State] → [District] → [Village/Town] → [Point]
Drop:    [State] → [District] → [Village/Town] → [Point]
```

Each level only loads after the previous level is selected.

### 12.2 Pricing Preview

Before submitting a booking, the frontend must show:
- Calculated price
- Estimated delivery days
- Route summary (pickup point → drop point)

### 12.3 Dynamic Permission Hooks (React)

```
usePermissions()
  hasPermission(permission: string): boolean
  hasAnyPermission(permissions: string[]): boolean
  hasAllPermissions(permissions: string[]): boolean

useRole()
  hasRole(roleName: string): boolean
  hasAnyRole(roleNames: string[]): boolean
```

### 12.4 ProtectedRoute Component

Wraps routes that require specific permissions or roles. Redirects to 403 page if access is denied.

```
<ProtectedRoute permission="booking:assign_captain">
  <AssignCaptainPage />
</ProtectedRoute>
```

### 12.5 Permission-Driven UI

UI elements must be hidden or disabled based on user permissions. Frontend checks are for UX only — all real enforcement is server-side.

### 12.6 Dashboard Layouts Per Role

**Customer Dashboard**
- New Booking (cascading location form + price preview)
- My Active Bookings (status tracker)
- Order History (filterable list)
- Profile (edit name, phone, email)

**Captain Dashboard**
- My Assignments (active bookings assigned to me)
- Update Status (PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED)
- Availability Toggle (AVAILABLE / OFF_DUTY)
- Delivery History
- Profile (edit details, vehicle info)

**Point Manager Dashboard**
- Incoming Bookings (new bookings at my location, unassigned)
- Assign Captain (select from available district captains)
- All Bookings (full list for my location)
- Reports (booking counts, revenue for my location)
- Profile (edit shop details)

**Admin Dashboard**
- Pending Approvals (Point Manager and Captain registrations)
- Users Management (view/edit all users)
- Locations Management (create/edit/deactivate locations)
- Pricing Rules (create/edit route pricing)
- All Bookings (system-wide, with filters)
- Reports (system-wide)

**Super Admin Dashboard**
- Everything in Admin Dashboard
- Roles & Permissions Management (create/edit roles, assign permissions)
- Audit Logs (view all system activity)
- System Settings (manage environment-level configs)
- Edit Any User / Booking / Record

### 12.7 Customer Order History Page

- Accessible from customer dashboard
- Shows all past and active bookings
- Each booking shows: route, price, status, date, tracking
- Filter by date range or status

### 12.8 Registration Forms

**Point Manager Registration:**
- Form fields: name, phone, email, password, shop name, shop location (dropdown from locations), shop photo upload
- Submission shows: "Your registration is under review. You will be notified once approved."

**Captain Registration:**
- Form fields: name, phone, email, password, Aadhaar number, Aadhaar photo upload, driving license number, license photo upload, vehicle type, vehicle number, district
- Submission shows: "Your KYC is under review. You will be notified once approved."

### 12.9 Admin Approval Dashboard

- Lists all PENDING Point Manager and Captain registrations
- Admin can view full submitted details and uploaded documents
- One-click Approve or Reject with optional rejection reason
- Approved users are immediately notified and can log in

---

## 13. Security Considerations

- All permission checks must be enforced server-side. Frontend checks are UX-only.
- Never trust client-side permission or role claims.
- JWT tokens must not embed permissions — always fetch fresh from server/cache.
- Implement rate limiting on auth and permission management endpoints.
- All role and permission changes must be written to `audit_logs`.
- Role/permission management requires `role:manage` or `permission:manage` permission.
- Regular permission audits recommended in production.

---

## 14. Future Scalability

Architecture must support future expansion without core redesign:

- Route optimization engine
- Hub-based multi-stop routing
- Nearest captain auto-suggestion
- AI-based delivery time prediction
- Live GPS tracking for captains
- Inter-district and inter-state logistics
- Warehouse transfer workflows
- Franchise expansion with regional ownership
- Google Maps Distance Matrix API integration

---

## 15. Technical Stack & Project Setup

### 15.1 Core Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (stable latest) — frontend + API routes |
| Database | PostgreSQL |
| ORM | Prisma |
| UI Library | shadcn/ui |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Payment | Razorpay |
| Monorepo | Turborepo |
| OTP / Email | Nodemailer (SMTP) — email OTP only (initially) |
| File Storage | Linode Object Storage (S3-compatible) |
| Push Notifications | Firebase Cloud Messaging (FCM) — PWA only |
| Email Notifications | Nodemailer via SMTP |

### 15.2 OTP & Authentication

- **Phase 1 (current):** Email OTP only — OTP sent to customer's email via Nodemailer
- OTP must expire after 10 minutes
- OTP must be single-use (invalidated after first successful verify)
- Maximum 3 OTP requests per phone/email per hour (rate limited)
- **Phase 2 (future):** SMS OTP can be added by swapping the OTP provider without changing the auth flow

### 15.3 File Storage — Linode Object Storage

- All uploaded files (shop photos, Aadhaar, license photos) stored in **Linode Object Storage**
- Linode Object Storage is S3-compatible — use AWS SDK (`@aws-sdk/client-s3`) with Linode endpoint
- Files stored in a private bucket; served via pre-signed URLs or public CDN depending on sensitivity
- **Sensitive documents** (Aadhaar, license): private bucket, pre-signed URL with short TTL (15 min)
- **Shop photos**: public bucket, direct CDN URL

| File Type | Bucket Visibility | Access Method |
|-----------|-------------------|---------------|
| Shop photo | Public | Direct URL |
| Aadhaar front/back | Private | Pre-signed URL (15 min TTL) |
| Driving license | Private | Pre-signed URL (15 min TTL) |

**Accepted formats:** JPEG, PNG, WebP
**Max file size:** 5 MB per file

### 15.4 Notification System

#### Email Notifications (All Users)

Sent via Nodemailer (SMTP). Triggered on the following events:

| Event | Recipient | Channel |
|-------|-----------|--------|
| Registration submitted | Applicant (PM/Captain) | Email |
| Registration approved | Applicant | Email |
| Registration rejected | Applicant (with reason) | Email |
| OTP sent | Customer | Email |
| Booking confirmed (payment success) | Customer | Email |
| Payment failed | Customer | Email |
| Captain assigned to booking | Customer | Email |
| Booking picked up | Customer | Email |
| Booking delivered | Customer | Email |
| Booking cancelled | Customer | Email |
| New booking routed to location | Point Manager | Email |
| Captain assigned to booking | Captain | Email |
| New pending approval | Admin / Super Admin | Email |
| Pricing rule missing for route | Admin / Super Admin | Email |

#### Push Notifications (PWA — Firebase Cloud Messaging)

Only sent if user has installed the PWA and granted notification permission.

| Event | Recipient |
|-------|-----------|
| New booking routed to location | Point Manager |
| Captain assigned to booking | Captain |
| Booking picked up | Customer |
| Booking delivered | Customer |
| Booking cancelled | Customer |

**PWA Implementation:**
- Register a service worker in Next.js (`next-pwa` or manual)
- On PWA install + permission grant, save FCM token to `user_fcm_tokens` table
- Send push via Firebase Admin SDK from Next.js API routes
- If FCM token is stale/invalid, silently skip push (email is the fallback)

**Additional `user_fcm_tokens` table required:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| userId | FK | → users.id |
| fcmToken | VARCHAR | FCM device token |
| createdAt | TIMESTAMP | |

### 15.5 Deployment Pipeline

| Stage | Purpose | Action |
|-------|---------|--------|
| **Development** | Local dev, feature building | `npm run dev`, local PostgreSQL |
| **Testing** | QA, integration testing | Deployed to staging server, test DB |
| **Production** | Live system | Deployed after testing sign-off |

**Flow:**
```
Local Development
→ Push to feature branch
→ Merge to main after review
→ Deploy to Testing/Staging environment
→ QA sign-off
→ Deploy to Production
```

- Production and staging must use **separate databases**
- `.env` files are never committed — managed per environment
- Database migrations run via `npx prisma migrate deploy` on each deployment

### 15.6 Monorepo Structure

```
village-express/
├── apps/
│   └── web/                  # Next.js app (frontend + API routes)
│       ├── app/              # App Router pages
│       │   ├── (auth)/       # Login, register pages
│       │   ├── (customer)/   # Customer dashboard & booking
│       │   ├── (captain)/    # Captain dashboard
│       │   ├── (point-manager)/ # Point Manager dashboard
│       │   └── (admin)/      # Admin & Super Admin panel
│       ├── components/       # App-specific components
│       └── styles/
│           └── global.css    # Design tokens (see §15.7)
├── packages/
│   ├── ui/                   # Shared shadcn/ui components
│   ├── db/                   # Prisma schema + generated client
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── types/                # Shared TypeScript types
│   └── utils/                # Shared utilities (haversine, pricing calc, email, storage)
├── turbo.json
├── package.json
└── .env.example
```

**shadcn/ui init command:**
```bash
npx shadcn@latest init --preset b7ClOweIy --template next --monorepo --pointer
```

### 15.7 Design Tokens (global.css)

The following CSS variables define the full design system and must be placed in `apps/web/styles/global.css`:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.148 0.004 228.8);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.148 0.004 228.8);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.148 0.004 228.8);
  --primary: oklch(0.525 0.223 3.958);
  --primary-foreground: oklch(0.971 0.014 343.198);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.963 0.002 197.1);
  --muted-foreground: oklch(0.56 0.021 213.5);
  --accent: oklch(0.525 0.223 3.958);
  --accent-foreground: oklch(0.971 0.014 343.198);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.925 0.005 214.3);
  --input: oklch(0.925 0.005 214.3);
  --ring: oklch(0.723 0.014 214.4);
  --chart-1: oklch(0.872 0.007 219.6);
  --chart-2: oklch(0.56 0.021 213.5);
  --chart-3: oklch(0.45 0.017 213.2);
  --chart-4: oklch(0.378 0.015 216);
  --chart-5: oklch(0.275 0.011 216.9);
  --radius: 0.45rem;
  --sidebar: oklch(0.987 0.002 197.1);
  --sidebar-foreground: oklch(0.148 0.004 228.8);
  --sidebar-primary: oklch(0.592 0.249 0.584);
  --sidebar-primary-foreground: oklch(0.971 0.014 343.198);
  --sidebar-accent: oklch(0.963 0.002 197.1);
  --sidebar-accent-foreground: oklch(0.218 0.008 223.9);
  --sidebar-border: oklch(0.925 0.005 214.3);
  --sidebar-ring: oklch(0.723 0.014 214.4);
}

.dark {
  --background: oklch(0.148 0.004 228.8);
  --foreground: oklch(0.987 0.002 197.1);
  --card: oklch(0.218 0.008 223.9);
  --card-foreground: oklch(0.987 0.002 197.1);
  --popover: oklch(0.218 0.008 223.9);
  --popover-foreground: oklch(0.987 0.002 197.1);
  --primary: oklch(0.459 0.187 3.815);
  --primary-foreground: oklch(0.971 0.014 343.198);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.275 0.011 216.9);
  --muted-foreground: oklch(0.723 0.014 214.4);
  --accent: oklch(0.459 0.187 3.815);
  --accent-foreground: oklch(0.971 0.014 343.198);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.56 0.021 213.5);
  --chart-1: oklch(0.872 0.007 219.6);
  --chart-2: oklch(0.56 0.021 213.5);
  --chart-3: oklch(0.45 0.017 213.2);
  --chart-4: oklch(0.378 0.015 216);
  --chart-5: oklch(0.275 0.011 216.9);
  --sidebar: oklch(0.218 0.008 223.9);
  --sidebar-foreground: oklch(0.987 0.002 197.1);
  --sidebar-primary: oklch(0.656 0.241 354.308);
  --sidebar-primary-foreground: oklch(0.971 0.014 343.198);
  --sidebar-accent: oklch(0.275 0.011 216.9);
  --sidebar-accent-foreground: oklch(0.987 0.002 197.1);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.56 0.021 213.5);
}
```

### 15.8 Super Admin Bootstrap (Seed)

The first Super Admin account must be created via a Prisma seed script (`packages/db/seed.ts`) on first deployment.

| Field | Value |
|-------|-------|
| Email | admin@villageexpress.in |
| Password | `VE@2026` *(must be bcrypt-hashed in seed script — never stored as plain text)* |
| Role | SUPER_ADMIN |
| approvalStatus | APPROVED |
| isActive | true |

**Seed script must also create:**
- All default roles (SUPER_ADMIN, ADMIN, FRANCHISE_OWNER, POINT_MANAGER, CAPTAIN, CUSTOMER)
- All default permissions (see §4.5)
- All default role-permission mappings

**Run seed:**
```bash
npx prisma db seed
```

> ⚠️ Change the Super Admin password immediately after first login in production.

### 15.9 Environment Variables (.env.example)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/village_express"

# Auth
JWT_SECRET=""
JWT_EXPIRY="15m"
REFRESH_TOKEN_SECRET=""
REFRESH_TOKEN_EXPIRY="7d"

# Email / OTP (Nodemailer SMTP)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@villageexpress.in"

# File Storage (Linode Object Storage — S3-compatible)
LINODE_STORAGE_ENDPOINT="https://<cluster-id>.linodeobjects.com"
LINODE_STORAGE_REGION=""
LINODE_ACCESS_KEY=""
LINODE_SECRET_KEY=""
LINODE_BUCKET_PUBLIC="village-express-public"
LINODE_BUCKET_PRIVATE="village-express-private"

# Firebase (Push Notifications — PWA)
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_VAPID_KEY=""

# Payment
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```
