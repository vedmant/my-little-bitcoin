<template>
  <div class="container page">
    <div class="row">
      <div class="col-sm-6">
        <h3>Status</h3>
      </div>
      <div class="col-sm-6 text-right">
          <div class="btn btn-success" v-if="mining" @click="stopMine">Mining</div>
          <div class="btn btn-danger" v-else @click="startMine">Not Mining</div>
      </div>
    </div>
    <hr>

    <b-card no-body class="mb-5">
      <strong slot="header">Last blocks</strong>
      <b-list-group v-if="chain.length" flush>
        <b-list-group-item v-for="block in chain" :key="block.index" :to="'/block/' + block.index" class="list-group-item">{{ block.index }}: [{{ moment(block.time * 1000).format('YYYY-MM-DD h:mm:ss a') }}] - {{ block.hash }} - {{ block.transactions.length }} transactions</b-list-group-item>
      </b-list-group>
      <b-card-body v-else>Loading</b-card-body>
    </b-card>

    <div class="row">
      <div class="col-sm-6">

        <b-card no-body class="mb-5">
          <strong slot="header">Mempool</strong>
          <b-list-group flush>
            <b-list-group-item v-for="tx in mempool" :key="tx.id" :to="'/transaction/' + tx.id" class="list-group-item" v-html="getTransactionMessage(tx)"></b-list-group-item>
            <b-list-group-item key="empty" v-if="! mempool.length">Mempool is empty</b-list-group-item>
          </b-list-group>
        </b-card>

      </div>
      <div class="col-sm-6">

        <b-card no-body class="mb-5">
          <strong slot="header">Wallets</strong>
          <b-list-group flush>
            <b-list-group-item :key="wallet.public" v-for="wallet in wallets">
              <b-button size="sm" variant="warning" class="pull-right" @click="onShowSendModal(wallet)">Send</b-button>
              <router-link :to="'/wallet/' + wallet.public">{{ wallet.name }}: {{ wallet.public }}</router-link>
              <div>Balance: {{ wallet.balance }}</div>
            </b-list-group-item>
          </b-list-group>
        </b-card>

      </div>

      <b-modal v-model="showSendModal" title="Send amount" ok-title="Send" @ok="onSendSubmit">
        <b-form>
          <b-form-group label="Address">
            <b-form-input type="text" v-model="send.to" required placeholder="Address"></b-form-input>
          </b-form-group>
        </b-form>
      </b-modal>
    </div>

  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import moment from 'moment-mini'

export default {
  components: {
  },

  data () {
    return {
      showSendModal: false,
      send: {
        from: null,
        to: null,
      }
    }
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

    onShowSendModal (wallet) {
      this.showSendModal = true
      this.send.from = wallet.public
    },

    onSendSubmit () {
      console.log('send')
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