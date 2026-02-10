<script>
  export let date = "";
</script>

<div class="date-separator">
  <span class="date-pill">{date}</span>
</div>

<style>
  .date-separator {
    display: flex;
    justify-content: center;
    margin: 16px 0 12px;
  }

  .date-pill {
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
  }

  @media (prefers-color-scheme: light) {
    .date-pill {
      background: rgba(0, 0, 0, 0.05);
      border-color: rgba(0, 0, 0, 0.08);
      color: rgba(0, 0, 0, 0.5);
    }
  }
</style>
