import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemName = '', category = '', customPrompt = '' } = body;

    if (!itemName && !customPrompt) {
      return NextResponse.json(
        { error: 'Please provide an item name or prompt for image generation' },
        { status: 400 }
      );
    }

    // Build optimized studio product photography prompt
    let subject = customPrompt.trim();
    if (!subject) {
      subject = itemName.trim();
      if (category && category !== 'General') {
        subject += ` (${category})`;
      }
    }

    const fullPrompt = `${subject}, studio product photography, clean minimalist white background, soft studio lighting, centered commercial catalog photo, high resolution 4k, crisp sharp focus`;

    // Call Pollinations AI (flux model, no watermark, free API)
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const aiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;

    const res = await fetch(aiUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'image/jpeg,image/png,image/*'
      }
    });

    if (!res.ok) {
      throw new Error(`AI Image generator returned HTTP status ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      prompt: fullPrompt
    });
  } catch (err: any) {
    console.error('AI image generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate AI image' },
      { status: 500 }
    );
  }
}
