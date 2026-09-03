import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, nombre: true, rol: true, createdAt: true },
    });
    return NextResponse.json(usuarios);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (user.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden crear usuarios' }, { status: 403 });
    }

    const { email, password, nombre, rol } = await req.json();

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Email, contrasena y nombre son requeridos' }, { status: 400 });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'El email ya esta registrado' }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const usuario = await prisma.usuario.create({
      data: { email, password: hashed, nombre, rol: rol || 'user', createdBy: user.id },
      select: { id: true, email: true, nombre: true, rol: true, createdAt: true },
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
