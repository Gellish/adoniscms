<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import EasyMDE from "easymde";
    import "easymde/dist/easymde.min.css";

    interface Props {
        value: string;
        onchange: (value: string) => void;
    }

    let { value, onchange }: Props = $props();

    let editor: EasyMDE | null = $state(null);
    let editorElement: HTMLTextAreaElement | undefined = $state();

    onMount(() => {
        editor = new EasyMDE({
            element: editorElement!,
            initialValue: value,
            spellChecker: false,
            autosave: {
                enabled: false,
                uniqueId: "universal-field-editor",
            },
        });

        editor.codemirror.on("change", () => {
            onchange(editor!.value());
        });
    });

    onDestroy(() => {
        if (editor) {
            editor.toTextArea();
            editor = null;
        }
    });

    $effect(() => {
        if (editor && value !== editor.value()) {
            editor.value(value || "");
        }
    });
</script>

<div class="rich-text-interface">
    <textarea bind:this={editorElement}></textarea>
</div>

<style>
    .rich-text-interface :global(.EasyMDEContainer .CodeMirror) {
        border-radius: 0 0 8px 8px;
    }
    .rich-text-interface :global(.editor-toolbar) {
        border-radius: 8px 8px 0 0;
        border-color: #e2e8f0;
    }
</style>
