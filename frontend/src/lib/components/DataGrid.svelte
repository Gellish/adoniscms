<script lang="ts">
    import { onMount } from "svelte";
    import { ClientDB } from "$lib/client-db/core";
    import { SyncEngine } from "$lib/client-db/sync/engine";

    let { tableName, readOnly = false } = $props<{
        tableName: string;
        readOnly?: boolean;
    }>();

    let records = $state<any[]>([]);
    let columns = $state<string[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let editingId = $state<string | null>(null);

    $effect(() => {
        if (tableName) {
            loadData();
        }
    });

    async function loadData() {
        loading = true;
        error = null;
        try {
            console.log(`[DataGrid] Loading data for: ${tableName}`);
            const db = await ClientDB.init();
            records = await db.getAll(tableName as any);
            console.log(`[DataGrid] Found ${records.length} records.`);
            if (records.length > 0) {
                columns = Object.keys(records[0]).filter((k) => k !== "id");
            } else {
                columns = [];
            }
        } catch (e: any) {
            console.error(
                `[DataGrid] Failed to load data for ${tableName}:`,
                e,
            );
            error = e.message || "Unknown database error";
        } finally {
            loading = false;
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            const db = await ClientDB.init();
            const tx = db.transaction(tableName as any, "readwrite");
            await tx.store.delete(id);
            await tx.done;

            // Log for sync
            await SyncEngine.logOperation({
                table: tableName,
                action: "delete",
                payload: { id },
            });

            await loadData();
        } catch (e) {
            console.error("Delete failed", e);
        }
    }

    async function handleSeedSystem() {
        try {
            const db = await ClientDB.init();
            await ClientDB.seedSystemData(db);
            await loadData();
        } catch (e) {
            console.error("[DataGrid] Manual seed failed:", e);
            alert("Failed to seed system record. Check console for details.");
        }
    }

    async function handleAdd() {
        try {
            const db = await ClientDB.init();
            const newRecord: any = {
                id: crypto.randomUUID(),
                createdAt: Date.now(),
            };
            columns.forEach((col) => (newRecord[col] = ""));

            const tx = db.transaction(tableName as any, "readwrite");
            await tx.store.add(newRecord);
            await tx.done;

            // Log for sync
            await SyncEngine.logOperation({
                table: tableName,
                action: "create",
                payload: newRecord,
            });

            await loadData();
        } catch (e) {
            console.error("Add failed", e);
        }
    }
</script>

<div class="flex-1 flex flex-col min-h-0">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h2
                class="text-2xl font-black uppercase tracking-tighter leading-none italic text-primary-600"
            >
                {tableName}
            </h2>
            <p
                class="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest"
            >
                Entity Browser
            </p>
        </div>
        {#if !readOnly}
            <button
                onclick={handleAdd}
                class="bg-primary-600 text-white text-[10px] font-black px-4 py-2 rounded uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-primary-500/10"
            >
                Add Record
            </button>
        {/if}
    </div>

    {#if loading}
        <div class="flex-1 flex items-center justify-center animate-pulse">
            <span
                class="text-xs font-black text-gray-300 uppercase letter-spacing-widest"
                >Hydrating state...</span
            >
        </div>
    {:else if error}
        <div
            class="flex-1 flex flex-col items-center justify-center bg-red-50 border-2 border-dashed border-red-200 rounded-2xl p-12 text-center"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 text-red-500 mb-4"
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
            <h3
                class="text-lg font-black text-red-700 uppercase tracking-tighter"
            >
                Database Error
            </h3>
            <p class="text-red-600 text-sm mt-2 max-w-sm">
                {error}
            </p>
            <button
                onclick={loadData}
                class="mt-6 px-6 py-2 bg-red-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all"
            >
                Retry Connection
            </button>
        </div>
    {:else if records.length === 0}
        <div
            class="flex-1 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl"
        >
            <div
                class="flex flex-col items-center justify-center py-12 text-gray-400"
            >
                <p>This table is empty.</p>
                <div class="flex gap-4 mt-4">
                    <button
                        onclick={loadData}
                        class="px-4 py-2 border border-gray-300 text-gray-600 rounded hover:bg-white transition-colors text-xs font-bold uppercase"
                    >
                        REFRESH
                    </button>
                    {#if !readOnly}
                        <button
                            onclick={handleAdd}
                            class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-xs font-bold uppercase"
                        >
                            SEED FIRST RECORD
                        </button>
                    {:else if tableName === "superadmin"}
                        <button
                            onclick={handleSeedSystem}
                            class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-xs font-bold uppercase"
                        >
                            RE-SEED ADMIN CREDENTIALS
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    {:else}
        <div
            class="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm"
        >
            <table class="w-full text-left border-collapse text-xs">
                <thead
                    class="bg-gray-50 border-b border-gray-100 sticky top-0 z-10"
                >
                    <tr>
                        <th
                            class="p-4 font-black text-gray-400 uppercase tracking-widest text-[9px]"
                            >ID</th
                        >
                        {#each columns as col}
                            <th
                                class="p-4 font-black text-gray-900 uppercase tracking-tighter"
                                >{col}</th
                            >
                        {/each}
                        {#if !readOnly}
                            <th
                                class="p-4 font-black text-gray-400 uppercase tracking-widest text-[9px] text-right"
                                >Actions</th
                            >
                        {/if}
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    {#each records as row}
                        <tr
                            class="hover:bg-primary-50/30 transition-colors group"
                        >
                            <td class="p-4 font-mono text-gray-400 text-[10px]"
                                >{row.id.slice(0, 8)}...</td
                            >
                            {#each columns as col}
                                <td class="p-4 font-bold text-gray-600">
                                    {typeof row[col] === "object"
                                        ? JSON.stringify(row[col])
                                        : row[col]}
                                </td>
                            {/each}
                            {#if !readOnly}
                                <td
                                    class="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <button
                                        onclick={() => handleDelete(row.id)}
                                        class="text-red-500 hover:text-red-700 font-black uppercase text-[10px]"
                                        >Delete</button
                                    >
                                </td>
                            {/if}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>
