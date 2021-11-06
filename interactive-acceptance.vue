<template>
  <div class="mt-4">
    <div class="d-flex justify-content-end">
      <b-button
        v-if="tabNameServices === 'now'"
        variant="primary"
        class="px-2 px-sm-3 mr-2 button button_skew"
        @click="nextServices"
      >
        <p class="m-0 text text_incline">
          Следующее ТО
        </p>
      </b-button>
      <b-button
        v-if="tabNameServices === 'next'"
        variant="primary"
        class="px-2 px-sm-3 mr-2 button button_skew"
        @click="tabNameServices = 'now'"
      >
        <p class="m-0 text text_incline px-4">
          Текущее ТО
        </p>
      </b-button>
    </div>
    <div v-show="tabNameServices === 'now'">
      <h3 class="font-header font-header__xl text-center text-secondary">
        Осмотр автомобиля
      </h3>
      <div
        v-if="regionId === 4 || regionId === 1"
        class="d-flex justify-content-end mb-5 "
      >
        <b-form-checkbox
          v-model="switchRefusalOfInspection"
          switch
          size="lg"
        >
          Отказ от осмотра
        </b-form-checkbox>
      </div>
      <list-services
        v-model="servicesNewAdd"
        :services="services"
        :all-services-list="allServicesList"
        :auto-data="autoData"
        :discount-card="discountCardCar"
        :dashboard-params="dashboardParams"
      >
        <template #visualInspection>
          <div class="card mb-3 mr-3">
            <div class="card-header pb-0 px-0">
              <b-col
                cols="12"
                class="pb-1 px-2 px-sm-3"
              >
                <h5 class="text text_size-main text-dark">
                  Визуальный осмотр
                </h5>
              </b-col>
            </div>
            <div class="card-body px-0 px-sm-2">
              <b-form-textarea
                :value="visualInspection"
                :disabled="!!(acceptance && acceptance.isRefusalOfInspection)"
                placeholder="Здесь можно оставить для клиента напоминание о найденной неисправности"
                rows="8"
                class="border-0 text-aria-none"
                @change="saveVisualInspection"
              />
            </div>
          </div>
        </template>
        <template #basket>
          <basket-total
            :services="serviceForBasket"
            :discount-card="discountCardCar"
            :discount-card-car="autoData.discountCard"
            :request-id="detailQueue.id ? detailQueue.id : null"
            :request-contractor-guid="detailQueue.contractor && detailQueue.contractor.guid ? detailQueue.contractor.guid : null"
            :temporary-client-auto-id="temporaryClientAutoId"
            :next-services="order.nextServices"
            :auto-data="autoData"
            @saveCard="changeDiscountCard"
          />
        </template>
      </list-services>
      <b-modal
        id="modalRefusalOfInspection"
        ref="modalRefusalOfInspection"
        size="xl"
        centered
        hide-header
        hide-footer
        no-close-on-backdrop
        no-close-on-esc
      >
        <div class="pb-4">
          <div class="d-flex align-items-center justify-content-between mb-4">
            <p class="my-2 w-100 text-center">Отказа от осмотра</p>
            <a
              href="#"
              class="text-decoration-none"
              @click.prevent="closeModalRefusalOfInspection"
            >
              <img src="../../assets/close-dark.svg">
            </a>
          </div>
          <div class="py-4 text-center">
            В случае выхода из строя узлов или агрегатов автомобиля из за эксплуатации с неправильным уровнем или
            состоянием технических жидкостей, либо с предельно изношенными элементами, являющимися расходными материалами,
            ответственность за последствия целиком лежит на владельце автомобиля.
          </div>
        </div>
        <div class="d-flex justify-content-center mt-3">
          <b-col cols="4">
            <b-button
              variant="light"
              class="w-100 py-2 button button_skew"
              @click="closeModalRefusalOfInspection"
            >
              <p class="m-0 text text_incline">Закрыть</p>
            </b-button>
          </b-col>
          <b-col cols="4">
            <b-button
              variant="primary"
              class="w-100 py-2 button button_skew"
              @click="setValueRefusalOfInspection(true)"
            >
              <p class="m-0 text text_incline">Отказ</p>
            </b-button>
          </b-col>
        </div>
      </b-modal>
    </div>
    <template v-if="tabNameServices === 'next'">
      <next-services
        v-model="order"
        :auto="autoData"
        :dashboard-params="dashboardParams"
        :recommendations-dashboard="rawRecommendations"
      >
        <template #header>
          <h3 class="font-header font-header__xl text-center text-secondary">
            Следующее обслуживание
          </h3>
        </template>
      </next-services>
    </template>
  </div>
