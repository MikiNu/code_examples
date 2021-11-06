<template>
  <div>
    <b-row class="d-flex mt-3 text text_size-min">
      <b-col
        cols="12"
        md="6"
        lg="3"
        class="d-flex py-2"
      >
        <v-icon
          name="car"
          scale="1.1"
          class="text-primary"
        />
        <p class="px-2">Пробег: {{ order.mileage.toLocaleString() + ' км' || 'не указано' }}</p>
      </b-col>
    </b-row>
    <list-services
      v-model="servicesNewAdd"
      :services="services"
      :all-services-list="allServicesList"
      :auto-data="order.auto"
      :discount-card="discountCardCar"
      :dashboard-params="dashboardParams"
      type-services="order"
    >
      <template #basket>
        <basket-request
          :services="serviceForBasket"
          :discount-card="discountCardCar"
          :discount-card-car="order.auto.discountCard"
          :auto-id="order.auto.autoId"
          no-contractor
          is-dop-button
          @nextStep="checkDoSave"
          @calcDataBasket="calcDataBasket"
          @saveCard="changeDiscountCard"
        >
          <template #buttonName>
            <p
              v-if="!order.isVersionConflict"
              class="m-0 text text_incline px-5"
            >
              Сохранить
            </p>
            <p
              v-else
              class="m-0 text text_size-min text_incline px-3"
            >
              Сохранить принудительно
            </p>
          </template>
        </basket-request>
      </template>
    </list-services>
    <modal-confirm-change
      name="saveOrder"
      @doSave="doSave"
    >
      <template #header>Сохранение заказ-наряда</template>
      <div v-if="!order.isVersionConflict">
        <p>Изменения заказ-наряда повлияют на данные следующего ТО.</p>
        <p class="mb-0">Сохранить внесенные изменения?</p>
      </div>
      <div v-else>
        <p>Документ в 1С будет перезаписан, ранее сохраненные данные утеряны.</p>
        <p class="mb-0">Вы уверены, что хотите сохранить внесенные изменения?</p>
      </div>
    </modal-confirm-change>
  </div>
</template>

<script>
import api from '@/components/api'
import Services from '@/models/Services'
import { Service } from '@/models/Service'
import { mapGetters } from 'vuex'

