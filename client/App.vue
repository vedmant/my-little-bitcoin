<template>
  <div id="app">
    <spinner></spinner>
    <toast position="nw"></toast>
    <navbar></navbar>
    <div class="container">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue'
import Spinner from './components/Spinner.vue'
import Toast from './components/Toast.vue'

export default {
  components: {
    Navbar,
    Spinner,
    Toast,
  },
}
</script>
