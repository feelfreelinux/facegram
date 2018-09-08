/* tslint:disable:function-name */
import { ActionTree } from 'vuex'
import axios from '~/axios'
import * as action from './actions.types'
import ServicesState from './ServicesState'
import encodeParams from '../../../encodeParams'

export default <ActionTree<ServicesState, {}>>{
  async [action.LOAD_INSTANCES](store) {
    const { data } = await axios.get('services/instances')
    store.commit(action.SET_INSTANCES, data.data)
  },

  async [action.LOAD_MODULES](store) {
    const { data } = await axios.get('services/')
    store.commit(action.SET_MODULES, data.data)
  },

  async [action.CREATE_INSTANCE_DRAFT](store, params: { moduleName: string }) {
    const { data } = await axios.post('services/instances/draft', params)

    if (data.data.id) {
      store.commit(action.SET_NEW_INSTANCE_ID, data.data.id)
    }
    store.dispatch(action.LOAD_INSTANCES)
  },

  async [action.CONFIGURE_INSTANCE](store, params: { id: number, config: any }) {
    const { data } = await axios.post(`services/instances/${params.id}/configure`, params)
    if (data.data) {
      store.commit(action.UPDATE_INSTANCE, data.data)
    }
  },

  async [action.REMOVE_INSTANCE](store, { id }: { id: number }) {
    await axios.get(`services/instances/${id}/remove`)
    store.dispatch(action.LOAD_INSTANCES)
  },

  async [action.LOAD_INSTANCE_CONFIG_SCHEMA](store, { id }: { id: number }) {
    const instance = store.state.instances.find(i => i.id === id)
    if (!instance) {
      throw new Error(`Failed to find instance with id ${id}`)
    }
    const { data } = await axios.get(
      encodeParams`services/instances/${id}/schema`,
    )
    store.commit(action.SET_INSTANCE_CONFIG_SCHEMA, {
      id,
      configSchema: data.data,
    })
  },

  async [action.LOAD_USERS](store, { id }: { id: number}) {
    const { data } = axios.get(`services/instances/${id}/users`)

    if (data.data) {
      store.commit(action.SET_INSTANCE_USER, data.data)
    }
  }
}
