<script lang="ts">
    import { onMount } from "svelte";
    import { ClientDB } from "$lib/client-db/core";
    import { fade, slide } from "svelte/transition";
    import { adminState } from "$lib/adminState.svelte";

    let { slug = "default" } = $props<{ slug?: string }>();

    type WidgetType = "stats" | "list" | "chart" | "activity" | "table";

    interface Widget {
        id: string;
        type: WidgetType;
        title: string;
        data?: any;
    }

    let widgets = $state<Widget[]>([]);
    let isLoading = $state(true);
    let showPalette = $state(false);
    let searchQuery = $state("");

    const BASE_WIDGETS: {
        type: WidgetType;
        label: string;
        icon: string;
        description: string;
        data?: any;
    }[] = [
        {
            type: "stats",
            label: "Stats Card",
            icon: "📊",
            description: "Display a single metric with a trend.",
        },
        {
            type: "list",
            label: "Data List",
            icon: "📝",
            description: "Show a list of recent records.",
        },
        {
            type: "chart",
            label: "Growth Chart",
            icon: "📈",
            description: "Visualize data trends over time.",
        },
        {
            type: "activity",
            label: "Activity Feed",
            icon: "🔔",
            description: "Real-time updates and logs.",
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
                data: { tableName: t.name },
            }));

        return [...standard, ...tableWidgets];
    });

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
        const newWidget: Widget = {
            id: crypto.randomUUID(),
            type: item.type,
            title:
                item.type === "table"
                    ? item.label
                    : `New ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`,
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
</script>

<div class="dashboard-builder h-full flex flex-col bg-[#f8fafc]">
    <!-- Header -->
    <header
        class="p-6 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm"
    >
        <div>
            <h1
                class="text-2xl font-black text-slate-900 uppercase tracking-tighter"
            >
                {slug.replace("-", " ")}
                <span class="text-indigo-600">Dashboard</span>
            </h1>
            <p
                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"
            >
                Customize your workspace by adding components
            </p>
        </div>

        <button
            onclick={() => (showPalette = true)}
            class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
            <span>+ Add Component</span>
        </button>
    </header>

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
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                in:fade
            >
                {#each widgets as widget (widget.id)}
                    <div
                        class="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        transition:slide
                    >
                        <div
                            class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"
                        >
                            <span
                                class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                                >{widget.title}</span
                            >
                            <button
                                onclick={() => removeWidget(widget.id)}
                                class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
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
                        <div
                            class="p-8 h-48 flex flex-col items-center justify-center text-center"
                        >
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
                                <div class="text-4xl text-slate-200 mb-2">
                                    🗃️
                                </div>
                                <div class="text-sm font-bold text-slate-900">
                                    {widget.data?.tableName}
                                </div>
                                <div
                                    class="text-[10px] text-slate-400 mt-1 uppercase tracking-widest"
                                >
                                    Table View
                                </div>
                            {/if}
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
</div>

<style>
    .dashboard-builder {
        font-family: "Inter", sans-serif;
    }
</style>
