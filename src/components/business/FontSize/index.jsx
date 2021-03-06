import './style.scss'
import React from 'react'
import { Modifier, EditorState, RichUtils } from 'draft-js'
import DropDown from 'components/common/DropDown'

export default class FontSize extends React.Component {

  render () {

    let caption = null
    let currentFontSize = null
    let { defaultCaption, currentInlineStyle, onChange, language, fontSizes, viewWrapper } = this.props

    fontSizes.find((item) => {
      if (currentInlineStyle.has('FONTSIZE-' + item)) {
        caption = item + 'px'
        currentFontSize = item
        return true
      }
      return false
    })

    caption = caption || defaultCaption || language.controls.fontSize

    return (
      <DropDown
        caption={caption}
        viewWrapper={viewWrapper}
        hoverTitle={language.controls.fontSize}
        className={"control-item dropdown font-size-dropdown"}
      >
        <ul className="font-sizes-wrap">
          {fontSizes.map((item, index) => {
            return (
              <li
                key={index}
                className={item === currentFontSize ? 'active' : null}
                data-size={item}
                onClick={this.toggleFontSize}
              >
                {item + 'px'}
              </li>
            )
          })}
        </ul>
      </DropDown>
    )

  }

  toggleFontSize = (e) => {

    const fontSize = e.target.dataset.size
    const toggledFontSize = 'FONTSIZE-' + fontSize
    const { editorState, selection, currentInlineStyle, fontSizes } = this.props
    const nextContentState = fontSizes.reduce((contentState, item, index) => {
      return Modifier.removeInlineStyle(contentState, selection, 'FONTSIZE-' + item) 
    }, editorState.getCurrentContent())

    let nextEditorState = EditorState.push(
      editorState,
      nextContentState,
      'change-inline-style'
    )

    if (selection.isCollapsed()) {
      nextEditorState = currentInlineStyle.reduce((state, fontSize) => {
        return RichUtils.toggleInlineStyle(state, fontSize)
      }, nextEditorState)
    }

    if (!currentInlineStyle.has(toggledFontSize)) {
      nextEditorState = RichUtils.toggleInlineStyle(
        nextEditorState,
        toggledFontSize
      );
    }

    this.props.onChange(nextEditorState)

  }

}