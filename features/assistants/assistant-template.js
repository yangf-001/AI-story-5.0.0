// 统一小助手模板类
import AssistantBase from './assistant-base.js';

class AssistantTemplate extends AssistantBase {
    constructor(worldId) {
        super(worldId);
        this.id = '';
        this.name = '';
        this.color = '';
        this.settings = this.loadSettings();
        this.userPrompts = this.loadUserPrompts();
    }

    loadSettings() {
        const storedAssistants = localStorage.getItem(`assistants_${this.worldId}`);
        if (storedAssistants) {
            try {
                const assistants = JSON.parse(storedAssistants);
                const assistant = assistants.find(a => a.id === this.id);
                if (assistant && assistant.settings) {
                    return assistant.settings;
                }
            } catch (error) {
                console.error('解析assistants存储失败:', error);
            }
        }

        return {
            enabled: true,
            autoUpdate: false,
            apiEnabled: true,
            userPromptsEnabled: true
        };
    }

    loadUserPrompts() {
        const storedPrompts = localStorage.getItem(`assistant_prompts_${this.worldId}_${this.id}`);
        if (storedPrompts) {
            try {
                return JSON.parse(storedPrompts);
            } catch (error) {
                console.error('解析用户提示词存储失败:', error);
            }
        }

        return {
            prompt1: '请提供详细的背景信息',
            prompt2: '请描述角色的性格特点',
            prompt3: '请说明故事的发展方向',
            prompt4: '请指定场景的氛围',
            prompt5: '请提供关键情节点',
            prompt6: '请描述角色之间的关系',
            prompt7: '请指定故事的风格',
            prompt8: '请说明期望的结局类型',
            prompt9: '请添加其他重要信息'
        };
    }

