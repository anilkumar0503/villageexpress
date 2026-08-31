# Village Express Mobile Apps - Setup Guide

**Last Updated**: 2026-08-21
**Status**: Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅ | Phase 4 ✅ | Phase 5 ✅ | Phase 6 ✅ | Phase 7 ✅ Platform Features Built

---

## Table of Contents
1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Running the Apps](#running-the-apps)
5. [Development Progress](#development-progress)
6. [Pending Tasks](#pending-tasks)
7. [App-Specific Features](#app-specific-features)
8. [API Integration](#api-integration)
9. [Troubleshooting](#troubleshooting)

---

## Project Structure

```
village-express/
├── apps/
│   ├── web/                        # Next.js web application (existing backend)
│   ├── customer-app/               # React Native customer app
│   │   ├── src/
│   │   │   ├── App.tsx             # Root app with AsyncStorage token setup
│   │   │   ├── navigation/
│   │   │   │   └── AppNavigator.tsx
│   │   │   └── screens/
│   │   │       ├── auth/
│   │   │       ├── auth/
│   │   │       │   ├── LoginScreen.tsx           ✅ DONE
│   │   │       │   ├── RegisterScreen.tsx         ✅ DONE
│   │   │       │   ├── ForgotPasswordScreen.tsx   ✅ DONE  ← sends reset email
│   │   │       │   └── ResetPasswordScreen.tsx    ✅ DONE  ← token + new password entry
│   │   │       └── customer/
│   │   │           ├── HomeScreen.tsx                ✅ DONE  ← stats + wallet + bell
│   │   │           ├── BookingScreen.tsx              ✅ DONE  ← 4-step + coupon code
│   │   │           ├── MyBookingsScreen.tsx           ✅ DONE  ← live API + filters
│   │   │           ├── BookingDetailsScreen.tsx       ✅ DONE  ← timeline + Rate Captain + Cancel + Pay-with-Wallet + Live Map
│   │   │           ├── ProfileScreen.tsx              ✅ DONE  ← Security card: biometric toggle
│   │   │           ├── EditProfileScreen.tsx          ✅ DONE
│   │   │           ├── WalletScreen.tsx               ✅ DONE  ← balance + Razorpay recharge + filter
│   │   │           ├── FavoriteLocationsScreen.tsx    ✅ DONE  ← add/remove favorites
│   │   │           ├── NotificationsScreen.tsx        ✅ DONE  ← unread badge + mark read
│   │   │           ├── ReferralScreen.tsx             ✅ DONE  ← share code + apply friend's code
│   │   │           └── SupportScreen.tsx              ✅ DONE  ← tickets + thread
│   │   ├── assets/
│   │   ├── index.js
│   │   ├── app.json
│   │   ├── babel.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── captain-app/                # React Native captain app
│   │   ├── src/
│   │   │   ├── App.tsx             # Root app with AsyncStorage token setup
│   │   │   ├── navigation/
│   │   │   │   └── AppNavigator.tsx
│   │   │   └── screens/
│   │   │       ├── auth/
│   │   │       │   ├── LoginScreen.tsx           ✅ DONE
│   │   │       │   ├── RegisterScreen.tsx         ✅ DONE
│   │   │       │   ├── ForgotPasswordScreen.tsx   ✅ DONE
│   │   │       │   └── ResetPasswordScreen.tsx    ✅ DONE
│   │   │       └── captain/
│   │   │           ├── HomeScreen.tsx           ✅ DONE  ← 3-state availability (AVAILABLE/BUSY/OFF_DUTY) + stats + bell
│   │   │           ├── MyBookingsScreen.tsx      ✅ DONE  ← assignments + filters
│   │   │           ├── BookingDetailsScreen.tsx  ✅ DONE  ← status updates + OTP + Call + Maps
│   │   │           ├── SegmentsScreen.tsx        ✅ DONE  ← multi-leg segments + photo proof before pickup + COD collect
│   │   │           ├── ScanScreen.tsx            ✅ DONE  ← QR/barcode scanner tab (expo-barcode-scanner)
│   │   │           ├── EarningsScreen.tsx        ✅ DONE  ← commissions + totals
│   │   │           ├── ProfileScreen.tsx         ✅ DONE  ← Security card: biometric toggle
│   │   │           ├── EditProfileScreen.tsx     ✅ DONE
│   │   │           ├── OnboardingScreen.tsx      ✅ DONE  ← KYC document upload (camera / gallery)
│   │   │           ├── KycStatusScreen.tsx       ✅ DONE  ← per-document status + resubmit CTA
│   │   │           ├── WithdrawalScreen.tsx      ✅ DONE  ← earnings payout requests
│   │   │           ├── PayoutDetailsScreen.tsx   ✅ DONE  ← UPI / bank transfer
│   │   │           ├── NotificationsScreen.tsx   ✅ DONE  ← unread badge + mark read
│   │   │           └── SupportScreen.tsx         ✅ DONE  ← tickets + thread
│   │   ├── assets/
│   │   ├── index.js
│   │   ├── app.json
│   │   ├── babel.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── point-manager-app/          # React Native point manager app
│       ├── src/
│       │   ├── App.tsx             # Root app with AsyncStorage token setup
│       │   ├── navigation/
│       │   │   └── AppNavigator.tsx
│       │   └── screens/
│       │       ├── auth/
│       │       │   ├── LoginScreen.tsx           ✅ DONE
│       │       │   ├── RegisterScreen.tsx         ✅ DONE
│       │       │   ├── ForgotPasswordScreen.tsx   ✅ DONE
│       │       │   └── ResetPasswordScreen.tsx    ✅ DONE
│       │       └── pointManager/
│       │           ├── HomeScreen.tsx              ✅ DONE  ← stats + quick actions + bell
│       │           ├── LocationBookingsScreen.tsx  ✅ DONE  ← bookings + filters
│       │           ├── BookingDetailsScreen.tsx    ✅ DONE  ← assign captain + COD collect + Cancel booking
│       │           ├── CodManagementScreen.tsx     ✅ DONE  ← collections tab + remittances tab + Remit Now
│       │           ├── ScanScreen.tsx              ✅ DONE  ← QR/barcode scanner tab (expo-barcode-scanner)
│       │           ├── CommissionScreen.tsx        ✅ DONE  ← commissions + payout
│       │           ├── ProfileScreen.tsx           ✅ DONE  ← Security card: biometric toggle
│       │           ├── EditProfileScreen.tsx       ✅ DONE
│       │           ├── WorkingHoursScreen.tsx      ✅ DONE
│       │           ├── PayoutDetailsScreen.tsx     ✅ DONE  ← UPI / bank transfer
│       │           ├── NotificationsScreen.tsx     ✅ DONE  ← unread badge + mark read
│       │           └── SupportScreen.tsx           ✅ DONE  ← tickets + thread
│       ├── assets/
│       ├── index.js
│       ├── app.json
│       ├── babel.config.js
│       ├── tsconfig.json
│       └── package.json
│
└── packages/
    ├── db/                         # Database package (existing)
    ├── types/                      # TypeScript types (existing)
    ├── ui/                         # Web UI components (existing)
    ├── utils/                      # Web utilities (existing)
    └── mobile-shared/              # Shared mobile package ✅ DONE
        └── src/
            ├── api/
            │   ├── client.ts         ✅ Axios instance + interceptors + token refresh
            │   ├── auth.ts           ✅ Login, register, OTP, forgot/reset password
            │   ├── bookings.ts       ✅ CRUD, status, price-preview, OTP, upload
            │   ├── locations.ts      ✅ Location list + cascading
            │   ├── wallet.ts         ✅ Balance, transactions, recharge + verify
            │   ├── profile.ts        ✅ Profile, availability, working hours, onboarding
            │   ├── support.ts        ✅ Tickets, messages, create/reply
            │   ├── commissions.ts    ✅ Commission list + payout request
            │   ├── cod.ts            ✅ Collections, remittances, segment collect
            │   ├── captains.ts       ✅ Available captains for assignment
            │   ├── withdrawals.ts    ✅ List + request withdrawal
            │   ├── payments.ts       ✅ Booking payment order + verify
            │   ├── notifications.ts  ✅ List + mark as read
            │   ├── favorites.ts      ✅ Add/remove/list favorite locations
            │   ├── ratings.ts        ✅ Submit captain rating
            │   ├── payoutDetails.ts  ✅ UPI / bank account save
            │   ├── coupons.ts        ✅ Validate coupon + discount
            │   ├── segments.ts       ✅ Captain booking segments (multi-leg)
            │   ├── referrals.ts      ✅ Apply referral code
            │   └── index.ts          ✅ All exports
            ├── auth/
            │   ├── context.tsx     ✅ AuthProvider + useAuth hook
            │   └── storage.ts      ✅ Token storage interface (DI pattern)
            ├── utils/
            │   └── helpers.ts      ✅ formatCurrency, formatDate, getStatusColor, etc.
            └── index.ts            ✅ Full public API surface
        (per-app utils — not shared package)
        apps/*/src/utils/
            ├── biometric.ts        ✅ expo-local-authentication wrapper (enable/disable/authenticate)
            └── notifications.ts   ✅ expo-notifications registration + listeners + Android channels
```

---

## Prerequisites

- Node.js >= 20
- npm >= 10.8.2
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development — macOS only)

---

## Installation

All dependencies are already installed. For fresh setup:

```bash
# From monorepo root
cd apps/customer-app     && npm install
cd ../captain-app        && npm install
cd ../point-manager-app  && npm install
cd ../../packages/mobile-shared && npm install
```

### Configure API Base URL

Edit `packages/mobile-shared/src/api/client.ts`:

```typescript
// Development (local)
const API_BASE_URL = 'http://localhost:3000/api';

// Development (physical device — use your machine's IP)
const API_BASE_URL = 'http://192.168.x.x:3000/api';

// Production
const API_BASE_URL = 'https://your-domain.com/api';
```

---

## Running the Apps

Always start the backend first, then run the mobile app.

### Step 1 — Start Next.js backend

```bash
# From monorepo root
npm run dev
```

Backend will run at `http://localhost:3000` with API at `/api`.

### Step 2 — Run mobile app (new terminal)

```bash
# Customer App
npm run mobile:customer

# Captain App
npm run mobile:captain

# Point Manager App
npm run mobile:pm
```

### Step 3 — Open on device/simulator

Press in Expo terminal:
- `a` → Android emulator/device
- `i` → iOS simulator (macOS only)
- `w` → Web browser (limited)

---

## Development Progress

### ✅ Phase 1 & 2 Core: Foundation + All Core Screens — COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| Feature documentation (`MOBILE_FEATURES.md`) | ✅ Done | Full role-wise checklist |
| Monorepo project structure | ✅ Done | 3 apps + shared package |
| Shared package (`@ve/mobile-shared`) | ✅ Done | API client, auth, utils |
| Axios API client with interceptors | ✅ Done | Auto token refresh on 401 |
| AsyncStorage token management | ✅ Done | Per-app isolated storage keys |
| Auth context & `useAuth` hook | ✅ Done | Login, logout, session restore |
| Auth API functions (`authApi`) | ✅ Done | Login, register, OTP, password reset |
| Bookings API functions (`bookingsApi`) | ✅ Done | CRUD, status update, price preview |
| Utility helpers | ✅ Done | Currency, date, phone, status, distance |
| Zod validation schemas | ✅ Done | Matches backend validation |
| Babel configuration | ✅ Done | All 3 apps |
| TypeScript configuration | ✅ Done | All 3 apps (fixed extends error) |
| Entry points (`index.js`) | ✅ Done | All 3 apps |
| `app.json` (Expo config) | ✅ Done | All 3 apps |
| npm install for all apps | ✅ Done | Dependency conflicts resolved |
| **Customer** — Login screen | ✅ Done | Validation, error handling, styled |
| **Customer** — Register screen | ✅ Done | Full form validation, styled |
| **Customer** — Home screen | ✅ Done | Quick action cards |
| **Customer** — Profile screen | ✅ Done | User info + logout |
| **Customer** — BookingScreen | ✅ Done | 4-step: location → parcel → payment → confirm |
| **Customer** — MyBookingsScreen | ✅ Done | List, filter tabs, pull-to-refresh, pagination |
| **Customer** — BookingDetailsScreen | ✅ Done | Tracking timeline, cancel, captain/PM info |
| **Customer** — WalletScreen | ✅ Done | Balance, credit/debit transaction history |
| **Customer** — SupportScreen | ✅ Done | Create tickets, thread view, reply |
| **Captain** — Login screen | ✅ Done | Validation, error handling, styled |
| **Captain** — HomeScreen | ✅ Done | Availability toggle, stats, recent assignments |
| **Captain** — MyBookingsScreen | ✅ Done | Assignments list with status filters |
| **Captain** — BookingDetailsScreen | ✅ Done | Status update buttons, OTP delivery modal |
| **Captain** — EarningsScreen | ✅ Done | Commissions list, total earned/pending |
| **Captain** — SupportScreen | ✅ Done | Create tickets, thread view, reply |
| **Captain** — Profile screen | ✅ Done | User info + logout |
| **Point Manager** — Login screen | ✅ Done | Validation, error handling, styled |
| **Point Manager** — HomeScreen | ✅ Done | Stats dashboard, recent bookings |
| **Point Manager** — LocationBookingsScreen | ✅ Done | Bookings list, status filters |
| **Point Manager** — BookingDetailsScreen | ✅ Done | Captain assignment modal, status updates |
| **Point Manager** — CodManagementScreen | ✅ Done | Collections list, remittance creation |
| **Point Manager** — CommissionScreen | ✅ Done | Commission list, payout request |
| **Point Manager** — SupportScreen | ✅ Done | Create tickets, thread view, reply |
| **Point Manager** — Profile screen | ✅ Done | User info + logout |
| Bottom tab navigation (all 3 apps) | ✅ Done | 4 tabs each, emoji icons, role-themed |
| API modules — locations, wallet, profile | ✅ Done | packages/mobile-shared/src/api/ |
| API modules — support, commissions, cod | ✅ Done | packages/mobile-shared/src/api/ |
| API modules — captains | ✅ Done | packages/mobile-shared/src/api/ |
| API modules — withdrawals | ✅ Done | packages/mobile-shared/src/api/ |
| auth.ts — registerCaptain + registerPointManager | ✅ Done | Role-specific backend endpoints |
| **Customer** — RegisterScreen (real API) | ✅ Done | Wired to authApi.register |
| **Customer** — HomeScreen (live stats) | ✅ Done | API-fetched booking counts + wallet balance |
| **Customer** — ForgotPasswordScreen | ✅ Done | Email reset link + success state |
| **Captain** — RegisterScreen (2-step) | ✅ Done | Personal info → review → submit |
| **Captain** — ForgotPasswordScreen | ✅ Done | Email reset link + success state |
| **Point Manager** — RegisterScreen (3-step) | ✅ Done | Personal → shop/location → review → submit |
| **Point Manager** — ForgotPasswordScreen | ✅ Done | Email reset link + success state |
| **Point Manager** — WorkingHoursScreen | ✅ Done | Day-by-day schedule, time picker, save to API |
| ForgotPassword in all 3 AuthStacks | ✅ Done | Linked from Login screens |
| **All Apps** — ProfileScreen (rich UI) | ✅ Done | Avatar, shop info, KYC badge, chevron menu |
| **All Apps** — EditProfileScreen | ✅ Done | Name/phone/email/password; Captain: vehicle; PM: shopName |
| **Captain** — OnboardingScreen | ✅ Done | 4-step: Aadhaar → Licence → Vehicle → Review/Submit |
| **Captain** — KycStatusScreen | ✅ Done | Live verification status per document + rejection reason |
| **Captain** — WithdrawalScreen | ✅ Done | Balance from commissions, request modal, history list |
| **Captain** — BookingDetails: Call + Maps | ✅ Done | tel: link + Google Maps deep link for drop location |
| **Point Manager** — EditProfileScreen | ✅ Done | Personal info + shop name + location read-only view |
| `profileApi.updateProfile()` | ✅ Done | PUT /profile/me — name/phone/email/vehicle/shop/password |
| `profileApi.submitOnboarding()` | ✅ Done | POST /profile/onboarding — captain KYC + vehicle |
| `api/payments.ts` module | ✅ Done | createWalletTopupOrder, verifyPayment, getPaymentHistory |

---

## Pending Tasks

### ✅ Phase 4 (Web-Parity) — COMPLETED

All main functionality from the web app is now implemented in mobile. Summary of Phase 4 completions:

| Feature | Apps | API Route |
|---------|------|-----------|
| Notifications screen + unread bell | All 3 | `GET/PATCH /api/notifications` |
| Favorite Locations (add/remove) | Customer | `GET/POST/DELETE /api/favorite-locations` |
| Rate Captain modal (post-delivery) | Customer | `POST /api/ratings` |
| Coupon code validation in BookingScreen | Customer | `POST /api/coupons/validate` |
| Payout Details screen (UPI / bank) | Captain, PM | `GET/POST /api/payout-details` |
| COD Collect button on PM BookingDetails | PM | `POST /api/bookings/segments/[id]/collect-cod` |
| Wallet balance endpoint added | Customer | `GET /api/wallet/balance` |
| Wallet recharge order API wired | Customer | `POST /api/wallet/recharge` |

---

### ✅ Platform Features — Phase 7 Complete

| Feature | Applies To | Status | Notes |
|---------|-----------|--------|-------|
| Biometric login (Face ID / Fingerprint) | All apps | ✅ Built | `expo-local-authentication`; enabled after first email login |
| Phone OTP login | All apps | ✅ Built | Tab on LoginScreen; `POST /auth/otp/send` + `/verify` |
| Razorpay in-app payment (wallet recharge) | Customer | ✅ Built | `react-native-razorpay`; graceful fallback before native rebuild |
| Push notifications (expo-notifications) | All apps | ✅ Built | Registers token → `profileApi.updateFcmToken()`; foreground alert + tap-navigate |
| Camera — KYC document upload | Captain | ✅ Built | `expo-image-picker`; Camera / Gallery picker on OnboardingScreen |
| Camera — delivery photo proof | Captain | ✅ Built | Photo prompt before PICKED_UP on SegmentsScreen |
| Real-time tracking map | Customer | ✅ Built | `react-native-maps` MapView card in BookingDetailsScreen |
| QR / barcode scanner | Captain, PM | ✅ Built | `expo-barcode-scanner` ScanScreen in both apps; new tab added |
| Deep linking | All apps | ✅ Built | `linking` config in NavigationContainer; custom URL schemes |
| Offline mode + local caching | All apps | ❌ Optional | AsyncStorage already used for tokens; full offline TBD |
| Dark mode / theme switcher | All apps | ❌ Optional | Theme context scaffold possible |
| Multi-language (Hindi/Tamil/etc.) | All apps | ❌ Optional | i18next integration TBD |

### 🔧 Production Setup Checklist (requires keys / native rebuild)

| Item | What to do |
|------|-----------|
| **Razorpay** | Add `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` to `apps/web/.env`; run `npx expo run:android` to link native module |
| **Firebase FCM** | Add `google-services.json` → `apps/*/android/app/`; `GoogleService-Info.plist` → `apps/*/ios/`; run `npx expo prebuild` |
| **Google Maps** | Add `GOOGLE_MAPS_API_KEY` to `app.json > android.config.googleMaps.apiKey`; run `npx expo run:android` |
| **Deep linking** | Register URL schemes in `app.json > scheme` (`ve-customer`, `ve-captain`, `ve-pm`) |
| **URL scheme** | iOS: add Associated Domains; Android: add `intent-filter` in AndroidManifest.xml |

---

### 🔵 Phase 4: Testing & Deployment — NOT STARTED

| Task | Status |
|------|--------|
| Unit tests (components + hooks) | ❌ Not started |
| Integration tests (API calls) | ❌ Not started |
| E2E tests (critical flows) | ❌ Not started |
| Crashlytics / Sentry setup | ❌ Not started |
| Firebase Analytics integration | ❌ Not started |
| App icons + splash screens (all 3 apps) | ❌ Not started |
| Android release build (AAB) | ❌ Not started |
| iOS release build | ❌ Not started |
| Google Play Store listing | ❌ Not started |
| Apple App Store listing | ❌ Not started |
| OTA update setup (Expo Updates) | ❌ Not started |

---

## App-Specific Features

### Customer App (`@ve/customer-app`)
- **Color Theme**: Green `#4CAF50`
- **API Routes Used**: `/api/auth/*`, `/api/bookings/my`, `/api/bookings`, `/api/wallet`, `/api/payments/*`, `/api/support-tickets/*`, `/api/locations`, `/api/coupons`

### Captain App (`@ve/captain-app`)
- **Color Theme**: Blue `#2196F3`
- **API Routes Used**: `/api/auth/*`, `/api/bookings/captain`, `/api/bookings/[id]/status`, `/api/bookings/[id]/upload-validation-image`, `/api/bookings/[id]/validate-delivery-otp`, `/api/commissions/my`, `/api/withdrawals`, `/api/profile/availability`, `/api/captains/[id]/kyc`

### Point Manager App (`@ve/point-manager-app`)
- **Color Theme**: Orange `#FF9800`
- **API Routes Used**: `/api/auth/*`, `/api/bookings/point-manager`, `/api/bookings/[id]/assign-captain`, `/api/captains/available`, `/api/cod/*`, `/api/commissions/my`, `/api/profile/working-hours`

---

## Shared Package (`@ve/mobile-shared`)

### What's Built

| Module | File | Status | Description |
|--------|------|--------|-------------|
| API client | `src/api/client.ts` | ✅ Done | Axios + request/response interceptors + token refresh |
| Auth API | `src/api/auth.ts` | ✅ Done | Login, register, OTP, password reset, getCurrentUser |
| Bookings API | `src/api/bookings.ts` | ✅ Done | CRUD, status, price preview, COD, delivery proof |
| Locations API | `src/api/locations.ts` | ✅ Done | Location list + cascading filter |
| Wallet API | `src/api/wallet.ts` | ✅ Done | Balance, transactions, recharge order + verify |
| Profile API | `src/api/profile.ts` | ✅ Done | Profile, availability toggle, FCM, working hours, onboarding |
| Support API | `src/api/support.ts` | ✅ Done | Tickets, messages, create/reply |
| Commissions API | `src/api/commissions.ts` | ✅ Done | Commission list + payout request |
| COD API | `src/api/cod.ts` | ✅ Done | Collections, remittances, segment COD collect |
| Captains API | `src/api/captains.ts` | ✅ Done | Available captains for PM assignment |
| Withdrawals API | `src/api/withdrawals.ts` | ✅ Done | List + request withdrawal |
| Payments API | `src/api/payments.ts` | ✅ Done | Booking payment order + verify |
| Notifications API | `src/api/notifications.ts` | ✅ Done | List + mark as read |
| Favorites API | `src/api/favorites.ts` | ✅ Done | Add/remove/list favorite locations |
| Ratings API | `src/api/ratings.ts` | ✅ Done | Submit captain rating |
| Payout Details API | `src/api/payoutDetails.ts` | ✅ Done | UPI / bank account save |
| Coupons API | `src/api/coupons.ts` | ✅ Done | Validate coupon + calculate discount |
| Auth context | `src/auth/context.tsx` | ✅ Done | `AuthProvider`, `useAuth`, session restore on launch |
| Token storage | `src/auth/storage.ts` | ✅ Done | Interface — each app injects its own AsyncStorage impl |
| Helpers | `src/utils/helpers.ts` | ✅ Done | formatCurrency, formatDate, getStatusColor, isValidEmail, etc. |

---

## Troubleshooting

### Metro Bundler Issues

```bash
npx expo start -c        # Clear cache and restart
```

### API Connection Issues

- Ensure backend is running: `npm run dev`
- For physical devices, use your machine's LAN IP (not `localhost`)
- Example: `API_BASE_URL=http://192.168.1.x:3000/api`

### Dependency Issues

```bash
# Clear npm cache and reinstall
npm cache clean --force
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### TypeScript Errors

All `tsconfig.json` files are self-contained (no `extends`). If TS errors appear, verify:
- `moduleResolution` is `"bundler"` (not deprecated `"node"`)
- `skipLibCheck: true` is set

---

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Village Express Feature Checklist](./MOBILE_FEATURES.md)
- [Village Express User Guide](./USER_GUIDE.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ Done | Fully implemented |
| ⏳ Placeholder | Screen exists but shows stub content |
| ❌ Not built | Not started yet |
| 🔴 High Priority | Must build next |
| 🟡 Medium Priority | Build after core features |
| 🔵 Low Priority | Nice to have / final phase |
