<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { type DashboardState } from "$lib/dashboardState.svelte";
    import DashboardWidget from "./DashboardWidget.svelte";

    let { state } = $props<{ state: DashboardState }>();

    // No local container state needed, we bind directly to state.container
</script>

<div
    class="dashboard-builder flex-1 w-full flex flex-col bg-white overflow-hidden"
    oncontextmenu={(e) => state.handleContextMenu(e)}
    role="region"
    aria-label="Dashboard Designer"
>
    <!-- Canvas -->
    <main
        class="flex-1 p-0 overflow-y-auto"
        oncontextmenu={(e) => state.handleContextMenu(e)}
    >
        {#if state.isLoading}
            <div class="h-full flex items-center justify-center">
                <div
                    class="animate-pulse text-slate-300 font-black uppercase text-xs tracking-[0.2em]"
                >
                    Initialising Canvas...
                </div>
            </div>
        {:else if state.widgets.length === 0}
            <div
                class="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-200 rounded-[32px] p-12 text-center relative overflow-hidden"
                in:fade
            >
                <!-- Grid Background -->
                <div
                    class="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style="background-image: radial-gradient(#6366f1 1px, transparent 1px); background-size: 24px 24px;"
                ></div>

                <div class="relative z-10 flex flex-col items-center">
                    <div
                        class="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm ring-4 ring-indigo-50/50"
                    >
                        🎨
                    </div>
                    <h2
                        class="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter"
                    >
                        Canvas Ready
                    </h2>
                    <p class="text-slate-500 text-sm max-w-xs mb-8 font-medium">
                        This dashboard is your blank canvas. Open the palette to
                        start dropping components.
                    </p>
                    <button
                        onclick={() => (state.showPalette = true)}
                        class="bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        Open Component Palette
                    </button>
                </div>
            </div>
        {:else}
            <div
                bind:this={state.container}
                class="grid grid-cols-1 md:grid-cols-22 gap-6 relative"
                style="grid-auto-rows: 60px;"
                in:fade
            >
                {#if state.isResizing || state.isDragging}
                    <!-- Transparent Grid Layer -->
                    <div
                        class="absolute inset-0 z-0 grid grid-cols-22 gap-6 pointer-events-none fade-in"
                        style="grid-auto-rows: 60px;"
                    >
                        {#each Array(22 * 40) as _, i}
                            <div
                                class="bg-indigo-500/5 rounded-2xl border-2 border-indigo-500/10 min-h-[60px]"
                            ></div>
                        {/each}
                    </div>
                {/if}

                {#if state.isDragging && state.draggingWidget}
                    <!-- Dynamic Snap Placeholder -->
                    <div
                        class="rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-50/30 transition-all duration-75 z-10 pointer-events-none"
                        style="grid-column: {state.draggingWidget.x +
                            1} / span {state.draggingWidget
                            .cols}; grid-row: {state.draggingWidget.y +
                            1} / span {state.draggingWidget
                            .rows}; min-height: 60px;"
                    ></div>
                {/if}

                {#each state.widgets as widget (widget.id)}
                    <DashboardWidget {widget} {state} />
                {/each}
            </div>
        {/if}
    </main>
</div>
