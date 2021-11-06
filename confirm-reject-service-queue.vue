<template>
  <b-modal
    id="confirmRejectServiceQueue"
    ref="confirmRejectServiceQueue"
    size="xl"
    centered
    hide-header
    hide-footer
  >
    <div class="pb-4">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <p class="my-2 w-100 text-center">Отмена предварительной записи</p>
        <a
          href="#"
          class="text-decoration-none"
          @click.prevent="$refs['confirmRejectServiceQueue'].hide()"
        >
          <img src="../../assets/close-dark.svg">
        </a>
      </div>
      <div class="pt-3 px-4 pb-4">
        <p>Укажите причину отмены: <span class="text-danger">*<small>обязательно</small></span>
        </p>
        <b-form-textarea
          v-model.trim="comment"
          rows="8"
          class="mt-2 text-aria-none"
          @keyup.enter="reject()"
        />
      </div>
    </div>
    <div class="d-flex justify-content-center mt-3">
      <b-col cols="4">
        <b-button
          variant="light"
          class="w-100 py-2 button button_skew"
          @click="$refs['confirmRejectServiceQueue'].hide()"
        >
          <p class="m-0 text text_incline">Отмена</p>
        </b-button>
      </b-col>
      <b-col cols="4">
        <b-button
          variant="primary"
          class="w-100 py-2 button button_skew"
          @click="reject()"
        >
          <p class="m-0 text text_incline">Продолжить</p>
        </b-button>
      </b-col>
    </div>
  </b-modal>
</template>

<script>
import api from '@/components/api'

export default {
  name: 'ConfirmRejectServiceQueue',
  props: {
    idServiceQueue: {
      type: String,
      default: ''
    }
  },

  data () {
    return {
      comment: ''
    }
  },

  mounted () {
    // при каждом открытии будем устанавливать нач.значения
    this.$root.$on('bv::modal::show', (bvEvent, modalId) => {
      if (modalId === 'confirmRejectServiceQueue') {
        this.comment = ''
      }
    })
  },

  methods: {
    reject () {
      if (this.comment.length > 0) {
        api.axios.delete('/service-queue/' + this.idServiceQueue, {data: { comment: this.comment }}).then(() => {
          this.$emit('updateData')
          this.$refs['confirmRejectServiceQueue'].hide()
        }).catch(response => {
          if (response) {
            if (response.status !== 401 && response.status !== 403) {
              this.$bvToast.toast('Не удалось отменить запись.', {
                title: `Ошибка`,
                variant: 'danger',
                solid: true
              })
            }
          }
        })
      }
    }
  }
}
</script>
