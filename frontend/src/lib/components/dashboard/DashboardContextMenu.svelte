<script lang="ts">
    import { fade, slide, scale } from "svelte/transition";
    import { type DashboardState } from "$lib/dashboardState.svelte";
    import { adminState } from "$lib/adminState.svelte";

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
    let tempTableName = $state("");
    let activeTab = $state("properties");
    let tempPeekMode = $state("center");
    let tempBorderRadius = $state<any>("default");
    let tempBackgroundMode = $state<any>("glass");
    let tempOpacity = $state(100);
    let tempLayout = $state("block");
    let tempDirection = $state("col");

    function openSettings() {
        if (dashboardState.contextMenu.widgetId) {
            const widget = dashboardState.widgets.find(
                (w: any) => w.id === dashboardState.contextMenu.widgetId,
            );
            if (widget) {
                tempTitle = widget.title || "";
                tempTableName = widget.data?.tableName || "";
                tempPeekMode = widget.settings?.peekMode || "center";
                tempBorderRadius = widget.settings?.borderRadius || "default";
                tempBackgroundMode = widget.settings?.backgroundMode || "glass";
                tempOpacity = widget.settings?.opacity ?? 100;
                tempLayout = widget.settings?.layout || "block";
                tempDirection = widget.settings?.direction || "col";
                tempGap = widget.settings?.gap ?? 0;
                editingTitle = true;
                activeTab = "properties";
            }
        }
    }

    let tempGap = $state(0);

    function saveSettings() {
        if (dashboardState.contextMenu.widgetId) {
            const widget = dashboardState.widgets.find(
                (w: any) => w.id === dashboardState.contextMenu.widgetId,
            );
            if (widget) {
                const updates: any = { 
                    title: tempTitle,
                    settings: {
                        ...widget.settings,
                        peekMode: tempPeekMode,
                        borderRadius: tempBorderRadius,
                        backgroundMode: tempBackgroundMode,
                        opacity: tempOpacity,
                        layout: tempLayout,
                        direction: tempDirection,
                        gap: tempGap,
                    }
                };

                if (widget.type === "table") {
                    updates.data = { ...widget.data, tableName: tempTableName };
                }

                dashboardState.updateWidget(
                    dashboardState.contextMenu.widgetId,
                    updates,
                );
            }
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
                    {targetWidget?.locked ? "Unlock" : "Lock"}
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
                Delete
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
    {#if editingTitle}
        {@const targetWidget = dashboardState.widgets.find(
            (w: any) => w.id === dashboardState.contextMenu.widgetId,
        )}
        <div
            class="fixed inset-0 z-[200] flex justify-end bg-slate-900/20 backdrop-blur-[2px]"
            transition:fade
            onclick={() => (editingTitle = false)}
            role="presentation"
        >
            <div
                class="bg-white w-[400px] h-full shadow-[-32px_0_64px_rgba(0,0,0,0.1)] border-l border-slate-200 flex flex-col overflow-hidden"
                transition:slide={{ axis: 'x', duration: 300 }}
                onclick={(e) => e.stopPropagation()}
                role="region"
            >
                <!-- Panel Header -->
                <div class="px-6 py-8 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xs font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                            <span class="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-[10px]">🎨</span>
                            Element Styles
                        </h3>
                        <button 
                            onclick={() => editingTitle = false}
                            class="text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <!-- Selection Display -->
                    <div class="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-mono text-slate-500">
                        <span class="text-indigo-600 font-bold">#</span>
                        <span class="truncate">{targetWidget?.id}</span>
                        <span class="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold uppercase ml-auto">.{targetWidget?.type}</span>
                    </div>

                    <!-- Tabs -->
                    <div class="p-1 bg-slate-200/50 rounded-xl grid grid-cols-2 gap-1 mt-2">
                        <button 
                            onclick={() => activeTab = "properties"}
                            class="py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all {activeTab === 'properties' ? 'bg-white text-indigo-600 shadow-sm shadow-black/5' : 'text-slate-500 hover:text-slate-800'}"
                        >
                            Properties
                        </button>
                        <button 
                            onclick={() => activeTab = "styles"}
                            class="py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all {activeTab === 'styles' ? 'bg-white text-indigo-600 shadow-sm shadow-black/5' : 'text-slate-500 hover:text-slate-800'}"
                        >
                            Styles
                        </button>
                    </div>
                </div>

                <!-- Panel Content -->
                <div class="flex-1 overflow-y-auto px-6 py-8 space-y-12">
                    {#if activeTab === 'properties'}
                        <div class="space-y-8" in:fade>
                            <!-- General -->
                            <section>
                                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    General Configuration
                                </h4>
                                <div class="space-y-4">
                                    <div>
                                        <label for="side-widget-title" class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Display Title</label>
                                        <input
                                            id="side-widget-title"
                                            type="text"
                                            bind:value={tempTitle}
                                            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>

                                    {#if targetWidget?.type === "table"}
                                        <div>
                                            <label for="side-data-source" class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Data Source</label>
                                            <select
                                                id="side-data-source"
                                                bind:value={tempTableName}
                                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="posts">Posts (System)</option>
                                                <option value="users">Users (System)</option>
                                                {#each adminState.tables as table}
                                                    <option value={table.name}>{table.name} (Custom)</option>
                                                {/each}
                                            </select>
                                        </div>

                                        <div>
                                            <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-4">Editing Interface (Peek)</label>
                                            <div class="grid grid-cols-3 gap-2">
                                                {#each ["center", "side", "full"] as mode}
                                                    <button
                                                        onclick={() => (tempPeekMode = mode)}
                                                        class="aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all {tempPeekMode === mode ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}"
                                                    >
                                                        <div class="w-6 h-4 border border-current rounded-sm flex items-center justify-center opacity-40">
                                                            <div class="w-2 h-2 bg-current rounded-full"></div>
                                                        </div>
                                                        <span class="text-[9px] font-black uppercase tracking-tighter">{mode}</span>
                                                    </button>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </section>
                        </div>
                    {:else}
                        <div class="space-y-12" in:fade>
                            <!-- Layout Section -->
                            <section>
                                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span class="w-1 h-1 bg-indigo-400 rounded-full"></span>
                                    Layout
                                </h4>
                                
                                <div class="space-y-6">
                                    <!-- Display Mode -->
                                    <div>
                                        <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-4">Display Mode</span>
                                        <div class="grid grid-cols-2 gap-2">
                                            <button
                                                onclick={() => (tempLayout = "block")}
                                                class="px-4 py-3 rounded-xl border flex items-center gap-3 transition-all {tempLayout === 'block' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}"
                                            >
                                                <div class="w-4 h-4 border-2 border-current rounded-sm flex flex-col gap-0.5 p-0.5 opacity-60">
                                                    <div class="w-full h-1 bg-current rounded-3xl"></div>
                                                    <div class="w-full h-1 bg-current rounded-3xl"></div>
                                                </div>
                                                <span class="text-[9px] font-black uppercase tracking-widest">Block</span>
                                            </button>
                                            <button
                                                onclick={() => (tempLayout = "flex")}
                                                class="px-4 py-3 rounded-xl border flex items-center gap-3 transition-all {tempLayout === 'flex' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}"
                                            >
                                                <div class="w-4 h-4 border-2 border-current rounded-sm flex items-center gap-0.5 p-0.5 opacity-60">
                                                    <div class="w-1 h-full bg-current rounded-3xl"></div>
                                                    <div class="w-1 h-full bg-current rounded-3xl"></div>
                                                </div>
                                                <span class="text-[9px] font-black uppercase tracking-widest">Flex</span>
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Direction (only if Flex) -->
                                    {#if tempLayout === 'flex'}
                                        <div in:slide>
                                            <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-4">Direction</span>
                                            <div class="grid grid-cols-4 gap-2">
                                                {#each ["row", "col", "row-reverse", "col-reverse"] as dir}
                                                    <button
                                                        onclick={() => (tempDirection = dir)}
                                                        class="aspect-square rounded-xl border flex items-center justify-center transition-all {tempDirection === dir ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}"
                                                        title={dir}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform {dir.includes('row') ? '' : 'rotate-90'} {dir.includes('reverse') ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                                                        </svg>
                                                    </button>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </section>

                            <!-- Aesthetics Section -->
                            <section>
                                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span class="w-1 h-1 bg-indigo-400 rounded-full"></span>
                                    Aesthetics
                                </h4>
                                
                                <div class="space-y-8">
                                    <!-- Rounding -->
                                    <div>
                                        <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-4">Corner Rounding (Radius)</span>
                                        <div class="grid grid-cols-4 gap-2">
                                            {#each ["none", "default", "lg", "full"] as r}
                                                <button
                                                    onclick={() => (tempBorderRadius = r)}
                                                    class="px-2 py-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all {tempBorderRadius === r ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}"
                                                >
                                                    <div class="w-6 h-6 border-t-2 border-l-2 border-current 
                                                        {r === 'none' ? 'rounded-none' : 
                                                         r === 'default' ? 'rounded-tl-[8px]' : 
                                                         r === 'lg' ? 'rounded-tl-[16px]' : 'rounded-full'}"
                                                    ></div>
                                                    <span class="text-[8px] font-black uppercase tracking-widest">{r}</span>
                                                </button>
                                            {/each}
                                        </div>
                                    </div>

                                    <!-- Background Mode -->
                                    <div>
                                        <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-4">Background Mode</span>
                                        <div class="p-1 bg-slate-100 rounded-2xl grid grid-cols-3 gap-1">
                                            {#each ["glass", "solid", "transparent"] as mode}
                                                <button
                                                    onclick={() => (tempBackgroundMode = mode)}
                                                    class="py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all {tempBackgroundMode ===  mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}"
                                                >
                                                    {mode}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>

                                    <!-- Opacity -->
                                    <div>
                                        <div class="flex justify-between items-center mb-4">
                                            <label for="sidebar-opacity" class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Background Opacity</label>
                                            <span class="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{tempOpacity}%</span>
                                        </div>
                                        <div class="relative flex items-center">
                                            <div class="absolute inset-0 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div class="h-full bg-indigo-600" style="width: {tempOpacity}%"></div>
                                            </div>
                                            <input
                                                id="sidebar-opacity"
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                bind:value={tempOpacity}
                                                class="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer z-10 accent-indigo-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <!-- Future Section Placeholder -->
                            <section class="opacity-30 pointer-events-none grayscale">
                                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    Layout (Beta)
                                </h4>
                                <div class="p-6 border-4 border-dashed border-slate-100 rounded-[32px] text-center">
                                    <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">More styling options coming soon</span>
                                </div>
                            </section>
                        </div>
                    {/if}
                </div>

                <!-- Footer -->
                <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <button
                        onclick={() => (editingTitle = false)}
                        class="flex-1 py-4 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        onclick={saveSettings}
                        class="flex-[2] py-4 bg-indigo-600 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    {/if}
