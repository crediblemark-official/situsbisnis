import xss from 'xss';

export const sanitize = (html: string, _options?: any) => {
    // We use xss as a lightweight replacement for dompurify to avoid jsdom bundling issues
    if (typeof html !== 'string') return '';
    return xss(html);
};

const DOMPurify = {
    sanitize
};

export default DOMPurify;
