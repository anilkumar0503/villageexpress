// API Client
export { apiClient, setTokenStorage as setApiTokenStorage } from './api';
export type { TokenStorage as ApiTokenStorage } from './api';

// Auth API
export { authApi } from './api';
export type { LoginInput, RegisterInput, OtpInput, VerifyOtpInput, AuthResponse, User } from './api';

// Bookings API
export { bookingsApi } from './api';
export type { CreateBookingInput, PricePreviewInput, Booking, PricePreview, BookingsResponse } from './api';

// Locations API
export { locationsApi } from './api';
export type { Location, LocationsResponse } from './api';

// Wallet API
export { walletApi } from './api';
export type { WalletData, WalletTransaction } from './api';

// Profile API
export { profileApi } from './api';

// Support API
export { supportApi } from './api';
export type { SupportTicket, SupportMessage } from './api';

// Commissions API
export { commissionsApi } from './api';
export type { Commission } from './api';

// COD API
export { codApi } from './api';
export type { CodCollection, CodRemittance } from './api';

// Captains API
export { captainsApi } from './api';
export type { AvailableCaptain } from './api';

// Withdrawals API
export { withdrawalsApi } from './api';
export type { Withdrawal } from './api';

// Payments API
export { paymentsApi } from './api';
export type { PaymentOrder } from './api';

// Notifications API
export { notificationsApi } from './api';
export type { Notification } from './api';

// Favorites API
export { favoritesApi } from './api';
export type { FavoriteLocation } from './api';

// Ratings API
export { ratingsApi } from './api';
export type { Rating } from './api';

// Payout Details API
export { payoutDetailsApi } from './api';
export type { PayoutDetails, PayoutDetailsInput, PayoutType } from './api';

// Coupons API
export { couponsApi } from './api';
export type { CouponValidation } from './api';

// Segments API
export { segmentsApi } from './api';
export type { BookingSegment } from './api';

// Referrals API
export { referralsApi } from './api';
export type { Referral } from './api';

// Auth Context
export { AuthProvider, useAuth, setTokenStorage as setAuthTokenStorage } from './auth/context';
export type { TokenStorage as AuthTokenStorage } from './auth/context';

// Utilities
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhoneNumber,
  getRelativeTime,
  isValidEmail,
  isValidIndianPhone,
  truncateText,
  getStatusColor,
  getStatusLabel,
  calculateDistance,
  generateId,
  deepClone,
  debounce,
} from './utils/helpers';
