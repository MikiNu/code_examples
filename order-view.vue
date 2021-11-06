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
      <b-col
        cols="12"
        md="6"
        lg="9"
        class="d-flex py-2"
      >
        <v-icon
          name="id-card"
          scale="1.1"
          class="text-primary"
        />
        <div class="px-2">
          <p class="mb-1">Карточка скидки:
            {{ order.discountCard ? '№ ' + order.discountCard.number + ', ' + (order.discountCard.type === "discount" ? 'дисконтная ' : 'с кэшбэком ') + order.discountCard.percent + '%'
            : 'не указано' }}</p>
          <div v-if="order.discountCard">
            <p class="mb-1">{{ order.discountCard.fio }}</p>
          </div>
        </div>
      </b-col>
    </b-row>
    <simple-table-list-data-service :list="order.products">
      <template #header>
        <p class="mt-3 mb-2">Товары</p>
      </template>
    </simple-table-list-data-service>
    <simple-table-list-data-service :list="order.works">
      <template #header>
        <p class="mt-3 mb-2">Работы</p>
      </template>
    </simple-table-list-data-service>
    <div
      v-if="order.subTotalDiscount"
      class="text-right text-dark">
      <span class="font-weight-bold">Итого:</span>
      <small
        v-if="order.subTotal !== order.subTotalDiscount"
        class="text text_line-through pr-2">
        {{ order.subTotal.toLocaleString() }}
      </small> {{ order.subTotalDiscount.toLocaleString() }}
      <img src="../../assets/rub.svg">
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrderView',
  components: {
    SimpleTableListDataService: () => import('@/components/common/simple-table-list-data-service')
  },
  props: {
    order: {
      type: Object,
      default: function () {
        return {}
      }
    }
  }
}
</script>
