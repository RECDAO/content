import Vue from 'vue'
import Vuex from 'vuex'
import Web3 from 'web3';
import moment from "moment";
import RECDAOArtifacts from 'artifacts/RECDAO.json';
import RegistryArtifacts from 'artifacts/Registry.json';
import TokenArtifacts from 'artifacts/Token.json';
import ContentDAOArtifacts from 'artifacts/ContentDAO.json';
import { NETWORKS } from 'constants.json';
const dateFormat = "YYYY-MM-DD";
// import RegistryArtifacts from 'artifacts/Registry.json';
// import TokenArtifacts from 'artifacts/Token.json';

Vue.use(Vuex)

const state = {
  account: null,
  balance: null,
  blockNum: null,
  count: 0,
  dates: [],
  selectedDates: [],
  decimals: null,
  network: null,
  username: null,
  contracts: {},
  web3: null,
  posts: {},
  subs: [],
  selectedSubs: []
}

const mutations = {
  INCREMENT (state, account) {
    state.count++;
  },
  ADD_POST (state, post) {
    Vue.set(state.posts, post.id, post);
  },
  ADD_DATE (state, date) {
    if(!state.dates.includes(date)) {
      state.dates.push(date);
      state.selectedDates.push(date);
    }
  },
  ADD_SUB (state, sub) {
    if(!state.subs.includes(sub)) {
      state.subs.push(sub);
      state.selectedSubs.push(sub);
    }
  },
  SET_ACCOUNT (state, account) {
    state.account = account;
  },
  SET_BLOCK_NUM (state, blockNum) {
    state.blockNum = blockNum;
  },
  SET_BALANCE (state, balance) {
    state.balance = balance;
  },
  SET_CONTRACTS (state, contracts) {
    state.contracts = contracts;
  },
  SET_DECIMALS (state, decimals) {
    state.decimals = decimals;
  },
  SET_NETWORK (state, network) {
    state.network = network;
  },
  SET_SELECTED_DATES (state, dates) {
    state.selectedDates = dates;
  },
  SET_SELECTED_SUBS (state, subs) {
    state.selectedSubs = subs;
  },
  SET_SUPPLY (state, supply) {
    state.supply = supply;
  },
  SET_USERNAME (state, username) {
    state.username = username;
  },
  SET_WEB3 (state, web3) {
    state.web3 = web3;
  }
}

const actions = {
  setAccount ({commit, dispatch, state}, account) {
    console.log("setAccount", account);
    commit("SET_ACCOUNT", account);
    if(!!account) return dispatch("setUsername");
  },
  setBalance ({ commit, state }) {
    let {Token} = state.contracts;
    return Token.methods.balanceOf(state.account).call().then(res=>commit("SET_BALANCE", res/Math.pow(10, state.decimals)));
  },
  setContracts ({commit, dispatch, state}) {
    let contracts = [/*ContentDAOArtifacts, */TokenArtifacts, RegistryArtifacts].reduce((prev, artifacts)=>{
      prev[artifacts.contractName] = new web3.eth.Contract(artifacts.abi, artifacts.networks["4"].address);
      return prev;
    }, {});
    commit("SET_CONTRACTS", contracts);
  },
  setUsername ({ commit, dispatch, state }) {
    let {Registry} = state.contracts;
    return Registry.methods.ownerToUsername(state.account).call()
      .then(web3.utils.hexToUtf8)
      .then(username=>commit("SET_USERNAME", username))
      .then(()=>dispatch("setBalance"));
  },
  setWeb3 ({ commit, state }) {
    return new Promise((resolve, reject)=>{
      if (typeof web3 !== 'undefined') {
        console.log('Web3 injected browser: OK.')
        window.web3 = new Web3(window.web3.currentProvider);
        commit("SET_WEB3", window.web3)
        resolve(web3);
      } else {
        reject("Web3 not found. Install the MetaMask browser plugin or use a dapp browser like Mist.")
      }
    })
  },
  setDecimals ({ commit, state }) {
    let {Token} = state.contracts;
    return Token.methods.decimals().call().then(res=>commit("SET_DECIMALS", res));
  },
  setBalance ({ commit, state }) {
    let {Token} = state.contracts;
    return Token.methods.balanceOf(state.account).call().then(res=>commit("SET_BALANCE", res/Math.pow(10, state.decimals)));
  },
  setSupply ({ commit, state }) {
    let {Token} = state.contracts;
    return Token.methods.totalSupply().call().then(res=>commit("SET_SUPPLY", res/Math.pow(10, state.decimals)));
  },
  setNetwork ({ commit, state }) {
    return window.web3.eth.net.getId()
      .then(id=>{
        switch (id) {
          case 1:
            return commit("SET_NETWORK", NETWORKS.MAIN);
          case 2:
            return commit("SET_NETWORK", NETWORKS.MORDEN);
          case 3:
            return commit("SET_NETWORK", NETWORKS.ROPSTEN);
          case 4:
            return commit("SET_NETWORK", NETWORKS.RINKEBY);
          case 42:
            return commit("SET_NETWORK", NETWORKS.KOVAN);
          default:
            return commit("SET_NETWORK", NETWORKS.OTHER);
        }
      });
  },
  async addDate ({ commit, dispatch, state }, date) {
    let res = await dispatch("addArchive", date);
    if(res.ok) commit("ADD_DATE", date);
  },
  addPost ({ commit, state }, post) {
    post.created_utc = moment(post.created_utc*1000)
    commit("ADD_POST", post);
    if(!state.subs.includes(post.subreddit)) commit("ADD_SUB", post.subreddit);
  },
  async addArchive({ commit, dispatch, state }, date){
    let res = await fetch(`posts/archive/${date.format(dateFormat)}.json`);
    if(res.ok) {
      let data = await res.json();
      for (let id in data) dispatch("addPost", data[id]);
    }
    return res;
  }
}

const store = new Vuex.Store({
  state,
  mutations,
  actions
})

export default store