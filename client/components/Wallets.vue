<template>
  <div class="container page">
    <h3>My Wallets</h3>
    <hr>

    <button class="btn btn-success mb-3" @click="showCreateNew = true">Create new</button>

    <div class="table-responsive mb-5">
      <table class="table table-striped table-light">
        <tbody>
        <tr>
          <th>Name</th>
          <th>Address</th>
          <th>Balance</th>
          <th>Total Received</th>
          <th>Total Sent</th>
          <th>Actions</th>
        </tr>
        <tr v-for="wallet in wallets">
          <td>{{ wallet.name }}</td>
          <td><router-link :to="'/address/' + wallet.public">{{ wallet.public }}</router-link></td>
          <td>{{ wallet.balance }}</td>
          <td>{{ wallet.totalRecieved }}</td>
          <td>{{ wallet.totalSent }}</td>
          <td><b-button variant="warning" class="pull-right btn-xs" @click="onSendClick(wallet)">Send</b-button></td>
        </tr>
        </tbody>
      </table>
    </div>

    <b-modal v-model="showCreateNew" title="Create new wallet" ok-title="Create" @ok="onCreateSubmit">
      <b-form>
        <b-form-group label="Name">
          <b-form-input type="text" v-model="newForm.name" required placeholder="Name"></b-form-input>
        </b-form-group>
        <input type="submit" style="position: absolute; left: -9999px"/>
      </b-form>
    </b-modal>

    <send-form v-model="showSendForm" :from="sendFrom"></send-form>

  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import SendForm from './partials/SendForm.vue'

export default {

  components: {
    SendForm
  },

  data () {
    return {
      showSendForm: false,
      sendFrom: null,
      showCreateNew: false,
      newForm: {name: ''},
    }
  },

  mounted () {
    this.getWallets()
  },

  computed: {
    ...mapState({
      wallets: s => s.wallets,
    }),
  },

  methods: {
    ...mapActions(['getWallets', 'createWallet']),

    onSendClick (wallet) {
      this.showSendForm = true
      this.sendFrom = wallet.public
    },

    onCreateSubmit () {
      this.createWallet(this.newForm.name)
      this.newForm.name = ''
      this.showSendForm = false
    },
  },
}
</script>