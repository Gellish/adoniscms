<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { type DashboardState } from "$lib/dashboardState.svelte";

    let { state } = $props<{ state: DashboardState }>();
</script>

{#if state.showPalette}
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
        transition:fade
    >
        <div
            class="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden"
            transition:slide={{ axis: "y" }}
        >
            <div
                class="p-8 border-b border-slate-100 flex items-center justify-between flex-shrink-0"
            >
                <div>
                    <h2
                        class="text-2xl font-black text-slate-900 uppercase tracking-tighter"
                    >
                        Component <span class="text-indigo-600">Palette</span>
                    </h2>
                    <p class="text-xs text-slate-400 font-medium">
                        Select a component to add to your dashboard
                    </p>
                </div>
                <button
                    onclick={() => (state.showPalette = false)}
                    class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition-colors"
                    aria-label="Close palette"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <!-- Search Bar -->
            <div class="px-8 pt-4 pb-2">
                <div class="relative">
                    <input
                        type="text"
                        bind:value={state.searchQuery}
                        placeholder="Search components..."
                        class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
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

            <div
                class="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[60vh]"
            >
                {#each state.availableWidgets as item}
                    <button
                        onclick={() => state.addWidget(item)}
                        class="flex items-start gap-4 p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-left group"
                    >
                        <div
                            class="text-3xl p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors"
                        >
                            {item.icon}
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-900 mb-1">
                                {item.label}
                            </h3>
                            <p class="text-xs text-slate-500 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </button>
                {/each}
                {#if state.availableWidgets.length === 0}
                    <div
                        class="col-span-2 text-center py-8 text-slate-400 text-sm"
                    >
                        No components found matching "{state.searchQuery}"
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
