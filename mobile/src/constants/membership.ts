import type { MembershipPlan, Mission, PlanLimit } from '@/models';

export const PLAN_LIMITS: Record<MembershipPlan, PlanLimit> = {
  free: { id: 'free', label: 'Miễn phí', aiMonthly: 10, closetItems: 50 },
  pro: { id: 'pro', label: 'Pro', aiMonthly: -1, closetItems: -1 },
  premium: { id: 'premium', label: 'Premium', aiMonthly: -1, closetItems: -1 },
};

export const DEFAULT_MISSIONS: Mission[] = [
  { id: 'daily-checkin', type: 'daily_checkin', title: 'Điểm danh hàng ngày', description: 'Mở app mỗi ngày để nhận thêm lượt AI', rewardAiTries: 1, progress: 0, target: 1, isCompleted: false, isClaimed: false, isActive: true },
  { id: 'watch-ad', type: 'watch_ad', title: 'Xem quảng cáo', description: 'Xem video quảng cáo mẫu để nhận thưởng', rewardAiTries: 2, progress: 0, target: 1, isCompleted: false, isClaimed: false, isActive: true },
  { id: 'invite-friend', type: 'invite_friend', title: 'Mời bạn bè', description: 'Mời một người bạn tham gia Your Closet', rewardAiTries: 5, progress: 0, target: 1, isCompleted: false, isClaimed: false, isActive: true },
  { id: 'share-outfit', type: 'share_outfit', title: 'Chia sẻ outfit', description: 'Chia sẻ một outfit hoặc ảnh thử đồ', rewardAiTries: 2, progress: 0, target: 1, isCompleted: false, isClaimed: false, isActive: true },
];

export interface PlanFeature {
  id: MembershipPlan;
  name: string;
  priceVnd: number;
  priceLabel: string;
  aiGenerations: string;
  closetLimit: string;
  features: string[];
  badge?: string;
}

export const MEMBERSHIP_PLANS: PlanFeature[] = [
  {
    id: 'free',
    name: 'Miễn phí',
    priceVnd: 0,
    priceLabel: '0đ/tháng',
    aiGenerations: `${PLAN_LIMITS.free.aiMonthly} lượt AI/tháng`,
    closetLimit: `Tối đa ${PLAN_LIMITS.free.closetItems} món`,
    features: ['Gợi ý outfit cơ bản', 'Cộng đồng Pass đồ'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceVnd: 99000,
    priceLabel: '99.000đ/tháng',
    aiGenerations: 'Không giới hạn AI',
    closetLimit: 'Tủ đồ không giới hạn',
    features: [
      'AI nhanh hơn',
      'Ưu tiên xử lý',
      'Virtual try-on nâng cao',
      'Xu hướng thời trang',
    ],
    badge: 'Phổ biến',
  },
  {
    id: 'premium',
    name: 'Premium',
    priceVnd: 199000,
    priceLabel: '199.000đ/tháng',
    aiGenerations: 'Không giới hạn AI',
    closetLimit: 'Tủ đồ không giới hạn',
    features: [
      'Stylist AI cao cấp',
      'Xu hướng độc quyền',
      'Hỗ trợ ưu tiên',
      'Tất cả tính năng Pro',
    ],
    badge: 'Cao cấp',
  },
];

export const PAYMENT_METHODS = [
  { id: 'vnpay', label: 'VNPay', icon: 'card' as const },
  { id: 'momo', label: 'MoMo', icon: 'wallet' as const },
  { id: 'card', label: 'Thẻ tín dụng', icon: 'card-outline' as const },
  { id: 'apple', label: 'Apple Pay', icon: 'logo-apple' as const },
  { id: 'google', label: 'Google Pay', icon: 'logo-google' as const },
];

export const PLATFORM_FEE_RATE = 0.1;
