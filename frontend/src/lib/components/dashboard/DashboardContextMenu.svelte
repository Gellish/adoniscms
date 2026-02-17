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
    let activeTab = $state("properties");

    // Grouping settings for cleaner state management
    let tempSettings = $state({
        title: "",
        tableName: "",
        peekMode: "center",
        borderRadius: "default" as any,
        backgroundMode: "glass" as any,
        opacity: 100,
        layout: "block",
        direction: "col",
        gap: 0,
    });

    function openSettings() {
        if (dashboardState.contextMenu.widgetId) {
            const widget = dashboardState.widgets.find(
                (w: any) => w.id === dashboardState.contextMenu.widgetId,
            );
            if (widget) {
                tempSettings.title = widget.title || "";
                tempSettings.tableName = widget.data?.tableName || "";
                tempSettings.peekMode = widget.settings?.peekMode || "center";
                tempSettings.borderRadius =
                    widget.settings?.borderRadius || "default";
                tempSettings.backgroundMode =
                    widget.settings?.backgroundMode || "glass";
                tempSettings.opacity = widget.settings?.opacity ?? 100;
                tempSettings.layout = widget.settings?.layout || "block";
                tempSettings.direction = widget.settings?.direction || "col";
                tempSettings.gap = widget.settings?.gap ?? 0;

                editingTitle = true;
                activeTab = "properties";
            }
        }
    }

    function saveSettings() {
        if (dashboardState.contextMenu.widgetId) {
            const widget = dashboardState.widgets.find(
                (w: any) => w.id === dashboardState.contextMenu.widgetId,
            );
            if (widget) {
                const updates: any = {
                    title: tempSettings.title,
                    settings: {
                        ...widget.settings,
                        peekMode: tempSettings.peekMode,
                        borderRadius: tempSettings.borderRadius,
                        backgroundMode: tempSettings.backgroundMode,
                        opacity: tempSettings.opacity,
                        layout: tempSettings.layout,
                        direction: tempSettings.direction,
                        gap: tempSettings.gap,
                    },
                };

                if (widget.type === "table") {
                    updates.data = {
                        ...widget.data,
                        tableName: tempSettings.tableName,
                    };
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

{#snippet sectionHeader(title: string, colorClass: string)}
    <h4
        class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"
    >
        <span class="w-1 h-1 {colorClass} rounded-full"></span>
        {title}
    </h4>
{/snippet}

{#snippet segmentControl(
    label: string,
    options: string[],
    currentValue: string,
    onclick: (val: any) => void,
)}
    <div class="space-y-4">
        <span
            class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider"
            >{label}</span
        >
        <div
            class="p-1 bg-slate-100 rounded-2xl grid grid-cols-{options.length} gap-1"
        >
            {#each options as opt}
                <button
                    onclick={() => onclick(opt)}
                    class="py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all {currentValue ===
                    opt
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'}"
                >
                    {opt}
                </button>
            {/each}
        </div>
    </div>
{/snippet}

{#snippet styleSlider(
    id: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    suffix: string,
    oninput: (e: any) => void,
)}
    <div>
        <div class="flex justify-between items-center mb-4">
            <label
                for={id}
                class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                >{label}</label
            >
            <span
                class="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg"
                >{value}{suffix}</span
            >
        </div>
        <div class="relative flex items-center">
            <div
                class="absolute inset-0 h-1.5 bg-slate-100 rounded-full overflow-hidden"
            >
                <div
                    class="h-full bg-indigo-600"
                    style="width: {((value - min) / (max - min)) * 100}%"
                ></div>
            </div>
            <input
                {id}
                type="range"
                {min}
                {max}
                {step}
                {value}
                {oninput}
                class="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer z-10 accent-indigo-600"
            />
        </div>
    </div>
{/snippet}

{#snippet menuItem(
    label: string,
    onclick: () => void,
    icon: any,
    colorClass: string = "text-slate-700",
    bgClass: string = "bg-slate-100",
    hoverBgClass: string = "hover:bg-slate-50",
    iconHoverBgClass: string = "group-hover:bg-slate-200",
)}
    <button
        {onclick}
        class="w-full flex items-center gap-3 px-4 py-2.5 {colorClass} {hoverBgClass} transition-colors text-sm font-bold group"
    >
        <div
            class="p-1.5 {bgClass} rounded-lg {iconHoverBgClass} transition-colors"
        >
            {@render icon()}
        </div>
        <span>{label}</span>
    </button>
{/snippet}

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
            {#snippet lockIcon()}
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
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                        ></rect><path d="M7 11V7a5 5 0 019.9-1"></path></svg
                    >
                {/if}
            {/snippet}

            {@render menuItem(
                targetWidget?.locked ? "Unlock" : "Lock",
                toggleLock,
                lockIcon,
                "text-indigo-600",
                "bg-indigo-100",
                "hover:bg-indigo-50",
                "group-hover:bg-indigo-200",
            )}

            <div class="h-px bg-slate-100 my-1 mx-4"></div>

            <!-- Settings -->
            {#snippet settingsIcon()}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
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
            {/snippet}
            {@render menuItem("Settings", openSettings, settingsIcon)}

            <div class="h-px bg-slate-100 my-1 mx-4"></div>

            <!-- Duplicate -->
            {#snippet duplicateIcon()}
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
            {/snippet}
            {@render menuItem("Duplicate", duplicateWidget, duplicateIcon)}

            <!-- Copy -->
            {#snippet copyIcon()}
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
            {/snippet}
            {@render menuItem("Copy", copyWidget, copyIcon)}

            <!-- Cut -->
            {#snippet cutIcon()}
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
            {/snippet}
            {@render menuItem("Cut", cutWidget, cutIcon)}

            <div class="h-px bg-slate-100 my-1 mx-4"></div>

            {#snippet deleteIcon()}
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
            {/snippet}
            {@render menuItem(
                "Delete",
                deleteWidget,
                deleteIcon,
                "text-red-600",
                "bg-red-100",
                "hover:bg-red-50",
                "group-hover:bg-red-200",
            )}
        {:else}
            <!-- Add New (Empty Area Click) -->
            {#snippet addIcon()}
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
            {/snippet}
            {@render menuItem(
                "Add Component Here",
                () => {
                    dashboardState.createWidget();
                    dashboardState.closeContextMenu();
                },
                addIcon,
            )}

            {#if dashboardState.clipboard}
                {#snippet pasteIcon()}
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
                {/snippet}
                {@render menuItem(
                    "Paste Component",
                    pasteWidget,
                    pasteIcon,
                    "text-emerald-600",
                    "bg-emerald-100",
                    "hover:bg-emerald-50",
                    "group-hover:bg-emerald-200",
                )}
            {/if}
        {/if}
    </div>
    {#if editingTitle}
        {@const targetWidget = dashboardState.widgets.find(
            (w: any) => w.id === dashboardState.contextMenu.widgetId,
        )}
        <!-- Sidebar Backdrop -->
        <div
            class="fixed inset-0 z-[200] bg-slate-900/20 backdrop-blur-[2px]"
            transition:fade
            onclick={() => (editingTitle = false)}
            onkeydown={(e) => e.key === "Escape" && (editingTitle = false)}
            role="button"
            tabindex="0"
            aria-label="Close settings"
        ></div>

        <!-- Sidebar Drawer -->
        <div
            class="fixed top-0 right-0 z-[201] bg-white w-[400px] h-full shadow-[-32px_0_64px_rgba(0,0,0,0.1)] border-l border-slate-200 flex flex-col overflow-hidden"
            transition:slide={{ axis: "x", duration: 300 }}
            role="dialog"
            aria-label="Sidebar settings"
        >
            <!-- Panel Header -->
            <div
                class="px-6 py-8 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50"
            >
                <div class="flex items-center justify-between">
                    <h3
                        class="text-xs font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2"
                    >
                        <span
                            class="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-[10px]"
                            >🎨</span
                        >
                        Element Styles
                    </h3>
                    <button
                        onclick={() => (editingTitle = false)}
                        class="text-slate-400 hover:text-slate-900 transition-colors"
                        aria-label="Close settings"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </button>
                </div>

                <!-- Selection Display -->
                <div
                    class="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-mono text-slate-500"
                >
                    <span class="text-indigo-600 font-bold">#</span>
                    <span class="truncate">{targetWidget?.id}</span>
                    <span
                        class="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold uppercase ml-auto"
                        >.{targetWidget?.type}</span
                    >
                </div>

                <!-- Tabs -->
                <div
                    class="p-1 bg-slate-200/50 rounded-xl grid grid-cols-2 gap-1 mt-2"
                >
                    <button
                        onclick={() => (activeTab = "properties")}
                        class="py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all {activeTab ===
                        'properties'
                            ? 'bg-white text-indigo-600 shadow-sm shadow-black/5'
                            : 'text-slate-500 hover:text-slate-800'}"
                    >
                        Properties
                    </button>
                    <button
                        onclick={() => (activeTab = "styles")}
                        class="py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all {activeTab ===
                        'styles'
                            ? 'bg-white text-indigo-600 shadow-sm shadow-black/5'
                            : 'text-slate-500 hover:text-slate-800'}"
                    >
                        Styles
                    </button>
                </div>
            </div>

            <!-- Panel Content -->
            <div class="flex-1 overflow-y-auto px-6 py-8 space-y-12">
                {#if activeTab === "properties"}
                    <div class="space-y-8" in:fade>
                        {@render sectionHeader(
                            "General Configuration",
                            "bg-slate-300",
                        )}
                        <div class="space-y-4">
                            <div>
                                <label
                                    for="side-widget-title"
                                    class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2"
                                    >Display Title</label
                                >
                                <input
                                    id="side-widget-title"
                                    type="text"
                                    bind:value={tempSettings.title}
                                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            {#if targetWidget?.type === "table"}
                                <div>
                                    <label
                                        for="side-data-source"
                                        class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2"
                                        >Table Source</label
                                    >
                                    <select
                                        id="side-data-source"
                                        bind:value={tempSettings.tableName}
                                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <optgroup label="System Tables">
                                            <option value="posts">Posts</option>
                                            <option value="users">Users</option>
                                            <option value="menus">Menus</option>
                                        </optgroup>
                                        {#if adminState.tables.length > 0}
                                            <optgroup label="Custom Tables">
                                                {#each adminState.tables as table}
                                                    <option value={table.name}
                                                        >{table.name}</option
                                                    >
                                                {/each}
                                            </optgroup>
                                        {/if}
                                    </select>
                                </div>

                                {@render segmentControl(
                                    "Peek Mode",
                                    ["center", "side", "full"],
                                    tempSettings.peekMode,
                                    (val) => (tempSettings.peekMode = val),
                                )}
                            {/if}
                        </div>
                    </div>
                {:else if activeTab === "styles"}
                    <div class="space-y-12" in:fade>
                        <!-- Layout -->
                        <section>
                            {@render sectionHeader("Layout", "bg-indigo-400")}
                            <div class="space-y-6">
                                <div class="space-y-4">
                                    <span
                                        class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                                        >Display Mode</span
                                    >
                                    <div class="grid grid-cols-2 gap-2">
                                        {#each ["block", "flex"] as mode}
                                            <button
                                                onclick={() =>
                                                    (tempSettings.layout =
                                                        mode)}
                                                class="px-4 py-3 rounded-xl border flex items-center gap-3 transition-all {tempSettings.layout ===
                                                mode
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}"
                                            >
                                                <div
                                                    class="w-4 h-4 border-2 border-current rounded-sm flex {mode ===
                                                    'block'
                                                        ? 'flex-col'
                                                        : 'items-center'} gap-0.5 p-0.5 opacity-60"
                                                >
                                                    <div
                                                        class="{mode === 'block'
                                                            ? 'w-full h-1'
                                                            : 'w-1 h-full'} bg-current rounded-3xl"
                                                    ></div>
                                                    <div
                                                        class="{mode === 'block'
                                                            ? 'w-full h-1'
                                                            : 'w-1 h-full'} bg-current rounded-3xl"
                                                    ></div>
                                                </div>
                                                <span
                                                    class="text-[9px] font-black uppercase tracking-widest"
                                                    >{mode}</span
                                                >
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                {#if tempSettings.layout === "flex"}
                                    <div in:slide class="space-y-4">
                                        <span
                                            class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                                            >Direction</span
                                        >
                                        <div class="grid grid-cols-4 gap-2">
                                            {#each ["row", "col", "row-reverse", "col-reverse"] as dir}
                                                <button
                                                    onclick={() =>
                                                        (tempSettings.direction =
                                                            dir)}
                                                    class="aspect-square rounded-xl border flex items-center justify-center transition-all {tempSettings.direction ===
                                                    dir
                                                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}"
                                                    title={dir}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        class="h-4 w-4 transform {dir.includes(
                                                            'row',
                                                        )
                                                            ? ''
                                                            : 'rotate-90'} {dir.includes(
                                                            'reverse',
                                                        )
                                                            ? 'rotate-180'
                                                            : ''}"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fill-rule="evenodd"
                                                            d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                                                            clip-rule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}

                                {@render styleSlider(
                                    "sidebar-gap",
                                    "Gap (Spacing)",
                                    tempSettings.gap,
                                    0,
                                    40,
                                    1,
                                    "px",
                                    (e: any) =>
                                        (tempSettings.gap = parseInt(
                                            e.target.value,
                                        )),
                                )}
                            </div>
                        </section>

                        <!-- Aesthetics -->
                        <section>
                            {@render sectionHeader(
                                "Aesthetics",
                                "bg-indigo-400",
                            )}
                            <div class="space-y-8">
                                <div class="space-y-4">
                                    <span
                                        class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                                        >Corner Rounding</span
                                    >
                                    <div class="grid grid-cols-4 gap-2">
                                        {#each ["none", "default", "lg", "full"] as r}
                                            <button
                                                onclick={() =>
                                                    (tempSettings.borderRadius =
                                                        r)}
                                                class="px-2 py-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all {tempSettings.borderRadius ===
                                                r
                                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200'
                                                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}"
                                            >
                                                <div
                                                    class="w-6 h-6 border-t-2 border-l-2 border-current {r ===
                                                    'none'
                                                        ? 'rounded-none'
                                                        : r === 'default'
                                                          ? 'rounded-tl-[8px]'
                                                          : r === 'lg'
                                                            ? 'rounded-tl-[16px]'
                                                            : 'rounded-full'}"
                                                ></div>
                                                <span
                                                    class="text-[8px] font-black uppercase tracking-widest"
                                                    >{r}</span
                                                >
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                {@render segmentControl(
                                    "Background Mode",
                                    ["glass", "solid", "transparent"],
                                    tempSettings.backgroundMode,
                                    (val) =>
                                        (tempSettings.backgroundMode = val),
                                )}
                                {@render styleSlider(
                                    "sidebar-opacity",
                                    "Opacity",
                                    tempSettings.opacity,
                                    0,
                                    100,
                                    5,
                                    "%",
                                    (e: any) =>
                                        (tempSettings.opacity = parseInt(
                                            e.target.value,
                                        )),
                                )}
                            </div>
                        </section>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div
                class="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3"
            >
                <button
                    onclick={() => (editingTitle = false)}
                    class="flex-1 py-4 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >Discard</button
                >
                <button
                    onclick={saveSettings}
                    class="flex-[2] py-4 bg-indigo-600 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                    >Apply Changes</button
                >
            </div>
        </div>
    {/if}
{/if}
