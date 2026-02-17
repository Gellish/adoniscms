<script lang="ts">
    import { slide, fade } from "svelte/transition";

    interface Props {
        data?: any[];
        columns?: any[];
        onedit?: (row: any) => void;
        ondelete?: (row: any) => void;
        onrowupdate?: (row: any, updates: any) => void;
        onconfigure?: () => void;
    }

    let {
        data = [],
        columns = [],
        onedit,
        ondelete,
        onrowupdate,
        onconfigure,
    }: Props = $props();

    let searchQuery = $state("");
    let pageSize = $state(10);
    let currentPage = $state(1);
    let sortCol = $state("title");
    let sortDir = $state("asc");

    // Notion-style states
    let viewType = $state("table"); // 'table' | 'gallery'
    let groupByCol = $state<string | null>(null);
    let collapsedGroups = $state(new Set<string>());
    let isFullPage = $state(false);
    let showSettings = $state(false);
    let showRoadmap = $state(false);

    const roadmapData = [
        { title: "Grouping", status: "In Progress", phase: 2 },
        { title: "Full-Page Mode", status: "In Progress", phase: 2 },
        { title: "Manual Column Resizing", status: "Planned", phase: 2 },
        { title: "Drag-and-Drop Reordering", status: "Planned", phase: 2 },
        { title: "Bulk Actions", status: "Planned", phase: 2 },
        { title: "Board View", status: "Planned", phase: 3 },
        { title: "Advanced Filtering", status: "Planned", phase: 3 },
    ];

    // Initialize visible columns correctly
    let visibleColumnKeys = $state(new Set<string>());

    // Persistent settings logic
    const SETTINGS_KEY = "widget_table_settings";

    function saveSettings() {
        const settings = {
            viewType,
            groupByCol,
            isFullPage,
            visibleColumnKeys: Array.from(visibleColumnKeys),
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        showSettings = false;
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.viewType) viewType = parsed.viewType;
                if (parsed.groupByCol !== undefined)
                    groupByCol = parsed.groupByCol;
                if (parsed.isFullPage !== undefined)
                    isFullPage = parsed.isFullPage;
                if (parsed.visibleColumnKeys) {
                    visibleColumnKeys = new Set(parsed.visibleColumnKeys);
                }
            }
        } catch (e) {
            console.error("Failed to load table settings", e);
        }
    }

    // Use an effect to load saved settings and sync initial keys if still empty
    $effect(() => {
        loadSettings();
        if (visibleColumnKeys.size === 0 && columns.length > 0) {
            visibleColumnKeys = new Set(columns.map((c) => c.key));
        }
    });

    let safeData = $derived(Array.isArray(data) ? data : []);
    let visibleColumns = $derived(
        columns.filter((c) => visibleColumnKeys.has(c.key)),
    );

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

    // Derived: Grouped structure for the current page
    let groupedRows = $derived.by(() => {
        if (!groupByCol) return { "": currentRows };
        const groups: Record<string, any[]> = {};
        const key = groupByCol; // Capture non-null ref
        currentRows.forEach((row) => {
            const val = String(row[key] || "No " + key);
            if (!groups[val]) groups[val] = [];
            groups[val].push(row);
        });
        return groups;
    });

    let activeGroupKeys = $derived(Object.keys(groupedRows));

    function toggleGroup(group: string) {
        if (collapsedGroups.has(group)) {
            collapsedGroups.delete(group);
        } else {
            collapsedGroups.add(group);
        }
        collapsedGroups = new Set(collapsedGroups);
    }

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

    function toggleColumn(key: string) {
        if (visibleColumnKeys.has(key)) {
            visibleColumnKeys.delete(key);
        } else {
            visibleColumnKeys.add(key);
        }
        visibleColumnKeys = new Set(visibleColumnKeys); // Trigger reactivity
    }
</script>

<div
    class="flex flex-col bg-white relative overflow-hidden font-sans transition-all {isFullPage
        ? 'fixed inset-0 z-[100] h-screen w-screen'
        : 'h-full w-full'}"
