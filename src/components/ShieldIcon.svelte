<div class="icon-wrapper">
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="shieldGlow" cx="50%" cy="30%">
        <stop offset="0%" stop-color="#60a5fa" />
        <stop offset="100%" stop-color="#3b82f6" />
      </radialGradient>
      <filter id="shieldShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="0"
          dy="4"
          stdDeviation="6"
          flood-opacity="0.4"
          flood-color="#3b82f6"
        />
      </filter>
    </defs>
    <g filter="url(#shieldShadow)">
      <path
        d="M32 8L48 16V32C48 44 40 54 32 56C24 54 16 44 16 32V16L32 8Z"
        fill="url(#shieldGlow)"
        stroke="#ffffff"
        stroke-width="1.5"
      />
      <path
        d="M28 32L31 35L37 27"
        stroke="#ffffff"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  </svg>
</div>

<style>
  .icon-wrapper {
    width: 56px;
    height: 56px;
    margin-bottom: 8px;
    animation: iconPulse 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes iconPulse {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>

<!-- Keep your existing ShieldIcon component as is -->
<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
</svg>

<style>
  :global(svg) {
    color: #0084ff;
  }
</style>
