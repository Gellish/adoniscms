<script lang="ts">
    import { slide } from "svelte/transition";
    import WidgetTable from "$lib/components/dashboard/widgets/table/WidgetTable.svelte";
    import WidgetProfile from "$lib/components/dashboard/widgets/profile/WidgetProfile.svelte";
    import WidgetHeader from "$lib/components/dashboard/widgets/header/WidgetHeader.svelte";
    import WidgetStats from "$lib/components/dashboard/widgets/stats/WidgetStats.svelte";
    import WidgetList from "$lib/components/dashboard/widgets/list/WidgetList.svelte";
    import WidgetChart from "$lib/components/dashboard/widgets/chart/WidgetChart.svelte";
    import WidgetActivity from "$lib/components/dashboard/widgets/activity/WidgetActivity.svelte";
    import WidgetTitle from "$lib/components/dashboard/widgets/title/WidgetTitle.svelte";
    import { type DashboardState } from "$lib/dashboardState.svelte";
    import type { Widget } from "$lib/components/dashboard/widgetConfig";

    let { widget, state } = $props<{ widget: Widget; state: DashboardState }>();

    // Helper to determine if we should show the "Remove" button
    let showRemove = $derived(
        widget.type === "title" &&
            state.isDragging &&
            state.draggingWidget?.id === widget.id,
    );

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

    // TODO: Move this dummy data generator to a better place or pass as prop if needed
    function generateDummyPosts(count: number) {
        return Array.from({ length: count }, (_, i) => ({
            id: `post-${i}`,
            title: `Demo Post Title ${i + 1} - A comprehensive guide to something interesting`,
            status: i % 3 === 0 ? "published" : "draft",
            publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
        }));
    }
    const dummyPosts = generateDummyPosts(50);
</script>

<div
    class="rounded-xl transition-all duration-200 relative flex flex-col group"
    oncontextmenu={(e) => state.handleContextMenu(e, widget.id)}
    role="region"
    aria-label="{widget.title} widget"
    class:bg-white={widget.type !== "title" && widget.type !== "header"}
    class:border={widget.type !== "title" && widget.type !== "header"}
    class:border-dashed={widget.type === "header"}
    class:border-indigo-300={widget.type === "header"}
    class:border-opacity-0={widget.type === "header"}
    class:group-hover:border-opacity-100={widget.type === "header"}
    class:border-slate-200={widget.type !== "title" && widget.type !== "header"}
    class:shadow-sm={widget.type !== "title" && widget.type !== "header"}
    class:hover:shadow-xl={widget.type !== "title" && widget.type !== "header"}
    class:overflow-hidden={widget.type !== "title" && widget.type !== "header"}
    style="grid-column: {widget.x + 1} / span {widget.cols ||
        4}; grid-row: {widget.y + 1} / span {widget.rows ||
        1}; min-height: 60px;"
    class:z-50={state.resizingWidget?.id === widget.id ||
        state.draggingWidget?.id === widget.id}
    class:ring-2={state.resizingWidget?.id === widget.id ||
        state.draggingWidget?.id === widget.id}
    class:ring-indigo-500={state.resizingWidget?.id === widget.id ||
        state.draggingWidget?.id === widget.id}
    class:shadow-2xl={state.resizingWidget?.id === widget.id ||
        state.draggingWidget?.id === widget.id}
    class:opacity-50={state.isDragging &&
        state.draggingWidget?.id !== widget.id}
    transition:slide
