import { Order, ReceiptSettings, ReceiptPaperWidth, ReceiptType, DEFAULT_RECEIPT_SETTINGS } from '../types';

const RECEIPT_SETTINGS_STORAGE_KEY = 'espetinho_receipt_settings_v1';

export function getReceiptSettings(): ReceiptSettings {
  try {
    const raw = localStorage.getItem(RECEIPT_SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_RECEIPT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Erro ao ler configurações de comprovante:', err);
  }
  return DEFAULT_RECEIPT_SETTINGS;
}

export function saveReceiptSettings(settings: ReceiptSettings): void {
  try {
    localStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Erro ao salvar configurações de comprovante:', err);
  }
}

/**
 * Generates self-contained, standalone HTML for printing across any device (mobile or desktop).
 */
export function generateReceiptHtml(
  order: Order,
  settings: ReceiptSettings = getReceiptSettings(),
  type: ReceiptType = 'cliente',
  paperWidth: ReceiptPaperWidth = '80mm'
): string {
  const dateObj = new Date(order.createdAt);
  const formattedDate = dateObj.toLocaleDateString('pt-BR');
  const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const isKitchen = type === 'cozinha';
  const isPreCheck = type === 'pre_conta';

  const widthStyle =
    paperWidth === '58mm'
      ? 'width: 48mm; max-width: 54mm; font-size: 11px; margin: 0 auto;'
      : paperWidth === '80mm'
      ? 'width: 72mm; max-width: 78mm; font-size: 13px; margin: 0 auto;'
      : 'width: 100%; max-width: 450px; font-size: 13px; margin: 0 auto;';

  const typeHeader = isKitchen
    ? '🔥 COMANDA DE COZINHA / GRELHA 🔥'
    : isPreCheck
    ? '📄 CONFERÊNCIA DE MESA / PRÉ-CONTA'
    : '*** COMPROVANTE NÃO FISCAL ***';

  const itemsHtml = order.items
    .map((item) => {
      const meatPointLabel = item.meatPoint
        ? item.meatPoint === 'mal_passada'
          ? 'MAL PASSADA'
          : item.meatPoint === 'ao_ponto'
          ? 'AO PONTO'
          : 'BEM PASSADA'
        : null;

      const itemTotalFormatted = (item.price * item.quantity).toFixed(2).replace('.', ',');

      return `
        <div style="margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #0f172a;">
            <span style="font-size: ${isKitchen ? '14px' : 'inherit'};">
              ${item.quantity}x ${item.productName}
            </span>
            ${!isKitchen ? `<span>R$ ${itemTotalFormatted}</span>` : ''}
          </div>
          ${
            meatPointLabel
              ? `<div style="font-weight: 900; color: #b45309; padding-left: 8px; font-size: 12px;">
                  ▸ PONTO: ${meatPointLabel}
                </div>`
              : ''
          }
          ${
            item.notes
              ? `<div style="font-style: italic; color: #475569; padding-left: 8px; font-size: 11px;">
                  * Obs: ${item.notes}
                </div>`
              : ''
          }
        </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprovante #${order.orderNumber} - ${order.tableOrCustomer}</title>
  <style>
    @page {
      margin: 0;
      size: auto;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #ffffff;
      color: #000000;
      font-family: 'Courier New', Courier, monospace;
      padding: 8px 6px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt-container {
      ${widthStyle}
      padding: 4px 2px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .bolder { font-weight: 900; }
    .divider {
      border-top: 1px dashed #000000;
      margin: 8px 0;
    }
    .divider-double {
      border-top: 2px dashed #000000;
      margin: 8px 0;
    }
    .flex-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .badge {
      font-size: 10px;
      font-weight: bold;
      padding: 2px 4px;
      text-align: center;
      border: 1px solid #000000;
      margin: 4px 0;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="text-center">
      <div class="header-title">${settings.restaurantName || 'ESPETINHO DO CHEFE'}</div>
      ${settings.subtitle ? `<div style="font-size: 11px;">${settings.subtitle}</div>` : ''}
      ${settings.address ? `<div style="font-size: 10px;">${settings.address}</div>` : ''}
      ${settings.phone ? `<div style="font-size: 10px;">WhatsApp/Tel: ${settings.phone}</div>` : ''}
      ${settings.cnpj ? `<div style="font-size: 10px;">CNPJ: ${settings.cnpj}</div>` : ''}
      <div class="badge">${typeHeader}</div>
    </div>

    <div class="divider"></div>

    <!-- Order & Table Info -->
    <div class="flex-between bold" style="font-size: ${isKitchen ? '15px' : '13px'};">
      <span>PEDIDO #${order.orderNumber}</span>
      <span style="text-transform: uppercase;">${order.tableOrCustomer}</span>
    </div>

    <div class="flex-between" style="font-size: 10px; margin-top: 2px;">
      <span>Data: ${formattedDate}</span>
      <span>Hora: ${formattedTime}</span>
    </div>

    ${
      order.notes
        ? `<div style="font-size: 11px; margin-top: 4px; padding: 2px; border: 1px dashed #64748b;">
            <strong>Obs Geral:</strong> ${order.notes}
          </div>`
        : ''
    }

    <div class="divider-double"></div>

    <!-- Items Header -->
    <div class="flex-between bold" style="font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">
      <span>Qtd Descrição</span>
      ${!isKitchen ? '<span>Total</span>' : ''}
    </div>

    <!-- Items List -->
    <div style="margin: 4px 0;">
      ${itemsHtml}
    </div>

    ${
      !isKitchen
        ? `
      <div class="divider"></div>

      <!-- Financial Totals -->
      <div style="font-size: 11px;">
        <div class="flex-between">
          <span>Subtotal Itens:</span>
          <span>R$ ${order.subtotal.toFixed(2).replace('.', ',')}</span>
        </div>

        ${
          order.serviceFee > 0
            ? `<div class="flex-between">
                <span>Taxa de Serviço:</span>
                <span>R$ ${order.serviceFee.toFixed(2).replace('.', ',')}</span>
              </div>`
            : ''
        }

        ${
          order.discount > 0
            ? `<div class="flex-between" style="font-weight: bold;">
                <span>Desconto Especial:</span>
                <span>- R$ ${order.discount.toFixed(2).replace('.', ',')}</span>
              </div>`
            : ''
        }

        <div class="divider"></div>

        <div class="flex-between bolder" style="font-size: 15px; margin: 4px 0;">
          <span>TOTAL A PAGAR:</span>
          <span>R$ ${order.total.toFixed(2).replace('.', ',')}</span>
        </div>

        <div class="flex-between" style="font-size: 11px; margin-top: 4px;">
          <span>Forma de Pagamento:</span>
          <span class="bold" style="text-transform: uppercase;">${order.paymentMethod || 'Não Definido'}</span>
        </div>

        <div class="flex-between" style="font-size: 11px;">
          <span>Status do Pagamento:</span>
          <span class="bold">${order.isPaid ? 'PAGO / LIQUIDADO' : 'PENDENTE'}</span>
        </div>
      </div>
    `
        : ''
    }

    <div class="divider-double"></div>

    <!-- Footer -->
    <div class="text-center" style="font-size: 10px; margin-top: 6px;">
      ${
        isKitchen
          ? '<div class="bolder" style="font-size: 12px;">🔥 AGILIDADE NA BRASA! 🔥</div>'
          : `<div>${settings.footerMessage || 'Obrigado pela preferência! Volte sempre 🔥'}</div>`
      }
      <div style="font-size: 8px; color: #64748b; margin-top: 4px;">
        Sistema de Gestão & KDS Espetinho do Chefe
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      // Auto trigger print if opened directly in window
      if (window.location.search.includes('autoprint=true')) {
        setTimeout(function() {
          window.print();
        }, 200);
      }
    });
  </script>
</body>
</html>
  `.trim();
}

/**
 * Prints the receipt directly using an isolated invisible iframe to avoid any parent page CSS/layout distortion on PC or Mobile.
 */
export function printReceiptDirect(
  order: Order,
  settings: ReceiptSettings = getReceiptSettings(),
  type: ReceiptType = 'cliente',
  paperWidth: ReceiptPaperWidth = '80mm'
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const existingIframe = document.getElementById('printable-receipt-frame');
      if (existingIframe) {
        existingIframe.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'printable-receipt-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';

      document.body.appendChild(iframe);

      const html = generateReceiptHtml(order, settings, type, paperWidth);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) {
        // Fallback to standard window.print()
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
      console.error('Erro na impressão direta:', e);
      window.print();
      resolve(true);
    }
  });
}

/**
 * Opens a clean printable receipt tab/window, perfect for mobile phones or when iframe printing is blocked.
 */
export function openReceiptInNewWindow(
  order: Order,
  settings: ReceiptSettings = getReceiptSettings(),
  type: ReceiptType = 'cliente',
  paperWidth: ReceiptPaperWidth = '80mm'
): void {
  const html = generateReceiptHtml(order, settings, type, paperWidth);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  } else {
    // If popup blocker intervened, use direct print
    printReceiptDirect(order, settings, type, paperWidth);
  }
}

