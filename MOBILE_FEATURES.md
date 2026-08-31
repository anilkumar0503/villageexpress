# Village Express - Mobile App Features Document

## React Native Development Checklist

This document provides a comprehensive feature breakdown for developing React Native mobile applications for Village Express, organized by user role with implementation checklists.

---

## Table of Contents
1. [Customer App Features](#customer-app-features)
2. [Captain App Features](#captain-app-features)
3. [Point Manager App Features](#point-manager-app-features)
4. [Shared Features](#shared-features)
5. [Technical Requirements](#technical-requirements)
6. [API Integration Checklist](#api-integration-checklist)

---

## Customer App Features

### 1. Authentication & Onboarding
- [ ] **User Registration**
  - [ ] Email/password registration form
  - [ ] Phone number verification (OTP)
  - [ ] Email verification
  - [ ] Terms & conditions acceptance
  - [ ] Privacy policy acceptance
  - [ ] Form validation (Zod schema matching backend)
  - [ ] Error handling and user feedback
  - [ ] Loading states during registration

- [ ] **User Login**
  - [ ] Email/password login form
  - [ ] Remember me functionality
  - [ ] Forgot password flow
  - [ ] Password reset with OTP
  - [ ] Session management (JWT tokens)
  - [ ] Auto-login with stored tokens
  - [ ] Login rate limiting handling
  - [ ] Biometric login option (fingerprint/face)

- [ ] **Social Login** (Optional)
  - [ ] Google OAuth integration
  - [ ] Facebook login integration
  - [ ] Account linking for existing users

- [ ] **Onboarding Flow**
  - [ ] Welcome screens carousel
  - [ ] Feature introduction
  - [ ] Location permission request
  - [ ] Notification permission request
  - [ ] Skip onboarding option

### 2. Profile Management
- [ ] **Profile Viewing**
  - [ ] Display user information (name, email, phone)
  - [ ] Display user ID/Display ID
  - [ ] Profile picture upload/display
  - [ ] Account status display
  - [ ] View account creation date

- [ ] **Profile Editing**
  - [ ] Update name
  - [ ] Update phone number (with OTP verification)
  - [ ] Update email (with verification)
  - [ ] Upload/Change profile picture
  - [ ] Change password
  - [ ] Form validation
  - [ ] Save with confirmation

- [ ] **Account Settings**
  - [ ] Notification preferences
  - [ ] Language selection
  - [ ] Theme selection (light/dark)
  - [ ] Delete account option
  - [ ] Logout functionality
  - [ ] Clear cache option

### 3. Location Management
- [ ] **Location Selection**
  - [ ] Current location detection (GPS)
  - [ ] Search locations by name
  - [ ] Filter by district/village
  - [ ] Display location details
  - [ ] Select pickup location
  - [ ] Select drop location
  - [ ] Location validation
  - [ ] Map view of locations

- [ ] **Favorite Locations**
  - [ ] Add location to favorites
  - [ ] View saved locations
  - [ ] Edit favorite locations
  - [ ] Delete favorite locations
  - [ ] Use favorite for quick booking
  - [ ] Set default pickup/drop locations

- [ ] **Location Permissions**
  - [ ] Request location permission
  - [ ] Handle permission denial
  - [ ] Background location for tracking
  - [ ] Location accuracy settings

### 4. Booking Management
- [ ] **Create New Booking**
  - [ ] Select pickup location
  - [ ] Select drop location
  - [ ] Enter parcel details
    - [ ] Weight input (kg)
    - [ ] Parcel type selection (Documents, General, Fragile, Perishable)
    - [ ] Parcel description
    - [ ] Parcel value (for insurance)
  - [ ] Select delivery priority
    - [ ] Standard (3-5 days)
    - [ ] Express (1-2 days)
    - [ ] Overnight (same day/next day)
  - [ ] Select vehicle type
    - [ ] Bike
    - [ ] Auto rickshaw
    - [ ] Mini van
    - [ ] Van
  - [ ] Price calculation preview
    - [ ] Distance calculation
    - [ ] Weight-based pricing
    - [ ] Priority surcharge
    - [ ] Total price display
  - [ ] Apply coupon code
    - [ ] Coupon input field
    - [ ] Coupon validation
    - [ ] Discount display
  - [ ] Select payment method
    - [ ] UPI
    - [ ] Credit/Debit Card
    - [ ] Net Banking
    - [ ] Cash on Delivery (COD)
    - [ ] Wallet balance
  - [ ] Recipient details
    - [ ] Recipient name
    - [ ] Recipient phone
    - [ ] Address details
  - [ ] Booking summary review
  - [ ] Confirm booking
  - [ ] Payment processing
  - [ ] Booking confirmation display
  - [ ] Generate booking number
  - [ ] Error handling for failed bookings

- [ ] **View My Bookings**
  - [ ] List all user bookings
  - [ ] Filter by status
    - [ ] Pending
    - [ ] Confirmed
    - [ ] In Transit
    - [ ] Delivered
    - [ ] Cancelled
  - [ ] Search bookings by number
  - [ ] Sort by date
  - [ ] Pagination/infinite scroll
  - [ ] Pull to refresh
  - [ ] Empty state handling

- [ ] **Booking Details**
  - [ ] View complete booking information
    - [ ] Booking number
    - [ ] Status with icon
    - [ ] Pickup location details
    - [ ] Drop location details
    - [ ] Parcel details
    - [ ] Recipient information
    - [ ] Price breakdown
    - [ ] Payment status
    - [ ] Estimated delivery date
    - [ ] Created timestamp
  - [ ] View tracking timeline
  - [ ] View assigned captain details
  - [ ] View point manager details
  - [ ] Call captain button
  - [ ] Call point manager button
  - [ ] Share tracking link
  - [ ] Download receipt/invoice

- [ ] **Real-time Tracking**
  - [ ] Live status updates
  - [ ] Map view of parcel location
  - [ ] Captain location tracking
  - [ ] ETA display
  - [ ] Status change notifications
  - [ ] Progress timeline
  - [ ] Offline mode support

- [ ] **Cancel Booking**
  - [ ] Cancel booking option
  - [ ] Cancellation reason selection
  - [ ] Cancellation confirmation
  - [ ] Refund calculation display
  - [ ] Refund processing status
  - [ ] Cancellation policy display

- [ ] **Modify Booking**
  - [ ] Edit delivery address (before pickup)
  - [ ] Change delivery priority (if allowed)
  - [ ] Add special instructions
  - [ ] Modification confirmation

### 5. Payment Management
- [ ] **Wallet System**
  - [ ] View wallet balance
  - [ ] View transaction history
    - [ ] Filter by type (credit/debit)
    - [ ] Filter by date range
    - [ ] Search transactions
    - [ ] Pagination
  - [ ] Add money to wallet
    - [ ] Amount input
    - [ ] Payment method selection
    - [ ] Payment processing
    - [ ] Success confirmation
  - [ ] Use wallet for bookings
  - [ ] Auto-deduct from wallet option
  - [ ] Wallet transaction details

- [ ] **Payment Processing**
  - [ ] Razorpay integration
  - [ ] UPI payment flow
  - [ ] Card payment flow
    - [ ] Card details input
    - [ ] Card validation
    - [ ] Save card option
  - [ ] Net banking flow
    - [ ] Bank selection
    - [ ] Bank redirection
  - [ ] Payment status tracking
  - [ ] Payment failure handling
  - [ ] Retry payment option
  - [ ] Payment success confirmation
  - [ ] Receipt generation

- [ ] **COD Management**
  - [ ] Select COD as payment method
  - [ ] COD amount display
  - [ ] COD terms display
  - [ ] Additional COD charges (if any)
  - [ ] COD payment tracking

- [ ] **Refund Management**
  - [ ] View refund status
  - [ ] Refund request for failed payments
  - [ ] Refund to original payment method
  - [ ] Refund to wallet option
  - [ ] Refund timeline display

### 6. Support System
- [ ] **Create Support Ticket**
  - [ ] Select ticket category
    - [ ] Payment issues
    - [ ] Booking issues
    - [ ] Delivery problems
    - [ ] Account issues
    - [ ] General inquiry
  - [ ] Select issue type
    - [ ] Delivery delay
    - [ ] Wrong delivery
    - [ ] Damaged parcel
    - [ ] Payment failure
    - [ ] Other
  - [ ] Subject line
  - [ ] Detailed description
  - [ ] Attach images/screenshots
  - [ ] Priority selection
  - [ ] Submit ticket
  - [ ] Ticket ID generation
  - [ ] Confirmation message

- [ ] **View Support Tickets**
  - [ ] List all support tickets
  - [ ] Filter by status
    - [ ] Open
    - [ ] In Progress
    - [ ] Resolved
    - [ ] Closed
  - [ ] Filter by category
  - [ ] Search tickets
  - [ ] Sort by date/priority
  - [ ] Ticket status indicators

- [ ] **Ticket Details & Communication**
  - [ ] View ticket details
  - [ ] View ticket messages/conversation
  - [ ] Send reply/message
  - [ ] Attach additional files
  - [ ] View agent responses
  - [ ] Real-time message updates
  - [ ] Ticket status updates
  - [ ] SLA information display

- [ ] **Ticket Resolution**
  - [ ] Close ticket option
  - [ ] Rate support experience
    - [ ] 1-5 star rating
    - [ ] Optional comments
  - [ ] Reopen closed ticket
  - [ ] View resolution summary

### 7. Notifications
- [ ] **Push Notifications**
  - [ ] Booking status updates
  - [ ] Payment confirmations
  - [ ] Delivery notifications
  - [ ] Promotional offers
  - [ ] Support ticket updates
  - [ ] System announcements
  - [ ] Notification permission handling
  - [ ] Notification preferences

- [ ] **In-App Notifications**
  - [ ] Notification center
  - [ ] Mark as read/unread
  - [ ] Delete notifications
  - [ ] Filter by type
  - [ ] Notification history
  - [ ] Deep linking to relevant screens

### 8. Additional Features
- [ ] **Referral System**
  - [ ] Generate referral code
  - [ ] Share referral code
  - [ ] Apply referral code
  - [ ] View referral earnings
  - [ ] Referral tracking

- [ ] **Offers & Promotions**
  - [ ] View available coupons
  - [ ] Apply coupons to bookings
  - [ ] View promotional banners
  - [ ] Special offers display

- [ ] **Help & FAQ**
  - [ ] FAQ section
  - [ ] Search FAQs
  - [ ] Category-wise FAQs
  - [ ] Contact support
  - [ ] Video tutorials (optional)

- [ ] **Rate & Review**
  - [ ] Rate delivery experience
  - [ ] Rate captain
  - [ ] Write review
  - [ ] View past reviews

---

## Captain App Features

### 1. Authentication & Onboarding
- [ ] **Captain Registration**
  - [ ] Personal information
    - [ ] Full name
    - [ ] Phone number
    - [ ] Email address
    - [ ] Date of birth
    - [ ] Gender
  - [ ] Address details
    - [ ] Current address
    - [ ] Permanent address
    - [ ] District selection
  - [ ] Vehicle information
    - [ ] Vehicle type (Bike/Auto/Van)
    - [ ] Vehicle number
    - [ ] Vehicle model
    - [ ] Vehicle year
  - [ ] Bank details
    - [ ] Bank name
    - [ ] Account number
    - [ ] IFSC code
    - [ ] Account holder name
  - [ ] Emergency contact
  - [ ] Terms & conditions
  - [ ] Form validation
  - [ ] Document upload preparation

- [ ] **KYC Verification**
  - [ ] Aadhaar card upload
    - [ ] Front side capture/upload
    - [ ] Back side capture/upload
    - [ ] Image preview
    - [ ] Image compression
    - [ ] Upload to server
  - [ ] Driving license upload
    - [ ] Front side capture/upload
    - [ ] Back side capture/upload
    - [ ] Image preview
    - [ ] Image compression
    - [ ] Upload to server
  - [ ] Vehicle RC book upload
    - [ ] Capture/upload
    - [ ] Image preview
    - [ ] Upload to server
  - [ ] Passport photo upload
  - [ ] KYC status tracking
    - [ ] Pending
    - [ ] Under review
    - [ ] Approved
    - [ ] Rejected with reasons
  - [ ] Re-submit KYC documents
  - [ ] KYC completion celebration

- [ ] **Captain Login**
  - [ ] Email/password login
  - [ ] Phone number login (OTP)
  - [ ] Remember me
  - [ ] Forgot password
  - [ ] Biometric login
  - [ ] Session management
  - [ ] Auto-login

- [ ] **Onboarding Flow**
  - [ ] Welcome screens
  - [ ] App features introduction
  - [ ] Permission requests
    - [ ] Location (always allow)
    - [ ] Camera (for delivery proof)
    - [ ] Storage (for documents)
    - [ ] Phone (for calls)
    - [ ] Notifications
  - [ ] Mandatory profile completion check
  - [ ] KYC reminder

### 2. Profile Management
- [ ] **Profile Dashboard**
  - [ ] Captain information display
    - [ ] Name and photo
    - [ ] Display ID
    - [ ] Phone number
    - [ ] Vehicle type and number
    - [ ] Current location
    - [ ] Rating display
    - [ ] Total deliveries
  - [ ] Account status
    - [ ] Active/Inactive
    - [ ] KYC status
    - [ ] Approval status
  - [ ] Quick actions
    - [ ] Go online/offline
    - [ ] View earnings
    - [ ] View bookings

- [ ] **Profile Editing**
  - [ ] Update personal information
  - [ ] Update vehicle details
  - [ ] Update bank details
  - [ ] Update emergency contact
  - [ ] Change profile photo
  - [ ] Change password
  - [ ] Form validation
  - [ ] Save confirmation

- [ ] **Vehicle Management**
  - [ ] Add vehicle details
  - [ ] Edit vehicle details
  - [ ] Add multiple vehicles
  - [ ] Set primary vehicle
  - [ ] Vehicle document expiry reminders
  - [ ] Upload updated documents

- [ ] **Availability Management**
  - [ ] Go online/offline toggle
  - [ ] Set working hours
    - [ ] Start time
    - [ ] End time
    - [ ] Working days
  - [ ] Set unavailability
    - [ ] Temporary unavailability
    - [ ] Reason for unavailability
    - [ ] Duration selection
  - [ ] Availability status display
  - [ ] Location-based availability

### 3. Booking Management
- [ ] **View Assigned Bookings**
  - [ ] List of assigned bookings
  - [ ] Filter by status
    - [ ] Assigned (new)
    - [ ] Picked up
    - [ ] In transit
    - [ ] Delivered
  - [ ] Sort by priority/time
  - [ ] Search by booking number
  - [ ] Pull to refresh
  - [ ] Real-time updates
  - [ ] Empty state handling
  - [ ] Booking count badges

- [ ] **Booking Details**
  - [ ] Complete booking information
    - [ ] Booking number
    - [ ] Current status
    - [ ] Pickup location
      - [ ] Address
      - [ ] Contact person
      - [ ] Phone number
      - [ ] Map view
      - [ ] Navigate button
    - [ ] Drop location
      - [ ] Address
      - [ ] Recipient name
      - [ ] Recipient phone
      - [ ] Map view
      - [ ] Navigate button
    - [ ] Parcel details
      - [ ] Type
      - [ ] Weight
      - [ ] Description
      - [ ] Special instructions
    - [ ] Payment information
      - [ ] COD amount (if applicable)
      - [ ] Payment method
    - [ ] Time information
      - [ ] Assigned time
      - [ ] Pickup deadline
      - [ ] Delivery deadline
  - [ ] Customer details
    - [ ] Name
    - [ ] Phone
    - [ ] Call button
  - [ ] Point manager details
    - [ ] Name
    - [ ] Phone
    - [ ] Location
    - [ ] Call button

- [ ] **Accept/Reject Bookings**
  - [ ] View new booking requests
  - [ ] Accept booking option
  - [ ] Reject booking option
  - [ ] Reject reason selection
  - [ ] Acceptance timeout handling
  - [ ] Auto-reject on timeout

- [ ] **Update Booking Status**
  - [ ] Mark as "Picked up"
    - [ ] Confirm pickup
    - [ ] Optional photo of parcel
    - [ ] Timestamp capture
    - [ ] GPS location verification
  - [ ] Mark as "In transit"
    - [ ] Start navigation
    - [ ] Real-time location sharing
    - [ ] ETA updates
  - [ ] Mark as "Out for delivery"
    - [ ] Arrived at destination
    - [ ] Notify recipient
  - [ ] Mark as "Delivered"
    - [ ] Delivery proof options
      - [ ] Photo capture
      - [ ] Signature capture
      - [ ] OTP verification
    - [ ] COD collection (if applicable)
      - [ ] Amount confirmation
      - [ ] Payment method
      - [ ] Digital receipt
    - [ ] Recipient confirmation
    - [ ] Final location capture
    - [ ] Complete delivery

- [ ] **Navigation Integration**
  - [ ] Open in Google Maps
  - [ ] Open in Apple Maps
  - [ ] In-app navigation (optional)
  - [ ] Route optimization
  - [ ] Multiple stops handling
  - [ ] Traffic updates
  - [ ] Alternative routes

- [ ] **Delivery Proof**
  - [ ] Photo capture
    - [ ] Camera integration
    - [ ] Photo preview
    - [ ] Retake option
    - [ ] Image compression
    - [ ] Upload to server
  - [ ] Signature capture
    - [ ] Digital signature pad
    - [ ] Clear signature
    - [ ] Save signature
  - [ ] OTP verification
    - [ ] Enter OTP
    - [ ] OTP validation
    - [ ] Resend OTP
  - [ ] Voice note (optional)
  - [ ] Additional notes

- [ ] **COD Collection**
  - [ ] View COD amount
  - [ ] Collect payment
    - [ ] Cash collection
    - [ ] UPI collection
    - [ ] QR code display
  - [ ] Record payment details
    - [ ] Payment method
    - [ ] Transaction ID
    - [ ] Amount received
  - [ ] Generate digital receipt
  - [ ] Send receipt to customer
  - [ ] Handover to point manager

### 4. Earnings & Financial Management
- [ ] **Earnings Dashboard**
  - [ ] Today's earnings
  - [ ] This week's earnings
  [ ] This month's earnings
  - [ ] Total earnings
  - [ ] Earnings chart/graph
  - [ ] Earnings breakdown
    - [ ] Delivery earnings
    - [ ] Bonus earnings
    - [ ] Referral earnings
  - [ ] Payment history
  - [ ] Pending payments
  - [ ] Commission details

- [ ] **Commission Tracking**
  - [ ] View commission rates
  - [ ] Commission per delivery
  - [ ] Commission history
  - [ ] Commission calculation details
  - [ ] Bonus commissions
  - [ ] Commission payout schedule

- [ ] **Withdrawal Management**
  - [ ] View available balance
  - [ ] Request withdrawal
    - [ ] Amount input
    - [ ] Select withdrawal method
      - [ ] Bank transfer
      - [ ] UPI transfer
    - [ ] Bank account selection
    - [ ] UPI ID input
    - [ ] Withdrawal confirmation
  - [ ] View withdrawal history
    - [ ] Status tracking
      - [ ] Pending
      - [ ] Processing
      - [ ] Completed
      - [ ] Failed
    - [ ] Withdrawal details
    - [ ] Transaction ID
  - [ ] Minimum withdrawal limit
  - [ ] Withdrawal fees display
  - [ ] Processing time information

- [ ] **Payout Details**
  - [ ] Add payout details
    - [ ] Bank account details
    - [ ] UPI ID
  - [ ] Edit payout details
  - [ ] Set default payout method
  - [ ] Verify payout details

### 5. Location & Navigation
- [ ] **GPS Tracking**
  - [ ] Real-time location sharing
  - [ ] Location accuracy settings
  - [ ] Background location tracking
  - [ ] Location history
  - [ ] Battery optimization handling
  - [ ] Location permission management

- [ ] **Route Planning**
  - [ ] Optimize route for multiple deliveries
  - [ ] Estimate travel time
  - [ ] Distance calculation
  - [ ] Traffic consideration
  - [ ] Route alternatives

- [ ] **Geofencing**
  - [ ] Pickup location arrival detection
  - [ ] Drop location arrival detection
  - [ ] Point manager location detection
  - [ ] Automatic status updates

### 6. Support System
- [ ] **Create Support Ticket**
  - [ ] Select category
    - [ ] App issues
    - [ ] GPS problems
    - [ ] Payment issues
    - [ ] Booking disputes
    - [ ] Account issues
  - [ ] Select issue type
    - [ ] App crash
    - [ ] GPS not working
    - [ ] Payment not received
    - [ ] Wrong delivery
    - [ ] Commission dispute
  - [ ] Description
  - [ ] Attach screenshots
  - [ ] Priority selection
  - [ ] Submit ticket

- [ ] **View Support Tickets**
  - [ ] List tickets
  - [ ] Filter by status
  - [ ] Ticket details
  - [ ] Communication with support
  - [ ] Ticket resolution
  - [ ] Rate support

### 7. Notifications
- [ ] **Push Notifications**
  - [ ] New booking assignment
  - [ ] Booking reminders
  - [ ] Payment confirmations
  - [ ] Withdrawal status
  - [ ] Commission updates
  - [ ] System announcements
  - [ ] Emergency alerts

- [ ] **In-App Notifications**
  - [ ] Notification center
  - [ ] Categorize notifications
  - [ ] Mark as read
  - [ ] Delete notifications
  - [ ] Notification settings

### 8. Additional Features
- [ ] **Performance Metrics**
  - [ ] On-time delivery rate
  - [ ] Customer ratings
  - [ ] Total deliveries
  - [ ] Cancellation rate
  - [ ] Earnings trends

- [ ] **Training & Resources**
  - [ ] Training materials
  - [ ] Video tutorials
  - [ ] Safety guidelines
  - [ ] Best practices

- [ ] **Safety Features**
  - [ ] Emergency SOS button
  - [ ] Share trip status
  - [ ] Emergency contacts
  - [ ] Safety guidelines

- [ ] **Language Support**
  - [ ] Multi-language support
  - [ ] Language selection
  - [ ] Regional language support

---

## Point Manager App Features

### 1. Authentication & Onboarding
- [ ] **Point Manager Registration**
  - [ ] Personal information
    - [ ] Full name
    - [ ] Phone number
    - [ ] Email address
  - [ ] Shop/Point details
    - [ ] Shop name
    - [ ] Shop type
    - [ ] Address
    - [ ] District
    - [ ] Village/Area
    - [ ] Landmark
  - [ ] Business details
    - [ ] Business registration number
    - [ ] GST number (if applicable)
  - [ ] Bank details
    - [ ] Bank name
    - [ ] Account number
    - [ ] IFSC code
  - [ ] Emergency contact
  - [ ] Terms & conditions
  - [ ] Form validation

- [ ] **Point Manager Login**
  - [ ] Email/password login
  - [ ] Phone number login (OTP)
  - [ ] Remember me
  - [ ] Forgot password
  - [ ] Biometric login
  - [ ] Session management

- [ ] **Onboarding Flow**
  - [ ] Welcome screens
  - [ ] App features introduction
  - [ ] Permission requests
    - [ ] Location
    - [ ] Camera
    - [ ] Storage
    - [ ] Notifications
  - [ ] Shop location setup
  - [ ] Working hours configuration

### 2. Profile Management
- [ ] **Profile Dashboard**
  - [ ] Point manager information
    - [ ] Name and photo
    - [ ] Display ID
    - [ ] Phone number
    - [ ] Email
  - [ ] Shop/Point information
    - [ ] Shop name
    - [ ] Address
    - [ ] Location on map
    - [ ] Working hours
    - [ ] Contact number
  - [ ] Account status
  - [ ] Quick actions
    - [ ] View bookings
    - [ ] View earnings
    - [ ] Manage captains

- [ ] **Profile Editing**
  - [ ] Update personal information
  - [ ] Update shop details
  - [ ] Update working hours
  - [ ] Update bank details
  - [ ] Change profile photo
  - [ ] Change password
  - [ ] Form validation

- [ ] **Shop Management**
  - [ ] Edit shop details
  - [ ] Update shop location
  - [ ] Upload shop photos
  - [ ] Set working hours
    - [ ] Opening time
    - [ ] Closing time
    - [ ] Working days
    - [ ] Break hours
  - [ ] Shop status (open/closed)
  - [ ] Holiday management

### 3. Booking Management
- [ ] **View Location Bookings**
  - [ ] List of bookings for assigned location
  - [ ] Filter by status
    - [ ] Pending
    - [ ] Confirmed
    - [ ] Received at point
    - [ ] Assigned to captain
    - [ ] Picked up
    - [ ] In transit
    - [ ] Delivered
  - [ ] Filter by date range
  - [ ] Search by booking number
  - [ ] Sort by time/priority
  - [ ] Pull to refresh
  - [ ] Real-time updates
  [ ] Booking statistics
    - [ ] Total bookings
    - [ ] Pending bookings
    - [ ] Completed bookings
    [ ] Today's bookings

- [ ] **Booking Details**
  - [ ] Complete booking information
    - [ ] Booking number
    - [ ] Current status
    - [ ] Customer details
      - [ ] Name
      - [ ] Phone
      [ ] Call button
    - [ ] Pickup location
      - [ ] Address
      - [ ] Contact
      [ ] Map view
    - [ ] Drop location
      - [ ] Address
      [ ] Recipient details
      [ ] Map view
    - [ ] Parcel details
    - [ ] Payment information
      - [ ] Amount
      [ ] Payment method
      [ ] COD amount
    - [ ] Route information
      [ ] Segments
      [ ] Transit points
    - [ ] Timeline
      [ ] Created at
      [ ] Confirmed at
      [ ] Current status time

- [ ] **Receive Parcels**
  - [ ] View incoming parcels
  - [ ] Confirm parcel receipt
    - [ ] Verify booking number
    - [ ] Check parcel condition
    - [ ] Count items
    - [ ] Photo of parcel (optional)
  - [ ] Update status to "Received at point"
  - [ ] Generate receipt
  - [ ] Notify customer

- [ ] **Assign Captains**
  - [ ] View available captains
    - [ ] Captain list
    [ ] Captain status (online/offline)
    [ ] Captain rating
    [ ] Current location
    [ ] Vehicle type
  - [ ] Filter captains by
    - [ ] Vehicle type
    [ ] Distance
    [ ] Rating
  - [ ] Select captain for booking
  - [ ] Assign captain
  - [ ] Send notification to captain
  - [ ] Assignment confirmation
  - [ ] Reassign captain option
  - [ ] Bulk assignment (multiple bookings)

- [ ] **Manage Parcel Handoffs**
  - [ ] View parcels for handoff
  - [ ] Confirm handoff from captain
    - [ ] Verify captain identity
    [ ] Check parcel condition
    [ ] Count items
    [ ] Update status
  - [ ] Prepare parcel for next segment
  - [ ] Assign to next captain
  - [ ] Handoff confirmation
  - [ ] Generate handoff receipt

- [ ] **Update Booking Status**
  - [ ] Update status manually
  - [ ] Add status notes
  - [ ] Status change notifications
  - [ ] Status history view

### 4. Captain Management
- [ ] **View Captains**
  - [ ] List of captains in area
  - [ ] Captain details
    - [ ] Name
    - [ ] Phone
    [ ] Vehicle type
    [ ] Rating
    [ ] Status
    [ ] Current location
  - [ ] Filter by status
  - [ ] Search captains
  - [ ] Call captain
  [ ] View captain profile

- [ ] **Captain Availability**
  - [ ] View online/offline status
  - [ ] View working hours
  - [ ] View current assignments
  - [ ] View performance metrics

- [ ] **Captain Performance**
  - [ ] View delivery statistics
  - [ ] View ratings
  - [ ] View on-time rate
  - [ ] View total deliveries
  - [ ] View earnings

### 5. COD Management
- [ ] **COD Collection**
  - [ ] View parcels with COD
  - [ ] COD amount display
  - [ ] Collect from customer
    - [ ] Cash collection
    [ ] UPI collection
    [ ] QR code
  - [ ] Record collection
    - [ ] Amount
    [ ] Payment method
    [ ] Transaction ID
  - [ ] Generate receipt
  - [ ] Update booking status

- [ ] **COD Remittance**
  - [ ] View collected COD amounts
  - [ ] Total COD balance
  - [ ] Initiate remittance
    - [ ] Amount to remit
    [ ] Select remittance method
      [ ] Bank transfer
      [ ] UPI transfer
      [ ] Razorpay payout
    [ ] Confirm remittance
  - [ ] Remittance history
    - [ ] Status tracking
    [ ] Transaction details
    [ ] Receipts
  - [ ] Auto-debit configuration
  - [ ] Remittance schedule

- [ ] **COD Reports**
  - [ ] Daily COD collection
  - [ ] Weekly COD summary
  - [ ] Monthly COD report
  - [ ] Pending COD amounts
  - [ ] Remittance status
  - [ ] Export reports

### 6. Commission & Earnings
- [ ] **Commission Dashboard**
  - [ ] Today's commission
  - [ ] This week's commission
  - [ ] This month's commission
  - [ ] Total commission
  - [ ] Commission breakdown
    - [ ] Per booking commission
    [ ] Bonus commission
    [ ] Referral commission
  - [ ] Commission history
  - [ ] Pending commission
  - [ ] Payout status

- [ ] **Commission Tracking**
  - [ ] View commission rates
  - [ ] Commission per booking
  - [ ] Commission calculation details
  - [ ] Commission rules
  - [ ] Bonus opportunities

- [ ] **Payout Management**
  - [ ] View available balance
  - [ ] Request payout
    - [ ] Amount input
    [ ] Payout method
    [ ] Bank account
  - [ ] Payout history
    - [ ] Status tracking
    [ ] Transaction details
  - [ ] Payout schedule
  - [ ] Minimum payout limit

- [ ] **Payout Details**
  - [ ] Add bank details
  - [ ] Add UPI details
  - [ ] Edit payout details
  - [ ] Set default method
  - [ ] Verify details

### 7. Reports & Analytics
- [ ] **Dashboard Analytics**
  - [ ] Booking statistics
    - [ ] Total bookings
    [ ] Today's bookings
    [ ] Weekly trend
    [ ] Monthly trend
  - [ ] Revenue statistics
    - [ ] Total revenue
    [ ] COD collected
    [ ] Commission earned
  - [ ] Performance metrics
    [ ] On-time delivery rate
    [ ] Customer satisfaction
    [ ] Captain performance

- [ ] **Booking Reports**
  - [ ] Daily booking report
  - [ ] Weekly booking report
  - [ ] Monthly booking report
  - [ ] Custom date range
  - [ ] Export to PDF/Excel
  - [ ] Filter by status
  - [ ] Filter by route

- [ ] **Financial Reports**
  - [ ] Revenue reports
  - [ ] COD reports
  - [ ] Commission reports
  - [ ] Payout reports
  - [ ] Expense tracking (optional)

- [ ] **Captain Reports**
  - [ ] Captain performance
  - [ ] Delivery statistics
  [ ] Availability reports
  [ ] Earnings reports

### 8. Support System
- [ ] **Create Support Ticket**
  - [ ] Select category
    - [ ] App issues
    [ ] Payment issues
    [ ] Commission disputes
    [ ] COD issues
    [ ] Account issues
  - [ ] Select issue type
  - [ ] Description
  - [ ] Attach files
  - [ ] Priority selection
  - [ ] Submit ticket

- [ ] **View Support Tickets**
  - [ ] List tickets
  - [ ] Filter by status
  - [ ] Ticket details
  - [ ] Communication
  - [ ] Resolution

### 9. Notifications
- [ ] **Push Notifications**
  - [ ] New booking alerts
  - [ ] Captain assignment updates
  - [ ] Payment confirmations
  - [ ] COD collection alerts
  - [ ] Commission updates
  - [ ] System announcements

- [ ] **In-App Notifications**
  - [ ] Notification center
  - [ ] Categorize notifications
  - [ ] Mark as read
  - [ ] Delete notifications

### 10. Additional Features
- [ ] **Working Hours Management**
  - [ ] Set shop working hours
  - [ ] Set break hours
  - [ ] Holiday management
  - [ ] Special hours for holidays
  - [ ] Temporary closure

- [ ] **Location Management**
  - [ ] View assigned location
  - [ ] Update location details
  - [ ] View service area
  - [ ] Service area map

- [ ] **Inventory Management** (Optional)
  - [ ] Track parcels at point
  - [ ] Inward/outward register
  - [ ] Storage management
  - [ ] Parcel aging

- [ ] **Customer Communication**
  - [ ] Call customers
  - [ ] Send SMS notifications
  [ ] Email notifications (if enabled)

---

## Shared Features

### 1. Authentication & Security
- [ ] **JWT Token Management**
  - [ ] Access token storage
  - [ ] Refresh token handling
  - [ ] Auto token refresh
  - [ ] Token expiration handling
  - [ ] Logout on token invalid

- [ ] **Biometric Authentication**
  - [ ] Fingerprint authentication
  - [ ] Face authentication
  - [ ] Biometric setup
  - [ ] Biometric fallback

- [ ] **Security Features**
  - [ ] Session timeout
  - [ ] Auto logout
  - [ ] Secure storage
  - [ ] SSL pinning (optional)
  - [ ] Root detection (optional)

### 2. Network & Connectivity
- [ ] **Network Handling**
  - [ ] Online/offline detection
  - [ ] Network error handling
  - [ ] Retry mechanism
  - [ ] Offline data caching
  - [ ] Sync when online
  - [ ] Network status indicator

- [ ] **API Client**
  - [ ] Axios/Fetch setup
  - [ ] Request interceptors
  - [ ] Response interceptors
  - [ ] Error handling
  - [ ] Timeout handling
  - [ ] Request cancellation

### 3. State Management
- [ ] **Global State**
  - [ ] User authentication state
  - [ ] User profile state
  - [ ] Theme state
  - [ ] Language state
  - [ ] Network state

- [ ] **Local State**
  - [ ] Form states
  - [ ] UI states
  - [ ] Loading states
  - [ ] Error states

### 4. Storage
- [ ] **Local Storage**
  - [ ] AsyncStorage for tokens
  - [ ] SecureStorage for sensitive data
  - [ ] SQLite for offline data
  - [ ] Cache management
  - [ ] Storage cleanup

### 5. UI/UX Components
- [ ] **Common Components**
  - [ ] Buttons (primary, secondary, outline)
  - [ ] Input fields (text, email, phone, password)
  - [ ] Dropdowns/Select
  - [ ] Checkboxes/Radio buttons
  - [ ] Cards
  - [ ] Lists
  - [ ] Modals
  - [ ] Bottom sheets
  - [ ] Tabs
  - [ ] Badges
  - [ ] Avatars
  - [ ] Progress indicators
  - [ ] Skeleton loaders
  - [ ] Empty states
  - [ ] Error states

- [ ] **Navigation**
  - [ ] Stack navigation
  - [ ] Tab navigation
  - [ ] Drawer navigation
  - [ ] Deep linking
  [ ] Navigation animations

### 6. Theme & Styling
- [ ] **Theming**
  - [ ] Light theme
  - [ ] Dark theme
  - [ ] Theme switching
  - [ ] Custom colors
  - [ ] Typography
  - [ ] Spacing system
  - [ ] Component theming

### 7. Utilities
- [ ] **Helper Functions**
  - [ ] Date formatting
  - [ ] Currency formatting
  - [ ] Phone number formatting
  - [ ] Validation helpers
  - [ ] Error helpers
  - [ ] Logging utilities

### 8. Error Handling
- [ ] **Error Boundaries**
  - [ ] Global error handling
  - [ ] Error logging
  - [ ] User-friendly error messages
  - [ ] Error recovery options
  - [ ] Crash reporting

### 9. Performance
- [ ] **Optimization**
  - [ ] Image optimization
  - [ ] Lazy loading
  [ ] Code splitting
  [ ] Memory management
  [ ] Battery optimization

### 10. Testing
- [ ] **Unit Testing**
  - [ ] Component testing
  - [ ] Utility testing
  - [ ] Hook testing

- [ ] **Integration Testing**
  - [ ] API integration testing
  - [ ] Flow testing

- [ ] **E2E Testing**
  - [ ] Critical user flows
  [ ] Authentication flow
  [ ] Booking flow

---

## Technical Requirements

### 1. Development Environment
- [ ] **React Native Setup**
  - [ ] Node.js installation
  - [ ] React Native CLI or Expo
  - [ ] Android Studio setup
  - [ ] Xcode setup (for iOS)
  - [ ] Emulator/simulator setup
  - [ ] Physical device testing setup

- [ ] **Development Tools**
  - [ ] ESLint configuration
  - [ ] Prettier configuration
  [ ] TypeScript configuration
  [ ] Git setup
  [ ] Environment variables setup

### 2. Dependencies
- [ ] **Core Dependencies**
  - [ ] React
  - [ ] React Native
  - [ ] TypeScript
  - [ ] React Navigation
  - [ ] Zustand/Redux
  - [ ] Axios
  - [ ] Zod

- [ ] **UI Libraries**
  - [ ] React Native Paper or NativeBase
  - [ ] React Native Elements
  - [ ] Vector icons

- [ ] **Feature Libraries**
  - [ ] React Native Maps
  - [ ] React Native Firebase
  - [ ] Razorpay React Native
  - [ ] React Native QR Scanner
  - [ ] React Native Biometrics
  - [ ] React Native Camera
  [ ] React Native Image Picker
  [ ] React Native Signature Canvas

### 3. Build & Deployment
- [ ] **Android Build**
  - [ ] Generate signed APK
  - [ ] Generate signed AAB
  [ ] Play Store account setup
  [ ] Play Store listing
  [ ] Upload to Play Store

- [ ] **iOS Build**
  - [ ] Code signing setup
  [ ] Provisioning profiles
  [ ] App Store Connect setup
  [ ] App Store listing
  [ ] Upload to App Store

### 4. CI/CD
- [ ] **Continuous Integration**
  - [ ] GitHub Actions/Bitrise setup
  [ ] Automated testing
  [ ] Automated builds
  [ ] Code quality checks

- [ ] **Continuous Deployment**
  [ ] Automated deployment to stores
  [ ] Beta testing (TestFlight/Play Store Internal)
  [ ] Crash reporting integration

### 5. Monitoring & Analytics
- [ ] **Crash Reporting**
  - [ ] Sentry or Firebase Crashlytics
  [ ] Error tracking
  [ ] Performance monitoring

- [ ] **Analytics**
  - [ ] Firebase Analytics
  [ ] User behavior tracking
  [ ] Feature usage tracking
  [ ] Conversion tracking

---

## API Integration Checklist

### 1. Authentication APIs
- [ ] `POST /api/auth/login` - User login
- [ ] `POST /api/auth/logout` - User logout
- [ ] `POST /api/auth/refresh` - Refresh access token
- [ ] `GET /api/auth/me` - Get current user
- [ ] `POST /api/auth/otp/send` - Send OTP
- [ ] `POST /api/auth/otp/verify` - Verify OTP
- [ ] `POST /api/auth/password-reset/request` - Request password reset
- [ ] `POST /api/auth/password-reset/reset` - Reset password
- [ ] `GET /api/auth/permissions` - Get user permissions

### 2. User Management APIs
- [ ] `GET /api/users` - List users
- [ ] `GET /api/users/[id]` - Get user details
- [ ] `PUT /api/users/[id]` - Update user
- [ ] `POST /api/users/register/captain` - Register captain
- [ ] `POST /api/users/register/point-manager` - Register point manager
- [ ] `GET /api/users/[id]/roles` - Get user roles
- [ ] `POST /api/users/[id]/roles` - Assign roles

### 3. Booking APIs
- [ ] `GET /api/bookings` - List bookings
- [ ] `POST /api/bookings` - Create booking
- [ ] `GET /api/bookings/[id]` - Get booking details
- [ ] `PUT /api/bookings/[id]` - Update booking
- [ ] `DELETE /api/bookings/[id]` - Cancel booking
- [ ] `GET /api/bookings/my` - Get my bookings
- [ ] `GET /api/bookings/captain` - Get captain bookings
- [ ] `GET /api/bookings/point-manager` - Get point manager bookings
- [ ] `POST /api/bookings/price-preview` - Get price preview
- [ ] `POST /api/bookings/[id]/assign-captain` - Assign captain
- [ ] `POST /api/bookings/[id]/status` - Update status
- [ ] `POST /api/bookings/[id]/cancel` - Cancel booking
- [ ] `POST /api/bookings/[id]/process-payment` - Process payment
- [ ] `POST /api/bookings/[id]/wallet-payment` - Wallet payment
- [ ] `POST /api/bookings/[id]/upload-validation-image` - Upload delivery proof
- [ ] `POST /api/bookings/[id]/validate-delivery-otp` - Validate delivery OTP

### 4. Booking Segment APIs
- [ ] `GET /api/bookings/segments` - List segments
- [ ] `POST /api/bookings/segments` - Create segment
- [ ] `GET /api/bookings/segments/[id]` - Get segment details
- [ ] `GET /api/bookings/segments/my` - Get my segments
- [ ] `POST /api/bookings/segments/[id]/collect-cod` - Collect COD

### 5. Location APIs
- [ ] `GET /api/locations` - List locations
- [ ] `POST /api/locations` - Create location
- [ ] `GET /api/locations/[id]` - Get location details
- [ ] `PUT /api/locations/[id]` - Update location
- [ ] `DELETE /api/locations/[id]` - Delete location
- [ ] `GET /api/locations/cascading` - Get cascading locations

### 6. Captain APIs
- [ ] `GET /api/captains` - List captains
- [ ] `POST /api/captains` - Create captain
- [ ] `GET /api/captains/[id]` - Get captain details
- [ ] `PUT /api/captains/[id]` - Update captain
- [ ] `GET /api/captains/available` - Get available captains
- [ ] `POST /api/captains/[id]/kyc` - Submit KYC
- [ ] `GET /api/captains/[id]/points` - Get captain points

### 7. Wallet APIs
- [ ] `GET /api/wallet` - Get wallet details
- [ ] `POST /api/wallet/recharge` - Recharge wallet
- [ ] `POST /api/wallet/recharge/verify` - Verify recharge
- [ ] `GET /api/wallet/balance` - Get wallet balance
- [ ] `GET /api/wallet/my` - Get my wallet

### 8. Payment APIs
- [ ] `POST /api/payments/create-order` - Create payment order
- [ ] `POST /api/payments/initiate/[bookingId]` - Initiate payment
- [ ] `POST /api/payments/verify` - Verify payment
- [ ] `POST /api/payments/webhook` - Payment webhook
- [ ] `GET /api/payments/[bookingId]/status` - Get payment status
- [ ] `POST /api/payments/[bookingId]/refund` - Process refund

### 9. Commission APIs
- [ ] `GET /api/commissions/my` - Get my commissions
- [ ] `GET /api/commissions/admin` - Get all commissions (admin)
- [ ] `POST /api/commissions/payout` - Request payout
- [ ] `POST /api/commissions/[id]/approve` - Approve commission

### 10. Withdrawal APIs
- [ ] `POST /api/withdrawals` - Create withdrawal
- [ ] `GET /api/withdrawals/admin` - Get all withdrawals (admin)
- [ ] `POST /api/withdrawals/[id]/approve` - Approve withdrawal

### 11. COD APIs
- [ ] `GET /api/cod/collections` - Get COD collections
- [ ] `POST /api/cod/remittances` - Create remittance
- [ ] `GET /api/cod/remittances` - Get remittances
- [ ] `POST /api/cod/auto-debit` - Auto-debit COD
- [ ] `GET /api/cod/admin` - Get COD admin data
- [ ] `POST /api/cod-settlement` - COD settlement

### 12. Support APIs
- [ ] `GET /api/support-tickets` - List support tickets
- [ ] `POST /api/support-tickets` - Create support ticket
- [ ] `GET /api/support-tickets/[id]` - Get ticket details
- [ ] `PUT /api/support-tickets/[id]` - Update ticket
- [ ] `GET /api/support-tickets/[id]/messages` - Get ticket messages
- [ ] `POST /api/messages` - Send message

### 13. Profile APIs
- [ ] `GET /api/profile/me` - Get my profile
- [ ] `PUT /api/profile/me` - Update my profile
- [ ] `POST /api/profile/kyc/resubmit` - Resubmit KYC
- [ ] `POST /api/profile/availability` - Update availability
- [ ] `POST /api/profile/working-hours` - Update working hours
- [ ] `POST /api/profile/fcm-token` - Update FCM token
- [ ] `POST /api/profile/onboarding` - Complete onboarding

### 14. Notification APIs
- [ ] `GET /api/notifications` - Get notifications
- [ ] `POST /api/notifications` - Create notification
- [ ] `PUT /api/notifications/[id]` - Update notification

### 15. Rating APIs
- [ ] `POST /api/ratings` - Submit rating
- [ ] `GET /api/ratings` - Get ratings

### 16. Favorite Locations APIs
- [ ] `GET /api/favorite-locations` - Get favorite locations
- [ ] `POST /api/favorite-locations` - Create favorite location
- [ ] `DELETE /api/favorite-locations/[id]` - Delete favorite location

### 17. Coupon APIs
- [ ] `GET /api/coupons` - List coupons
- [ ] `POST /api/coupons/validate` - Validate coupon

### 18. Referral APIs
- [ ] `POST /api/referrals/apply` - Apply referral
- [ ] `POST /api/referrals/process-bonus` - Process referral bonus

### 19. Report APIs
- [ ] `GET /api/reports` - Get reports

### 20. Admin APIs (Admin App)
- [ ] `GET /api/admin/captains/[id]/reset-availability` - Reset captain availability
- [ ] `POST /api/admin/captains/reset-all-busy` - Reset all busy captains
- [ ] `GET /api/admin/cod-remittances` - Get COD remittances
- [ ] `POST /api/admin/payment-settings` - Update payment settings

---

## Development Priority Matrix

### Phase 1: MVP (Minimum Viable Product)
**Customer App:**
- Authentication
- Profile management
- Create booking
- View bookings
- Basic tracking
- Payment integration

**Captain App:**
- Authentication
- Profile management
- View assigned bookings
- Update booking status
- Basic navigation
- Earnings view

**Point Manager App:**
- Authentication
- Profile management
- View location bookings
- Assign captains
- Basic COD collection

### Phase 2: Core Features
**Customer App:**
- Real-time tracking
- Wallet system
- Support tickets
- Notifications
- Favorite locations

**Captain App:**
- KYC verification
- Delivery proof
- COD collection
- Withdrawals
- Performance metrics

**Point Manager App:**
- COD remittance
- Commission tracking
- Reports
- Captain management
- Working hours

### Phase 3: Advanced Features
**Customer App:**
- Referral system
- Offers & promotions
- Advanced support
- Multi-language

**Captain App:**
- Route optimization
- Safety features
- Training materials
- Advanced analytics

**Point Manager App:**
- Inventory management
- Advanced reports
- Customer communication
- Multi-location support

---

## Success Metrics

### Technical Metrics
- [ ] App crash rate < 1%
- [ ] API response time < 500ms
- [ ] App load time < 3 seconds
- [ ] Offline functionality for critical features
- [ ] Battery usage optimization

### User Experience Metrics
- [ ] User registration completion rate > 80%
- [ ] Booking completion rate > 90%
- [ ] Average time to create booking < 2 minutes
- [ ] User retention rate > 60% after 30 days
- [ ] App store rating > 4.0

### Business Metrics
- [ ] Daily active users
- [ ] Booking conversion rate
- [ ] Payment success rate > 95%
- [ ] Customer satisfaction score > 4.0
- [ ] Captain efficiency improvement

---

This document serves as a comprehensive checklist for developing the Village Express mobile applications. Each feature should be implemented, tested, and verified before marking as complete.