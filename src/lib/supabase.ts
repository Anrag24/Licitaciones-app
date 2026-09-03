import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'propuestas';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const path = `${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });

  if (error) throw new Error(`Error subiendo archivo: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return { url: data.publicUrl, path };
}

export async function downloadFile(path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`Error descargando archivo: ${error.message}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Error eliminando archivo: ${error.message}`);
}
