// 故事小助手模块
import AssistantBase from '../assistant-base.js';

class StoryAssistant extends AssistantBase {
    constructor(worldId) {
        super(worldId);
        this.id = 'story-assistant';
        this.name = '故事小助手';
        this.color = '#8b5cf6';
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const storedAssistants = localStorage.getItem(`assistants_${this.worldId}`);
        if (storedAssistants) {
            try {
                const assistants = JSON.parse(storedAssistants);
                const storyAssistant = assistants.find(a => a.id === 'story-assistant');
                if (storyAssistant && storyAssistant.settings) {
                    return storyAssistant.settings;
                }
            } catch (error) {
                console.error('解析assistants存储失败:', error);
            }
        }

        return {
            enabled: true,
            autoUpdate: false,
            storyTypes: ['奇幻', '科幻', '现实', '悬疑', '爱情'],
            genres: ['冒险', '喜剧', 'drama', '恐怖', '浪漫'],
            fixedCharacterRatio: 70,
            temporaryCharacterRatio: 30,
            summarySettings: {
                enabled: true,
                style: '简洁', // 简洁、详细、文艺、专业
                format: '段落', // 段落、列表、对话式
                wordCount: 200, // 默认字数
                includeCharacters: true, // 是否包含角色
                includePlot: true, // 是否包含情节
                includeThemes: false // 是否包含主题
            }
        };
    }

    saveSettings() {
        const storedAssistants = localStorage.getItem(`assistants_${this.worldId}`);
        let assistants = [];
        if (storedAssistants) {
            try {
                assistants = JSON.parse(storedAssistants);
            } catch (error) {
                console.error('解析assistants存储失败:', error);
            }
        }

        const index = assistants.findIndex(a => a.id === 'story-assistant');
        if (index >= 0) {
            assistants[index] = {
                ...assistants[index],
                settings: this.settings
            };
        } else {
            assistants.push({
                id: 'story-assistant',
                name: '故事小助手',
                description: '管理故事的剧情和发展',
                profile: {
                    personality: '创意、想象力丰富、善于构建剧情',
                    background: '我是专门负责管理故事的小助手，帮助你构建和发展故事情节。',
                    tags: ['故事管理', '剧情构建', '创意生成']
                },
                settings: this.settings
            });
        }

        localStorage.setItem(`assistants_${this.worldId}`, JSON.stringify(assistants));
    }

    updateSettings(newSettings) {
        this.settings = {
            ...this.settings,
            ...newSettings
        };
        this.saveSettings();
    }

    // 添加自定义故事类型
    addStoryType(type) {
        if (!this.settings.enabled || !type) return false;

        if (!this.settings.storyTypes.includes(type)) {
            this.settings.storyTypes.push(type);
            this.saveSettings();
            return true;
        }
        return false;
    }

    // 添加自定义故事风格
    addGenre(genre) {
        if (!this.settings.enabled || !genre) return false;

        if (!this.settings.genres.includes(genre)) {
            this.settings.genres.push(genre);
            this.saveSettings();
            return true;
        }
        return false;
    }

    // 生成故事大纲
    generateStoryOutline(title, type, genre) {
        if (!this.settings.enabled) return null;

        // 确保类型和风格有效
        const validType = this.settings.storyTypes.includes(type) ? type : this.settings.storyTypes[0];
        const validGenre = this.settings.genres.includes(genre) ? genre : this.settings.genres[0];

        // 生成大纲
        const outline = {
            title: title || `${validType}${validGenre}故事`,
            type: validType,
            genre: validGenre,
            chapters: [
                {
                    title: '第一章：开端',
                    description: '介绍主要角色和故事背景'
                },
                {
                    title: '第二章：发展',
                    description: '故事矛盾开始显现'
                },
                {
                    title: '第三章：高潮',
                    description: '故事达到最高冲突点'
                },
                {
                    title: '第四章：结局',
                    description: '故事矛盾解决，给出结局'
                }
            ]
        };

        return outline;
    }

