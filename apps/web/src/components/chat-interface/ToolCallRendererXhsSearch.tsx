// startCall.tool_input
// endCall.observation

interface XhsItem {
  note_display_title: string
  note_url: string
  comment_user_nickname: string
  note_cover_url_default: string
}

// 使用正则表达式提取小红书数组数据
function extractXhsArray(observation: string): XhsItem[] {
  const xhsArray: XhsItem[] = []
  
  // 直接在整个字符串中查找所有的字段，匹配各种引号和转义格式
  const titleRegex = /note_display_title['"\\]*:\s*['"\\]*([^'"\\,}]*?)['"\\]*(?=,|\}|\\)/g
  const urlRegex = /note_url['"\\]*:\s*['"\\]*([^'"\\,}]*?)['"\\]*(?=,|\}|\\)/g
  const coverRegex = /note_cover_url_default['"\\]*:\s*['"\\]*([^'"\\,}]*?)['"\\]*(?=,|\}|\\)/g
  const commentRegex = /comment_user_nickname['"\\]*:\s*['"\\]*([^'"\\,}]*?)['"\\]*(?=,|\}|\\)/g
  
  // 提取所有匹配项
  const titles = Array.from(observation.matchAll(titleRegex)).map(match => match[1])
  const urls = Array.from(observation.matchAll(urlRegex)).map(match => match[1])
  const covers = Array.from(observation.matchAll(coverRegex)).map(match => match[1])
  const comments = Array.from(observation.matchAll(commentRegex)).map(match => match[1])
  
  // 组合数据，以标题数量为准
  const seenUrls = new Set<string>()
  
  for (let i = 0; i < titles.length; i++) {
    const note_display_title = titles[i] || ''
    const note_url = urls[i] || ''
    const note_cover_url_default = covers[i] || ''
    const comment_user_nickname = comments[i] || ''
    
    // 检查URL是否已存在，如果存在则跳过
    if (note_display_title && note_url && note_cover_url_default && !seenUrls.has(note_url)) {
      seenUrls.add(note_url)
      xhsArray.push({
        note_display_title,
        note_url,
        comment_user_nickname,
        note_cover_url_default
      })
    }
  }
  
  return xhsArray
}

export const ToolCallRendererXhsSearch = ({ toolGroup }: { toolGroup: any }) => {
  const observation = toolGroup.endCall?.observation || ''
  const xhsArray = extractXhsArray(observation)
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        找到 {xhsArray.length} 个小红书内容
      </div>
      
      {xhsArray.length > 0 ? (
        <div className="flex flex-col space-y-3">
          {xhsArray?.slice(0, 3).map((item, index) => (
            <div key={index} className="flex bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
              <div className="flex-shrink-0">
                <img 
                  src={item.note_cover_url_default} 
                  alt={item.note_display_title}
                  className="w-24 h-24 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <div className="flex-1 p-4 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2">
                  {item.note_display_title}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {item.comment_user_nickname && (
                      <p className="text-xs text-gray-500 truncate">
                        {item.comment_user_nickname}
                      </p>
                    )}
                  </div>
                  <a 
                    href={item.note_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-3 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    查看
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">
          未找到小红书内容数据
        </div>
      )}
    </div>
  )
}