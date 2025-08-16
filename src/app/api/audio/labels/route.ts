import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

// GET - Fetch labels (system-wide and user-specific)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    const labels = await prisma.label.findMany({
      where: {
        OR: [
          { ownerId: null }, // System-wide labels
          ...(ownerId ? [{ ownerId }] : []) // User-specific labels
        ]
      },
      orderBy: [
        { ownerId: 'asc' }, // System labels first
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ labels });
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    );
  }
}

// POST - Create new label
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, ownerId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Label name is required' },
        { status: 400 }
      );
    }

    // Check if label already exists for this user
    const existingLabel = await prisma.label.findFirst({
      where: {
        name: name.trim(),
        ownerId: ownerId || user.sub
      }
    });

    if (existingLabel) {
      return NextResponse.json(
        { error: 'Label with this name already exists' },
        { status: 400 }
      );
    }

    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        color: color || '#3B82F6',
        ownerId: ownerId || user.sub,
      }
    });

    return NextResponse.json({
      success: true,
      label
    });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    );
  }
}
