<template>
  <div id="app" class="modern-app">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
/* Import CSS toàn cục */
@import '@/assets/main.css';

/* Modern App Background */
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
}

.modern-app {
  background: #F8F9FA;
  min-height: 100vh;
}

/* Override body */
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #F8F9FA;
}
</style>