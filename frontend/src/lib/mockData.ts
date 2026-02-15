export interface Post {
    id: string;
    title: string;
    status: string;
    publishedAt: string;
    updatedAt: string;
}

export function generateDummyPosts(count: number): Post[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `post-${i}`,
        title: `Demo Post Title ${i + 1} - A comprehensive guide to something interesting`,
        status: i % 3 === 0 ? "published" : "draft",
        publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
    }));
}

export const DUMMY_POSTS = generateDummyPosts(50);
