<script lang="ts">
    import { onMount } from "svelte";
    import { adminState } from "../lib/adminState.svelte";
    import DynamicForm from "../lib/components/DynamicForm.svelte";
    import type { FieldSchema, Post } from "../lib/types";

    interface Props {
        slug?: string;
    }

    let { slug = "" }: Props = $props();

    let formData = $state({
        title: "",
        slug: "",
        description: "",
        tags: "",
        content: "",
    });

    let loading = $state(false);
    let saving = $state(false);
    let error = $state("");
    let slugTouched = $state(false);

    const schema: FieldSchema[] = [
        {
            field: "title",
            label: "Title",
            type: "input",
            placeholder: "Enter post title...",
        },
        {
            field: "slug",
            label: "Slug",
            type: "input",
            placeholder: "post-url-slug",
        },
        {
            field: "tags",
            label: "Tags",
            type: "input",
            placeholder: "tech, svelte, adonis",
        },
        {
            field: "description",
            label: "Description",
            type: "textarea",
            placeholder: "Brief summary...",
        },
        { field: "content", label: "Rich Content", type: "richtext" },
    ];

    // Auto-generate slug from title
    $effect(() => {
        if (!slug && formData.title && !slugTouched) {
            formData.slug = formData.title
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "");
        }
    });

    // Detect manual slug edits to stop auto-generation
    $effect(() => {
        if (formData.slug) {
            // This is a simple way to detect if the user started typing in the slug field
            // Logic: if price doesn't match auto-gen, consider it touched
            const autoGen = formData.title
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "");

            if (formData.slug !== autoGen && formData.slug !== "") {
                slugTouched = true;
            }
        }
    });

    onMount(async () => {
        if (slug) {
            loadPost();
        }
    });

    async function loadPost() {
        const localPost = adminState.getPostBySlugLocal(slug);
        if (localPost) {
            hydrateForm(localPost);
            loading = false;
        } else {
            loading = true;
        }

        try {
            const res = await fetch(`http://localhost:3333/api/posts/${slug}`);
            if (!res.ok) {
                if (!localPost) throw new Error("Post not found");
                return;
            }
            const remotePost = await res.json();
            hydrateForm(remotePost);
        } catch (e: any) {
            if (!localPost) error = e.message;
        } finally {
            loading = false;
        }
    }

    function hydrateForm(data: Post) {
        formData = {
            title: data.title,
            slug: data.slug,
            description: data.description || "",
            tags: Array.isArray(data.tags)
                ? data.tags.join(", ")
                : data.tags || "",
            content: data.content,
        };
    }

    async function savePost() {
        try {
            saving = true;
            error = "";

            const method = slug ? "PUT" : "POST";
            const url = slug
                ? `http://localhost:3333/api/posts/${slug}`
                : `http://localhost:3333/api/posts`;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t),
                    publishedAt: new Date().toISOString(),
                }),
            });

            if (!res.ok) throw new Error("Failed to save post");

            alert("Post saved successfully!");
            if (!slug) {
                window.history.pushState({}, "", "/admin/posts");
                window.dispatchEvent(new PopStateEvent("popstate"));
            }
        } catch (e: any) {
            error = e.message;
        } finally {
            saving = false;
        }
    }
</script>

<div class="editor-page">
    <div class="header">
        <h1>{slug ? "Edit Post" : "New Post"}</h1>
        <div class="actions">
            <button onclick={() => window.history.back()} class="sec-btn"
                >Cancel</button
            >
            <button onclick={savePost} disabled={saving} class="pri-btn">
                {saving ? "Saving..." : "Save Post"}
            </button>
        </div>
    </div>

    {#if loading}
        <div class="flex items-center justify-center p-12">
            <p class="text-slate-500 animate-pulse text-lg">
                Loading post data...
            </p>
        </div>
    {:else}
        <div class="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
            <DynamicForm {schema} bind:data={formData} />
        </div>
    {/if}

    {#if error}
        <p class="error">{error}</p>
    {/if}
</div>

<style>
    .editor-page {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }
    .actions {
        display: flex;
        gap: 1rem;
    }
    .pri-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.6rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
    }
    .sec-btn {
        background: #f8f9fa;
        border: 1px solid #ddd;
        padding: 0.6rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
    }
    .error {
        color: red;
        margin-top: 1rem;
    }
</style>
