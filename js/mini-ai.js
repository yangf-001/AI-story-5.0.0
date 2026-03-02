class MiniAI {
    constructor() {
        this.config = this.loadConfig();
    }

    getEndpoint() {
        let endpoint = this.config.apiEndpoint;
        
        if (!endpoint) {
            const endpoints = {
                'DeepSeek': 'https://api.deepseek.com/v1/chat/completions',
                'OpenAI': 'https://api.openai.com/v1/chat/completions',
                'Claude': 'https://api.anthropic.com/v1/messages'
            };
            return endpoints[this.config.service] || endpoints['DeepSeek'];
        }
        
        if (endpoint.includes('/v1/') || endpoint.includes('/chat/') || endpoint.includes('/messages')) {
            return endpoint;
        }
        
        if (this.config.service === 'DeepSeek') {
            return endpoint + '/v1/chat/completions';
        } else if (this.config.service === 'OpenAI') {
            return endpoint + '/v1/chat/completions';
        } else if (this.config.service === 'Claude') {
            return endpoint + '/v1/messages';
        }
        
        return endpoint + '/v1/chat/completions';
    }

    loadConfig() {
        const stored = localStorage.getItem('mini_ai_config');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('加载AI配置失败:', e);
            }
        }
        
        const apiKey = localStorage.getItem('apiKey');
        const apiEndpoint = localStorage.getItem('apiEndpoint');
        const apiModel = localStorage.getItem('apiModel');
        const apiProvider = localStorage.getItem('apiProvider');
        
        let service = apiProvider || 'DeepSeek';
        // 统一格式
        service = service.charAt(0).toUpperCase() + service.slice(1).toLowerCase();
        if (service === 'Deepseek') service = 'DeepSeek';
        if (service === 'Openai') service = 'OpenAI';
        
        return {
            service: service,
            apiKey: apiKey || '',
            apiEndpoint: apiEndpoint || 'https://api.deepseek.com',
            model: apiModel || 'deepseek-chat',
            temperature: 0.7,
            maxTokens: 2048
        };
    }

    reloadConfig() {
        const apiKey = localStorage.getItem('apiKey');
        const apiEndpoint = localStorage.getItem('apiEndpoint');
        const apiModel = localStorage.getItem('apiModel');
        const apiProvider = localStorage.getItem('apiProvider');
        
        if (apiKey) this.config.apiKey = apiKey;
        if (apiEndpoint) this.config.apiEndpoint = apiEndpoint;
        if (apiModel) this.config.model = apiModel;
        if (apiProvider) {
            // 统一转为首字母大写
            this.config.service = apiProvider.charAt(0).toUpperCase() + apiProvider.slice(1).toLowerCase();
            if (this.config.service === 'Deepseek') this.config.service = 'DeepSeek';
            if (this.config.service === 'Openai') this.config.service = 'OpenAI';
        }
    }

    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('mini_ai_config', JSON.stringify(this.config));
    }

    async call(prompt, options = {}) {
        this.reloadConfig();
        
        if (!this.config.apiKey) {
            throw new Error('请先配置API密钥');
        }

        const endpoint = this.getEndpoint();

        const messages = [];

        if (options.system) {
            messages.push({ role: 'system', content: options.system });
        }
        messages.push({ role: 'user', content: prompt });

        const body = {
            model: options.model || this.config.model || 'deepseek-chat',
            messages,
            temperature: options.temperature ?? this.config.temperature,
            max_tokens: options.maxTokens ?? this.config.maxTokens
        };

        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.config.service === 'DeepSeek' || this.config.service === 'OpenAI') {
            headers['Authorization'] = 'Bearer ' + this.config.apiKey;
        } else if (this.config.service === 'Claude') {
            headers['x-api-key'] = this.config.apiKey;
            headers['anthropic-version'] = '2023-06-01';
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API错误 (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            if (this.config.service === 'Claude') {
                return data.content[0].text;
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI调用失败:', error);
            throw error;
        }
    }

    async chat(messages, options = {}) {
        this.reloadConfig();
        
        if (!this.config.apiKey) {
            throw new Error('请先配置API密钥');
        }

        const endpoint = this.getEndpoint();
        const model = options.model || this.config.model || 'deepseek-chat';

        const body = {
            model: model,
            messages,
            temperature: options.temperature ?? this.config.temperature,
            max_tokens: options.maxTokens ?? this.config.maxTokens
        };

        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.config.service === 'DeepSeek' || this.config.service === 'OpenAI') {
            headers['Authorization'] = 'Bearer ' + this.config.apiKey;
        } else if (this.config.service === 'Claude') {
            headers['x-api-key'] = this.config.apiKey;
            headers['anthropic-version'] = '2023-06-01';
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API错误 (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            if (this.config.service === 'Claude') {
                return data.content[0].text;
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI调用失败:', error);
            throw error;
        }
    }

    async test() {
        const result = await this.call('你好，请回复"连接成功"');
        return result.includes('连接成功');
    }
}

const miniAI = new MiniAI();

if (typeof window !== 'undefined') {
    window.miniAI = miniAI;
}
