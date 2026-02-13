<script lang="ts">
    import { adminState } from "../lib/adminState.svelte";
    import { goto } from "$app/navigation";

    function navigateTo(path: string) {
        goto(path);
    }
</script>

<div class="p-6 space-y-8">
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Manage Users</h1>
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
                    Viewing {adminState.users.length} registered users
                {/if}
            </p>
        </div>
        <button
            disabled
            class="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 cursor-not-allowed"
            title="User creation coming soon"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                    d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"
                />
            </svg>
            Add User
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
                        <th class="px-6 py-4 font-medium">User</th>
                        <th class="px-6 py-4 font-medium">Role</th>
                        <th class="px-6 py-4 font-medium">Joined</th>
                        <th class="px-6 py-4 font-medium text-right">Actions</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each adminState.users as u}
                        <tr class="hover:bg-gray-50/50 transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200"
                                    >
                                        {u.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <div class="font-medium text-gray-900">
                                            {u.fullName}
                                        </div>
                                        <div class="text-xs text-gray-400">
                                            {u.email}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-gray-500 capitalize">
                                <span
                                    class="inline-flex px-2 py-1 rounded-full text-xs font-medium {u.role ===
                                    'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-blue-100 text-blue-700'}"
                                >
                                    {u.role}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-gray-500 uppercase">
                                {new Date(u.joinedAt).toLocaleDateString()}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex justify-end gap-2">
                                    <button
                                        class="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                                        title="View Details"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
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
