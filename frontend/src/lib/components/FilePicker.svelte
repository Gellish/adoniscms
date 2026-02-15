<script lang="ts">
    import { mediaState, type MediaFile } from "$lib/mediaState.svelte";
    import { fade, scale } from "svelte/transition";

    function isImage(name: string) {
        return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);
    }
</script>

{#if mediaState.showPicker}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-8"
        transition:fade={{ duration: 200 }}
        onclick={() => (mediaState.showPicker = false)}
    >
        <!-- Modal -->
        <div
            class="bg-white rounded-[2.5rem] w-full max-w-5xl h-[80vh] shadow-2xl overflow-hidden flex flex-col border border-white/20"
            transition:scale={{ duration: 300, start: 0.95 }}
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header -->
            <header
                class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"
            >
                <div>
                    <h2
                        class="text-xl font-black text-slate-800 tracking-tight uppercase"
                    >
                        Select Asset
                    </h2>
                    <p
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                        Choose from your library or upload new
                    </p>
                </div>
                <button
                    onclick={() => (mediaState.showPicker = false)}
                    class="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </header>

            <!-- Grid -->
            <div class="flex-1 overflow-y-auto p-8">
                <div
                    class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                >
                    {#each mediaState.files as file}
                        <button
                            onclick={() => mediaState.select(file)}
                            class="group relative aspect-square bg-slate-50 rounded-2xl border-2 border-transparent hover:border-indigo-500 overflow-hidden transition-all text-left"
                        >
                            {#if isImage(file.name)}
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            {:else}
                                <div
                                    class="w-full h-full flex items-center justify-center text-slate-300"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-10 w-10"
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

                            <div
                                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <p
                                    class="text-[10px] font-bold text-white truncate"
                                >
                                    {file.name}
                                </p>
                            </div>
                        </button>
                    {/each}

                    {#if mediaState.files.length === 0}
                        <div class="col-span-full py-20 text-center">
                            <p
                                class="text-slate-400 font-bold uppercase tracking-widest text-xs"
                            >
                                Your library is empty
                            </p>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Footer -->
            <footer
                class="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center"
            >
                <span
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >{mediaState.files.length} Assets available</span
                >
                <label
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                    Upload New
                    <input
                        type="file"
                        multiple
                        class="hidden"
                        onchange={async (e) => {
                            const input = e.target as HTMLInputElement;
                            if (input.files) {
                                for (let i = 0; i < input.files.length; i++) {
                                    await mediaState.upload(input.files[i]);
                                }
                            }
                        }}
                    />
                </label>
            </footer>
        </div>
    </div>
{/if}
