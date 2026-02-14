<script lang="ts">
    import { onMount } from "svelte";
    import { ClientDB } from "$lib/client-db/core";
    import { fade, slide } from "svelte/transition";
    import { adminState } from "$lib/adminState.svelte";
    import WidgetTable from "$lib/components/dashboard/WidgetTable.svelte";

    let { slug = "default" } = $props<{ slug?: string }>();

    type WidgetType =
        | "stats"
        | "list"
        | "chart"
        | "activity"
        | "table"
        | "title";

    interface Widget {
        id: string;
        type: WidgetType;
        title: string;
        data?: any;
        cols: number; // 1-12
        rows: number; // 1-12
        x: number; // 0-11
        y: number; // 0+
    }

    let widgets = $state<Widget[]>([]);
    let isLoading = $state(true);
    let showPalette = $state(false);
    let searchQuery = $state("");

    // Grid State
    let isResizing = $state(false);
    let resizingWidget = $state<any>(null);
    let resizeDir = $state("br");
    let initialX = 0;
    let initialY = 0;
    let initialCols = 1;
    let initialRows = 1;
    let initialWidgetGridX = 0;
    let initialWidgetGridY = 0;

    let contextMenu = $state({
        visible: false,
        x: 0,
        y: 0,
        widgetId: null as string | null,
    });

    $effect(() => {
        const handleGlobalClick = () => {
            if (contextMenu.visible) closeContextMenu();
        };
        window.addEventListener("click", handleGlobalClick);
        return () => window.removeEventListener("click", handleGlobalClick);
    });

    let isDragging = $state(false);
    let draggingWidget = $state<any>(null);
    let dragStartX = 0;
    let dragStartY = 0;
    let initialWidgetX = 0;
    let initialWidgetY = 0;

    const BASE_WIDGETS: {
        type: WidgetType;
        label: string;
        icon: string;
        description: string;
        defaultCols: number;
        defaultRows: number;
        data?: any;
    }[] = [
        {
            type: "stats",
            label: "Stats Card",
            icon: "📊",
            description: "Display a single metric with a trend.",
            defaultCols: 3,
            defaultRows: 3,
        },
        {
            type: "list",
            label: "Data List",
            icon: "📝",
            description: "Show a list of recent records.",
            defaultCols: 4,
            defaultRows: 6,
        },
        {
            type: "chart",
            label: "Growth Chart",
            icon: "📈",
            description: "Visualize data trends over time.",
            defaultCols: 6,
            defaultRows: 6,
        },
        {
            type: "activity",
            label: "Activity Feed",
            icon: "🔔",
            description: "Real-time updates and logs.",
            defaultCols: 3,
            defaultRows: 6,
        },
        {
            type: "table",
            label: "Data Table",
            icon: "🗃️",
            description: "Display a table of records (default: Posts).",
            defaultCols: 12,
            defaultRows: 12,
            data: { tableName: "posts" },
        },
        {
            type: "title",
            label: "Dashboard Title",
            icon: "🏷️",
            description: "A draggable title for your dashboard section.",
            defaultCols: 12,
            defaultRows: 1,
        },
    ];

    let availableWidgets = $derived.by(() => {
        const query = searchQuery.toLowerCase();

        // standard widgets
        const standard = BASE_WIDGETS.filter(
            (w) =>
                w.label.toLowerCase().includes(query) ||
                w.description.toLowerCase().includes(query),
        );

        // table widgets
        const tableWidgets = adminState.tables
            .filter((t) => t.name.toLowerCase().includes(query))
            .map((t) => ({
                type: "table" as WidgetType,
                label: `${t.name} Table`,
                icon: "🗃️",
                description: `Display data from ${t.name}`,
                defaultCols: 8,
                defaultRows: 4,
                data: { tableName: t.name },
            }));

        return [...standard, ...tableWidgets];
    });

    const POST_COLUMNS = [
        { key: "title", label: "Title" },
        {
            key: "status",
            label: "Status",
            render: (row: any) => {
                if (!row) return "";
                return `<span class="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest ${row.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}">${row.status || "Draft"}</span>`;
            },
        },
        {
            key: "publishedAt",
            label: "Date",
            align: "right",
            render: (row: any) => {
                if (!row) return "";
                return row.publishedAt || row.updatedAt
                    ? new Date(
                          row.publishedAt || row.updatedAt,
                      ).toLocaleDateString()
                    : "—";
            },
        },
    ];

    function generateDummyPosts(count: number) {
        return Array.from({ length: count }, (_, i) => ({
            id: `post-${i}`,
            title: `Demo Post Title ${i + 1} - A comprehensive guide to something interesting`,
            status: i % 3 === 0 ? "published" : "draft",
            publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
        }));
    }

    let dummyPosts = $state(generateDummyPosts(50));

    onMount(async () => {
        await loadDashboard();
        if (adminState.tables.length === 0) {
            await adminState.loadAllLocal();
        }
    });

    async function loadDashboard() {
        try {
            const db = await ClientDB.init();
            const config = await db.get("dashboards", slug);
            if (config && config.widgets) {
                widgets = config.widgets;
            }
        } catch (e) {
            console.error("Failed to load dashboard config", e);
        } finally {
            if (widgets.length === 0) {
                widgets.push({
                    id: "header-1",
                    type: "title",
                    title: slug.replace("-", " ").toUpperCase() + " DASHBOARD",
                    cols: 12,
                    rows: 1,
                    x: 0,
                    y: 0,
                });
            }
            isLoading = false;
        }
    }

    async function saveDashboard() {
        try {
            const db = await ClientDB.init();
            await db.put("dashboards", {
                id: slug,
                widgets: $state.snapshot(widgets),
                updatedAt: Date.now(),
            });
        } catch (e) {
            console.error("Failed to save dashboard config", e);
        }
    }

    function addWidget(item: (typeof BASE_WIDGETS)[0]) {
        // Simple logic to find next Y position
        const maxY =
            widgets.length > 0
                ? Math.max(...widgets.map((w) => (w.y || 0) + (w.rows || 1)))
                : 0;

        const newWidget: Widget = {
            id: crypto.randomUUID(),
            type: item.type,
            title:
                item.type === "table"
                    ? item.label
                    : `New ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`,
            cols: item.defaultCols,
            rows: item.defaultRows,
            x: 0,
            y: maxY,
            data: item.data,
        };
        widgets.push(newWidget);
        showPalette = false;
        saveDashboard();
    }

    function removeWidget(id: string) {
        widgets = widgets.filter((w) => w.id !== id);
        saveDashboard();
    }

    // --- Resizing Logic ---
    function startResize(e: MouseEvent, widget: any, dir: string = "br") {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        resizingWidget = widget;
        resizeDir = dir;
        initialX = e.clientX;
        initialY = e.clientY;
        initialCols = widget.cols || 1;
        initialRows = widget.rows || 1;
        initialWidgetGridX = widget.x || 0;
        initialWidgetGridY = widget.y || 0;

        window.addEventListener("mousemove", handleResize);
        window.addEventListener("mouseup", stopResize);
    }

    function handleResize(e: MouseEvent) {
        if (!isResizing || !resizingWidget || !container) return;

        const deltaX = e.clientX - initialX;
        const deltaY = e.clientY - initialY;

        const rect = container.getBoundingClientRect();
        const gap = 24; // gap-6
        const totalGap = gap * 11;
        const colWidth = (rect.width - totalGap) / 12 + gap;
        const rowHeight = 60 + gap;

        let newCols = initialCols;
        let newRows = initialRows;
        let newX = initialWidgetGridX;
        let newY = initialWidgetGridY;

        // X-axis resize
        if (resizeDir.includes("r")) {
            newCols = Math.max(2, Math.round(initialCols + deltaX / colWidth));
        } else if (resizeDir.includes("l")) {
            const potentialNewX = Math.round(
                initialWidgetGridX + deltaX / colWidth,
            );
            const colsDiff = initialWidgetGridX - potentialNewX;
            newCols = Math.max(2, initialCols + colsDiff);
            newX = initialWidgetGridX + (initialCols - newCols);
        }

        // Y-axis resize
        if (resizeDir.includes("b")) {
            newRows = Math.max(1, Math.round(initialRows + deltaY / rowHeight));
        } else if (resizeDir.includes("t")) {
            const potentialNewY = Math.round(
                initialWidgetGridY + deltaY / rowHeight,
            );
            const rowsDiff = initialWidgetGridY - potentialNewY;
            newRows = Math.max(1, initialRows + rowsDiff);
            newY = initialWidgetGridY + (initialRows - newRows);
        }

        // Final Constraints
        newCols = Math.max(2, Math.min(12 - newX, newCols));
        newX = Math.max(0, Math.min(11, newX));
        newY = Math.max(0, newY);

        if (
            newCols !== resizingWidget.cols ||
            newRows !== resizingWidget.rows ||
            newX !== resizingWidget.x ||
            newY !== resizingWidget.y
        ) {
            resizingWidget.cols = newCols;
            resizingWidget.rows = newRows;
            resizingWidget.x = newX;
            resizingWidget.y = newY;
        }
    }

    function stopResize() {
        isResizing = false;
        resizingWidget = null;
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", stopResize);
        saveDashboard();
    }

    function handleContextMenu(e: MouseEvent, widgetId: string) {
        e.preventDefault();
        e.stopPropagation();
        contextMenu = {
            visible: true,
            x: e.clientX,
            y: e.clientY,
            widgetId,
        };
    }

    function closeContextMenu() {
        contextMenu.visible = false;
    }

    let container = $state<HTMLElement>();

    // --- Dragging Logic ---
    function startDrag(e: MouseEvent, widget: any) {
        if (
            e.target instanceof HTMLButtonElement ||
            (e.target as HTMLElement).closest("button")
        )
            return;

        e.preventDefault();
        isDragging = true;
        draggingWidget = widget;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        initialWidgetX = widget.x || 0;
        initialWidgetY = widget.y || 0;

        window.addEventListener("mousemove", handleDrag);
        window.addEventListener("mouseup", stopDrag);
        document.body.style.cursor = "grabbing";
    }

    function handleDrag(e: MouseEvent) {
        if (!isDragging || !draggingWidget || !container) return;

        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        const rect = container.getBoundingClientRect();
        const gap = 24; // gap-6
        const totalGap = gap * 11;
        const colWidth = (rect.width - totalGap) / 12 + gap;
        const rowHeight = 60 + gap;

        const newX = Math.max(
            0,
            Math.min(
                12 - (draggingWidget.cols || 1),
                Math.round(initialWidgetX + deltaX / colWidth),
            ),
        );
        const newY = Math.max(
            0,
            Math.round(initialWidgetY + deltaY / rowHeight),
        );

        if (newX !== draggingWidget.x || newY !== draggingWidget.y) {
            draggingWidget.x = newX;
            draggingWidget.y = newY;

            // Auto-Shifting Logic: Push other widgets down
            pushWidgets(draggingWidget);
        }

        // Auto-scroll logic
        const scrollThreshold = 100;
        const scrollSpeed = 15;
        if (e.clientY < scrollThreshold) {
            window.scrollBy(0, -scrollSpeed);
        } else if (window.innerHeight - e.clientY < scrollThreshold) {
            window.scrollBy(0, scrollSpeed);
        }
    }

    function pushWidgets(movedWidget: Widget) {
        let changed = true;
        let iterations = 0;
        const maxIterations = 50; // Safety break

        const isOverlapping = (a: Widget, b: Widget) => {
            return (
                a.x < b.x + b.cols &&
                a.x + a.cols > b.x &&
                a.y < b.y + b.rows &&
                a.y + a.rows > b.y
            );
        };

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            // 1. Resolve overlap with moved widget first
            for (const other of widgets) {
                if (other.id === movedWidget.id) continue;
                if (isOverlapping(movedWidget, other)) {
                    other.y = movedWidget.y + movedWidget.rows;
                    changed = true;
                }
            }

            // 2. Cascade pushes (Top and Bottom)
            const sortedWidgets = [...widgets].sort((a, b) => a.y - b.y);
            for (let i = 0; i < sortedWidgets.length; i++) {
                for (let j = i + 1; j < sortedWidgets.length; j++) {
                    const a = sortedWidgets[i];
                    const b = sortedWidgets[j];
                    if (a.id === b.id) continue;

                    if (isOverlapping(a, b)) {
                        // Push b down since it's already further or equal in Y
                        b.y = a.y + a.rows;
                        changed = true;
                    }
                }
            }
        }
    }

    function stopDrag() {
        isDragging = false;
        draggingWidget = null;
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("mouseup", stopDrag);
        document.body.style.cursor = "";
        saveDashboard();
    }
