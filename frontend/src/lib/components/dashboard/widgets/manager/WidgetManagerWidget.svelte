<script lang="ts">
    import { WidgetManagerState } from "$lib/widgetManagerState.svelte";
    import type {
        Widget,
        PaletteItem,
    } from "$lib/components/dashboard/widgetConfig";
    import { type DashboardState } from "$lib/dashboardState.svelte";

    let { widget, state: dashboard } = $props<{
        widget: Widget;
        state: DashboardState;
    }>();

    // Use the same manager state, or pass it down?
    // New instance for now to resolve local widgets
    const manager = new WidgetManagerState();
    let editingItem = $state(null) as PaletteItem | null;

    function startEdit(item: PaletteItem) {
        // Create a copy to edit
        editingItem = $state.snapshot(item);
    }

    async function saveEdit() {
        if (editingItem) {
            if (editingItem.id) {
                await manager.updateWidget(editingItem.id, editingItem);
            } else {
                // It's a system widget being saved as custom -> Create new
                await manager.createWidget(editingItem);
            }
            editingItem = null;
        }
    }
</script>

<div class="flex flex-col h-full bg-white relative">
    <div
        class="p-4 border-b border-slate-100 flex items-center justify-between cursor-move"
        onmousedown={(e) => dashboard.startDrag(e, widget)}
        role="button"
        tabindex="0"
        aria-label="Drag Widget Manager"
    >
        <h3 class="font-bold text-slate-700 uppercase tracking-widest text-xs">
            Widget Library
        </h3>
        <div class="flex items-center gap-2">
            <input
                type="text"
                bind:value={manager.searchQuery}
                placeholder="Search..."
                class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 w-32 font-normal normal-case"
                onmousedown={(e) => e.stopPropagation()}
            />
            {#if !widget.locked}
                <button
                    onclick={() => dashboard.removeWidget(widget.id)}
                    class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    title="Remove component"
                    onmousedown={(e) => e.stopPropagation()}
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

    <div
        class="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start relative"
    >
        {#if editingItem}
            <div class="absolute inset-0 bg-white z-10 p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-slate-800">
                        {editingItem.id ? "Edit Widget" : "Clone & Edit Widget"}
                    </h4>
                    <button
                        onclick={() => (editingItem = null)}
                        class="text-slate-400 hover:text-slate-600"
                        aria-label="Close Editor"
                        title="Close Editor"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </button>
                </div>

                <div class="space-y-1">
                    <label
                        for="widget-edit-label"
                        class="text-[10px] font-bold text-slate-500 uppercase"
                        >Label</label
                    >
                    <input
                        id="widget-edit-label"
                        type="text"
                        bind:value={editingItem.label}
                        class="w-full text-xs p-2 border rounded"
                    />
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div class="space-y-1">
                        <label
                            for="widget-edit-icon"
                            class="text-[10px] font-bold text-slate-500 uppercase"
                            >Icon</label
                        >
                        <input
                            id="widget-edit-icon"
                            type="text"
                            bind:value={editingItem.icon}
                            class="w-full text-xs p-2 border rounded text-center"
                        />
                    </div>
                    <div class="space-y-1">
                        <span
                            class="block text-[10px] font-bold text-slate-500 uppercase mb-1"
                            >Size (Col x Row)</span
                        >
                        <div class="flex gap-1">
                            <input
                                aria-label="Widget Columns"
                                type="number"
                                bind:value={editingItem.defaultCols}
                                class="w-full text-xs p-2 border rounded text-center"
                                min="1"
                                max="22"
                            />
                            <input
                                aria-label="Widget Rows"
                                type="number"
                                bind:value={editingItem.defaultRows}
                                class="w-full text-xs p-2 border rounded text-center"
                                min="1"
                            />
                        </div>
                    </div>
                </div>

                <div class="space-y-1 flex-1 min-h-0 flex flex-col">
                    <label
                        for="widget-edit-desc"
                        class="text-[10px] font-bold text-slate-500 uppercase"
                        >Description</label
                    >
                    <textarea
                        id="widget-edit-desc"
                        bind:value={editingItem.description}
                        class="w-full h-16 text-xs p-2 border rounded resize-none"
                    ></textarea>
                </div>

                <div class="space-y-1 flex-1 min-h-0 flex flex-col">
                    <label
                        for="widget-edit-config"
                        class="text-[10px] font-bold text-slate-500 uppercase"
                        >Configuration (JSON)</label
                    >
                    <textarea
                        id="widget-edit-config"
                        value={JSON.stringify(editingItem.data || {}, null, 2)}
                        oninput={(e) => {
                            try {
                                if (editingItem)
                                    editingItem.data = JSON.parse(
                                        e.currentTarget.value,
                                    );
                            } catch (e) {
                                // Invalid JSON, ignore for now or show error state
                            }
                        }}
                        class="w-full flex-1 text-xs p-2 border rounded resize-none font-mono bg-slate-50"
                        placeholder="&lbrace;&rbrace;"
                    ></textarea>
                </div>

                <button
                    onclick={saveEdit}
                    class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs mt-2"
                >
                    {editingItem.id ? "Save Changes" : "Save as Custom Widget"}
                </button>
            </div>
        {:else if manager.isLoading}
            <div class="col-span-2 text-center py-4 text-xs text-slate-400">
                Loading...
            </div>
        {:else}
            {#each manager.filteredWidgets as item}
                <div
                    class="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 hover:scale-[1.02] transition-all group relative"
                >
                    <div class="flex items-start justify-between">
                        <div
                            class="text-xl bg-white w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                        >
                            {item.icon}
                        </div>
                        {#if item.isCustom}
                            <span
                                class="text-[8px] bg-amber-100 text-amber-700 px-1 rounded uppercase font-bold"
                                >Custom</span
                            >
                        {/if}
                    </div>

                    <div class="min-w-0">
                        <h4 class="font-bold text-slate-800 text-xs truncate">
                            {item.label}
                        </h4>
                        <p
                            class="text-[10px] text-slate-500 line-clamp-2 leading-relaxed"
                        >
                            {item.description}
                        </p>
                    </div>

                    <!-- Action Buttons -->
                    <div
                        class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <!-- Edit Button (Always visible) -->
                        <button
                            class="p-1 text-slate-400 hover:text-indigo-600 transition-colors bg-white/80 rounded shadow-sm"
                            onclick={(e) => {
                                e.stopPropagation();
                                startEdit(item);
                            }}
                            title={item.isCustom
                                ? "Edit Widget"
                                : "Clone & Edit Widget"}
                            aria-label="Edit Widget"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-3 w-3"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                                />
                            </svg>
                        </button>

                        <!-- Delete Button (Custom Only) -->
                        {#if item.isCustom && item.id}
                            <button
                                class="p-1 text-slate-400 hover:text-rose-600 transition-colors bg-white/80 rounded shadow-sm"
                                onclick={(e) => {
                                    e.stopPropagation();
                                    if (item.id && confirm("Delete widget?"))
                                        manager.deleteWidget(item.id);
                                }}
                                aria-label="Delete widget"
                                title="Delete widget"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>