>
    <!-- Header Controls -->
    <div
        class="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-6 bg-white shrink-0"
    >
        <div class="flex items-center gap-2">
            <!-- View Switcher Toggle -->
            <button
                onclick={() => (showSettings = !showSettings)}
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
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
                        stroke-width="2"
                        d="M4 6h16M4 12h16m-7 6h7"
                    />
                </svg>
                <span class="text-xs font-bold capitalize">{viewType} view</span
                >
            </button>
        </div>

        <div class="flex items-center gap-2">
            <div class="flex-1 max-w-[280px] relative group">
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search anything..."
                    class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all placeholder:text-slate-400"
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

            <button
                onclick={() => (showSettings = !showSettings)}
                class="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="View settings"
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
                        stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                </svg>
            </button>
        </div>
    </div>

    <!-- MAIN CONTENT AREA -->
    <div class="flex-1 relative flex overflow-hidden">
        <!-- Main List/Grid -->
        <div class="flex-1 overflow-auto bg-transparent min-h-0 scrollbar-thin">
            {#if viewType === "table"}
                <div class="w-full flex flex-col min-w-[500px]">
                    <!-- Header -->
                    <div
                        class="flex items-center border-b border-slate-100/50 bg-slate-50/20 sticky top-0 z-20 backdrop-blur-sm"
                    >
                        {#each visibleColumns as col}
                            <button
                                class="px-6 py-2.5 font-semibold text-[10px] text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 group border-none bg-transparent appearance-none"
                                style="width: {col.width ||
                                    'auto'}; flex: {col.width
                                    ? 'none'
                                    : '1'}; justify-content: {col.align ===
                                'right'
                                    ? 'flex-end'
                                    : 'flex-start'}"
                                onclick={() => toggleSort(col.key)}
                                role="columnheader"
                            >
                                <span class="uppercase tracking-widest"
                                    >{col.label}</span
                                >
                                {#if sortCol === col.key}
                                    <span
                                        class="text-[8px] text-indigo-500 font-black"
                                    >
                                        {sortDir === "asc" ? "↑" : "↓"}
                                    </span>
                                {/if}
                            </button>
                        {/each}
                        {#if onedit || ondelete}
                            <div
                                class="w-20 px-6 py-3 text-center font-bold uppercase text-[9px] text-slate-400"
                            >
                                Actions
                            </div>
                        {/if}
                    </div>

                    <!-- Body -->
                    <div class="flex flex-col">
                        {#each activeGroupKeys as groupKey}
                            {#if groupByCol}
                                <!-- Group Header -->
                                <button
                                    class="flex items-center gap-2 px-6 py-2 bg-slate-50/50 border-b border-slate-100/50 hover:bg-slate-100 group/group-header transition-colors text-left"
                                    onclick={() => toggleGroup(groupKey)}
                                    aria-expanded={!collapsedGroups.has(
                                        groupKey,
                                    )}
                                >
                                    <svg
                                        class="w-3 h-3 text-slate-400 transition-transform {collapsedGroups.has(
                                            groupKey,
                                        )
                                            ? '-rotate-90'
                                            : ''}"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="3"
                                            d="M19 9l-7 7-7-7"
                                        ></path></svg
                                    >
                                    <span
                                        class="text-[10px] font-black uppercase tracking-widest text-slate-500"
                                        >{groupKey}</span
                                    >
                                    <span
                                        class="text-[9px] text-slate-300 font-bold ml-1"
                                        >{groupedRows[groupKey].length}</span
                                    >
                                </button>
                            {/if}

                            {#if !collapsedGroups.has(groupKey)}
                                {#each groupedRows[groupKey] as row, i (row.id || i)}
                                    <div
                                        class="flex items-center group/row hover:bg-slate-50/50 transition-all border-b border-slate-50 {i %
                                            2 ===
                                        0
                                            ? 'bg-transparent'
                                            : 'bg-slate-50/5'}"
                                        in:fade={{
                                            duration: 150,
                                            delay: i * 10,
                                        }}
                                    >
                                        {#each visibleColumns as col}
                                            <div
                                                class="px-6 py-3 flex items-center {col.align ===
                                                'right'
                                                    ? 'justify-end text-right'
                                                    : 'justify-start text-left'}"
                                                style="width: {col.width ||
                                                    'auto'}; flex: {col.width
                                                    ? 'none'
                                                    : '1'}"
                                            >
                                                {#if col.render}
                                                    <button
                                                        class="inline-block text-left bg-transparent border-none p-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded {col.onclick
                                                            ? 'cursor-pointer active:scale-95 transition-transform'
                                                            : ''}"
                                                        onclick={(e) =>
                                                            col.onclick?.(
                                                                row,
                                                                e,
                                                            )}
                                                        aria-label="Table action"
                                                    >
                                                        {@html col.render(row)}
                                                    </button>
                                                {:else}
                                                    <span
                                                        class="block truncate max-w-[400px] text-slate-800 font-semibold tracking-tight text-[13px]"
                                                    >
                                                        {row[col.key] || "—"}
                                                    </span>
                                                {/if}
                                            </div>
                                        {/each}
                                        {#if onedit || ondelete}
                                            <div
                                                class="w-20 px-6 py-2 flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-all"
                                            >
                                                {#if onedit}
                                                    <button
                                                        onclick={() =>
                                                            onedit(row)}
                                                        class="p-1 hover:bg-white rounded-lg text-slate-300 hover:text-indigo-600"
                                                        aria-label="Edit"
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
                                                            ></path></svg
                                                        >
                                                    </button>
                                                {/if}
                                                {#if ondelete}
                                                    <button
                                                        onclick={() =>
                                                            ondelete(row)}
                                                        class="p-1 hover:bg-white rounded-lg text-slate-300 hover:text-red-500"
                                                        aria-label="Delete"
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
                                                            ></path></svg
                                                        >
                                                    </button>
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            {/if}
                        {/each}
                    </div>
                </div>
            {:else if viewType === "gallery"}
                <div
                    class="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {#each activeGroupKeys as groupKey}
                        {#if groupByCol}
                            <!-- Gallery Group Header -->
                            <div
                                class="col-span-full mt-8 first:mt-0 mb-4 flex items-center gap-3"
                            >
                                <button
                                    class="flex items-center gap-2 hover:bg-slate-100 p-1.5 rounded-lg transition-colors group/group-header"
                                    onclick={() => toggleGroup(groupKey)}
                                    aria-label="{collapsedGroups.has(groupKey)
                                        ? 'Expand'
                                        : 'Collapse'} group {groupKey}"
                                >
                                    <svg
                                        class="w-4 h-4 text-slate-400 transition-transform {collapsedGroups.has(
                                            groupKey,
                                        )
                                            ? '-rotate-90'
                                            : ''}"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="3"
                                            d="M19 9l-7 7-7-7"
                                        ></path></svg
                                    >
                                    <span
                                        class="text-xs font-black uppercase tracking-widest text-slate-800"
                                        >{groupKey}</span
                                    >
                                    <span
                                        class="text-[10px] text-slate-400 font-bold ml-1"
                                        >{groupedRows[groupKey].length}</span
                                    >
                                </button>
                                <div class="h-[1px] flex-1 bg-slate-100"></div>
                            </div>
                        {/if}

                        {#if !collapsedGroups.has(groupKey)}
                            {#each groupedRows[groupKey] as row, i (row.id || i)}
                                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                                <div
                                    class="bg-white border border-slate-100 rounded-[1.2rem] p-5 shadow-sm hover:shadow-xl transition-all duration-300 group/card relative flex flex-col gap-3 text-left hover:-translate-y-1 cursor-pointer"
                                    onclick={() => onedit?.(row)}
                                    onkeydown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            e.preventDefault();
                                            onedit?.(row);
                                        }
                                    }}
                                    in:fade={{ duration: 150, delay: i * 10 }}
                                    role="button"
                                    tabindex="0"
                                    aria-label="View record"
                                >
                                    <h3
                                        class="font-black text-[15px] text-slate-800 tracking-tight leading-snug group-hover/card:text-indigo-600 transition-colors"
                                    >
                                        {row.title || row.name || "Untitled"}
                                    </h3>

                                    <!-- Notion-style: Date and Tag vertical stack -->
                                    <div class="flex flex-col gap-2.5 mt-1">
                                        {#each visibleColumns.filter((c) => c.key === "created_at" || c.key.includes("date")) as col}
                                            <div
                                                class="text-[11px] font-medium text-slate-400/80 flex items-center gap-1.5"
                                            >
                                                <svg
                                                    class="w-3 h-3 opacity-50"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    ><path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    ></path></svg
                                                >
                                                {#if col.render}
                                                    {@html col.render(row)}
                                                {:else}
                                                    {row[col.key] || ""}
                                                {/if}
                                            </div>
                                        {/each}

                                        {#each visibleColumns.filter((c) => c.key === "status" || c.key.includes("tag")) as col}
                                            <div class="inline-flex">
                                                {#if col.render}
                                                    {@html col.render(row)}
                                                {:else}
                                                    <span
                                                        class="px-2 py-1 rounded-md bg-indigo-50/50 text-indigo-600/80 text-[10px] font-bold uppercase tracking-wider border border-indigo-100/30"
                                                    >
                                                        {row[col.key] || ""}
                                                    </span>
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>

                                    <!-- Card Actions Badge -->
                                    {#if onedit || ondelete}
                                        <div
                                            class="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-all scale-90"
                                        >
                                            <button
                                                onclick={(e) => {
                                                    e.stopPropagation();
                                                    ondelete?.(row);
                                                }}
                                                class="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                                                aria-label="Delete"
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
                                                    ></path></svg
                                                >
                                            </button>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        {/if}
                    {/each}
                </div>
            {/if}

            {#if currentRows.length === 0}
                <div
                    class="px-6 py-24 flex flex-col items-center justify-center gap-3 opacity-20 grayscale"
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
                        ></path></svg
                    >
                    <span
                        class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >No records found</span
                    >
                </div>
            {/if}
        </div>

        <!-- View Settings Sidebar (Notion-style) -->
        {#if showSettings}
            <div
                class="w-72 border-l border-slate-100 bg-white h-full flex flex-col shadow-2xl z-50 shrink-0"
                transition:slide={{ axis: "x", duration: 300 }}
            >
                <div
                    class="px-6 py-4 border-b border-slate-50 flex items-center justify-between"
                >
                    <span
                        class="text-xs font-black uppercase tracking-widest text-slate-800"
                        >View settings</span
                    >
                    <button
                        onclick={() => (showSettings = false)}
                        class="text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Close settings"
                    >
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2.5"
                                d="M6 18L18 6M6 6l12 12"
                            ></path></svg
                        >
                    </button>
                </div>

                <div class="flex-1 overflow-auto p-4 flex flex-col gap-6">
                    <!-- General Section -->
                    <div class="flex flex-col gap-3">
                        <h4
                            class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                            General
                        </h4>
                        <div class="flex flex-col gap-1">
                            <button
                                onclick={() => (isFullPage = !isFullPage)}
                                class="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all {isFullPage
                                    ? 'bg-indigo-50/50 border-indigo-100'
                                    : ''}"
                            >
                                <div class="flex items-center gap-3">
                                    <svg
                                        class="w-4 h-4 text-slate-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                        ></path></svg
                                    >
                                    <span
                                        class="text-[10px] font-black uppercase text-slate-700"
                                        >Full-Page Mode</span
                                    >
                                </div>
                                <div
                                    class="w-8 h-4 rounded-full bg-slate-200 relative transition-colors {isFullPage
                                        ? 'bg-indigo-500'
                                        : ''}"
                                >
                                    <div
                                        class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform {isFullPage
                                            ? 'translate-x-4'
                                            : ''}"
                                    ></div>
                                </div>
                            </button>

                            <button
                                onclick={() => (showRoadmap = true)}
                                class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all text-left"
                            >
                                <svg
                                    class="w-4 h-4 text-slate-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 00-2 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                    ></path></svg
                                >
                                <span
                                    class="text-[10px] font-black uppercase text-slate-700"
                                    >Feature Roadmap</span
                                >
                            </button>
                        </div>
                    </div>

                    <!-- Layout Section -->
                    <div class="flex flex-col gap-3">
                        <h4
                            class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                            Layout
                        </h4>
                        <div class="grid grid-cols-2 gap-2">
                            <button
                                onclick={() => (viewType = "table")}
                                class="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all {viewType ===
                                'table'
                                    ? 'border-primary-500 bg-primary-50 text-indigo-600 ring-4 ring-indigo-500/10'
                                    : 'border-slate-100 text-slate-500 hover:border-slate-200'}"
                            >
                                <svg
                                    class="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    ></path></svg
                                >
                                <span class="text-[9px] font-black uppercase"
                                    >Table</span
                                >
                            </button>
                            <button
                                onclick={() => (viewType = "gallery")}
                                class="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all {viewType ===
                                'gallery'
                                    ? 'border-primary-500 bg-primary-50 text-indigo-600 ring-4 ring-indigo-500/10'
                                    : 'border-slate-100 text-slate-500 hover:border-slate-200'}"
                            >
                                <svg
                                    class="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                                    ></path></svg
                                >
                                <span class="text-[9px] font-black uppercase"
                                    >Gallery</span
                                >
                            </button>
                        </div>
                    </div>

                    <!-- Properties Visibility Section -->
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center justify-between">
                            <h4
                                class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                            >
                                Shown in {viewType}
                            </h4>
                            <button
                                onclick={() =>
                                    (visibleColumnKeys = new Set(
                                        columns.map((c) => c.key),
                                    ))}
                                class="text-[9px] font-black uppercase text-indigo-500 hover:underline"
                                >Reset</button
                            >
                        </div>
                        <div
                            class="flex flex-col bg-slate-50 rounded-xl overflow-hidden border border-slate-100"
                        >
                            {#each columns as col}
                                <button
                                    onclick={() => toggleColumn(col.key)}
                                    class="flex items-center gap-3 px-3 py-2.5 hover:bg-white transition-colors border-b border-slate-50 last:border-0"
                                >
                                    <div
                                        class="w-4 flex items-center justify-center"
                                    >
                                        {#if visibleColumnKeys.has(col.key)}
                                            <svg
                                                class="w-3.5 h-3.5 text-indigo-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="3"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                ></path><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                ></path></svg
                                            >
                                        {:else}
                                            <svg
                                                class="w-3.5 h-3.5 text-slate-300"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                                                ></path></svg
                                            >
                                        {/if}
                                    </div>
                                    <span
                                        class="text-[10px] font-bold text-slate-700"
                                        >{col.label}</span
                                    >
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>

                <div class="p-4 border-t border-slate-50 flex flex-col gap-2">
                    <button
                        onclick={saveSettings}
                        class="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/10"
                    >
                        Save as default
                    </button>
                    {#if isFullPage}
                        <button
                            onclick={() => (isFullPage = false)}
                            class="w-full py-2 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                        >
                            Exit Full Page
                        </button>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Roadmap Overlay -->
        {#if showRoadmap}
            <div
                class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                transition:fade
            >
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
                    onclick={(e) => e.stopPropagation()}
                >
                    <div
                        class="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0"
                    >
                        <div class="flex flex-col gap-1">
                            <h2
                                class="text-xl font-black tracking-tight text-slate-800"
                            >
                                Feature Roadmap
                            </h2>
                            <p
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                            >
                                Planned Enhancements
                            </p>
                        </div>
                        <button
                            onclick={() => (showRoadmap = false)}
                            class="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                            aria-label="Close roadmap"
                        >
                            <svg
                                class="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                ></path></svg
                            >
                        </button>
                    </div>

                    <div
                        class="flex-1 overflow-auto p-8 flex flex-col gap-6 max-h-[60vh]"
                    >
                        {#each Array.from(new Set(roadmapData.map((r) => r.phase))) as phase}
                            <div class="flex flex-col gap-4">
                                <h3
                                    class="text-[10px] font-black uppercase tracking-widest text-indigo-500/60"
                                >
                                    Phase {phase}
                                </h3>
                                <div class="grid gap-2">
                                    {#each roadmapData.filter((r) => r.phase === phase) as item}
                                        <div
                                            class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50"
                                        >
                                            <span
                                                class="text-sm font-bold text-slate-700"
                                                >{item.title}</span
                                            >
                                            <span
                                                class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest {item.status ===
                                                'In Progress'
                                                    ? 'bg-indigo-100 text-indigo-600'
                                                    : 'bg-slate-200 text-slate-500'}"
                                            >
                                                {item.status}
                                            </span>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>

                    <div class="p-6 bg-slate-50 border-t border-slate-100">
                        <p
                            class="text-[10px] font-medium text-slate-400 text-center italic"
                        >
                            Features are updated regularly based on feedback
                        </p>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Footer: Pagination (Small/Simplified) -->
    <div
        class="px-5 py-2.5 border-t border-slate-50 bg-white/50 flex items-center justify-between shrink-0"
    >
        <div
            class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
        >
            {totalEntries} records
        </div>
        <div class="flex items-center gap-2">
            <button
                onclick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                class="px-2 py-1 text-slate-400 disabled:opacity-30 hover:text-indigo-600 transition-colors"
                aria-label="Previous page"
            >
                <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M15 19l-7-7 7-7"
                    ></path></svg
                >
            </button>
            <span class="text-[9px] font-black text-slate-600"
                >{currentPage} / {totalPages || 1}</span
            >
            <button
                onclick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                class="px-2 py-1 text-slate-400 disabled:opacity-30 hover:text-indigo-600 transition-colors"
                aria-label="Next page"
            >
                <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M9 5l7 7-7 7"
                    ></path></svg
                >
            </button>
        </div>
    </div>
</div>