    // 生成剧情建议
    async generatePlotSuggestion(currentPlot, characters) {
        if (!this.settings.enabled) return null;

        // 定义输入标签和输出标签
        const inputTags = ['context', 'userInput'];
        const outputTags = ['plotSuggestion', 'reasoning'];

        // 构建上下文
        const context = `当前剧情: ${currentPlot}\n主要角色: ${characters.map(c => c.name).join(', ')}`;

        // 调用API生成建议
        const response = await this.run(
            context,
            '请生成一个剧情建议',
            'suggestion',
            { context },
            inputTags,
            outputTags
        );

        // 处理响应
        if (response.plotSuggestion) {
            return response.plotSuggestion;
        }

        // 备用方案：如果API调用失败，使用本地生成
        const suggestions = [
            `${characters[0]?.name || '主角'}遇到了一个神秘的陌生人`,
            `发生了一件意想不到的事件`,
            `${characters[0]?.name || '主角'}发现了一个重要的秘密`,
            `出现了一个新的挑战需要克服`,
            `${characters[0]?.name || '主角'}与${characters[1]?.name || '另一个角色'}产生了冲突`
        ];

        // 随机选择一个建议
        const randomIndex = Math.floor(Math.random() * suggestions.length);
        return suggestions[randomIndex];
    }

    // 获取输入标签
    getInputTags() {
        return ['故事设置', '角色信息', '故事上下文', '当前故事内容', '故事类型和风格设置', '玩法'];
    }

    // 获取输出标签
    getOutputTags() {
        return ['新故事内容', '剧情建议'];
    }

    // 分析故事结构
    analyzeStoryStructure(storyContent) {
        if (!this.settings.enabled) return null;

        // 简单的故事结构分析
        const analysis = {
            length: storyContent.length,
            characterCount: (storyContent.match(/名字|角色|人物/g) || []).length,
            plotTwists: (storyContent.match(/意外|突然|没想到|出乎意料/g) || []).length,
            emotionalTones: this.analyzeEmotionalTone(storyContent)
        };

        return analysis;
    }

    // 分析情感基调
    analyzeEmotionalTone(content) {
        const positiveWords = ['开心', '快乐', '高兴', '兴奋', '幸福'];
        const negativeWords = ['悲伤', '难过', '愤怒', '恐惧', '焦虑'];
        const neutralWords = ['平静', '普通', '日常', '正常'];

        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;

        positiveWords.forEach(word => {
            const matches = content.match(new RegExp(word, 'g'));
            if (matches) positiveCount += matches.length;
        });

        negativeWords.forEach(word => {
            const matches = content.match(new RegExp(word, 'g'));
            if (matches) negativeCount += matches.length;
        });

        neutralWords.forEach(word => {
            const matches = content.match(new RegExp(word, 'g'));
            if (matches) neutralCount += matches.length;
        });

        return {
            positive: positiveCount,
            negative: negativeCount,
            neutral: neutralCount,
            dominant: positiveCount > negativeCount ? '积极' : negativeCount > positiveCount ? '消极' : '中性'
        };
    }

    // 调整角色戏份比例
    adjustCharacterRoles(characters) {
        if (!this.settings.enabled || !Array.isArray(characters)) return characters;

        // 根据设置的比例调整角色戏份
        const fixedCharacters = characters.filter(c => !c.isTemporary);
        const temporaryCharacters = characters.filter(c => c.isTemporary);

        // 计算戏份比例
        const totalCharacters = fixedCharacters.length + temporaryCharacters.length;
        const fixedRatio = this.settings.fixedCharacterRatio / 100;
        const temporaryRatio = this.settings.temporaryCharacterRatio / 100;

        // 分配戏份
        fixedCharacters.forEach(char => {
            char.screenTime = fixedRatio / fixedCharacters.length;
        });

        temporaryCharacters.forEach(char => {
            char.screenTime = temporaryRatio / temporaryCharacters.length;
        });

        return [...fixedCharacters, ...temporaryCharacters];
    }
    
