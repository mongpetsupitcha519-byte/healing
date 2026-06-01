// api/gemini.js
// ไฟล์นี้ทำหน้าที่เป็นตัวกลาง (Serverless Function) รันบนฝั่งหลังบ้านของ Vercel
// เพื่อซ่อน API Key ของคุณ Xavirobzone ไว้เป็นความลับอย่างปลอดภัย 100%

export default async function handler(req, res) {
    // 1. ตั้งค่า CORS Headers เพื่อให้มั่นใจว่าเบราว์เซอร์สามารถติดต่อได้โดยไม่ติดปัญหาความปลอดภัย
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 2. รองรับคำขอตรวจสอบก่อนเข้าถึง (OPTIONS Method)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. อนุญาตให้เรียกผ่านรูปแบบ POST เท่านั้น เพื่อความปลอดภัย
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 4. ดึง API Key จากตัวแปรสภาพแวดล้อมหลังบ้าน (Environment Variable) ของ Vercel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: 'ระบบยังไม่ได้รับรหัส API Key กรุณาตั้งค่าตัวแปร GEMINI_API_KEY ในหน้า Dashboard ของ Vercel ให้เรียบร้อยค่ะ'
        });
    }

    try {
        // ตรวจสอบและดึงข้อมูลที่หน้าเว็บ index.html ส่งมา
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        // 5. ส่งคำขอต่อไปยังเซิร์ฟเวอร์ Google Gemini AI พร้อมแนบ API Key แบบเป็นความลับ
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google API Error (Status: ${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // 6. ส่งผลลัพธ์คำแนะนำเยียวยาใจจาก AI กลับไปที่หน้าจอหน้าเว็บ index.html
        return res.status(200).json(data);

    } catch (error) {
        console.error('Error processing Gemini request:', error);
        return res.status(500).json({ error: error.message });
    }
}