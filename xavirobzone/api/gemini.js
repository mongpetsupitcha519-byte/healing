// api/gemini.js
// ไฟล์หลังบ้าน (Serverless Function) สำหรับ Vercel เพื่อความปลอดภัยสูงสุดและปิดบัง API Key ไม่ให้รั่วไหล

export default async function handler(req, res) {
    // กำหนดค่า Headers เพื่อความปลอดภัยและการเชื่อมต่อที่ราบรื่น (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // ปลดล็อกระบบเมื่อมีการทดสอบเบื้องต้น (OPTIONS method)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // จำกัดให้ส่งข้อมูลมาแบบ POST เท่านั้น
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // เรียกกุญแจลับ API Key ที่คุณกรอกไว้ในระบบตั้งค่าของ Vercel (Environment Variable)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            error: 'ไม่สามารถเชื่อมต่อได้ เนื่องจากยังไม่ได้กรอก GEMINI_API_KEY ใน Dashboard ของ Vercel' 
        });
    }

    try {
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        // เชื่อมต่อส่งข้อมูลไปคุยกับ Google Gemini AI (ใช้โมเดลเสถียรล่าสุด gemini-2.5-flash)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Google API ตอบกลับด้วยสถานะ: ${response.status}`);
        }

        const data = await response.json();

        // ส่งข้อมูลคำตอบของ AI กลับไปที่หน้าจอเว็บไซต์ index.html ของคุณ
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in Vercel Serverless Function:', error);
        return res.status(500).json({ error: error.message });
    }
}