</script>

<div class="dashboard-builder h-full flex flex-col bg-[#f8fafc]">
    <!-- Canvas -->
    <main class="flex-1 p-8 overflow-y-auto">
        {#if isLoading}
            <div class="h-full flex items-center justify-center">
                <div
                    class="animate-pulse text-slate-300 font-black uppercase text-xs tracking-[0.2em]"
                >
                    Initialising Canvas...
                </div>
            </div>
        {:else if widgets.length === 0}
            <div
                class="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-200 rounded-[32px] p-12 text-center relative overflow-hidden"
                in:fade
            >
                <!-- Grid Background -->
                <div
                    class="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style="background-image: radial-gradient(#6366f1 1px, transparent 1px); background-size: 24px 24px;"
                ></div>

                <div class="relative z-10 flex flex-col items-center">
                    <div
                        class="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm ring-4 ring-indigo-50/50"
                    >
                        🎨
                    </div>
                    <h2
                        class="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter"
                    >
                        Canvas Ready
                    </h2>
                    <p class="text-slate-500 text-sm max-w-xs mb-8 font-medium">
                        This dashboard is your blank canvas. Open the palette to
                        start dropping components.
                    </p>
                    <button
                        onclick={() => (showPalette = true)}
                        class="bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        Open Component Palette
                    </button>
                </div>
            </div>
        {:else}
            <div
                bind:this={container}
                class="grid grid-cols-1 md:grid-cols-12 gap-6 relative"
                style="grid-auto-rows: 60px;"
                in:fade
            >
                {#if isResizing || isDragging}
                    <!-- Transparent Grid Layer -->
                    <div
                        class="absolute inset-0 z-0 grid grid-cols-12 gap-6 pointer-events-none fade-in"
                        style="grid-auto-rows: 60px;"
                    >
                        {#each Array(12 * 30) as _, i}
                            <div
                                class="bg-indigo-500/5 rounded-2xl border-2 border-indigo-500/10 min-h-[60px]"
                            ></div>
                        {/each}
                    </div>
                {/if}

                {#if isDragging && draggingWidget}
                    <!-- Dynamic Snap Placeholder -->
                    <div
                        class="rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-50/30 transition-all duration-75 z-10 pointer-events-none"
                        style="grid-column: {draggingWidget.x +
                            1} / span {draggingWidget.cols}; grid-row: {draggingWidget.y +
                            1} / span {draggingWidget.rows}; min-height: 60px;"
                    ></div>
                {/if}

                {#each widgets as widget (widget.id)}
                    <div
                        class="rounded-xl transition-all duration-200 relative flex flex-col group"
                        oncontextmenu={(e) => handleContextMenu(e, widget.id)}
                        role="region"
                        aria-label="{widget.title} widget"
                        class:bg-white={widget.type !== "title"}
                        class:border={widget.type !== "title"}
                        class:border-slate-200={widget.type !== "title"}
                        class:shadow-sm={widget.type !== "title"}
                        class:hover:shadow-xl={widget.type !== "title"}
                        class:overflow-hidden={widget.type !== "title"}
                        style="grid-column: {widget.x +
                            1} / span {widget.cols || 4}; grid-row: {widget.y +
                            1} / span {widget.rows || 1}; min-height: 60px;"
                        class:z-50={resizingWidget?.id === widget.id ||
                            draggingWidget?.id === widget.id}
                        class:ring-2={resizingWidget?.id === widget.id ||
                            draggingWidget?.id === widget.id}
                        class:ring-indigo-500={resizingWidget?.id ===
                            widget.id || draggingWidget?.id === widget.id}
                        class:shadow-2xl={resizingWidget?.id === widget.id ||
                            draggingWidget?.id === widget.id}
                        class:opacity-50={isDragging &&
                            draggingWidget?.id !== widget.id}
                        transition:slide
                    >
                        <div
                            class="shrink-0 flex flex-col relative group/content"
                            class:px-4={widget.type !== "title"}
                            class:pt-4={widget.type !== "title"}
                            class:pb-2={widget.type !== "title"}
                            class:flex-1={widget.type === "title"}
                            class:min-h-0={widget.type === "title"}
                            class:border-b={widget.type !== "title"}
                            class:border-slate-100={widget.type !== "title"}
                            class:justify-center={widget.type === "title"}
                            class:bg-slate-50={widget.type !== "title"}
                        >
                            <!-- Drag Handle (Hover only) -->
                            <div
                                class="absolute top-2 left-2 p-1 bg-indigo-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-[70] flex items-center gap-1 shadow-lg"
                                onmousedown={(e) => startDrag(e, widget)}
                                role="button"
                                tabindex="0"
                                aria-label="Drag widget"
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="3"
                                    stroke-linecap="round"
                                >
                                    <circle cx="9" cy="5" r="1.5" /><circle
                                        cx="9"
                                        cy="12"
                                        r="1.5"
                                    /><circle cx="9" cy="19" r="1.5" /><circle
                                        cx="15"
                                        cy="5"
                                        r="1.5"
                                    /><circle cx="15" cy="12" r="1.5" /><circle
                                        cx="15"
                                        cy="19"
                                        r="1.5"
                                    />
                                </svg>
                                {#if widget.type === "title"}
                                    <span
                                        class="text-[8px] font-black uppercase tracking-tighter pr-1"
                                        >Move</span
                                    >
                                {/if}
                            </div>

                            {#if widget.type === "title"}
                                <div class="px-4 py-2">
                                    <input
                                        type="text"
                                        bind:value={widget.title}
                                        class="w-full bg-transparent border-none outline-none text-2xl font-black text-slate-900 uppercase tracking-tighter cursor-text focus:ring-2 focus:ring-indigo-500/20 rounded-lg py-1 px-2 mb-0"
                                        spellcheck="false"
                                        onblur={() => saveDashboard()}
                                        onkeydown={(e) =>
                                            e.key === "Enter" &&
                                            (
                                                e.target as HTMLInputElement
                                            ).blur()}
                                    />
                                </div>
                            {:else}
                                <div class="flex items-center gap-2">
                                    <span
                                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                                        >{widget.title}</span
                                    >
                                </div>
                            {/if}

                            <!-- Remove Button (Top-right) -->
                            <button
                                onclick={() => removeWidget(widget.id)}
                                class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors z-[60] opacity-0 group-hover:opacity-100"
                                class:!opacity-100={widget.type === "title" &&
                                    isDragging &&
                                    draggingWidget?.id === widget.id}
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
                        </div>

                        {#if widget.type !== "title"}
                            <div class="flex-1 min-h-0 flex flex-col px-4 pb-4">
                                {#if widget.type === "stats"}
                                    <div
                                        class="text-4xl font-black text-indigo-600 mb-2"
                                    >
                                        1,234
                                    </div>
                                    <div
                                        class="text-[10px] font-bold text-green-500 uppercase tracking-widest"
                                    >
                                        ↑ 12% Growth
                                    </div>
                                {:else if widget.type === "list"}
                                    <div class="space-y-2 w-full">
                                        <div
                                            class="h-2 bg-slate-100 rounded w-3/4"
                                        ></div>
                                        <div
                                            class="h-2 bg-slate-100 rounded w-1/2"
                                        ></div>
                                        <div
                                            class="h-2 bg-slate-100 rounded w-full"
                                        ></div>
                                    </div>
                                {:else if widget.type === "chart"}
                                    <div
                                        class="w-full flex items-end justify-between h-20 gap-1 px-4"
                                    >
                                        <div
                                            class="bg-indigo-100 w-full h-8 rounded-t"
                                        ></div>
                                        <div
                                            class="bg-indigo-200 w-full h-12 rounded-t"
                                        ></div>
                                        <div
                                            class="bg-indigo-400 w-full h-20 rounded-t"
                                        ></div>
                                        <div
                                            class="bg-indigo-300 w-full h-14 rounded-t"
                                        ></div>
                                        <div
                                            class="bg-indigo-600 w-full h-18 rounded-t"
                                        ></div>
                                    </div>
                                {:else if widget.type === "activity"}
                                    <div
                                        class="flex items-center gap-3 w-full border-l-2 border-indigo-200 pl-4 py-1"
                                    >
                                        <div
                                            class="w-2 h-2 bg-indigo-600 rounded-full"
                                        ></div>
                                        <div
                                            class="text-[10px] font-medium text-slate-600"
                                        >
                                            New user registered
                                        </div>
                                    </div>
                                {:else if widget.type === "table"}
                                    <div class="flex-1 min-h-0 flex flex-col">
                                        <div
                                            class="px-0 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 mb-4"
                                        >
                                            <div
                                                class="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2"
                                            >
                                                <span class="text-indigo-500"
                                                    >🗃️</span
                                                >
                                                {widget.data?.tableName ||
                                                    "Data Table"}
                                            </div>
                                        </div>
                                        <div
                                            class="flex-1 min-h-0 bg-white relative"
                                        >
                                            {#if widget.data?.tableName?.toLowerCase() === "posts"}
                                                <WidgetTable
                                                    data={dummyPosts}
                                                    columns={POST_COLUMNS}
                                                />
                                            {:else}
                                                <div
                                                    class="p-8 text-center text-slate-400 italic text-sm w-full h-full flex items-center justify-center bg-slate-50"
                                                >
                                                    No table configuration found
                                                    for "{widget.data
                                                        ?.tableName ||
                                                        "unknown table"}"
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        <!-- Resize Handles (All 4 Corners) -->
                        <div
                            class="absolute top-0 left-0 w-8 h-8 cursor-nw-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-indigo-600/20 text-indigo-600 rounded-br-xl"
                            onmousedown={(e) => startResize(e, widget, "tl")}
                            role="button"
                            tabindex="0"
                            aria-label="Resize from top-left"
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path
                                    d="M2 12L12 2M2 6L6 2"
                                    stroke="currentColor"
                                    stroke-width="4"
                                    stroke-linecap="round"
                                /></svg
                            >
                        </div>
                        <div
                            class="absolute top-0 right-0 w-8 h-8 cursor-ne-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-indigo-600/20 text-indigo-600 rounded-bl-xl"
                            onmousedown={(e) => startResize(e, widget, "tr")}
                            role="button"
                            tabindex="0"
                            aria-label="Resize from top-right"
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path
                                    d="M12 2L22 12M18 2L22 6"
                                    stroke="currentColor"
                                    stroke-width="4"
                                    stroke-linecap="round"
                                /></svg
                            >
                        </div>
                        <div
                            class="absolute bottom-0 left-0 w-8 h-8 cursor-sw-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-indigo-600/20 text-indigo-600 rounded-tr-xl"
                            onmousedown={(e) => startResize(e, widget, "bl")}
                            role="button"
                            tabindex="0"
                            aria-label="Resize from bottom-left"
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path
                                    d="M2 12L12 22M2 18L6 22"
                                    stroke="currentColor"
                                    stroke-width="4"
                                    stroke-linecap="round"
                                /></svg
                            >
                        </div>
                        <div
                            class="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-indigo-600/20 text-indigo-600 rounded-tl-xl"
                            onmousedown={(e) => startResize(e, widget, "br")}
                            role="button"
                            tabindex="0"
                            aria-label="Resize component"
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path
                                    d="M12 22L22 12"
                                    stroke="currentColor"
                                    stroke-width="4"
                                    stroke-linecap="round"
                                /><path
                                    d="M18 22L22 18"
                                    stroke="currentColor"
                                    stroke-width="4"
                                    stroke-linecap="round"
                                /></svg
                            >
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </main>

    <!-- Palette Modal -->
    {#if showPalette}
        <div
            class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden"
                transition:slide={{ axis: "y" }}
            >
                <div
                    class="p-8 border-b border-slate-100 flex items-center justify-between flex-shrink-0"
                >
                    <div>
                        <h2
                            class="text-2xl font-black text-slate-900 uppercase tracking-tighter"
                        >
                            Component <span class="text-indigo-600"
                                >Palette</span
                            >
                        </h2>
                        <p class="text-xs text-slate-400 font-medium">
                            Select a component to add to your dashboard
                        </p>
                    </div>
                    <button
                        onclick={() => (showPalette = false)}
                        class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition-colors"
                        aria-label="Close palette"
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <!-- Search Bar -->
                <div class="px-8 pt-4 pb-2">
                    <div class="relative">
                        <input
                            type="text"
                            bind:value={searchQuery}
                            placeholder="Search components..."
                            class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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

                <div
                    class="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[60vh]"
                >
                    {#each availableWidgets as item}
                        <button
                            onclick={() => addWidget(item)}
                            class="flex items-start gap-4 p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-left group"
                        >
                            <div
                                class="text-3xl p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors"
                            >
                                {item.icon}
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-900 mb-1">
                                    {item.label}
                                </h3>
                                <p
                                    class="text-xs text-slate-500 leading-relaxed"
                                >
                                    {item.description}
                                </p>
                            </div>
                        </button>
                    {/each}
                    {#if availableWidgets.length === 0}
                        <div
                            class="col-span-2 text-center py-8 text-slate-400 text-sm"
                        >
                            No components found matching "{searchQuery}"
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}

    <!-- Floating Add Button -->
    <button
        onclick={() => (showPalette = true)}
        class="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95 z-50 group"
        aria-label="Add Component"
    >
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
        >
            <path d="M12 5V19M5 12H19" />
        </svg>
        <span
            class="absolute right-20 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest pointer-events-none"
        >
            Add Component
        </span>
    </button>

    <!-- Context Menu -->
    {#if contextMenu.visible}
        <div
            class="fixed z-[200] bg-white border border-slate-200 shadow-2xl rounded-2xl py-2 min-w-[200px] overflow-hidden backdrop-blur-sm bg-white/95"
            style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
            transition:fade={{ duration: 100 }}
        >
            <div class="px-4 py-2 border-b border-slate-50 mb-1">
                <span
                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                    >Widget Actions</span
                >
            </div>
            <button
                onclick={() => {
                    if (contextMenu.widgetId) {
                        removeWidget(contextMenu.widgetId);
                        closeContextMenu();
                    }
                }}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition-colors text-sm font-bold group"
            >
                <div
                    class="p-1.5 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                    >
                        <path
                            d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        />
                    </svg>
                </div>
                <span>Delete Component</span>
            </button>
            <button
                onclick={closeContextMenu}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
            >
                <div class="p-1.5 bg-slate-100 rounded-lg">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                    >
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </div>
                <span>Cancel</span>
            </button>
        </div>
    {/if}
</div>

<style>
    .dashboard-builder {
        font-family: "Inter", sans-serif;
    }
</style>
