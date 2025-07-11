<!-- playground/app.vue -->
<template>
  <div class="app">
    <header class="app-header">
      <h1>Newsletter Module Playground</h1>
      <nav>
        <NuxtLink to="/">Editor</NuxtLink>
        <NuxtLink to="/list">List</NuxtLink>
        <NuxtLink to="/settings">Settings</NuxtLink>
      </nav>
    </header>
    
    <main class="app-main">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #1a1a1a;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.app-header nav {
  display: flex;
  gap: 1rem;
}

.app-header a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.app-header a:hover {
  background: rgba(255, 255, 255, 0.1);
}

.app-header a.router-link-active {
  background: rgba(255, 255, 255, 0.2);
}

.app-main {
  flex: 1;
  background: #f5f5f5;
}
</style>