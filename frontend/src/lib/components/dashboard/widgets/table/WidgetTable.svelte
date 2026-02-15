<script lang="ts">
    import { slide } from "svelte/transition";

    let { data = [], columns = [] } = $props();

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

<div class="flex flex-col h-full w-full bg-white relative overflow-hidden">
    <!-- Header Controls -->
    <div
        class="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0"
    >
        <div
            class="flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-tighter"
        >
            <span>Show</span>
            <select
                bind:value={pageSize}
                class="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
            >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
            </select>
        </div>

        <div class="flex-1 max-w-[200px] relative">
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search records..."
                class="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 shadow-sm transition-all"
            />
            <svg
                class="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
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
    </div>

    <!-- MAIN TABLE AREA -->
    <div class="flex-1 overflow-auto bg-white min-h-0">
        <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-900 text-white sticky top-0 z-10">
                <tr>
                    {#each columns as col}
                        <th
                            class="px-6 py-4 font-black uppercase tracking-widest text-[9px] cursor-pointer hover:bg-slate-800 transition-colors border-b border-slate-700"
                            onclick={() => toggleSort(col.key)}
                        >
                            <div
                                class="flex items-center gap-2 {col.align ===
                                'right'
                                    ? 'justify-end'
                                    : 'justify-start'}"
                            >
                                {col.label}
                                <span class="opacity-40 text-[8px]">
                                    {sortCol === col.key
                                        ? sortDir === "asc"
                                            ? "▲"
                                            : "▼"
                                        : "↕"}
                                </span>
                            </div>
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                {#each currentRows as row, i (row.id || i)}
                    <tr
                        class="hover:bg-indigo-50/30 transition-colors border-b border-slate-50 {i %
                            2 ===
                        0
                            ? 'bg-white'
                            : 'bg-slate-50/20'}"
                    >
                        {#each columns as col}
                            <td
                                class="px-6 py-4 text-slate-700 font-medium {col.align ===
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
                                        class="truncate block max-w-[400px] text-slate-900 font-semibold"
                                        >{row[col.key] || "—"}</span
                                    >
                                {/if}
                            </td>
                        {/each}
                    </tr>
                {/each}

                {#if currentRows.length === 0}
                    <tr>
                        <td
                            colspan={columns.length}
                            class="px-6 py-32 text-center text-slate-300 font-bold uppercase tracking-widest text-xs"
                        >
                            No matching results
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>

    <!-- Footer -->
    <div
        class="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0 text-[10px] font-black text-slate-400 uppercase tracking-widest"
    >
        <div>
            Showing <span class="text-slate-900">{startIndex + 1}</span> to
            <span class="text-slate-900">{endIndex}</span>
            of <span class="text-slate-900">{totalEntries}</span>
        </div>

        <div class="flex items-center gap-1.5">
            <button
                onclick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 shadow-sm transition-all"
            >
                Prev
            </button>
            <span class="px-2 text-slate-900"
                >{currentPage} / {totalPages || 1}</span
            >
            <button
                onclick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 shadow-sm transition-all"
            >
                Next
            </button>
        </div>
    </div>
</div>