</template>

<script>
import api from '@/components/api'
import { mapGetters, mapActions } from 'vuex'
import Services from '@/models/Services'

export default {
  name: 'InteractiveAcceptance',

  components: {
    ListServices: () => import('@/components/common/list-services'),
    NextServices: () => import('@/components/common/next-services'),
    BasketTotal: () => import('@/components/interactive-acceptance/basket-total')
  },

  props: {
    dashboardParams: {
      type: Object,
      default: () => { return {} }
    },
    autoData: {
      type: Object,
      default: function () {
        return {}
      }
    },
    rawRecommendations: {
      type: Object,
      default: function () {
        return {}
      }
    },
    requestId: {
      type: String,
      default: function () {
        return null
      }
    },
    detailQueue: {
      type: Object,
      default: function () {
        return {}
      }
    },
    temporaryClientAutoId: {
      type: String,
      default: function () {
        return null
      }
    }
  },

  data () {
    return {
      servicesNewAdd: [],
      allServicesList: [],
      isRefusalOfInspection: !!(this.acceptance?.isRefusalOfInspection),
      services: {},
      visualInspection: '',
      discountCardCar: this.detailQueue.id ? this.detailQueue.discountCard : this.autoData.discountCard,
      switchRefusalOfInspection: !!(this.acceptance?.isRefusalOfInspection),
      tabNameServices: 'now',
      order: {}
    }
  },

  computed: {
    ...mapGetters(['acceptance', 'mileage', 'regionId']),

    serviceForBasket () {
      let commonService = Object.assign({}, this.services)
      this.servicesNewAdd.forEach(item => {
        commonService['serviceId' + item.serviceId] = item
      })
      return commonService
    }
  },

  watch: {
    'acceptance.visualInspection': {
      handler (text) {
        this.visualInspection = text || ''
      },
      immediate: true
    },

    'acceptance.isRefusalOfInspection': {
      handler (value) {
        this.isRefusalOfInspection = !!value
        this.switchRefusalOfInspection = !!value
        if (value) {
          this.visualInspection = 'ОТКАЗ ОТ ОСМОТРА'
        }
      },
      immediate: true
    },

    switchRefusalOfInspection (value) {
      if (value !== this.isRefusalOfInspection) {
        this.changeValueRefusalOfInspection(!this.isRefusalOfInspection)
      }
    },
    mileage () {
      this.tabNameServices = 'now'
      this.order = {}
    }
  },

  created () {
    let recommendations = this.rawRecommendations
    this.$store.commit('SET_AUTO_ID', this.autoData.id)
    this.$store.dispatch('GET_ACCEPTANCE', { temporaryClientAutoId: this.temporaryClientAutoId }).then(response => {
      if (!response.hasOwnProperty('mileage') && this.mileage === 0) {
        this.$store.dispatch('SET_MILEAGE', this.autoData.mileage)
        this.updateField({
          fieldName: 'mileage',
          value: this.autoData.mileage
        })
      }
      let serviceQueueInServicesNewAdd = null
      let orderId = this.acceptance?._orderId || null

      this.getOrder(orderId).then(responseOrder => {
        let recommendationServiceQueue = []
        for (let service in recommendations) {
          if (this.detailQueue.serviceList) {
            if (this.detailQueue.serviceList.hasOwnProperty(service)) {
              recommendations[service].serviceQueue = this.detailQueue.serviceList[service]
              recommendationServiceQueue.push(service)
            } else {
              recommendations[service].serviceQueue = null
            }
          }
          if (responseOrder) {
            if (responseOrder.serviceList.hasOwnProperty(service)) {
              recommendations[service].serviceOrder = responseOrder.serviceList[service]
            } else {
              recommendations[service].serviceOrder = null
            }
          }
        }
        if (this.detailQueue.serviceList) {
          for (let key of Object.keys(this.detailQueue.serviceList)) {
            if (!recommendationServiceQueue.includes(key)) {
              if (!serviceQueueInServicesNewAdd) {
                serviceQueueInServicesNewAdd = {}
              }
              serviceQueueInServicesNewAdd[key] = this.detailQueue.serviceList[key]
            }
          }
        }
        Services.setData({ nameApp: 'interactive-acceptance',
          autoId: this.autoData.autoId,
          regionId: this.regionId,
          recommendations: recommendations,
          discountCard: this.discountCardCar,
          acceptance: this.acceptance,
          isChecklist: true,
          serviceQueueInServicesNewAdd: serviceQueueInServicesNewAdd
        }).then((data) => {
          [ this.allServicesList, this.services, this.servicesNewAdd ] = data
        })
      })
    }).catch(response => {
      if (response) {
        if (response.status !== 401 && response.status !== 403) {
          this.$bvToast.toast('Не удалось получить данные.', {
            title: `Ошибка`,
            variant: 'danger',
            solid: true
          })
        }
      }
    })
  },

  methods: {
    ...mapActions({updateField: 'POST_ACCEPTANCE'}),

    async getOrder (orderId) {
      let order = null
      if (orderId) {
        order = (await api.axios.get('/acceptance/order/' + orderId)).data.order
      }
      return order
    },

    async nextServices () {
      let data = {
        temporaryClientAutoId: this.temporaryClientAutoId, // *обязательно
        clientAutoId: this.autoData.autoId, // *обязательно
        mileage: this.mileage, // *обязательно
        nextServices: { discountCard: this.discountCardCar }
      }
      data.serviceList = Services.formationServiceListToSend({ services: this.serviceForBasket, mileage: this.mileage })
      data.products = Services.formationProductsListToSend({ services: this.serviceForBasket })
      data.works = Services.formationWorksListToSend({ services: this.serviceForBasket })
      data.nextServices = await Services.nexServices({ services: this.serviceForBasket, mileage: this.mileage, auto: this.autoData, checkListDocument: this.acceptance?.description || null })
      data.nextServices = Object.assign(data.nextServices, { discountCard: this.discountCardCar })
      this.order = data
      this.tabNameServices = 'next'
    },

    closeModalRefusalOfInspection () {
      this.switchRefusalOfInspection = this.isRefusalOfInspection
      this.$refs['modalRefusalOfInspection'].hide()
    },

    changeValueRefusalOfInspection (value) {
      if (value === true) {
        this.setValueRefusalOfInspection = this.setValueRefusalOfInspection
        this.$bvModal.show('modalRefusalOfInspection')
      } else {
        this.setValueRefusalOfInspection(value)
        this.visualInspection = ''
      }
    },

    setValueRefusalOfInspection (value) {
      this.updateField({
        fieldName: 'isRefusalOfInspection',
        value: value
      }).then(() => {
        this.$bvModal.hide('modalRefusalOfInspection')
      }).catch(response => {
        if (response) {
          if (response.status !== 401 && response.status !== 403) {
            this.showModalError(response.status)
          }
        }
      })
    },

    changeDiscountCard (discountCardCar) {
      this.discountCardCar = discountCardCar
      for (let service in this.services) {
        this.services[service].discountCard = discountCardCar
      }
      if (this.servicesNewAdd.length > 0) {
        this.servicesNewAdd.forEach(item => {
          item.discountCard = discountCardCar
        })
      }
      this.order = {}
    },

    showModalError (status) {
      let messageError = ''
      if (status === 409) {
        messageError = 'Изменения не были сохранены, так как у вас старая версия документа. Обновите страницу'
      } else if (status === 429) {
        messageError = 'Вы сделали слишком много запросов за единицу времени. Пожалуйста, повторите позже.'
      } else {
        messageError = 'Возникла ошибка при получение ответа от сервера.'
      }
      this.$bvToast.toast(messageError, {
        title: `Ошибка`,
        variant: 'danger',
        solid: true
      })
    },

    saveVisualInspection (value) {
      this.updateField({
        fieldName: 'visualInspection',
        value: value
      }).catch(response => {
        if (response) {
          if (response.status !== 401 && response.status !== 403) {
            this.showModalError(response.status)
          }
        }
      })
    }
  }
}
</script>
