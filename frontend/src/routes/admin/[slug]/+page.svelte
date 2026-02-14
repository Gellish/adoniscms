<script lang="ts">
    import { page } from "$app/state";
    import DashboardBuilder from "$lib/components/DashboardBuilder.svelte";
    let slug = $derived(page.params.slug);
</script>

<DashboardBuilder {slug} />
