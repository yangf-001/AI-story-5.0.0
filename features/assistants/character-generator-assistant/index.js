// 人物小助手模块
import AssistantBase from '../assistant-base.js';

class CharacterGeneratorAssistant extends AssistantBase {
    constructor(worldId) {
        super(worldId);
        this.id = 'character-generator-assistant';
        this.name = '人物小助手';
        this.color = '#f59e0b';
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const storedAssistants = localStorage.getItem(`assistants_${this.worldId}`);
        if (storedAssistants) {
            try {
                const assistants = JSON.parse(storedAssistants);
                const characterGeneratorAssistant = assistants.find(a => a.id === 'character-generator-assistant');
                if (characterGeneratorAssistant && characterGeneratorAssistant.settings) {
                    return characterGeneratorAssistant.settings;
                }
            } catch (error) {
                console.error('解析assistants存储失败:', error);
            }
        }

        return {
            enabled: true,
            autoUpdate: false
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

        const index = assistants.findIndex(a => a.id === 'character-generator-assistant');
        if (index >= 0) {
            assistants[index] = {
                ...assistants[index],
                settings: this.settings
            };
        } else {
            assistants.push({
                id: 'character-generator-assistant',
                name: '人物小助手',
                description: '根据描述快速生成临时角色',
                profile: {
                    personality: '创意、高效、善于总结',
                    background: '我是专门负责生成临时角色的小助手，根据你输入的描述快速创建角色卡。',
                    tags: ['角色生成', '临时角色', '快速创建']
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

    // 根据描述生成临时角色
    async generateCharacter(description) {
        if (!this.settings.enabled || !description) return null;

        // 定义输入标签和输出标签
        const inputTags = ['context', 'userInput'];
        const outputTags = ['character', 'personality', 'background', 'tags'];

        try {
            // 构建上下文
            const context = `角色描述: ${description}`;

            // 调用API生成角色
            const response = await this.run(
                context,
                '请根据描述生成一个详细的角色',
                'analyzeCharacter',
                { characterInfo: { profile: { background: description } } },
                inputTags,
                outputTags
            );

            // 生成角色ID
            const characterId = `temp-character-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // 从API响应创建角色
            if (response.character) {
                return {
                    id: characterId,
                    name: response.character.name || '临时角色',
                    isTemporary: true,
                    isMain: false,
                    dynamicProfile: {
                        description: description,
                        personality: response.personality || '未知',
                        background: response.background || '未知',
                        tags: response.tags || []
                    },
                    createdAt: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('API生成角色失败:', error);
        }

        // 备用方案：如果API调用失败，使用本地生成
        // 生成角色ID
        const characterId = `temp-character-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 从描述中提取信息
        const extractedInfo = this.extractCharacterInfo(description);

        // 创建临时角色
        const character = {
            id: characterId,
            name: extractedInfo.name || '临时角色',
            isTemporary: true,
            isMain: false,
            dynamicProfile: {
                description: description,
                personality: extractedInfo.personality || '未知',
                background: extractedInfo.background || '未知',
                tags: extractedInfo.tags || []
            },
            createdAt: new Date().toISOString()
        };

        return character;
    }

    // 获取输入标签
    getInputTags() {
        return ['角色描述', '故事上下文', '临时角色库', '角色描述模板', '角色生成规则'];
    }

    // 获取输出标签
    getOutputTags() {
        return ['临时角色名称', '临时角色描述', '临时角色性格', '临时角色标签', '角色是否杀青'];
    }

    // 从描述中提取角色信息
    extractCharacterInfo(description) {
        const info = {
            name: '',
            personality: '',
            background: '',
            tags: []
        };

        // 简单的信息提取逻辑
        // 实际项目中可以使用更复杂的NLP技术
        if (description.includes('穿着')) {
            const clothingMatch = description.match(/穿着([^，。,\.]+)/);
            if (clothingMatch) {
                info.tags.push(`穿着${clothingMatch[1]}`);
            }
        }

        if (description.includes('性格')) {
            const personalityMatch = description.match(/性格([^，。,\.]+)/);
            if (personalityMatch) {
                info.personality = personalityMatch[1];
            }
        }

        if (description.includes('擅长')) {
            const skillMatch = description.match(/擅长([^，。,\.]+)/);
            if (skillMatch) {
                info.tags.push(`擅长${skillMatch[1]}`);
            }
        }

        // 提取可能的名字
        const nameMatch = description.match(/一个([^的]+)的/);
        if (nameMatch) {
            info.name = nameMatch[1];
        }

        return info;
    }

    // 保存临时角色
    saveTemporaryCharacter(character) {
        if (!character || !character.isTemporary) return false;

        // 获取现有角色
        const characters = storage.getCharactersByWorldId(this.worldId) || [];
        
        // 添加临时角色
        characters.push(character);
        
        // 保存到存储
        storage.saveCharacters(this.worldId, characters);
        
        return true;
    }

    // 批量生成角色
    generateMultipleCharacters(descriptions) {
        if (!this.settings.enabled || !Array.isArray(descriptions)) return [];

        return descriptions.map(description => this.generateCharacter(description)).filter(Boolean);
    }
    
    // 生成设置面板HTML
    generateSettingsHTML(settings) {
        const customPrompts = settings.customPrompts || [];
        return `
            <h3 style="color: ${this.color};">${this.name}设置</h3>
            ${this.generateCheckbox('assistant-enabled', `启用${this.name}`, settings.enabled, this.color)}
            
            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">角色生成</h4>
                <p>输入角色描述，点击生成按钮创建临时角色</p>
                ${this.generateTextarea('character-description', '角色描述', '', '例如：一个穿着黑色风衣的神秘男子，性格沉默寡言，擅长格斗')}
                ${this.generateButton('generate-character', '生成临时角色', 'background-color: #f59e0b; color: white; width: 100%; padding: var(--spacing-md);')}
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
            
            ${this.generateButton('save-assistant-settings', '保存小助手设置', 'background-color: #f59e0b; color: white;')}
        `;
    }
    
    // 绑定设置面板事件
    bindSettingsEvents() {
        const generateBtn = document.getElementById('generate-character');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateTemporaryCharacter());
        }
    }
    
    // 生成临时角色（供设置面板调用）
    generateTemporaryCharacter() {
        const description = document.getElementById('character-description').value.trim();
        if (!description) return;
        
        const character = this.generateCharacter(description);
        if (character) {
            this.saveTemporaryCharacter(character);
            alert('临时角色生成成功！');
        }
    }
}

// 导出模块
export default CharacterGeneratorAssistant;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterGeneratorAssistant;
} else if (typeof window !== 'undefined') {
    window.CharacterGeneratorAssistant = CharacterGeneratorAssistant;
}