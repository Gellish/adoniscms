<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { type DashboardState } from "$lib/dashboardState.svelte";

    let { state } = $props<{ state: DashboardState }>();

    function deleteWidget() {
        if (state.contextMenu.widgetId) {
            state.removeWidget(state.contextMenu.widgetId);
            state.closeContextMenu();
        }
    }

    function toggleLock() {
        if (state.contextMenu.widgetId) {
            const widget = state.widgets.find(
                (w) => w.id === state.contextMenu.widgetId,
            );
            if (widget) {
                widget.locked = !widget.locked;
                state.save();
                state.closeContextMenu();
            }
        }
    }
</script>

{#if state.contextMenu.visible}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 z-[100]"
        oncontextmenu={(e) => {
            e.preventDefault();
            state.closeContextMenu();
        }}
    ></div>

    <!-- Menu -->
    <div
        class="fixed z-[101] min-w-[220px] bg-white rounded-xl shadow-2xl border border-indigo-100 py-2 origin-top-left"
        style="left: {state.contextMenu.x}px; top: {state.contextMenu.y}px;"
        transition:scale={{ duration: 150, start: 0.95 }}
    >
        {#if state.contextMenu.widgetId}
            {@const targetWidget = state.widgets.find(
                (w) => w.id === state.contextMenu.widgetId,
            )}

            <!-- Lock / Unlock Item -->
            <button
                onclick={toggleLock}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-indigo-600 hover:bg-indigo-50 transition-colors text-sm font-bold group"
            >
                <div
                    class="p-1.5 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors"
                >
                    {#if targetWidget?.locked}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <rect x="3" y="11" width="18" height="11" rx="2"
                                ><title>Unlock</title></rect
                            ><path d="M7 11V7a5 5 0 0110 0v4"></path></svg
                        >
                    {:else}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                            ></rect><path d="M7 11V7a5 5 0 019.9-1"></path></svg
                        >
                    {/if}
                </div>
                <span>
                    {targetWidget?.locked
                        ? "Unlock Component"
                        : "Lock Component"}
                </span>
            </button>

            <div class="h-px bg-slate-100 my-1 mx-4"></div>

            <button
                onclick={deleteWidget}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-sm font-bold group"
            >
                <div
                    class="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2.5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                </div>
                Remove Component
            </button>
        {:else}
            <!-- Add New (Empty Area Click) -->
            <button
                onclick={() => {
                    state.showPalette = true;
                    state.closeContextMenu();
                }}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-indigo-600 hover:bg-indigo-50 transition-colors text-sm font-bold group"
            >
                <div
                    class="p-1.5 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2.5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </div>
                Add Component Here
            </button>
        {/if}
    </div>
{/if}
