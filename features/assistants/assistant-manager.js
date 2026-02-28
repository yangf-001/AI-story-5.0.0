// 大总管模块 - 统一管理所有小助手的API输入
class AssistantManager {
    constructor() {
        this.inputQueue = []; // 输入队列
        this.processing = false; // 是否正在处理
        this.batchInterval = 500; // 批量处理间隔（毫秒）
        this.responseCallbacks = {}; // 响应回调
        this.assistants = {}; // 小助手信息
        this.init();
    }

    init() {
        // 启动批量处理定时器
        setInterval(() => this.processQueue(), this.batchInterval);
    }

    // 提交输入
    submitRequest(assistantId, requestData) {
        return new Promise((resolve, reject) => {
            const requestId = this.generateRequestId();
            this.inputQueue.push({
                id: requestId,
                assistantId,
                data: requestData,
                resolve,
                reject
            });
            
            // 保存回调
            this.responseCallbacks[requestId] = { resolve, reject };
            
            // 立即处理队列
            this.processQueue();
        });
    }

    // 注册小助手信息
    registerAssistant(assistant) {
        // 注册小助手，保存其信息以便后续处理
        this.assistants[assistant.id] = {
            name: assistant.name,
            description: assistant.description,
            profile: assistant.profile,
            settings: assistant.settings,
            inputTags: assistant.getInputTags(),
            outputTags: assistant.getOutputTags()
        };
        console.log('注册小助手:', assistant.name);
    }

    // 获取小助手信息
    getAssistantInfo(assistantId) {
        return this.assistants[assistantId] || null;
    }

