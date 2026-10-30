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
 * Checks if a category is strictly for skewers (espetinhos).
 */
export const isSkewerCategory = (category?: string | null): boolean => {
  if (!category) return false;
  const cat = category.toLowerCase().trim();
  return (
    cat === 'espetos' ||
    cat === 'espetos_tradicionais' ||
    cat === 'espetos_especiais' ||
    cat === 'espetinho' ||
    cat === 'espetinhos'
  );
};

/**
 * Checks if a product is strictly a skewer (espetinho).
 * Porções, lanches, pastéis, batatas recheadas, caldos, pratos executivos,
 * acompanhamentos, marmitas e bebidas NUNCA são espetinhos.
 */
export const isSkewerProduct = (
  product: Product | { category?: string; name?: string } | null | undefined
): boolean => {
  if (!product) return false;
  if (isBeverageProduct(product)) return false;

  const cat = (product.category || '').toLowerCase().trim();
  const name = (product.name || '').toLowerCase().trim();

  // Categorias estritamente NÃO-espetos (mesmo que tenham carne no nome como picanha ou alcatra)
  const nonSkewerCategories = [
    'bebidas', 'bebida',
    'porcoes', 'porções', 'porcao', 'porção',
    'lanches', 'lanche',
    'pasteis', 'pastéis', 'pastel',
    'batatas_recheadas', 'batatas', 'batata',
    'caldos', 'caldo',
    'pratos_executivos', 'pratos',
    'adicionais', 'adicional',
    'acompanhamentos',
    'sobremesas', 'sobremesa',
    'marmitaria', 'marmitas', 'marmita'
  ];

  if (nonSkewerCategories.some((c) => cat === c || cat.startsWith(c))) {
    return false;
  }

  // Verifica categoria de espetos
  if (isSkewerCategory(cat)) {
    return true;
  }

  // Se a categoria for genérica ou vazia, confere se o nome é explicitamente um espeto
  if (
    name.startsWith('espeto ') ||
    name.startsWith('espetinho ') ||
    name.includes('espeto ') ||
    name.includes('espetinho ')
  ) {
    return true;
  }

  return false;
};

/**
 * Checks if a product is a skewer (espetinho) that requires meat doneness (Ponto da Carne).
 * REGRA: Essa opção deve aparecer SOMENTE nos espetinhos.
 * Não aparece para porções, lanches, pastéis, batatas, caldos, adicionais ou bebidas.
 * Também não aparece para itens que não são de carne (queijo coalho, pão de alho, doces).
 */
export const isSkewerOrMeatProduct = (
  product: Product | { category?: string; name?: string; requiresMeatPoint?: boolean } | null | undefined
): boolean => {
  if (!product) return false;

  // 1. Deve ser ESTRITAMENTE um espetinho
  if (!isSkewerProduct(product)) {
    return false;
  }

  const name = (product.name || '').toLowerCase().trim();

  // Combos e acompanhamentos podem estar na categoria legada de espetos.
  if (name.startsWith('adicional ') || name.startsWith('jantinha ') || name.includes('farofa') || name.includes('arroz') || name.includes('vinagrete') || name.includes('mandioca') || name.includes('creme de alho')) return false;

  // 2. Itens que não são carne (queijo coalho, pão de alho, doces, vegetariano) não possuem ponto de carne
  if (
    name.includes('queijo coalho') ||
    (name.includes('queijo') && !name.includes('carne')) ||
    name.includes('pão de alho') ||
    name.includes('pao de alho') ||
    name.includes('doce') ||
    name.includes('morango') ||
    name.includes('brigadeiro') ||
    name.includes('vegetariano')
  ) {
    return false;
  }

  return true;
};

