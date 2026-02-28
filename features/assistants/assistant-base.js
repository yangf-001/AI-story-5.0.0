// 小助手基类
class AssistantBase {
    constructor(worldId) {
        this.worldId = worldId;
        this.id = ''; // 小助手唯一标识
        this.name = ''; // 小助手名称
        this.description = ''; // 小助手描述
        this.profile = {}; // 小助手人设
        this.settings = {}; // 小助手设置
        this.dataStore = {}; // 存储小助手数据
    }

    // 生成提示词
    buildPrompt(context, userInput) {
        const customPrompts = this.settings.customPrompts || [];
        let prompt = `你是${this.name}，${this.profile.background || ''}。

`;
        
        if (this.profile.personality) {
            prompt += `性格: ${this.profile.personality}
`;
        }
        
        if (this.profile.background) {
            prompt += `背景: ${this.profile.background}

`;
        }
        
        prompt += `上下文:
${context}

`;
        
        if (userInput) {
            prompt += `用户输入:
${userInput}

`;
        }
        
        prompt += `要求:
`;
        customPrompts.forEach((promptItem, index) => {
            if (promptItem) {
                prompt += `${index + 1}. ${promptItem}
`;
            }
        });
        
        return prompt;
    }

    // 处理API响应
    processResponse(response) {
        // 基础响应处理逻辑，子类可以重写
        return response;
    }

    // 生成输出
    generateOutput(processedData) {
        // 基础输出生成逻辑，子类可以重写
        return processedData;
    }

    // 运行小助手
    async run(context, userInput, type = 'default', params = {}, inputTags = null, outputTags = null) {
        // 获取输入标签和输出标签
        const finalInputTags = inputTags || this.getInputTags();
        const finalOutputTags = outputTags || this.getOutputTags();
        
        // 完整运行流程
        const prompt = this.buildPrompt(context, userInput);
        const response = await this.submitRequest({ 
            prompt, 
            context, 
            userInput, 
            type, 
            params, 
            inputTags: finalInputTags, 
            outputTags: finalOutputTags 
        });
        const processedData = this.processResponse(response);
        return this.generateOutput(processedData);
    }

    // 获取输入标签
    getInputTags() {
        // 基础输入标签，子类必须重写
        return [];
    }

    // 获取输出标签
    getOutputTags() {
        // 基础输出标签，子类必须重写
        return [];
    }

    // 生成设置HTML
    generateSettingsHTML(settings) {
        const assistantSettings = settings || this.settings || {};
        const customPrompts = assistantSettings.customPrompts || [];
        
        let html = `
            <h3>小助手设置</h3>
            <div class="form-group">
                <label for="assistant-enabled" style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    <input type="checkbox" id="assistant-enabled" ${assistantSettings.enabled ? 'checked' : ''} />
                    启用小助手
                </label>
            </div>
            <div class="form-group">
                <label for="assistant-auto-update" style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    <input type="checkbox" id="assistant-auto-update" ${assistantSettings.autoUpdate ? 'checked' : ''} />
                    自动更新
                </label>
            </div>
            <div class="form-group">
                <label>自定义提示词 (1-9条):</label>
                ${Array.from({ length: 9 }, (_, index) => `
                    <div style="margin-bottom: var(--spacing-sm);">
                        <input type="text" id="custom-prompt-${index + 1}" value="${customPrompts[index] || ''}" placeholder="要求 ${index + 1}" style="width: 100%;" />
                    </div>
                `).join('')}
            </div>
            <button id="save-assistant-settings">保存小助手设置</button>
        `;
        
        return html;
    }

    // 绑定设置事件
    bindSettingsEvents() {
        // 绑定设置面板事件，子类可以重写
    }
    
    // 向大总管提交输入
    submitRequest(requestData) {
        // 提交输入到大总管
        if (window.AssistantManager) {
            return window.AssistantManager.submitRequest(this.id, requestData);
        } else {
            console.error('大总管模块未初始化');
            return Promise.reject('大总管模块未初始化');
        }
    }

