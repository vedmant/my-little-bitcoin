<template>
  <div class="container page">
    <h3>Transaction: {{ transaction.transaction.id }}</h3>
    <hr>

    <transactions :transactions="[transaction.transaction]"></transactions>

    <div class="row mt-5">
      <div class="col-sm-6">
        <h5>Summary</h5>
        <div class="table-responsive">
          <table class="table table-striped table-light">
            <tbody>
            <tr>
              <td>Block</td>
              <td><router-link :to="'/block/' + transaction.block.index">{{ transaction.block.hash }}</router-link></td>
            </tr>
            <tr>
              <td>Size</td>
              <td>{{ JSON.stringify(transaction.transaction).length }} (bytes)</td>
            </tr>
            <tr>
              <td>Recieved Time</td>
              <td>{{ moment(transaction.transaction.time * 1000).format('YYYY-MM-DD h:mm:ss a') }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import moment from 'moment-mini'
import Transactions from './partials/Transactions.vue'

export default {
  components: {
    Transactions,
  },

  mounted () {
    this.getTransaction(this.$route.params.id)
  },

  watch: {
    '$route.params.id' (id) {
      this.getTransaction(id)
    }
  },

  computed: {
    ...mapState({
      transaction: s => s.transaction,
    }),
  },

  methods: {
    ...mapActions(['getTransaction']),

    moment () {
      return moment(...arguments)
    },
  },
}
</script>