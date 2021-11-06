import api from '@/components/api'

export default class LeftoversProducts {
  static getLeftoversProducts ({ regionId, serviceFormModel }) {
    const productIds = this._getStringProducts(serviceFormModel.orderProducts)
    const watersIds = serviceFormModel.formType !== 'FormAntifreeze' ? ''
      : this._getStringProducts(serviceFormModel.orderWaters)
    let dataIds = (productIds && watersIds) ? (productIds + ',' + watersIds) : (productIds || watersIds)
    return this._getData({ regionId: regionId, productIds: dataIds })
  }

  static getLeftoversProductItem ({ regionId, productIds }) {
    return this._getData({ regionId: regionId, productIds: productIds })
  }

  static _getStringProducts (orderData) {
    return orderData.reduce((accumulator, currentValue, index, arr) => {
      let value = accumulator + currentValue.id
      if (index < arr.length - 1) {
        value += ','
      }
      return value
    }, '')
  }

  static _getData ({ regionId, productIds }) {
    return new Promise((resolve, reject) => {
      api.axios.get('/region' + regionId + '/leftovers?productIds=' + productIds).then(response => {
        resolve(response.data)
      }, response => {
        reject(response)
      })
    })
  }
}
