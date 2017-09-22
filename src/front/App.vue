<template>
  <div id="app">
    <spinner></spinner>
    <navbar></navbar>
    <div class="container">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';
import Spinner from './components/Spinner.vue';

export default {
  components: {
    Navbar,
    Spinner,
  },
}
</script>
