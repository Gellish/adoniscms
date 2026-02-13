<script lang="ts">
    import type { FieldSchema } from "../types";
    import InputInterface from "./interfaces/InputInterface.svelte";
    import TextareaInterface from "./interfaces/TextareaInterface.svelte";
    import SelectInterface from "./interfaces/SelectInterface.svelte";
    import BooleanInterface from "./interfaces/BooleanInterface.svelte";
    import RichTextInterface from "./interfaces/RichTextInterface.svelte";

    interface Props {
        field: FieldSchema;
        value: any;
        onchange: (value: any) => void;
    }

    let { field, value, onchange }: Props = $props();

    const interfaces: Record<string, any> = {
        input: InputInterface,
        textarea: TextareaInterface,
        select: SelectInterface,
        boolean: BooleanInterface,
        richtext: RichTextInterface,
    };

    let InterfaceComponent = $derived(interfaces[field.type] || InputInterface);
</script>

<div class="field-container flex flex-col gap-2">
    <label class="text-sm font-semibold text-slate-700" for={field.field}>
        {field.label}
    </label>

    {#if field.type === "boolean"}
        <button
            type="button"
            onclick={() => onchange(!value)}
            aria-label="Toggle boolean value"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 {value
                ? 'bg-indigo-600'
                : 'bg-slate-200'}"
        >
            <span
                aria-hidden="true"
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {value
                    ? 'translate-x-5'
                    : 'translate-x-0'}"
            ></span>
        </button>
    {:else}
        <InterfaceComponent
            {value}
            placeholder={field.placeholder}
            options={field.options}
            {onchange}
        />
    {/if}

    {#if field.meta?.note}
        <p class="text-xs text-slate-500">{field.meta.note}</p>
    {/if}
</div>
