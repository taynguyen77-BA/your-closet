import type { MembershipPlan } from '@/models';

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
    aiGenerations: '10 lượt AI/tháng',
    closetLimit: 'Tối đa 50 món',
    features: ['Gợi ý outfit cơ bản', 'Cộng đồng Pass đồ'],
  },
  {
    id: 'premium',
    name: 'Premium',
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
    id: 'elite',
    name: 'Elite',
    priceVnd: 199000,
    priceLabel: '199.000đ/tháng',
    aiGenerations: 'Không giới hạn AI',
    closetLimit: 'Tủ đồ không giới hạn',
    features: [
      'Stylist AI cao cấp',
      'Xu hướng độc quyền',
      'Hỗ trợ ưu tiên',
      'Tất cả tính năng Premium',
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
