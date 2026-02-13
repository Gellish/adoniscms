<script lang="ts">
    import type { FieldSchema } from "../types";
    import UniversalField from "./UniversalField.svelte";

    interface Props {
        schema: FieldSchema[];
        data: any;
        onchange?: (data: any) => void;
    }

    let { schema, data = $bindable(), onchange }: Props = $props();

    function updateField(field: string, value: any) {
        data[field] = value;
        if (onchange) onchange(data);
    }
</script>

<div class="dynamic-form flex flex-col gap-6">
    {#each schema as fieldDef}
        <UniversalField
            field={fieldDef}
            value={data[fieldDef.field]}
            onchange={(val) => updateField(fieldDef.field, val)}
        />
    {/each}
</div>
