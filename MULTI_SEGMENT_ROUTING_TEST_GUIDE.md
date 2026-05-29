# Multi-Segment Routing - Manual Test Procedure

## Overview
This guide provides step-by-step instructions to manually test the multi-segment routing feature for Village Express.

## Prerequisites
- Database seeded with test data (Jagitial to Karimnagar route)
- Test users created via seeder
- Web application running locally

## Test Credentials (from seeder)

### Admin
- Email: `admin@villageexpress.in`
- Password: `12345678`

### Customer
- Email: `test.route@villageexpress.in`
- Password: `Customer@123`

### Point Managers (5 locations)
- Jagitial: `pm.jagitial@villageexpress.in` / `Pm@123`
- Malial: `pm.malial@villageexpress.in` / `Pm@123`
- Poodoor: `pm.poodoor@villageexpress.in` / `Pm@123`
- Gangadhara: `pm.gangadhara@villageexpress.in` / `Pm@123`
- Karimnagar: `pm.karimnagar@villageexpress.in` / `Pm@123`

### Captains (4 segments)
- Captain 1: `captain1@villageexpress.in` / `Captain@123`
- Captain 2: `captain2@villageexpress.in` / `Captain@123`
- Captain 3: `captain3@villageexpress.in` / `Captain@123`
- Captain 4: `captain4@villageexpress.in` / `Captain@123`

## Test Route
**Jagitial → Malial → Poodoor → Gangadhara → Karimnagar**
- Total Distance: 78km
- Segments: 4
- Estimated Days: 2

---

## Test Procedure

### Step 1: Customer Creates Booking

1. Login as Customer (`test.route@villageexpress.in` / `Customer@123`)
2. Navigate to **Bookings → New Booking**
3. Select Pickup Location:
   - State: Telangana
   - District: Jagitial
   - Point: Jagitial Express Center
4. Select Drop Location:
   - State: Telangana
   - District: Karimnagar
   - Point: Karimnagar City Hub
5. **Verify Route Selection Card appears** showing:
   - Route name: "Jagitial to Karimnagar"
   - Total distance: 78km
   - Estimated days: 2
   - Segment details (4 segments with locations and distances)
6. Fill Parcel Details:
   - Weight: 2.5 kg
   - Type: GENERAL
   - Priority: STANDARD
   - Payment: COD
7. **Verify price is calculated** using route pricing rules
8. Click **Place Booking**
9. **Verify booking created successfully** with segments

**Expected Result:**
- Booking created with booking number
- 4 booking segments created (one for each route segment)
- First segment assigned to Jagitial Point Manager
- Status: CONFIRMED (COD payment)

---

### Step 2: Point Manager (Jagitial) Receives Parcel

1. Login as Jagitial Point Manager (`pm.jagitial@villageexpress.in` / `Pm@123`)
2. Navigate to **Bookings → Point Manager Queue**
3. **Verify segment appears** with:
   - Booking number
   - Segment 1 badge
   - Route: Jagitial Express Center → Malial Express Center
   - Status: PENDING
   - Customer details
4. Click **Confirm Receipt**
5. **Verify status changes to RECEIVED_AT_POINT**

---

### Step 3: Point Manager Assigns Captain

1. Still on Point Manager Queue page
2. **Verify captain dropdown appears** for the segment
3. Select Captain 1 from dropdown
4. Click assign button (truck icon)
5. **Verify status changes to ASSIGNED**
6. **Verify captain assigned** to the segment

---

### Step 4: Captain Picks Up Parcel

1. Login as Captain 1 (`captain1@villageexpress.in` / `Captain@123`)
2. Navigate to **Captain Dashboard**
3. **Verify segment appears** in Active Assignments:
   - Booking number
   - Segment 1 badge
   - Route: Jagitial → Malial
   - Status: ASSIGNED
4. Click **Mark Picked Up**
5. **Verify status changes to PICKED_UP**

