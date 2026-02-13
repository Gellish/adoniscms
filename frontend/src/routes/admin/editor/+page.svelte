<script lang="ts">
    import { page } from "$app/stores";
    import AdminEditor from "../../../pages/AdminEditor.svelte";

    // Get slug from URL query param ?slug=...
    let slug = $derived($page.url.searchParams.get("slug") || "");
</script>

<AdminEditor {slug} />
