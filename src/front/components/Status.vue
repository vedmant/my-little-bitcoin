<template>
  <div class="container">
    <div class="pull-right">
      <div class="btn btn-success" v-if="mining" @click="stopMine">Mining</div>
      <div class="btn btn-danger" v-else @click="startMine">Not Mining</div>
    </div>
    <h3>Status</h3>
    <hr>

    <div class="panel panel-default">
      <div class="panel-heading"><strong>Last blocks</strong></div>
      <div class="list-group" v-if="chain.length">
        <router-link v-for="block in chain" :key="block.index" :to="'/block/' + block.index" class="list-group-item">{{ block.index }}: [{{ moment(block.time * 1000).format('YYYY-MM-DD h:mm:ss a') }}] - {{ block.hash }} - {{ block.transactions.length }} transactions</router-link>
      </div>
      <div class="panel-body" v-else>Loading</div>
    </div>

    <div class="row">
      <div class="col-sm-6">

        <div class="panel panel-default">
          <div class="panel-heading"><strong>Mempool</strong></div>
          <div class="list-group">
            <router-link v-for="tx in mempool" :key="tx.id" :to="'/transaction/' + tx.id" class="list-group-item" v-html="getTransactionMessage(tx)"></router-link>
            <div class="list-group-item" v-if="! mempool.length">Mempool is empty</div>
          </div>
        </div>


      </div>
      <div class="col-sm-6">

        <div class="panel panel-default">
          <div class="panel-heading"><strong>Wallets</strong></div>
          <div class="list-group" v-if="wallets.length">
            <a v-for="wallet in wallets" href="#" class="list-group-item">{{ wallet.name }} ({{ wallet.public.substring(0, 20) + '...' }}) - balance: {{ wallet.balance }}</a>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import moment from 'moment-mini'

export default {
  components: {
  },

  mounted () {
    this.getState();
  },

  computed: {
    ...mapState({
      chain: s => s.chain.slice().reverse(),
      mempool: s => s.mempool,
      wallets: s => s.wallets,
      mining: s => s.mining,
    }),
  },

  methods: {
    ...mapActions(['getState', 'startMine', 'stopMine']),

    moment () {
      return moment(...arguments)
    },

    getTransactionMessage(transaction) {
      const from = transaction.inputs[0].address
      const to = transaction.outputs.find(o => o.address !== from)
      const time = moment(transaction.time * 1000).format('YYYY-MM-DD h:mm:ss a')

      return `[${time}] Amount: ${to.amount}<br> from: ${from.substring(0, 20) + '...'} -> to: ${to.address.substring(0, 20) + '...'}`
    }
  }
}
</script>