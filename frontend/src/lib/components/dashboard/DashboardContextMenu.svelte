<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { type DashboardState } from "$lib/dashboardState.svelte";

    let { state: dashboardState } = $props<{ state: DashboardState }>();

    function deleteWidget() {
        if (dashboardState.contextMenu.widgetId) {
            dashboardState.removeWidget(dashboardState.contextMenu.widgetId);
            dashboardState.closeContextMenu();
        }
    }

    function toggleLock() {
        if (dashboardState.contextMenu.widgetId) {
            const widget = dashboardState.widgets.find(
                (w: any) => w.id === dashboardState.contextMenu.widgetId,
            );
            if (widget) {
                widget.locked = !widget.locked;
                dashboardState.save();
                dashboardState.closeContextMenu();
            }
        }
    }

    function duplicateWidget() {
        if (dashboardState.contextMenu.widgetId) {
            dashboardState.duplicateWidget(dashboardState.contextMenu.widgetId);
            dashboardState.closeContextMenu();
        }
    }

    function copyWidget() {
        if (dashboardState.contextMenu.widgetId) {
            dashboardState.copyWidget(dashboardState.contextMenu.widgetId);
            dashboardState.closeContextMenu();
        }
    }

    function cutWidget() {
        if (dashboardState.contextMenu.widgetId) {
            dashboardState.cutWidget(dashboardState.contextMenu.widgetId);
            dashboardState.closeContextMenu();
        }
    }

    function pasteWidget() {
        // Calculate grid position from menu coordinates
        if (!dashboardState.container) return;
        const rect = dashboardState.container.getBoundingClientRect();
        const x = Math.max(
            0,
            Math.round(
                (dashboardState.contextMenu.x - rect.left) /
                    dashboardState.cachedColWidth,
            ),
        );
        const y = Math.max(
            0,
            Math.round((dashboardState.contextMenu.y - rect.top) / 48),
        ); // 48 is rowHeight + gap approx

        dashboardState.pasteWidget(x, y);
        dashboardState.closeContextMenu();
    }

    let editingTitle = $state(false);
    let tempTitle = $state("");

    function openSettings() {
        if (dashboardState.contextMenu.widgetId) {
            const widget = dashboardState.widgets.find(
                (w: any) => w.id === dashboardState.contextMenu.widgetId,
            );
            if (widget) {
                tempTitle = widget.title || "";
                editingTitle = true;
            }
        }
    }

    function saveSettings() {
        if (dashboardState.contextMenu.widgetId) {
            dashboardState.updateWidget(dashboardState.contextMenu.widgetId, {
                title: tempTitle,
            });
            editingTitle = false;
            dashboardState.closeContextMenu();
        }
    }
</script>

{#if dashboardState.contextMenu.visible}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 z-[100]"
        role="presentation"
        onclick={() => dashboardState.closeContextMenu()}
        oncontextmenu={(e) => {
            e.preventDefault();
            dashboardState.closeContextMenu();
        }}
    ></div>

    <!-- Menu -->
    <div
        class="fixed z-[101] min-w-[220px] bg-white rounded-xl shadow-2xl border border-indigo-100 py-2 origin-top-left"
        style="left: {dashboardState.contextMenu.x}px; top: {dashboardState
            .contextMenu.y}px;"
        transition:scale={{ duration: 150, start: 0.95 }}
    >
        {#if dashboardState.contextMenu.widgetId}
            {@const targetWidget = dashboardState.widgets.find(
                (w: any) => w.id === dashboardState.contextMenu.widgetId,
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

            <!-- Settings -->
            <button
                onclick={openSettings}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold group"
            >
                <div
                    class="p-1.5 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors"
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
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                </div>
                Settings
            </button>

            <div class="h-px bg-slate-100 my-1 mx-4"></div>

            <!-- Duplicate -->
            <button
                onclick={duplicateWidget}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold group"
            >
                <div
                    class="p-1.5 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors"
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
                            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                        />
                    </svg>
                </div>
                Duplicate
            </button>

            <!-- Copy -->
            <button
                onclick={copyWidget}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold group"
            >
                <div
                    class="p-1.5 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors"
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
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                        />
                    </svg>
                </div>
                Copy
            </button>

            <!-- Cut -->
            <button
                onclick={cutWidget}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold group"
            >
                <div
                    class="p-1.5 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors"
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
                            d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 11-4.243-4.243 3 3 0 014.243 4.243z"
                        />
                    </svg>
                </div>
                Cut
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
                    dashboardState.showPalette = true;
                    dashboardState.closeContextMenu();
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

            {#if dashboardState.clipboard}
                <button
                    onclick={pasteWidget}
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-emerald-600 hover:bg-emerald-50 transition-colors text-sm font-bold group"
                >
                    <div
                        class="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors"
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
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                    </div>
                    Paste Component
                </button>
            {/if}
        {/if}
    </div>

    <!-- Settings Modal (Title Edit) -->
    {#if editingTitle}
        <div
            class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-white rounded-2xl shadow-2xl p-6 w-[350px] border border-slate-100"
                transition:scale={{ start: 0.9, duration: 200 }}
            >
                <h3
                    class="text-sm font-black text-slate-800 uppercase tracking-tighter mb-4"
                >
                    Widget Settings
                </h3>

                <div class="space-y-4">
                    <div>
                        <label
                            for="widget-title-input"
                            class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"
                            >Widget Title</label
                        >
                        <input
                            id="widget-title-input"
                            type="text"
                            bind:value={tempTitle}
                            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="Enter title..."
                        />
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2 mt-6">
                    <button
                        onclick={() => (editingTitle = false)}
                        class="px-4 py-2 rounded-lg text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onclick={saveSettings}
                        class="px-4 py-2 bg-indigo-600 rounded-lg text-xs font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    {/if}
{/if}
