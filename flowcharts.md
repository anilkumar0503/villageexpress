# Courier Management System — Flowcharts

> Rendered with Mermaid. Use VS Code extension "Markdown Preview Mermaid Support" or open in any Mermaid-compatible viewer.

---

## 1. Full Operational Flow (System Overview)

```mermaid
flowchart TD
    A([Customer]) --> B[Creates Booking\nSelects Pickup & Drop Location]
    B --> C{Payment}
    C -->|Success| D[Booking Confirmed\nStatus: CONFIRMED]
    C -->|Failure| E[Booking Held\nStatus: PAYMENT_FAILED\nRetry Prompted]
    D --> F[System Auto-Identifies\nPickup Location's Point Manager]
    F --> G[Booking Status: RECEIVED_AT_POINT]
    G --> H[Booking Appears in\nPoint Manager Dashboard]
    H --> I[Point Manager Assigns Captain]
    I --> J[Booking Status: ASSIGNED\nCaptain Notified]
    J --> K[Captain Picks Up Parcel\nStatus: PICKED_UP]
    K --> L[In Transit\nStatus: IN_TRANSIT]
    L --> M[Out for Delivery\nStatus: OUT_FOR_DELIVERY]
    M --> N[Delivered\nStatus: DELIVERED]
    N --> O([Customer Notified\nBooking Closed])

    subgraph COD Flow
        P[COD Booking] --> Q[Captain Delivers]
        Q --> R[Point Manager Collects COD]
        R --> S[COD Recorded\nAmount Credited to System]
    end
```

---

## 2. Customer Registration & Login Flow

