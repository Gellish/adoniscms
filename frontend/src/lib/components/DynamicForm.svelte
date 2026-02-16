<script lang="ts">
    import type { FieldSchema } from "$lib/types";
    import UniversalField from "$interfaces/UniversalField.svelte";
    import { fade } from "svelte/transition";

    interface Props {
        schema: FieldSchema[];
        data: any;
        onchange?: (data: any) => void;
    }

    let { schema, data = $bindable(), onchange }: Props = $props();

    let groups = $derived(
        [...new Set(schema.map((f) => f.group || "General"))].sort(),
    );
    let activeTab = $state("");

    // Initialize/sync activeTab
    $effect(() => {
        if (!activeTab || !groups.includes(activeTab)) {
            activeTab = groups[0] || "General";
        }
    });

    function updateField(field: string, value: any) {
        data[field] = value;
        if (onchange) onchange(data);
    }
</script>

<div class="dynamic-form flex flex-col gap-6">
    {#if groups.length > 1}
        <div
            class="flex gap-2 border-b border-slate-100 pb-4 mb-2 overflow-x-auto no-scrollbar scroll-smooth"
        >
            {#each groups as group}
                <button
                    onclick={() => (activeTab = group)}
                    class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                    {activeTab === group
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}"
                >
                    {group}
                </button>
            {/each}
        </div>
    {/if}

    <div class="space-y-6">
        {#each schema.filter((f) => (f.group || "General") === activeTab) as fieldDef (fieldDef.field)}
            <div transition:fade={{ duration: 150 }}>
                <UniversalField
                    field={fieldDef}
                    value={data[fieldDef.field]}
                    onchange={(val) => updateField(fieldDef.field, val)}
                />
            </div>
        {/each}
    </div>
</div>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
