<script lang="ts">
    import { onMount } from "svelte";
    import { PostService } from "../../lib/postService";
    import type { Post } from "../../lib/types";

    let posts = $state<Post[]>([]);
    let loading = $state(true);
    let error = $state("");

    onMount(async () => {
        try {
            // 1. FAST: Load local posts immediately
            const localPosts = await PostService.getLocalPostsMerged();
            if (localPosts.length > 0) {
                posts = localPosts;
                loading = false; // Show content immediately!
            }

            // 2. SLOW: Fetch API in background and merge
            const apiPosts = await PostService.getApiPosts();
            if (apiPosts.length > 0) {
                posts = PostService.mergeAndSort(posts, apiPosts);
            }
        } catch (e: any) {
            console.error("Error loading posts:", e);
            error = "Failed to synchronize with server";
        } finally {
            loading = false;
        }
    });
</script>

<div class="space-y-8">
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <h1 class="text-3xl font-bold tracking-tight text-text">
            Latest Updates
        </h1>

        <div
            class="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm border border-blue-100 flex items-center gap-2"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-4 h-4"
            >
                <path
                    fill-rule="evenodd"
                    d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 13a1 1 0 112 0v-2a1 1 0 11-2 0v2zm1-8a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                />
            </svg>
            <span>Posts sync locally and online</span>
        </div>
    </div>

    {#if loading}
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse"
        >
            {#each Array(3) as _}
                <div class="bg-gray-200 h-64 rounded-xl"></div>
            {/each}
        </div>
    {:else if error}
        <div
            class="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100"
        >
            Error: {error}
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each posts as post}
                <article
                    class="card h-full flex flex-col group hover:-translate-y-1 transition-transform duration-300"
                >
                    <div class="flex-1 space-y-4">
                        <div
                            class="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider"
                        >
                            <span class="text-primary-600"
                                >{new Date(
                                    post.created_at || new Date(),
                                ).toLocaleDateString()}</span
                            >
                        </div>

                        <h2
                            class="text-xl font-bold leading-tight group-hover:text-primary-600 transition-colors"
                        >
                            <a
                                href="/blog/{post.slug || ''}"
                                class="focus:outline-none"
                            >
                                <span class="absolute inset-0"></span>
                                {post.title}
                            </a>
                        </h2>

                        <p class="text-gray-600 line-clamp-3">
                            {post.content.substring(0, 150)}...
                        </p>
                    </div>

                    <div
                        class="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between"
                    >
                        <div class="flex flex-wrap gap-2">
                            {#each post.tags || [] as tag}
                                <span
                                    class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium"
                                    >#{tag}</span
                                >
                            {/each}
                        </div>
                        <span
                            class="text-primary-600 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center"
                        >
                            Read <svg
                                class="w-4 h-4 ml-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5l7 7-7 7"
                                /></svg
                            >
                        </span>
                    </div>
                </article>
            {/each}
        </div>
    {/if}
</div>
