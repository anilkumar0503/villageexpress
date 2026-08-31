export { apiClient, setTokenStorage } from './client';
export type { TokenStorage } from './client';

export { authApi, loginSchema, registerSchema, otpSchema, verifyOtpSchema } from './auth';
export type { LoginInput, RegisterInput, OtpInput, VerifyOtpInput, AuthResponse, User } from './auth';

export { bookingsApi, createBookingSchema, pricePreviewSchema } from './bookings';
export type { CreateBookingInput, PricePreviewInput, Booking, PricePreview, BookingsResponse } from './bookings';

export { locationsApi } from './locations';
export type { Location, LocationsResponse } from './locations';

export { walletApi } from './wallet';
export type { WalletData, WalletTransaction } from './wallet';

export { profileApi } from './profile';

export { supportApi } from './support';
export type { SupportTicket, SupportMessage } from './support';

export { commissionsApi } from './commissions';
export type { Commission } from './commissions';

export { codApi } from './cod';
export type { CodCollection, CodRemittance } from './cod';

export { captainsApi } from './captains';
export type { AvailableCaptain } from './captains';

export { withdrawalsApi } from './withdrawals';
export type { Withdrawal } from './withdrawals';

export { paymentsApi } from './payments';
export type { PaymentOrder } from './payments';

export { notificationsApi } from './notifications';
export type { Notification } from './notifications';

export { favoritesApi } from './favorites';
export type { FavoriteLocation } from './favorites';

export { ratingsApi } from './ratings';
export type { Rating } from './ratings';

export { payoutDetailsApi } from './payoutDetails';
export type { PayoutDetails, PayoutDetailsInput, PayoutType } from './payoutDetails';

export { couponsApi } from './coupons';
export type { CouponValidation } from './coupons';

export { segmentsApi } from './segments';
export type { BookingSegment } from './segments';

export { referralsApi } from './referrals';
export type { Referral } from './referrals';
