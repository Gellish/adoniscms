<script lang="ts">
    interface Props {
        value: string;
        placeholder?: string;
        rows?: number;
        onchange: (value: string) => void;
    }

    let { value, placeholder = "", rows = 4, onchange }: Props = $props();

    function handleInput(e: Event) {
        const target = e.target as HTMLTextAreaElement;
        onchange(target.value);
    }
</script>

<textarea
    {value}
    {placeholder}
    {rows}
    oninput={handleInput}
    class="w-full px-4 py-3 border border-slate-200 rounded-lg text-base transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
></textarea>
