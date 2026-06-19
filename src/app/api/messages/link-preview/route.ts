import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface LinkPreviewData {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
}

/**
 * Extracts an og: or standard meta tag value from raw HTML using regex.
 * Avoids pulling in a full HTML parser dependency.
 */
function extractMeta(html: string, property: string): string | null {
    // Try og: property first, then name= attribute
    const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
        new RegExp(`<meta[^>]+name=["']${property.replace("og:", "")}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property.replace("og:", "")}["']`, "i"),
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return match[1].trim();
    }
    return null;
}

function extractTitle(html: string): string | null {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match?.[1]?.trim() ?? null;
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return url;
    }
}

export async function GET(req: NextRequest) {
    try {
        // ── 1. Auth (must be logged in) ──────────────────────────────────────
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // ── 2. Validate URL param ────────────────────────────────────────────
        const { searchParams } = new URL(req.url);
        const rawUrl = searchParams.get("url");

        if (!rawUrl) {
            return NextResponse.json({ error: "Parámetro 'url' requerido" }, { status: 400 });
        }

        let targetUrl: URL;
        try {
            targetUrl = new URL(rawUrl);
            if (!["http:", "https:"].includes(targetUrl.protocol)) throw new Error();
        } catch {
            return NextResponse.json(
                { error: "URL inválida. Debe comenzar con http:// o https://" },
                { status: 400 }
            );
        }

        // ── 3. Fetch the page (with timeout) ────────────────────────────────
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        let html = "";
        try {
            const response = await fetch(targetUrl.toString(), {
                signal: controller.signal,
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (compatible; LinguaCampusBot/1.0; +https://lingua-campus.vercel.app)",
                    Accept: "text/html,application/xhtml+xml",
                },
            });
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            // Only read first 50KB to avoid memory issues with large pages
            const reader = response.body?.getReader();
            if (reader) {
                let bytes = 0;
                const chunks: Uint8Array[] = [];
                while (bytes < 50_000) {
                    const { done, value } = await reader.read();
                    if (done || !value) break;
                    chunks.push(value);
                    bytes += value.length;
                }
                html = new TextDecoder().decode(
                    Buffer.concat(chunks.map((c) => Buffer.from(c)))
                );
                reader.cancel();
            }
        } catch (fetchErr: any) {
            clearTimeout(timeout);
            // Return a minimal preview using just the URL — don't fail the request
            const result: LinkPreviewData = {
                url: targetUrl.toString(),
                title: null,
                description: null,
                image: null,
                siteName: extractDomain(targetUrl.toString()),
            };
            return NextResponse.json(result);
        }

        // ── 4. Extract Open Graph metadata ───────────────────────────────────
        const ogTitle = extractMeta(html, "og:title");
        const ogDescription = extractMeta(html, "og:description") ?? extractMeta(html, "description");
        const ogImage = extractMeta(html, "og:image");
        const ogSiteName = extractMeta(html, "og:site_name");
        const pageTitle = ogTitle ?? extractTitle(html);

        // Resolve relative image URLs
        let imageUrl = ogImage ?? null;
        if (imageUrl && !imageUrl.startsWith("http")) {
            try {
                imageUrl = new URL(imageUrl, targetUrl.origin).toString();
            } catch {
                imageUrl = null;
            }
        }

        const result: LinkPreviewData = {
            url: targetUrl.toString(),
            title: pageTitle,
            description: ogDescription,
            image: imageUrl,
            siteName: ogSiteName ?? extractDomain(targetUrl.toString()),
        };

        return NextResponse.json(result, {
            headers: {
                // Cache for 10 minutes — same link won't re-fetch immediately
                "Cache-Control": "public, max-age=600",
            },
        });
    } catch (err: any) {
        console.error("[messages/link-preview]", err);
        return NextResponse.json(
            { error: err.message ?? "Error interno." },
            { status: 500 }
        );
    }
}
