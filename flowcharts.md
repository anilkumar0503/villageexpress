# Courier Management System — Flowcharts

> Rendered with Mermaid. Use VS Code extension "Markdown Preview Mermaid Support" or open in any Mermaid-compatible viewer.

---

## 1. Full Operational Flow (System Overview)

```mermaid
flowchart TD
    A([Customer]) --> B[Creates Booking\nSelects Pickup & Drop Location]
    B --> C{Payment}
    C -->|Success| D[Booking Confirmed]
    C -->|Failure| E[Booking Held\nRetry Prompted]
    D --> F[System Auto-Identifies\nPickup Location's Point Manager]
    F --> G[Booking Appears in\nPoint Manager Dashboard]
    G --> H[Point Manager Assigns Captain]
    H --> I[Captain Notified]
    I --> J[Captain Picks Up Parcel]
    J --> K[In Transit]
    K --> L[Delivered]
    L --> M([Customer Notified\nBooking Closed])
```

---

## 2. Customer Registration & Login (OTP Flow)

```mermaid
flowchart TD
    A([User visits platform]) --> B{Has account?}
    B -->|No| C[Enter Phone Number or Email]
    B -->|Yes| C
    C --> D[OTP Sent via SMS / Email]
    D --> E[Customer Enters OTP]
    E --> F{OTP Valid?}
    F -->|No| G[Show Error\nResend Option]
    G --> D
    F -->|Yes| H{Account Exists?}
    H -->|No| I[Account Auto-Created\nCustomer Role Assigned]
    H -->|Yes| J[Existing Account Loaded]
    I --> K([Customer Dashboard])
    J --> K
```

---

## 3. Point Manager Self-Registration & Approval

```mermaid
flowchart TD
    A([Applicant]) --> B[Fills Registration Form\nName, Phone, Email, Password\nShop Name, Shop Location, Shop Photo]
    B --> C[Form Submitted]
    C --> D[Account Created\nStatus: PENDING\nCannot Log In Yet]
    D --> E[Admin / Super Admin\nReceives Notification]
    E --> F[Admin Reviews\nProfile & Shop Details]
    F --> G{Decision}
    G -->|Approve| H[Account Status → APPROVED\nPOINT_MANAGER Role Assigned\nShop Location Linked]
    G -->|Reject| I[Account Status → REJECTED\nApplicant Notified with Reason]
    G -->|Request Correction| J[Admin Edits Profile\nApplicant Notified]
    J --> F
    H --> K([Point Manager Can Log In\nDashboard Active])
    I --> L([Applicant Can Re-apply])
```

---

## 4. Captain Self-Registration & KYC Approval

```mermaid
flowchart TD
    A([Applicant]) --> B[Fills Registration Form\nName, Phone, Password\nAadhaar No + Photo\nDriving License + Photo\nVehicle Type + Number\nDistrict]
    B --> C[Form Submitted]
    C --> D[Account Created\nStatus: PENDING\nCannot Receive Bookings]
    D --> E[Admin / Super Admin\nReceives Notification]
    E --> F[Admin Verifies KYC Documents\nAadhaar + License]
    F --> G{Decision}
    G -->|Approve| H[Account Status → APPROVED\nCAPTAIN Role Assigned\nDistrict Linked]
    G -->|Reject| I[Account Status → REJECTED\nApplicant Notified with Reason]
    H --> J([Captain Can Log In\nAvailable for Assignments])
    I --> K([Applicant Can Re-apply])
```

---

## 5. Booking Creation Flow

```mermaid
flowchart TD
    A([Logged-in Customer]) --> B[Open Booking Form]
    B --> C[Select Pickup Location\nState → District → Village → Point]
    C --> D[Select Drop Location\nState → District → Village → Point]
    D --> E[Enter Parcel Details\nWeight, Type, Delivery Priority]
    E --> F[System Calculates Price\nDistance + Weight Slab + Priority Surcharge]
    F --> G[Show Price Preview\n+ Estimated Delivery Date]
    G --> H{Customer Confirms?}
    H -->|No| B
    H -->|Yes| I[Payment Screen]
    I --> J{Payment Method}
    J -->|UPI / Card / NetBanking| K[Payment Gateway - Razorpay]
    J -->|Cash on Delivery| L[COD Selected]
    K --> M{Payment Result}
    M -->|Success| N[Booking Confirmed\nStatus: PAID]
    M -->|Failure| O[Show Error\nRetry Option]
    O --> I
    L --> N
    N --> P[Booking Auto-Routed\nto Point Manager Dashboard]
```