    // 通用的保存按钮绑定
    bindSaveButton(onSave) {
        const saveBtn = document.getElementById('save-assistant-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', onSave);
        }
    }

    // 生成复选框组件
    generateCheckbox(id, label, checked, color) {
        return `
            <div class="form-group">
                <label for="${id}" style="display: flex; align-items: center; gap: var(--spacing-sm); ${color ? `color: ${color};` : ''}">
                    <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} />
                    ${label}
                </label>
            </div>
        `;
    }

    // 生成选择框组件
    generateSelect(id, label, options, selectedValue, color) {
        const borderColor = color ? color : 'var(--border-color)';
        return `
            <div class="form-group">
                <label for="${id}" style="display: block; margin-bottom: var(--spacing-sm); font-weight: 500;">${label}:</label>
                <select id="${id}" style="width: 100%; padding: var(--spacing-sm); border: 1px solid ${borderColor}; border-radius: var(--border-radius-md);">
                    ${options.map(opt => `
                        <option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>${opt.label}</option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    // 生成范围输入组件
    generateRangeInput(id, label, min, max, value, suffix = '') {
        return `
            <div style="display: flex; align-items: center; gap: var(--spacing-md);">
                <label for="${id}" style="flex: 1;">${label}:</label>
                <input type="range" id="${id}" min="${min}" max="${max}" value="${value}" style="flex: 2;" />
                <span id="${id}-value" style="width: 40px; text-align: right;">${value}${suffix}</span>
            </div>
        `;
    }

    // 生成文本输入组件
    generateTextInput(id, label, value, placeholder = '') {
        return `
            <div class="form-group">
                <label for="${id}">${label}:</label>
                <input type="text" id="${id}" value="${value || ''}" placeholder="${placeholder}" />
            </div>
        `;
    }

    // 生成文本域组件
    generateTextarea(id, label, value, placeholder = '') {
        return `
            <div class="form-group">
                <label for="${id}" style="display: block; margin-bottom: var(--spacing-sm); font-weight: 500; color: var(--text-color); font-size: var(--font-size-sm); text-transform: uppercase; letter-spacing: 0.05em;">${label}:</label>
                <textarea id="${id}" placeholder="${placeholder}" style="width: 100%; min-height: 150px; margin-bottom: var(--spacing-md);">${value || ''}</textarea>
            </div>
        `;
    }

    // 生成按钮组件
    generateButton(id, label, style = '') {
        return `
            <button id="${id}" ${style ? `style="${style}"` : ''}>${label}</button>
        `;
    }

    // 生成标签组组件
    generateLabelGroup(id, items, color) {
        const borderColor = color ? color : 'var(--border-color)';
        const backgroundColor = color ? this.getLightColor(color) : 'var(--background-light)';
        
        return `
            <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-sm);">
                ${items.map((item, index) => `
                    <label for="${id}-${index}" style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; border: 1px solid ${borderColor}; border-radius: 16px; background-color: ${backgroundColor};">
                        <input type="checkbox" id="${id}-${index}" checked />
                        ${item}
                    </label>
                `).join('')}
            </div>
        `;
    }

    // 获取浅色版本的颜色
    getLightColor(color) {
        // 简单的颜色转换，实际项目中可能需要更复杂的实现
        const colorMap = {
            '#be185d': '#fdf2f8',
            '#3b82f6': '#eff6ff',
            '#f59e0b': '#fffbeb',
            '#8b5cf6': '#f5f3ff',
            '#10b981': '#ecfdf5',
            '#6366f1': '#f5f3ff'
        };
        return colorMap[color] || '#f9fafb';
    }

    // 保存数据
    saveData(key, data) {
        this.dataStore[key] = data;
        // 可以添加持久化逻辑
    }

    // 读取数据
    loadData(key) {
        return this.dataStore[key];
    }

    // 编辑内容
    editContent(key, content) {
        this.saveData(key, content);
        return content;
    }

    // 获取编辑权限
    hasEditPermission() {
        // 默认为true，子类可以根据需要重写
        return true;
    }
}

// 导出模块
export default AssistantBase;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssistantBase;
} else if (typeof window !== 'undefined') {
    window.AssistantBase = AssistantBase;
}