<script lang="ts">
    import { onMount } from "svelte";
    import { DashboardState } from "$lib/dashboardState.svelte";
    import { adminState } from "$lib/adminState.svelte";
    import DashboardGrid from "$lib/components/dashboard/DashboardGrid.svelte";
    import DashboardPalette from "$lib/components/dashboard/DashboardPalette.svelte";
    import DashboardContextMenu from "$lib/components/dashboard/DashboardContextMenu.svelte";

    let { slug = "default" } = $props<{ slug?: string }>();

    // Initialize state properly
    let state = $state(new DashboardState(slug));

    $effect(() => {
        // If the slug changed, update the state instance
        if (state.slug !== slug) {
            state = new DashboardState(slug);
        }

        // Load dashboard config
        state.load();

        // Ensure shared admin state (like tables) is loaded
        if (adminState.tables.length === 0) {
            adminState.loadAllLocal();
        }
    });
</script>

<DashboardGrid {state} />
<DashboardPalette {state} />
<DashboardContextMenu {state} />
