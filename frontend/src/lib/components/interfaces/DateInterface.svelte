<script lang="ts">
    interface Props {
        value: string;
        placeholder?: string;
        onchange: (value: string) => void;
    }

    let { value, placeholder = "Select date...", onchange }: Props = $props();

    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        onchange(target.value);
    }

    function clearDate() {
        onchange("");
    }
</script>

<div class="relative group">
    <!-- Calendar Icon -->
    <div
        class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line
                x1="16"
                x2="16"
                y1="2"
                y2="6"
            /><line x1="8" x2="8" y1="2" y2="6" /><line
                x1="3"
                x2="21"
                y1="10"
                y2="10"
            /></svg
        >
    </div>

    <input
        type="date"
        {value}
        {placeholder}
        oninput={handleInput}
        class="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-700 transition-all duration-300 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none"
    />

    <!-- Clear Button -->
    {#if value}
        <button
            type="button"
            onclick={clearDate}
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
            title="Clear date"
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
                ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
            >
        </button>
    {/if}
</div>

<style>
    /* Styling the native date picker icon to hide it or style it consistently */
    input[type="date"]::-webkit-calendar-picker-indicator {
        position: absolute;
        right: 12px;
        top: 0;
        bottom: 0;
        width: 24px;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }

    /* Ensure the input takes up full width even with the hidden icon */
    input[type="date"] {
        min-height: 48px;
    }
</style>
