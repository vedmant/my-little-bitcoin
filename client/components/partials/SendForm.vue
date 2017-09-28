<template>
  <b-modal :visible="value" @change="value => $emit('input', value)" title="Send MLB to" ok-title="Send" @ok="onSendSubmit">
    <b-form @submit.prevent="onSendSubmit">
      <b-form-group label="From">
        <b-form-select v-model="send.from" :options="wallets.map(w => ({value: w.public, text: w.name}))"></b-form-select>
      </b-form-group>
      <b-form-group label="To">
        <b-form-select v-if="demoMode" v-model="send.to" :options="wallets.map(w => ({value: w.public, text: w.name}))"></b-form-select>
        <b-form-input v-else type="text" v-model="send.to" required placeholder="To"></b-form-input>
      </b-form-group>
      <b-form-group label="Amount">
        <b-form-input type="text" v-model="send.amount" required placeholder="Amount"></b-form-input>
      </b-form-group>
      <input type="submit" style="position: absolute; left: -9999px"/>
    </b-form>
  </b-modal>
</template>

<script>
import {mapState, mapActions} from 'vuex'

export default {
  props: ['value', 'from'],

  data () {
    return {
      send: {
        from: null,
        to: '',
        amount: '',
      },
    }
  },

  watch: {
    value () {
      this.send.from = this.from || this.wallets[0].public
      this.send.to = this.from ? '' : this.wallets[1].public
    },
  },

  computed: {
    ...mapState({
      wallets: s => s.wallets,
      demoMode: s => s.demoMode,
    }),
  },

  methods: {
    ...mapActions(['sendFunds']),

    onSendSubmit () {
      this.sendFunds(this.send)
      this.send.to = ''
      this.send.amount = ''
      this.$emit('input', false)
    },
  },
}
</script>