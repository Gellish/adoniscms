<script lang="ts">
    import { slide, fade } from "svelte/transition";

    interface Props {
        data?: any[];
        columns?: any[];
        onedit?: (row: any) => void;
        ondelete?: (row: any) => void;
        onconfigure?: () => void;
    }

    let {
        data = [],
        columns = [],
        onedit,
        ondelete,
        onconfigure,
    }: Props = $props();

    let searchQuery = $state("");
    let pageSize = $state(10);
    let currentPage = $state(1);
    let sortCol = $state("title");
    let sortDir = $state("asc");

    let safeData = $derived(Array.isArray(data) ? data : []);

    let filteredData = $derived(
        safeData
            .filter((row) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return Object.values(row).some((val) =>
                    String(val).toLowerCase().includes(q),
                );
            })
            .sort((a, b) => {
                const valA = a[sortCol] || "";
                const valB = b[sortCol] || "";
                if (valA < valB) return sortDir === "asc" ? -1 : 1;
                if (valA > valB) return sortDir === "asc" ? 1 : -1;
                return 0;
            }),
    );

    let totalEntries = $derived(filteredData.length);
    let totalPages = $derived(Math.ceil(totalEntries / pageSize));
    let startIndex = $derived((currentPage - 1) * pageSize);
    let endIndex = $derived(Math.min(startIndex + pageSize, totalEntries));
    let currentRows = $derived(filteredData.slice(startIndex, endIndex));

    function toggleSort(col: string) {
        if (sortCol === col) {
            sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
            sortCol = col;
            sortDir = "asc";
        }
    }

    function goToPage(p: number) {
        if (p >= 1 && p <= totalPages) currentPage = p;
    }
</script>

<div
    class="flex flex-col h-full w-full bg-white relative overflow-hidden font-sans"
>
    <!-- Header Controls: Reimagined -->
    <div
        class="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-6 bg-white shrink-0"
    >
        <div class="flex items-center gap-3">
            <div
                class="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 shadow-sm"
            >
                <span
                    class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                    >Show</span
                >
                <select
                    bind:value={pageSize}
                    class="bg-transparent text-slate-900 text-xs font-black outline-none cursor-pointer"
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                </select>
            </div>
        </div>

        <div class="flex items-center gap-2 flex-hidden">
            <div class="flex-1 max-w-[280px] relative group">
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search anything..."
                    class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 shadow-inner-sm transition-all placeholder:text-slate-400"
                />
                <div
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                >
                    <svg
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            {#if onconfigure}
                <button
                    onclick={onconfigure}
                    class="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm active:scale-90 border border-transparent hover:border-indigo-100"
                    title="Configure Table UI"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                </button>
            {/if}
        </div>
    </div>

    <!-- MAIN TABLE AREA -->
    <div class="flex-1 overflow-auto bg-white min-h-0 scrollbar-thin">
        <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50/80 backdrop-blur-md sticky top-0 z-10">
                <tr>
                    {#each columns as col}
                        <th
                            class="px-6 py-4 font-black uppercase tracking-[0.15em] text-[9px] text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors border-b border-slate-100"
                            onclick={() => toggleSort(col.key)}
                        >
                            <div
                                class="flex items-center gap-2 {col.align ===
                                'right'
                                    ? 'justify-end'
                                    : 'justify-start'}"
                            >
                                {col.label}
                                <div class="flex flex-col gap-0.5 opacity-30">
                                    <span
                                        class="text-[7px] leading-none {sortCol ===
                                            col.key && sortDir === 'asc'
                                            ? 'text-indigo-600 opacity-100'
                                            : ''}">▲</span
                                    >
                                    <span
                                        class="text-[7px] leading-none {sortCol ===
                                            col.key && sortDir === 'desc'
                                            ? 'text-indigo-600 opacity-100'
                                            : ''}">▼</span
                                    >
                                </div>
                            </div>
                        </th>
                    {/each}
                    {#if onedit || ondelete}
                        <th
                            class="px-6 py-4 border-b border-slate-100 font-black uppercase tracking-[0.15em] text-[9px] text-slate-500 text-center"
                            >Actions</th
                        >
                    {/if}
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                {#each currentRows as row, i (row.id || i)}
                    <tr
                        class="group/row hover:bg-indigo-50/30 transition-all duration-200 border-l-2 border-transparent hover:border-indigo-500/50"
                        in:fade={{ duration: 150, delay: i * 20 }}
                    >
                        {#each columns as col}
                            <td
                                class="px-6 py-4 align-middle {col.align ===
                                'right'
                                    ? 'text-right'
                                    : 'text-left'}"
                            >
                                {#if col.render}
                                    <div class="inline-block">
                                        {@html col.render(row)}
                                    </div>
                                {:else}
                                    <span
                                        class="block truncate max-w-[300px] text-slate-700 font-bold tracking-tight"
                                    >
                                        {row[col.key] || "—"}
                                    </span>
                                {/if}
                            </td>
                        {/each}
                        {#if onedit || ondelete}
                            <td class="px-6 py-4 text-center align-middle">
                                <div
                                    class="flex items-center justify-center gap-1.5 opacity-40 group-hover/row:opacity-100 transition-opacity"
                                >
                                    {#if onedit}
                                        <button
                                            onclick={() => onedit(row)}
                                            class="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90"
                                            aria-label="Edit record"
                                        >
                                            <svg
                                                class="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2.5"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                /></svg
                                            >
                                        </button>
                                    {/if}
                                    {#if ondelete}
                                        <button
                                            onclick={() => ondelete(row)}
                                            class="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-600 transition-all shadow-sm active:scale-90"
                                            aria-label="Delete record"
                                        >
                                            <svg
                                                class="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2.5"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                /></svg
                                            >
                                        </button>
                                    {/if}
                                </div>
                            </td>
                        {/if}
                    </tr>
                {/each}

                {#if currentRows.length === 0}
                    <tr>
                        <td
                            colspan={columns.length +
                                (onedit || ondelete ? 1 : 0)}
                            class="px-6 py-24 text-center"
                        >
                            <div
                                class="flex flex-col items-center gap-3 grayscale opacity-30"
                            >
                                <svg
                                    class="w-12 h-12 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="1.5"
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    /></svg
                                >
                                <span
                                    class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                                    >Empty Database Table</span
                                >
                            </div>
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>

    <!-- Footer: Premium Pagination -->
    <div
        class="px-6 py-4 border-t border-slate-100 bg-white/50 flex items-center justify-between shrink-0"
    >
        <div
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
        >
            Showing <span class="text-slate-900"
                >{startIndex + 1}-{endIndex}</span
            >
            of <span class="text-slate-900">{totalEntries}</span>
        </div>

        <div class="flex items-center gap-2">
            <button
                onclick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white shadow-sm transition-all active:scale-95"
                aria-label="Previous page"
            >
                Prev
            </button>

            <div class="flex items-center gap-1">
                {#each Array(totalPages) as _, i}
                    {#if i + 1 === currentPage}
                        <div
                            class="w-2 h-2 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200"
                        ></div>
                    {:else}
                        <button
                            onclick={() => goToPage(i + 1)}
                            class="w-1.5 h-1.5 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors"
                            aria-label="Go to page {i + 1}"
                        ></button>
                    {/if}
                {/each}
            </div>

            <button
                onclick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white shadow-sm transition-all active:scale-95"
                aria-label="Next page"
            >
                Next
            </button>
        </div>
    </div>
</div>
