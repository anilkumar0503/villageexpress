# Courier Management System — Project Overview

**Prepared for:** Client Review
**Purpose:** How the system works — from sign-up to delivery

---

## What Are We Building?

A smart, location-based courier management platform that connects **Customers**, **Point Managers**, and **Delivery Captains** in one system.

The platform automatically handles booking routing, pricing, and delivery assignments — no manual coordination needed.

---

## Who Uses the System?

| Role | Who They Are | What They Do |
|------|--------------|--------------|
| **Super Admin** | Platform owner | Full control of everything |
| **Admin** | Operations manager | Manages locations, users, pricing |
| **Franchise Owner** | Regional franchise partner | Manages their region's locations and staff |
| **Point Manager** | Local branch manager | Receives bookings, assigns delivery captains |
| **Captain** | Delivery person | Picks up and delivers parcels |
| **Customer** | End user / sender | Books a parcel delivery |

---

## Step-by-Step Flow

### Step 1 — System Setup (Admin)

Before anything works, the Admin sets up the system:

1. **Creates Locations** — Adds every pickup/drop point in the network (e.g., "Choppadandi Express Center, Karimnagar")
2. **Creates Point Managers** — Registers branch managers and assigns each one to a location
3. **Creates Captains** — Registers delivery riders and links them to their district
4. **Sets Pricing Rules** — Defines delivery charges based on route and parcel weight

---

### Step 2 — Customer Registration & Login

- A customer visits the platform and creates an account
- They log in and land on their personal dashboard
- From here they can book parcels, track deliveries, and view history

---

### Step 3 — Customer Books a Parcel

The customer fills out a simple booking form:

1. **Selects Pickup Location**
   - Chooses State → District → Village → Point (step by step)

2. **Selects Drop Location**
   - Same step-by-step selection for the destination

3. **Enters Parcel Details**
   - Weight
   - Type (Documents / General / Fragile / Perishable)
   - Delivery Speed (Standard / Express / Overnight)

4. **Sees Instant Price Preview**
   - System automatically calculates the price
   - Shows estimated delivery date
   - Customer confirms and pays

---

### Step 4 — Booking Automatically Reaches the Right Branch (Point Manager)

Once the customer confirms:

- The system **automatically identifies** which Point Manager is responsible for the selected pickup location
- The booking **instantly appears** on that Point Manager's dashboard
- No manual forwarding. No phone calls. It just arrives.

---

### Step 5 — Point Manager Assigns a Captain

The Point Manager:

1. Opens the new booking on their dashboard
2. Sees a list of **available captains** in their area
3. Assigns one captain to the booking
4. The assigned Captain gets notified immediately

---

### Step 6 — Captain Handles the Delivery

The Captain's workflow:

| Stage | Action |
|-------|--------|
| **Assigned** | Captain accepts the booking |
| **Pickup** | Captain collects the parcel from the sender |
| **In Transit** | Parcel is on the way |
| **Delivered** | Captain marks delivery as complete |
| **Cancelled** | If booking is cancelled before pickup |

At each stage, the customer receives a status update.

---

### Step 7 — Customer Tracks the Parcel

- The customer can log in at any time to see the live status of their parcel
- They see the current stage (Assigned / Picked Up / In Transit / Delivered)
- Estimated delivery date is always visible

---

## How Pricing Works (Simple Version)

The system calculates price automatically based on:

- **Distance** between pickup and drop point
- **Weight** of the parcel
- **Delivery speed** chosen (Standard is cheapest, Overnight is fastest)

The customer sees the final price **before confirming** the booking. No surprises.

**Example:**
> Karimnagar → Warangal, 3 kg parcel, Standard delivery = **₹126**

---

## Access Control — Who Can See What

Every person in the system only sees what is relevant to their role:

- **Customers** only see their own bookings
- **Captains** only see bookings assigned to them
- **Point Managers** only see bookings from their location
- **Franchise Owners** only see data from their region
- **Admins** see everything in the network

Roles and access levels can be **customized at any time** by the admin — no system change required.

---

## Key Benefits

- **Fully Automatic Routing** — Bookings reach the right branch instantly, zero manual work
- **Transparent Pricing** — Customer always knows the price before booking
- **Live Status Tracking** — Customer can track parcel at every stage
- **Scalable** — New locations, franchises, and cities can be added any time
- **Controlled Access** — Each person only accesses what they need

---

## Future Capabilities (Planned)

- Live GPS tracking of captains on a map
- Smart auto-assignment of the nearest available captain
- Multi-city and inter-state delivery support
- AI-based delivery time prediction
- Franchise expansion tools

---

*This document is a business-level overview. Technical architecture is maintained separately.*