export default {
  name: 'OrderChange',
  components: {
    ModalConfirmChange: () => import('@/components/orders/modal-confirm-change'),
    ListServices: () => import('@/components/common/list-services'),
    BasketRequest: () => import('@/components/request/basket-request')
  },
  props: {
    employeeId: {
      type: Number,
      default: null
    },
    postNumber: {
      type: Number,
      default: null
    },
    dashboardParams: {
      type: Object,
      default: () => { return {} }
    },
    order: {
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
    }
  },
  data () {
    return {
      servicesNewAdd: [],
      allServicesList: [],
      services: {},
      discountCardCar: this.order.discountCard,
      contractor: this.order.preEntry?.contractor || null,
      subTotal: this.order.subTotal,
      subTotalDiscount: this.order.subTotalDiscount,
      isFinall: false
    }
  },
  computed: {
    ...mapGetters(['regionId']),
    serviceForBasket () {
      let commonService = Object.assign({}, this.services)
      this.servicesNewAdd.forEach(item => {
        commonService['serviceId' + item.serviceId] = item
      })
      return commonService
    }
  },
  created () {
    let recommendations = this.rawRecommendations
    let recommendationOrder = []
    for (let service in recommendations) {
      if (this.order.serviceList.hasOwnProperty(service)) {
        recommendations[service].serviceOrder = this.order.serviceList[service]
        recommendationOrder.push(service)
      } else {
        recommendations[service].serviceOrder = null
      }
    }
    let orderInServicesNewAdd = null
    for (let key of Object.keys(this.order.serviceList)) {
      if (!recommendationOrder.includes(key)) {
        if (!orderInServicesNewAdd) {
          orderInServicesNewAdd = {}
        }
        orderInServicesNewAdd[key] = this.order.serviceList[key]
      }
    }
    let autoId = this.auto?.autoId || null
    Services.setData({ nameApp: 'service-consultant', autoId: autoId, regionId: this.regionId, recommendations: recommendations, discountCard: this.order.discountCard }).then((data) => {
      [ this.allServicesList, this.services, this.servicesNewAdd ] = data

      if (orderInServicesNewAdd) {
        for (let service in orderInServicesNewAdd) {
          if (orderInServicesNewAdd.hasOwnProperty(service)) {
            let findServiceVariant = {}
            // ищем услугу в списке всех услуг
            for (let i = 0; i < this.allServicesList.length; i++) { // цикл по группам
              for (let j = 0; j < this.allServicesList[i].servicesList.length; j++) { // цикл по услугам в каждой группе
                if (this.allServicesList[i].servicesList[j].serviceId === +service.replace('serviceId', '')) {
                  this.allServicesList[i].servicesList[j].enabled = false // делаем параметр не активным для следующего выбора
                  findServiceVariant = this.allServicesList[i].servicesList[j].serviceVariantsList.find(variant => variant.serviceVariantId === orderInServicesNewAdd[service].serviceVariantId)
                }
              }
            }
            let model = new Service(Object.assign({}, findServiceVariant, { discountCard: this.order.discountCard, formConfig: null },
              { serviceOrder: orderInServicesNewAdd[service] }))
            model.inCart = true
            this.servicesNewAdd.push(model)
          }
        }
      }
    })
  },
  methods: {
    checkDoSave (isFinall) {
      this.isFinall = isFinall
      this.$bvModal.show('confirmChange-saveOrder')
    },

    doSave (value) {
      if (value) {
        this.saveOrder()
      }
    },
    async saveOrder () {
      let data = {
        subTotal: this.subTotal,
        subTotalDiscount: this.subTotalDiscount,
        contractor: this.contractor,
        discountCardId: this.discountCardCar?.id || null
      }
      if (this.order.postNumber !== this.postNumber) {
        data.postNumber = this.postNumber
      }
      if (this.order.employee.id !== this.employeeId) {
        data.employeeId = this.employeeId
      }

      data.serviceList = Services.formationServiceListToSend({ services: this.serviceForBasket, mileage: this.order.mileage })
      data.products = Services.formationProductsListToSend({ services: this.serviceForBasket })
      data.works = Services.formationWorksListToSend({ services: this.serviceForBasket })

      let newNext = await Services.nexServices({ services: this.serviceForBasket, mileage: this.order.mileage, auto: this.order.auto })
      newNext = Object.assign(newNext, { discountCard: this.discountCardCar })

      // следующее ТО которое будет отправляться
      let nextTemp = this.order.nextServices ? Object.assign(Object.create(Object.getPrototypeOf(this.order.nextServices)), this.order.nextServices) : {}
      // массив ключей услуг из ранее сформированного следующего ТО
      let serviceNextEarly = this.order.nextServices?.serviceList ? Object.keys(this.order.nextServices.serviceList) : []
      // если у ЗН уже было сформировано следующее ТО и в нем есть услуги в корзине
      if (serviceNextEarly.length > 0) {
        let serviceNextNew = [] // массив с ключами услуг и их serviceVariantId
        for (let service in newNext.serviceList) {
          serviceNextNew.push({ service: service, serviceVariantId: newNext.serviceList[service].serviceVariantId })
        }
        newNext.productList.forEach(product => {
          let service = serviceNextNew.find(item => item.serviceVariantId === product.serviceVariantId)?.service // получим ID услуги для которой этот товар
          if (service && !serviceNextEarly.includes(service)) { // если найденно услуги нет в корзине ранее сформированного следующего ТО, то добавим в массив товар
            nextTemp.productList.push(product)
          }
        })
        newNext.workList.forEach(product => {
          let service = serviceNextNew.find(item => item.serviceVariantId === product.serviceVariantId)?.service // получим ID услуги для которой эту работу
          if (service && !serviceNextEarly.includes(service)) { // если найденно услуги нет в корзине ранее сформированного следующего ТО, то добавим в массив работу
            nextTemp.workList.push(product)
          }
        })

        for (let newServiceList in newNext.serviceList) { // проходимся по услугам нового сформированного ТО
          if (!nextTemp.serviceList || !nextTemp.serviceList[newServiceList]) { // если есть услуги, которые отсутствуют в ранее сформированном ТО, то их добавим
            nextTemp.serviceList[newServiceList] = newNext.serviceList[newServiceList]
          }
        }
        // данные для услуг
        for (let newLastServiceData in newNext.lastServiceData) {
          if (!nextTemp.lastServiceData || !nextTemp.lastServiceData[newLastServiceData]) {
            nextTemp.lastServiceData[newLastServiceData] = newNext.lastServiceData[newLastServiceData]
          }
        }
        // карточка скидки
        nextTemp.discountCard = newNext.discountCard
      } else {
        nextTemp = newNext
      }

      data.nextServices = nextTemp

      const queryParams = '?expand=auto,employee,discountCard,acceptanceDoc,nextServices,preEntry' +
        (this.order.isVersionConflict ? '&force=1' : '') +
        (this.isFinall ? '&lock=1' : '')

      api.axios.put('order/' + this.order._id + queryParams, data).then(response => {
        // возврат на компонент выше чтобы просто просмотр и "сохранение" данных соответствующих
        this.$emit('saveChangeOrder', response.data)
      }).catch(response => {
        if (response) {
          if (response.status !== 401 && response.status !== 403) {
            this.$bvToast.toast('Не удалось сохранить изменения.', {
              title: `Ошибка`,
              variant: 'danger',
              solid: true
            })
          }
        }
      })
    },
    calcDataBasket (data) {
      this.subTotal = data.sum
      this.subTotalDiscount = data.discountSum
    },
    changeContractor (contractor) {
      this.contractor = contractor
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
    }
  }
}
</script>
