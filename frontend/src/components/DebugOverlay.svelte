<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";

    let logs: {
        timestamp: string;
        msg: string;
        type: "info" | "error" | "warn";
    }[] = $state([]);
    let visible = $state(false);
    let enabled = $state(false);

    const MAX_LOGS = 50;

    export function log(msg: string, type: "info" | "error" | "warn" = "info") {
        if (!enabled) return;
        const timestamp = new Date().toLocaleTimeString();
        logs = [{ timestamp, msg, type }, ...logs].slice(0, MAX_LOGS);
        // Safely access console
        if (typeof console !== "undefined") {
            console[type === "error" ? "error" : "log"](`[SPA Debug] ${msg}`);
        }
    }

    function toggle() {
        if (!browser) return; // Guard against SSR
        enabled = !enabled;
        localStorage.setItem("spa_debug_enabled", String(enabled));
        visible = enabled;
    }

    function clear() {
        logs = [];
    }

    function resetApp() {
        if (!browser) return;
        localStorage.clear();
        location.reload();
    }

    onMount(() => {
        // Initialize state from localStorage
        if (localStorage.getItem("spa_debug_enabled") === "true") {
            enabled = true;
            visible = true;
        }

        // Expose global logger for legacy compatibility or other components
        (window as any).spaLog = log;

        // Listen for custom events if any legacy code fires them
        window.addEventListener("spa-log", (e: any) =>
            log(e.detail.msg, e.detail.type),
        );
    });
</script>

{#if visible}
    <div class="debug-overlay">
        <div class="controls">
            <span>SPA DEBUG</span>
            <div>
                <button onclick={clear}>Clear</button>
                <button onclick={() => (visible = false)}>Hide</button>
                <button onclick={resetApp} class="danger">Reset App</button>
            </div>
        </div>
        <div class="logs">
            {#each logs as log}
                <div class={log.type}>
                    <span class="time">{log.timestamp}</span>
                    <span class="msg">{log.msg}</span>
                </div>
            {/each}
        </div>
    </div>
{/if}

<!-- Hidden toggle trigger (e.g. valid for dev builds) -->
<button class="debug-trigger" onclick={toggle} title="Toggle Debug Overlay"
    >🐞</button
>

<style>
    .debug-overlay {
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 350px;
        max-height: 300px;
        background: rgba(0, 0, 0, 0.9);
        color: #0f0;
        font-family: monospace;
        font-size: 10px;
        padding: 10px;
        z-index: 99999;
        overflow-y: auto;
        border-radius: 5px;
        border: 1px solid #333;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    }
    .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
        border-bottom: 1px solid #444;
        padding-bottom: 5px;
    }
    .controls span {
        font-weight: bold;
        color: #aaa;
    }
    button {
        background: #444;
        color: #fff;
        border: none;
        padding: 2px 5px;
        font-size: 9px;
        cursor: pointer;
        border-radius: 3px;
        margin-left: 5px;
    }
    button.danger {
        background: #500;
    }
    .logs {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .time {
        color: #666;
        margin-right: 5px;
    }
    .error {
        color: #f55;
    }
    .warn {
        color: #fa0;
    }
    .info {
        color: #0f0;
    }

    .debug-trigger {
        position: fixed;
        bottom: 0px;
        right: 0px;
        opacity: 0.2;
        background: none;
        border: none;
        font-size: 14px;
        cursor: pointer;
        z-index: 100000;
    }
    .debug-trigger:hover {
        opacity: 1;
    }
</style>
