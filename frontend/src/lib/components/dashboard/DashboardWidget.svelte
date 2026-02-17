<script lang="ts">
    import { slide, fade, scale, fly } from "svelte/transition";
    import { goto } from "$app/navigation";
    import SchemaDesigner from "$lib/components/SchemaDesigner.svelte";
    import WidgetTable from "$lib/components/dashboard/widgets/table/WidgetTable.svelte";
    import WidgetProfile from "$lib/components/dashboard/widgets/profile/WidgetProfile.svelte";
    import WidgetHeader from "$lib/components/dashboard/widgets/header/WidgetHeader.svelte";
    import WidgetStats from "$lib/components/dashboard/widgets/stats/WidgetStats.svelte";
    import WidgetList from "$lib/components/dashboard/widgets/list/WidgetList.svelte";
    import WidgetChart from "$lib/components/dashboard/widgets/chart/WidgetChart.svelte";
    import WidgetActivity from "$lib/components/dashboard/widgets/activity/WidgetActivity.svelte";
    import WidgetTitle from "$lib/components/dashboard/widgets/title/WidgetTitle.svelte";
    import WidgetManagerWidget from "$lib/components/dashboard/widgets/manager/WidgetManagerWidget.svelte";
    import ClientDBWidget from "$lib/components/dashboard/widgets/system/ClientDBWidget.svelte";
    import MediaWidget from "$lib/components/dashboard/widgets/system/MediaWidget.svelte";
    import { type DashboardState } from "$lib/dashboardState.svelte";
    import type { Widget } from "$lib/components/dashboard/widgetConfig";
    import { DUMMY_POSTS } from "$lib/mockData";
    import { adminState } from "$lib/adminState.svelte";
    import DynamicForm from "$lib/components/DynamicForm.svelte";
    import { ClientDB } from "$lib/client-db/core";
    import { SyncEngine } from "$lib/client-db/sync/engine";

    let { widget, state: dashboardState } = $props<{
        widget: Widget;
        state: DashboardState;
    }>();

    let isMaximized = $state(false);

    function toggleMaximize() {
        isMaximized = !isMaximized;
    }

    // --- Editable Table Logic ---
    let isEditing = $state(false);
    let showSchemaDesigner = $state(false);
    let editBuffer = $state<any>({});
    let editSchema = $state<any[]>([]);

    let peekMode = $derived(widget.settings?.peekMode || "center");

    async function handleEdit(row: any) {
        const tableName = widget.data?.tableName;
        if (!tableName) return;

        if (peekMode === "full") {
            if (tableName === "posts") {
                goto(`/admin/editor?slug=${row.slug}`);
                return;
            } else if (tableName === "users") {
                goto("/admin/users");
                return;
            } else {
                adminState.showToast(
                    "Full page editor not yet implemented for custom tables",
                    "info",
                );
            }
        }

        editBuffer = { ...row };

        // Try to get manual schema from ClientDB
        const stored = await ClientDB.getSchema(tableName);
        if (stored && stored.schema) {
            editSchema = stored.schema;
        } else {
            // Infer basic schema
            editSchema = Object.keys(row)
                .filter((k) => k !== "id")
                .map((k) => ({
                    field: k,
                    label: k.charAt(0).toUpperCase() + k.slice(1),
                    type: typeof row[k] === "boolean" ? "boolean" : "input",
                }));
        }

        isEditing = true;
    }

    async function handleSave() {
        const tableName = widget.data?.tableName;
        if (!tableName) return;

        try {
            const db = await ClientDB.init();
            const tx = db.transaction(tableName as any, "readwrite");
            await tx.store.put($state.snapshot(editBuffer));
            await tx.done;

            // Log for sync
            await SyncEngine.logOperation({
                table: tableName,
                action: "update",
                payload: $state.snapshot(editBuffer),
            });

            adminState.showToast("Updated successfully", "success");
            isEditing = false;
        } catch (e) {
            console.error("Failed to save widget edit:", e);
            adminState.showToast("Failed to save", "error");
        }
    }

    async function handleDelete(row: any) {
        const tableName = widget.data?.tableName;
        if (!tableName || !confirm("Delete this record?")) return;

        try {
            const db = await ClientDB.init();
            if (tableName === "posts") {
                adminState.showToast(
                    "Post deletion via widget not yet implemented",
                    "info",
                );
                return;
            } else {
                const tx = db.transaction(tableName as any, "readwrite");
                await tx.store.delete(row.id);
                await tx.done;

                await SyncEngine.logOperation({
                    table: tableName,
                    action: "delete",
                    payload: { id: row.id },
                });
            }
            adminState.showToast("Deleted successfully", "success");
        } catch (e) {
            console.error("Failed to delete from widget:", e);
        }
    }

    // Helper to determine if we should show the "Remove" button
    let showRemove = $derived(
        widget.type === "title" &&
            dashboardState.isDragging &&
            dashboardState.draggingWidget?.id === widget.id,
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

    const USER_COLUMNS = [
        { key: "fullName", label: "Name" },
        { key: "email", label: "Email" },
        {
            key: "role",
            label: "Role",
            render: (row: any) =>
                `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">${row.role || "user"}</span>`,
        },
        {
            key: "joinedAt",
            label: "Joined",
            align: "right",
            render: (row: any) =>
                row.joinedAt
                    ? new Date(row.joinedAt).toLocaleDateString()
                    : "—",
        },
    ];

    // Dynamic Data & Columns Resolver
    let tableData = $derived(() => {
        const tableName = widget.data?.tableName?.toLowerCase();
        if (tableName === "posts")
            return adminState.posts.length > 0 ? adminState.posts : DUMMY_POSTS;
        if (tableName === "users") return adminState.users;

        // Custom ClientDB tables
        const customTable = adminState.tables.find(
            (t: any) => t.name.toLowerCase() === tableName,
        );
        if (customTable) return customTable.data || [];

        return [];
    });

    let tableColumns = $derived(() => {
        const tableName = widget.data?.tableName?.toLowerCase();
        if (tableName === "posts") return POST_COLUMNS;
        if (tableName === "users") return USER_COLUMNS;

        // Generic columns for custom tables
        const data = tableData();
        if (data.length > 0) {
            return Object.keys(data[0])
                .filter((k) => k !== "id" && typeof data[0][k] !== "object")
                .slice(0, 4)
                .map((k) => ({
                    key: k,
                    label: k.charAt(0).toUpperCase() + k.slice(1),
                }));
        }

        return [{ key: "id", label: "ID" }];
    });
</script>

<div
    class="rounded-xl transition-all duration-200 relative flex flex-col group"
    oncontextmenu={(e) => dashboardState.handleContextMenu(e, widget.id)}
    role="region"
    aria-label="{widget.title} widget"
    class:bg-white={widget.type !== "title" && widget.type !== "header"}
    class:border={widget.type !== "title" && widget.type !== "header"}
    class:border-dashed={widget.type === "header"}
    class:border-indigo-300={widget.type === "header"}
    class:border-opacity-0={widget.type === "header"}
    class:group-hover:border-opacity-100={widget.type === "header"}
    class:border-slate-200={widget.type !== "title" && widget.type !== "header"}
    class:shadow-sm={!isMaximized &&
        widget.type !== "title" &&
        widget.type !== "header"}
    class:hover:shadow-xl={!isMaximized &&
        widget.type !== "title" &&
        widget.type !== "header"}
    class:overflow-hidden={widget.type !== "title" && widget.type !== "header"}
    style={isMaximized
        ? "position: fixed; inset: 1rem; z-index: 100; height: auto;"
        : `grid-column: ${widget.x + 1} / span ${widget.cols || 4}; grid-row: ${widget.y + 1} / span ${widget.rows || 1}; min-height: 60px;`}
    class:z-50={!isMaximized &&
        (dashboardState.resizingWidget?.id === widget.id ||
            dashboardState.draggingWidget?.id === widget.id)}
    class:ring-2={!isMaximized &&
        (dashboardState.resizingWidget?.id === widget.id ||
            dashboardState.draggingWidget?.id === widget.id)}
    class:ring-indigo-500={!isMaximized &&
        (dashboardState.resizingWidget?.id === widget.id ||
            dashboardState.draggingWidget?.id === widget.id)}
    class:shadow-2xl={isMaximized ||
        (!isMaximized &&
            (dashboardState.resizingWidget?.id === widget.id ||
                dashboardState.draggingWidget?.id === widget.id))}
    class:opacity-50={!isMaximized &&
        dashboardState.isDragging &&
        dashboardState.draggingWidget?.id !== widget.id}
    transition:slide
>
    {#if isMaximized}
        <div
            class="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 rounded-xl pointer-events-none"
        ></div>
    {/if}

    {#if widget.type !== "header" && widget.type !== "widget_manager" && widget.type !== "client_db" && widget.type !== "media"}
        <div
            class="shrink-0 flex flex-col relative group/content"
            class:cursor-grab={!widget.locked}
            class:active:cursor-grabbing={!widget.locked}
            onmousedown={(e: MouseEvent) => dashboardState.startDrag(e, widget)}
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
                <WidgetTitle {widget} onSave={() => dashboardState.save()} />
            {:else}
                <div class="flex items-center gap-2">
                    <span
                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                        >{widget.title}</span
                    >
                </div>
            {/if}

            <!-- Remove Button (Top-right) -->
            {#if !widget.locked}
                <button
                    onclick={() => dashboardState.removeWidget(widget.id)}
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
            {/if}
        </div>
    {/if}

    {#if widget.type === "header"}
        <div
            class="flex-1 min-h-[60px] flex flex-col relative group/header"
            class:cursor-grab={!widget.locked}
            class:active:cursor-grabbing={!widget.locked}
            onmousedown={(e: MouseEvent) => dashboardState.startDrag(e, widget)}
            role="button"
            tabindex="0"
            aria-label="Drag header"
        >
            <WidgetHeader />

            <!-- Remove Button for Naked Header (always on right) -->
            {#if !widget.locked}
                <button
                    onclick={() => dashboardState.removeWidget(widget.id)}
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
            {/if}
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
                        <WidgetTable
                            data={tableData()}
                            columns={tableColumns()}
                            onedit={handleEdit}
                            ondelete={handleDelete}
                            onconfigure={() => (showSchemaDesigner = true)}
                        />
                    </div>
                </div>
            {:else if widget.type === "profile"}
                <div class="flex-1 min-h-0 flex flex-col">
                    <WidgetProfile />
                </div>
            {:else if widget.type === "widget_manager"}
                <div class="flex-1 min-h-0 flex flex-col">
                    <WidgetManagerWidget {widget} state={dashboardState} />
                </div>
            {:else if widget.type === "client_db"}
                <div class="flex-1 min-h-0 flex flex-col">
                    <ClientDBWidget
                        {widget}
                        state={dashboardState}
                        {isMaximized}
                        onToggleMaximize={toggleMaximize}
                    />
                </div>
            {:else if widget.type === "media"}
                <div class="flex-1 min-h-0 flex flex-col">
                    <MediaWidget
                        {widget}
                        state={dashboardState}
                        {isMaximized}
                    />
                </div>
            {/if}
        </div>
    {/if}

    <!-- Resize Handles -->
    {#if !isMaximized && !widget.locked && widget.type !== "header"}
        <!-- Bottom-Right (Primary) -->
        <div
            class="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-slate-100 text-slate-400 rounded-tl-xl"
            onmousedown={(e: MouseEvent) =>
                dashboardState.startResize(e, widget, "br")}
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
            onmousedown={(e: MouseEvent) =>
                dashboardState.startResize(e, widget, "bl")}
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
            onmousedown={(e: MouseEvent) =>
                dashboardState.startResize(e, widget, "tr")}
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
            onmousedown={(e: MouseEvent) =>
                dashboardState.startResize(e, widget, "tl")}
            role="button"
            tabindex="0"
            aria-label="Resize component"
        >
            <div
                class="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400"
            ></div>
        </div>
    {/if}

    <!-- Edit Modal (Center Peek) -->
    {#if isEditing && peekMode === "center"}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-6"
            onclick={() => (isEditing = false)}
            transition:fade
        >
            <div
                class="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
                onclick={(e) => e.stopPropagation()}
                transition:scale={{ start: 0.95, duration: 200 }}
            >
                <div
                    class="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30"
                >
                    <div>
                        <h3
                            class="text-sm font-black uppercase tracking-widest text-slate-800"
                        >
                            Edit Record
                        </h3>
                        <p
                            class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5"
                        >
                            {widget.data?.tableName}
                        </p>
                    </div>
                    <button
                        onclick={() => (isEditing = false)}
                        class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Close edit modal"
                    >
                        <svg
                            class="w-4 h-4 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2.5"
                                d="M6 18L18 6M6 6l12 12"
                            /></svg
                        >
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-6">
                    <DynamicForm schema={editSchema} bind:data={editBuffer} />
                </div>

                <div
                    class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"
                >
                    <button
                        onclick={() => (isEditing = false)}
                        class="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onclick={handleSave}
                        class="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-indigo-500/20"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Side Peek Panel -->
    {#if isEditing && peekMode === "side"}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[1000] flex justify-end"
            onclick={() => (isEditing = false)}
            transition:fade
        >
            <div
                class="bg-white w-full max-w-lg h-full shadow-[-20px_0_50px_-12px_rgba(0,0,0,0.1)] border-l border-slate-100 flex flex-col"
                onclick={(e) => e.stopPropagation()}
                transition:fly={{ x: 500, duration: 300, opacity: 1 }}
            >
                <div
                    class="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10"
                >
                    <div>
                        <h3
                            class="text-base font-black uppercase tracking-tighter text-slate-800"
                        >
                            Edit Record
                        </h3>
                        <p
                            class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"
                        >
                            {widget.data?.tableName}
                        </p>
                    </div>
                    <button
                        onclick={() => (isEditing = false)}
                        class="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        aria-label="Close side panel"
                    >
                        <svg
                            class="w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2.5"
                                d="M6 18L18 6M6 6l12 12"
                            /></svg
                        >
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                    <div
                        class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
                    >
                        <DynamicForm
                            schema={editSchema}
                            bind:data={editBuffer}
                        />
                    </div>
                </div>

                <div
                    class="px-8 py-6 bg-white border-t border-slate-100 flex justify-end gap-3"
                >
                    <button
                        onclick={() => (isEditing = false)}
                        class="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs uppercase"
                    >
                        Cancel
                    </button>
                    <button
                        onclick={handleSave}
                        class="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-indigo-500/20"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Schema Designer Modal -->
    {#if showSchemaDesigner}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-12"
            onclick={() => (showSchemaDesigner = false)}
            transition:fade
        >
            <div
                class="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
                onclick={(e) => e.stopPropagation()}
                transition:scale={{ start: 0.95, duration: 200 }}
            >
                <SchemaDesigner
                    tableName={widget.data?.tableName || ""}
                    columns={tableColumns().map((c) => c.key)}
                    onSave={() => (showSchemaDesigner = false)}
                />
            </div>
        </div>
    {/if}
</div>