    // 生成请求ID
    generateRequestId() {
        return `request-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }

    // 处理队列
    async processQueue() {
        if (this.processing || this.inputQueue.length === 0) return;
        
        this.processing = true;
        
        try {
            // 复制并清空队列
            const batch = [...this.inputQueue];
            this.inputQueue = [];
            
            // 合并相同的输入
            const mergedBatch = this.mergeRequests(batch);
            
            // 批量处理
            await this.processBatch(mergedBatch);
        } catch (error) {
            console.error('处理队列失败:', error);
        } finally {
            this.processing = false;
        }
    }

    // 合并相同的输入
    mergeRequests(requests) {
        const merged = [];
        const requestMap = new Map();
        
        requests.forEach(request => {
            const key = this.generateRequestKey(request);
            if (requestMap.has(key)) {
                // 合并相同的请求，合并输出标签
                const existing = requestMap.get(key);
                existing.assistantIds.push(request.assistantId);
                existing.requestIds.push(request.id);
                // 合并输出标签
                if (request.data.outputTags && Array.isArray(request.data.outputTags)) {
                    if (!existing.data.outputTags) {
                        existing.data.outputTags = [];
                    }
                    request.data.outputTags.forEach(tag => {
                        if (!existing.data.outputTags.includes(tag)) {
                            existing.data.outputTags.push(tag);
                        }
                    });
                }
            } else {
                requestMap.set(key, {
                    assistantIds: [request.assistantId],
                    requestIds: [request.id],
                    data: request.data
                });
            }
        });
        
        requestMap.forEach(item => merged.push(item));
        return merged;
    }

    // 生成请求键
    generateRequestKey(request) {
        // 基于提示词内容生成键，用于合并相同的请求
        const prompt = request.data.prompt || '';
        return prompt.substring(0, 100); // 使用提示词前100个字符作为键
    }

    // 处理批量请求
    async processBatch(batch) {
        for (const item of batch) {
            try {
                // 收集和处理标签
                const { inputTags, outputTags } = item.data;
                
                // 统计输入标签对应的内容
                const tagContentMap = this.collectTagContent(item.assistantIds, item.data);
                
                // 构建完整的提示词，包含所有小助手的需求
                const enhancedPrompt = this.buildEnhancedPrompt(item.assistantIds, item.data, tagContentMap);
                
                console.log('发送给API的提示词:', {
                    length: enhancedPrompt.length,
                    first1000: enhancedPrompt.substring(0, 1000) + '...'
                });
                
                // 调用API
                const response = await window.api.callAPI('user', enhancedPrompt);
                
                console.log('API返回的原始响应:', response);
                
                // 解析API响应
                const parsedResponse = this.parseResponse(response);
                
                console.log('解析后的响应:', parsedResponse);
                
                // 确保所有输出标签都有内容
                const completeResponse = this.ensureAllTags(parsedResponse, outputTags);
                
                console.log('确保所有标签后的响应:', completeResponse);
                
                // 根据输出标签分发给对应的小助手
                this.distributeResponses(item.assistantIds, item.requestIds, completeResponse);
            } catch (error) {
                console.error('处理批量请求失败:', error);
                // 处理错误
                item.requestIds.forEach(requestId => {
                    const callback = this.responseCallbacks[requestId];
                    if (callback) {
                        callback.reject(error);
                        delete this.responseCallbacks[requestId];
                    }
                });
            }
        }
    }

    // 确保所有输出标签都有内容
    ensureAllTags(response, outputTags) {
        const result = { ...response };
        
        if (outputTags && outputTags.length > 0) {
            outputTags.forEach(tag => {
                if (result[tag] === undefined || result[tag] === null || result[tag] === '') {
                    // 为缺失的标签生成默认内容
                    result[tag] = this.generateDefaultTagContent(tag);
                }
            });
        }
        
        return result;
    }

    // 生成默认标签内容
    generateDefaultTagContent(tag) {
        switch(tag) {
            case '新故事内容':
                return '故事内容正在生成中...';
            case '剧情建议':
                return '剧情建议正在生成中...';
            case '角色日记':
                return '角色日记正在生成中...';
            case '角色描述':
                return '角色描述正在生成中...';
            case '角色性格':
                return '角色性格正在生成中...';
            case '角色背景':
                return '角色背景正在生成中...';
            case '角色关系':
                return '角色关系正在生成中...';
            case '场景描写示例':
                return '场景描写示例正在生成中...';
            case '创作者笔记':
                return '创作者笔记正在生成中...';
            case '角色标签':
                return '角色标签正在生成中...';
            case '角色数值':
                return '角色数值正在生成中...';
            case '更新后角色数值':
                return '更新后角色数值正在生成中...';
            case '更新后时间':
                return new Date().toLocaleString('zh-CN');
            case '临时角色名称':
                return '临时角色名称正在生成中...';
            case '临时角色描述':
                return '临时角色描述正在生成中...';
            case '临时角色性格':
                return '临时角色性格正在生成中...';
            case '临时角色标签':
                return '临时角色标签正在生成中...';
            case '角色是否杀青':
                return '角色是否杀青正在判断中...';
            case '生成日记':
                return '生成日记正在进行中...';
            case '最近记录':
                return '最近记录正在保存中...';
            default:
                return '内容正在生成中...';
        }
    }

    // 构建增强提示词
    buildEnhancedPrompt(assistantIds, requestData, tagContentMap) {
        let prompt = '';
        
        // 添加任务说明
        prompt += `# 任务说明
`;
        prompt += `你是一个多任务处理助手，需要同时满足多个小助手的需求。
`;
        prompt += `请仔细阅读所有输入标签内容，然后按照输出标签格式返回完整的内容。

`;
        
        // 添加所有小助手的信息
        prompt += `# 小助手需求
`;
        assistantIds.forEach(assistantId => {
            const assistantInfo = this.getAssistantInfo(assistantId);
            if (assistantInfo) {
                prompt += `## ${assistantInfo.name}\n`;
                prompt += `**角色**: ${assistantInfo.name}\n`;
                prompt += `**背景**: ${assistantInfo.profile?.background || ''}\n\n`;
            }
        });
        
        // 添加输入标签内容
        prompt += `# 输入标签内容
`;
        Object.entries(tagContentMap).forEach(([tag, content]) => {
            prompt += `## [${tag}]\n`;
            prompt += `${typeof content === 'object' ? JSON.stringify(content, null, 2) : content}\n\n`;
        });
        
        // 添加核心任务
        prompt += `# 核心任务
`;
        prompt += requestData.prompt || '';
        
        // 添加输出标签要求
        if (requestData.outputTags && requestData.outputTags.length > 0) {
            prompt += `\n\n# 输出要求\n`;
            prompt += `请严格按照以下输出标签格式返回内容，确保每个标签都有详细的对应内容：\n\n`;
            requestData.outputTags.forEach(tag => {
                prompt += `【${tag}】详细的对应内容\n`;
            });
            prompt += `\n# 重要要求\n`;
            prompt += `1. 请确保返回所有输出标签的内容，不要遗漏任何一个标签\n`;
            prompt += `2. 每个标签的内容要详细、具体，符合输入标签中的信息\n`;
            prompt += `3. 输出格式要严格按照标签格式，每个标签占一行\n`;
            prompt += `4. 不要添加任何额外的说明或解释文字\n`;
            prompt += `5. 确保内容连贯、逻辑清晰，符合故事的整体风格\n`;
        }
        
        return prompt;
    }

    // 解析API响应
    parseResponse(response) {
        try {
            // 尝试解析为JSON
            if (typeof response === 'string') {
                console.log('开始解析响应:', response.substring(0, 200) + '...');
                
                // 首先尝试提取标签格式的内容 - 支持中英文标签
                const tagPattern = /【([^\]】]+)】\s*(.+?)(?=【|$)/gs;
                const parsed = {};
                let match;
                
                while ((match = tagPattern.exec(response)) !== null) {
                    const tagName = match[1].trim();
                    const tagContent = match[2].trim();
                    parsed[tagName] = tagContent;
                }
                
                // 如果解析到标签内容，返回解析结果
                if (Object.keys(parsed).length > 0) {
                    console.log('解析到标签格式内容:', Object.keys(parsed));
                    return parsed;
                }
                
                // 尝试解析为JSON
                try {
                    const jsonData = JSON.parse(response);
                    console.log('解析为JSON成功');
                    // 检查是否是标准的OpenAI格式响应
                    if (jsonData.choices && jsonData.choices.length > 0 && jsonData.choices[0].message && jsonData.choices[0].message.content) {
                        console.log('是标准OpenAI格式响应');
                        return this.parseResponse(jsonData.choices[0].message.content);
                    }
                    return jsonData;
                } catch (e) {
                    console.log('不是JSON格式，返回原始响应');
                    // 如果不是JSON，返回原始响应
                    return { content: response };
                }
            } else if (typeof response === 'object' && response !== null) {
                // 如果是对象，检查是否是标准的OpenAI格式响应
                if (response.choices && response.choices.length > 0 && response.choices[0].message && response.choices[0].message.content) {
                    console.log('是标准OpenAI格式响应对象');
                    return this.parseResponse(response.choices[0].message.content);
                }
                console.log('是对象格式响应');
                return response;
            }
            console.log('返回原始响应');
            return response;
        } catch (error) {
            console.error('解析响应失败:', error);
            return { content: response };
        }
    }

    // 分发响应给对应的小助手
    distributeResponses(assistantIds, requestIds, parsedResponse) {
        console.log('开始分发响应:', { assistantIds, requestIds });
        
        // 创建 assistantId -> requestId 的映射
        const assistantRequestMap = {};
        assistantIds.forEach((assistantId, index) => {
            assistantRequestMap[assistantId] = requestIds[index];
        });
        
        // 为每个小助手准备响应
        assistantIds.forEach(assistantId => {
            const requestId = assistantRequestMap[assistantId];
            const callback = this.responseCallbacks[requestId];
            
            if (callback) {
                // 获取小助手的输出标签
                const assistantInfo = this.getAssistantInfo(assistantId);
                let assistantResponse = {};
                
                // 提取小助手需要的输出标签内容
                if (assistantInfo && assistantInfo.outputTags) {
                    assistantInfo.outputTags.forEach(tag => {
                        if (parsedResponse[tag] !== undefined) {
                            assistantResponse[tag] = parsedResponse[tag];
                        } else {
                            assistantResponse[tag] = this.generateDefaultTagContent(tag);
                        }
                    });
                    
                    // 如果没有从解析结果中找到任何标签内容，返回完整响应作为后备
                    const foundTags = assistantInfo.outputTags.filter(tag => parsedResponse[tag] !== undefined);
                    if (foundTags.length === 0) {
                        console.log(`小助手 ${assistantId} 没有找到匹配的标签，使用完整响应`);
                        assistantResponse = { ...parsedResponse };
                    }
                } else {
                    // 如果没有小助手信息，返回完整响应
                    assistantResponse = parsedResponse;
                }
                
                console.log(`分发响应给 ${assistantId}:`, Object.keys(assistantResponse));
                callback.resolve(assistantResponse);
                delete this.responseCallbacks[requestId];
            } else {
                console.warn(`未找到请求 ${requestId} 的回调`);
            }
        });
    }

    // 收集标签对应的内容
    collectTagContent(assistantIds, requestData) {
        const tagContentMap = {};
        const worldId = localStorage.getItem('currentWorldId');
        
        // 辅助函数：从存储获取数据
        const getStorageData = () => {
            if (typeof storage !== 'undefined') {
                let allStories = { stories: [] };
                
                // 获取最近故事记录
                if (storage.getRecentStories) {
                    const recentStories = storage.getRecentStories();
                    allStories = { stories: recentStories };
                }
                
                return {
                    world: worldId && storage.getWorldById ? storage.getWorldById(worldId) : null,
                    characters: worldId && storage.getCharactersByWorldId ? storage.getCharactersByWorldId(worldId) : [],
                    allStories: allStories
                };
            }
            return { world: null, characters: [], allStories: { stories: [] } };
        };
        
        const storageData = getStorageData();
        
        // 收集输入标签内容
        if (requestData.inputTags && Array.isArray(requestData.inputTags)) {
            requestData.inputTags.forEach(tag => {
                switch (tag) {
                    case '故事设置':
                        tagContentMap[tag] = requestData.params?.storySettings || 
                            (storageData.world?.settings?.storySettings || '');
                        break;
                    case '角色信息':
                        tagContentMap[tag] = requestData.params?.characterInfo || 
                            this.formatCharacterInfo(storageData.characters);
                        break;
                    case '故事上下文':
                        tagContentMap[tag] = requestData.context || 
                            requestData.params?.storyContext || '';
                        break;
                    case '所有故事内容':
                        tagContentMap[tag] = requestData.params?.allStoryContent || 
                            this.formatAllStories(storageData.allStories);
                        break;
                    case '最新故事内容':
                        tagContentMap[tag] = requestData.params?.latestStoryContent || 
                            requestData.params?.currentStoryContent || '';
                        break;
                    case '当前故事内容':
                        tagContentMap[tag] = requestData.params?.currentStoryContent || 
                            requestData.context || '';
                        break;
                    case '角色描述':
                        tagContentMap[tag] = requestData.params?.characterDescription || 
                            this.formatCharacterDescriptions(storageData.characters);
                        break;
                    case '角色数值':
                        tagContentMap[tag] = requestData.params?.characterStats || 
                            this.formatCharacterStats(storageData.characters);
                        break;
                    case '日记设置':
                        tagContentMap[tag] = requestData.params?.diarySettings || 
                            (storageData.world?.settings?.diarySettings || '');
                        break;
                    case '当前时间':
                        tagContentMap[tag] = requestData.params?.currentTime || 
                            this.getCurrentWorldTime(worldId);
                        break;
                    case '故事卡片':
                        tagContentMap[tag] = requestData.params?.storyCards || 
                            this.formatStoryCards(storageData.allStories);
                        break;
                    case '临时角色库':
                        tagContentMap[tag] = requestData.params?.tempCharacterLibrary || 
                            this.formatTemporaryCharacters(storageData.characters);
                        break;
                    case '通用上下文':
                        tagContentMap[tag] = requestData.params?.generalContext || 
                            requestData.context || '';
                        break;
                    case '用户输入':
                        tagContentMap[tag] = requestData.userInput || '';
                        break;
                    case '提示词':
                        tagContentMap[tag] = requestData.prompt || '';
                        break;
                    case '场景描述':
                        tagContentMap[tag] = requestData.params?.sceneDescription || 
                            requestData.context || '';
                        break;
                    case '故事类型和风格设置':
                        tagContentMap[tag] = requestData.params?.storyTypeAndStyle || 
                            this.formatStoryTypeAndStyle(storageData.world);
                        break;
                    case '时间流逝速度':
                        tagContentMap[tag] = requestData.params?.timeSpeed || 
                            (storageData.world?.settings?.timeSpeed || '1');
                        break;
                    case '时间更新间隔':
                        tagContentMap[tag] = requestData.params?.timeInterval || 
                            (storageData.world?.settings?.timeInterval || '60');
                        break;
                    case '关键词':
                        tagContentMap[tag] = requestData.params?.keywords || 
                            this.formatKeywords(storageData.world);
                        break;
                    case '数值配置':
                        tagContentMap[tag] = requestData.params?.statConfig || 
                            this.formatStatConfig(storageData.characters);
                        break;
                    case '玩法':
                        tagContentMap[tag] = requestData.params?.gameplay || '';
                        break;
                    case '角色描述模板':
                        tagContentMap[tag] = requestData.params?.characterTemplate || 
                            (storageData.world?.settings?.characterTemplate || '');
                        break;
                    case '角色生成规则':
                        tagContentMap[tag] = requestData.params?.characterRules || 
                            (storageData.world?.settings?.characterRules || '');
                        break;
                    case '剧情建议模板':
                        tagContentMap[tag] = requestData.params?.plotTemplate || 
                            (storageData.world?.settings?.plotTemplate || '');
                        break;
                    case '时间线索关键词和规则':
                        tagContentMap[tag] = requestData.params?.timeRules || 
                            (storageData.world?.settings?.timeRules || '');
                        break;
                    case 'context':
                        tagContentMap[tag] = requestData.context || '';
                        break;
                    case 'userInput':
                        tagContentMap[tag] = requestData.userInput || '';
                        break;
                    case 'prompt':
                        tagContentMap[tag] = requestData.prompt || '';
                        break;
                    case 'characterInfo':
                        tagContentMap[tag] = requestData.params?.characterInfo || 
                            this.formatCharacterInfo(storageData.characters);
                        break;
                    case 'messages':
                        tagContentMap[tag] = requestData.params?.messages || [];
                        break;
                    case 'scene':
                        tagContentMap[tag] = requestData.params?.scene || '';
                        break;
                    case 'content':
                        tagContentMap[tag] = requestData.params?.content || '';
                        break;
                    default:
                        tagContentMap[tag] = requestData.params?.[tag] || 
                            requestData.context || '';
                }
            });
        }
        
        console.log('收集到的标签内容:', Object.keys(tagContentMap));
        return tagContentMap;
    }
    
    // 格式化角色信息
    formatCharacterInfo(characters) {
        if (!characters || characters.length === 0) return '暂无角色信息';
        
        return characters.map(char => {
            const profile = char.dynamicProfile || char.fixedProfile || char.profile || {};
            return `角色名称: ${char.name}
角色描述: ${profile.description || '无'}
性格: ${profile.personality || '无'}
背景: ${profile.background || '无'}
标签: ${profile.tags ? profile.tags.join(', ') : '无'}
${char.isMain ? '(主角)' : ''} ${char.isTemporary ? '(临时角色)' : ''}`;
        }).join('\n\n');
    }
    
    // 格式化所有故事
    formatAllStories(storyArchive) {
        if (!storyArchive || !storyArchive.stories || storyArchive.stories.length === 0) {
            return '暂无故事内容';
        }
        
        return storyArchive.stories.map(story => {
            return `标题: ${story.title || '无标题'}
内容: ${story.content || story.story || ''}
时间: ${story.date || ''}`;
        }).join('\n\n');
    }
    
    // 格式化角色描述
    formatCharacterDescriptions(characters) {
        if (!characters || characters.length === 0) return '暂无角色描述';
        
        return characters.map(char => {
            const profile = char.dynamicProfile || char.fixedProfile || char.profile || {};
            return `${char.name}: ${profile.description || '无描述'}`;
        }).join('\n');
    }
    
    // 格式化角色数值
    formatCharacterStats(characters) {
        if (!characters || characters.length === 0) return '暂无角色数值';
        
        return characters.map(char => {
            if (!char.stats || char.stats.length === 0) {
                return `${char.name}: 无数值`;
            }
            const statsStr = char.stats.map(stat => `${stat.name}: ${stat.value}`).join(', ');
            return `${char.name}: ${statsStr}`;
        }).join('\n');
    }
    
    // 获取当前世界时间
    getCurrentWorldTime(worldId) {
        if (!worldId) return new Date().toLocaleString('zh-CN');
        
        try {
            const timeData = localStorage.getItem(`worldTime_${worldId}`);
            if (timeData) {
                const time = JSON.parse(timeData);
                return `${time.year}年${time.month}月${time.day}日 ${time.hour}:${String(time.minute).padStart(2, '0')}`;
            }
        } catch (e) {
            console.error('获取世界时间失败:', e);
        }
        
        return new Date().toLocaleString('zh-CN');
    }
    
    // 格式化故事卡片
    formatStoryCards(storyArchive) {
        if (!storyArchive || !storyArchive.stories || storyArchive.stories.length === 0) {
            return '暂无故事卡片';
        }
        
        return JSON.stringify(storyArchive.stories, null, 2);
    }
    
    // 格式化临时角色
    formatTemporaryCharacters(characters) {
        if (!characters || characters.length === 0) return '暂无临时角色';
        
        const tempChars = characters.filter(char => char.isTemporary);
        if (tempChars.length === 0) return '暂无临时角色';
        
        return tempChars.map(char => {
            const profile = char.dynamicProfile || char.fixedProfile || char.profile || {};
            return `临时角色: ${char.name}
描述: ${profile.description || '无'}
性格: ${profile.personality || '无'}`;
        }).join('\n\n');
    }
    
    // 格式化故事类型和风格
    formatStoryTypeAndStyle(world) {
        if (!world || !world.settings) return '类型: 奇幻\n风格: 冒险';
        
        return `类型: ${world.settings.storyTypes?.join(', ') || '奇幻'}
风格: ${world.settings.genres?.join(', ') || '冒险'}`;
    }
    
    // 格式化关键词
    formatKeywords(world) {
        if (!world || !world.settings || !world.settings.keywords) {
            return '无关键词配置';
        }
        
        return world.settings.keywords.map(k => 
            `关键词: ${k.word}, 玩法: ${k.cg?.玩法 || '无'}`
        ).join('\n');
    }
    
    // 格式化数值配置
    formatStatConfig(characters) {
        if (!characters || characters.length === 0) return '暂无数值配置';
        
        const allStats = [];
        characters.forEach(char => {
            if (char.stats && char.stats.length > 0) {
                char.stats.forEach(stat => {
                    if (!allStats.find(s => s.name === stat.name)) {
                        allStats.push({ name: stat.name, value: stat.value });
                    }
                });
            }
        });
        
        if (allStats.length === 0) return '暂无数值配置';
        
        return allStats.map(stat => `${stat.name}: ${stat.value}`).join('\n');
    }



    // 获取小助手状态
    getAssistantStatus(assistantId) {
        // 返回小助手的状态信息
        return { status: 'active' };
    }

    // 监控性能
    monitorPerformance() {
        // 监控API调用性能
        console.log('监控性能...');
    }
}

// 导出模块
export default AssistantManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssistantManager;
} else if (typeof window !== 'undefined') {
    window.AssistantManager = new AssistantManager();
}