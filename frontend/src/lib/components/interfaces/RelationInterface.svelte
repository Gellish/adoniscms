<script lang="ts">
    import { onMount } from "svelte";
    import { ClientDB } from "$lib/client-db/core";

    interface Props {
        value: string;
        placeholder?: string;
        relation?: {
            table: string;
            displayField: string;
        };
        onchange: (value: string) => void;
    }

    let { value, placeholder, relation, onchange }: Props = $props();

    let records = $state<any[]>([]);
    let loading = $state(true);

    onMount(async () => {
        if (relation?.table) {
            const db = await ClientDB.init();
            records = await db.getAll(relation.table as any);
        }
        loading = false;
    });
</script>

<div class="relation-interface">
    {#if loading}
        <div
            class="animate-pulse flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl"
        >
            <div class="h-4 w-4 bg-slate-200 rounded-full"></div>
            <div class="h-3 w-32 bg-slate-200 rounded"></div>
        </div>
    {:else if records.length === 0}
        <div
            class="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-bold text-amber-600 uppercase"
        >
            No records found in "{relation?.table}"
        </div>
    {:else}
        <select
            {value}
            onchange={(e) => onchange(e.currentTarget.value)}
            class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
        >
            <option value="">{placeholder || "Select related record..."}</option
            >
            {#each records as record}
                <option value={record.id}>
                    {record[relation?.displayField || "id"] || record.id}
                </option>
            {/each}
        </select>
    {/if}
</div>
