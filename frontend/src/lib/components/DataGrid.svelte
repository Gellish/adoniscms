<script lang="ts">
    import { onMount } from "svelte";
    import { ClientDB } from "$lib/client-db/core";
    import { SyncEngine } from "$lib/client-db/sync/engine";
    import type { InterfaceType } from "$lib/types";
    import CustomSelect from "$lib/components/CustomSelect.svelte";
    import DynamicForm from "$lib/components/DynamicForm.svelte";
    import { scale, fade } from "svelte/transition";
    import SchemaDesigner from "./SchemaDesigner.svelte";

    let { tableName, readOnly = false } = $props<{
        tableName: string;
        readOnly?: boolean;
    }>();

    let records = $state<any[]>([]);
    let columns = $state<string[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let editingId = $state<string | null>(null);
    let showEditModal = $state(false);
    let editBuffer = $state<any>({});
    let inferredSchema = $state<any[]>([]);
    let manualSchema = $state<any[] | null>(null);
    let showSchemaDesigner = $state(false);
    let expandedRecords = $state<Record<string, boolean>>({});
    let newFieldName = $state("");
    let newFieldType = $state<InterfaceType>("input");

    function toggleExpand(id: string, col: string) {
        const key = `${id}-${col}`;
        expandedRecords[key] = !expandedRecords[key];
    }

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

            // Load manual schema if it exists
            const stored = await ClientDB.getSchema(tableName);
            manualSchema = stored ? stored.schema : null;

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

            import("$lib/adminState.svelte").then(({ adminState }) => {
                adminState.showToast("Record deleted successfully", "success");
            });

            await loadData();
        } catch (e) {
            console.error("Delete failed", e);
        }
    }

    function startEdit(row: any) {
        editingId = row.id;
        editBuffer = { ...row };
        inferredSchema = getInferredSchema(tableName, columns, row);
        showEditModal = true;
    }

    function cancelEdit() {
        editingId = null;
        editBuffer = {};
        showEditModal = false;
    }

    function getInferredSchema(table: string, cols: string[], sample: any) {
        // If we have a manual schema, use it!
        if (manualSchema && manualSchema.length > 0) {
            return manualSchema;
        }

        return cols.map((col) => {
            const val = sample[col];
            let type: InterfaceType = "input";

            if (typeof val === "boolean") {
                type = "boolean";
            } else if (
                typeof val === "string" &&
                (val.length > 200 || val.includes("\n"))
            ) {
                type = "richtext";
            } else if (typeof val === "string" && val.length > 50) {
                type = "textarea";
            } else if (
                col.toLowerCase().includes("content") ||
                col.toLowerCase().includes("body")
            ) {
                type = "richtext";
            } else if (
                col.toLowerCase().includes("description") ||
                col.toLowerCase().includes("bio")
            ) {
                type = "textarea";
            }

            return {
                field: col,
                label:
                    col.charAt(0).toUpperCase() +
                    col.slice(1).replace(/([A-Z])/g, " $1"),
                type,
                placeholder: `Enter ${col}...`,
            };
        });
    }

    function handleAddField() {
        if (!newFieldName.trim()) return;
        const safeName = newFieldName.toLowerCase().trim().replace(/\s+/g, "_");

        // Add to buffer
        editBuffer[safeName] = newFieldType === "boolean" ? false : "";

        // Update inferred schema immediately for the UI
        inferredSchema.push({
            field: safeName,
            label: newFieldName.trim(),
            type: newFieldType,
            placeholder: `Enter ${newFieldName}...`,
        });

        newFieldName = "";
        newFieldType = "input";
    }

    async function saveEdit(id: string) {
        try {
            const db = await ClientDB.init();
            const tx = db.transaction(tableName as any, "readwrite");
            await tx.store.put($state.snapshot(editBuffer));
            await tx.done;

            // Log for sync
            await SyncEngine.logOperation({
                table: tableName,
                action: "update",
                payload: $state.snapshot(editBuffer),
            });

            import("$lib/adminState.svelte").then(({ adminState }) => {
                adminState.showToast("Record updated successfully", "success");
            });

            editingId = null;
            editBuffer = {};
            await loadData();
        } catch (e) {
            console.error("Save failed", e);
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

    async function handleSeedDemo() {
        try {
            const db = await ClientDB.init();
            const demoRecord = {
                id: crypto.randomUUID(),
                title: "Welcome to your Data-Driven CMS! 🚀",
                content:
                    "This is a rich text field. You can **format** your content easily.\n\n- Phase 1: Smart Editing\n- Phase 2: Interface Designer\n- Phase 3: Relational UI",
                status: true,
                author: "Admin",
                createdAt: Date.now(),
            };

            const tx = db.transaction(tableName as any, "readwrite");
            await tx.store.add(demoRecord);
            await tx.done;

            // Log for sync
            await SyncEngine.logOperation({
                table: tableName,
                action: "create",
                payload: demoRecord,
            });

            import("$lib/adminState.svelte").then(({ adminState }) => {
                adminState.showToast(
                    "Demo record seeded! Check the Smart Editor now.",
                    "success",
                );
            });

            await loadData();
        } catch (e) {
            console.error("Demo seed failed", e);
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

            import("$lib/adminState.svelte").then(({ adminState }) => {
                adminState.showToast("Record added successfully", "success");
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
        <div class="flex items-center gap-2">
            {#if !readOnly}
                <button
                    onclick={() => (showSchemaDesigner = true)}
                    class="bg-slate-100 text-slate-600 text-[10px] font-black px-4 py-2 rounded uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                >
                    Configure UI
                </button>
                <button
                    onclick={handleSeedDemo}
                    class="bg-indigo-600 text-white text-[10px] font-black px-4 py-2 rounded uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-indigo-500/10"
                >
                    Seed Demo Post
                </button>
                <button
                    onclick={handleAdd}
                    class="bg-primary-600 text-white text-[10px] font-black px-4 py-2 rounded uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-primary-500/10"
                >
                    Add Record
                </button>
            {/if}
        </div>
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
                            onclick={handleSeedDemo}
                            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-xs font-bold uppercase shadow-lg shadow-indigo-500/20"
                        >
                            🚀 Seed Demo Post
                        </button>
                        <button
                            onclick={handleAdd}
                            class="px-4 py-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-xs font-bold uppercase"
                        >
                            + Empty Record
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
                                class="p-4 font-black text-gray-900 uppercase tracking-tighter transition-all"
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
                    {#each records as row (row.id)}
                        <tr
                            class="hover:bg-primary-50/20 transition-colors group {editingId ===
                            row.id
                                ? 'bg-primary-50/50'
                                : ''}"
                        >
                            <td class="p-4 font-mono text-gray-300 text-[10px]"
                                >{row.id.slice(0, 8)}...</td
                            >
                            {#each columns as col}
                                <td class="p-4 align-top">
                                    {#if typeof row[col] === "object" && row[col] !== null}
                                        {@const isExpanded =
                                            expandedRecords[`${row.id}-${col}`]}
                                        <div class="flex flex-col gap-2">
                                            <button
                                                onclick={() =>
                                                    toggleExpand(row.id, col)}
                                                class="text-[9px] font-black uppercase text-primary-600 hover:text-black flex items-center gap-1"
                                            >
                                                <span
                                                    >{isExpanded
                                                        ? "Hide"
                                                        : "Show"}</span
                                                >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    class="w-3 h-3 transform {isExpanded
                                                        ? 'rotate-180'
                                                        : ''} transition-transform"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fill-rule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clip-rule="evenodd"
                                                    />
                                                </svg>
                                            </button>

                                            {#if isExpanded}
                                                <div
                                                    class="bg-gray-900 text-emerald-400 p-3 rounded-lg border border-gray-800 font-mono text-[9px] max-h-48 overflow-auto shadow-inner"
                                                >
                                                    <pre
                                                        class="whitespace-pre-wrap">{JSON.stringify(
                                                            row[col],
                                                            null,
                                                            2,
                                                        )}</pre>
                                                </div>
                                            {/if}
                                        </div>
                                    {:else}
                                        <span class="font-bold text-gray-600"
                                            >{row[col]}</span
                                        >
                                    {/if}
                                </td>
                            {/each}
                            {#if !readOnly}
                                <td class="p-4 text-right">
                                    <div
                                        class="flex items-center justify-end gap-2"
                                    >
                                        <button
                                            onclick={() => startEdit(row)}
                                            class="p-1.5 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all"
                                            title="Edit Record"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2.5"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                ><path
                                                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                                ></path><path
                                                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                                ></path></svg
                                            >
                                        </button>
                                        <button
                                            onclick={() => handleDelete(row.id)}
                                            class="p-1.5 text-red-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                                            title="Delete Record"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2.5"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                ><polyline points="3 6 5 6 21 6"
                                                ></polyline><path
                                                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                                ></path><line
                                                    x1="10"
                                                    y1="11"
                                                    x2="10"
                                                    y2="17"
                                                ></line><line
                                                    x1="14"
                                                    y1="11"
                                                    x2="14"
                                                    y2="17"
                                                ></line></svg
                                            >
                                        </button>
                                    </div>
                                </td>
                            {/if}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    {#if showEditModal}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-6"
            onclick={cancelEdit}
            onkeydown={(e) =>
                (e.key === "Escape" || e.key === "Enter" || e.key === " ") &&
                cancelEdit()}
            role="dialog"
            aria-modal="true"
            tabindex="-1"
        >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onclick={(e) => e.stopPropagation()}
                role="presentation"
                transition:scale={{ start: 0.95, duration: 200 }}
            >
                <div
                    class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"
                >
                    <div>
                        <h3
                            class="text-xl font-black uppercase tracking-tighter text-slate-800"
                        >
                            Edit Record
                        </h3>
                        <p
                            class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"
                        >
                            ID: {editingId}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={() => (showSchemaDesigner = true)}
                            class="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Configure Fields"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path
                                    d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                                /><circle cx="12" cy="12" r="3" /></svg
                            >
                        </button>
                        <button
                            onclick={cancelEdit}
                            class="p-2 hover:bg-white rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><line x1="18" y1="6" x2="6" y2="18"
                                ></line><line x1="6" y1="6" x2="18" y2="18"
                                ></line></svg
                            >
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-8">
                    <div class="space-y-8">
                        <DynamicForm
                            schema={inferredSchema}
                            bind:data={editBuffer}
                        />

                        <!-- Quick Add Field Section -->
                        <div class="mt-12 pt-8 border-t border-slate-100">
                            <h4
                                class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4"
                            >
                                Add Custom Field
                            </h4>
                            <div class="flex gap-2">
                                <input
                                    bind:value={newFieldName}
                                    placeholder="e.g. Meta Description"
                                    class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                />
                                <CustomSelect
                                    bind:value={newFieldType}
                                    options={[
                                        { value: "input", label: "Text Input" },
                                        {
                                            value: "textarea",
                                            label: "Textarea",
                                        },
                                        {
                                            value: "richtext",
                                            label: "Rich Text",
                                        },
                                        { value: "boolean", label: "Boolean" },
                                        {
                                            value: "select",
                                            label: "Dropdown (Select)",
                                        },
                                        {
                                            value: "relation",
                                            label: "Relation (Many-to-One)",
                                        },
                                        {
                                            value: "file",
                                            label: "File / Media",
                                        },
                                    ]}
                                    class="w-32"
                                />
                                <button
                                    onclick={handleAddField}
                                    disabled={!newFieldName.trim()}
                                    class="px-4 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"
                >
                    <button
                        onclick={cancelEdit}
                        class="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white transition-all text-xs uppercase"
                    >
                        Cancel
                    </button>
                    <button
                        onclick={() => saveEdit(editingId!)}
                        class="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-indigo-500/20"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    {/if}

    {#if showSchemaDesigner}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[10001] flex items-center justify-center p-12"
            onclick={() => (showSchemaDesigner = false)}
            onkeydown={(e) =>
                (e.key === "Escape" || e.key === "Enter" || e.key === " ") &&
                (showSchemaDesigner = false)}
            role="dialog"
            aria-modal="true"
            tabindex="-1"
            transition:fade
        >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="w-full max-w-4xl"
                onclick={(e) => e.stopPropagation()}
                role="presentation"
                transition:scale={{ start: 0.9, duration: 300 }}
            >
                <SchemaDesigner
                    {tableName}
                    {columns}
                    onSave={() => {
                        showSchemaDesigner = false;
                        loadData();
                    }}
                />
            </div>
        </div>
    {/if}
</div>
