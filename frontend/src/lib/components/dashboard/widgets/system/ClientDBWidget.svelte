<script lang="ts">
    import { onMount, tick } from "svelte";
    import { ClientDB } from "$lib/client-db/core";
    import TableDesigner from "$lib/components/TableDesigner.svelte";
    import DataGrid from "$lib/components/DataGrid.svelte";
    import type { DashboardState } from "$lib/dashboardState.svelte";
    import type { Widget } from "$lib/components/dashboard/widgetConfig";

    let {
        widget,
        state: dashboardState,
        isMaximized = false,
        onToggleMaximize = () => {},
    } = $props<{
        widget?: Widget;
        state?: DashboardState;
        isMaximized?: boolean;
        onToggleMaximize?: () => void;
    }>();

    // Replicate System Tables constant
    const SYSTEM_TABLES = [
        { name: "superadmin", isSystem: true },
        { name: "menus", isSystem: true },
        { name: "_meta", isSystem: true },
        { name: "_syncQueue", isSystem: true },
    ];

    let tables = $state(SYSTEM_TABLES as any[]);
    let activeTable = $state(null as any | null);
    let view = $state("tables" as "tables" | "data" | "sync");

    // Widget specific: Container dimensions can be small, so we might need responsive tweaks
    // But for now, we try to fit the layout.

    onMount(async () => {
        await refreshTables();
    });

    async function refreshTables() {
        const db = await ClientDB.init();
        const userTables = await db.getAll("_meta");
        tables = [...SYSTEM_TABLES, ...userTables];
    }
</script>

<div
    class="flex flex-col h-full bg-[#f0f2f5] font-sans text-gray-900 overflow-hidden relative"
>
    <!-- Header (Condensed for Widget) -->
    <header
        class="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm shrink-0 z-20 cursor-grab active:cursor-grabbing group/header"
        onmousedown={(e) => dashboardState?.startDrag(e, widget!)}
        role="button"
        tabindex="0"
        aria-label="Drag widget"
    >
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
                <div
                    class="w-8 h-8 bg-primary-600 rounded flex items-center justify-center text-white font-bold"
                >
                    C
                </div>
                <h1
                    class="font-black text-lg tracking-tighter uppercase whitespace-nowrap"
                >
                    ClientDB <span class="text-primary-600">Builder</span>
                </h1>
            </div>
            <div class="hidden sm:block h-6 w-[1px] bg-gray-200"></div>
            <div class="flex items-center gap-2">
                <span
                    class="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest animate-pulse"
                >
                    Superadmin
                </span>
                <span
                    class="bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 whitespace-nowrap"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    LOCALHOST ONLY
                </span>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <div
                class="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded"
            >
                <div
                    class="w-2 h-2 bg-green-500 rounded-full animate-ping"
                ></div>
                <span class="text-[10px] font-bold text-green-700 uppercase"
                    >System Ready: Offline-First</span
                >
            </div>

            <!-- Widget Controls -->
            <div
                class="flex items-center gap-1 ml-4 border-l border-gray-200 pl-4 opacity-0 group-hover/header:opacity-100 transition-opacity"
            >
                <button
                    onclick={(e) => {
                        e.stopPropagation();
                        onToggleMaximize && onToggleMaximize();
                    }}
                    class="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
                    title={isMaximized ? "Minimize" : "Maximize"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {#if isMaximized}
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 9L4 4m0 0l5 0m-5 0l0 5M15 15l5 5m0 0l-5 0m5 0l0-5"
                            />
                        {:else}
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                            />
                        {/if}
                    </svg>
                </button>
            </div>
        </div>
    </header>

    <div class="flex-1 flex min-h-0">
        <!-- Sidebar -->
        <aside
            class="w-64 bg-white border-r border-gray-200 flex flex-col p-4 shadow-[inset_-2px_0_5px_rgba(0,0,0,0.02)] overflow-y-auto hidden md:flex"
        >
            <nav class="space-y-1 mb-4">
                <button
                    onclick={() => (view = "tables")}
                    class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-3 {view ===
                    'tables'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-500 hover:bg-gray-50'}"
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
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                    Schema Designer
                </button>
                <button
                    onclick={() => (view = "sync")}
                    class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-3 {view ===
                    'sync'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-500 hover:bg-gray-50'}"
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Sync Engine
                </button>
            </nav>

            <div>
                <h3
                    class="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3"
                >
                    Your Entities
                </h3>
                <div class="space-y-0.5">
                    {#each tables as table}
                        <button
                            onclick={() => {
                                activeTable = table;
                                view = "data";
                            }}
                            class="w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between {activeTable?.name ===
                                table.name && view === 'data'
                                ? 'bg-gray-100 text-gray-900 border-l-4 border-primary-600'
                                : 'text-gray-500 hover:bg-gray-50'}"
                        >
                            <div class="flex flex-col truncate">
                                <span class="truncate">{table.name}</span>
                                {#if table.isSystem}
                                    <span
                                        class="text-[8px] text-primary-500 uppercase tracking-tighter"
                                        >(system)</span
                                    >
                                {/if}
                            </div>
                        </button>
                    {/each}
                    {#if tables.length === 0}
                        <p class="px-4 text-[10px] text-gray-400 italic">
                            No entities defined yet.
                        </p>
                    {/if}
                </div>
            </div>
        </aside>

        <!-- Main Workspace -->
        <main
            class="flex-1 bg-gray-50 flex flex-col min-w-0 p-8 overflow-y-auto"
        >
            {#if view === "tables"}
                <!-- We wrap TableDesigner to ensure it fits -->
                <div class="w-full">
                    <TableDesigner on:created={refreshTables} />
                </div>
            {:else if view === "data"}
                {#if activeTable}
                    <div class="h-full flex flex-col">
                        <h2
                            class="text-sm font-black uppercase mb-2 flex items-center gap-2"
                        >
                            <span class="text-primary-600">Viewing Data:</span>
                            {activeTable.name}
                        </h2>
                        <div
                            class="flex-1 min-h-0 border border-gray-200 rounded-lg overflow-hidden bg-white"
                        >
                            <DataGrid
                                tableName={activeTable.name}
                                readOnly={activeTable.isSystem}
                            />
                        </div>
                    </div>
                {/if}
            {:else if view === "sync"}
                <div
                    class="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                    <h2
                        class="text-lg font-black mb-4 uppercase tracking-tighter"
                    >
                        Sync Configuration
                    </h2>
                    <div class="space-y-4">
                        <div
                            class="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                            <p
                                class="text-[9px] font-black text-gray-400 uppercase mb-1"
                            >
                                Selected Provider
                            </p>
                            <span class="font-bold text-xs text-primary-600"
                                >Localhost Developer API</span
                            >
                        </div>
                    </div>
                </div>
            {/if}
        </main>
    </div>
</div>
