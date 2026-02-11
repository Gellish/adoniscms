<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import EasyMDE from "easymde";
    import "easymde/dist/easymde.min.css";
    import { adminState } from "../lib/adminState.svelte";

    // props derived from currentPath/query in App.svelte or via router
    interface Props {
        slug?: string;
    }

    let { slug = "" }: Props = $props();

    let title = $state("");
    let postSlug = $state("");
    let description = $state("");
    let tags = $state("");
    let content = $state("");
    let loading = $state(false);
    let saving = $state(false);
    let error = $state("");

    let editor: EasyMDE | null = $state(null);
    let editorElement: HTMLTextAreaElement | undefined = $state();

    onMount(async () => {
        editor = new EasyMDE({
            element: editorElement!,
            initialValue: content,
            spellChecker: false,
            autosave: {
                enabled: true,
                uniqueId: "admin-post-editor",
            },
        });

        editor.codemirror.on("change", () => {
            content = editor!.value();
        });

        if (slug) {
            loadPost();
        }
    });

    onDestroy(() => {
        if (editor) {
            editor.toTextArea();
            editor = null;
        }
    });

    async function loadPost() {
        // 1. Instant Cache Hydration
        const localPost = adminState.getPostBySlugLocal(slug);
        if (localPost) {
            title = localPost.title;
            postSlug = localPost.slug;
            description = localPost.description || "";
            tags = Array.isArray(localPost.tags)
                ? localPost.tags.join(", ")
                : localPost.tags;
            content = localPost.content;
            if (editor) editor.value(content);
            // We have data! No need to show "Loading..."
            loading = false;
        } else {
            loading = true;
        }

        try {
            const res = await fetch(`http://localhost:3333/api/posts/${slug}`);
            if (!res.ok) {
                if (!localPost) throw new Error("Post not found");
                return; // Silently fail if we have local data but server is down
            }
            const post = await res.json();

            title = post.title;
            postSlug = post.slug;
            description = post.description || "";
            tags = Array.isArray(post.tags) ? post.tags.join(", ") : post.tags;
            content = post.content;

            if (editor) editor.value(content);
        } catch (e: any) {
            if (!localPost) error = e.message;
        } finally {
            loading = false;
        }
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
                    title,
                    slug: postSlug || undefined,
                    content,
                    description,
                    tags: tags
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
        <p>Loading post data...</p>
    {:else}
        <div class="form">
            <div class="field">
                <label for="title">Title</label>
                <input
                    id="title"
                    bind:value={title}
                    placeholder="Enter post title..."
                />
            </div>

            <div class="field">
                <label for="slug">Slug</label>
                <input
                    id="slug"
                    bind:value={postSlug}
                    placeholder="post-url-slug"
                    disabled={!!slug}
                />
            </div>

            <div class="field">
                <label for="tags">Tags (comma separated)</label>
                <input
                    id="tags"
                    bind:value={tags}
                    placeholder="tech, svelte, adonis"
                />
            </div>

            <div class="field">
                <label for="desc">Description</label>
                <textarea id="desc" bind:value={description} rows="2"
                ></textarea>
            </div>

            <div class="field">
                <label for="content">Content</label>
                <textarea bind:this={editorElement}></textarea>
            </div>
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
    .form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .field label {
        font-weight: bold;
        color: #444;
    }
    input,
    textarea {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }
    .error {
        color: red;
        margin-top: 1rem;
    }
</style>
