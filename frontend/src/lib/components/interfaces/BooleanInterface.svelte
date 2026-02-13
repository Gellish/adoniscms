<script lang="ts">
    interface Props {
        value: boolean;
        onchange: (value: boolean) => void;
    }

    let { value, onchange }: Props = $props();

    function toggle() {
        onchange(!value);
    }
</script>

<button
    type="button"
    onclick={toggle}
    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 {value
        ? 'bg-indigo-600'
        : 'bg-slate-200'}"
>
    <span
        aria-hidden="true"
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {value
            ? 'translate-x-5'
            : 'translate-x-0'}"
    ></span>
</button>
