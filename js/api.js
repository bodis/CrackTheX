// api.js — API abstraction layer for all backend calls
const API = {
  MATHPIX_APP_ID: 'YOUR_APP_ID',
  MATHPIX_APP_KEY: 'YOUR_APP_KEY',
  MODE: 'direct',  // 'direct' (MVP) or 'proxy' (production)
  BACKEND_URL: 'https://your-backend.com',

  async ocr(base64DataURL) {
    if (this.MODE === 'proxy') {
      const res = await fetch(this.BACKEND_URL + '/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: base64DataURL })
      });
      if (!res.ok) throw new Error('OCR proxy error: ' + res.status);
      return res.json();
    }

    // Direct Mathpix API call (MVP)
    const res = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'app_id': this.MATHPIX_APP_ID,
        'app_key': this.MATHPIX_APP_KEY
      },
      body: JSON.stringify({
        src: base64DataURL,
        math_inline_delimiters: ['$', '$'],
        rm_spaces: true,
        formats: ['latex_simplified']
      })
    });
    if (!res.ok) throw new Error('Mathpix API error: ' + res.status);
    return res.json();
  },

  async saveEquation(latex, steps) {
    if (this.MODE !== 'proxy') return;
    await fetch(this.BACKEND_URL + '/api/equations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex, steps, solvedAt: new Date().toISOString() })
    });
  },

  async getHistory() {
    if (this.MODE !== 'proxy') return [];
    const res = await fetch(this.BACKEND_URL + '/api/equations');
    return res.json();
  }
};
