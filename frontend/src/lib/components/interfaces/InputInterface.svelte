<script lang="ts">
    interface Props {
        value: string | number;
        placeholder?: string;
        onchange: (value: string | number) => void;
    }

    let { value, placeholder = "", onchange }: Props = $props();

    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        onchange(target.value);
    }
</script>

<input
    type="text"
    {value}
    {placeholder}
    oninput={handleInput}
    class="w-full px-4 py-3 border border-slate-200 rounded-lg text-base transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
/>
