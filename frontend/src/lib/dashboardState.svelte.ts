import { ClientDB } from "$lib/client-db/core";
import { adminState } from "$lib/adminState.svelte";
import type { Widget, WidgetType, PaletteItem } from "$lib/components/dashboard/widgetConfig";
import { BASE_WIDGETS } from "$lib/components/dashboard/widgetConfig";
import { browser } from "$app/environment";
import { GAP, ROW_HEIGHT, GRID_COLS } from "$lib/dashboardConstants";

export class DashboardState {
    slug: string;
    widgets = $state<Widget[]>([]);
    isLoading = $state(true);
    showPalette = $state(false);
    searchQuery = $state("");

    // Grid State
    isResizing = $state(false);
    resizingWidget = $state<Widget | null>(null);
    resizeDir = $state("br");
    initialX = 0;
    initialY = 0;
    initialCols = 1;
    initialRows = 1;
    initialWidgetGridX = 0;
    initialWidgetGridY = 0;

    // Drag State
    isDragging = $state(false);
    draggingWidget = $state<Widget | null>(null);
    dragStartX = 0;
    dragStartY = 0;
    initialWidgetX = 0;
    initialWidgetY = 0;

    // Cached Metrics (Performance Optimization)
    cachedColWidth = 0;
    cachedContainerRect: DOMRect | null = null;

    // Context Menu
    contextMenu = $state({
        visible: false,
        x: 0,
        y: 0,
        widgetId: null as string | null,
    });

    container = $state<HTMLElement>();

    constructor(slug: string = "default") {
        this.slug = slug;
    }

    get availableWidgets() {
        const query = this.searchQuery.toLowerCase();

        // standard widgets
        const standard = BASE_WIDGETS.filter(
            (w) =>
                w.label.toLowerCase().includes(query) ||
                w.description.toLowerCase().includes(query)
        );

        // table widgets
        const tableWidgets = adminState.tables
            .filter((t) => t.name.toLowerCase().includes(query))
            .map((t) => ({
                type: "table" as WidgetType,
                label: `${t.name} Table`,
                icon: "🗃️",
                description: `Display data from ${t.name}`,
                defaultCols: 22,
                defaultRows: 4,
                data: { tableName: t.name },
            }));

        return [...standard, ...tableWidgets];
    }

    async load() {
        try {
            const db = await ClientDB.init();
            const config = await db.get("dashboards", this.slug);
            if (config && config.widgets) {
                this.widgets = config.widgets;
            }
        } catch (e) {
            console.error("Failed to load dashboard config", e);
        } finally {
            if (this.widgets.length === 0) {
                this.widgets.push({
                    id: "header-1",
                    type: "title",
                    title: this.slug.replace("-", " ").toUpperCase() + " DASHBOARD",
                    cols: 22,
                    rows: 1,
                    x: 0,
                    y: 0,
                });
            }
            this.isLoading = false;
        }
    }

    async save() {
        try {
            const db = await ClientDB.init();
            await db.put("dashboards", {
                id: this.slug,
                widgets: $state.snapshot(this.widgets),
                updatedAt: Date.now(),
            });
        } catch (e) {
            console.error("Failed to save dashboard config", e);
        }
    }

    addWidget(item: PaletteItem) {
        // Simple logic to find next Y position
        const maxY =
            this.widgets.length > 0
                ? Math.max(...this.widgets.map((w) => (w.y || 0) + (w.rows || 1)))
                : 0;

        const newWidget: Widget = {
            id: crypto.randomUUID(),
            type: item.type,
            title:
                item.type === "table"
                    ? item.label
                    : item.type === "title"
                        ? "New Title"
                        : `New ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`,
            cols: item.defaultCols,
            rows: item.defaultRows,
            x: 0,
            y: maxY,
            data: item.data,
            locked: false,
        };
        this.widgets.push(newWidget);
        this.showPalette = false;
        this.save();
    }

    removeWidget(id: string) {
        this.widgets = this.widgets.filter((w) => w.id !== id);
        this.save();
    }

    // --- Metrics Cache Helper ---
    updateMetrics() {
        if (!this.container) return;
        this.cachedContainerRect = this.container.getBoundingClientRect();
        const totalGap = GAP * (GRID_COLS - 1);
        this.cachedColWidth = (this.cachedContainerRect.width - totalGap) / GRID_COLS + GAP;
    }

    // --- Resizing Logic ---
    startResize(e: MouseEvent, widget: Widget, dir: string = "br") {
        if (widget.locked) return;
        e.preventDefault();
        e.stopPropagation();

        this.updateMetrics();

        this.isResizing = true;
        this.resizingWidget = widget;
        this.resizeDir = dir;
        this.initialX = e.clientX;
        this.initialY = e.clientY;
        this.initialCols = widget.cols || 1;
        this.initialRows = widget.rows || 1;
        this.initialWidgetGridX = widget.x || 0;
        this.initialWidgetGridY = widget.y || 0;

        window.addEventListener("mousemove", this.handleResize);
        window.addEventListener("mouseup", this.stopResize);
    }

