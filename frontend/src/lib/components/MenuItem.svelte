<script lang="ts">
    import type { MenuItem as MenuItemType } from "$lib/types";
    import { createEventDispatcher } from "svelte";
    import MenuItem from "$ui/MenuItem.svelte";

    let {
        item = $bindable(),
        depth = 0,
        onAddChild,
        onDelete,
        onMoveUp,
        onMoveDown,
        onNest,
        onUnnest,
    } = $props<{
        item: MenuItemType;
        depth?: number;
        onAddChild: (id: string) => void;
        onDelete: (id: string) => void;
        onMoveUp: (id: string) => void;
        onMoveDown: (id: string) => void;
        onNest: (id: string) => void;
        onUnnest: (id: string) => void;
    }>();

    let isEditing = $state(false);

    function toggleOpen() {
        item.isOpen = !item.isOpen;
    }
</script>

<div
    class="flex flex-col border-l-2 border-slate-200 ml-4 my-1 pl-4 transition-all hover:border-indigo-400"
>
    <div
        class="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm border border-slate-100 group"
    >
        <!-- Toggle Expand -->
        {#if item.children && item.children.length > 0}
            <button
                onclick={toggleOpen}
                class="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
            >
                <span
                    class="transform transition-transform duration-200"
                    class:rotate-90={item.isOpen}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </span>
            </button>
        {:else}
            <div class="w-6"></div>
        {/if}

        <!-- Label & URL -->
        <div class="flex flex-1 gap-4 items-center">
            {#if isEditing}
                <input
                    type="text"
                    bind:value={item.label}
                    class="flex-1 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Label"
                />
                <input
                    type="text"
                    bind:value={item.url}
                    class="flex-1 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="URL"
                />
                <button
                    onclick={() => (isEditing = false)}
                    class="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Done
                </button>
            {:else}
                <div class="flex-1">
                    <span class="font-medium text-slate-700"
                        >{item.label || "Untitled"}</span
                    >
                    <span class="ml-2 text-xs text-slate-400 font-mono"
                        >{item.url || "/"}</span
                    >
                </div>
                <button
                    onclick={() => (isEditing = true)}
                    class="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                >
                    Edit
                </button>
            {/if}
        </div>

        <!-- Actions -->
        <div
            class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
        >
            <button
                onclick={() => onMoveUp(item.id)}
                title="Move Up"
                class="p-1 hover:bg-slate-100 rounded text-slate-500"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
            <button
                onclick={() => onMoveDown(item.id)}
                title="Move Down"
                class="p-1 hover:bg-slate-100 rounded text-slate-500"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
            <button
                onclick={() => onNest(item.id)}
                title="Nest"
                class="p-1 hover:bg-slate-100 rounded text-slate-500"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
            <button
                onclick={() => onUnnest(item.id)}
                title="Unnest"
                class="p-1 hover:bg-slate-100 rounded text-slate-500"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
            <div class="w-px h-4 bg-slate-200 mx-1"></div>
            <button
                onclick={() => onAddChild(item.id)}
                title="Add Sub-item"
                class="p-1 hover:bg-indigo-50 rounded text-indigo-600"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
            <button
                onclick={() => onDelete(item.id)}
                title="Delete"
                class="p-1 hover:bg-red-50 rounded text-red-500"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
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

    <!-- Children -->
    {#if item.isOpen && item.children}
        <div class="flex flex-col">
            {#each item.children as _, i (item.children[i].id)}
                <MenuItem
                    bind:item={item.children[i]}
                    depth={depth + 1}
                    {onAddChild}
                    {onDelete}
                    {onMoveUp}
                    {onMoveDown}
                    {onNest}
                    {onUnnest}
                />
            {/each}
        </div>
    {/if}
</div>
