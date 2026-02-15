import { ClientDB } from "$lib/client-db/core";
import { BASE_WIDGETS, type PaletteItem } from "$lib/components/dashboard/widgetConfig";

export class WidgetManagerState {
    widgets = $state<PaletteItem[]>([]);
    isLoading = $state(true);
    searchQuery = $state("");

    constructor() {
        this.loadWidgets();
    }

    async loadWidgets() {
        this.isLoading = true;
        try {
            // 1. Load Custom Widgets from DB
            const db = await ClientDB.init();
            const customWidgets = await db.getAll('custom_widgets');

            // 2. Combine with Base Widgets
            // Mark base widgets as "read-only" or "base" if needed
            const baseItems: PaletteItem[] = BASE_WIDGETS.map(w => ({ ...w, isCustom: false }));
            const customItems: PaletteItem[] = customWidgets.map((w: any) => ({ ...w, isCustom: true }));

            this.widgets = [...baseItems, ...customItems];
        } catch (e) {
            console.error("Failed to load widgets", e);
        } finally {
            this.isLoading = false;
        }
    }

    get filteredWidgets() {
        const query = this.searchQuery.toLowerCase();
        return this.widgets.filter(w =>
            w.label.toLowerCase().includes(query) ||
            (w.description && w.description.toLowerCase().includes(query))
        );
    }

    async createWidget(widget: PaletteItem) {
        try {
            const db = await ClientDB.init();
            const tx = db.transaction('custom_widgets', 'readwrite');
            const store = tx.objectStore('custom_widgets');
            // Ensure ID is generated
            const newId = crypto.randomUUID();
            const newWidget = { ...widget, id: newId, isCustom: true };
            await store.add(newWidget);
            await this.loadWidgets();
        } catch (e) {
            console.error("Failed to create widget", e);
        }
    }

    async updateWidget(id: string, updates: Partial<PaletteItem>) {
        try {
            const db = await ClientDB.init();
            const tx = db.transaction('custom_widgets', 'readwrite');
            const store = tx.objectStore('custom_widgets');
            const widget = await store.get(id);
            if (widget) {
                await store.put({ ...widget, ...updates });
                await this.loadWidgets();
            }
        } catch (e) {
            console.error("Failed to update widget", e);
        }
    }

    async deleteWidget(id: string) {
        // Only valid for custom widgets
        try {
            const db = await ClientDB.init();
            await db.delete('custom_widgets', id);
            await this.loadWidgets(); // Reload to refresh list
        } catch (e) {
            console.error("Failed to delete widget", e);
        }
    }
}
