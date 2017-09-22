<template>
  <div class="container">
    <h3>Status</h3>
    <hr>

    <div class="panel panel-default">
      <div class="panel-heading"><strong>Last blocks</strong></div>
      <div class="list-group" v-if="chain.length">
        <router-link v-for="block in chain" :key="block.index" :to="'/block/' + block.index" class="list-group-item">{{ block.index }}: {{ block.hash }} - {{ block.transactions.length }} transactions</router-link>
      </div>
      <div class="panel-body" v-else>Loading</div>
    </div>

    <div class="row">
      <div class="col-sm-6">

        <div class="panel panel-default">
          <div class="panel-heading"><strong>Mempool</strong></div>
          <div class="list-group" v-if="mempool.length">
            <router-link v-for="tx in mempool" :key="tx.id" :to="'/transaction/' + tx.id" class="list-group-item">{{ getTransactionMessage(tx) }}</router-link>
          </div>
          <div class="panel-body" v-else>Mempool is empty</div>
        </div>


      </div>
      <div class="col-sm-6">

        <div class="panel panel-default">
          <div class="panel-heading"><strong>Wallets</strong></div>
          <div class="list-group" v-if="wallets.length">
            <a v-for="wallet in wallets" href="#" class="list-group-item">{{ wallet.name }} - balance: {{ wallet.balance }}</a>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'

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
    }),
  },

  methods: {
    ...mapActions(['getState']),

    getTransactionMessage(transaction) {
      const from = transaction.inputs[0].address
      const to = transaction.outputs.find(o => o.address !== from)

      return `${from.substring(0, 20) + '...'} -> amount: ${to.amount} -> ${to.address.substring(0, 20) + '...'}`
    }
  }
}
</script>