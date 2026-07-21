export type AiFeature =
  | "clothing_detection"
  | "clothing_enhance"
  | "outfit_recommend"
  | "virtual_tryon"
  | "style_profile_analyze";

export interface AiFeatureRoutingRow {
  free: string;
  pro: string;
  premium: string;
  fallback: string;
}

export interface AiRoutingConfig {
  id: string;
  clothing_detection: AiFeatureRoutingRow;
  clothing_enhance: AiFeatureRoutingRow;
  outfit_recommend: AiFeatureRoutingRow;
  virtual_tryon: AiFeatureRoutingRow;
  style_profile_analyze: AiFeatureRoutingRow;
  updatedAt: string;
}

export const AI_FEATURES: AiFeature[] = [
  "clothing_detection",
  "clothing_enhance",
  "outfit_recommend",
  "virtual_tryon",
  "style_profile_analyze",
];

export const FEATURE_LABELS: Record<AiFeature, string> = {
  clothing_detection: "Clothing Detection",
  clothing_enhance: "Clothing Enhance",
  outfit_recommend: "Outfit Recommend",
  virtual_tryon: "Virtual Try-On",
  style_profile_analyze: "Style Profile Analyze",
};
