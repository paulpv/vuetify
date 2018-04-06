// Styles
import '../../stylus/components/_input-groups.styl'
import '../../stylus/components/_text-fields.styl'

// Mixins
import Colorable from '../../mixins/colorable'
import Input from '../../mixins/input'

import defaults from './options'

export default {
  name: 'v-number-field',

  mixins: [
    Colorable,
    Input
  ],

  inheritAttrs: false,

  data () {
    return {
      initialValue: null,
      internalChange: false,
      badInput: false
    }
  },

  props: {
    autofocus: Boolean,
    box: Boolean,
    clearable: Boolean,
    color: {
      type: String,
      default: 'primary'
    },
    fullWidth: Boolean,
    placeholder: String,

    prefix: {
      type: String,
      default: () => defaults.prefix
    },
    suffix: {
      type: String,
      default: () => defaults.suffix
    },
    decimalSeparator: {
      type: String,
      default: () => defaults.decimalSeparator
    },
    thousandsSeparator: {
      type: String,
      default: () => defaults.thousandsSeparator
    },
    integerLimit: {
      type: Number,
      default: () => defaults.integerLimit
    },
    decimalLimit: {
      type: Number,
      default: () => defaults.decimalLimit
    }
  },

  computed: {
    classes () {
      const classes = {
        'input-group--text-field': true,
        'input-group--text-field-box': this.box,
        'input-group--full-width': this.fullWidth,
        'input-group--prefix': this.prefix,
        'input-group--suffix': this.suffix
      }

      if (this.hasError) {
        classes['error--text'] = true
      } else {
        return this.addTextColorClassChecks(classes)
      }

      return classes
    },
    inputValue: {
      get () {
        return this.lazyValue
      },
      set (val) {
        this.lazyValue = val
        this.$emit('input', this.lazyValue)
      }
    },
    isDirty () {
      return (this.lazyValue != null && this.lazyValue.toString().length > 0) ||
        this.badInput
    }
  },

  watch: {
    isFocused (val) {
      if (val) {
        this.initialValue = this.lazyValue
      } else {
        if (this.initialValue !== this.lazyValue) {
          this.$emit('change', this.lazyValue)
        }
      }
    },
    value: {
      handler (newValue, oldValue) {
        if (this.internalChange) {
          this.internalChange = false
          this.lazyValue = newValue
        } else {
          const parsed = this._parse(newValue)
          this.lazyValue = parsed.toStringed

          // Emit when the externally set value was modified internally
          if (String(newValue) !== this.lazyValue) {
            this.$nextTick(() => {
              this.$refs.input.value = this.lazyValue
              this.$emit('input', this.lazyValue)
            })
          }
        }

        if (!this.validateOnBlur) {
          this.validate()
        }
      }
    }
  },

  mounted () {
    if (this.autofocus) {
      this.focus()
    }
  },

  methods: {
    isNullOrUndefined (value) {
      return value === null || value === undefined
    },
    toStr (value) {
      return this.isNullOrUndefined(value) ? '' : value.toString()
    },
    _parse (value) {
      const original = value

      const toStringed = this.toStr(value)

      const {
        integerLimit,
        decimalLimit,
        thousandsSeparator,
        decimalSeparator
      } = this.$props

      const parts = toStringed.split(decimalSeparator)
      const integerPart = parts[0]
      const decimalPart = parts[1]

      return {
        original,
        toStringed,
        integerLimit,
        decimalLimit,
        thousandsSeparator,
        decimalSeparator,
        integerPart,
        integerLength: integerPart && integerPart.length,
        containsDecimal: parts.length > 1,
        decimalPart,
        decimalLength: decimalPart && decimalPart.length
      }
    },
    cancelEvent (e) {
      e.preventDefault()
    },
    onInput (e) {
      const key = e.data
      const target = e.target
      let targetValue = target.value
      let selectionStart = target.selectionStart
      const lazyValue = this.lazyValue

      const parsed = this._parse(targetValue)
      if (parsed.containsDecimal && selectionStart > parsed.integerLength) {
        if (parsed.decimalLength > parsed.decimalLimit) {
          this.$nextTick(() => {
            this.$refs.input.value = lazyValue
          })
          this.cancelEvent(e)
          return
        }
      } else {
        if (parsed.integerLength > parsed.integerLimit) {
          if (key !== parsed.decimalSeparator) {
            this.$nextTick(() => {
              this.$refs.input.value = lazyValue
            })
            this.cancelEvent(e)
            return
          }
        }
      }

      this.inputValue = parsed.toStringed
      this.badInput = target.validity && target.validity.badInput
    },
    blur (e) {
      this.isFocused = false
      // Reset internalChange state
      // to allow external change
      // to persist
      this.internalChange = false

      this.$nextTick(() => {
        this.validate()
      })
      this.$emit('blur', e)
    },
    focus (e) {
      if (!this.$refs.input) return

      this.isFocused = true
      if (document.activeElement !== this.$refs.input) {
        this.$refs.input.focus()
      }
      this.$emit('focus', e)
    },
    keyDown (e) {
      this.internalChange = true
    },
    genInput () {
      const tag = 'input'
      const listeners = Object.assign({}, this.$listeners)
      delete listeners['change'] // Change should not be bound externally

      const data = {
        style: { textAlign: 'right' },
        domProps: {
          value: this._parse(this.lazyValue).toStringed
        },
        attrs: {
          ...this.$attrs,
          autofocus: this.autofocus,
          disabled: this.disabled,
          required: this.required,
          readonly: this.readonly,
          tabindex: this.tabindex,
          'aria-label': (!this.$attrs || !this.$attrs.id) && this.label // Label `for` will be set if we have an id
        },
        on: Object.assign(listeners, {
          blur: this.blur,
          input: this.onInput,
          focus: this.focus,
          keydown: this.keyDown
        }),
        ref: 'input'
      }

      if (this.placeholder) data.attrs.placeholder = this.placeholder

      data.attrs.type = 'text'
      data.attrs.inputmode = 'decimal'

      const children = [this.$createElement(tag, data)]

      this.prefix && children.unshift(this.genFix('prefix'))
      this.suffix && children.push(this.genFix('suffix'))

      return children
    },
    genFix (type) {
      return this.$createElement('span', {
        'class': `input-group--text-field__${type}`
      }, this[type])
    },
    clearableCallback () {
      this.inputValue = null
      this.$nextTick(() => this.$refs.input.focus())
    }
  },

  render () {
    return this.genInputGroup(this.genInput(), { attrs: { tabindex: false } })
  }
}
