import type { ClothingItem, Outfit, WardrobeEvent, WeatherInfo } from '@/models';

export interface DetectedClothingMeta {
  type: ClothingItem['type'];
  material?: string;
  color: string;
  style?: string;
  season?: string[];
  tags: string[];
  suggestedName: string;
}

export interface OutfitSuggestionInput {
  weather: WeatherInfo;
  wardrobe: ClothingItem[];
  events?: WardrobeEvent[];
  stylePreferences?: string[];
}

const MOCK_DETECTION: DetectedClothingMeta = {
  type: 'top',
  material: 'Cotton blend',
  color: 'Soft Pink',
  style: 'Casual',
  season: ['spring', 'summer'],
  tags: ['casual', 'everyday'],
  suggestedName: 'Áo thun pastel',
};

export const aiService = {
  async detectClothingFromImage(_uri: string): Promise<DetectedClothingMeta> {
    await delay(800);
    return MOCK_DETECTION;
  },

  async suggestOutfits(input: OutfitSuggestionInput): Promise<Partial<Outfit>[]> {
    await delay(1200);
    const tops = input.wardrobe.filter((c) => c.type === 'top');
    const bottoms = input.wardrobe.filter((c) => c.type === 'bottom');
    const shoes = input.wardrobe.filter((c) => c.type === 'shoes');

    if (!tops.length || !bottoms.length) return [];

    return [
      {
        name: `Gợi ý cho ${input.weather.condition}`,
        items: [
          { clothingId: tops[0].id, name: tops[0].name, type: tops[0].type },
          {
            clothingId: bottoms[0].id,
            name: bottoms[0].name,
            type: bottoms[0].type,
          },
          ...(shoes[0]
            ? [
                {
                  clothingId: shoes[0].id,
                  name: shoes[0].name,
                  type: shoes[0].type,
                },
              ]
            : []),
        ],
        aiExplanation: `Phù hợp ${input.weather.temperature}°C tại ${input.weather.location}. AI chọn tông màu hài hòa với tủ đồ hiện tại.`,
        weatherCompatibility: `${input.weather.condition}, ${input.weather.temperature}°C`,
        colorMatching: 'Neutral & pastel harmony',
        styleMatching: 'Personal style match 90%',
        matchingScore: 90,
      },
    ];
  },

  async generateVirtualTryOn(
    _userPhotoUri: string,
    _outfitItemIds: string[],
    scene: string,
  ): Promise<string> {
    await delay(2000);
    const sceneImages: Record<string, string> = {
      beach: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      urban: 'https://images.unsplash.com/photo-1483985988355-763728ebc55b?w=800',
      party: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
      office: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
      casual: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
    };
    return sceneImages[scene] ?? sceneImages.casual;
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
