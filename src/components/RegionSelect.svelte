<script>
  export let value = "+234";
  export let disabled = false;

  const regions = [
    { code: "+234", name: "Nigeria", flag: "🇳🇬" },
    { code: "+1", name: "USA", flag: "🇺🇸" },
    { code: "+44", name: "UK", flag: "🇬🇧" },
    { code: "+91", name: "India", flag: "🇮🇳" },
    { code: "+27", name: "South Africa", flag: "🇿🇦" },
    { code: "+233", name: "Ghana", flag: "🇬🇭" },
    { code: "+256", name: "Uganda", flag: "🇺🇬" },
    { code: "+254", name: "Kenya", flag: "🇰🇪" },
  ];

  $: selectedRegion = regions.find((r) => r.code === value) || regions[0];

  function handleChange(e) {
    value = e.currentTarget.value;
  }
</script>

<div class="region-select">
  <label for="region" class="label">Country</label>
  <div class="select-wrapper">
    <select
      id="region"
      {value}
      on:change={handleChange}
      {disabled}
      class="select-input"
      aria-label="Select country code"
    >
      {#each regions as region (region.code)}
        <option value={region.code}
          >{region.flag} {region.name} ({region.code})</option
        >
      {/each}
    </select>
    <div class="select-display">
      <span class="flag">{selectedRegion.flag}</span>
      <span class="name">{selectedRegion.name}</span>
      <span class="code">{selectedRegion.code}</span>
      <svg class="chevron" viewBox="0 0 24 24" width="20" height="20">
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
        />
      </svg>
    </div>
  </div>
</div>

<style>
  .region-select {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .label {
    font-size: 13px;
    font-weight: 600;
    color: #000000;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .select-input {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    z-index: 10;
  }

  .select-input:disabled {
    cursor: not-allowed;
  }

  .select-display {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    color: #000000;
    transition: all 0.2s ease;
    pointer-events: none;
  }

  .select-input:focus-visible + .select-display {
    border-color: #0084ff;
    background: #ffffff;
    box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.1);
  }

  .select-input:disabled + .select-display {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .flag {
    font-size: 18px;
    flex-shrink: 0;
  }

  .name {
    flex: 1;
  }

  .code {
    font-weight: 600;
    color: #0084ff;
    min-width: 50px;
  }

  .chevron {
    flex-shrink: 0;
    color: rgba(0, 0, 0, 0.4);
    transition: color 0.2s ease;
  }

  .select-input:focus-visible + .select-display .chevron {
    color: #0084ff;
  }

  @media (prefers-color-scheme: dark) {
    .label {
      color: rgba(255, 255, 255, 0.8);
    }

    .select-display {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    .select-input:focus-visible + .select-display {
      border-color: #0084ff;
      background: rgba(255, 255, 255, 0.04);
      box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.15);
    }

    .code {
      color: #32a0ff;
    }

    .chevron {
      color: rgba(255, 255, 255, 0.4);
    }

    .select-input:focus-visible + .select-display .chevron {
      color: #32a0ff;
    }
  }
</style>
