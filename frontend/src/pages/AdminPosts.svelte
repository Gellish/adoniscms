<script lang="ts">
    import { adminState } from "../lib/adminState.svelte";
    import { goto } from "$app/navigation";
    import type { Post } from "../lib/types";

    async function deletePost(slug: string) {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            const res = await fetch(`http://localhost:3333/api/posts/${slug}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete post");
            adminState.refreshFromAPI();
        } catch (e: any) {
            alert(
                e.message + " - Deletion requires online connection for now.",
            );
        }
    }

    function navigateTo(path: string) {
        goto(path);
    }
</script>

<div class="p-6 space-y-8">
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Manage Posts</h1>
            <p class="text-gray-500 text-sm mt-1">
                {#if adminState.isOffline}
                    <span
                        class="inline-flex items-center text-yellow-600 font-medium"
                    >
                        <span class="w-2 h-2 rounded-full bg-yellow-400 mr-2"
                        ></span>
                        Unsync Mode
                    </span>
                {:else}
                    Viewing all {adminState.posts.length} posts
                {/if}
            </p>
        </div>
        <button
            onclick={() => navigateTo("/admin/editor")}
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                    fill-rule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clip-rule="evenodd"
                />
            </svg>
            New Post
        </button>
    </div>

    <div
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
                <thead
                    class="bg-gray-50 text-gray-500 border-b border-gray-200"
                >
                    <tr>
                        <th class="px-6 py-4 font-medium">Title</th>
                        <th class="px-6 py-4 font-medium">Status</th>
                        <th class="px-6 py-4 font-medium">Created On</th>
                        <th class="px-6 py-4 font-medium text-right">Actions</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each adminState.posts as post}
                        <tr class="hover:bg-gray-50/50 transition-colors">
                            <td class="px-6 py-4">
                                <div class="font-medium text-gray-900">
                                    {post.title}
                                </div>
                                <div class="text-xs text-gray-400 mt-0.5">
                                    /{post.slug}
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span
                                    class="inline-flex px-2 py-1 rounded-full text-xs font-medium {post.source ===
                                        'local' ||
                                    post.source === 'offline-created'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-green-100 text-green-700'}"
                                >
                                    {post.source === "local" ||
                                    post.source === "offline-created"
                                        ? "Offline Draft"
                                        : "Published"}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-gray-500">
                                {new Date(
                                    post.created_at || Date.now(),
                                ).toLocaleDateString()}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex justify-end gap-2">
                                    <button
                                        onclick={() =>
                                            navigateTo(
                                                `/admin/editor?slug=${post.slug}`,
                                            )}
                                        class="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-md transition-colors"
                                        title="Edit"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        onclick={() => deletePost(post.slug)}
                                        class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                clip-rule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>
