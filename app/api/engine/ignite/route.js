import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Event, User } from '@/models';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

async function parseWithAI(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `你是一个社交日程解析专家。解析以下文本并返回 JSON：
        文本: "${text}"
        当前时间: ${new Date().toLocaleString()}
        返回格式: { "title": "标题", "date": "YYYY-MM-DD", "time": "HH:mm", "location": "地点", "vibe": "focus/chill/party", "emoji": "表情" }
        仅返回 JSON，不要任何解释。`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonStr = response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('AI Parsing failed', e);
        return null;
    }
}

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

export async function POST(request) {
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { text, spaceId, previewOnly } = await request.json();
        if (!text) return NextResponse.json({ error: 'Command text required' }, { status: 400 });

        // 1. AI Parsing (Gemini)
        const parsed = await parseWithAI(text) || { title: text, vibe: 'chill', emoji: '✨' };

        if (previewOnly) {
            return NextResponse.json({
                success: true,
                spark: {
                    title: parsed.title,
                    date: parsed.date || new Date().toISOString().split('T')[0],
                    location: parsed.location,
                    vibe: parsed.vibe,
                    emoji: parsed.emoji
                }
            });
        }

        // 2. Create a "Spark" (Intent)
        const spark = await Event.create({
            space_id: spaceId,
            user_id: user._id,
            type: 'spark',
            status: 'ghost',
            title: parsed.title,
            note: text,
            start_date: parsed.date || new Date().toISOString().split('T')[0],
            end_date: parsed.date || new Date().toISOString().split('T')[0],
            start_at: (parsed.date && parsed.time) ? new Date(`${parsed.date}T${parsed.time}`) : null,
            location: parsed.location || ''
        });

        return NextResponse.json({
            success: true,
            spark: {
                id: spark._id.toString(),
                title: spark.title,
                date: spark.start_date,
                location: spark.location,
                vibe: parsed.vibe,
                emoji: parsed.emoji,
                type: 'spark'
            }
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Ignition failed' }, { status: 500 });
    }
}