```mermaid
flowchart TD
    A([User visits platform]) --> B{Has account?}
    B -->|No| C[Click Register]
    B -->|Yes| D[Click Login]
    C --> E[Enter Name, Phone, Email, Password]
    D --> F[Enter Phone/Email and Password]
    E --> G[Submit Registration]
    G --> H[Account Created\nCUSTOMER Role Assigned\nStatus: APPROVED]
    H --> I([Customer Dashboard])
    F --> J{Credentials Valid?}
    J -->|No| K[Show Error\nForgot Password Option]
    K --> F
    J -->|Yes| L[JWT Token Generated]
    L --> M[Session Established]
    M --> I

    subgraph Password Reset
        N[User clicks Forgot Password] --> O[Enter Email/Phone]
        O --> P[Reset Link Sent via Email]
        P --> Q[User Clicks Reset Link]
        Q --> R[Enter New Password]
        R --> S[Password Updated\nCan Login with New Password]
    end
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
    J -->|Wallet| K[Check Wallet Balance]
    J -->|UPI / Card / NetBanking| L[Payment Gateway - Razorpay]
    J -->|Cash on Delivery| M[COD Selected]
    K --> N{Sufficient Balance?}
    N -->|No| O[Show Insufficient Balance\nPrompt Other Methods]
    N -->|Yes| P[Wallet Debit Deferred\nUntil Captain Assignment]
    L --> Q{Transaction Result}
    Q -->|Success| R[Booking Confirmed\nStatus: CONFIRMED\npaidAt Recorded]
    Q -->|Failure| S[Show Error\nRetry Option]
    S --> I
    M --> R
    P --> R
    R --> T[Booking Status: RECEIVED_AT_POINT\nAuto-Routed to Point Manager]
    O --> I
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
    C -->|Wallet| D[Check Wallet Balance]
    C -->|UPI/Card/Net Banking| E[Razorpay Gateway]
    C -->|Cash on Delivery| F[COD Booking Confirmed\nStatus: CONFIRMED\npaymentStatus: PENDING_PAYMENT]
    D --> G{Sufficient Balance?}
    G -->|No| H[Show Insufficient Balance\nPrompt Other Methods]
    G -->|Yes| I[Wallet Debit Deferred\nStatus: CONFIRMED\npaymentStatus: PENDING_PAYMENT]
    E --> J{Transaction Result}
    J -->|Success| K[Status: CONFIRMED\npaymentStatus: PAID\nGateway Ref Stored\npaidAt Recorded]
    J -->|Failure| L[Status: PAYMENT_FAILED\nCustomer Prompted to Retry]
    L --> B
    I --> M[Booking Routed to\nPoint Manager]
    K --> M
    F --> M

    subgraph Wallet Debit on Assignment
        N[Captain Assigned] --> O[Debit Wallet\nCreate Transaction]
        O --> P[Wallet Balance Updated]
    end

    subgraph COD Collection
        Q[Booking Delivered] --> R[Point Manager Collects COD]
        R --> S[COD Collection Recorded]
        S --> T[Amount Credited to System]
    end

    subgraph Cancellation & Refund
        U[Customer Cancels Booking] --> V{Pickup Happened?}
        V -->|No| W[Full Refund Initiated\nWallet Credited\nStatus: CANCELLED]
        V -->|Yes| X[No Refund\nAdmin Configurable\nStatus: CANCELLED]
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
        VARCHAR displayId
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
        ENUM aadhaarVerificationStatus
        VARCHAR aadhaarRejectionReason
        VARCHAR drivingLicense
        VARCHAR licensePhoto
        ENUM licenseVerificationStatus
        VARCHAR licenseRejectionReason
        ENUM vehicleType
        VARCHAR vehicleNumber
        VARCHAR districtId
        ENUM availabilityStatus
        ENUM onboardingStatus
    }

    captain_point_assignments {
        UUID id PK
        UUID captainId FK
        UUID locationId FK
        BOOLEAN isActive
    }

    bookings {
        UUID id PK
        VARCHAR bookingNumber
        UUID customerId FK
        UUID pickupLocationId FK
        UUID dropLocationId FK
        UUID routeId FK
        UUID assignedPointManagerId FK
        UUID assignedCaptainId FK
        DECIMAL parcelWeight
        ENUM parcelType
        INT numberOfBags
        ENUM deliveryPriority
        ENUM vehicleType
        ENUM status
        DECIMAL calculatedPrice
        DECIMAL paidAmount
        DATE estimatedDeliveryDate
        DATE scheduledDeliveryDate
        VARCHAR deliveryTimeSlot
        ENUM paymentStatus
        ENUM paymentMethod
        VARCHAR paymentGatewayRef
        TIMESTAMP paidAt
        VARCHAR cancelReason
        VARCHAR refundId
        VARCHAR codCollectedBy
        TIMESTAMP codCollectedAt
        VARCHAR codCollectedAtLocation
        VARCHAR receiverName
        VARCHAR receiverPhone
        VARCHAR deliveryOtp
        TIMESTAMP deliveryOtpExpiresAt
        VARCHAR pickupValidationImage
        VARCHAR dropValidationImage
        VARCHAR deliveryProof
        VARCHAR deliverySignature
    }

    booking_segments {
        UUID id PK
        UUID bookingId FK
        UUID routeSegmentId FK
        INT sequenceOrder
        ENUM status
        UUID assignedPointManagerId FK
        UUID assignedCaptainId FK
        ENUM vehicleType
        TIMESTAMP handedOffAt
        TIMESTAMP deliveredAt
        VARCHAR codCollectedBy
        TIMESTAMP codCollectedAt
        VARCHAR codCollectedAtLocation
    }

    routes {
        UUID id PK
        VARCHAR name
        UUID sourceLocationId FK
        UUID destinationLocationId FK
        BOOLEAN isActive
        INT estimatedDays
    }

    route_segments {
        UUID id PK
        UUID routeId FK
        INT sequenceOrder
        UUID fromLocationId FK
        UUID toLocationId FK
        DECIMAL distanceKm
        INT estimatedHours
    }

    route_pricing_rules {
        UUID id PK
        UUID routeId FK
        ENUM vehicleType
        DECIMAL minWeight
        DECIMAL maxWeight
        DECIMAL basePrice
        DECIMAL pricePerKm
        DECIMAL weightSurcharge
        ENUM priority
        BOOLEAN isActive
    }

    route_commission_rules {
        UUID id PK
        UUID routeSegmentId FK
        ENUM vehicleType
        DECIMAL captainCommissionPct
        DECIMAL pmCommissionPct
        BOOLEAN isActive
    }

    global_commission_rules {
        UUID id PK
        ENUM vehicleType
        DECIMAL captainCommissionPct
        DECIMAL pmCommissionPct
        BOOLEAN isActive
    }

    commission_ledger {
        UUID id PK
        UUID userId FK
        UUID bookingSegmentId FK
        ENUM role
        DECIMAL amount
        ENUM status
        TIMESTAMP paidAt
    }

    pricing_rules {
        UUID id PK
        UUID sourceLocationId FK
        UUID destinationLocationId FK
        ENUM vehicleType
        ENUM deliveryPriority
        DECIMAL minWeight
        DECIMAL maxWeight
        DECIMAL basePrice
        DECIMAL pricePerKm
        DECIMAL weightTier1Limit
        DECIMAL weightTier1Surcharge
        DECIMAL weightTier2Limit
        DECIMAL weightTier2Surcharge
        DECIMAL weightTier3Surcharge
        DECIMAL weightSurcharge
        INT estimatedDeliveryDays
    }

    vehicle_configurations {
        UUID id PK
        ENUM vehicleType
        VARCHAR displayName
        VARCHAR description
        DECIMAL defaultWeight
        DECIMAL maxWeight
        VARCHAR icon
        BOOLEAN isActive
        INT sortOrder
    }

    distance_pricing_tiers {
        UUID id PK
        UUID vehicleConfigId FK
        DECIMAL minDistance
        DECIMAL maxDistance
        DECIMAL pricePerKm
        INT sortOrder
        BOOLEAN isActive
    }

    wallets {
        UUID id PK
        UUID userId FK
        DECIMAL balance
        BOOLEAN isActive
    }

    wallet_transactions {
        UUID id PK
        UUID walletId FK
        UUID userId FK
        ENUM type
        DECIMAL amount
        DECIMAL balanceBefore
        DECIMAL balanceAfter
        VARCHAR description
        VARCHAR referenceId
        VARCHAR referenceType
        JSON metadata
    }

    withdrawal_requests {
        UUID id PK
        UUID userId FK
        UUID walletId FK
        DECIMAL amount
        ENUM status
        UUID payoutDetailsId FK
        TIMESTAMP processedAt
        VARCHAR processedBy
        VARCHAR rejectionReason
        VARCHAR transactionId
        VARCHAR notes
    }

    payout_details {
        UUID id PK
        UUID userId FK
        ENUM type
        VARCHAR upiId
        VARCHAR bankName
        VARCHAR accountNumber
        VARCHAR ifscCode
        VARCHAR accountHolderName
        BOOLEAN isDefault
    }

    admin_payment_settings {
        UUID id PK
        VARCHAR bankName
        VARCHAR accountNumber
        VARCHAR ifscCode
        VARCHAR accountHolderName
        VARCHAR upiId
        VARCHAR qrCodeUrl
        BOOLEAN isActive
    }

    cod_collections {
        UUID id PK
        UUID userId FK
        UUID bookingId FK
        DECIMAL amount
        TIMESTAMP collectionDate
        VARCHAR collectedBy
        ENUM collectionMethod
        ENUM status
        VARCHAR notes
    }

    cod_remittances {
        UUID id PK
        UUID collectionId FK
        UUID userId FK
        DECIMAL amount
        ENUM remittanceMethod
        TIMESTAMP remittanceDate
        VARCHAR transactionId
        VARCHAR bankReferenceNumber
        ENUM status
        VARCHAR notes
    }

    coupons {
        UUID id PK
        VARCHAR code
        ENUM type
        ENUM discountType
        DECIMAL discountValue
        DECIMAL minOrderValue
        DECIMAL maxDiscountAmount
        INT usageLimit
        INT usageCount
        DATE validFrom
        DATE validUntil
        BOOLEAN isActive
        TEXT applicableUsers
        TEXT applicableRoutes
    }

    coupon_usage {
        UUID id PK
        UUID couponId FK
        UUID userId FK
        UUID bookingId FK
        DECIMAL discountAmount
    }

    referrals {
        UUID id PK
        UUID referrerId FK
        UUID refereeId FK
        DECIMAL bonusAmount
        BOOLEAN referrerEarned
        BOOLEAN refereeEarned
        TIMESTAMP completedAt
    }

    support_tickets {
        UUID id PK
        UUID userId FK
        VARCHAR subject
        TEXT description
        ENUM status
        ENUM priority
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }

    support_messages {
        UUID id PK
        UUID ticketId FK
        UUID userId FK
        TEXT message
        BOOLEAN isAdmin
        TIMESTAMP createdAt
    }

    contact_submissions {
        UUID id PK
        VARCHAR name
        VARCHAR email
        VARCHAR phone
        VARCHAR subject
        TEXT message
        ENUM status
        TIMESTAMP createdAt
    }

    testimonials {
        UUID id PK
        VARCHAR customerName
        VARCHAR customerLocation
        INT rating
        TEXT content
        BOOLEAN isApproved
        BOOLEAN isActive
    }

    blogs {
        UUID id PK
        VARCHAR title
        VARCHAR slug
        TEXT excerpt
        TEXT content
        VARCHAR coverImage
        VARCHAR author
        BOOLEAN isPublished
        TIMESTAMP publishedAt
        VARCHAR metaTitle
        TEXT metaDescription
        VARCHAR metaKeywords
        VARCHAR ogImage
        VARCHAR canonicalUrl
    }

    blog_categories {
        UUID id PK
        VARCHAR name
        VARCHAR slug
        TEXT description
        BOOLEAN isActive
    }

    blog_tags {
        UUID id PK
        VARCHAR name
        VARCHAR slug
        BOOLEAN isActive
    }

    blog_category_on_blog {
        UUID id PK
        UUID blogId FK
        UUID categoryId FK
    }

    blog_tag_on_blog {
        UUID id PK
        UUID blogId FK
        UUID tagId FK
    }

    notifications {
        UUID id PK
        UUID userId FK
        VARCHAR type
        VARCHAR title
        VARCHAR message
        BOOLEAN read
        UUID bookingId FK
    }

    ratings {
        UUID id PK
        UUID fromUserId FK
        UUID toUserId FK
        UUID bookingId FK
        INT rating
        TEXT comment
        TIMESTAMP createdAt
    }

    messages {
        UUID id PK
        UUID senderId FK
        UUID receiverId FK
        UUID bookingId FK
        TEXT content
        BOOLEAN isRead
        TIMESTAMP createdAt
    }

    user_fcm_tokens {
        UUID id PK
        UUID userId FK
        VARCHAR fcmToken
    }

    password_resets {
        UUID id PK
        UUID userId FK
        VARCHAR token
        TIMESTAMP expiresAt
        BOOLEAN used
    }

    otp_codes {
        UUID id PK
        VARCHAR email
        VARCHAR code
        TIMESTAMP expiresAt
        BOOLEAN used
    }

    favorite_locations {
        UUID id PK
        UUID userId FK
        UUID locationId FK
        VARCHAR alias
        TIMESTAMP createdAt
    }

    audit_logs {
        UUID id PK
        UUID userId FK
        VARCHAR action
        VARCHAR resource
        ENUM result
        VARCHAR ipAddress
        VARCHAR userAgent
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

    captain_profiles ||--o{ captain_point_assignments : "assigned to"
    locations ||--o{ captain_point_assignments : "at"

    users ||--o{ bookings : "places (customer)"
    users ||--o{ bookings : "manages (point manager)"
    users ||--o{ bookings : "delivers (captain)"
    locations ||--o{ bookings : "pickup at"
    locations ||--o{ bookings : "drops at"
    routes ||--o{ bookings : "on route"

    bookings ||--o{ booking_segments : "has"
    route_segments ||--o{ booking_segments : "for"

    locations ||--o{ route_segments : "from"
    locations ||--o{ route_segments : "to"
    routes ||--o{ route_segments : "contains"

    routes ||--o{ route_pricing_rules : "has"
    route_segments ||--o{ route_commission_rules : "has"

    booking_segments ||--o{ commission_ledger : "generates"
    users ||--o{ commission_ledger : "receives"

    vehicle_configurations ||--o{ distance_pricing_tiers : "has"

    users ||--o| wallets : "has"
    wallets ||--o{ wallet_transactions : "has"
    wallets ||--o{ withdrawal_requests : "for"

    users ||--o| payout_details : "has"
    payout_details ||--o{ withdrawal_requests : "used for"

    bookings ||--o| cod_collections : "generates"
    users ||--o{ cod_collections : "collects"
    cod_collections ||--o{ cod_remittances : "remitted as"
    users ||--o{ cod_remittances : "remits"

    coupons ||--o{ coupon_usage : "used in"
    users ||--o{ coupon_usage : "uses"
    bookings ||--o{ coupon_usage : "applied to"

    users ||--o{ referrals : "refers"
    users ||--o{ referrals : "referred by"

    users ||--o{ support_tickets : "creates"
    support_tickets ||--o{ support_messages : "has"

    users ||--o{ contact_submissions : "submits"

    users ||--o{ testimonials : "writes"

    blogs ||--o{ blog_category_on_blog : "categorized by"
    blog_categories ||--o{ blog_category_on_blog : "applies to"
    blogs ||--o{ blog_tag_on_blog : "tagged with"
    blog_tags ||--o{ blog_tag_on_blog : "applies to"

    users ||--o{ notifications : "receives"

    users ||--o{ ratings : "gives"
    users ||--o{ ratings : "receives"
    bookings ||--o{ ratings : "for"

    users ||--o{ messages : "sends"
    users ||--o{ messages : "receives"
    bookings ||--o{ messages : "about"

    users ||--o{ user_fcm_tokens : "has"
    users ||--o{ password_resets : "requests"

    users ||--o{ favorite_locations : "saves"
    locations ||--o{ favorite_locations : "saved as"

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

---

## 13. Wallet Management Flow

```mermaid
flowchart TD
    A([User]) --> B[Opens Wallet Section]
    B --> C[View Current Balance]
    C --> D[View Transaction History]
    D --> E{Transaction Type}
    E -->|Booking Payment| F[Wallet Debit\nType: BOOKING_PAYMENT]
    E -->|Refund| G[Wallet Credit\nType: REFUND]
    E -->|Referral Bonus| H[Wallet Credit\nType: REFERRAL_BONUS]
    E -->|Referral Earning| I[Wallet Credit\nType: REFERRAL_EARNING]
    E -->|Withdrawal| J[Request Withdrawal]
    J --> K[Enter Amount\nSelect Method: Bank/UPI]
    K --> L[Submit Withdrawal Request]
    L --> M[Status: PENDING]
    M --> N[Admin Reviews Request]
    N --> O{Decision}
    O -->|Approve| P[Amount Transferred\nStatus: COMPLETED]
    O -->|Reject| Q[Status: REJECTED\nReason Logged]
    P --> R[Wallet Balance Already Debited\nWhen Request Made]
    Q --> S[Amount Credited Back\nTo Wallet]