    saveUserPrompts() {
        localStorage.setItem(`assistant_prompts_${this.worldId}_${this.id}`, JSON.stringify(this.userPrompts));
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

        const index = assistants.findIndex(a => a.id === this.id);
        if (index >= 0) {
            assistants[index] = {
                ...assistants[index],
                settings: this.settings
            };
        } else {
            assistants.push({
                id: this.id,
                name: this.name,
                description: this.getDescription(),
                profile: this.getProfile(),
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

    updateUserPrompts(newPrompts) {
        this.userPrompts = {
            ...this.userPrompts,
            ...newPrompts
        };
        this.saveUserPrompts();
    }

    getDescription() {
        return '小助手';
    }

    getProfile() {
        return {
            personality: '专业、高效、乐于助人',
            background: '我是一个智能小助手，帮助你完成各种任务。',
            tags: ['智能助手', '任务处理']
        };
    }

    // 构建统一的提示词模板
    buildPrompt(context, userInputs) {
        let prompt = `你是${this.name}，负责${this.getDescription()}。

`;
        
        // 添加小助手的性格和背景
        const profile = this.getProfile();
        prompt += `性格: ${profile.personality}
`;
        prompt += `背景: ${profile.background}

`;
        
        // 添加上下文
        prompt += `上下文:
${context || '无'}

`;
        
        // 添加用户自定义提示词
        if (userInputs && this.settings.userPromptsEnabled) {
            prompt += `用户输入:
`;
            for (let i = 1; i <= 9; i++) {
                const input = userInputs[`prompt${i}`];
                if (input) {
                    prompt += `${i}. ${input}\n`;
                }
            }
            prompt += `
`;
        }
        
        // 添加通用要求
        prompt += `要求:
`;
        prompt += `1. 提供详细、专业的回答
`;
        prompt += `2. 内容要符合上下文和用户需求
`;
        prompt += `3. 语言表达清晰、流畅
`;
        prompt += `4. 提供有创意的解决方案
`;
        
        // 添加具体要求
        prompt += this.getSpecificRequirements();
        
        return prompt;
    }

    getSpecificRequirements() {
        return '';
    }

    // 统一的API调用方法
    async callAPI(prompt) {
        try {
            // 检查API密钥是否配置
            if (!window.api || !window.api.config || !window.api.config.apiKey) {
                throw new Error('API密钥未配置');
            }
            
            const response = await window.api.callAPI('user', prompt);
            return response;
        } catch (error) {
            console.error(`${this.name} API调用失败:`, error);
            throw error;
        }
    }

    // 统一的处理流程
    async process(context, userInputs) {
        if (!this.settings.enabled) {
            return { success: false, message: `${this.name} 已禁用` };
        }
        
        try {
            // 1. 构建提示词
            const prompt = this.buildPrompt(context, userInputs);
            
            // 2. 调用API
            const apiResponse = await this.callAPI(prompt);
            
            // 3. 分析API响应
            const analysis = this.analyzeResponse(apiResponse);
            
            // 4. 生成输出
            const output = this.generateOutput(analysis);
            
            return {
                success: true,
                prompt: prompt,
                apiResponse: apiResponse,
                analysis: analysis,
                output: output
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '处理失败'
            };
        }
    }

    // 分析API响应
    analyzeResponse(response) {
        return {
            raw: response,
            processed: response
        };
    }

    // 生成输出
    generateOutput(analysis) {
        return analysis.processed;
    }

    // 生成用户提示词设置面板
    generateUserPromptsHTML() {
        return `
            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">用户自定义提示词</h4>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                    ${this.generateTextarea('prompt1', '1. 提示词1', this.userPrompts.prompt1)}
                    ${this.generateTextarea('prompt2', '2. 提示词2', this.userPrompts.prompt2)}
                    ${this.generateTextarea('prompt3', '3. 提示词3', this.userPrompts.prompt3)}
                    ${this.generateTextarea('prompt4', '4. 提示词4', this.userPrompts.prompt4)}
                    ${this.generateTextarea('prompt5', '5. 提示词5', this.userPrompts.prompt5)}
                    ${this.generateTextarea('prompt6', '6. 提示词6', this.userPrompts.prompt6)}
                    ${this.generateTextarea('prompt7', '7. 提示词7', this.userPrompts.prompt7)}
                    ${this.generateTextarea('prompt8', '8. 提示词8', this.userPrompts.prompt8)}
                    ${this.generateTextarea('prompt9', '9. 提示词9', this.userPrompts.prompt9)}
                </div>
            </div>
        `;
    }

    // 生成设置面板HTML
    generateSettingsHTML(settings) {
        return `
            <h3 style="color: ${this.color};">${this.name}设置</h3>
            ${this.generateCheckbox('assistant-enabled', `启用${this.name}`, settings.enabled, this.color)}
            ${this.generateCheckbox('api-enabled', '启用API调用', settings.apiEnabled || true)}
            ${this.generateCheckbox('user-prompts-enabled', '启用用户自定义提示词', settings.userPromptsEnabled || true)}
            ${this.generateCheckbox('assistant-auto-update', '自动更新', settings.autoUpdate)}
            ${this.generateTextInput('assistant-description', '小助手描述', settings.description)}
            ${this.generateUserPromptsHTML()}
            ${this.generateButton('save-assistant-settings', '保存小助手设置', `background-color: ${this.color}; color: white;`)}
        `;
    }

    // 绑定设置面板事件
    bindSettingsEvents() {
        // 绑定用户提示词输入事件
        for (let i = 1; i <= 9; i++) {
            const textarea = document.getElementById(`prompt${i}`);
            if (textarea) {
                textarea.addEventListener('input', (e) => {
                    this.userPrompts[`prompt${i}`] = e.target.value;
                });
            }
        }
    }

    // 保存设置的统一方法
    saveAssistantSettings() {
        // 收集设置
        const enabled = document.getElementById('assistant-enabled')?.checked || false;
        const apiEnabled = document.getElementById('api-enabled')?.checked || true;
        const userPromptsEnabled = document.getElementById('user-prompts-enabled')?.checked || true;
        const autoUpdate = document.getElementById('assistant-auto-update')?.checked || false;
        const description = document.getElementById('assistant-description')?.value || '';
        
        // 收集用户提示词
        const userPrompts = {};
        for (let i = 1; i <= 9; i++) {
            const textarea = document.getElementById(`prompt${i}`);
            if (textarea) {
                userPrompts[`prompt${i}`] = textarea.value;
            }
        }
        
        // 更新设置
        this.updateSettings({
            enabled,
            apiEnabled,
            userPromptsEnabled,
            autoUpdate,
            description
        });
        
        // 更新用户提示词
        this.updateUserPrompts(userPrompts);
        
        // 显示保存成功消息
        this.showMessage(`${this.name}设置保存成功`);
    }

    // 显示消息
    showMessage(message) {
        // 实现消息显示逻辑
        console.log(message);
        // 可以添加更复杂的消息显示，如弹出提示等
    }
}

// 导出模块
export default AssistantTemplate;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssistantTemplate;
} else if (typeof window !== 'undefined') {
