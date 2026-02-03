import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

// 创建markdown-it实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><span class="code-html">' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</span></pre>'
      } catch (__) {}
    }

    return '<pre class="hljs"><span class="code-html">' + md.utils.escapeHtml(str) + '</span></pre>'
  }
})

// 将 inline code 从 <code> 替换为 span，避免默认 code 字体难看
md.renderer.rules.code_inline = function (tokens, idx, options, env, renderer) {
  const token = tokens[idx]
  return '<span class="code-inline">' + md.utils.escapeHtml(token.content) + '</span>'
}

// 自定义标题渲染规则，添加ID属性
md.renderer.rules.heading_open = function (tokens, idx, options, env, renderer) {
  const token = tokens[idx]
  const level = token.tag
  const nextToken = tokens[idx + 1]
  
  if (nextToken && nextToken.type === 'inline') {
    const anchor = generateAnchor(nextToken.content)
    token.attrSet('id', anchor)
  }
  
  return renderer.renderToken(tokens, idx, options)
}

// 自定义渲染规则
md.renderer.rules.table_open = function () {
  return '<div class="table-wrapper"><table class="markdown-table">'
}

md.renderer.rules.table_close = function () {
  return '</table></div>'
}

// 链接在新窗口打开
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, renderer) {
  return renderer.renderToken(tokens, idx, options)
}

md.renderer.rules.link_open = function (tokens, idx, options, env, renderer) {
  const aIndex = tokens[idx].attrIndex('target')
  
  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank'])
  } else {
    tokens[idx].attrs[aIndex][1] = '_blank'
  }
  
  // 添加rel属性以提高安全性
  const relIndex = tokens[idx].attrIndex('rel')
  if (relIndex < 0) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer'])
  } else {
    tokens[idx].attrs[relIndex][1] = 'noopener noreferrer'
  }

  return defaultRender(tokens, idx, options, env, renderer)
}

// 渲染markdown
export function renderMarkdown(content) {
  if (!content) return ''
  return md.render(content)
}

// 提取markdown中的标题，用于生成目录
export function extractHeadings(content) {
  if (!content) return []
  
  const tokens = md.parse(content, {})
  const headings = []
  
  tokens.forEach((token, index) => {
    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.substring(1))
      const nextToken = tokens[index + 1]
      if (nextToken && nextToken.type === 'inline') {
        headings.push({
          level,
          text: nextToken.content,
          anchor: generateAnchor(nextToken.content)
        })
      }
    }
  })
  
  return headings
}

// 生成锚点 - 改进版，支持中文和特殊字符
function generateAnchor(text) {
  return text
    .toLowerCase()
    .trim()
    // 替换空格为连字符
    .replace(/\s+/g, '-')
    // 移除或替换特殊字符，但保留中文字符
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    // 移除开头和结尾的连字符
    .replace(/^-+|-+$/g, '')
    // 如果结果为空，使用随机字符串
    || 'heading-' + Math.random().toString(36).substr(2, 9)
}
