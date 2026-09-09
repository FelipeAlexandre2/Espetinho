import { MarmitaSizeConfig, MarmitaOption, MarmitaOrder, MarmitaSettings } from '../types';

export const INITIAL_MARMITA_SIZES: MarmitaSizeConfig[] = [
  {
    size: 'P',
    name: 'Marmita Pequena (P)',
    label: 'Pequena (P)',
    price: 16.00,
    weightGrams: 450,
    maxProteins: 1,
    maxSides: 2,
    description: 'Ideal para 1 pessoa. Inclui 1 carne, arroz, feijão, 2 guarnições e salada.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    size: 'M',
    name: 'Marmita Média (M)',
    label: 'Média (M)',
    price: 20.00,
    weightGrams: 650,
    maxProteins: 1,
    maxSides: 3,
    description: 'Tamanho mais pedido. 1 a 2 carnes, arroz, feijão, 3 guarnições e salada.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    size: 'G',
    name: 'Marmita Grande (G)',
    label: 'Grande (G)',
    price: 25.00,
    weightGrams: 850,
    maxProteins: 2,
    maxSides: 4,
    description: 'Porção reforçada. Até 2 carnes generosas, arroz, feijão, 4 guarnições e salada.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    size: 'executiva',
    name: 'Marmita Executiva Premium',
    label: 'Executiva',
    price: 29.90,
    weightGrams: 950,
    maxProteins: 2,
    maxSides: 4,
    description: 'Embalagem especial selada com divisórias. Carnes nobres, guarnições livres e sobremesa inclusa.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  }
];

export const INITIAL_MARMITA_OPTIONS: MarmitaOption[] = [
  // BASES (ARROZ)
  {
    id: 'base-arroz-branco',
    name: 'Arroz Branco Soltinho',
    category: 'base',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Arroz branco tradicional temperado com alho e cebola.'
  },
  {
    id: 'base-arroz-integral',
    name: 'Arroz Integral com Ervas',
    category: 'base',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Arroz integral nutritivo com toque de salsa e azeite.'
  },
  {
    id: 'base-baiao-dois',
    name: 'Baião de Dois da Casa',
    category: 'base',
    isAvailableToday: true,
    extraPrice: 3.50,
    description: 'Feijão fradinho, arroz, carne seca, queijo coalho e coentro.'
  },

  // FEIJÕES
  {
    id: 'feijao-carioca',
    name: 'Feijão Carioca da Casa (Caldo Grosso)',
    category: 'feijao',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Feijão fresquinho bem temperado com alho frito e louro.'
  },
  {
    id: 'feijao-preto',
    name: 'Feijão Preto com Paio e Bacon',
    category: 'feijao',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Feijão preto com pedacinhos de paio artesanal e defumados.'
  },
  {
    id: 'feijao-tropeiro',
    name: 'Feijão Tropeiro Mineiro',
    category: 'feijao',
    isAvailableToday: true,
    extraPrice: 4.00,
    description: 'Feijão com farinha de milho, couve fininha, ovo e torresmo.'
  },

  // PROTEÍNAS / CARNES DO DIA
  {
    id: 'prot-bife-acebolado',
    name: 'Bife Bovino Acebolado',
    category: 'proteina',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Bife macio na chapa com rodelas de cebola dourada.'
  },
  {
    id: 'prot-frango-grelhado',
    name: 'Filé de Frango Grelhado na Brasa',
    category: 'proteina',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Peito de frango suculento marinado no limão e ervas finas.'
  },
  {
    id: 'prot-carne-panela',
    name: 'Carne de Panela com Batatas e Cenoura',
    category: 'proteina',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Carne bovina desfiando com molho encorpado e legumes macios.'
  },
  {
    id: 'prot-linguica-toscana',
    name: 'Linguiça Toscana Grelhada Acebolada',
    category: 'proteina',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Linguiça suculenta assada na brasa com cebolas tostadas.'
  },
  {
    id: 'prot-strogonoff-frango',
    name: 'Strogonoff de Frango Especial',
    category: 'proteina',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Cubos de frango ao molho cremoso com champignon e batata palha.'
  },
  {
    id: 'prot-bisteca-porco',
    name: 'Bisteca Suína Douradinha',
    category: 'proteina',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Bisteca temperada na cachaça e limão, frita no ponto certo.'
  },
  {
    id: 'prot-peixe-empanado',
    name: 'Filé de Peixe Empanado Crocante',
    category: 'proteina',
    isAvailableToday: false,
    extraPrice: 2.00,
    description: 'Filé de tilápia empanado com farinha panko e gomos de limão.'
  },
  {
    id: 'prot-picanha-chapa',
    name: 'Picanha Bovina na Brasa',
    category: 'proteina',
    isAvailableToday: true,
    extraPrice: 6.50,
    description: 'Fatias nobres de picanha grelhadas com sal de parrilla.'
  },

  // GUARNIÇÕES
  {
    id: 'guar-farofa-bacon',
    name: 'Farofa Crocante de Bacon e Alho',
    category: 'guarnicao',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Farinha de mandioca temperada na manteiga com pedaços de bacon.'
  },
  {
    id: 'guar-macarrao-alho',
    name: 'Macarrão Espaguete Alho e Óleo',
    category: 'guarnicao',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Macarrão com alho dourado, azeite extravirgem e salsa.'
  },
  {
    id: 'guar-batata-frita',
    name: 'Batata Frita Crocante',
    category: 'guarnicao',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Batatas palito sequinhas e salpicadas com sal fino.'
  },
  {
    id: 'guar-pure-batata',
    name: 'Purê de Batatas Cremoso',
    category: 'guarnicao',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Purê aveludado feito com manteiga e toque de noz-moscada.'
  },
  {
    id: 'guar-mandioca-frita',
    name: 'Mandioca Frita na Manteiga de Garrafa',
    category: 'guarnicao',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Mandioca cremosa por dentro e crocante por fora.'
  },
  {
    id: 'guar-legumes-vapor',
    name: 'Legumes Salteados no Azeite',
    category: 'guarnicao',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Brócolis, cenoura e abobrinha salteados com alho.'
  },

  // SALADAS
  {
    id: 'sal-vinagrete',
    name: 'Vinagrete Especial da Casa',
    category: 'salada',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Tomate, cebola roxa, pimentão verde e azeite temperado.'
  },
  {
    id: 'sal-maionese-legumes',
    name: 'Salada de Maionese de Batata e Cenoura',
    category: 'salada',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Receita tradicional cremosa com maionese suave e cheiro-verde.'
  },
  {
    id: 'sal-mista-folhas',
    name: 'Salada Mista (Alface, Tomate e Cenoura Ralada)',
    category: 'salada',
    isAvailableToday: true,
    extraPrice: 0,
    description: 'Folhas frescas e crocantes acompanhadas de fatias de tomate.'
  },
  {
    id: 'sal-salpicao',
    name: 'Salpicão de Frango com Batata Palha',
    category: 'salada',
    isAvailableToday: true,
    extraPrice: 2.00,
    description: 'Frango desfiado, milho, ervilha, cenoura e batata palha.'
  },

  // ADICIONAIS
  {
    id: 'adc-ovo-frito',
    name: 'Ovo Frito Estalado com Gema Mole',
    category: 'adicional',
    isAvailableToday: true,
    extraPrice: 3.00,
    description: 'Ovo caipira frito na hora.'
  },
  {
    id: 'adc-torresmo',
    name: 'Porção de Torresmo Crocante',
    category: 'adicional',
    isAvailableToday: true,
    extraPrice: 5.00,
    description: 'Torresmo pururucado bem crocante.'
  },
  {
    id: 'adc-queijo-coalho',
    name: 'Fatia de Queijo Coalho Dourado',
    category: 'adicional',
    isAvailableToday: true,
    extraPrice: 4.00,
    description: 'Queijo coalho tostado na chapa.'
  },
  {
    id: 'adc-bacon-extra',
    name: 'Bacon Crocante em Cubos',
    category: 'adicional',
    isAvailableToday: true,
    extraPrice: 3.50,
    description: 'Cubos dourados de bacon defumado.'
  },
  {
    id: 'adc-carne-extra',
    name: 'Carne Extra (Qualquer Opção do Dia)',
    category: 'adicional',
    isAvailableToday: true,
    extraPrice: 8.00,
    description: 'Adiciona +1 porção inteira de carne na sua marmita.'
  },

  // BEBIDAS
  {
    id: 'beb-coca-lata',
    name: 'Coca-Cola Original 350ml',
    category: 'bebida',
    isAvailableToday: true,
    extraPrice: 6.00,
    description: 'Lata 350ml gelada.'
  },
  {
    id: 'beb-coca-zero-lata',
    name: 'Coca-Cola Sem Açúcar 350ml',
    category: 'bebida',
    isAvailableToday: true,
    extraPrice: 6.00,
    description: 'Lata 350ml gelada.'
  },
  {
    id: 'beb-guarana-lata',
    name: 'Guaraná Antarctica 350ml',
    category: 'bebida',
    isAvailableToday: true,
    extraPrice: 6.00,
    description: 'Lata 350ml gelada.'
  },
  {
    id: 'beb-suco-laranja',
    name: 'Suco Natural de Laranja 500ml',
    category: 'bebida',
    isAvailableToday: true,
    extraPrice: 8.50,
    description: 'Suco 100% da fruta espremido na hora.'
  },
  {
    id: 'beb-suco-maracuja',
    name: 'Suco Natural de Maracujá 500ml',
    category: 'bebida',
    isAvailableToday: true,
    extraPrice: 8.50,
    description: 'Suco natural de maracujá bem gelado.'
  },
  {
    id: 'beb-agua-sem-gas',
    name: 'Água Mineral sem Gás 500ml',
    category: 'bebida',
    isAvailableToday: true,
    extraPrice: 4.00,
    description: 'Garrafa 500ml.'
  },
  {
    id: 'beb-agua-com-gas',
    name: 'Água Mineral com Gás 500ml',
    category: 'bebida',
    isAvailableToday: true,
    extraPrice: 4.50,
    description: 'Garrafa 500ml.'
  }
];

export const INITIAL_MARMITA_ORDERS: MarmitaOrder[] = [
  {
    id: 'marm-ord-001',
    orderNumber: 201,
    customerName: 'Roberto Alves',
    customerPhone: '(11) 98765-1122',
    deliveryType: 'entrega',
    tableOrAddress: 'Av. Paulista, 1000 - Apto 82',
    motoboyName: 'Marcio Express',
    items: [
      {
        id: 'item-marm-1',
        size: 'G',
        sizeName: 'Marmita Grande (G)',
        bases: ['Arroz Branco Soltinho'],
        feijoes: ['Feijão Carioca da Casa (Caldo Grosso)'],
        proteinas: ['Bife Bovino Acebolado', 'Filé de Frango Grelhado na Brasa'],
        guarnicoes: ['Farofa Crocante de Bacon e Alho', 'Batata Frita Crocante', 'Macarrão Espaguete Alho e Óleo'],
        saladas: ['Vinagrete Especial da Casa'],
        adicionais: [
          { name: 'Ovo Frito Estalado com Gema Mole', price: 3.00 }
        ],
        price: 28.00,
        quantity: 1,
        notes: 'Gema do ovo bem mole, por favor!'
      }
    ],
    beverages: [
      { id: 'beb-coca-lata', name: 'Coca-Cola Original 350ml', price: 6.00, quantity: 1 }
    ],
    subtotal: 34.00,
    deliveryFee: 5.00,
    discount: 0,
    total: 39.00,
    paymentMethod: 'pix',
    isPaid: true,
    status: 'saiu_para_entrega',
    notes: 'Tocar o interfone 82.',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'marm-ord-002',
    orderNumber: 202,
    customerName: 'Dra. Camila Nunes',
    customerPhone: '(11) 97654-3344',
    deliveryType: 'balcao',
    tableOrAddress: 'Retirada no Balcão',
    items: [
      {
        id: 'item-marm-2',
        size: 'M',
        sizeName: 'Marmita Média (M)',
        bases: ['Arroz Integral com Ervas'],
        feijoes: ['Feijão Carioca da Casa (Caldo Grosso)'],
        proteinas: ['Carne de Panela com Batatas e Cenoura'],
        guarnicoes: ['Purê de Batatas Cremoso', 'Legumes Salteados no Azeite'],
        saladas: ['Salada Mista (Alface, Tomate e Cenoura Ralada)'],
        adicionais: [],
        price: 20.00,
        quantity: 1,
        notes: 'Pouco sal na salada'
      }
    ],
    beverages: [
      { id: 'beb-suco-laranja', name: 'Suco Natural de Laranja 500ml', price: 8.50, quantity: 1 }
    ],
    subtotal: 28.50,
    deliveryFee: 0,
    discount: 0,
    total: 28.50,
    paymentMethod: 'credito',
    isPaid: true,
    status: 'pronto_embalado',
    notes: 'Cliente aguarda na recepção.',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'marm-ord-003',
    orderNumber: 203,
    customerName: 'Marcos Vinicius (Oficina)',
    customerPhone: '(11) 99123-8899',
    deliveryType: 'entrega',
    tableOrAddress: 'Rua das Indústrias, 450 - Oficina AutoCar',
    items: [
      {
        id: 'item-marm-3',
        size: 'executiva',
        sizeName: 'Marmita Executiva Premium',
        bases: ['Baião de Dois da Casa'],
        feijoes: ['Feijão Preto com Paio e Bacon'],
        proteinas: ['Picanha Bovina na Brasa', 'Linguiça Toscana Grelhada Acebolada'],
        guarnicoes: ['Farofa Crocante de Bacon e Alho', 'Mandioca Frita na Manteiga de Garrafa', 'Batata Frita Crocante'],
        saladas: ['Salada de Maionese de Batata e Cenoura', 'Vinagrete Especial da Casa'],
        adicionais: [
          { name: 'Porção de Torresmo Crocante', price: 5.00 }
        ],
        price: 44.90,
        quantity: 1,
        notes: 'Picanha ao ponto'
      }
    ],
    beverages: [
      { id: 'beb-guarana-lata', name: 'Guaraná Antarctica 350ml', price: 6.00, quantity: 2 }
    ],
    subtotal: 56.90,
    deliveryFee: 6.00,
    discount: 0,
    total: 62.90,
    paymentMethod: 'dinheiro',
    changeFor: 100.00,
    isPaid: false,
    status: 'em_montagem',
    notes: 'Levar troco para R$ 100,00.',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  }
];

export const INITIAL_MARMITA_SETTINGS: MarmitaSettings = {
  restaurantName: 'MARMITARIA & BRASA DO CHEFE',
  subtitle: 'Marmitex Executivo & Comida Caseira na Brasa',
  phoneWhatsapp: '(11) 98765-4321',
  address: 'Rua da Brasa, 100 - Centro',
  defaultDeliveryFee: 5.00,
  pixKey: '12.345.678/0001-90',
  pixKeyType: 'cnpj',
  autoPrintOnCreate: true
};
