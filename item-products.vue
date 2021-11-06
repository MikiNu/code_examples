<template>
  <b-row class="mt-2">
    <b-col
      cols="12"
      class="d-flex mb-3"
    >
      <b-form-checkbox
        v-if="data.materials === 'both' && parent === 'mechanic'"
        v-model="data.isNotCustomerProduct"
        :disabled="('reset').includes(nameItem)"
        switch
        size="lg"
      >
        Материалы СТО
      </b-form-checkbox>
      <div class="flex-grow-1">
        <slot />
      </div>
    </b-col>
    <template v-if="data.isNotCustomerProduct && data.hasOwnProperty('productCount')">
      <b-col cols="12">
        <component
          :is="componentFormSelect"
          :data="productSelect"
          :item-search="data.productSearch"
          :product-search-fields="data.productSearchFields"
          :product-search-filters="data.productSearchFilters"
          :name-item="'product-' + nameItem + '-1'"
          :discount="data.discount"
          :dashboard-params="dashboardParams"
        />
        <div
          v-if="typeProducts === 'no recommendation' || typeProducts === 'no last'"
          class="invalid-feedback d-block">
          {{ typeProducts === 'no recommendation' ? 'Материал не из рекомендаций' : 'В прошлый раз был установлен другой товар.' }}
        </div>
        <div v-if="isValidationError">
          <div
            v-for="(validate, index) in data.validationsLists.filter(item => item.field.includes('product') || item.field.includes('analogsGroups'))"
            :key="index"
            :class="validate.field.includes('analogsGroups') ? 'text-warning' : 'text-danger'"
          >
            <small>{{ validate.text }}</small>
          </div>
        </div>
      </b-col>
    </template>
    <b-col
      v-if="data.needWorks"
      cols="12"
    >
      <item-works
        v-model="data"
        :name-item="nameItem"
        :parent="parent"
      />
      <div v-if="isValidationError">
        <div
          v-for="(validate, index) in data.validationsLists.filter(item => item.field.includes('work'))"
          :key="index"
          class="text-danger"
        >
          <small>{{ validate.text }}</small>
        </div>
      </div>
    </b-col>
  </b-row>
</template>

<script>
import { mapGetters } from 'vuex'
import LeftoversProducts from '@/models/LeftoversProducts'

