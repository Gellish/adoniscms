<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { onMount, tick } from "svelte";

    interface Option {
        value: any;
        label: string;
    }

    interface Props {
        value: any;
        options: Option[];
        placeholder?: string;
        onchange?: (value: any) => void;
        class?: string;
    }

    let {
        value = $bindable(),
        options,
        placeholder = "Select...",
        onchange,
        class: className,
    }: Props = $props();

    let triggerButton = $state<HTMLButtonElement | null>(null);
    let isOpen = $state(false);
    let dropdownPos = $state({
        top: 0,
        left: 0,
        width: 0,
        placement: "bottom",
    });

    let selectedLabel = $derived(
        options.find((o) => o.value === value)?.label || placeholder,
    );

    async function toggleOpen(e: MouseEvent) {
        e.stopPropagation();
        if (!isOpen) {
            await calculatePosition();
        }
        isOpen = !isOpen;
    }

    async function calculatePosition() {
        if (!triggerButton) return;
        const rect = triggerButton.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = Math.min(options.length * 40 + 16, 300); // Rough estimate

        let placement = "bottom";
        let top = rect.bottom + 8;

        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
            placement = "top";
            top = rect.top - dropdownHeight - 8;
        }

        dropdownPos = {
            top,
            left: rect.left,
            width: rect.width,
            placement,
        };
    }

    function handleSelect(option: Option) {
        value = option.value;
        isOpen = false;
        if (onchange) onchange(value);
    }

    function onGlobalClick() {
        isOpen = false;
    }

    // Recalculate position on scroll/resize if open
    $effect(() => {
        if (isOpen) {
            const handleUpdate = () => calculatePosition();
            window.addEventListener("scroll", handleUpdate, true);
            window.addEventListener("resize", handleUpdate);
            return () => {
                window.removeEventListener("scroll", handleUpdate, true);
                window.removeEventListener("resize", handleUpdate);
            };
        }
    });
</script>

<div class="relative {className}">
    <button
        bind:this={triggerButton}
        type="button"
        onclick={toggleOpen}
        class="w-full flex items-center justify-between bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-white hover:border-indigo-300 transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
    >
        <span class="truncate">{selectedLabel}</span>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 text-slate-400 transform transition-transform {isOpen
                ? 'rotate-180'
                : ''}"
            viewBox="0 0 20 20"
            fill="currentColor"
        >
            <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
            />
        </svg>
    </button>

    {#if isOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 z-[10002]"
            onclick={onGlobalClick}
            transition:fade={{ duration: 100 }}
        ></div>

        <div
            class="fixed z-[10003] bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden py-2 {dropdownPos.placement ===
            'top'
                ? 'origin-bottom'
                : 'origin-top'}"
            style="top: {dropdownPos.top}px; left: {dropdownPos.left}px; width: {dropdownPos.width}px; max-height: 300px; overflow-y: auto;"
            transition:scale={{ duration: 200, start: 0.95 }}
        >
            {#each options as option}
                <button
                    type="button"
                    onclick={() => handleSelect(option)}
                    class="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-between {value ===
                    option.value
                        ? 'bg-indigo-50/50 text-indigo-600'
                        : ''}"
                >
                    {option.label}
                    {#if value === option.value}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-4 h-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    {/if}
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    button {
        user-select: none;
    }
    /* Simple custom scrollbar for the fixed dropdown */
    div::-webkit-scrollbar {
        width: 4px;
    }
    div::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
</style>