---

### Step 5: Captain In Transit

1. Still on Captain Dashboard
2. Click **Mark In Transit**
3. **Verify status changes to IN_TRANSIT**

---

### Step 6: Captain Hands Off to Next Point

1. Still on Captain Dashboard
2. Click **Mark Handed Off**
3. **Verify status changes to HANDED_OFF**
4. **Verify next segment (Segment 2) status changes to RECEIVED_AT_POINT** automatically

---

### Step 7: Point Manager (Malial) Receives Handoff

1. Login as Malial Point Manager (`pm.malial@villageexpress.in` / `Pm@123`)
2. Navigate to **Bookings → Point Manager Queue**
3. **Verify Segment 2 appears** with status RECEIVED_AT_POINT
4. Click **Confirm Receipt** (if not already confirmed)
5. Assign Captain 2 to the segment
6. **Verify status changes to ASSIGNED**

---

### Step 8: Repeat for Remaining Segments

**Segment 2 (Malial → Poodoor):**
- Captain 2: Mark Picked Up → In Transit → Handed Off
- Segment 3 auto-updates to RECEIVED_AT_POINT

**Segment 3 (Poodoor → Gangadhara):**
- Point Manager (Gangadhara): Confirm Receipt → Assign Captain 3
- Captain 3: Mark Picked Up → In Transit → Handed Off
- Segment 4 auto-updates to RECEIVED_AT_POINT

**Segment 4 (Gangadhara → Karimnagar):**
- Point Manager (Karimnagar): Confirm Receipt → Assign Captain 4
- Captain 4: Mark Picked Up → In Transit → Mark Delivered

---

### Step 9: Final Delivery Verification

1. After Captain 4 marks as delivered:
   - **Verify Segment 4 status changes to DELIVERED**
   - **Verify main booking status changes to DELIVERED**
2. Login as Customer
3. Navigate to **My Bookings**
4. **Verify booking shows as DELIVERED**

---

## API Testing (Optional)

### Test Available Routes API
```bash
GET /api/routes/available?pickupLocationId=<jagitial-id>&dropLocationId=<karimnagar-id>
```
Expected: Returns route with segments and pricing rules

### Test Booking Segments API (Point Manager)
```bash
GET /api/bookings/segments?status=PENDING
```
Expected: Returns segments at PM's location

### Test My Segments API (Captain)
```bash
GET /api/bookings/segments/my?status=ASSIGNED
```
Expected: Returns segments assigned to captain

### Test Segment Status Update
```bash
PUT /api/bookings/segments/<segment-id>
{
  "status": "PICKED_UP"
}
```
Expected: Status updated successfully

---

## Troubleshooting

### Route not appearing in customer UI
- Verify route is active in database
- Check pickup/drop locations match route source/destination
- Check API response in browser dev tools

### Segments not appearing for Point Manager
- Verify PM profile has correct shopLocationId
- Check route segments include PM's location
- Verify segment status is PENDING or RECEIVED_AT_POINT

### Segments not appearing for Captain
- Verify captain is assigned to segment
- Check segment status is ASSIGNED or higher
- Verify captain profile exists

### Status transitions failing
- Check valid status transitions in API
- Verify user has required permissions
- Check API error messages in console

---

## Success Criteria

✅ Customer can see and select routes when booking
✅ Booking creates with all segments
✅ Point Managers see segments at their location
✅ Point Managers can confirm receipt and assign captains
✅ Captains see their assigned segments
✅ Captains can advance segment status
✅ Handoff automatically updates next segment
✅ Final delivery updates booking status
✅ All status transitions work correctly

---

## Notes

- The seeder has already created a test booking (VE-ROUTE-TEST-001) with all segments
- You can use the automated test script: `cd packages/db && npx tsx test-journey.ts`
- For testing without UI, use the API endpoints directly
- Check browser console for any JavaScript errors
- Check server logs for API errors
