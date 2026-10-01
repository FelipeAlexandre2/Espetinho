import { MarmitaOrder, MarmitaItem, MarmitaSettings } from '../types';

export type MarmitaLabelMode = 'tampa' | 'comanda';
export type MarmitaPaperWidth = '80mm' | '58mm';
export type MarmitaFontSize = 'normal' | 'grande';

export interface MarmitaPrintOptions {
  mode: MarmitaLabelMode;
  paperWidth: MarmitaPaperWidth;
  fontSize: MarmitaFontSize;
  singleItemIndex?: number | 'all';
}

/**
 * Generates high-contrast, pure black-and-white HTML for thermal label printers (80mm & 58mm).
 * Designed for extreme legibility in hot/smoky kitchen environments and fast packing.
 */
export function generateMarmitaLabelHtml(
  order: MarmitaOrder,
  settings: MarmitaSettings,
  options: MarmitaPrintOptions
): string {
  const { mode, paperWidth, fontSize, singleItemIndex = 'all' } = options;
  const isLarge = fontSize === 'grande';

  const dateObj = new Date(order.createdAt);
  const formattedDate = dateObj.toLocaleDateString('pt-BR');
  const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const widthStyle =
    paperWidth === '58mm'
      ? 'width: 50mm; max-width: 54mm; margin: 0 auto;'
      : 'width: 74mm; max-width: 78mm; margin: 0 auto;';

  const baseFontSize = paperWidth === '58mm' ? (isLarge ? '13px' : '11px') : (isLarge ? '15px' : '13px');
  const titleFontSize = paperWidth === '58mm' ? (isLarge ? '18px' : '15px') : (isLarge ? '22px' : '18px');
  const meatFontSize = paperWidth === '58mm' ? (isLarge ? '15px' : '13px') : (isLarge ? '17px' : '15px');
  const sizeBadgeFontSize = paperWidth === '58mm' ? (isLarge ? '16px' : '14px') : (isLarge ? '19px' : '16px');

  // Filter items if user chose a specific marmita lid label
  const itemsToPrint =
    mode === 'tampa' && typeof singleItemIndex === 'number' && order.items[singleItemIndex]
      ? [order.items[singleItemIndex]]
      : order.items;

  // Render items (Marmitas)
  const itemsHtml = itemsToPrint
    .map((item, idx) => {
      const realIndex = typeof singleItemIndex === 'number' ? singleItemIndex : idx;
      const marmitaNumberText = order.items.length > 1 ? `MARMITA ${realIndex + 1}/${order.items.length}` : 'MARMITA';

      return `
        <div style="margin-bottom: 10px; padding: 6px; border: 2px solid #000000; border-radius: 4px; background: #ffffff;">
          <!-- Marmita Header Badge -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-size: ${sizeBadgeFontSize}; font-weight: 900; text-transform: uppercase;">
              🍱 ${item.quantity}x ${item.sizeName.toUpperCase()}
            </span>
            <span style="font-size: ${baseFontSize}; font-weight: 900; background: #000000; color: #ffffff; padding: 2px 6px; border-radius: 2px;">
              ${marmitaNumberText}
            </span>
          </div>

          <!-- CARNES (DESTAQUE ABSOLUTO) -->
          <div style="background: #f1f5f9; border-left: 4px solid #000000; padding: 4px 6px; margin-bottom: 6px;">
            <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #000000; letter-spacing: 0.5px;">
              🥩 CARNES / PROTEÍNAS:
            </div>
            <div style="font-size: ${meatFontSize}; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.25;">
              ${item.proteinas.length > 0 ? item.proteinas.join(' + ') : 'SEM CARNE ESPECIFICADA'}
            </div>
          </div>

          <!-- BASE & FEIJAO -->
          <div style="font-size: ${baseFontSize}; margin-bottom: 4px; line-height: 1.3;">
            <strong>🍚 Base:</strong> ${item.bases.join(', ')} | <strong>Feijão:</strong> ${item.feijoes.join(', ')}
          </div>

          <!-- GUARNIÇÕES -->
          ${
            item.guarnicoes.length > 0
              ? `<div style="font-size: ${baseFontSize}; margin-bottom: 4px; line-height: 1.3;">
                  <strong>🥗 Guarnição:</strong> ${item.guarnicoes.join(', ')}
                </div>`
              : ''
          }

          <!-- SALADA -->
          ${
            item.saladas.length > 0
              ? `<div style="font-size: ${baseFontSize}; margin-bottom: 4px; line-height: 1.3;">
                  <strong>🥬 Salada:</strong> ${item.saladas.join(', ')}
                </div>`
              : ''
          }

          <!-- ADICIONAIS / EXTRAS -->
          ${
            item.adicionais.length > 0
              ? `<div style="font-size: ${baseFontSize}; margin-bottom: 4px; line-height: 1.3;">
                  <strong>⭐ Extras:</strong> ${item.adicionais.map((a) => a.name).join(', ')}
                </div>`
              : ''
          }

          <!-- OBSERVAÇÕES DO CLIENTE (ALERTA DESTACADO) -->
          ${
            item.notes
              ? `<div style="margin-top: 6px; padding: 5px; border: 2px dashed #000000; background: #fffbeb; font-size: ${meatFontSize}; font-weight: 900; color: #000000;">
                  ⚠️ OBS: ${item.notes.toUpperCase()}
                </div>`
              : ''
          }
        </div>
      `;
    })
    .join('');

  // Mode 1: TAMPA DA MARMITA (Adesivo para tampa - Foco nos ingredientes e identificação rápida)
  if (mode === 'tampa') {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Etiqueta Tampa #${order.orderNumber} - ${order.customerName}</title>
  <style>
    @page { margin: 0; size: auto; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      padding: 6px 4px;
      line-height: 1.3;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .etiqueta-container {
      ${widthStyle}
    }
  </style>
</head>
<body>
  <div class="etiqueta-container">
    <!-- Header Restaurante -->
    <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 4px; margin-bottom: 6px;">
      <div style="font-size: ${titleFontSize}; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
        ${settings.restaurantName || 'MARESIA MARMITARIA'}
      </div>
      <div style="font-size: ${baseFontSize}; font-weight: bold;">
        Tel/WhatsApp: ${settings.phoneWhatsapp}
      </div>
    </div>

    <!-- Tarja do Pedido & Cliente -->
    <div style="background: #000000; color: #ffffff; padding: 4px 6px; text-align: center; border-radius: 4px; margin-bottom: 6px;">
      <div style="font-size: ${titleFontSize}; font-weight: 900; letter-spacing: 1px;">
        PEDIDO #${order.orderNumber}
      </div>
      <div style="font-size: ${baseFontSize}; font-weight: 900; text-transform: uppercase;">
        CLIENTE: ${order.customerName}
      </div>
      <div style="font-size: 11px; font-weight: bold; opacity: 0.9;">
        ${order.deliveryType.toUpperCase()} • ${formattedDate} ${formattedTime}
      </div>
    </div>

    <!-- Lista de Itens -->
    ${itemsHtml}

    ${
      (order.generalNotes || order.notes)
        ? `<div style="padding: 4px; border: 2px dashed #000000; font-size: ${baseFontSize}; font-weight: 900; margin-bottom: 6px;">
            ⚠️ OBS GERAL: ${(order.generalNotes || order.notes || '').toUpperCase()}
          </div>`
        : ''
    }

    <!-- Rodapé -->
    <div style="text-align: center; font-size: 10px; font-weight: bold; border-top: 1px dashed #000000; padding-top: 4px;">
      🔥 Feito com Carinho • Bom Apetite! 🔥
    </div>
  </div>
</body>
</html>
    `;
  }

  // Mode 2: COMANDA COMPLETA DE ENTREGA (Para Motoboy, Caixa e Embalagem Final)
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comanda Entrega #${order.orderNumber} - ${order.customerName}</title>
  <style>
    @page { margin: 0; size: auto; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      padding: 6px 4px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .etiqueta-container {
      ${widthStyle}
    }
    .divider {
      border-top: 2px solid #000000;
      margin: 6px 0;
    }
    .divider-dashed {
      border-top: 1px dashed #000000;
      margin: 6px 0;
    }
    .flex-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="etiqueta-container">
    <!-- Header Restaurante -->
    <div style="text-align: center; padding-bottom: 4px;">
      <div style="font-size: ${titleFontSize}; font-weight: 900; text-transform: uppercase;">
        ${settings.restaurantName || 'MARESIA MARMITARIA'}
      </div>
      <div style="font-size: 11px; font-weight: bold;">${settings.subtitle || 'O Melhor Almoço da Região'}</div>
      <div style="font-size: ${baseFontSize}; font-weight: bold;">Tel/WhatsApp: ${settings.phoneWhatsapp}</div>
    </div>

    <div class="divider"></div>

    <!-- Pedido & Tipo de Entrega -->
    <div style="background: #000000; color: #ffffff; padding: 6px; text-align: center; border-radius: 4px; margin-bottom: 6px;">
      <div style="font-size: ${titleFontSize}; font-weight: 900;">
        PEDIDO #${order.orderNumber}
      </div>
      <div style="font-size: ${baseFontSize}; font-weight: 900; text-transform: uppercase;">
        ${order.deliveryType === 'entrega' ? '🛵 ENTREGA (MOTOBOY)' : order.deliveryType === 'retirada' ? '🏬 RETIRADA NO BALCÃO' : '🍽️ CONSUMO NO LOCAL'}
      </div>
    </div>

    <!-- Dados do Cliente e Endereço -->
    <div style="border: 2px solid #000000; border-radius: 4px; padding: 6px; margin-bottom: 8px;">
      <div style="font-size: ${meatFontSize}; font-weight: 900; text-transform: uppercase;">
        👤 CLIENTE: ${order.customerName}
      </div>
      ${
        order.customerPhone
          ? `<div style="font-size: ${baseFontSize}; font-weight: bold; margin-top: 2px;">
              📞 TELEFONE: ${order.customerPhone}
            </div>`
          : ''
      }
      ${
        order.tableOrAddress
          ? `<div style="font-size: ${meatFontSize}; font-weight: 900; margin-top: 4px; background: #f8fafc; border-left: 3px solid #000; padding: 3px 5px;">
              📍 ENDEREÇO:<br/>${order.tableOrAddress.toUpperCase()}
            </div>`
          : ''
      }
      <div style="font-size: 11px; font-weight: bold; color: #334155; margin-top: 4px;">
        Emissão: ${formattedDate} às ${formattedTime}
      </div>
    </div>

    <!-- Itens do Pedido (Marmitas) -->
    <div style="font-size: ${baseFontSize}; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; border-bottom: 2px solid #000; padding-bottom: 2px;">
      📦 ITENS DO PEDIDO (${order.items.length} ${order.items.length === 1 ? 'Marmita' : 'Marmitas'}):
    </div>

    ${itemsHtml}

    <!-- Bebidas -->
    ${
      order.beverages.length > 0
        ? `<div style="margin-bottom: 8px; padding: 6px; border: 2px solid #000000; border-radius: 4px;">
            <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 3px;">
              🥤 BEBIDAS:
            </div>
            ${order.beverages
              .map(
                (b) => `
              <div class="flex-between" style="font-size: ${meatFontSize}; font-weight: 900;">
                <span>• ${b.quantity}x ${b.name.toUpperCase()}</span>
                <span>R$ ${(b.price * b.quantity).toFixed(2).replace('.', ',')}</span>
              </div>
            `
              )
              .join('')}
          </div>`
        : ''
    }

    <!-- Observações Gerais -->
    ${
      (order.generalNotes || order.notes)
        ? `<div style="padding: 6px; border: 2px dashed #000000; font-size: ${meatFontSize}; font-weight: 900; margin-bottom: 8px; background: #fffbeb;">
            ⚠️ OBS GERAL: ${(order.generalNotes || order.notes || '').toUpperCase()}
          </div>`
        : ''
    }

    <div class="divider"></div>

    <!-- Valores & Totais Financeiros -->
    <div style="border: 2px solid #000000; border-radius: 4px; padding: 6px; margin-bottom: 8px;">
      <div class="flex-between" style="font-size: ${baseFontSize}; font-weight: bold;">
        <span>Subtotal das Marmitas:</span>
        <span>R$ ${order.subtotal.toFixed(2).replace('.', ',')}</span>
      </div>

      ${
        order.deliveryFee > 0
          ? `<div class="flex-between" style="font-size: ${baseFontSize}; font-weight: bold;">
              <span>Taxa de Entrega:</span>
              <span>R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}</span>
            </div>`
          : ''
      }

      ${
        order.discount > 0
          ? `<div class="flex-between" style="font-size: ${baseFontSize}; font-weight: bold;">
              <span>Desconto:</span>
              <span>- R$ ${order.discount.toFixed(2).replace('.', ',')}</span>
            </div>`
          : ''
      }

      <div class="divider-dashed"></div>

      <div class="flex-between" style="font-size: ${titleFontSize}; font-weight: 900;">
        <span>TOTAL A PAGAR:</span>
        <span>R$ ${order.total.toFixed(2).replace('.', ',')}</span>
      </div>

      <div style="margin-top: 6px; padding: 4px; background: #000000; color: #ffffff; text-align: center; border-radius: 2px;">
        <span style="font-size: ${baseFontSize}; font-weight: 900; text-transform: uppercase;">
          PAGAMENTO: ${order.paymentMethod.toUpperCase()} (${order.isPaid ? '✅ PAGO' : '⚠️ PAGAR NA ENTREGA'})
        </span>
        ${
          order.changeFor
            ? `<div style="font-size: ${baseFontSize}; font-weight: 900; color: #fde047;">
                LEVAR TROCO PARA R$ ${order.changeFor}
              </div>`
            : ''
        }
      </div>
    </div>

    <!-- Rodapé -->
    <div style="text-align: center; font-size: 10px; font-weight: bold; border-top: 1px dashed #000; padding-top: 6px;">
      ${settings.footerMessage || 'Obrigado pela preferência! Bom almoço!'}
      <div style="font-size: 8px; color: #555; margin-top: 2px;">
        Maresia Espetinho & Marmitaria • Gestão de Pedidos
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Direct thermal print using an isolated iframe for 100% sharp output without printing browser page elements.
 */
export function printMarmitaThermalDirect(
  order: MarmitaOrder,
  settings: MarmitaSettings,
  options: MarmitaPrintOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const existingIframe = document.getElementById('printable-marmita-frame');
      if (existingIframe) {
        existingIframe.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'printable-marmita-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';

      document.body.appendChild(iframe);

      const html = generateMarmitaLabelHtml(order, settings, options);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) {
        window.print();
        resolve(true);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      setTimeout(() => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } else {
            window.print();
          }
          resolve(true);
        } catch (err) {
          console.warn('Fallback para window.print padrão:', err);
          window.print();
          resolve(true);
        } finally {
          setTimeout(() => {
            iframe.remove();
          }, 3000);
        }
      }, 350);
    } catch (e) {
      console.error('Erro na impressão direta de marmita:', e);
      window.print();
      resolve(true);
    }
  });
}

/**
 * Formats WhatsApp text for the customer or motoboy
 */
export function formatMarmitaWhatsAppText(order: MarmitaOrder, settings: MarmitaSettings): string {
  const itemsSummary = order.items
    .map((item, idx) => {
      const count = order.items.length > 1 ? `[Marmita ${idx + 1}/${order.items.length}] ` : '';
      const proteinas = item.proteinas.join(' + ');
      const bases = `${item.bases.join(', ')} / ${item.feijoes.join(', ')}`;
      const guarnicoes = item.guarnicoes.length > 0 ? `\n   • Guarnição: ${item.guarnicoes.join(', ')}` : '';
      const saladas = item.saladas.length > 0 ? `\n   • Salada: ${item.saladas.join(', ')}` : '';
      const adicionais = item.adicionais.length > 0 ? `\n   • Extras: ${item.adicionais.map((a) => a.name).join(', ')}` : '';
      const obs = item.notes ? `\n   • ⚠️ Obs: ${item.notes}` : '';

      return `🍱 *${count}${item.quantity}x Marmita ${item.sizeName.toUpperCase()}*\n   • *Carnes:* ${proteinas}\n   • Base: ${bases}${guarnicoes}${saladas}${adicionais}${obs}`;
    })
    .join('\n\n');

  const beveragesSummary =
    order.beverages.length > 0
      ? `\n🥤 *Bebidas:*\n` + order.beverages.map((b) => `   • ${b.quantity}x ${b.name}`).join('\n')
      : '';

  const address = order.tableOrAddress ? `\n📍 *Endereço:* ${order.tableOrAddress}` : '';
  const notesText = order.generalNotes || order.notes;
  const notes = notesText ? `\n⚠️ *Obs Geral:* ${notesText}` : '';
  const troco = order.changeFor ? ` (Troco para R$ ${order.changeFor})` : '';

  return `🍱 *${settings.restaurantName || 'Maresia Espetinho & Marmitaria'}*\n*PEDIDO #${order.orderNumber}* (${order.deliveryType.toUpperCase()})\n\n👤 *Cliente:* ${order.customerName}${address}\n\n${itemsSummary}${beveragesSummary}${notes}\n\n💰 *Total:* R$ ${order.total.toFixed(2).replace('.', ',')} (${order.paymentMethod.toUpperCase()}${order.isPaid ? ' - PAGO' : ' - PAGAR NA ENTREGA'}${troco})\n\nObrigado pela preferência! Dúvidas estamos à disposição! 🛵💨`;
}