    handleResize = (e: MouseEvent) => {
        if (!this.isResizing || !this.resizingWidget || !this.container) return;

        const deltaX = e.clientX - this.initialX;
        const deltaY = e.clientY - this.initialY;

        const colWidth = this.cachedColWidth || 1; // fallback
        const rowHeight = ROW_HEIGHT + GAP;

        let newCols = this.initialCols;
        let newRows = this.initialRows;
        let newX = this.initialWidgetGridX;
        let newY = this.initialWidgetGridY;

        // X-axis resize
        if (this.resizeDir.includes("r")) {
            newCols = Math.max(2, Math.round(this.initialCols + deltaX / colWidth));
        } else if (this.resizeDir.includes("l")) {
            const potentialNewX = Math.round(
                this.initialWidgetGridX + deltaX / colWidth
            );
            const colsDiff = this.initialWidgetGridX - potentialNewX;
            newCols = Math.max(2, this.initialCols + colsDiff);
            newX = this.initialWidgetGridX + (this.initialCols - newCols);
        }

        // Y-axis resize
        if (this.resizeDir.includes("b")) {
            newRows = Math.max(1, Math.round(this.initialRows + deltaY / rowHeight));
        } else if (this.resizeDir.includes("t")) {
            const potentialNewY = Math.round(
                this.initialWidgetGridY + deltaY / rowHeight
            );
            const rowsDiff = this.initialWidgetGridY - potentialNewY;
            newRows = Math.max(1, this.initialRows + rowsDiff);
            newY = this.initialWidgetGridY + (this.initialRows - newRows);
        }

        // Final Constraints
        newCols = Math.max(2, Math.min(GRID_COLS - newX, newCols));
        newX = Math.max(0, Math.min(GRID_COLS - 1, newX));
        newY = Math.max(0, newY);

        if (
            newCols !== this.resizingWidget.cols ||
            newRows !== this.resizingWidget.rows ||
            newX !== this.resizingWidget.x ||
            newY !== this.resizingWidget.y
        ) {
            this.resizingWidget.cols = newCols;
            this.resizingWidget.rows = newRows;
            this.resizingWidget.x = newX;
            this.resizingWidget.y = newY;
        }
    };

    stopResize = () => {
        this.isResizing = false;
        this.resizingWidget = null;
        window.removeEventListener("mousemove", this.handleResize);
        window.removeEventListener("mouseup", this.stopResize);
        this.save();
    };

    // --- Dragging Logic ---
    startDrag(e: MouseEvent, widget: Widget) {
        if (widget.locked) return;
        if (
            e.target instanceof HTMLButtonElement ||
            (e.target as HTMLElement).closest("button") ||
            (e.target as HTMLElement).closest("input")
        )
            return;

        e.preventDefault();

        this.updateMetrics();

        this.isDragging = true;
        this.draggingWidget = widget;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.initialWidgetX = widget.x || 0;
        this.initialWidgetY = widget.y || 0;

        window.addEventListener("mousemove", this.handleDrag);
        window.addEventListener("mouseup", this.stopDrag);
        document.body.style.cursor = "grabbing";
    }

    handleDrag = (e: MouseEvent) => {
        if (!this.isDragging || !this.draggingWidget || !this.container) return;

        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;

        const colWidth = this.cachedColWidth || 1;
        const rowHeight = ROW_HEIGHT + GAP;

        const newX = Math.max(
            0,
            Math.min(
                GRID_COLS - (this.draggingWidget.cols || 1), // Max X position for the widget
                Math.round(this.initialWidgetX + deltaX / colWidth)
            )
        );
        const newY = Math.max(
            0,
            Math.round(this.initialWidgetY + deltaY / rowHeight)
        );

        if (newX !== this.draggingWidget.x || newY !== this.draggingWidget.y) {
            this.draggingWidget.x = newX;
            this.draggingWidget.y = newY;

            // Auto-Shifting Logic: Push other widgets down
            this.pushWidgets(this.draggingWidget);
        }

        // Auto-scroll logic
        const scrollThreshold = 100;
        const scrollSpeed = 15;
        if (e.clientY < scrollThreshold) {
            window.scrollBy(0, -scrollSpeed);
        } else if (window.innerHeight - e.clientY < scrollThreshold) {
            window.scrollBy(0, scrollSpeed);
        }
    };

    pushWidgets(movedWidget: Widget) {
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
            for (const other of this.widgets) {
                if (other.id === movedWidget.id) continue;
                if (isOverlapping(movedWidget, other)) {
                    other.y = movedWidget.y + movedWidget.rows;
                    changed = true;
                }
            }

            // 2. Cascade pushes (Top and Bottom)
            const sortedWidgets = [...this.widgets].sort((a, b) => a.y - b.y);
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

    stopDrag = () => {
        this.isDragging = false;
        this.draggingWidget = null;
        window.removeEventListener("mousemove", this.handleDrag);
        window.removeEventListener("mouseup", this.stopDrag);
        document.body.style.cursor = "";
        this.save();
    };

    // --- Context Menu ---
    handleContextMenu(e: MouseEvent, widgetId: string | null = null) {
        e.preventDefault();
        e.stopPropagation();
        this.contextMenu = {
            visible: true,
            x: e.clientX,
            y: e.clientY,
            widgetId,
        };
    }

    closeContextMenu() {
        this.contextMenu.visible = false;
    }
}