```

---

## 14. Referral System Flow

```mermaid
flowchart TD
    A([New User]) --> B[Registration Form]
    B --> C{Has Referral Code?}
    C -->|Yes| D[Enter Referral Code]
    C -->|No| E[Skip Referral]
    D --> F[Validate Referral Code\nCheck Existing Referrer]
    F --> G{Valid?}
    G -->|No| H[Show Invalid Code Error]
    G -->|Yes| I[Create Referral Record\nReferrer Linked]
    E --> J[Account Created]
    I --> J
    H --> B
    J --> K([User Dashboard])

    subgraph Referral Bonus Processing
        L[Referee Completes First Booking] --> M[Booking Status: DELIVERED]
        M --> N[Trigger Bonus Processing]
        N --> O[Credit Referrer Wallet\nType: REFERRAL_EARNING]
        O --> P[Credit Referee Wallet\nType: REFERRAL_BONUS]
        P --> Q[Mark Referral as Completed\nreferrerEarned: true\nrefereeEarned: true]
    end
```

---

## 15. Support Ticket Flow

```mermaid
flowchart TD
    A([User]) --> B[Create Support Ticket]
    B --> C[Enter Subject & Description]
    C --> D[Select Priority: Low/Medium/High]
    D --> E[Submit Ticket]
    E --> F[Ticket Created\nStatus: PENDING]
    F --> G[Admin Notified]
    G --> H[Admin Views Ticket]
    H --> I[Admin Responds\nMessage Added]
    I --> J[Status: IN_PROGRESS]
    J --> K{User Responds?}
    K -->|Yes| L[User Message Added]
    K -->|No| M[Admin Resolves Issue]
    L --> N[Admin Reviews Response]
    N --> M
    M --> O[Status: RESOLVED]
    O --> P[Ticket Closed]
    P --> Q([Ticket Archived])

    subgraph Re-opening
        R[User Reopens Ticket] --> S[Status: IN_PROGRESS]
        S --> H
    end
```

---

## 16. Commission Calculation Flow

```mermaid
flowchart TD
    A([Booking Delivered]) --> B[Calculate Commissions]
    B --> C{Check Route Commission Rules}
    C -->|Rule Exists| D[Apply Route-Specific Commission]
    C -->|No Rule| E[Check Global Commission Rules]
    E -->|Rule Exists| F[Apply Global Commission]
    E -->|No Rule| G[Use Default Commission\nCaptain: 10%, PM: 5%]
    D --> H[Calculate Captain Commission]
    F --> H
    G --> H
    H --> I[Calculate PM Commission]
    I --> J[Credit Captain Wallet\nType: COMMISSION_EARNING]
    J --> K[Credit PM Wallet\nType: COMMISSION_EARNING]
    K --> L[Commission Recorded\nin Booking]
    L --> M([Booking Complete])
```