>
    {#if widget.type !== "header"}
        <div
            class="shrink-0 flex flex-col relative group/content"
            class:cursor-grab={!widget.locked}
            class:active:cursor-grabbing={!widget.locked}
            onmousedown={(e: MouseEvent) => state.startDrag(e, widget)}
            role="button"
            tabindex="0"
            aria-label="Drag widget"
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
            {#if widget.type === "title"}
                <WidgetTitle {widget} onSave={() => state.save()} />
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
                onclick={() => state.removeWidget(widget.id)}
                class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors z-[60] opacity-0 group-hover:opacity-100"
                class:!opacity-100={showRemove}
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
    {/if}

    {#if widget.type === "header"}
        <div
            class="flex-1 min-h-[60px] flex flex-col relative group/header"
            class:cursor-grab={!widget.locked}
            class:active:cursor-grabbing={!widget.locked}
            onmousedown={(e: MouseEvent) => state.startDrag(e, widget)}
            role="button"
            tabindex="0"
            aria-label="Drag header"
        >
            <WidgetHeader />

            <!-- Remove Button for Naked Header (always on right) -->
            <button
                onclick={() => state.removeWidget(widget.id)}
                class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors z-[60] opacity-0 group-hover:opacity-100"
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
    {:else if widget.type !== "title"}
        <div class="flex-1 min-h-0 flex flex-col px-4 pb-4">
            {#if widget.type === "stats"}
                <WidgetStats />
            {:else if widget.type === "list"}
                <WidgetList />
            {:else if widget.type === "chart"}
                <WidgetChart />
            {:else if widget.type === "activity"}
                <WidgetActivity />
            {:else if widget.type === "table"}
                <div class="flex-1 min-h-0 flex flex-col">
                    <div
                        class="px-0 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 mb-4"
                    >
                        <div
                            class="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2"
                        >
                            <span class="text-indigo-500">🗃️</span>
                            {widget.data?.tableName || "Data Table"}
                        </div>
                    </div>
                    <div class="flex-1 min-h-0 bg-white relative">
                        {#if widget.data?.tableName?.toLowerCase() === "posts"}
                            <WidgetTable
                                data={dummyPosts}
                                columns={POST_COLUMNS}
                            />
                        {:else}
                            <div
                                class="p-8 text-center text-slate-400 italic text-sm w-full h-full flex items-center justify-center bg-slate-50"
                            >
                                No table configuration found for "{widget.data
                                    ?.tableName || "unknown table"}"
                            </div>
                        {/if}
                    </div>
                </div>
            {:else if widget.type === "profile"}
                <div class="flex-1 min-h-0 flex flex-col">
                    <WidgetProfile />
                </div>
            {/if}
        </div>
    {/if}

    <!-- Resize Handles -->
    {#if !widget.locked && widget.type !== "header"}
        <!-- Bottom-Right (Primary) -->
        <div
            class="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-slate-100 text-slate-400 rounded-tl-xl"
            onmousedown={(e: MouseEvent) => state.startResize(e, widget, "br")}
            role="button"
            tabindex="0"
            aria-label="Resize component"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 transform rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
            </svg>
        </div>

        <!-- Bottom-Left -->
        <div
            class="absolute bottom-0 left-0 w-8 h-8 cursor-sw-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-slate-100 text-slate-400 rounded-tr-xl"
            onmousedown={(e: MouseEvent) => state.startResize(e, widget, "bl")}
            role="button"
            tabindex="0"
            aria-label="Resize component"
        >
            <div
                class="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400"
            ></div>
        </div>

        <!-- Top-Right -->
        <div
            class="absolute top-0 right-0 w-8 h-8 cursor-ne-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-slate-100 text-slate-400 rounded-bl-xl"
            onmousedown={(e: MouseEvent) => state.startResize(e, widget, "tr")}
            role="button"
            tabindex="0"
            aria-label="Resize component"
        >
            <div
                class="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400"
            ></div>
        </div>

        <!-- Top-Left -->
        <div
            class="absolute top-0 left-0 w-8 h-8 cursor-nw-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-indigo-600/20 text-indigo-600 rounded-br-xl"
            onmousedown={(e: MouseEvent) => state.startResize(e, widget, "tl")}
            role="button"
            tabindex="0"
            aria-label="Resize component"
        >
            <div
                class="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400"
            ></div>
        </div>
    {/if}
</div>
