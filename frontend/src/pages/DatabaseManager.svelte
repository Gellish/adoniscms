<script lang="ts">
    import { onMount } from "svelte";
    import { ClientDB } from "$lib/client-db/core";
    import { SyncEngine } from "$lib/client-db/sync/engine";
    import TableDesigner from "$lib/components/TableDesigner.svelte";
    import DataGrid from "$lib/components/DataGrid.svelte";
    import AdminMenus from "$pages/AdminMenus.svelte";

    const SYSTEM_TABLES = [
        { name: "superadmin", isSystem: true },
        { name: "_meta", isSystem: true },
        { name: "_syncQueue", isSystem: true },
    ];

    let tables = $state<any[]>(SYSTEM_TABLES);
    let activeTable = $state<any | null>(null);
    let view = $state<"tables" | "data" | "sync" | "menus">("tables");

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
    class="h-screen flex flex-col bg-[#f0f2f5] font-sans text-gray-900 overflow-hidden"
>
    <!-- Top Bar: SUPERADMIN & WARNING -->
    <header
        class="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm z-50"
    >
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
                <div
                    class="w-8 h-8 bg-primary-600 rounded flex items-center justify-center text-white font-bold"
                >
                    C
                </div>
                <h1 class="font-black text-lg tracking-tighter uppercase">
                    ClientDB <span class="text-primary-600">Builder</span>
                </h1>
            </div>
            <div class="h-6 w-[1px] bg-gray-200"></div>
            <div class="flex items-center gap-2">
                <span
                    class="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest animate-pulse"
                >
                    Superadmin
                </span>
                <span
                    class="bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"
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
        </div>
    </header>

    <div class="flex-1 flex min-h-0">
        <!-- Dashboard Sidebar -->
        <aside
            class="w-64 bg-white border-r border-gray-200 flex flex-col p-4 shadow-[inset_-2px_0_5px_rgba(0,0,0,0.02)]"
        >
            <nav class="space-y-1">
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
                <button
                    onclick={() => (view = "menus")}
                    class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-3 {view ===
                    'menus'
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
                            d="M4 6h16M4 12h16m-7 6h7"
                        />
                    </svg>
                    Menu Builder
                </button>
            </nav>

            <div class="mt-10">
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
                            <div class="flex flex-col">
                                <span>{table.name}</span>
                                {#if table.isSystem}
                                    <span
                                        class="text-[8px] text-primary-500 uppercase tracking-tighter"
                                        >(system)</span
                                    >
                                {/if}
                            </div>
                            {#if table.isEncrypted}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-3 w-3 text-amber-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            {/if}
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
                <TableDesigner on:created={refreshTables} />
            {:else if view === "data"}
                {#if activeTable}
                    <DataGrid
                        tableName={activeTable.name}
                        readOnly={activeTable.isSystem}
                    />
                {/if}
            {:else if view === "sync"}
                <div
                    class="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-8"
                >
                    <h2
                        class="text-2xl font-black mb-6 uppercase tracking-tighter"
                    >
                        Sync Configuration
                    </h2>
                    <div class="max-w-md space-y-4">
                        <div
                            class="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                            <p
                                class="text-[10px] font-black text-gray-400 uppercase mb-2"
                            >
                                Selected Provider
                            </p>
                            <span class="font-bold text-primary-600"
                                >Localhost Developer API</span
                            >
                        </div>
                    </div>
                </div>
            {:else if view === "menus"}
                <div
                    class="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                    <AdminMenus />
                </div>
            {/if}
        </main>
    </div>
</div>
