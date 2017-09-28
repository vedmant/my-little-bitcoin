<template>
  <div id="app">
    <spinner></spinner>
    <toast position="nw"></toast>
    <navbar></navbar>
    <router-view></router-view>
  </div>
</template>

<script>
import {mapActions} from 'vuex'

import Navbar from './components/Navbar.vue'
import Spinner from './components/Spinner.vue'
import Toast from './components/Toast.vue'

export default {
  components: {
    Navbar,
    Spinner,
    Toast,
  },

  mounted () {
    this.getStatus()
  },

  methods: {
    ...mapActions(['getStatus'])
  },
}
</script>
