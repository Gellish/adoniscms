<script lang="ts">
    import { useAuth } from "../lib/auth.svelte";
    import { adminState } from "../lib/adminState.svelte";
    import { goto } from "$app/navigation";
    import adminAvatar from "../assets/admin-avatar.png";

    const auth = useAuth();

    function navigateTo(path: string) {
        goto(path);
    }
</script>

<div class="p-6 space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <div class="relative">
                <img
                    src={adminAvatar}
                    alt="Admin"
                    class="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm"
                />
                {#if adminState.isOffline}
                    <span
                        class="absolute bottom-0 right-0 w-4 h-4 bg-yellow-400 border-2 border-white rounded-full"
                        title="Unsync Mode"
                    ></span>
                {:else}
                    <span
                        class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"
                        title="Online"
                    ></span>
                {/if}
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Admin Dashboard
                </h1>
                <p class="text-sm text-gray-500">
                    Welcome back, {auth.user?.fullName || "Admin"}
                </p>
            </div>
        </div>
        <div>
            {#if adminState.isOffline}
                <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                >
                    Unsync Mode
                </span>
            {:else}
                <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                    System Operational
                </span>
            {/if}
        </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3
                class="text-sm font-medium text-gray-500 uppercase tracking-wider"
            >
                Total Posts
            </h3>
            <p class="mt-2 text-3xl font-bold text-gray-900">
                {adminState.stats?.posts || 0}
            </p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3
                class="text-sm font-medium text-gray-500 uppercase tracking-wider"
            >
                Total Users
            </h3>
            <p class="mt-2 text-3xl font-bold text-gray-900">
                {adminState.stats?.users || 0}
            </p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3
                class="text-sm font-medium text-gray-500 uppercase tracking-wider"
            >
                System State
            </h3>
            <p class="mt-2 text-3xl font-bold text-primary-600">
                {adminState.stats?.systemState || "Offline"}
            </p>
        </div>
    </div>

    <!-- Recent Posts -->
    <div
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
        <div
            class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
        >
            <h2 class="text-lg font-semibold text-gray-900">Recent Posts</h2>
            <button
                onclick={() => navigateTo("/admin/posts")}
                class="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
                View All
            </button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
                <thead class="bg-gray-50 text-gray-500">
                    <tr>
                        <th class="px-6 py-3 font-medium">Title</th>
                        <th class="px-6 py-3 font-medium">Created On</th>
                        <th class="px-6 py-3 font-medium text-right">Actions</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each adminState.stats?.recentPosts || [] as post}
                        <tr class="hover:bg-gray-50/50 transition-colors">
                            <td class="px-6 py-4 font-medium text-gray-900"
                                >{post.title}</td
                            >
                            <td class="px-6 py-4 text-gray-500">
                                {new Date(
                                    post.created_at || Date.now(),
                                ).toLocaleDateString()}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <button
                                    onclick={() =>
                                        navigateTo(
                                            `/admin/editor?slug=${post.slug}`,
                                        )}
                                    class="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:text-primary-600 transition-colors text-xs font-medium shadow-sm"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>
