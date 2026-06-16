"use client";

export default function LuxuryStyles() {
    return (
        <style jsx global>{`
            h1, h2, h3, h4, .font-serif {
                font-family: 'Playfair Display', serif !important;
                letter-spacing: -0.02em;
            }
            body {
                letter-spacing: 0.01em;
                -webkit-font-smoothing: antialiased;
            }
        `}</style>
    );
}
