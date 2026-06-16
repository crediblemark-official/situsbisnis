export function formatWhatsAppMessage({
    orderId,
    items,
    formData,
    cartTotal,
    formatPrice,
    settings: _settings,
}: {
    orderId: string;
    items: any[];
    formData: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        zip: string;
    };
    cartTotal: number;
    formatPrice: (_price: number) => string;
    settings: any;
}) {
    let messageText = `Halo Admin, saya ingin memesan produk berikut:\n\n`;
    messageText += `*ID PESANAN:* *#${orderId.slice(0, 8).toUpperCase()}*\n`;
    messageText += `*STATUS:* *PENDING* (Menunggu Konfirmasi)\n\n`;
    
    messageText += `*DETAIL PESANAN:*\n`;
    items.forEach((item, index) => {
        const variantText = item.variantName ? ` (${item.variantName})` : "";
        messageText += `${index + 1}. *${item.name}${variantText}*\n`;
        messageText += `   Kuantitas: ${item.quantity} pcs\n`;
        messageText += `   Harga Satuan: ${formatPrice(item.price)}\n`;
        messageText += `   Subtotal: ${formatPrice(item.price * item.quantity)}\n\n`;
    });
    
    messageText += `*INFORMASI PENGIRIMAN:*\n`;
    messageText += `- Nama Penerima: ${formData.name}\n`;
    messageText += `- No. WhatsApp: ${formData.phone}\n`;
    messageText += `- Email: ${formData.email}\n`;
    messageText += `- Alamat Lengkap: ${formData.address}, ${formData.city}, ${formData.zip}\n\n`;
    
    messageText += `*TOTAL BAYAR:* *${formatPrice(cartTotal)}*\n\n`;
    messageText += `Mohon segera diproses ya admin. Terima kasih!`;
    return messageText;
}
