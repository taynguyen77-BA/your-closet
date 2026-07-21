import type { User } from '@/models';

export interface AiStyleContext {
  preferredStyles: string[];
  likedColors: string[];
  dislikedColors: string[];
  occasions: string[];
  fashionConfidence?: string;
  gender?: string;
  ageGroup?: string;
  bodyShape?: string;
  heightCm?: number;
  weightKg?: number;
  topSize?: string;
  bottomSize?: string;
  shoeSize?: string;
  budgetLevel?: string;
  fitPreference?: string;
  favoriteBrands: string[];
  avoidStyles: string[];
  summary: string;
}

const list = (items?: string[]) => (items ?? []).filter(Boolean);

export function buildStyleContextForAI(userProfile: Pick<User, 'stylePreferences' | 'advancedStylePreferences' | 'fashionStyle' | 'preferences' | 'favoriteColors'>): AiStyleContext {
  const style = userProfile.stylePreferences;
  const advanced = userProfile.advancedStylePreferences;
  const preferredStyles = list(style?.preferredStyles).length ? list(style?.preferredStyles) : list(userProfile.preferences);
  const likedColors = list(style?.favoriteColors).length ? list(style?.favoriteColors) : list(userProfile.favoriteColors);
  const dislikedColors = [...new Set([...list(style?.dislikedColors), ...list(advanced?.dislikedColors)])];
  const context: AiStyleContext = {
    preferredStyles,
    likedColors,
    dislikedColors,
    occasions: list(style?.lifestyleOccasions),
    fashionConfidence: style?.fashionConfidence,
    gender: style?.gender,
    ageGroup: style?.ageGroup,
    bodyShape: advanced?.bodyShape,
    heightCm: advanced?.heightCm,
    weightKg: advanced?.weightKg,
    topSize: advanced?.topSize,
    bottomSize: advanced?.bottomSize,
    shoeSize: advanced?.shoeSize,
    budgetLevel: advanced?.budgetLevel,
    fitPreference: advanced?.fitPreference,
    favoriteBrands: list(advanced?.favoriteBrands),
    avoidStyles: list(advanced?.avoidStyles),
    summary: '',
  };
  context.summary = [
    preferredStyles.length ? `Preferred styles: ${preferredStyles.join(', ')}` : '',
    likedColors.length ? `Likes colors: ${likedColors.join(', ')}` : '',
    dislikedColors.length ? `Avoid colors: ${dislikedColors.join(', ')}` : '',
    context.occasions.length ? `Occasions: ${context.occasions.join(', ')}` : '',
    context.fashionConfidence ? `Confidence: ${context.fashionConfidence}` : '',
    context.fitPreference ? `Fit: ${context.fitPreference}` : '',
    context.budgetLevel ? `Budget: ${context.budgetLevel}` : '',
    context.favoriteBrands.length ? `Brands: ${context.favoriteBrands.join(', ')}` : '',
    context.avoidStyles.length ? `Avoid styles: ${context.avoidStyles.join(', ')}` : '',
    context.bodyShape ? `Body shape: ${context.bodyShape}` : '',
    context.topSize || context.bottomSize || context.shoeSize ? `Sizes: top ${context.topSize ?? 'unknown'}, bottom ${context.bottomSize ?? 'unknown'}, shoe ${context.shoeSize ?? 'unknown'}` : '',
  ].filter(Boolean).join(' | ');
  return context;
}
