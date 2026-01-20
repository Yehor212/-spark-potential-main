/**
 * MCC (Merchant Category Code) to category mapping
 * Used for automatic categorization of bank transactions
 */

import type { TransactionType } from '@/types/finance';

interface MCCMapping {
  category: string;
  type: TransactionType;
}

// MCC codes grouped by category
// Reference: ISO 18245
const MCC_RANGES: Record<string, MCCMapping> = {
  // Food & Groceries (5411-5499)
  '5411': { category: 'food', type: 'expense' }, // Grocery stores
  '5412': { category: 'food', type: 'expense' }, // Convenience stores
  '5422': { category: 'food', type: 'expense' }, // Freezer/meat lockers
  '5441': { category: 'food', type: 'expense' }, // Candy, nut stores
  '5451': { category: 'food', type: 'expense' }, // Dairy stores
  '5462': { category: 'food', type: 'expense' }, // Bakeries
  '5499': { category: 'food', type: 'expense' }, // Misc food stores

  // Restaurants & Eating (5812-5814)
  '5812': { category: 'food', type: 'expense' }, // Restaurants
  '5813': { category: 'food', type: 'expense' }, // Bars, cocktail lounges
  '5814': { category: 'food', type: 'expense' }, // Fast food

  // Transport (4011-4789, 5511-5599, 7511-7549)
  '4011': { category: 'transport', type: 'expense' }, // Railroads
  '4111': { category: 'transport', type: 'expense' }, // Local transport
  '4112': { category: 'transport', type: 'expense' }, // Passenger railways
  '4121': { category: 'transport', type: 'expense' }, // Taxis
  '4131': { category: 'transport', type: 'expense' }, // Bus lines
  '4214': { category: 'transport', type: 'expense' }, // Trucking
  '4411': { category: 'transport', type: 'expense' }, // Cruise lines
  '4457': { category: 'transport', type: 'expense' }, // Boat rentals
  '4468': { category: 'transport', type: 'expense' }, // Marinas
  '4511': { category: 'transport', type: 'expense' }, // Airlines
  '4582': { category: 'transport', type: 'expense' }, // Airports
  '4722': { category: 'transport', type: 'expense' }, // Travel agencies
  '4784': { category: 'transport', type: 'expense' }, // Tolls
  '4789': { category: 'transport', type: 'expense' }, // Transportation services
  '5511': { category: 'transport', type: 'expense' }, // Car dealers
  '5521': { category: 'transport', type: 'expense' }, // Used car dealers
  '5531': { category: 'transport', type: 'expense' }, // Auto parts stores
  '5532': { category: 'transport', type: 'expense' }, // Tire stores
  '5533': { category: 'transport', type: 'expense' }, // Auto parts stores
  '5541': { category: 'transport', type: 'expense' }, // Gas stations
  '5542': { category: 'transport', type: 'expense' }, // Fuel dispensers
  '5551': { category: 'transport', type: 'expense' }, // Boat dealers
  '5561': { category: 'transport', type: 'expense' }, // Camper dealers
  '5571': { category: 'transport', type: 'expense' }, // Motorcycle dealers
  '5592': { category: 'transport', type: 'expense' }, // Motor homes
  '5598': { category: 'transport', type: 'expense' }, // Snowmobile dealers
  '5599': { category: 'transport', type: 'expense' }, // Misc auto dealers
  '7511': { category: 'transport', type: 'expense' }, // Truck rental
  '7512': { category: 'transport', type: 'expense' }, // Car rental
  '7513': { category: 'transport', type: 'expense' }, // Truck/utility rental
  '7519': { category: 'transport', type: 'expense' }, // Motor home rental
  '7523': { category: 'transport', type: 'expense' }, // Parking lots
  '7531': { category: 'transport', type: 'expense' }, // Auto body shops
  '7534': { category: 'transport', type: 'expense' }, // Tire retreading
  '7535': { category: 'transport', type: 'expense' }, // Auto paint shops
  '7538': { category: 'transport', type: 'expense' }, // Auto service shops
  '7542': { category: 'transport', type: 'expense' }, // Car washes
  '7549': { category: 'transport', type: 'expense' }, // Towing services

  // Entertainment (7832-7999)
  '7829': { category: 'entertainment', type: 'expense' }, // Video production
  '7832': { category: 'entertainment', type: 'expense' }, // Motion pictures
  '7841': { category: 'entertainment', type: 'expense' }, // Video rentals
  '7911': { category: 'entertainment', type: 'expense' }, // Dance halls
  '7922': { category: 'entertainment', type: 'expense' }, // Theater tickets
  '7929': { category: 'entertainment', type: 'expense' }, // Bands, orchestras
  '7932': { category: 'entertainment', type: 'expense' }, // Billiard halls
  '7933': { category: 'entertainment', type: 'expense' }, // Bowling alleys
  '7941': { category: 'entertainment', type: 'expense' }, // Sports clubs
  '7991': { category: 'entertainment', type: 'expense' }, // Tourist attractions
  '7992': { category: 'entertainment', type: 'expense' }, // Golf courses
  '7993': { category: 'entertainment', type: 'expense' }, // Video games
  '7994': { category: 'entertainment', type: 'expense' }, // Video game arcades
  '7995': { category: 'entertainment', type: 'expense' }, // Betting
  '7996': { category: 'entertainment', type: 'expense' }, // Amusement parks
  '7997': { category: 'entertainment', type: 'expense' }, // Recreation services
  '7998': { category: 'entertainment', type: 'expense' }, // Aquariums
  '7999': { category: 'entertainment', type: 'expense' }, // Recreation services

  // Shopping - General (5200-5399, 5600-5699, 5900-5999)
  '5200': { category: 'shopping', type: 'expense' }, // Home supply stores
  '5211': { category: 'shopping', type: 'expense' }, // Building materials
  '5231': { category: 'shopping', type: 'expense' }, // Glass, paint stores
  '5251': { category: 'shopping', type: 'expense' }, // Hardware stores
  '5261': { category: 'shopping', type: 'expense' }, // Lawn and garden
  '5271': { category: 'shopping', type: 'expense' }, // Mobile home dealers
  '5300': { category: 'shopping', type: 'expense' }, // Wholesale clubs
  '5309': { category: 'shopping', type: 'expense' }, // Duty free stores
  '5310': { category: 'shopping', type: 'expense' }, // Discount stores
  '5311': { category: 'shopping', type: 'expense' }, // Department stores
  '5331': { category: 'shopping', type: 'expense' }, // Variety stores
  '5399': { category: 'shopping', type: 'expense' }, // Misc general merch
  '5611': { category: 'shopping', type: 'expense' }, // Men's clothing
  '5621': { category: 'shopping', type: 'expense' }, // Women's clothing
  '5631': { category: 'shopping', type: 'expense' }, // Women's accessories
  '5641': { category: 'shopping', type: 'expense' }, // Children's wear
  '5651': { category: 'shopping', type: 'expense' }, // Family clothing
  '5655': { category: 'shopping', type: 'expense' }, // Sports apparel
  '5661': { category: 'shopping', type: 'expense' }, // Shoe stores
  '5681': { category: 'shopping', type: 'expense' }, // Furriers
  '5691': { category: 'shopping', type: 'expense' }, // Men's/women's clothing
  '5697': { category: 'shopping', type: 'expense' }, // Tailors
  '5698': { category: 'shopping', type: 'expense' }, // Wig and toupee stores
  '5699': { category: 'shopping', type: 'expense' }, // Misc apparel
  '5712': { category: 'shopping', type: 'expense' }, // Furniture stores
  '5713': { category: 'shopping', type: 'expense' }, // Floor covering
  '5714': { category: 'shopping', type: 'expense' }, // Drapery stores
  '5718': { category: 'shopping', type: 'expense' }, // Fireplace stores
  '5719': { category: 'shopping', type: 'expense' }, // Misc home furnishings
  '5722': { category: 'shopping', type: 'expense' }, // Appliance stores
  '5732': { category: 'shopping', type: 'expense' }, // Electronics stores
  '5733': { category: 'shopping', type: 'expense' }, // Music stores
  '5734': { category: 'shopping', type: 'expense' }, // Computer software
  '5735': { category: 'shopping', type: 'expense' }, // Record stores
  '5912': { category: 'shopping', type: 'expense' }, // Drug stores
  '5921': { category: 'shopping', type: 'expense' }, // Package stores
  '5931': { category: 'shopping', type: 'expense' }, // Used merchandise
  '5932': { category: 'shopping', type: 'expense' }, // Antique shops
  '5933': { category: 'shopping', type: 'expense' }, // Pawn shops
  '5935': { category: 'shopping', type: 'expense' }, // Wrecking yards
  '5937': { category: 'shopping', type: 'expense' }, // Antique reproductions
  '5940': { category: 'shopping', type: 'expense' }, // Bicycle shops
  '5941': { category: 'shopping', type: 'expense' }, // Sporting goods
  '5942': { category: 'shopping', type: 'expense' }, // Bookstores
  '5943': { category: 'shopping', type: 'expense' }, // Stationery stores
  '5944': { category: 'shopping', type: 'expense' }, // Jewelry stores
  '5945': { category: 'shopping', type: 'expense' }, // Hobby/toy shops
  '5946': { category: 'shopping', type: 'expense' }, // Camera shops
  '5947': { category: 'shopping', type: 'expense' }, // Gift shops
  '5948': { category: 'shopping', type: 'expense' }, // Luggage stores
  '5949': { category: 'shopping', type: 'expense' }, // Sewing stores
  '5950': { category: 'shopping', type: 'expense' }, // Glassware stores
  '5960': { category: 'shopping', type: 'expense' }, // Direct marketing
  '5961': { category: 'shopping', type: 'expense' }, // Mail order
  '5962': { category: 'shopping', type: 'expense' }, // Telemarketing
  '5963': { category: 'shopping', type: 'expense' }, // Door-to-door sales
  '5964': { category: 'shopping', type: 'expense' }, // Catalog merchant
  '5965': { category: 'shopping', type: 'expense' }, // Direct marketing combo
  '5966': { category: 'shopping', type: 'expense' }, // Direct marketing outbound
  '5967': { category: 'shopping', type: 'expense' }, // Direct marketing inbound
  '5968': { category: 'shopping', type: 'expense' }, // Direct marketing subscriptions
  '5969': { category: 'shopping', type: 'expense' }, // Direct marketing other
  '5970': { category: 'shopping', type: 'expense' }, // Artist supplies
  '5971': { category: 'shopping', type: 'expense' }, // Art dealers
  '5972': { category: 'shopping', type: 'expense' }, // Stamp/coin stores
  '5973': { category: 'shopping', type: 'expense' }, // Religious goods
  '5975': { category: 'shopping', type: 'expense' }, // Hearing aids
  '5976': { category: 'shopping', type: 'expense' }, // Orthopedic goods
  '5977': { category: 'shopping', type: 'expense' }, // Cosmetics stores
  '5978': { category: 'shopping', type: 'expense' }, // Typewriter stores
  '5983': { category: 'shopping', type: 'expense' }, // Fuel dealers
  '5992': { category: 'shopping', type: 'expense' }, // Florists
  '5993': { category: 'shopping', type: 'expense' }, // Cigar stores
  '5994': { category: 'shopping', type: 'expense' }, // Newsstands
  '5995': { category: 'shopping', type: 'expense' }, // Pet shops
  '5996': { category: 'shopping', type: 'expense' }, // Swimming pools
  '5997': { category: 'shopping', type: 'expense' }, // Electric razor stores
  '5998': { category: 'shopping', type: 'expense' }, // Tent stores
  '5999': { category: 'shopping', type: 'expense' }, // Misc specialty stores

  // Health (5047, 5122, 8011-8099)
  '5047': { category: 'health', type: 'expense' }, // Medical equipment
  '5122': { category: 'health', type: 'expense' }, // Drugs/pharmaceuticals
  '8011': { category: 'health', type: 'expense' }, // Doctors
  '8021': { category: 'health', type: 'expense' }, // Dentists
  '8031': { category: 'health', type: 'expense' }, // Osteopaths
  '8041': { category: 'health', type: 'expense' }, // Chiropractors
  '8042': { category: 'health', type: 'expense' }, // Optometrists
  '8043': { category: 'health', type: 'expense' }, // Opticians
  '8049': { category: 'health', type: 'expense' }, // Podiatrists
  '8050': { category: 'health', type: 'expense' }, // Nursing facilities
  '8062': { category: 'health', type: 'expense' }, // Hospitals
  '8071': { category: 'health', type: 'expense' }, // Medical labs
  '8099': { category: 'health', type: 'expense' }, // Medical services

  // Utilities (4812-4900)
  '4812': { category: 'utilities', type: 'expense' }, // Telecom equipment
  '4813': { category: 'utilities', type: 'expense' }, // Phone services
  '4814': { category: 'utilities', type: 'expense' }, // Fax services
  '4815': { category: 'utilities', type: 'expense' }, // VisaPhone
  '4816': { category: 'utilities', type: 'expense' }, // Computer network
  '4821': { category: 'utilities', type: 'expense' }, // Telegraph services
  '4829': { category: 'utilities', type: 'expense' }, // Money transfer
  '4899': { category: 'utilities', type: 'expense' }, // Cable services
  '4900': { category: 'utilities', type: 'expense' }, // Utilities

  // Education (8211-8299)
  '8211': { category: 'education', type: 'expense' }, // Schools
  '8220': { category: 'education', type: 'expense' }, // Colleges
  '8241': { category: 'education', type: 'expense' }, // Correspondence schools
  '8244': { category: 'education', type: 'expense' }, // Business schools
  '8249': { category: 'education', type: 'expense' }, // Trade schools
  '8299': { category: 'education', type: 'expense' }, // Educational services

  // Income categories (specific MCCs)
  '6010': { category: 'other', type: 'income' }, // Financial institutions - cash
  '6011': { category: 'other', type: 'income' }, // ATM cash disbursement
  '6012': { category: 'other', type: 'income' }, // Financial institutions
  '6051': { category: 'other', type: 'income' }, // Non-financial institutions
  '6211': { category: 'investments', type: 'income' }, // Securities
  '6300': { category: 'other', type: 'income' }, // Insurance
};

