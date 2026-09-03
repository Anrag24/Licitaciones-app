import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contrasena requeridos' }, { status: 400 });
    }

    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 401 });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      rol: user.rol,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
