<script>
  import { createEventDispatcher } from "svelte";
  import { fileToBase64 } from "../hook/storeData.js";

  const dispatch = createEventDispatcher();

  export let avatarUrl = "";

  let fileInput;
  let uploading = false;

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    uploading = true;

    try {
      const preview = await fileToBase64(file);
      dispatch("avatarSelect", { file, preview });
    } catch (error) {
      console.error("File read error:", error);
    } finally {
      uploading = false;
      fileInput.value = "";
    }
  }

  function triggerFileInput() {
    fileInput?.click();
  }
</script>

<div class="avatar-picker">
  <div class="avatar-frame">
    {#if avatarUrl}
      <img src={avatarUrl} alt="Avatar preview" class="avatar-image" />
    {:else}
      <div class="avatar-placeholder">
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            fill="currentColor"
          />
        </svg>
      </div>
    {/if}

    <button
      type="button"
      class="camera-btn"
      on:click={triggerFileInput}
      disabled={uploading}
      aria-label="Upload avatar"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path
          d="M12 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm0-10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm8 12v-4h4v4h4v4h-4v4h-4v-4h-4v-4h4z"
          fill="currentColor"
        />
      </svg>
    </button>
  </div>

  <input
    bind:this={fileInput}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    on:change={handleFileSelect}
    style="display: none"
    aria-hidden="true"
  />

  <p class="avatar-hint">Tap to upload a photo</p>
</div>

<style>
  .avatar-picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
  }

  .avatar-frame {
    position: relative;
    width: 120px;
    height: 120px;
    background: rgba(0, 0, 0, 0.04);
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .avatar-frame:focus-within {
    border-color: #0084ff;
    box-shadow: 0 0 0 4px rgba(0, 132, 255, 0.1);
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: rgba(0, 0, 0, 0.3);
  }

  .camera-btn {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #0084ff 0%, #0073e6 100%);
    color: #ffffff;
    border: 3px solid #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .camera-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .camera-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .avatar-hint {
    margin: 0;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    text-align: center;
  }

  @media (prefers-color-scheme: dark) {
    .avatar-frame {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.12);
    }

    .avatar-frame:focus-within {
      border-color: #0084ff;
      box-shadow: 0 0 0 4px rgba(0, 132, 255, 0.15);
    }

    .avatar-placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .camera-btn {
      border-color: #111111;
    }

    .avatar-hint {
      color: rgba(255, 255, 255, 0.6);
    }
  }
</style>