/**
 * Get category for a given MCC code
 */
export function getCategoryFromMCC(mccCode: string | number): MCCMapping | null {
  const code = String(mccCode).padStart(4, '0');
  return MCC_RANGES[code] || null;
}

/**
 * Auto-categorize a transaction based on MCC code
 * Falls back to description analysis if MCC not found
 */
export function autoCategorize(
  mccCode?: string | number,
  description?: string,
  amount?: number
): MCCMapping {
  // Try MCC first
  if (mccCode) {
    const mapping = getCategoryFromMCC(mccCode);
    if (mapping) return mapping;
  }

  // If positive amount, likely income
  if (amount && amount > 0) {
    return { category: 'other', type: 'income' };
  }

  // Fallback to description analysis
  if (description) {
    const desc = description.toLowerCase();

    // Food keywords (multilingual)
    if (
      /\b(restaurant|cafe|coffee|food|grocery|supermarket|їжа|продукти|кафе|ресторан|магазин|silpo|atb|novus|fozzy|mcdonalds|kfc|subway|starbucks|пицца|pizza|burger)\b/i.test(
        desc
      )
    ) {
      return { category: 'food', type: 'expense' };
    }

    // Transport keywords
    if (
      /\b(uber|bolt|taxi|таксі|метро|metro|bus|train|fuel|gas|бензин|паливо|parking|парковка|uklon|ukrzal|wog|okko|shell)\b/i.test(
        desc
      )
    ) {
      return { category: 'transport', type: 'expense' };
    }

    // Entertainment
    if (
      /\b(cinema|кіно|movie|netflix|spotify|youtube|steam|game|gaming|concert|театр|theater|museum|музей|multiplex|imax)\b/i.test(
        desc
      )
    ) {
      return { category: 'entertainment', type: 'expense' };
    }

    // Shopping
    if (
      /\b(amazon|rozetka|prom|aliexpress|ebay|shop|store|mall|тц|магазин|покупка|purchase|zara|h&m|mango|reserved|comfy|eldorado|foxtrot)\b/i.test(
        desc
      )
    ) {
      return { category: 'shopping', type: 'expense' };
    }

    // Health
    if (
      /\b(pharmacy|аптека|hospital|лікарня|doctor|доктор|лікар|medical|медичний|clinic|клініка|health|здоров)\b/i.test(
        desc
      )
    ) {
      return { category: 'health', type: 'expense' };
    }

    // Utilities
    if (
      /\b(utility|комунальні|electricity|електрика|water|вода|gas|газ|internet|інтернет|phone|телефон|kyivstar|vodafone|lifecell)\b/i.test(
        desc
      )
    ) {
      return { category: 'utilities', type: 'expense' };
    }

    // Education
    if (
      /\b(university|університет|school|школа|course|курс|education|освіта|udemy|coursera|skillshare)\b/i.test(
        desc
      )
    ) {
      return { category: 'education', type: 'expense' };
    }

    // Income keywords
    if (
      /\b(salary|зарплата|income|дохід|transfer|переказ|refund|повернення|cashback|кешбек)\b/i.test(
        desc
      )
    ) {
      return { category: 'salary', type: 'income' };
    }
  }

  // Default to other expense
  return { category: 'other', type: 'expense' };
}

/**
 * Get all MCC codes for a category
 */
export function getMCCsForCategory(category: string): string[] {
  return Object.entries(MCC_RANGES)
    .filter(([, mapping]) => mapping.category === category)
    .map(([code]) => code);
}

export { MCC_RANGES };
