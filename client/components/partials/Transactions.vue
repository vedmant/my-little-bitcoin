<template>
  <div class="table-responsive">
    <table class="table table-striped table-light">
      <tbody v-for="tx in transactions">
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
        <td v-html="icon('arrow-right')" class="vertical-middle"></td>
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
</template>

<script>
import octicons from 'octicons'
import moment from 'moment-mini'

export default {
  props: {
    transactions: Array,
  },

  methods: {
    moment () {
      return moment(...arguments)
    },

    icon (name) {
      return octicons[name].toSVG({width: 30})
    }
  },
}
</script>