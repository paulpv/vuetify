import Ripple from '../directives/ripple'

/** @mixin */
export default {
  name: 'rippleable',

  directives: { Ripple },

  props: {
    ripple: {
      type: [Boolean, Object],
      default: true
    }
  },

  methods: {
    genRipple (data = {}) {
      if (!this.ripple) return null

      data.staticClass = 'v-input--selection-controls__ripple'
      data.directives = data.directives || []
      data.directives.push({
        name: 'ripple',
        value: this.ripple && !this.disabled && { center: true }
      })
      data.on = Object.assign({
        click: e => {
          this.$emit('click', e)
          this.onChange()
        }
      }, this.$listeners)

      return this.$createElement('div', data)
    }
  }
}
