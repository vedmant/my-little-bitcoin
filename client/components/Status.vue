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

    <h5>Lastest blocks</h5>
    <div class="table-responsive mb-5">
      <table class="table table-striped table-light">
        <tbody>
        <tr>
          <th>Height</th>
          <th>Age</th>
          <th>Transactions</th>
          <th>Total Sent</th>
          <th>Size</th>
        </tr>
        <tr v-for="block in chain">
          <td><router-link :to="'/block/' + block.index">{{ block.index }}</router-link></td>
          <td>{{ moment(block.time * 1000).from(time * 1000) }}</td>
          <td>{{ block.transactions.length }}</td>
          <td>{{ totalOutput(block) }}</td>
          <td>{{ Number(JSON.stringify(block).length / 1024).toFixed(2) }} kB</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="row">
      <div class="col-sm-6">

        <b-card no-body class="mb-5">
          <strong slot="header">Mempool</strong>
          <b-list-group flush>
            <b-list-group-item v-for="tx in mempool" :key="tx.id" :to="'/transaction/' + tx.id" class="list-group-item"
                               v-html="getTransactionMessage(tx)"></b-list-group-item>
            <b-list-group-item key="empty" v-if="! mempool.length">Mempool is empty</b-list-group-item>
          </b-list-group>
        </b-card>

      </div>
      <div class="col-sm-6">

        <b-card no-body class="mb-5">
          <strong slot="header">Wallets</strong>
          <b-list-group flush>
            <b-list-group-item :key="wallet.public" v-for="wallet in wallets">
              <router-link :to="'/address/' + wallet.public">{{ wallet.name }}: {{ wallet.public }}</router-link>
              <div>Balance: {{ wallet.balance }} MLB</div>
            </b-list-group-item>
          </b-list-group>
          <b-card-footer>
            <b-button size="sm" variant="warning" class="pull-right" @click="showSendForm = true">Send MLB</b-button>
          </b-card-footer>
        </b-card>

      </div>

      <send-form v-model="showSendForm"></send-form>

    </div>

  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import moment from 'moment-mini'
import SendForm from './partials/SendForm.vue'

export default {
  components: {
    SendForm,
  },

  data () {
    return {
      showSendForm: false,
    }
  },

  computed: {
    ...mapState({
      chain: s => s.chain.slice().reverse(),
      mempool: s => s.mempool,
      wallets: s => s.wallets,
      mining: s => s.mining,
      time: s => s.time,
    }),
  },

  methods: {
    ...mapActions(['getState', 'startMine', 'stopMine', 'sendFunds']),

    moment () {
      return moment(...arguments)
    },

    totalOutput (block) {
      return block.transactions.reduce((acc, tx) => acc + tx.outputs.reduce((acc, out) => acc + out.amount, 0), 0)
    },

    getTransactionMessage (transaction) {
      const from = transaction.inputs[0]
      let to = transaction.outputs.find(o => o.address !== from.address)
      if (! to) to = from
      const time = moment(transaction.time * 1000).format('YYYY-MM-DD h:mm:ss a')

      return `[${time}] Amount: ${to.amount}<br> from: ${from.address.substring(0, 20) + '...'} -> to: ${to.address.substring(0, 20) + '...'}`
    },
  },
}
</script>