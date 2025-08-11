import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'mp3';
  
  // This is a mock endpoint - in a real app, you'd serve actual audio files
  // For now, we'll return a simple response indicating the audio format
  
  return NextResponse.json({
    message: `Audio file requested in ${format} format`,
    format,
    timestamp: new Date().toISOString()
  });
}
