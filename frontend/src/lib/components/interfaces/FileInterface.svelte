<script lang="ts">
    import { mediaState } from "$lib/mediaState.svelte";

    let { value = "", onchange } = $props<{
        value: string;
        onchange: (val: string) => void;
    }>();

    function openPicker() {
        mediaState.openPicker((file) => {
            onchange(file.url);
        });
    }

    function isImage(url: string) {
        return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
    }
</script>

<div
    class="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl transition-all hover:border-indigo-200 group"
>
    {#if value}
        <div
            class="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm shrink-0"
        >
            {#if isImage(value)}
                <img
                    src={value}
                    alt="Preview"
                    class="w-full h-full object-cover"
                />
            {:else}
                <div
                    class="w-full h-full flex items-center justify-center text-slate-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                    </svg>
                </div>
            {/if}
        </div>
        <div class="flex-1 min-w-0">
            <p
                class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"
            >
                Selected Asset
            </p>
            <p class="text-xs font-bold text-slate-800 truncate mb-2">
                {value.split("/").pop()}
            </p>
            <div class="flex gap-2">
                <button
                    onclick={openPicker}
                    class="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                >
                    Change
                </button>
                <button
                    onclick={() => onchange("")}
                    class="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors"
                >
                    Remove
                </button>
            </div>
        </div>
    {:else}
        <button
            onclick={openPicker}
            class="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-slate-100/50 transition-all group/btn"
        >
            <div
                class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm group-hover/btn:scale-110 group-hover/btn:text-indigo-500 transition-all"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clip-rule="evenodd"
                    />
                </svg>
            </div>
            <span
                class="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/btn:text-slate-600"
                >Select or Upload Media</span
            >
        </button>
    {/if}
</div>
