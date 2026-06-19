import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service_role key.
 * NEVER import this in client components — it uses the secret service key.
 * Used exclusively in API Routes and Server Actions for Storage operations.
 */
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);

export const STORAGE_BUCKET = "message-attachments";

/**
 * Uploads a file buffer to Supabase Storage.
 * Returns the storage path on success.
 */
export async function uploadToStorage(
    buffer: Buffer,
    storagePath: string,
    mimeType: string
): Promise<string> {
    const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: false,
        });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return storagePath;
}

/**
 * Generates a signed URL for temporary access to a private file.
 * Default expiry: 3600 seconds (1 hour).
 */
export async function getSignedUrl(
    storagePath: string,
    expiresIn = 3600
): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
        throw new Error(`Failed to generate signed URL: ${error?.message}`);
    }
    return data.signedUrl;
}

/**
 * Deletes a file from Supabase Storage.
 * Safe to call even if the file doesn't exist.
 */
export async function deleteFromStorage(storagePath: string): Promise<void> {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([storagePath]);
}
