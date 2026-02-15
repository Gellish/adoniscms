<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { WidgetManagerState } from "$lib/widgetManagerState.svelte";
    import DashboardPalette from "$lib/components/dashboard/DashboardPalette.svelte";

    // We'll create a dedicated grid for the manager
    // Renamed to avoid Svelte 5 conflict
    const managerState = new WidgetManagerState();

    let editingWidget = $state<any>(null); // For future "Edit" modal

    $effect(() => {
        // Log for debugging
        console.log("Widget Manager State:", managerState.widgets);
    });
</script>

<div class="p-8 max-w-7xl mx-auto">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h1
                class="text-3xl font-black text-slate-900 uppercase tracking-tighter"
            >
                Widget <span class="text-indigo-600">Manager</span>
            </h1>
            <p class="text-slate-500 font-medium mt-1">
                Manage your component library. Create, edit, and remove widgets.
            </p>
        </div>
        <div class="flex gap-3">
            <button
                class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-indigo-200"
                onclick={() => alert("Create New Widget (Coming Soon)")}
            >
                + Create New
            </button>
        </div>
    </div>

    <!-- Search -->
    <div class="mb-8">
        <div class="relative max-w-md">
            <input
                type="text"
                bind:value={managerState.searchQuery}
                placeholder="Search widgets..."
                class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
            />
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
        </div>
    </div>

    {#if managerState.isLoading}
        <div class="py-20 text-center">
            <div
                class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"
            ></div>
            <p class="text-slate-400 font-medium">Loading widgets...</p>
        </div>
    {:else}
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
            {#each managerState.filteredWidgets as widget}
                <div
                    class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all p-6 group relative overflow-hidden"
                >
                    <div class="flex items-start justify-between mb-4">
                        <div
                            class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
                        >
                            {widget.icon}
                        </div>
                        {#if widget.isCustom}
                            <span
                                class="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-md"
                                >Custom</span
                            >
                        {:else}
                            <span
                                class="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-md"
                                >System</span
                            >
                        {/if}
                    </div>

                    <h3 class="font-bold text-slate-900 text-lg mb-1">
                        {widget.label}
                    </h3>
                    <p
                        class="text-sm text-slate-500 leading-relaxed mb-6 h-10 line-clamp-2"
                    >
                        {widget.description}
                    </p>

                    <div
                        class="flex items-center gap-2 pt-4 border-t border-slate-50"
                    >
                        <button
                            class="flex-1 px-3 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                            onclick={() => alert("Edit Code (Coming Soon)")}
                        >
                            Edit Code
                        </button>
                        {#if widget.isCustom && widget.id}
                            <button
                                class="w-9 h-9 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                                onclick={() => {
                                    if (
                                        widget.id &&
                                        confirm("Delete this widget?")
                                    ) {
                                        managerState.deleteWidget(widget.id);
                                    }
                                }}
                                title="Delete Widget"
                                aria-label="Delete Widget"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
