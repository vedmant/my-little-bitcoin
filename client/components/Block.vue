<template>
  <div class="container page">
    <h3>Block #{{ block.index }}</h3>
    <hr>

    <div class="row">
      <div class="col-sm-6">
        <h5>Summary</h5>
        <div class="table-responsive">
          <table class="table table-striped table-light">
            <tbody>
            <tr>
              <td>Number Of Transactions</td>
              <td>{{ block.transactions ? block.transactions.length : '' }}</td>
            </tr>
            <tr>
              <td>Output Total</td>
              <td>{{ totalOutput }}</td>
            </tr>
            <tr>
              <td>Height</td>
              <td>{{ block.index }}</td>
            </tr>
            <tr>
              <td>Timestamp</td>
              <td>{{ moment(block.time * 1000).format('YYYY-MM-DD h:mm:ss a') }}</td>
            </tr>
            <tr>
              <td>Block Reward</td>
              <td>{{ blockReward }}</td>
            </tr>
            <tr>
              <td>Nonce</td>
              <td>{{ block.nonce }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="col-sm-6">
        <h5>Hashes</h5>
        <div class="table-responsive">
          <table class="table table-striped table-light">
            <tbody>
            <tr>
              <td>Hash</td>
              <td class="smaller"><router-link :to="'/block/' + block.index">{{ block.hash }}</router-link></td>
            </tr>
            <tr>
              <td>Previous Block</td>
              <td class="smaller"><router-link :to="'/block/' + (block.index - 1)">{{ block.prevHash }}</router-link></td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <h4 class="mt-5">Transactions</h4>
    <div class="table-responsive">
      <table class="table table-striped table-light">
        <tbody v-for="tx in block.transactions">
        <tr>
          <td><router-link :to="'/transaction/' + tx.id">{{ tx.id }}</router-link></td>
          <td></td>
          <td class="text-right">{{ moment(tx.time * 1000).format('YYYY-MM-DD h:mm:ss a') }}</td>
        </tr>
        <tr>
          <td>
            <div v-for="input in tx.inputs">
              <router-link :to="'/address/' + input.address">{{ input.address }}</router-link>
              - ({{ input.amount }} MLB - <router-link :to="'/transaction/' + input.tx">Output</router-link>)
            </div>
            <strong v-if="! tx.inputs.length">No Inputs (Newly Generated Coins)</strong>
          </td>
          <td v-html="icon('arrow-right')"></td>
          <td>
            <div v-for="output in tx.outputs">
              <div class="pull-right">{{ output.amount }} MLB</div>
              <router-link :to="'/address/' + output.address">{{ output.address }}</router-link>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import octicons from 'octicons'
import moment from 'moment-mini'

export default {
  components: {},

  mounted () {
    this.getBlock(this.$route.params.index)
  },

  watch: {
    '$route.params.index' (index) {
      this.getBlock(index)
    }
  },

  computed: {
    ...mapState({
      block: s => s.block,
    }),

    totalOutput () {
      if (! this.block.transactions || ! this.block.transactions.length) return ''

      return this.block.transactions.reduce((acc, tx) => acc + tx.outputs.reduce((acc, out) => acc + out.amount, 0), 0)
    },

    blockReward () {
      if (! this.block.transactions || ! this.block.transactions.length) return ''

      return this.block.transactions.find(tx => tx.reward).outputs[0].amount
    },
  },

  methods: {
    ...mapActions(['getBlock']),

    moment () {
      return moment(...arguments)
    },

    icon (name) {
      return octicons[name].toSVG({width: 30})
    }
  },
}
</script>