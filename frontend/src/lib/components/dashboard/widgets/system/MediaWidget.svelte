<script lang="ts">
    import { onMount } from "svelte";
    import { mediaState } from "$lib/mediaState.svelte";
    import { fade } from "svelte/transition";
    import type { DashboardState } from "$lib/dashboardState.svelte";
    import type { Widget } from "$lib/components/dashboard/widgetConfig";

    let {
        widget,
        state: dashboardState,
        isMaximized,
    } = $props<{
        widget: Widget;
        state: DashboardState;
        isMaximized: boolean;
    }>();

    onMount(() => {
        mediaState.refresh();
    });

    let recentFiles = $derived(mediaState.files.slice(0, 4));

    async function handleUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            for (let i = 0; i < input.files.length; i++) {
                await mediaState.upload(input.files[i]);
            }
        }
    }

    function isImage(name: string) {
        return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);
    }
</script>

<div class="flex flex-col h-full relative group/widget">
    <!-- Header / Drag Handle -->
    <div
        class="flex items-center justify-between mb-4 mt-2 cursor-grab active:cursor-grabbing group/header"
        onmousedown={(e) => dashboardState?.startDrag(e, widget)}
        role="button"
        tabindex="0"
        aria-label="Drag widget"
    >
        <div class="flex items-center gap-2">
            <div
                class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100"
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>
            <div>
                <h3
                    class="text-xs font-black text-slate-800 uppercase tracking-tighter"
                >
                    Media Library
                </h3>
                <p
                    class="text-[9px] font-bold text-slate-400 uppercase tracking-widest"
                >
                    Recent Assets
                </p>
            </div>
        </div>

        <div class="flex items-center gap-2">
            <label
                class="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 border border-indigo-100 flex items-center gap-1"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 11-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                        clip-rule="evenodd"
                    />
                </svg>
                Upload
                <input
                    type="file"
                    multiple
                    class="hidden"
                    onchange={handleUpload}
                />
            </label>

            {#if !widget.locked}
                <button
                    onclick={(e) => {
                        e.stopPropagation();
                        dashboardState.removeWidget(widget.id);
                    }}
                    class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/widget:opacity-100"
                    title="Remove component"
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
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            {/if}
        </div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-h-0">
        {#if mediaState.isLoading && mediaState.files.length === 0}
            <div
                class="flex items-center justify-center h-24 gap-2 text-slate-400"
            >
                <div
                    class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"
                ></div>
                <span class="text-[10px] font-bold uppercase tracking-widest"
                    >Loading...</span
                >
            </div>
        {:else if mediaState.files.length === 0}
            <div
                class="flex flex-col items-center justify-center h-32 bg-slate-50 rounded-xl border border-dashed border-slate-200 gap-2"
            >
                <div
                    class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <p
                    class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                >
                    No assets found
                </p>
            </div>
        {:else}
            <div class="grid grid-cols-2 gap-2 h-full max-h-[180px]">
                {#each recentFiles as file}
                    <div
                        class="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square"
                    >
                        {#if isImage(file.name)}
                            <img
                                src={file.url}
                                alt={file.name}
                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        {:else}
                            <div
                                class="w-full h-full flex items-center justify-center text-slate-300"
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
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Footer -->
    <div
        class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4"
    >
        <div
            class="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 group"
        >
            Media Manager
        </div>
        <span
            class="text-[9px] font-bold text-slate-400 uppercase tracking-widest"
            >{mediaState.files.length} Total</span
        >
    </div>
</div>