---

## 6. Auto Booking Routing Logic

```mermaid
flowchart TD
    A[New Booking Created\nPickup Location Selected] --> B[System Queries\nuser_roles Table]
    B --> C{Is there a POINT_MANAGER\nassigned to this location?}
    C -->|Yes| D[Booking assigned to\nthat Point Manager]
    C -->|No| E[Booking flagged as\nUNASSIGNED]
    E --> F[Admin Notified\nManual Assignment Required]
    D --> G[Booking appears in\nPoint Manager Dashboard]
    G --> H[Point Manager Notified]
```

---

## 7. Captain Assignment Flow

```mermaid
flowchart TD
    A([Point Manager / Admin\n/ Super Admin]) --> B[Opens Booking in Dashboard]
    B --> C[System Loads Available Captains\nFiltered by Same District]
    C --> D{Captains Available?}
    D -->|No| E[Show No Captains Available\nAdmin Notified]
    D -->|Yes| F[Show Captain List\nName, Vehicle Type, Current Load]
    F --> G[Select Captain]
    G --> H[Booking Status → ASSIGNED\nCaptain Linked to Booking]
    H --> I[Captain Receives Notification]
    I --> J[Captain Accepts]
    J --> K[Pickup → Transit → Delivery\nStatus Updated at Each Stage]
```

---

## 8. Payment Flow

```mermaid
flowchart TD
    A[Customer Confirms Booking] --> B[Payment Initiated\nStatus: PENDING]
    B --> C{Payment Method}
    C -->|UPI/Card/Net Banking| D[Razorpay Gateway]
    C -->|Cash on Delivery| E[COD Booking Confirmed\nStatus: COD]
    D --> F{Transaction Result}
    F -->|Success| G[Status: PAID\nGateway Ref Stored\npaidAt Recorded]
    F -->|Failure| H[Status: FAILED\nCustomer Prompted to Retry]
    H --> B
    G --> I[Booking Routed to\nPoint Manager]
    E --> I

    subgraph Cancellation & Refund
        J[Customer Cancels Booking] --> K{Pickup Happened?}
        K -->|No| L[Full Refund Initiated\nStatus: REFUNDED]
        K -->|Yes| M[No Refund\nAdmin Configurable]
    end
```

---

## 9. Permission Checking Middleware Flow

```mermaid
flowchart TD
    A[Incoming API Request] --> B[Extract JWT Token]
    B --> C{Token Valid?}
    C -->|No| D[Return 401 Unauthorized]
    C -->|Yes| E[Load User ID from Token]
    E --> F{Permissions in Cache?}
    F -->|Yes| G[Load from Cache]
    F -->|No| H[Query user_roles Table]
    H --> I[Query role_permissions Table]
    I --> J[Store in Cache\nTTL: 15 min]
    J --> G
    G --> K{Required Permission\nExists?}
    K -->|No| L[Return 403 Forbidden\nLog to audit_logs: DENIED]
    K -->|Yes| M{Scope Check\nGLOBAL / DISTRICT\n/ LOCATION?}
    M -->|Fails scope| L
    M -->|Passes scope| N[Log to audit_logs: GRANTED]
    N --> O[Proceed to API Endpoint]
```

---

## 10. Profile Edit Flow (All Users)

```mermaid
flowchart TD
    A([Logged-in User]) --> B[Opens Profile Page]
    B --> C[Edits Allowed Fields\nName, Phone, Email, Photo, Password]
    C --> D{Who is the user?}
    D -->|Captain| E[Can also update\nVehicle Type, Vehicle Number\nAvailability Status]
    D -->|Point Manager| F[Can also update\nShop Photo\nShop Name]
    D -->|Customer / Admin| G[Standard fields only]
    E --> H[Submit Changes]
    F --> H
    G --> H
    H --> I{Password Change?}
    I -->|Yes| J[Verify Current Password\nFirst]
    J --> K{Correct?}
    K -->|No| L[Show Error]
    K -->|Yes| M[Save New Password\nHashed]
    I -->|No| N[Save Profile Updates]
    M --> N
    N --> O([Profile Updated Successfully])

    subgraph Super Admin Override
        P([Super Admin]) --> Q[Can edit ANY user's\nprofile without restriction]
        Q --> R[Changes saved directly\nLogged to audit_logs]
    end
```

