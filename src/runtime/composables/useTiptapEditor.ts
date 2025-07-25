import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { Editor } from '@tiptap/vue-3'
import { debounce } from 'lodash-es'
import { onBeforeUnmount, ref } from 'vue'

export interface TiptapEditorOptions {
  content?: string
  placeholder?: string
  onUpdate?: (content: string) => void
  debounceMs?: number
  extensions?: any[]
  editorProps?: Record<string, any>
}

export const useTiptapEditor = (options: TiptapEditorOptions = {}) => {
  const editor = ref<Editor | null>(null)
  const isReady = ref(false)

  const defaultExtensions = [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline hover:text-blue-800',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg',
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse border border-slate-300',
      },
    }),
    TableRow,
    TableHeader.configure({
      HTMLAttributes: {
        class: 'bg-slate-100 font-semibold',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-slate-300 p-2',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    TextStyle,
    Color.configure({
      types: ['textStyle'],
    }),
    FontFamily.configure({
      types: ['textStyle'],
    }),
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: 'bg-yellow-200',
      },
    }),
  ]

  const defaultEditorProps = {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[120px] p-4 border-0',
      'data-placeholder': options.placeholder || 'Start typing...',
    },
  }

  const createEditor = () => {
    const onUpdateHandler = options.onUpdate
      ? debounce((content: string) => {
          options.onUpdate!(content)
        }, options.debounceMs || 300)
      : undefined

    editor.value = new Editor({
      content: options.content || '',
      extensions: options.extensions || defaultExtensions,
      editorProps: {
        ...defaultEditorProps,
        ...options.editorProps,
      },
      onUpdate: onUpdateHandler
        ? ({ editor }) => {
            onUpdateHandler(editor.getHTML())
          }
        : undefined,
      onCreate: () => {
        isReady.value = true
      },
      onDestroy: () => {
        isReady.value = false
      },
    })

    return editor.value
  }

  const destroyEditor = () => {
    if (editor.value) {
      editor.value.destroy()
      editor.value = null
      isReady.value = false
    }
  }

  // Content methods
  const setContent = (content: string) => {
    if (editor.value) {
      editor.value.commands.setContent(content)
    }
  }

  const getContent = () => {
    return editor.value?.getHTML() || ''
  }

  const getText = () => {
    return editor.value?.getText() || ''
  }

  const getJSON = () => {
    return editor.value?.getJSON()
  }

  const isEmpty = () => {
    return editor.value?.isEmpty ?? true
  }

  // Formatting methods
  const toggleBold = () => {
    editor.value?.chain().focus().toggleBold().run()
  }

  const toggleItalic = () => {
    editor.value?.chain().focus().toggleItalic().run()
  }

  const toggleUnderline = () => {
    editor.value?.chain().focus().toggleUnderline().run()
  }

  const toggleStrike = () => {
    editor.value?.chain().focus().toggleStrike().run()
  }

  const toggleHighlight = () => {
    editor.value?.chain().focus().toggleHighlight().run()
  }

  // Heading methods
  const setHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    editor.value?.chain().focus().toggleHeading({ level }).run()
  }

  const setParagraph = () => {
    editor.value?.chain().focus().setParagraph().run()
  }

  // List methods
  const toggleBulletList = () => {
    editor.value?.chain().focus().toggleBulletList().run()
  }

  const toggleOrderedList = () => {
    editor.value?.chain().focus().toggleOrderedList().run()
  }

  const toggleBlockquote = () => {
    editor.value?.chain().focus().toggleBlockquote().run()
  }

  // Alignment methods
  const setTextAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.value?.chain().focus().setTextAlign(alignment).run()
  }

  // Link methods
  const setLink = (url: string) => {
    if (url) {
      editor.value
        ?.chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
  }

  const unsetLink = () => {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
  }

  const toggleLink = (url?: string) => {
    if (editor.value?.isActive('link')) {
      unsetLink()
    } else if (url) {
      setLink(url)
    }
  }

  // Image methods
  const setImage = (src: string, alt?: string, title?: string) => {
    editor.value?.chain().focus().setImage({ src, alt, title }).run()
  }

  // Table methods
  const insertTable = (rows = 3, cols = 3, withHeaderRow = true) => {
    editor.value
      ?.chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow })
      .run()
  }

  const addRowBefore = () => {
    editor.value?.chain().focus().addRowBefore().run()
  }

  const addRowAfter = () => {
    editor.value?.chain().focus().addRowAfter().run()
  }

  const addColumnBefore = () => {
    editor.value?.chain().focus().addColumnBefore().run()
  }

  const addColumnAfter = () => {
    editor.value?.chain().focus().addColumnAfter().run()
  }

  const deleteRow = () => {
    editor.value?.chain().focus().deleteRow().run()
  }

  const deleteColumn = () => {
    editor.value?.chain().focus().deleteColumn().run()
  }

  const deleteTable = () => {
    editor.value?.chain().focus().deleteTable().run()
  }

  // Color methods
  const setColor = (color: string) => {
    editor.value?.chain().focus().setColor(color).run()
  }

  const unsetColor = () => {
    editor.value?.chain().focus().unsetColor().run()
  }

  // Font family methods
  const setFontFamily = (fontFamily: string) => {
    editor.value?.chain().focus().setFontFamily(fontFamily).run()
  }

  const unsetFontFamily = () => {
    editor.value?.chain().focus().unsetFontFamily().run()
  }

  // History methods
  const undo = () => {
    editor.value?.chain().focus().undo().run()
  }

  const redo = () => {
    editor.value?.chain().focus().redo().run()
  }

  const canUndo = () => {
    return editor.value?.can().undo() ?? false
  }

  const canRedo = () => {
    return editor.value?.can().redo() ?? false
  }

  // Clear formatting
  const clearContent = () => {
    editor.value?.chain().focus().clearContent().run()
  }

  const unsetAllMarks = () => {
    editor.value?.chain().focus().unsetAllMarks().run()
  }

  // State checking methods
  const isActive = (name: string, attributes?: Record<string, any>) => {
    return editor.value?.isActive(name, attributes) ?? false
  }

  const isBold = () => isActive('bold')
  const isItalic = () => isActive('italic')
  const isUnderline = () => isActive('underline')
  const isStrike = () => isActive('strike')
  const isHighlight = () => isActive('highlight')
  const isBulletList = () => isActive('bulletList')
  const isOrderedList = () => isActive('orderedList')
  const isBlockquote = () => isActive('blockquote')
  const isLink = () => isActive('link')
  const isTable = () => isActive('table')
  const isHeading = (level?: number) => {
    return level ? isActive('heading', { level }) : isActive('heading')
  }
  const isParagraph = () => isActive('paragraph')

  // Statistics
  const getWordCount = () => {
    const text = getText()
    return text.split(/\s+/).filter(word => word.length > 0).length
  }

  const getCharacterCount = () => {
    return getText().length
  }

  const getCharacterCountWithSpaces = () => {
    return editor.value?.storage.characterCount?.characters() ?? 0
  }

  // Focus methods
  const focus = (position?: 'start' | 'end' | number) => {
    if (position === 'start') {
      editor.value?.chain().focus('start').run()
    } else if (position === 'end') {
      editor.value?.chain().focus('end').run()
    } else if (typeof position === 'number') {
      editor.value?.chain().focus(position).run()
    } else {
      editor.value?.chain().focus().run()
    }
  }

  const blur = () => {
    editor.value?.commands.blur()
  }

  // Cleanup
  onBeforeUnmount(() => {
    destroyEditor()
  })

  return {
    // Editor instance
    editor,
    isReady,
    
    // Lifecycle
    createEditor,
    destroyEditor,
    
    // Content
    setContent,
    getContent,
    getText,
    getJSON,
    isEmpty,
    
    // Formatting
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrike,
    toggleHighlight,
    
    // Headings
    setHeading,
    setParagraph,
    
    // Lists
    toggleBulletList,
    toggleOrderedList,
    toggleBlockquote,
    
    // Alignment
    setTextAlign,
    
    // Links
    setLink,
    unsetLink,
    toggleLink,
    
    // Images
    setImage,
    
    // Tables
    insertTable,
    addRowBefore,
    addRowAfter,
    addColumnBefore,
    addColumnAfter,
    deleteRow,
    deleteColumn,
    deleteTable,
    
    // Colors
    setColor,
    unsetColor,
    
    // Font family
    setFontFamily,
    unsetFontFamily,
    
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Clear
    clearContent,
    unsetAllMarks,
    
    // State checking
    isActive,
    isBold,
    isItalic,
    isUnderline,
    isStrike,
    isHighlight,
    isBulletList,
    isOrderedList,
    isBlockquote,
    isLink,
    isTable,
    isHeading,
    isParagraph,
    
    // Statistics
    getWordCount,
    getCharacterCount,
    getCharacterCountWithSpaces,
    
    // Focus
    focus,
    blur,
  }
}