    // 生成设置面板HTML
    generateSettingsHTML(settings) {
        const summarySettings = settings.summarySettings || {
            enabled: true,
            style: '简洁',
            format: '段落',
            wordCount: 200,
            includeCharacters: true,
            includePlot: true,
            includeThemes: false
        };
        
        const customPrompts = settings.customPrompts || [];
        
        return `
            <h3 style="color: ${this.color};">${this.name}设置</h3>
            ${this.generateCheckbox('assistant-enabled', `启用${this.name}`, settings.enabled, this.color)}
            
            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">故事类型</h4>
                ${this.generateLabelGroup('story-type', settings.storyTypes || ['奇幻', '科幻', '现实', '悬疑', '爱情'], this.color)}
                <div style="margin-top: var(--spacing-md);">
                    <label for="custom-story-type" style="display: block; margin-bottom: var(--spacing-sm); font-weight: 500; color: var(--text-color); font-size: var(--font-size-sm); text-transform: uppercase; letter-spacing: 0.05em;">添加自定义故事类型:</label>
                    <input type="text" id="custom-story-type" placeholder="添加自定义故事类型" style="width: 100%; padding: var(--spacing-sm); border: 1px solid #ddd6fe; border-radius: var(--border-radius-md);" />
                    ${this.generateButton('add-story-type', '添加故事类型', 'margin-top: var(--spacing-sm); background-color: #8b5cf6; color: white; padding: var(--spacing-xs) var(--spacing-sm); border: none; border-radius: var(--border-radius-md);')}
                </div>
            </div>
            
            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">故事风格</h4>
                ${this.generateLabelGroup('story-genre', settings.genres || ['冒险', '喜剧', 'drama', '恐怖', '浪漫'], this.color)}
                <div style="margin-top: var(--spacing-md);">
                    <label for="custom-genre" style="display: block; margin-bottom: var(--spacing-sm); font-weight: 500; color: var(--text-color); font-size: var(--font-size-sm); text-transform: uppercase; letter-spacing: 0.05em;">添加自定义故事风格:</label>
                    <input type="text" id="custom-genre" placeholder="添加自定义故事风格" style="width: 100%; padding: var(--spacing-sm); border: 1px solid #ddd6fe; border-radius: var(--border-radius-md);" />
                    ${this.generateButton('add-genre', '添加故事风格', 'margin-top: var(--spacing-sm); background-color: #8b5cf6; color: white; padding: var(--spacing-xs) var(--spacing-sm); border: none; border-radius: var(--border-radius-md);')}
                </div>
            </div>
            
            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">剧情比例设置</h4>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                    ${this.generateRangeInput('fixed-character-ratio', '固定角色剧情比例', 0, 100, settings.fixedCharacterRatio || 70, '%')}
                    ${this.generateRangeInput('temporary-character-ratio', '临时角色剧情比例', 0, 100, settings.temporaryCharacterRatio || 30, '%')}
                    <p style="font-size: 0.875rem; opacity: 0.7; margin-top: var(--spacing-sm);">调整固定角色和临时角色在剧情中的出现比例</p>
                </div>
            </div>
            
            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">故事总结设置</h4>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                    ${this.generateCheckbox('summary-enabled', '启用故事总结', summarySettings.enabled)}
                    
                    <div style="margin-top: var(--spacing-sm);">
                        ${this.generateSelect('summary-style', '总结风格', [
                            { value: '简洁', label: '简洁' },
                            { value: '详细', label: '详细' },
                            { value: '文艺', label: '文艺' },
                            { value: '专业', label: '专业' }
                        ], summarySettings.style, this.color)}
                    </div>
                    
                    <div style="margin-top: var(--spacing-sm);">
                        ${this.generateSelect('summary-format', '总结格式', [
                            { value: '段落', label: '段落' },
                            { value: '列表', label: '列表' },
                            { value: '对话式', label: '对话式' }
                        ], summarySettings.format, this.color)}
                    </div>
                </div>
            </div>
            
            ${this.generateTextInput('assistant-description', '小助手描述', settings.description)}
            
            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">自定义提示词</h4>
                ${Array.from({ length: 9 }, (_, index) => `
                    <div style="margin-bottom: var(--spacing-sm);">
                        <input type="text" id="custom-prompt-${index + 1}" value="${customPrompts[index] || ''}" placeholder="要求 ${index + 1}" style="width: 100%;" />
                    </div>
                `).join('')}
            </div>
            
            ${this.generateButton('save-assistant-settings', '保存小助手设置', 'background-color: #8b5cf6; color: white;')}
        `;
    }
    
