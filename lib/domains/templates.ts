/**
 * Generates a premium, high-end dark glassmorphic HTML redirect transition page.
 * Used to handle localhost redirects to prevent Next.js dev server from stripping the host.
 */
export function getPremiumRedirectHtml(targetUrl: string, title = "Mengalihkan Akses", subtitle = "Menuju Panel Utama...") {
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="1.5; url=${targetUrl}">
    <title>Mengalihkan secara Aman...</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Outfit:wght@600;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: #080B11;
            color: #F8FAFC;
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }
        body::before {
            content: '';
            position: absolute;
            width: 350px;
            height: 350px;
            background: radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(56, 189, 248, 0) 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 0;
            pointer-events: none;
        }
        .container {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 380px;
            padding: 20px;
            text-align: center;
        }
        .card {
            background: rgba(13, 18, 30, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 36px 28px;
            box-shadow: 0 20px 40px -15 rgba(0, 0, 0, 0.6),
                        0 0 50px -10px rgba(56, 189, 248, 0.15);
            animation: cardAppear 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .spinner-box {
            position: relative;
            width: 64px;
            height: 64px;
            margin: 0 auto 28px auto;
        }
        .spinner {
            width: 100%;
            height: 100%;
            border: 3px solid rgba(56, 189, 248, 0.08);
            border-top: 3px solid #38BDF8;
            border-right: 3px solid #38BDF8;
            border-radius: 50%;
            animation: spin 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite;
            box-shadow: 0 0 15px rgba(56, 189, 248, 0.25);
        }
        .spinner-inner {
            position: absolute;
            top: 6px;
            left: 6px;
            right: 6px;
            bottom: 6px;
            border: 2px solid rgba(125, 211, 252, 0.08);
            border-bottom: 2px solid #7DD3FC;
            border-left: 2px solid #7DD3FC;
            border-radius: 50%;
            animation: spin-reverse 1.4s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite;
        }
        .badge {
            display: inline-block;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: #38BDF8;
            margin-bottom: 12px;
            text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
            animation: pulse 2s infinite ease-in-out;
        }
        h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 600;
            letter-spacing: -0.01em;
            color: #FFFFFF;
            margin-bottom: 6px;
        }
        p.subtitle {
            font-size: 13px;
            color: #94A3B8;
            font-weight: 400;
        }
        .footer-badge {
            margin-top: 28px;
            font-size: 8px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.25);
            text-transform: uppercase;
            letter-spacing: 0.15em;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .footer-badge::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 4px;
            background-color: #38BDF8;
            border-radius: 50%;
            box-shadow: 0 0 8px #38BDF8;
            animation: blink 1.5s infinite ease-in-out;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }
        @keyframes pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; text-shadow: 0 0 15px rgba(56, 189, 248, 0.6); }
        }
        @keyframes cardAppear {
            from { opacity: 0; transform: translateY(16px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="spinner-box">
                <div class="spinner"></div>
                <div class="spinner-inner"></div>
            </div>
            <span class="badge">Keamanan Edge</span>
            <h1>${title}</h1>
            <p class="subtitle">${subtitle}</p>
            <div class="footer-badge">Koneksi Terenkripsi</div>
        </div>
    </div>
    <script>
        setTimeout(function() {
            window.location.href = "${targetUrl}";
        }, 1200);
    </script>
</body>
</html>`;
}
