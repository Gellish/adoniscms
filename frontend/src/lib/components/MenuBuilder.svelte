<script lang="ts">
    import type { Menu, MenuItem as MenuItemType } from "$lib/types";
    import MenuItem from "$interfaces/MenuItem.svelte";

    let { menu = $bindable() } = $props<{ menu: Menu }>();

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function createNewItem(label = "New Item", url = ""): MenuItemType {
        const slug = label
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, "");
        return {
            id: generateId(),
            label,
            url: url || `/admin/${slug}`,
            children: [],
            isOpen: true,
        };
    }

    function addItem() {
        menu.items = [...menu.items, createNewItem()];
    }

    function findAndAction(
        items: MenuItemType[],
        id: string,
        action: (items: MenuItemType[], index: number) => void,
    ): boolean {
        for (let i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                action(items, i);
                return true;
            }
            if (
                items[i].children &&
                findAndAction(items[i].children!, id, action)
            ) {
                return true;
            }
        }
        return false;
    }

    function onAddChild(id: string) {
        findAndAction(menu.items, id, (items, index) => {
            const item = items[index];
            if (!item.children) item.children = [];
            item.children = [...item.children, createNewItem("New Sub-item")];
            item.isOpen = true;
        });
        menu.items = [...menu.items];
    }

    function onDelete(id: string) {
        if (confirm("Are you sure you want to delete this item?")) {
            findAndAction(menu.items, id, (items, index) => {
                items.splice(index, 1);
            });
            menu.items = [...menu.items];
        }
    }

    function onMoveUp(id: string) {
        findAndAction(menu.items, id, (items, index) => {
            if (index > 0) {
                const temp = items[index];
                items[index] = items[index - 1];
                items[index - 1] = temp;
            }
        });
        menu.items = [...menu.items];
    }

    function onMoveDown(id: string) {
        findAndAction(menu.items, id, (items, index) => {
            if (index < items.length - 1) {
                const temp = items[index];
                items[index] = items[index + 1];
                items[index + 1] = temp;
            }
        });
        menu.items = [...menu.items];
    }

    function onNest(id: string) {
        findAndAction(menu.items, id, (items, index) => {
            if (index > 0) {
                const target = items[index - 1];
                if (!target.children) target.children = [];
                target.children = [...target.children, items[index]];
                target.isOpen = true;
                items.splice(index, 1);
            }
        });
        menu.items = [...menu.items];
    }

    function onUnnest(id: string) {
        // Implementation for unnesting is slightly more complex as it needs parent context
        // For simplicity in this demo, we'll traverse and find the parent
        function findParent(
            items: MenuItemType[],
            targetId: string,
        ): {
            parentItems: MenuItemType[];
            itemIndex: number;
            parentItem?: MenuItemType;
        } | null {
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === targetId) return null; // Root item can't be unnested
                if (items[i].children) {
                    for (let j = 0; j < items[i].children!.length; j++) {
                        if (items[i].children![j].id === targetId) {
                            return {
                                parentItems: items[i].children!,
                                itemIndex: j,
                                parentItem: items[i],
                            };
                        }
                    }
                    const result = findParent(items[i].children!, targetId);
                    if (result) return result;
                }
            }
            return null;
        }

        const result = findParent(menu.items, id);
        if (result) {
            const { parentItems, itemIndex, parentItem } = result;
            const itemToMove = parentItems[itemIndex];

            // We need to find the parent of parentItem to insert it after parentItem
            function findParentOf(
                items: MenuItemType[],
                target: MenuItemType,
            ): MenuItemType[] | null {
                for (let i = 0; i < items.length; i++) {
                    if (items[i] === target) return items; // Should not happen for root items but handled by findParent result
                    if (items[i].children) {
                        if (items[i].children!.includes(target))
                            return items[i].children!;
                        const res = findParentOf(items[i].children!, target);
                        if (res) return res;
                    }
                }
                return null;
            }

            const grandparentItems = parentItem
                ? findParentOf(menu.items, parentItem)
                : menu.items;
            if (grandparentItems) {
                const parentIdx = grandparentItems.indexOf(parentItem!);
                grandparentItems.splice(parentIdx + 1, 0, itemToMove);
                parentItems.splice(itemIndex, 1);
            } else {
                // Parent is root, move to root items
                const parentIdx = menu.items.indexOf(parentItem!);
                menu.items.splice(parentIdx + 1, 0, itemToMove);
                parentItems.splice(itemIndex, 1);
            }
            menu.items = [...menu.items];
        }
    }
</script>

<div
    class="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner min-h-[400px]"
>
    <div class="flex flex-col gap-2">
        {#each menu.items as _, i (menu.items[i].id)}
            <MenuItem
                bind:item={menu.items[i]}
                {onAddChild}
                {onDelete}
                {onMoveUp}
                {onMoveDown}
                {onNest}
                {onUnnest}
            />
        {:else}
            <div
                class="flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-12 h-12 mb-2 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 6h16M4 12h16m-7 6h7"
                    />
                </svg>
                <p>No menu items yet.</p>
                <button
                    onclick={addItem}
                    class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
                >
                    Add First Item
                </button>
            </div>
        {/each}

        {#if menu.items.length > 0}
            <button
                onclick={addItem}
                class="mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-sm font-medium"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clip-rule="evenodd"
                    />
                </svg>
                Add Root Item
            </button>
        {/if}
    </div>
</div>
