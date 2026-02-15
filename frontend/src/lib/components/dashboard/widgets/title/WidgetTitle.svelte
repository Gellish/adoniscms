<script lang="ts">
    let { widget, onSave } = $props<{ widget: any; onSave: () => void }>();
</script>

<div class="px-4 py-2">
    <input
        type="text"
        bind:value={widget.title}
        disabled={widget.locked}
        class="w-full bg-transparent border-none outline-none text-2xl font-black text-slate-900 uppercase tracking-tighter rounded-lg py-1 px-2 mb-0 {widget.locked
            ? 'cursor-default select-none'
            : 'cursor-text focus:ring-2 focus:ring-indigo-500/20'}"
        spellcheck="false"
        onblur={() => onSave()}
        onkeydown={(e) =>
            e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
</div>
