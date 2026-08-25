import { normalizeWardrobeIntelligence, parseWardrobeQuery, queryWardrobeItems } from "@/lib/server/wardrobe-intelligence";

const item = (overrides: Record<string, unknown> = {}) => ({
  id: "item-1", userId: "user-a", name: "Áo trắng công sở", type: "top", color: "White", style: "Work", material: "Cotton", season: ["Summer"], tags: ["office"], timesWorn: 2, createdAt: "2026-01-02T00:00:00.000Z", ...overrides,
});

describe("Wardrobe Intelligence", () => {
  test("normalizes raw values without discarding display/raw values", () => {
    const intelligence = normalizeWardrobeIntelligence({ type: "top", color: "White", secondaryColors: ["off-white"], style: "Work", season: ["Summer"], occasion: ["Office"], aiConfidenceScore: 0.92 });
    expect(intelligence.category).toMatchObject({ raw: "top", normalized: "top", display: "Áo" });
    expect(intelligence.colors).toEqual(expect.arrayContaining([
      expect.objectContaining({ raw: "White", normalized: "white", display: "Trắng" }),
      expect.objectContaining({ raw: "off-white", normalized: "off-white", display: "Trắng ngà" }),
    ]));
    expect(intelligence.style).toMatchObject({ raw: "Work", normalized: "work", display: "Công sở" });
    expect(intelligence.confidence).toBe(0.92);
  });

  test("uses deterministic aliases but does not merge unrelated values", () => {
    const top = normalizeWardrobeIntelligence({ type: "tee", color: "grey" });
    const cream = normalizeWardrobeIntelligence({ type: "top", color: "cream" });
    expect(top.category.normalized).toBe("top");
    expect(top.colors[0].normalized).toBe("gray");
    expect(cream.colors[0].normalized).toBe("cream");
  });

  test("filters one structured field deterministically", () => {
    const result = queryWardrobeItems([item(), item({ id: "item-2", type: "bottom", color: "Black" })].map((value) => ({ ...value, intelligence: normalizeWardrobeIntelligence(value) })), parseWardrobeQuery(new URLSearchParams("category=top")));
    expect(result.items.map((value) => value.id)).toEqual(["item-1"]);
    expect(result.total).toBe(1);
  });

  test("supports combined filters across category, color, and season", () => {
    const rows = [
      item({ id: "1", color: "white", season: ["summer"], style: "work" }),
      item({ id: "2", color: "black", season: ["summer"], style: "work" }),
      item({ id: "3", color: "white", season: ["winter"], style: "casual" }),
    ].map((value) => ({ ...value, intelligence: normalizeWardrobeIntelligence(value) }));
    const result = queryWardrobeItems(rows, parseWardrobeQuery(new URLSearchParams("category=top&color=white&season=summer")));
    expect(result.items.map((value) => value.id)).toEqual(["1"]);
  });

  test("sorts by name and wear count with stable deterministic ordering", () => {
    const rows = [
      { ...item({ id: "a", name: "Zebra", timesWorn: 1 }), intelligence: normalizeWardrobeIntelligence({ type: "top", color: "white" }) },
      { ...item({ id: "b", name: "Áo", timesWorn: 8 }), intelligence: normalizeWardrobeIntelligence({ type: "top", color: "white" }) },
    ];
    expect(queryWardrobeItems(rows, parseWardrobeQuery(new URLSearchParams("sort=name_asc"))).items.map((value) => value.id)).toEqual(["b", "a"]);
    expect(queryWardrobeItems(rows, parseWardrobeQuery(new URLSearchParams("sort=wear_count_desc"))).items.map((value) => value.id)).toEqual(["b", "a"]);
  });

  test("paginates with an opaque numeric cursor and returns facets", () => {
    const rows = [1, 2, 3].map((id) => ({ ...item({ id: String(id) }), intelligence: normalizeWardrobeIntelligence(item()) }));
    const first = queryWardrobeItems(rows, parseWardrobeQuery(new URLSearchParams("limit=2")));
    const second = queryWardrobeItems(rows, parseWardrobeQuery(new URLSearchParams(`limit=2&cursor=${first.cursor}`)));
    expect(first.items).toHaveLength(2);
    expect(first.cursor).toBe("2");
    expect(second.items).toHaveLength(1);
    expect(second.cursor).toBeNull();
    expect(first.facets.categories).toEqual([expect.objectContaining({ value: "top", count: 3 })]);
  });

  test("returns an empty result for a valid filter with no match", () => {
    const result = queryWardrobeItems([{ ...item(), intelligence: normalizeWardrobeIntelligence(item()) }], parseWardrobeQuery(new URLSearchParams("color=purple")));
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.cursor).toBeNull();
  });

  test("rejects invalid sort, limit, cursor, and status values", () => {
    expect(() => parseWardrobeQuery(new URLSearchParams("sort=semantic"))).toThrow("INVALID_SORT");
    expect(() => parseWardrobeQuery(new URLSearchParams("limit=0"))).toThrow("INVALID_LIMIT");
    expect(() => parseWardrobeQuery(new URLSearchParams("cursor=-1"))).toThrow("INVALID_CURSOR");
    expect(() => parseWardrobeQuery(new URLSearchParams("status=deleted"))).toThrow("INVALID_STATUS");
  });

  test("supports search text against names, tags, and normalized metadata", () => {
    const result = queryWardrobeItems([{ ...item(), intelligence: normalizeWardrobeIntelligence(item()) }], parseWardrobeQuery(new URLSearchParams("search=cong%20so")));
    expect(result.items).toHaveLength(1);
  });

  test("is backward-compatible with a legacy row that has no intelligence field", () => {
    const result = queryWardrobeItems([item()], parseWardrobeQuery(new URLSearchParams("category=top&color=white")));
    expect(result.items).toHaveLength(1);
    expect(result.facets.colors[0]).toMatchObject({ value: "white", display: "Trắng" });
  });
});
