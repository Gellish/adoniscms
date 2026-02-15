export type WidgetType =
    | "stats"
    | "list"
    | "chart"
    | "activity"
    | "table"
    | "title"
    | "profile"
    | "header";

export interface Widget {
    id: string;
    type: WidgetType;
    title: string;
    data?: any;
    cols: number; // 1-12
    rows: number; // 1-12
    x: number; // 0-11
    y: number; // 0+
    locked?: boolean;
}

export const BASE_WIDGETS: {
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
            defaultCols: 6,
            defaultRows: 3,
        },
        {
            type: "list",
            label: "Data List",
            icon: "📝",
            description: "Show a list of recent records.",
            defaultCols: 8,
            defaultRows: 6,
        },
        {
            type: "chart",
            label: "Growth Chart",
            icon: "📈",
            description: "Visualize data trends over time.",
            defaultCols: 11,
            defaultRows: 4,
        },
        {
            type: "activity",
            label: "Activity Feed",
            icon: "⚡",
            description: "Live feed of system activities.",
            defaultCols: 8,
            defaultRows: 4,
        },
        {
            type: "table",
            label: "Data Table",
            icon: "🗃️",
            description: "Display a table of records (default: Posts).",
            defaultCols: 22,
            defaultRows: 12,
            data: { tableName: "posts" },
        },
        {
            type: "title",
            label: "Dashboard Title",
            icon: "🏷️",
            description: "A draggable title for your dashboard section.",
            defaultCols: 22,
            defaultRows: 1,
        },
        {
            type: "profile",
            label: "User Profile",
            icon: "👤",
            description: "Display current user and logout button.",
            defaultCols: 6,
            defaultRows: 1,
        },
        {
            type: "header",
            label: "Slim Header",
            icon: "👤",
            description: "A minimalist header with email and logout button.",
            defaultCols: 22,
            defaultRows: 1,
        },
    ];
