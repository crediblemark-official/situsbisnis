export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-')     // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
}

export function getPlainTextFromTiptap(content: any): string {
    if (!content) return "";
    
    const extractText = (node: any): string => {
        if (!node) return "";
        if (node.type === 'text' && typeof node.text === 'string') {
            return node.text;
        }
        if (Array.isArray(node.content)) {
            return node.content.map((child: any) => extractText(child)).join(" ");
        }
        return "";
    };

    if (typeof content === "object") {
        return extractText(content).replace(/\s+/g, ' ').trim();
    }

    const contentStr = String(content);
    let parsedContent;
    try {
        parsedContent = JSON.parse(contentStr);
    } catch {
        // If not JSON, it is already HTML or plain text, strip HTML tags safely
        return contentStr.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return extractText(parsedContent).replace(/\s+/g, ' ').trim();
}

export function generateAutoExcerpt(content: string, maxLength = 160): string {
    const plainText = getPlainTextFromTiptap(content);
    if (!plainText) return "";
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength - 3) + "...";
}

