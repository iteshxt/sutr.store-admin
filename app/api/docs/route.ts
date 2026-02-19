import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the docs structure
const docsConfig = [
    {
        id: 'architecture-admin',
        title: 'Architecture - Admin Panel',
        filename: 'ARCHITECTURE-SUTR.STORE-ADMIN.md',
        category: 'Architecture',
    },
    {
        id: 'architecture-store',
        title: 'Architecture - Storefront',
        filename: 'ARCHITECTURE-SUTR.STORE.md',
        category: 'Architecture',
    },
    {
        id: 'operational-admin',
        title: 'Operational Guide - Admin',
        filename: 'OPERATIONAL-GUIDE-SUTR.STORE-ADMIN.md',
        category: 'Operational Guides',
    },
    {
        id: 'operational-store',
        title: 'Operational Guide - Storefront',
        filename: 'OPERATIONAL-GUIDE-SUTR.STORE.md',
        category: 'Operational Guides',
    },
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const docId = searchParams.get('id');

        // If no specific doc requested, return the list of all docs
        if (!docId) {
            // Group docs by category
            const categories: { [key: string]: typeof docsConfig } = {};
            docsConfig.forEach(doc => {
                if (!categories[doc.category]) {
                    categories[doc.category] = [];
                }
                categories[doc.category].push(doc);
            });

            return NextResponse.json({
                success: true,
                docs: docsConfig.map(({ id, title, category }) => ({ id, title, category })),
                categories,
            });
        }

        // Find the requested doc
        const docConfig = docsConfig.find(d => d.id === docId);
        if (!docConfig) {
            return NextResponse.json(
                { success: false, error: 'Documentation not found' },
                { status: 404 }
            );
        }

        // Read the markdown file
        const docsDir = path.join(process.cwd(), 'docs');
        const filePath = path.join(docsDir, docConfig.filename);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { success: false, error: 'Documentation file not found' },
                { status: 404 }
            );
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract table of contents from markdown headings
        const toc = extractTableOfContents(content);

        return NextResponse.json({
            success: true,
            doc: {
                id: docConfig.id,
                title: docConfig.title,
                category: docConfig.category,
                content,
                toc,
            },
        });
    } catch (error) {
        console.error('Error fetching documentation:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to fetch documentation' },
            { status: 500 }
        );
    }
}

// Extract table of contents from markdown
function extractTableOfContents(markdown: string): { level: number; text: string; id: string }[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const toc: { level: number; text: string; id: string }[] = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        // Create slug from heading text
        const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

        toc.push({ level, text, id });
    }

    return toc;
}
