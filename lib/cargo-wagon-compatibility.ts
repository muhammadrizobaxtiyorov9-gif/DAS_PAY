/**
 * Cargo Type ↔ Wagon Type Compatibility Matrix
 * Ensures correct wagon assignment for cargo types
 */

export type CargoTypeKey = 'bulk' | 'container' | 'liquid' | 'perishable' | 'oversized' | 'general';

export const CARGO_TYPES: Record<CargoTypeKey, {
  label: { uz: string; ru: string; en: string };
  icon: string;
  description: { uz: string; ru: string; en: string };
}> = {
  bulk: {
    label: { uz: "Ochiq yuk", ru: "Насыпной груз", en: "Bulk cargo" },
    icon: "🪨",
    description: { uz: "Ko'mir, ruda, g'alla, sement", ru: "Уголь, руда, зерно, цемент", en: "Coal, ore, grain, cement" },
  },
  container: {
    label: { uz: "Konteyner yuk", ru: "Контейнерный груз", en: "Container cargo" },
    icon: "📦",
    description: { uz: "Standart konteynerlar (20ft, 40ft)", ru: "Стандартные контейнеры (20ft, 40ft)", en: "Standard containers (20ft, 40ft)" },
  },
  liquid: {
    label: { uz: "Suyuqlik", ru: "Жидкий груз", en: "Liquid cargo" },
    icon: "🛢️",
    description: { uz: "Neft, kimyoviy moddalar, oziq-ovqat suyuqliklari", ru: "Нефть, химикаты, пищевые жидкости", en: "Oil, chemicals, food liquids" },
  },
  perishable: {
    label: { uz: "Tez buzuladigan yuk", ru: "Скоропортящийся груз", en: "Perishable cargo" },
    icon: "🥩",
    description: { uz: "Oziq-ovqat, farmatsevtika, gul", ru: "Продукты, фармацевтика, цветы", en: "Food, pharmaceuticals, flowers" },
  },
  oversized: {
    label: { uz: "Gabaritli yuk", ru: "Негабаритный груз", en: "Oversized cargo" },
    icon: "🏗️",
    description: { uz: "Katta mashina, qurilish texnikasi", ru: "Крупная техника, стройматериалы", en: "Heavy machinery, construction equipment" },
  },
  general: {
    label: { uz: "Umumiy yuk", ru: "Генеральный груз", en: "General cargo" },
    icon: "📋",
    description: { uz: "Mashinalar, mebel, qurilish materiallari", ru: "Машины, мебель, стройматериалы", en: "Vehicles, furniture, building materials" },
  },
};

/**
 * Wagon Type → Compatible Cargo Types
 * Maps each wagon type to the cargo types it can carry
 */
export const WAGON_CARGO_MATRIX: Record<string, CargoTypeKey[]> = {
  "Yopiq vagon (Kritiy)": ["general", "container", "perishable"],
  "Yarim ochiq vagon (Poluvagon)": ["bulk", "general", "oversized"],
  "Platforma": ["container", "oversized"],
  "Sisterna": ["liquid"],
  "Xopper": ["bulk"],
  "Refrijerator": ["perishable"],
};

/**
 * Get wagons compatible with the given cargo type
 */
export function getCompatibleWagons(cargoType: string | null | undefined, wagons: any[]): any[] {
  if (!cargoType) return wagons; // no filter if no cargo type selected
  
  return wagons.filter(wagon => {
    const compatible = WAGON_CARGO_MATRIX[wagon.type];
    if (!compatible) {
      // Custom wagon type — allow all cargo types (flexible)
      return true;
    }
    return compatible.includes(cargoType as CargoTypeKey);
  });
}

/**
 * Check if a specific wagon type is compatible with a cargo type
 */
export function isWagonCompatible(wagonType: string, cargoType: string): boolean {
  const compatible = WAGON_CARGO_MATRIX[wagonType];
  if (!compatible) return true; // custom type — allow
  return compatible.includes(cargoType as CargoTypeKey);
}

/**
 * Validate shipment weight against total wagon capacity
 * @returns null if valid, error message string if invalid
 */
export function validateWeight(
  shipmentWeight: number | null | undefined,
  selectedWagons: { capacity: number }[]
): string | null {
  if (!shipmentWeight || shipmentWeight <= 0) return null;
  if (selectedWagons.length === 0) return null;
  
  const totalCapacity = selectedWagons.reduce((sum, w) => sum + w.capacity, 0);
  
  if (shipmentWeight > totalCapacity) {
    return `Yuk og'irligi (${shipmentWeight}t) tanlangan vagonlar umumiy sig'imidan (${totalCapacity}t) oshib ketdi. Iltimos, qo'shimcha vagon qo'shing yoki og'irlikni kamaytiring.`;
  }
  
  // Warning: if usage > 95%, notify but allow
  const usage = (shipmentWeight / totalCapacity) * 100;
  if (usage > 95) {
    return null; // allow but could warn on frontend
  }
  
  return null;
}

/**
 * Get wagon types that can carry the given cargo type
 */
export function getCompatibleWagonTypes(cargoType: string): string[] {
  const result: string[] = [];
  for (const [wagonType, cargoTypes] of Object.entries(WAGON_CARGO_MATRIX)) {
    if (cargoTypes.includes(cargoType as CargoTypeKey)) {
      result.push(wagonType);
    }
  }
  return result;
}

/**
 * Usage ratio for display
 */
export function getCapacityUsage(shipmentWeight: number, wagons: { capacity: number }[]): {
  total: number;
  used: number;
  percentage: number;
  isOverweight: boolean;
} {
  const total = wagons.reduce((sum, w) => sum + w.capacity, 0);
  return {
    total,
    used: shipmentWeight,
    percentage: total > 0 ? Math.round((shipmentWeight / total) * 100) : 0,
    isOverweight: shipmentWeight > total,
  };
}
