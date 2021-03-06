import 'draft-js/dist/Draft.css'
import './assets/scss/_base.scss'
import React from 'react'
import ReactDOM from 'react-dom'
import languages from 'languages'
import { Modifier, CompositeDecorator, DefaultDraftBlockRenderMap, Editor, ContentState, EditorState, RichUtils, convertFromRaw, convertToRaw } from 'draft-js'
import { convertToHTML, convertFromHTML } from 'draft-convert'
import { checkReturn } from 'utils/editor'
import { getToHTMLConfig, getFromHTMLConfig } from 'configs/convert'
import defaultOptions from 'configs/options'
import { getBlockRendererFn, customBlockRenderMap, blockStyleFn, getCustomStyleMap, decorators } from 'renderers'
import ControlBar from 'components/business/ControlBar'

const editorDecorators = new CompositeDecorator(decorators)
const blockRenderMap = DefaultDraftBlockRenderMap.merge(customBlockRenderMap)

export default class BraftEditor extends React.Component {

  constructor(props) {

    super(props)

    let initialEditorState
    let { initialContent, contentFormat } = this.props

    contentFormat = contentFormat || 'raw'
    initialContent = initialContent || ''

    if (!initialContent) {
      initialEditorState = EditorState.createEmpty(editorDecorators)
    } else {

      let convertedContent

      if (contentFormat === 'html') {
        convertedContent = convertFromHTML(getFromHTMLConfig())(initialContent)
      } else if (contentFormat === 'raw') {
        convertedContent = convertFromRaw(initialContent)
      }

      initialEditorState = EditorState.createWithContent(convertedContent, editorDecorators)

    }

    this.readyForSync = true
    this.state = {
      editorState: initialEditorState,
      editorProps: {}
    }

  }

  onChange = (editorState) => {

    this.setState({ editorState }, () => {
      clearTimeout(this.syncTimer)
      this.syncTimer = setTimeout(() => {
        const { onChange, onRawChange, onHTMLChange } = this.props
        onChange && onChange(this.getContent())
        onHTMLChange && onHTMLChange(this.getHTMLContent())
        onRawChange && onRawChange(this.getRawContent())
      }, 300)
    })

  }

  getHTMLContent = () => {
    return this.getContent('html')
  }

  getRawContent = () => {
    return this.getContent('raw')
  }

  getContent = (format) => {

    format = format || this.props.contentFormat || 'raw'
    const contentState = this.getContentState()
    let { colors, fontSizes, fontFamilies } = this.props
    colors = colors || defaultOptions.colors
    fontSizes = fontSizes || defaultOptions.fontSizes
    fontFamilies = fontFamilies || defaultOptions.fontFamilies

    return format === 'html' ? convertToHTML(getToHTMLConfig({
      contentState, colors, fontSizes, fontFamilies
    }))(contentState) : convertToRaw(this.getContentState())

  }

  getContentState = () => {
    return this.getEditorState().getCurrentContent()
  }

  getEditorState = () => {
    return this.state.editorState
  }

  getDraftInstance = () => {
    return this.draftInstance
  }

  setEditorProp = (key, name)  =>{
    let editorProps = {
      ...this.state.editorProps,
      [key]: name
    }
    this.setState({ editorProps })
  }

  forceRender = () => {

    const editorState = this.state.editorState
    const contentState = editorState.getCurrentContent()
    const newEditorState = EditorState.createWithContent(contentState, editorDecorators)

    this.setState({editorState: newEditorState})

  }

  handleKeyCommand = (command) => {

    const newState = RichUtils.handleKeyCommand(this.state.editorState, command)

    if (newState) {
      this.onChange(newState)
      return true
    }

    return false

  }

  handleReturn = (event) => {

    const editorState = checkReturn(this.state.editorState, event);
  
    if (editorState) {
      this.onChange(editorState)
      return true
    }
  
    return false
  
  }

  handlePastedText = (text, html) => {

    if (!html) {
      return false
    }

    const { editorState } = this.state
    const blockMap = convertFromHTML(getFromHTMLConfig())(html || text).blockMap
    const newState = Modifier.replaceWithFragment(editorState.getCurrentContent(), editorState.getSelection(), blockMap)

    this.onChange(EditorState.push(editorState, newState, 'insert-fragment'))

    return true

  }

  render() {

    let {
      controls, height, media, addonControls, language,
      colors, fontSizes, fontFamilies, viewWrapper, placeholder
    } = this.props

    const contentState = this.state.editorState.getCurrentContent()

    media = { ...defaultOptions.media, ...media }
    controls = controls || defaultOptions.controls
    addonControls = addonControls || defaultOptions.addonControls
    language = languages[language] || languages[defaultOptions.language]
    colors = colors || defaultOptions.colors
    fontSizes = fontSizes || defaultOptions.fontSizes
    fontFamilies = fontFamilies || defaultOptions.fontFamilies
    height = height || defaultOptions.height

    if (!media.uploadFn) {
      media.video = false
      media.audio = false
    }

    const controlBarProps = {
      onChange: this.onChange,
      editorState: this.state.editorState,
      editor: this.draftInstance,
      media, controls, contentState, language, viewWrapper,
      addonControls, colors, fontSizes, fontFamilies
    }

    const blockRendererFn = getBlockRendererFn({
      onChange: this.onChange,
      editorState: this.state.editorState,
      getEditorState: this.getEditorState,
      forceRender: this.forceRender,
      setEditorProp: this.setEditorProp,
      language, contentState, viewWrapper
    })

    const customStyleMap = getCustomStyleMap({ colors, fontSizes, fontFamilies })

    const editorProps = {
      ref: instance => this.draftInstance = instance,
      editorState: this.state.editorState,
      handleKeyCommand: this.handleKeyCommand,
      handleReturn: this.handleReturn,
      handlePastedText: this.handlePastedText,
      onChange: this.onChange,
      customStyleMap, blockStyleFn,
      blockRendererFn, blockRenderMap, placeholder,
      ...this.state.editorProps
    }

    return (
      <div className="BraftEditor-container">
        <ControlBar {...controlBarProps}/>
        <div
          className="BraftEditor-content"
          style = {{height}}
        >
          <Editor { ...editorProps }/>
        </div>
      </div>
    )
  }

}