export default {
  name: 'ItemProducts',

  components: {
    FormSelect: () => import('@/components/interactive-acceptance/form-type/form-select'),
    FormSelectNoCatalog: () => import('@/components/personal-area/form-select-no-catalog'),
    ItemWorks: () => import('@/components/interactive-acceptance/form-type/item-works')
  },

  model: {
    prop: 'data',
    event: 'change'
  },

  props: {
    dashboardParams: {
      type: Object,
      default: () => { return {} }
    },
    data: {
      type: Object,
      default: function () {
        return {}
      }
    },
    nameItem: {
      type: String,
      default: ''
    },
    parent: {
      type: String,
      default: ''
    },
    lastForm: {
      type: Object,
      default: null
    },
    isValidationError: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      componentFormSelect: 'FormSelect' + (this.parent === 'client' ? 'NoCatalog' : ''),
      productSelect: false,
      dataProductIdTemp: null
    }
  },

  computed: {
    ...mapGetters(['regionId', 'subdivisionId']),
    products () {
      let products = []
      if (this.data.productList) {
        this.data.productList.forEach((nomen) => {
          nomen.products.forEach((product) => {
            let productTemp = Object.assign({
              weight: nomen.weight
            }, product)
            products.push(productTemp)
          })
        })
      }
      return products
    },
    isProductWarning () {
      let result = true
      if (!this.lastForm || this.lastForm.orderProducts.length === 0) {
        result = false
      } else {
        result = !this.lastForm.hasNomenInOrder(this.productSelect.selectedData.nomenCode)
      }
      return result
    },
    typeProducts () {
      let result = 'nothing selected'
      if (this.productSelect.selectedData) {
        result = this.data.hasProductInRecommendation(this.productSelect.selectedData.nomenCode) ? 'recommendation' : 'no recommendation'
        if (result === 'recommendation' && this.lastForm?.orderProducts.length > 0) {
          result = this.lastForm.hasNomenInOrder(this.productSelect.selectedData.nomenCode) ? 'last' : 'no last'
        }
      }
      return result
    }
  },

  watch: {
    'data.serviceVariantId' () {
      this.updateProductSelect()
    },

    'data.isNotCustomerProduct' (newValue) {
      // сбрасываем список товаров
      if (this.data.productId) {
        this.dataProductIdTemp = this.data.productId
      } else if (!this.dataProductIdTemp) {
        if (this.products.length > 0) {
          this.dataProductIdTemp = Object.assign([], this.products)[0].id
        }
      }
      if (!newValue) {
        this.data.productId = null
      } else {
        this.data.productId = this.dataProductIdTemp
      }
      this.updateProductSelect()
    },

    productSelect: {
      handler (newValue) {
        // в случае изменения в productSelect - меняем this.data
        let selectId = null
        if (newValue.selectedData) {
          selectId = !Number.isInteger(newValue.selectedData.id) ? +newValue.selectedData.id.split('_')[0] : newValue.selectedData.id
        }
        if (newValue.selectedData && (selectId !== this.data.productId || newValue.selectedData.count !== this.data.productCount)) {
          this.data.productId = selectId
          this.data.productCount = newValue.selectedData.count
          if (!this.data.hasProductInList(selectId)) {
            let product = Object.assign({}, newValue.selectedData)
            product.id = selectId
            delete product.count
            this.data.addExternalProduct(product)
            if (this.parent === 'client') {
              this.updateProductSelect()
            }
          }
          if (this.parent !== 'client') {
            delete this.data.isNoAvailabilityProducts
            LeftoversProducts.getLeftoversProductItem({
              regionId: this.regionId,
              productIds: selectId
            }).then(response => {
              response.forEach(leftover => {
                if (!leftover.rests.find(rest => rest.storageId === this.subdivisionId)) {
                  this.data.isNoAvailabilityProducts = true
                }
              })
            }).catch(response => {
              if (response) {
                if (response.status !== 401 && response.status !== 403) {
                  this.$bvToast.toast('Не удалось получить отстатки по товарам на СТО', {
                    title: `Ошибка`,
                    variant: 'danger',
                    solid: true
                  })
                }
              }
            }).finally(() => {
              this.updateProductSelect()
            })
          }
        }
        if (!newValue.selectedData && this.data.productId) {
          this.data.productId = null
          if (this.parent !== 'client') {
            delete this.data.isNoAvailabilityProducts
          }
          this.updateProductSelect()
        }
      },
      deep: true
    }
  },

  created () {
    this.updateProductSelect()
  },

  methods: {
    updateProductSelect () {
      // сборка данных для form-select
      let data = {
        list: [],
        selectedData: false
      }
      let selectedProduct = this.data.orderProducts[0]

      if (this.data.analogsGroups) {
        this.data.analogsGroups.forEach((analogGroup, index) => {
          let countFindNomenCodeAnalogs = 0
          let itemAnalogsTemp = []
          analogGroup.analogs.forEach(analogGroupItem => {
            let findAnalog = this.products.filter(itemProduct => itemProduct.nomenCode === analogGroupItem)
            if (findAnalog.length > 0) {
              countFindNomenCodeAnalogs += findAnalog.length
              findAnalog.forEach(itemAnalog => {
                let object = Object.assign({
                  count: this.data.productCount,
                  isGroup: true
                }, itemAnalog)
                object.id += '_group' + (index + 1)
                itemAnalogsTemp.push(object)
              })
            }
          })
          if (countFindNomenCodeAnalogs > 1 && countFindNomenCodeAnalogs !== this.products.length) {
            data.list.push({ name: 'Группа ' + (index + 1) })
            data.list = data.list.concat(itemAnalogsTemp)
          }
        })
      }
      let listNoGroup = []
      this.products.forEach(product => {
        let isFindList = data.list.findIndex(item => {
          if (item?.id) {
            let itemSelectId = !Number.isInteger(item.id) ? +item.id.split('_')[0] : item.id
            return itemSelectId === product.id
          }
        }) !== -1
        if (!isFindList) {
          let object = Object.assign({
            count: this.data.productCount,
            isGroup: data.list.length > 0
          }, product)
          listNoGroup.push(object)
        }
      })
      if (listNoGroup.length > 0 && data.list.length > 0) {
        data.list.push({ name: 'Без группы' })
      }
      data.list = data.list.concat(listNoGroup)

      if (selectedProduct) {
        data.selectedData = selectedProduct
      }

      this.productSelect = data
    }
  }
}
</script>
