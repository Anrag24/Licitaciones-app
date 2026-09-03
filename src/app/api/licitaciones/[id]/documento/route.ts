import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = await params;

    const licitacion = await prisma.licitacion.findUnique({ where: { id } });
    if (!licitacion) {
      return NextResponse.json({ error: 'Licitacion no encontrada' }, { status: 404 });
    }

    if (licitacion.estado !== 'borrador') {
      return NextResponse.json(
        { error: 'Solo se puede subir documento en estado borrador' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('documento') as File;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadFile(buffer, file.name, file.type);

    const updated = await prisma.licitacion.update({
      where: { id },
      data: { documentoUrl: url, documentoNombre: file.name },
    });

    return NextResponse.json({
      documentoUrl: updated.documentoUrl,
      documentoNombre: updated.documentoNombre,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
