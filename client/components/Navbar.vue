<template>
  <b-navbar toggleable="sm" type="dark" variant="info">
    <div class="container">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>

      <b-navbar-brand to="/">My Little Bitcoin</b-navbar-brand>

      <b-collapse id="nav_collapse" is-nav>
        <b-navbar-nav>
          <li class="github-menu-item nav-item">
            <a class="nav-link github-button" href="https://github.com/vedmant/my-little-bitcoin" data-size="large" data-show-count="true" aria-label="Star vedmant/my-little-bitcoin on GitHub">Star</a>
          </li>
        </b-navbar-nav>

        <b-navbar-nav class="ml-auto">
          <b-nav-item to="/" active-class="active" exact><a>Status</a></b-nav-item>
          <b-nav-item to="/wallets" active-class="active" exact><a>Wallets</a></b-nav-item>
          <!--<b-nav-item to="/charts" active-class="active" exact><a>Charts</a></b-nav-item>-->
        </b-navbar-nav>
      </b-collapse>
    </div>
  </b-navbar>
</template>

<script>
import {mapState} from 'vuex'

export default {

  data () {
    return {}
  },

  mounted () {
    this.loadGithubScript()
  },

  computed: {
    ...mapState({
      demoMode: s => s.demoMode,
    })
  },

  methods: {
    loadGithubScript () {
      const script = document.createElement('script')
      script.src = 'https://buttons.github.io/buttons.js'
      document.head.appendChild(script)
    },
  },
}
</script>
