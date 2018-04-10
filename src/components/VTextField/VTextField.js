// Styles
import '../../stylus/components/_input-groups.styl'
import '../../stylus/components/_text-fields.styl'

// Mixins
import Colorable from '../../mixins/colorable'
import Input from '../../mixins/input'
import Maskable from '../../mixins/maskable'
import Soloable from '../../mixins/soloable'

const dirtyTypes = ['color', 'file', 'time', 'date', 'datetime-local', 'week', 'month']

export default {
  name: 'v-text-field',

  mixins: [
    Colorable,
    Input,
    Maskable,
    Soloable
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
    autoGrow: Boolean,
    box: Boolean,
    clearable: Boolean,
    color: {
      type: String,
      default: 'primary'
    },
    counter: [Boolean, Number, String],
    fullWidth: Boolean,
    multiLine: Boolean,
    noResize: Boolean,
    placeholder: String,
    prefix: String,
    rowHeight: {
      type: [Number, String],
      default: 24,
      validator: v => !isNaN(parseFloat(v))
    },
    rows: {
      type: [Number, String],
      default: 5,
      validator: v => !isNaN(parseInt(v, 10))
    },
    singleLine: Boolean,
    suffix: String,
    textarea: Boolean,
    type: {
      type: String,
      default: 'text'
    }
  },

  computed: {
    classes () {
      const classes = {
        ...this.genSoloClasses(),
        'input-group--text-field': true,
        'input-group--text-field-box': this.box,
        'input-group--single-line': this.singleLine || this.isSolo,
        'input-group--multi-line': this.multiLine,
        'input-group--full-width': this.fullWidth,
        'input-group--no-resize': this.noResizeHandle,
        'input-group--prefix': this.prefix,
        'input-group--suffix': this.suffix,
        'input-group--textarea': this.textarea
      }

      if (this.hasError) {
        classes['error--text'] = true
      } else {
        return this.addTextColorClassChecks(classes)
      }

      return classes
    },
    count () {
      let inputLength
      if (this.inputValue) inputLength = this.inputValue.toString().length
      else inputLength = 0

      return `${inputLength} / ${this.counterLength}`
    },
    counterLength () {
      const parsedLength = parseInt(this.counter, 10)
      return isNaN(parsedLength) ? 25 : parsedLength
    },
    inputValue: {
      get () {
        return this.lazyValue
      },
      set (val) {
        // console.log('inputValue set val', val)
        if (this.mask) {
          this.lazyValue = this.unmaskText(this.maskText(this.unmaskText(val)))
          this.setSelectionRange()
        } else {
          this.lazyValue = val
          this.$emit('input', this.lazyValue)
        }
      }
    },
    isDirty () {
      return (this.lazyValue != null &&
        this.lazyValue.toString().length > 0) ||
        this.badInput ||
        dirtyTypes.includes(this.type)
    },
    isTextarea () {
      return this.multiLine || this.textarea
    },
    noResizeHandle () {
      return this.isTextarea && (this.noResize || this.shouldAutoGrow)
    },
    shouldAutoGrow () {
      return this.isTextarea && this.autoGrow
    }
  },

  watch: {
    isFocused (val) {
      // console.log('watch isFocused val', val)
      if (val) {
        this.initialValue = this.lazyValue
      } else if (this.initialValue !== this.lazyValue) {
        this.$emit('change', this.lazyValue)
      }
    },
    value (val) {
      // console.log('watch value val', val)
      if (this.mask && !this.internalChange) {
        // console.log('watch value external change')
        const masked = this.maskText(this.unmaskText(val))
        this.lazyValue = this.unmaskText(masked)

        // Emit when the externally set value was modified internally
        if (String(val) !== this.lazyValue) {
          // console.log('watch value changed')
          this.$nextTick(() => {
            this.$refs.input.value = masked
            this.$emit('input', this.lazyValue)
          })
        }
      } else {
        // console.log('watch value internal change')
        this.lazyValue = val
      }

      if (this.internalChange) this.internalChange = false

      !this.validateOnBlur && this.validate()
      this.shouldAutoGrow && this.calculateInputHeight()
    }
  },

  mounted () {
    this.shouldAutoGrow && this.calculateInputHeight()
    this.autofocus && this.focus()
  },

  methods: {
    calculateInputHeight () {
      this.inputHeight = null

      this.$nextTick(() => {
        const height = this.$refs.input
          ? this.$refs.input.scrollHeight
          : 0
        const minHeight = parseInt(this.rows, 10) * parseFloat(this.rowHeight)
        this.inputHeight = Math.max(minHeight, height)
      })
    },
    onInput (e) {
      // console.log('onInput e', e)
      this.mask && this.resetSelections(e.target)
      this.inputValue = e.target.value
      this.badInput = e.target.validity && e.target.validity.badInput
      this.shouldAutoGrow && this.calculateInputHeight()
    },
    blur (e) {
      // console.log('blur e', e)
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
      // console.log('focus e', e)
      if (!this.$refs.input) return

      this.isFocused = true
      if (document.activeElement !== this.$refs.input) {
        this.$refs.input.focus()
      }
      this.$emit('focus', e)
    },
    keyDown (e) {
      // console.log('keyDown e', e)
      // Prevents closing of a
      // dialog when pressing
      // enter
      if (this.isTextarea &&
        this.isFocused &&
        e.keyCode === 13
      ) {
        e.stopPropagation()
      }

      this.internalChange = true
    },
    genCounter () {
      return this.$createElement('div', {
        'class': {
          'input-group__counter': true,
          'input-group__counter--error': this.hasError
        }
      }, this.count)
    },
    genInput () {
      // console.log('genInput')
      const tag = this.isTextarea ? 'textarea' : 'input'
      const listeners = Object.assign({}, this.$listeners)
      delete listeners['change'] // Change should not be bound externally

      const value = this.maskText(this.lazyValue)
      // console.log('getInput value', value)

      const data = {
        style: {},
        domProps: { value },
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

      if (this.shouldAutoGrow) {
        data.style.height = this.inputHeight && `${this.inputHeight}px`
      }

      if (this.placeholder) data.attrs.placeholder = this.placeholder

      if (!this.isTextarea) {
        data.attrs.type = this.type
      } else {
        data.attrs.rows = this.rows
      }

      if (this.mask) {
        data.attrs.maxlength = this.masked.length
      }

      const children = [this.$createElement(tag, data)]

      this.prefix && children.unshift(this.genFix('prefix'))
      this.suffix && children.push(this.genFix('suffix'))

      return children
    },
    genFix (type) {
      // console.log('genFix type', type)
      return this.$createElement('span', {
        'class': `input-group--text-field__${type}`
      }, this[type])
    },
    clearableCallback () {
      // console.log('clearableCallback')
      this.inputValue = null
      this.$nextTick(() => this.$refs.input.focus())
    }
  },

  render () {
    // console.log('render arguments', arguments)
    return this.genInputGroup(this.genInput(), { attrs: { tabindex: false } })
  }
}
