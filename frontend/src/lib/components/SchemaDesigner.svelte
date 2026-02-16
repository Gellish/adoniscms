<script lang="ts">
    import { onMount } from "svelte";
    import { ClientDB } from "$lib/client-db/core";
    import type { InterfaceType, FieldSchema } from "$lib/types";
    import CustomSelect from "$lib/components/CustomSelect.svelte";
    import { fade } from "svelte/transition";

    let { tableName, columns, onSave } = $props<{
        tableName: string;
        columns: string[];
        onSave: () => void;
    }>();

    let localSchema = $state<FieldSchema[]>([]);
    let tables = $state<string[]>([]);
    let loading = $state(true);
    let draggedIndex = $state<number | null>(null);

    onMount(async () => {
        const stored = await ClientDB.getSchema(tableName);
        if (stored && stored.schema) {
            localSchema = stored.schema;
        } else {
            // Initialize with defaults based on columns
            localSchema = columns.map((col: string) => ({
                field: col,
                label:
                    col.charAt(0).toUpperCase() +
                    col.slice(1).replace(/([A-Z])/g, " $1"),
                type: "input",
            }));
        }

        tables = await ClientDB.listTables();
        loading = false;
    });

    function handleDelete(fieldToRemove: string) {
        localSchema = localSchema.filter((f) => f.field !== fieldToRemove);
    }

    function handleDragStart(index: number) {
        draggedIndex = index;
    }

    function handleDragOver(e: DragEvent, index: number) {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const items = [...localSchema];
        const draggedItem = items[draggedIndex];
        items.splice(draggedIndex, 1);
        items.splice(index, 0, draggedItem);
        localSchema = items;
        draggedIndex = index;
    }

    function handleDragEnd() {
        draggedIndex = null;
    }

    async function handleSave() {
        await ClientDB.saveSchema(tableName, $state.snapshot(localSchema));
        import("$lib/adminState.svelte").then(({ adminState }) => {
            adminState.showToast("Schema configuration saved!", "success");
        });
        onSave();
    }
</script>

<div
    class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-full max-h-[80vh]"
>
    <div
        class="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30"
    >
        <div>
            <h3
                class="text-xl font-black uppercase tracking-tighter text-slate-800"
            >
                Interface Designer
            </h3>
            <p
                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"
            >
                Table: {tableName}
            </p>
        </div>
    </div>

    {#if loading}
        <div
            class="p-12 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest animate-pulse"
        >
            Loading Schema Engine...
        </div>
    {:else}
        <div class="flex-1 overflow-y-auto p-8">
            <div class="space-y-4">
                {#each localSchema as field, i (field.field)}
                    <div
                        class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group relative"
                        transition:fade
                        draggable="true"
                        ondragstart={() => handleDragStart(i)}
                        ondragover={(e) => handleDragOver(e, i)}
                        ondragend={handleDragEnd}
                        role="listitem"
                        aria-label="Field: {field.label}"
                    >
                        <!-- Drag Handle -->
                        <div
                            class="cursor-grab active:cursor-grabbing p-1 -ml-2 text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><circle cx="9" cy="12" r="1" /><circle
                                    cx="9"
                                    cy="5"
                                    r="1"
                                /><circle cx="9" cy="19" r="1" /><circle
                                    cx="15"
                                    cy="12"
                                    r="1"
                                /><circle cx="15" cy="5" r="1" /><circle
                                    cx="15"
                                    cy="19"
                                    r="1"
                                /></svg
                            >
                        </div>

                        <div class="flex-1">
                            <div
                                class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"
                            >
                                Column Name
                            </div>
                            <span
                                class="font-mono text-xs font-bold text-slate-600"
                                >{field.field}</span
                            >
                        </div>
                        <div class="flex-1">
                            <label
                                for="label-{field.field}"
                                class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"
                                >Display Label</label
                            >
                            <input
                                id="label-{field.field}"
                                bind:value={field.label}
                                class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div class="w-32">
                            <label
                                for="group-{field.field}"
                                class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"
                                >Group / Tab</label
                            >
                            <input
                                id="group-{field.field}"
                                bind:value={field.group}
                                placeholder="General"
                                class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div class="w-48">
                            <label
                                for="type-{field.field}"
                                class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"
                                >Interface Type</label
                            >
                            <CustomSelect
                                bind:value={field.type}
                                options={[
                                    { value: "input", label: "Text Input" },
                                    { value: "textarea", label: "Textarea" },
                                    { value: "richtext", label: "Rich Text" },
                                    {
                                        value: "boolean",
                                        label: "Boolean / Toggle",
                                    },
                                    {
                                        value: "select",
                                        label: "Dropdown (Select)",
                                    },
                                    {
                                        value: "relation",
                                        label: "Relation (Many-to-One)",
                                    },
                                    { value: "file", label: "File / Media" },
                                ]}
                                onchange={() => {
                                    if (
                                        field.type === "relation" &&
                                        !field.relation
                                    ) {
                                        field.relation = {
                                            table: "",
                                            displayField: "id",
                                        };
                                    }
                                }}
                            />
                        </div>

                        <!-- Delete Button -->
                        <button
                            onclick={() => handleDelete(field.field)}
                            class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Field"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path d="M3 6h18" /><path
                                    d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                                /><path
                                    d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                                /><line x1="10" y1="11" x2="10" y2="17" /><line
                                    x1="14"
                                    y1="11"
                                    x2="14"
                                    y2="17"
                                /></svg
                            >
                        </button>
                    </div>

                    {#if field.type === "relation" && field.relation}
                        <div
                            class="flex gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 -mt-2 ml-8 mb-4 border-dashed"
                            transition:fade
                        >
                            <div class="flex-1">
                                <label
                                    for="rel-table-{field.field}"
                                    class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1"
                                    >Related Table</label
                                >
                                <CustomSelect
                                    bind:value={field.relation!.table}
                                    options={tables.map((t) => ({
                                        value: t,
                                        label: t,
                                    }))}
                                    placeholder="Select Table..."
                                />
                            </div>
                            <div class="flex-1">
                                <label
                                    for="rel-field-{field.field}"
                                    class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1"
                                    >Display Field</label
                                >
                                <input
                                    id="rel-field-{field.field}"
                                    bind:value={field.relation!.displayField}
                                    placeholder="e.g. title or name"
                                    class="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>

        <div
            class="px-8 py-6 border-t border-slate-50 bg-slate-50/30 flex justify-end"
        >
            <button
                onclick={handleSave}
                class="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-indigo-500/20"
            >
                Commit Changes
            </button>
        </div>
    {/if}
</div>