/**
 * Formats receipt as plain WhatsApp text for one-touch sending.
 */
export function formatReceiptWhatsAppText(
  order: Order,
  settings: ReceiptSettings = getReceiptSettings(),
  type: ReceiptType = 'cliente'
): string {
  const dateObj = new Date(order.createdAt);
  const formattedDate = dateObj.toLocaleDateString('pt-BR');
  const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const isKitchen = type === 'cozinha';

  let text = `🔥 *${settings.restaurantName || 'ESPETINHO DO CHEFE'}* 🔥\n`;
  if (settings.subtitle) text += `_${settings.subtitle}_\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📋 *PEDIDO #${order.orderNumber}* (${order.tableOrCustomer})\n`;
  text += `📅 ${formattedDate} às ${formattedTime}\n`;
  if (order.notes) text += `💬 *Obs:* ${order.notes}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*ITENS DO PEDIDO:*\n`;

  order.items.forEach((item) => {
    const totalItem = (item.price * item.quantity).toFixed(2).replace('.', ',');
    text += `▪️ *${item.quantity}x* ${item.productName}`;
    if (!isKitchen) text += ` - R$ ${totalItem}`;
    text += `\n`;

    if (item.meatPoint) {
      const pt =
        item.meatPoint === 'mal_passada'
          ? 'MAL PASSADA'
          : item.meatPoint === 'ao_ponto'
          ? 'AO PONTO'
          : 'BEM PASSADA';
      text += `   ↳ Ponto: *${pt}*\n`;
    }
    if (item.notes) {
      text += `   ↳ Obs: _${item.notes}_\n`;
    }
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;

  if (!isKitchen) {
    text += `💵 *Subtotal:* R$ ${order.subtotal.toFixed(2).replace('.', ',')}\n`;
    if (order.serviceFee > 0) {
      text += `🤝 *Taxa Serviço:* R$ ${order.serviceFee.toFixed(2).replace('.', ',')}\n`;
    }
    if (order.discount > 0) {
      text += `🏷️ *Desconto:* - R$ ${order.discount.toFixed(2).replace('.', ',')}\n`;
    }
    text += `💰 *TOTAL A PAGAR:* R$ ${order.total.toFixed(2).replace('.', ',')}\n`;
    text += `💳 *Pagamento:* ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'PENDENTE'} (${order.isPaid ? 'PAGO ✅' : 'PENDENTE ⏳'})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `${settings.footerMessage || 'Obrigado pela preferência! Volte sempre 🔥'}\n`;
    if (settings.phone) text += `WhatsApp: ${settings.phone}\n`;
  } else {
    text += `🔥 *PREPARAR COM AGILIDADE* 🔥\n`;
  }

  return text;
}

/**
 * Formats receipt as monospace plain text for clipboard copying or Bluetooth thermal apps (e.g. RawBT).
 */
export function formatReceiptRawText(
  order: Order,
  settings: ReceiptSettings = getReceiptSettings(),
  type: ReceiptType = 'cliente',
  paperWidth: ReceiptPaperWidth = '80mm'
): string {
  const lineLength = paperWidth === '58mm' ? 32 : 42;
  const separator = '-'.repeat(lineLength);
  const doubleSeparator = '='.repeat(lineLength);

  const padCenter = (str: string) => {
    if (str.length >= lineLength) return str.slice(0, lineLength);
    const totalSpaces = lineLength - str.length;
    const left = Math.floor(totalSpaces / 2);
    const right = totalSpaces - left;
    return ' '.repeat(left) + str + ' '.repeat(right);
  };

  const padBetween = (left: string, right: string) => {
    const spaceCount = Math.max(1, lineLength - left.length - right.length);
    return left + ' '.repeat(spaceCount) + right;
  };

  const dateObj = new Date(order.createdAt);
  const formattedDate = dateObj.toLocaleDateString('pt-BR');
  const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const isKitchen = type === 'cozinha';

  const lines: string[] = [
    padCenter(settings.restaurantName || 'ESPETINHO DO CHEFE'),
    settings.subtitle ? padCenter(settings.subtitle) : '',
    settings.phone ? padCenter(`Tel/Zap: ${settings.phone}`) : '',
    settings.cnpj ? padCenter(`CNPJ: ${settings.cnpj}`) : '',
    padCenter(isKitchen ? '*** COMANDA COZINHA ***' : '*** COMPROVANTE NÃO FISCAL ***'),
    doubleSeparator,
    padBetween(`PEDIDO #${order.orderNumber}`, order.tableOrCustomer.toUpperCase()),
    padBetween(`DATA: ${formattedDate}`, `HORA: ${formattedTime}`),
    order.notes ? `Obs: ${order.notes}` : '',
    separator,
    padBetween('QTD DESCRICAO', !isKitchen ? 'VALOR' : ''),
    separator,
  ].filter(Boolean);

  order.items.forEach((item) => {
    const itemTotal = (item.price * item.quantity).toFixed(2).replace('.', ',');
    const line = padBetween(`${item.quantity}x ${item.productName}`, !isKitchen ? `R$ ${itemTotal}` : '');
    lines.push(line);

    if (item.meatPoint) {
      const pt =
        item.meatPoint === 'mal_passada'
          ? 'MAL PASSADA'
          : item.meatPoint === 'ao_ponto'
          ? 'AO PONTO'
          : 'BEM PASSADA';
      lines.push(`  > PONTO: ${pt}`);
    }
    if (item.notes) {
      lines.push(`  * Obs: ${item.notes}`);
    }
  });

  if (!isKitchen) {
    lines.push(separator);
    lines.push(padBetween('Subtotal:', `R$ ${order.subtotal.toFixed(2).replace('.', ',')}`));
    if (order.serviceFee > 0) {
      lines.push(padBetween('Taxa Servico (10%):', `R$ ${order.serviceFee.toFixed(2).replace('.', ',')}`));
    }
    if (order.discount > 0) {
      lines.push(padBetween('Desconto:', `- R$ ${order.discount.toFixed(2).replace('.', ',')}`));
    }
    lines.push(doubleSeparator);
    lines.push(padBetween('TOTAL A PAGAR:', `R$ ${order.total.toFixed(2).replace('.', ',')}`));
    lines.push(separator);
    lines.push(padBetween('Forma Pagto:', (order.paymentMethod || 'DINHEIRO').toUpperCase()));
    lines.push(padBetween('Status:', order.isPaid ? 'PAGO' : 'PENDENTE'));
    lines.push(separator);
    lines.push(padCenter(settings.footerMessage || 'OBRIGADO PELA PREFERENCIA!'));
    lines.push(padCenter('VOLTE SEMPRE!'));
  } else {
    lines.push(doubleSeparator);
    lines.push(padCenter('AGILIDADE NA COZINHA!'));
  }

  return lines.join('\n');
}

/**
 * Mobile-native share (Web Share API) or fallback to WhatsApp.
 */
export async function shareReceiptNative(
  order: Order,
  settings: ReceiptSettings = getReceiptSettings(),
  type: ReceiptType = 'cliente'
): Promise<void> {
  const text = formatReceiptWhatsAppText(order, settings, type);
  const title = `Comprovante Pedido #${order.orderNumber} - ${order.tableOrCustomer}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return;
    } catch (err) {
      // If user cancelled or failed, proceed to WhatsApp fallback
      if ((err as any).name === 'AbortError') return;
    }
  }

  // WhatsApp Web / Mobile redirect
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(whatsappUrl, '_blank');
}