    // 绑定设置面板事件
    bindSettingsEvents() {
        // 绑定固定角色剧情比例滑块事件
        const fixedRatioSlider = document.getElementById('fixed-character-ratio');
        const fixedRatioValue = document.getElementById('fixed-character-ratio-value');
        if (fixedRatioSlider && fixedRatioValue) {
            fixedRatioSlider.addEventListener('input', (e) => {
                fixedRatioValue.textContent = `${e.target.value}%`;
                // 自动调整临时角色比例，保持总和为100%
                const temporaryRatioSlider = document.getElementById('temporary-character-ratio');
                const temporaryRatioValue = document.getElementById('temporary-character-ratio-value');
                if (temporaryRatioSlider && temporaryRatioValue) {
                    const temporaryValue = 100 - parseInt(e.target.value);
                    temporaryRatioSlider.value = temporaryValue;
                    temporaryRatioValue.textContent = `${temporaryValue}%`;
                }
            });
        }
        
        // 绑定临时角色剧情比例滑块事件
        const temporaryRatioSlider = document.getElementById('temporary-character-ratio');
        const temporaryRatioValue = document.getElementById('temporary-character-ratio-value');
        if (temporaryRatioSlider && temporaryRatioValue) {
            temporaryRatioSlider.addEventListener('input', (e) => {
                temporaryRatioValue.textContent = `${e.target.value}%`;
                // 自动调整固定角色比例，保持总和为100%
                const fixedRatioSlider = document.getElementById('fixed-character-ratio');
                const fixedRatioValue = document.getElementById('fixed-character-ratio-value');
                if (fixedRatioSlider && fixedRatioValue) {
                    const fixedValue = 100 - parseInt(e.target.value);
                    fixedRatioSlider.value = fixedValue;
                    fixedRatioValue.textContent = `${fixedValue}%`;
                }
            });
        }
        
        // 绑定添加故事类型按钮事件
        const addStoryTypeBtn = document.getElementById('add-story-type');
        if (addStoryTypeBtn) {
            addStoryTypeBtn.addEventListener('click', () => this.addCustomStoryType());
        }
        
        // 绑定添加故事风格按钮事件
        const addGenreBtn = document.getElementById('add-genre');
        if (addGenreBtn) {
            addGenreBtn.addEventListener('click', () => this.addCustomGenre());
        }
    }
    
    // 添加自定义故事类型（供设置面板调用）
    addCustomStoryType() {
        const customStoryTypeInput = document.getElementById('custom-story-type');
        const customStoryType = customStoryTypeInput.value.trim();
        
        if (customStoryType) {
            if (this.addStoryType(customStoryType)) {
                alert('故事类型添加成功！');
                customStoryTypeInput.value = '';
                // 重新渲染设置面板
                const event = new CustomEvent('settingsUpdated');
                document.dispatchEvent(event);
            } else {
                alert('故事类型已存在！');
            }
        }
    }
    
    // 添加自定义故事风格（供设置面板调用）
    addCustomGenre() {
        const customGenreInput = document.getElementById('custom-genre');
        const customGenre = customGenreInput.value.trim();
        
        if (customGenre) {
            if (this.addGenre(customGenre)) {
                alert('故事风格添加成功！');
                customGenreInput.value = '';
                // 重新渲染设置面板
                const event = new CustomEvent('settingsUpdated');
                document.dispatchEvent(event);
            } else {
                alert('故事风格已存在！');
            }
        }
    }
}

// 导出模块
export default StoryAssistant;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryAssistant;
} else if (typeof window !== 'undefined') {
    window.StoryAssistant = StoryAssistant;
}