---

## 12. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    locations {
        UUID id PK
        VARCHAR state
        VARCHAR district
        VARCHAR mandal
        VARCHAR village
        VARCHAR pointName
        VARCHAR pincode
        DECIMAL latitude
        DECIMAL longitude
        ENUM locationType
        BOOLEAN isActive
    }

    users {
        UUID id PK
        VARCHAR name
        VARCHAR email
        VARCHAR phone
        VARCHAR password
        ENUM approvalStatus
        BOOLEAN isActive
    }

    roles {
        UUID id PK
        VARCHAR name
        TEXT description
        INT level
        BOOLEAN isActive
    }

    permissions {
        UUID id PK
        VARCHAR name
        VARCHAR resource
        VARCHAR action
        TEXT description
    }

    role_permissions {
        UUID id PK
        UUID roleId FK
        UUID permissionId FK
        ENUM scope
    }

    user_roles {
        UUID id PK
        UUID userId FK
        UUID roleId FK
        BOOLEAN isPrimary
        UUID assignedLocationId FK
    }

    point_manager_profiles {
        UUID id PK
        UUID userId FK
        VARCHAR shopName
        UUID shopLocationId FK
        VARCHAR shopPhoto
    }

    captain_profiles {
        UUID id PK
        UUID userId FK
        VARCHAR aadhaarNumber
        VARCHAR aadhaarPhoto
        VARCHAR drivingLicense
        VARCHAR licensePhoto
        ENUM vehicleType
        VARCHAR vehicleNumber
        VARCHAR districtId
    }

    bookings {
        UUID id PK
        UUID customerId FK
        UUID pickupLocationId FK
        UUID dropLocationId FK
        UUID assignedPointManagerId FK
        UUID assignedCaptainId FK
        DECIMAL parcelWeight
        ENUM parcelType
        ENUM deliveryPriority
        ENUM status
        DECIMAL calculatedPrice
        DATE estimatedDeliveryDate
        ENUM paymentStatus
        ENUM paymentMethod
        VARCHAR paymentGatewayRef
        TIMESTAMP paidAt
    }

    pricing_rules {
        UUID id PK
        UUID sourceLocationId FK
        UUID destinationLocationId FK
        DECIMAL minWeight
        DECIMAL maxWeight
        DECIMAL basePrice
        DECIMAL pricePerKm
        INT estimatedDeliveryDays
    }

    audit_logs {
        UUID id PK
        UUID userId FK
        VARCHAR action
        VARCHAR resource
        ENUM result
        VARCHAR ipAddress
        TIMESTAMP timestamp
    }

    users ||--o{ user_roles : "has"
    roles ||--o{ user_roles : "assigned via"
    locations ||--o{ user_roles : "scoped to"

    roles ||--o{ role_permissions : "has"
    permissions ||--o{ role_permissions : "belongs to"

    users ||--o| point_manager_profiles : "has profile"
    users ||--o| captain_profiles : "has profile"
    locations ||--o| point_manager_profiles : "assigned to"

    users ||--o{ bookings : "places (customer)"
    users ||--o{ bookings : "manages (point manager)"
    users ||--o{ bookings : "delivers (captain)"
    locations ||--o{ bookings : "pickup at"
    locations ||--o{ bookings : "drops at"

    locations ||--o{ pricing_rules : "source"
    locations ||--o{ pricing_rules : "destination"

    users ||--o{ audit_logs : "logged for"
```

---

## 11. Role & Permission Management Flow

```mermaid
flowchart TD
    A([Super Admin / Admin]) --> B{Action}
    B -->|Create Role| C[Define Role Name\nDescription, Level]
    B -->|Assign Permission to Role| D[Select Role\nSelect Permission\nSet Scope]
    B -->|Assign Role to User| E[Select User\nSelect Role\nSet as Primary?\nAssign Location?]
    B -->|Revoke Role| F[Remove role from\nuser_roles table]
    C --> G[Role Created in DB]
    D --> H[role_permissions row created]
    E --> I[user_roles row created]
    F --> J[user_roles row deleted]
    G --> K[Permission Cache Invalidated]
    H --> K
    I --> K
    J --> K
    K --> L[All affected users reload\npermissions on next request]
    L --> M[Changes logged\nto audit_logs]
```
