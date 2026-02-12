<script lang="ts">
    interface Props {
        value: any;
        options?: { label: string; value: any }[];
        onchange: (value: any) => void;
    }

    let { value, options = [], onchange }: Props = $props();

    function handleChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        onchange(target.value);
    }
</script>

<div class="relative">
    <select
        {value}
        onchange={handleChange}
        class="w-full appearance-none px-4 py-3 border border-slate-200 rounded-lg text-base transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-white"
    >
        {#each options as option}
            <option value={option.value}>{option.label}</option>
        {/each}
    </select>
    <div
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
            />
        </svg>
    </div>
</div>
