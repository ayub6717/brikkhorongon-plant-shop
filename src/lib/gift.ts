export const GIFT_CARDS = ["none", "leaf", "bloom", "sunrise"] as const;
export type GiftCard = (typeof GIFT_CARDS)[number];
