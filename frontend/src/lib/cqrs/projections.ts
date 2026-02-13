import type { Event } from '$lib/cqrs/types.js';

/**
 * Base Projection class
 * Reduces a stream of events into a single state object
 */
export class Projection<T> {

    // Initial state
    protected state: T;

    constructor(initialState: T) {
        this.state = initialState;
    }

    public project(events: Event[]): T {
        for (const event of events) {
            this.apply(event);
        }
        return this.state;
    }

    protected apply(event: Event) {
        const handlerName = `on${toPascalCase(event.eventType)}`;
        if (typeof (this as any)[handlerName] === 'function') {
            (this as any)[handlerName](event.payload);
        }
    }
}

function toPascalCase(str: string) {
    return str.toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase())
        .replace(/^[a-z]/, c => c.toUpperCase());
}

// Example: Post Projection
export interface PostState {
    id: string;
    title: string;
    content: string;
    author: string;
    published: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export class PostProjection extends Projection<PostState | null> {
    constructor() {
        super(null);
    }

    onPostCreated(payload: any) {
        this.state = {
            id: payload.id,
            title: payload.title,
            content: payload.content,
            author: payload.author || 'Unknown',
            published: false,
            createdAt: payload.timestamp
        };
    }

    onPostUpdated(payload: any) {
        if (!this.state) return;
        this.state = { ...this.state, ...payload, updatedAt: new Date().toISOString() };
    }

    onPostPublished() {
        if (!this.state) return;
        this.state.published = true;
    }
}
