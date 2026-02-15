<script lang="ts">
    import { onMount } from "svelte";
    import { mediaState, type MediaFile } from "$lib/mediaState.svelte";
    import { fade, slide, scale } from "svelte/transition";

    let searchQuery = $state("");
    let dragOver = $state(false);

    let filteredFiles = $derived(
        mediaState.files.filter((f) =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    onMount(() => {
        mediaState.refresh();
    });

    async function handleFileDrop(e: DragEvent) {
        e.preventDefault();
        dragOver = false;
        if (e.dataTransfer?.files) {
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                await mediaState.upload(e.dataTransfer.files[i]);
            }
        }
    }

    async function handleFileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files) {
            for (let i = 0; i < input.files.length; i++) {
                await mediaState.upload(input.files[i]);
            }
        }
    }

    function formatSize(bytes: number) {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }

    function isImage(name: string) {
        return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);
    }
</script>

<div class="flex flex-col h-full bg-slate-50 font-sans">
    <!-- Header -->
    <header
        class="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between shrink-0"
    >
        <div class="flex items-center gap-4">
            <div
                class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200"
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>
            <div>
                <h1 class="text-2xl font-black text-slate-800 tracking-tight">
                    MEDIA <span class="text-indigo-600">LIBRARY</span>
                </h1>
                <p
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                >
                    Manage your digital assets
                </p>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <div class="relative">
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search files..."
                    class="pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 absolute left-3 top-2.5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>

            <label
                class="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 11-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                        clip-rule="evenodd"
                    />
                </svg>
                Upload File
                <input
                    type="file"
                    multiple
                    class="hidden"
                    onchange={handleFileSelect}
                />
            </label>
        </div>
    </header>

    <!-- Main Content -->
    <main
        class="flex-1 overflow-y-auto p-8 relative"
        onclick={() => (dragOver = false)}
        ondragover={(e) => {
            e.preventDefault();
            dragOver = true;
        }}
        ondragleave={() => (dragOver = false)}
        ondrop={handleFileDrop}
    >
        {#if dragOver}
            <div
                class="absolute inset-4 z-50 border-4 border-dashed border-indigo-500 rounded-3xl bg-indigo-50/80 backdrop-blur-sm flex items-center justify-center transition-all"
                transition:fade
            >
                <div
                    class="text-center"
                    in:scale={{ duration: 300, start: 0.9 }}
                >
                    <div
                        class="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 animate-bounce"
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
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>
                    <h2
                        class="text-2xl font-black text-indigo-900 leading-tight"
                    >
                        DROP TO UPLOAD
                    </h2>
                    <p
                        class="text-indigo-600 font-bold uppercase tracking-widest text-xs"
                    >
                        Release to start processing
                    </p>
                </div>
            </div>
        {/if}

        <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
        >
            {#each filteredFiles as file (file.name)}
                <div
                    class="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-300 relative"
                    transition:scale={{ duration: 200 }}
                >
                    <!-- Preview Area -->
                    <div
                        class="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center"
                    >
                        {#if isImage(file.name)}
                            <img
                                src={file.url}
                                alt={file.name}
                                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        {:else}
                            <div class="flex flex-col items-center gap-2">
                                <div
                                    class="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400"
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
                                <span
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-tighter"
                                    >.{file.name.split(".").pop()} Document</span
                                >
                            </div>
                        {/if}

                        <!-- Selection Overlay -->
                        <div
                            class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                        >
                            <button
                                onclick={() => window.open(file.url, "_blank")}
                                class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-800 hover:bg-indigo-600 hover:text-white transition-all shadow-lg"
                                title="View details"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path
                                        fill-rule="evenodd"
                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </button>
                            <button
                                onclick={() => {
                                    if (confirm("Delete this file?"))
                                        mediaState.delete(file.name);
                                }}
                                class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-lg"
                                title="Delete file"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Info Area -->
                    <div class="p-4">
                        <p
                            class="text-xs font-bold text-slate-800 truncate"
                            title={file.name}
                        >
                            {file.name}
                        </p>
                        <div class="flex items-center justify-between mt-1">
                            <span
                                class="text-[10px] text-slate-400 font-bold uppercase"
                                >{formatSize(file.size)}</span
                            >
                            <span
                                class="text-[10px] text-slate-400 font-medium italic"
                            >
                                {new Date(file.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            {/each}

            {#if filteredFiles.length === 0 && !mediaState.isLoading}
                <div class="col-span-full py-20 text-center">
                    <div
                        class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-12 w-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h3
                        class="text-xl font-black text-slate-400 tracking-tight uppercase"
                    >
                        No assets found
                    </h3>
                    <p class="text-slate-400 text-sm mt-1">
                        Upload your first file by dragging it anywhere
                    </p>
                </div>
            {/if}
        </div>
    </main>
</div>

<style>
    /* Custom scrollbar for premium feel */
    main::-webkit-scrollbar {
        width: 8px;
    }
    main::-webkit-scrollbar-track {
        background: transparent;
    }
    main::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    main::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
    }
</style>
