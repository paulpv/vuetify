// Styles
import '../../stylus/components/_input-groups.styl'
import '../../stylus/components/_text-fields.styl'

// Mixins
import Colorable from '../../mixins/colorable'
import Input from '../../mixins/input'

const dirtyTypes = ['color', 'file', 'time', 'date', 'datetime-local', 'week', 'month']

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
      inputHeight: null,
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
    prefix: String,
    suffix: String,
    type: 'text'
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
      return (this.lazyValue != null &&
        this.lazyValue.toString().length > 0) ||
        this.badInput ||
        dirtyTypes.includes(this.type)
    }
  },

  watch: {
    isFocused (val) {
      if (val) {
        this.initialValue = this.lazyValue
      } else if (this.initialValue !== this.lazyValue) {
        this.$emit('change', this.lazyValue)
      }
    },
    value: {
      handler (newValue, oldValue) {
        this.lazyValue = newValue

        if (this.internalChange) this.internalChange = false

        !this.validateOnBlur && this.validate()
      }
    }
  },

  mounted () {
    this.autofocus && this.focus()
  },

  methods: {
    onInput (e) {
      this.inputValue = e.target.value
      this.badInput = e.target.validity && e.target.validity.badInput
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
        style: {},
        domProps: {
          value: this.lazyValue
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

      data.attrs.type = this.type

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
