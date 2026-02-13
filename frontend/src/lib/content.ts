import { marked } from 'marked';
import jsyaml from 'js-yaml';
import type { Post } from '$lib/types.js';

const markdownFiles = import.meta.glob('/src/content/*.md', { query: '?raw', import: 'default', eager: true });

export async function getLocalPosts(): Promise<Post[]> {
    const posts: Post[] = [];

    for (const path in markdownFiles) {
        const raw = markdownFiles[path] as string;
        const { metadata, content } = parseMarkdown(raw);

        // Generate slug from filename if not in metadata
        const slug = path.split('/').pop()?.replace('.md', '') || '';

        posts.push({
            id: slug,
            title: metadata.title || 'Untitled',
            content: content,
            slug: slug,
            tags: metadata.tags || [],
            created_at: metadata.date || new Date().toISOString(),
            source: 'local'
        });
    }

    return posts.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
}

export async function getLocalPostBySlug(slug: string): Promise<Post | null> {
    const posts = await getLocalPosts();
    return posts.find(p => p.slug === slug) || null;
}

function parseMarkdown(rawContent: string): { metadata: any, content: string } {
    const fmRegex = /^-{3,}\r?\n([\s\S]+?)\r?\n-{3,}\r?\n([\s\S]*)/;
    const match = rawContent.match(fmRegex);

    if (match) {
        try {
            const metadata = jsyaml.load(match[1]) as any;
            const content = marked.parse(match[2]) as string;
            return { metadata, content };
        } catch (e) {
            console.error('Error parsing frontmatter:', e);
        }
    }

    return { metadata: {}, content: marked.parse(rawContent) as string };
}
