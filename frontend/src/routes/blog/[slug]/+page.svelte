<script lang="ts">
    import { page } from "$app/stores";
    import { PostService } from "../../../lib/postService";
    import type { Post } from "../../../lib/types";

    let slug = $derived($page.params.slug);

    let post = $state<Post | null>(null);
    let loading = $state(true);
    let error = $state("");

    $effect(() => {
        if (slug) loadPost(slug);
    });

    async function loadPost(currentSlug: string) {
        loading = true;
        error = "";
        try {
            const result = await PostService.getPostBySlug(currentSlug);
            if (!result) throw new Error("Post not found");
            post = result;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="max-w-3xl mx-auto py-8 sm:py-12">
    <a
        href="/blog"
        class="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 mb-8 transition-colors group"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
        </svg>
        Back to Blog
    </a>

    {#if loading}
        <div class="animate-pulse space-y-8">
            <div class="h-8 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="space-y-4">
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
        </div>
    {:else if error}
        <div
            class="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100"
        >
            {error}
        </div>
    {:else if post}
        <div
            class="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-gray-100"
        >
            <article>
                <header class="mb-10 space-y-4">
                    <div
                        class="flex items-center gap-2 text-sm text-gray-500 font-medium"
                    >
                        <time
                            dateTime={new Date(
                                post.created_at || Date.now(),
                            ).toISOString()}
                        >
                            {new Date(
                                post.created_at || Date.now(),
                            ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </time>
                    </div>

                    <h1
                        class="text-4xl sm:text-5xl font-bold tracking-tight text-text leading-tight"
                    >
                        {post.title}
                    </h1>

                    <div class="flex flex-wrap gap-2 pt-2">
                        {#each post.tags as tag}
                            <span
                                class="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium"
                                >#{tag}</span
                            >
                        {/each}
                    </div>
                </header>

                <div
                    class="prose prose-lg prose-indigo max-w-none text-gray-800 leading-relaxed space-y-6"
                >
                    {@html post.content}
                </div>
            </article>
        </div>
    {/if}
</div>
