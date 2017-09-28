<template>
  <div class="container page">
    <h3>Address: {{ $route.params.address }}</h3>
    <hr>

    <div class="row">
      <div class="col-sm-6">
        <h5>Summary</h5>
        <div class="table-responsive">
          <table class="table table-striped table-light">
            <tbody>
            <tr>
              <td>Address</td>
              <td>{{ this.$route.params.address }}</td>
            </tr>
            <tr>
              <td>Public Key</td>
              <td class="smaller">{{ publicKey }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="col-sm-6">
        <h5>Transactions</h5>
        <div class="table-responsive">
          <table class="table table-striped table-light">
            <tbody>
            <tr>
              <td>No. Transactions</td>
              <td>{{ address.totalTransactions }}</td>
            </tr>
            <tr>
              <td>Total Received</td>
              <td>{{ address.totalRecieved }}</td>
            </tr>
            <tr>
              <td>Final Balance</td>
              <td>{{ address.balance }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <h4 class="mt-5">Transactions</h4>
    <transactions :transactions="address.transactions"></transactions>

  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import moment from 'moment-mini'
import Transactions from './partials/Transactions.vue'
import bs58 from 'bs58'

export default {
  components: {
    Transactions,
  },

  mounted () {
    this.getAddress(this.$route.params.address)
  },

  watch: {
    '$route.params.address' (address) {
      this.getAddress(address)
    }
  },

  computed: {
    ...mapState({
      address: s => s.address,
    }),

    publicKey () {
      return bs58.decode(this.$route.params.address).toString('hex')
    },
  },

  methods: {
    ...mapActions(['getAddress']),

    moment () {
      return moment(...arguments)
    },
  },
}
</script>