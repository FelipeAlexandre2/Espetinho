import { Product } from '../types';

/**
 * Checks if a product is a beverage (bebida).
 * Beverages NEVER require meat point or grill customization.
 */
export const isBeverageProduct = (
  product: Product | { category?: string; name?: string; unit?: string } | null | undefined
): boolean => {
  if (!product) return false;
  const cat = (product.category || '').toLowerCase().trim();
  const name = (product.name || '').toLowerCase().trim();
  const unit = (product.unit || '').toLowerCase().trim();

  if (cat === 'bebidas' || cat === 'bebida' || cat.includes('bebida')) {
    return true;
  }

  if (unit === 'lata' || unit === 'garrafa') {
    return true;
  }

  // Keywords indicating beverage
  const beverageKeywords = [
    'cerveja', 'refrigerante', 'refri', 'água', 'agua', 'suco', 'chopp', 'chope',
    'heineken', 'coca', 'guaraná', 'guarana', 'fanta', 'sprite', 'skol', 'brahma',
    'amstel', 'original', 'red bull', 'energético', 'energetico', 'tônica', 'tonica',
    'long neck', 'h2oh', 'del valle', 'matte', 'mate leão', 'aquarius', 'ice tea'
  ];

  return beverageKeywords.some((kw) => name.includes(kw));
};

/**
 * Checks if a product is a skewer (espetinho / espeto) or grilled meat item that requires meat doneness selection.
 */
export const isSkewerOrMeatProduct = (
  product: Product | null | undefined
): boolean => {
  if (!product) return false;
  // If it is a beverage, it is NEVER a skewer/meat
  if (isBeverageProduct(product)) return false;

  const cat = (product.category || '').toLowerCase().trim();
  const name = (product.name || '').toLowerCase().trim();

  // Skewer categories
  if (
    cat === 'espetos' ||
    cat === 'espetos_tradicionais' ||
    cat === 'espetos_especiais' ||
    cat.includes('espet')
  ) {
    return true;
  }

  // Skewer names
  if (
    name.includes('espet') ||
    name.includes('jantinha') ||
    name.includes('kafta') ||
    name.includes('medalhão') ||
    name.includes('medalhao') ||
    name.includes('picanha') ||
    name.includes('alcatra') ||
    name.includes('contra filé') ||
    name.includes('contra file') ||
    name.includes('maminha') ||
    name.includes('fraldinha') ||
    name.includes('cupim') ||
    name.includes('ancho') ||
    name.includes('chorizo')
  ) {
    return true;
  }

  // If explicitly flagged and not a beverage or non-meat side dish
  if (
    product.requiresMeatPoint &&
    cat !== 'bebidas' &&
    cat !== 'adicionais' &&
    cat !== 'acompanhamentos' &&
    cat !== 'sobremesas'
  ) {
    return true;
  }

  return false;
};
