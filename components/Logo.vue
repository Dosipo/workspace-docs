<template>
  <div class="site-logo">
    <span class="site-logo__icon" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 1L29 8.5V23.5L16 31L3 23.5V8.5L16 1Z"
          class="site-logo__hex"
          stroke-width="0"
        />
        <line x1="16" y1="6" x2="16" y2="17" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <line x1="16" y1="17" x2="8" y2="25" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <line x1="16" y1="17" x2="24" y2="25" stroke="white" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="site-logo__text">База знаний ИИ Ареал</span>
  </div>
</template>

<style scoped>
.site-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.site-logo__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.site-logo__hex {
  fill: var(--foreground);
}

.site-logo__text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--foreground);
  line-height: 1.2;
}
</style>
