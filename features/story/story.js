import AssistantsModule from '../assistants/assistants.js';

// 动态导入StatUpdateCard
let StatUpdateCard = null;
let statUpdateCardResolve = null;
const statUpdateCardPromise = new Promise((resolve) => {
    statUpdateCardResolve = resolve;
});

// 尝试获取 StatUpdateCard，如果不存在则等待
function tryGetStatUpdateCard() {
    // 首先检查 window 上是否已经有
    if (window.StatUpdateCard) {
        return Promise.resolve(window.StatUpdateCard);
    }
    
    // 尝试动态导入
    return import('../assistants/erotic-assistant/stat-update-card.js').then(() => {
        // 等待 DOM 更新
        return new Promise(resolve => {
            const check = () => {
                if (window.StatUpdateCard) {
                    resolve(window.StatUpdateCard);
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
    });
}

// 启动获取 StatUpdateCard
tryGetStatUpdateCard().then(result => {
    StatUpdateCard = result;
    console.log('[导入] StatUpdateCard 成功:', StatUpdateCard);
    if (statUpdateCardResolve) {
        statUpdateCardResolve(StatUpdateCard);
    }
}).catch(err => {
    console.error('[导入] StatUpdateCard 失败:', err);
});

class StoryModule {
    constructor() {
        this.currentStoryId = null;
        this.currentStory = null;
        this.currentWorldId = localStorage.getItem('currentWorldId');
        this.selectedCharacters = [];
        this.assistantsStatus = new Map();
        this.statUpdateCard = null;
        
        // 初始化各个管理器
        this.timeManager = new TimeManager(
            this.currentWorldId,
            storage,
            (date) => { /* 不显示时间更新消息 */ }
        );
        
        this.narrationManager = new NarrationManager();
        this.messageRenderer = new MessageRenderer(this.currentWorldId, storage);
        this.promptBuilder = new PromptBuilder();
        this.sceneAnalyzer = new SceneAnalyzer(this.currentWorldId, storage, window.api);
    }
    
    async init() {
        if (!this.currentWorldId) {
            window.location.href = '../../main/index.html';
            return;
        }
        
        // 初始化 AssistantsModule
        if (!window.assistantsModule) {
            window.assistantsModule = new AssistantsModule();
        }
        
        // 确保时间小助手可用
        this.ensureTimeAssistantLoaded();
        
        this.timeManager.initialize();
        this.bindEvents();
        this.loadCharacters();
        this.loadStoryFromUrl();
        this.loadAssistantsStatus();
        await this.initializeStatUpdateCard();
    }
    
    ensureTimeAssistantLoaded() {
        // 检查时间小助手是否已经加载
        if (!window.TimeAssistant && window.assistantsModule) {
            // 尝试从assistantsModule中获取时间小助手
            setTimeout(() => {
                this.timeManager.loadTimeAssistant();
                this.timeManager.updateTimeDisplay();
            }, 1000);
        }
    }
    
    loadAssistantsStatus() {
        const assistantsStatusContainer = document.getElementById('assistants-status');
        if (!assistantsStatusContainer) return;
        
        // 获取所有小助手
        const storedAssistants = localStorage.getItem(`assistants_${this.currentWorldId}`);
        let assistants = [];
        
        if (storedAssistants) {
            try {
                assistants = JSON.parse(storedAssistants);
            } catch (error) {
                console.error('解析小助手数据失败:', error);
            }
        }
        
        // 如果没有小助手数据，使用默认小助手
        if (assistants.length === 0) {
            if (AssistantsModule && AssistantsModule.getAssistants) {
                assistants = AssistantsModule.getAssistants(this.currentWorldId);
            } else {
                // 使用默认小助手
                assistants = [
                    { id: 'profile-assistant', name: '人设小助手', settings: { enabled: true } },
                    { id: 'time-assistant', name: '时间小助手', settings: { enabled: true } },
                    { id: 'erotic-assistant', name: '色色小助手', settings: { enabled: true } },
                    { id: 'character-generator-assistant', name: '人物小助手', settings: { enabled: true } },
                    { id: 'story-assistant', name: '故事小助手', settings: { enabled: true } },
                    { id: 'summary-assistant', name: '总结小助手', settings: { enabled: true } }
                ];
            }
        }
        
        // 过滤掉前情提要小助手和场景小助手
        assistants = assistants.filter(assistant => assistant.id !== 'context-assistant' && assistant.id !== 'scene-assistant');
        
        // 清空容器
        assistantsStatusContainer.innerHTML = '';
        
        // 显示每个小助手的状态
        assistants.forEach(assistant => {
            const currentStatus = this.assistantsStatus.get(assistant.id) || (assistant.settings?.enabled ? '' : '已禁用');
            
            const assistantStatus = document.createElement('div');
            assistantStatus.style.display = 'flex';
            assistantStatus.style.alignItems = 'center';
            assistantStatus.style.gap = '4px';
            assistantStatus.style.padding = '4px 10px';
            assistantStatus.style.borderRadius = '12px';
            assistantStatus.style.backgroundColor = 'white';
            assistantStatus.style.border = `1px solid ${assistant.settings?.enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`;
            assistantStatus.style.fontSize = '0.65rem';
            assistantStatus.style.fontWeight = '500';
            assistantStatus.style.color = assistant.settings?.enabled ? '#10b981' : '#ef4444';
            assistantStatus.style.margin = '0';
            assistantStatus.style.lineHeight = '1';
            assistantStatus.style.whiteSpace = 'nowrap';
            assistantStatus.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
            
            const statusIndicator = document.createElement('span');
            statusIndicator.style.display = 'inline-block';
            statusIndicator.style.width = '6px';
            statusIndicator.style.height = '6px';
            statusIndicator.style.borderRadius = '50%';
            statusIndicator.style.backgroundColor = assistant.settings?.enabled ? '#10b981' : '#ef4444';
            
            const statusText = document.createElement('span');
            statusText.textContent = currentStatus ? `${assistant.name} ${currentStatus}` : assistant.name;
            
            assistantStatus.appendChild(statusIndicator);
            assistantStatus.appendChild(statusText);
            assistantsStatusContainer.appendChild(assistantStatus);
        });
    }
    
    updateAssistantStatus(assistantId, status) {
        this.assistantsStatus.set(assistantId, status);
        this.loadAssistantsStatus();
    }
    
    // 初始化数值更新卡片
    async initializeStatUpdateCard() {
        console.log('[初始化] 开始初始化数值更新卡片...');
        
        // 等待StatUpdateCard加载完成
        if (!StatUpdateCard) {
            console.log('[初始化] 等待StatUpdateCard加载...');
            await statUpdateCardPromise;
        }
        
        if (typeof StatUpdateCard !== 'undefined') {
            const container = document.getElementById('stat-update-container');
            if (container) {
                this.statUpdateCard = new StatUpdateCard(container);
                console.log('[初始化] 数值更新卡片初始化成功');
            } else {
                console.warn('[初始化] stat-update-container 不存在');
            }
        } else {
            console.warn('[初始化] StatUpdateCard 类未定义');
        }
    }
    
    // 添加数值更新记录
    async addStatUpdate(characterName, statName, oldValue, newValue) {
        console.log(`[数值更新卡片] ${characterName} 的 ${statName} 从 ${oldValue} 更新为 ${newValue}`);
        
        // 如果卡片未初始化，先初始化
        if (!this.statUpdateCard) {
            console.log('[数值更新卡片] 卡片未初始化，尝试初始化...');
            await this.initializeStatUpdateCardSync();
        }
        
        if (this.statUpdateCard) {
            this.statUpdateCard.addUpdate(characterName, statName, oldValue, newValue);
        } else {
            console.warn('[数值更新卡片] statUpdateCard 不存在');
        }
    }
    
    // 同步初始化数值更新卡片（尝试初始化，如果模块未加载则等待）
    async initializeStatUpdateCardSync() {
        // 如果还没加载，等待加载完成
        if (!StatUpdateCard && statUpdateCardPromise) {
            await statUpdateCardPromise;
        }
        
        if (StatUpdateCard) {
            const container = document.getElementById('stat-update-container');
            if (container) {
                this.statUpdateCard = new StatUpdateCard(container);
                console.log('[初始化] 数值更新卡片初始化成功');
            }
        } else {
            console.warn('[初始化] StatUpdateCard 类未定义');
        }
    }
    
    bindEvents() {
        // 开始故事
        const startStoryBtn = document.getElementById('start-story');
        if (startStoryBtn) {
            startStoryBtn.addEventListener('click', () => this.startStory());
        }
        
        // 结束故事
        const endStoryBtn = document.getElementById('end-story');
        if (endStoryBtn) {
            endStoryBtn.addEventListener('click', () => this.endStory());
        }
        

        
        // 回车键发送选择
        const choiceInput = document.getElementById('choice-input');
        if (choiceInput) {
            choiceInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChoice();
                }
            });
        }
        
        // 旁白设置
        const narrationSettingsBtn = document.getElementById('narration-settings');
        if (narrationSettingsBtn) {
            narrationSettingsBtn.addEventListener('click', () => this.narrationManager.openModal());
        }
        
        const closeModalBtn = document.getElementById('close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.narrationManager.closeModal());
        }
        
        const saveNarrationBtn = document.getElementById('save-narration');
        if (saveNarrationBtn) {
            saveNarrationBtn.addEventListener('click', () => this.narrationManager.saveFromModal());
        }
        
        const narrationOutputSelect = document.getElementById('narration-output');
        if (narrationOutputSelect) {
            narrationOutputSelect.addEventListener('change', (e) => {
                const customOutputGroup = document.getElementById('custom-output-group');
                if (customOutputGroup) {
                    customOutputGroup.style.display = e.target.value === '自定义' ? 'block' : 'none';
                }
            });
        }
        
        // 时间编辑
        const currentTimeElement = document.querySelector('#currentTime');
        if (currentTimeElement) {
            const timeDisplay = currentTimeElement.parentElement;
            if (timeDisplay) {
                timeDisplay.addEventListener('click', () => this.timeManager.editTime());
            }
        }
        
        const closeTimeModalBtn = document.getElementById('close-time-modal');
        if (closeTimeModalBtn) {
            closeTimeModalBtn.addEventListener('click', () => this.timeManager.closeTimeModal());
        }
        
        const saveTimeBtn = document.getElementById('save-time');
        if (saveTimeBtn) {
            saveTimeBtn.addEventListener('click', () => this.timeManager.saveTime());
        }
        
        // 切换滑动模式
        const toggleScrollBtn = document.getElementById('toggle-scroll');
        if (toggleScrollBtn) {
            toggleScrollBtn.addEventListener('click', () => this.toggleScrollMode());
        }
        
        // 滑动控制按钮
        const scrollLeftBtn = document.getElementById('scroll-left');
        if (scrollLeftBtn) {
            scrollLeftBtn.addEventListener('click', () => this.scrollLeft());
        }
        
        const scrollRightBtn = document.getElementById('scroll-right');
        if (scrollRightBtn) {
            scrollRightBtn.addEventListener('click', () => this.scrollRight());
        }
        

    }
    
    loadStoryFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const storyId = urlParams.get('storyId');
        
        if (storyId) {
            this.loadStory(storyId);
        } else {
            this.showCharacterSelection();
        }
    }
    
    showCharacterSelection() {
        const characterSelection = document.getElementById('character-selection');
        if (characterSelection) {
            characterSelection.style.display = 'block';
        }
        
        const choiceInput = document.getElementById('choice-input');
        if (choiceInput) {
            choiceInput.disabled = true;
        }
        
        const sendChoice = document.getElementById('send-choice');
        if (sendChoice) {
            sendChoice.disabled = true;
        }
        
        const endStory = document.getElementById('end-story');
        if (endStory) {
            endStory.disabled = true;
        }
    }
    
    loadCharacters() {
        const characterList = document.getElementById('character-list');
        if (!characterList) return;
        
        characterList.innerHTML = '';
        
        const allCharacters = storage.getCharactersByWorldId(this.currentWorldId);
        console.log('所有角色:', allCharacters);
        
        // 加载所有角色，包括主角
        allCharacters.forEach(character => {
            const characterItem = document.createElement('div');
            characterItem.className = 'character-item';
            if (character.isMain) {
                characterItem.innerHTML = `
                    <div class="character-tag main-character">
                        <span>${character.name} (主角)</span>
                    </div>
                `;
            } else {
                characterItem.innerHTML = `
                    <div class="character-tag" data-character-id="${character.id}">
                        <span>${character.name}</span>
                    </div>
                `;
                
                const characterTag = characterItem.querySelector('.character-tag');
                if (characterTag) {
                    characterTag.addEventListener('click', () => {
                        if (this.selectedCharacters.includes(character.id)) {
                            this.selectedCharacters = this.selectedCharacters.filter(id => id !== character.id);
                            characterTag.classList.remove('selected');
                        } else {
                            this.selectedCharacters.push(character.id);
                            characterTag.classList.add('selected');
                        }
                    });
                }
            }
            
            characterList.appendChild(characterItem);
        });
        
        // 如果没有角色，显示提示信息
        if (allCharacters.length === 0) {
            characterList.innerHTML = '<p>暂无角色，请先在角色管理中创建角色</p>';
        }
    }
    
    async startStory() {
        if (this.selectedCharacters.length === 0) {
            this.addSystemMessage('请先选择至少一个角色');
            return;
        }
        
        // 更新小助手状态
        this.updateAssistantStatus('story-assistant', '开始故事');
        this.updateAssistantStatus('profile-assistant', '加载角色数据');
        
        this.currentStoryId = `story_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        
        this.currentStory = {
            id: this.currentStoryId,
            worldId: this.currentWorldId,
            characters: this.selectedCharacters,
            scenes: [],
            archive: [],
            storySummary: '',
            narrationSettings: this.narrationManager.getSettings(),
            startTime: new Date().toISOString(),
            endTime: null
        };
        
        storage.saveStory(this.currentStory);
        this.updateWorldStories();
        
        this.timeManager.adjustTimeToLatestDiary();
        
        this.enableStoryUI();
        this.messageRenderer.clearMessages();
        
        await this.generateInitialScene();
        
        // 更新小助手状态
        this.updateAssistantStatus('story-assistant', '故事已开始');
        this.updateAssistantStatus('profile-assistant', '角色数据加载完成');
        
        const characterNames = this.getSelectedCharacterNames().join('、');
        this.addSystemMessage(`故事已开始，参与角色：${characterNames}。`);
    }
    
    updateWorldStories() {
        const world = storage.getWorldById(this.currentWorldId);
        if (world && !world.stories) {
            world.stories = [];
        }
        if (world && !world.stories.includes(this.currentStoryId)) {
            world.stories.push(this.currentStoryId);
            storage.saveWorld(world);
        }
    }
    
    enableStoryUI() {
        const startStory = document.getElementById('start-story');
        if (startStory) {
            startStory.disabled = true;
        }
        
        const endStory = document.getElementById('end-story');
        if (endStory) {
            endStory.disabled = false;
        }
        
        const choiceInput = document.getElementById('choice-input');
        if (choiceInput) {
            choiceInput.disabled = false;
        }
        
        const sendChoice = document.getElementById('send-choice');
        if (sendChoice) {
            sendChoice.disabled = false;
        }
        
        const characterSelection = document.getElementById('character-selection');
        if (characterSelection) {
            characterSelection.style.display = 'none';
        }
    }
    
    getSelectedCharacterNames() {
        const allCharacters = storage.getCharactersByWorldId(this.currentWorldId);
        return this.selectedCharacters.map(id => {
            const character = allCharacters.find(c => c.id === id);
            return character ? character.name : '';
        }).filter(Boolean);
    }
    
    async sendChoice() {
        const choiceInput = document.getElementById('choice-input');
        const choiceContent = choiceInput.value.trim();
        
        if (!choiceContent) return;
        
        if (!this.currentStory) {
            await this.startStory();
        }
        
        this.timeManager.analyzeTimeContent(choiceContent);
        this.timeManager.detectTimePassage(choiceContent);
        
        this.addUserChoice(choiceContent);
        choiceInput.value = '';
        
        storage.saveStory(this.currentStory);
        
        await this.generateNextScene(choiceContent);
        
        storage.saveStory(this.currentStory);
    }
    
    addUserChoice(content) {
        // 不渲染用户选择，只处理选择逻辑
        console.log('用户选择:', content);
        // 这里不再创建和渲染 choice 类型的消息
    }
    
    addCharacterDialog(characterName, content) {
        const message = {
            id: `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            sender: characterName,
            content: content,
            type: 'character',
            timestamp: new Date().toISOString()
        };
        
        if (this.currentStory.scenes.length === 0) {
            this.currentStory.scenes.push({
                id: `scene_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                messages: [message],
                timestamp: new Date().toISOString()
            });
        } else {
            const currentScene = this.currentStory.scenes[this.currentStory.scenes.length - 1];
            currentScene.messages.push(message);
        }
        
        this.messageRenderer.render(message);
    }
    
    addSystemMessage(content) {
        const message = {
            id: `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            sender: '系统',
            content: content,
            type: 'system',
            timestamp: new Date().toISOString()
        };
        
        if (this.currentStory && this.currentStory.scenes.length > 0) {
            const currentScene = this.currentStory.scenes[this.currentStory.scenes.length - 1];
            currentScene.messages.push(message);
        }
        this.messageRenderer.render(message);
    }
    
    // 重新添加选项按钮渲染方法
    renderChoiceButtons(choices) {
        const choicesGrid = document.getElementById('choices-grid');
        if (!choicesGrid) return;
        
        // 清空现有选项
        choicesGrid.innerHTML = '';
        
        // 生成四个选项按钮
        choices.forEach((choice, index) => {
            const choiceOption = document.createElement('div');
            choiceOption.className = 'choice-option';
            choiceOption.textContent = choice;
            choiceOption.addEventListener('click', () => {
                this.selectChoice(choice);
            });
            choicesGrid.appendChild(choiceOption);
        });
    }
    
    selectChoice(choice) {
        const choiceInput = document.getElementById('choice-input');
        if (choiceInput) {
            choiceInput.value = choice;
            this.sendChoice();
        }
    }
    
    async generateInitialScene() {
        if (typeof window.api === 'undefined') return;
        
        try {
            // 更新小助手状态
            this.updateAssistantStatus('story-assistant', '生成初始场景');
            this.updateAssistantStatus('scene-assistant', '构建场景描述');
            
            // 获取故事小助手设置
            const storyAssistant = this.getStoryAssistant();
            const context = this.buildStoryContext();
            
            // 使用故事小助手生成初始场景
            const response = await this.generateStorySceneWithAssistant({
                context: context,
                type: 'initial',
                assistant: storyAssistant
            });
            
            if (response && response.scene) {
                // 分析场景内容，确定场景类型
                const sceneAnalysis = await this.sceneAnalyzer.analyze(response.scene);
                
                // 分析故事内容中的时间线索，更新时间
                this.timeManager.analyzeTimeContent(response.scene);
                
                // 将故事内容作为旁白消息添加，以便应用背景匹配
                const message = {
                    id: `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                    sender: '旁白',
                    content: response.scene,
                    type: 'narration',
                    scene: sceneAnalysis.scene,
                    timestamp: new Date().toISOString()
                };
                
                if (this.currentStory.scenes.length === 0) {
                    this.currentStory.scenes.push({
                        id: `scene_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                        messages: [message],
                        scene: sceneAnalysis.scene,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    const currentScene = this.currentStory.scenes[this.currentStory.scenes.length - 1];
                    currentScene.messages.push(message);
                    currentScene.scene = sceneAnalysis.scene;
                }
                
                this.messageRenderer.render(message);
            }
            
            if (response && response.choices) {
                // 渲染选项按钮，但不在卡片中显示选项
                this.renderChoiceButtons(response.choices);
            }
            
            // 渲染完成后，再异步调用各个小助手进行分析（不阻塞UI）
            setTimeout(async () => {
                await this.processStoryResult(response.scene);
            }, 100);
            
            // 渲染完成后，再异步调用各个小助手进行分析（不阻塞UI）
            setTimeout(async () => {
                await this.processStoryResult(response.scene);
            }, 100);
            

            
            // 更新小助手状态
            this.updateAssistantStatus('story-assistant', '初始场景生成完成');
            this.updateAssistantStatus('scene-assistant', '场景描述构建完成');
        } catch (error) {
            console.error('生成初始场景失败:', error);
            // 更新小助手状态
            this.updateAssistantStatus('story-assistant', '生成初始场景失败');
            this.updateAssistantStatus('scene-assistant', '构建场景描述失败');
        }
    }
    
    async generateNextScene(choice) {
        if (typeof window.api === 'undefined') return;
        
        try {
            // 更新小助手状态
            this.updateAssistantStatus('story-assistant', '生成后续场景');
            this.updateAssistantStatus('scene-assistant', '构建场景描述');
            
            // 获取故事小助手设置
            const storyAssistant = this.getStoryAssistant();
            const context = this.buildStoryContext();
            
            // 使用故事小助手生成后续场景
            const response = await this.generateStorySceneWithAssistant({
                context: context,
                choice: choice,
                type: 'continue',
                assistant: storyAssistant
            });
            
            if (response && response.scene) {
                // 分析场景内容，确定场景类型
                const sceneAnalysis = await this.sceneAnalyzer.analyze(response.scene);
                
                // 分析故事内容中的时间线索，更新时间
                this.timeManager.analyzeTimeContent(response.scene);
                
                // 将故事内容作为旁白消息添加，以便应用背景匹配
                const message = {
                    id: `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                    sender: '旁白',
                    content: response.scene,
                    type: 'narration',
                    scene: sceneAnalysis.scene,
                    timestamp: new Date().toISOString()
                };
                
                if (this.currentStory.scenes.length === 0) {
                    this.currentStory.scenes.push({
                        id: `scene_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                        messages: [message],
                        scene: sceneAnalysis.scene,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    const currentScene = this.currentStory.scenes[this.currentStory.scenes.length - 1];
                    currentScene.messages.push(message);
                    currentScene.scene = sceneAnalysis.scene;
                }
                
                this.messageRenderer.render(message);
            }
            
            if (response && response.choices) {
                // 渲染选项按钮，但不在卡片中显示选项
                this.renderChoiceButtons(response.choices);
            }
            

            
            // 更新小助手状态
            this.updateAssistantStatus('story-assistant', '后续场景生成完成');
            this.updateAssistantStatus('scene-assistant', '场景描述构建完成');
        } catch (error) {
            console.error('生成后续场景失败:', error);
            // 更新小助手状态
            this.updateAssistantStatus('story-assistant', '生成后续场景失败');
            this.updateAssistantStatus('scene-assistant', '构建场景描述失败');
        }
    }
    
    getStoryAssistant() {
        // 从localStorage获取小助手设置
        const storedAssistants = localStorage.getItem(`assistants_${this.currentWorldId}`);
        if (storedAssistants) {
            try {
                const assistants = JSON.parse(storedAssistants);
                const storyAssistant = assistants.find(a => a.id === 'story-assistant');
                return storyAssistant || null;
            } catch (error) {
                console.error('解析小助手数据失败:', error);
                return null;
            }
        }
        return null;
    }
    


    async generateStorySceneWithAssistant(data) {
        const { context, choice, type, assistant } = data;
        
        try {
            // 检查故事小助手是否启用
            const isStoryAssistantEnabled = assistant ? (assistant.settings ? assistant.settings.enabled : true) : true;
            
            // 检查是否存在AssistantsModule实例
            if (window.assistantsModule && isStoryAssistantEnabled) {
                // 使用assistants.js中的故事小助手方法
                const result = await window.assistantsModule.generateStoryScene(assistant, context, choice);
                
                // 只返回scene和choices，不返回summary，确保不显示格式总结
                // processStoryResult会在渲染后异步调用
                return {
                    scene: result.scene,
                    choices: result.choices || []
                };
            } else {
                // 当故事小助手未启用时，停止故事生成
                console.warn('故事小助手未启用，停止故事生成');
                return {
                    scene: '故事小助手已禁用，请启用后再生成故事',
                    choices: ['启用故事小助手']
                };
            }
        } catch (error) {
            console.error('生成故事场景失败:', error);
            // 根据错误类型返回不同的默认结构
            if (error.message === 'API密钥未配置') {
                    return {
                        scene: "请先配置API密钥才能生成故事内容",
                        choices: ["去配置API密钥"]
                    };
                }
                // 如果生成失败，返回一个默认结构
                return {
                    scene: "故事继续发展...",
                    choices: ["继续前进", "探索周围", "与角色交流", "休息调整"]
                };
        }
    }
    
    async processStoryResult(result) {
        // 支持字符串或对象格式
        let storyContent = '';
        if (typeof result === 'string') {
            storyContent = result;
        } else if (result && result.scene) {
            storyContent = result.scene;
        } else {
            return;
        }
        
        console.log('开始处理故事结果...');
        
        // 检查人设小助手是否启用
        const isProfileAssistantEnabled = window.assistantsModule && 
            window.assistantsModule.assistantsInstances['profile-assistant'] && 
            window.assistantsModule.assistantsInstances['profile-assistant'].settings && 
            window.assistantsModule.assistantsInstances['profile-assistant'].settings.enabled;
        
        // 检查时间小助手是否启用
        const isTimeAssistantEnabled = window.assistantsModule && 
            window.assistantsModule.assistantsInstances['time-assistant'] && 
            window.assistantsModule.assistantsInstances['time-assistant'].settings && 
            window.assistantsModule.assistantsInstances['time-assistant'].settings.enabled;
        
        // 检查色色小助手是否启用
        const isEroticAssistantEnabled = window.assistantsModule && 
            window.assistantsModule.assistantsInstances['erotic-assistant'] && 
            window.assistantsModule.assistantsInstances['erotic-assistant'].settings && 
            window.assistantsModule.assistantsInstances['erotic-assistant'].settings.enabled;
        
        // 分析故事内容，更新角色档案
        if (isProfileAssistantEnabled) {
            await this.updateCharacterProfiles(storyContent);
        }
        
        // 分析故事内容中的时间线索，更新时间
        if (isTimeAssistantEnabled && this.timeManager) {
            this.timeManager.analyzeTimeContent(storyContent);
            this.timeManager.detectTimePassage(storyContent);
            
            // 更新顶框时间显示
            this.timeManager.updateTimeDisplay();
        }
        
        // 色色小助手：分析关键词和数值变化
        if (isEroticAssistantEnabled) {
            console.log('=== 开始调用色色小助手 ===');
            await this.analyzeWithEroticAssistant(storyContent);
            console.log('=== 色色小助手调用完成 ===');
        } else {
            console.log('色色小助手未启用，跳过');
        }
        
        // 分析故事内容中的数值变化
        if (isProfileAssistantEnabled) {
            await this.analyzeStatChanges(storyContent);
        }
    }
    
    async analyzeWithEroticAssistant(storyContent) {
        try {
            const eroticAssistant = window.assistantsModule.assistantsInstances['erotic-assistant'];
            if (!eroticAssistant) {
                console.warn('色色小助手实例不存在');
                return;
            }
            
            console.log('=== 调用色色小助手分析故事内容 ===');
            
            // 获取所有角色
            const allCharacters = storage.getCharactersByWorldId(this.currentWorldId);
            const selectedCharacters = allCharacters.filter(character => 
                this.currentStory && this.currentStory.characters.includes(character.id)
            );
            
            console.log(`选中的角色数量: ${selectedCharacters.length}`, selectedCharacters.map(c => c.name));
            
            // 为每个角色调用色色小助手
            for (const character of selectedCharacters) {
                // 准备输入数据
                const inputTags = eroticAssistant.getInputTags();
                const outputTags = eroticAssistant.getOutputTags();
                
                // 构建请求参数
                const requestData = {
                    prompt: '请分析故事内容中角色的表现，更新角色的数值信息',
                    context: storyContent,
                    userInput: '',
                    params: {
                        characterInfo: this.formatCharacterInfoForErotic(character),
                        characterStats: this.formatCharacterStats(character),
                        storyContext: storyContent,
                        currentStoryContent: storyContent,
                        keywords: JSON.stringify(eroticAssistant.settings.keywords || []),
                        statConfig: JSON.stringify(eroticAssistant.settings.stats || []),
                        gameplay: ''
                    },
                    inputTags: inputTags,
                    outputTags: outputTags
                };
                
                // 调用大总管
                const response = await eroticAssistant.submitRequest(requestData);
                
                console.log(`色色小助手返回的响应 (${character.name}):`, response);
                
                // 处理响应，更新角色数值
                if (response) {
                    await this.processEroticAssistantResponse(character, response);
                }
            }
        } catch (error) {
            console.error('色色小助手分析失败:', error);
        }
    }
    
    formatCharacterInfoForErotic(character) {
        const profile = character.dynamicProfile || character.fixedProfile || character.profile || {};
        return `角色名称: ${character.name}
角色描述: ${profile.description || '无'}
性格: ${profile.personality || '无'}
背景: ${profile.background || '无'}
标签: ${profile.tags ? profile.tags.join(', ') : '无'}`;
    }
    
    formatCharacterStats(character) {
        if (!character.stats || character.stats.length === 0) {
            return '无数值';
        }
        return character.stats.map(stat => `${stat.name}: ${stat.value}`).join(', ');
    }
    
    async processEroticAssistantResponse(character, response) {
        try {
            console.log(`处理色色小助手响应 for ${character.name}:`, response);
            
            // 检查是否有更新后的数值
            const updatedStats = response['更新后角色数值'] || response['角色数值'];
            
            if (!updatedStats || typeof updatedStats !== 'string') {
                console.warn(`角色 ${character.name} 没有返回数值更新`);
                return;
            }
            
            // 初始化角色数值数组
            if (!character.stats || !Array.isArray(character.stats)) {
                character.stats = [];
            }
            
            // 解析数值字符串，支持中文标签名
            // 如 "欲望值: 65, 忠诚度: 80" 或 "阿帆的欲望: 65"
            const statPattern = /([\u4e00-\u9fa5a-zA-Z]+的)?([\u4e00-\u9fa5a-zA-Z]+)\s*[:：]\s*(\d+)/g;
            let match;
            let hasUpdate = false;
            
            while ((match = statPattern.exec(updatedStats)) !== null) {
                const prefix = match[1] ? match[1].replace('的', '') : ''; // 如 "阿帆的" -> "阿帆"
                let statName = match[2].trim();
                const newValue = parseInt(match[3], 10);
                
                // 如果有前缀且前缀和角色名匹配，使用前缀作为数值名
                if (prefix && prefix !== character.name) {
                    statName = prefix + '的' + statName;
                }
                
                if (isNaN(newValue)) continue;
                
                // 查找角色数值
                let stat = character.stats.find(s => s.name === statName);
                if (!stat) {
                    stat = { name: statName, value: 50, max: 100 };
                    character.stats.push(stat);
                }
                
                const oldValue = stat.value;
                stat.value = Math.max(0, Math.min(newValue, stat.max || 100));
                
                // 保存角色
                storage.saveCharacter(character);
                
                // 显示数值更新卡片 - 直接使用 this
                this.addStatUpdate(character.name, statName, oldValue, stat.value);
                
                console.log(`角色 ${character.name} 的 ${statName} 从 ${oldValue} 更新为 ${stat.value}`);
                hasUpdate = true;
            }
            
            if (!hasUpdate) {
                console.warn(`未能解析角色 ${character.name} 的数值更新: ${updatedStats}`);
            }
        } catch (error) {
            console.error('处理色色小助手响应失败:', error);
        }
    }
    
    async analyzeStatChanges(storyContent) {
        // 分析故事内容中的数值变化
        const allCharacters = storage.getCharactersByWorldId(this.currentWorldId);
        const selectedCharacters = allCharacters.filter(character => 
            this.currentStory && this.currentStory.characters.includes(character.id)
        );
        
        for (const character of selectedCharacters) {
            try {
                // 检查人设小助手是否启用
                const isProfileAssistantEnabled = window.assistantsModule && 
                    window.assistantsModule.assistantsInstances['profile-assistant'] && 
                    window.assistantsModule.assistantsInstances['profile-assistant'].settings && 
                    window.assistantsModule.assistantsInstances['profile-assistant'].settings.enabled;
                
                // 检查是否有数值变化
                if (isProfileAssistantEnabled) {
                    // 调用人设小助手的方法分析数值变化
                    const characterInfo = window.assistantsModule.assistantsInstances['profile-assistant'].analyzeStoryForCharacter(character, storyContent);
                    
                    // 处理数值变化
                    if (characterInfo && characterInfo.statsChanges && characterInfo.statsChanges.length > 0) {
                        characterInfo.statsChanges.forEach(change => {
                            let stat = character.stats.find(s => s.name === change.stat);
                            if (!stat) {
                                stat = {
                                    name: change.stat,
                                    value: 50, // 默认值
                                    max: 100
                                };
                                character.stats.push(stat);
                            }
                            
                            const oldValue = stat.value;
                            if (change.type === 'increase') {
                                stat.value = Math.min(stat.value + change.change, stat.max);
                            } else {
                                stat.value = Math.max(stat.value - change.change, 0);
                            }
                            
                            // 添加数值更新记录
                            this.addStatUpdate(character.name, change.stat, oldValue, stat.value);
                        });
                        
                        // 保存更新后的角色
                        storage.saveCharacter(character);
                    }
                }
            } catch (error) {
                console.error('分析数值变化失败:', error);
            }
        }
    }
    
    async analyzeStoryContentForNewCharacters(storyContent) {
        try {
            // 检查人物小助手是否启用
            const isCharacterGeneratorEnabled = window.assistantsModule && 
                window.assistantsModule.assistantsInstances['character-generator-assistant'] && 
                window.assistantsModule.assistantsInstances['character-generator-assistant'].settings && 
                window.assistantsModule.assistantsInstances['character-generator-assistant'].settings.enabled;
            
            if (!isCharacterGeneratorEnabled) {
                return;
            }
            
            const characterGenerator = window.assistantsModule.assistantsInstances['character-generator-assistant'];
            if (!characterGenerator) {
                console.warn('人物小助手实例不存在');
                return;
            }
            
            console.log('调用人物小助手提取新角色...');
            
            // 提取故事中可能的新角色
            const newCharacters = this.extractPotentialCharacters(storyContent);
            const existingCharacters = storage.getCharactersByWorldId(this.currentWorldId);
            const existingNames = existingCharacters.map(c => c.name);
            
            for (const characterName of newCharacters) {
                // 检查角色是否已存在
                const existingChar = existingCharacters.find(c => c.name === characterName);
                
                if (existingChar) {
                    // 如果是固定角色或主角，不生成临时角色
                    if (existingChar.isFixed || existingChar.isMain) {
                        console.log(`角色 ${characterName} 是固定角色/主角，跳过生成`);
                        continue;
                    }
                    // 如果是已存在的临时角色，也跳过
                    if (existingChar.isTemporary) {
                        console.log(`角色 ${characterName} 已存在，跳过生成`);
                        continue;
                    }
                }
                
                // 角色不存在，生成临时角色
                if (!existingChar) {
                    console.log(`发现新角色: ${characterName}，调用人物小助手生成...`);
                    
                    // 提取角色在故事中的描述
                    const characterDescription = this.extractCharacterDescription(characterName, storyContent);
                    
                    // 准备输入数据
                    const inputTags = characterGenerator.getInputTags();
                    const outputTags = characterGenerator.getOutputTags();
                    
                    // 获取临时角色库
                    const tempCharacters = existingCharacters.filter(c => c.isTemporary);
                    
                    // 构建请求参数
                    const requestData = {
                        prompt: `请根据描述生成一个临时角色信息：${characterDescription}`,
                        context: storyContent,
                        userInput: characterDescription,
                        params: {
                            characterDescription: characterDescription,
                            tempCharacterLibrary: JSON.stringify(tempCharacters.map(c => ({
                                name: c.name,
                                description: c.dynamicProfile?.description || c.fixedProfile?.description || ''
                            }))),
                            characterTemplate: '',
                            characterRules: ''
                        },
                        inputTags: inputTags,
                        outputTags: outputTags
                    };
                    
                    // 调用大总管
                    const response = await characterGenerator.submitRequest(requestData);
                    
                    console.log(`人物小助手返回的响应 (${characterName}):`, response);
                    
                    // 处理响应，创建临时角色
                    if (response && response['临时角色名称']) {
                        await this.createTemporaryCharacterFromResponse(characterName, response);
                    }
                }
            }
        } catch (error) {
            console.error('分析故事内容提取新角色失败:', error);
        }
    }
    
    async createTemporaryCharacterFromResponse(characterName, response) {
        try {
            const character = {
                id: `character_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                name: response['临时角色名称'] || characterName,
                isMain: false,
                isTemporary: true,
                fixedProfile: {
                    description: response['临时角色描述'] || '',
                    personality: response['临时角色性格'] || '未知',
                    background: '故事中出现的临时角色',
                    relationships: [],
                    sceneExamples: '',
                    notes: '从故事中自动生成的临时角色',
                    tags: response['临时角色标签'] ? response['临时角色标签'].split(',').map(t => t.trim()) : ['临时角色']
                },
                dynamicProfile: {
                    description: response['临时角色描述'] || '',
                    personality: response['临时角色性格'] || '未知',
                    background: '故事中出现的临时角色',
                    relationships: [],
                    sceneExamples: '',
                    notes: '从故事中自动生成的临时角色',
                    tags: response['临时角色标签'] ? response['临时角色标签'].split(',').map(t => t.trim()) : ['临时角色']
                },
                stats: [],
                diaries: [],
                items: [],
                events: {
                    pending: [],
                    completed: []
                }
            };
            
            // 保存角色
            storage.saveCharacter(character);
            
            // 将角色添加到当前世界
            const world = storage.getWorldById(this.currentWorldId);
            if (world && !world.characters.includes(character.id)) {
                world.characters.push(character.id);
                storage.saveWorld(world);
            }
            
            console.log(`临时角色 ${character.name} 创建成功`);
        } catch (error) {
            console.error('创建临时角色失败:', error);
        }
    }
    
    extractPotentialCharacters(storyContent) {
        // 简单的角色提取逻辑，实际应用中可能需要更复杂的NLP处理
        const lines = storyContent.split('\n');
        const characterNames = [];
        const namePattern = /^([^：:]+)[：:]/;
        
        lines.forEach(line => {
            const match = line.match(namePattern);
            if (match) {
                const name = match[1].trim();
                // 排除常见的旁白和系统角色
                if (name !== '旁白' && name !== '系统' && name !== '你' && name.length > 1) {
                    characterNames.push(name);
                }
            }
        });
        
        // 去重
        return [...new Set(characterNames)];
    }
    
    async generateTemporaryCharacterFromStory(characterName, storyContent) {
        try {
            // 提取角色在故事中的描述
            const characterDescription = this.extractCharacterDescription(characterName, storyContent);
            
            if (window.assistantsModule) {
                // 调用人物小助手生成临时角色
                // 这里需要在AssistantsModule中添加一个方法来处理这个功能
                // 暂时使用直接调用API的方式
                const prompt = `请根据以下故事内容，为角色 ${characterName} 生成一个详细的人物描述：\n\n${characterDescription}`;
                
                const response = await window.api.callAPI('user', prompt);
                
                // 生成临时角色
                const character = {
                    id: `character_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                    name: characterName,
                    isMain: false,
                    isTemporary: true,
                    fixedProfile: {
                        description: response,
                        personality: '未知',
                        background: '故事中出现的临时角色',
                        relationships: [],
                        sceneExamples: '',
                        notes: '从故事中自动生成的临时角色',
                        tags: ['临时角色']
                    },
                    dynamicProfile: {
                        description: response,
                        personality: '未知',
                        background: '故事中出现的临时角色',
                        relationships: [],
                        sceneExamples: '',
                        notes: '从故事中自动生成的临时角色',
                        tags: ['临时角色']
                    },
                    stats: [],
                    diaries: [],
                    items: [],
                    events: {
                        pending: [],
                        completed: []
                    }
                };
                
                // 保存角色
                storage.saveCharacter(character);
                
                // 将角色添加到当前世界
                const world = storage.getWorldById(this.currentWorldId);
                if (world && !world.characters.includes(character.id)) {
                    world.characters.push(character.id);
                    storage.saveWorld(world);
                }
                
                console.log(`临时角色 ${characterName} 生成成功`);
            }
        } catch (error) {
            console.error('生成临时角色失败:', error);
        }
    }
    
    extractCharacterDescription(characterName, storyContent) {
        // 提取角色在故事中的描述
        const lines = storyContent.split('\n');
        const characterLines = [];
        
        lines.forEach(line => {
            if (line.includes(characterName)) {
                characterLines.push(line);
            }
        });
        
        return characterLines.join('\n');
    }
    
    async integrateOtherAssistants(storyContent) {
        try {
            // 集成人设小助手（更新角色档案）
            await this.updateCharacterProfiles(storyContent);
            
            // 集成人物小助手（提取新角色）
            await this.analyzeStoryContentForNewCharacters(storyContent);
            
            // 集成场景小助手（分析场景）
            await this.analyzeScenesInStory(storyContent);
        } catch (error) {
            console.error('集成其他小助手失败:', error);
        }
    }
    
    async updateCharacterProfiles(storyContent) {
        // 更新角色档案
        const allCharacters = storage.getCharactersByWorldId(this.currentWorldId);
        const selectedCharacters = allCharacters.filter(character => 
            this.currentStory && this.currentStory.characters.includes(character.id)
        );
        
        for (const character of selectedCharacters) {
            try {
                // 检查人设小助手是否启用
                const isProfileAssistantEnabled = window.assistantsModule && 
                    window.assistantsModule.assistantsInstances['profile-assistant'] && 
                    window.assistantsModule.assistantsInstances['profile-assistant'].settings && 
                    window.assistantsModule.assistantsInstances['profile-assistant'].settings.enabled;
                
                if (isProfileAssistantEnabled) {
                    const profileAssistant = window.assistantsModule.assistantsInstances['profile-assistant'];
                    
                    try {
                        console.log(`调用人设小助手更新角色 ${character.name} 的档案...`);
                        
                        // 准备输入数据
                        const inputTags = profileAssistant.getInputTags();
                        const outputTags = profileAssistant.getOutputTags();
                        
                        // 构建请求参数
                        const requestData = {
                            prompt: '请根据故事内容分析角色表现，更新角色档案信息',
                            context: storyContent,
                            userInput: '',
                            params: {
                                characterInfo: this.formatCharacterInfoForProfile(character),
                                allStoryContent: this.formatAllStoryContent(),
                                currentStoryContent: storyContent
                            },
                            inputTags: inputTags,
                            outputTags: outputTags
                        };
                        
                        // 通过大管家调用API
                        const response = await profileAssistant.submitRequest(requestData);
                        
                        console.log(`人设小助手返回的响应 (${character.name}):`, response);
                        
                        // 处理响应，更新角色档案
                        if (response) {
                            this.applyProfileUpdate(character, response);
                        }
                        
                        // 保存更新后的角色
                        storage.saveCharacter(character);
                    } catch (apiError) {
                        console.error(`人设小助手API调用失败 (${character.name}):`, apiError);
                        // 后备：使用本地方法
                        profileAssistant.updateCharacterProfileFromStory(character, storyContent);
                        storage.saveCharacter(character);
                    }
                } else {
                    // 暂时使用简单的更新方式
                    if (!character.dynamicProfile) {
                        character.dynamicProfile = {};
                    }
                    
                    // 更新角色的最近故事经历
                    character.dynamicProfile.recentStory = storyContent.substring(0, 500) + '...';
                    storage.saveCharacter(character);
                }
            } catch (error) {
                console.error('更新角色档案失败:', error);
            }
        }
    }
    
    formatCharacterInfoForProfile(character) {
        const profile = character.dynamicProfile || character.fixedProfile || character.profile || {};
        return `角色名称: ${character.name}
角色描述: ${profile.description || '无'}
性格: ${profile.personality || '无'}
背景: ${profile.background || '无'}
关系: ${profile.relationships ? JSON.stringify(profile.relationships) : '无'}
标签: ${profile.tags ? profile.tags.join(', ') : '无'}`;
    }
    
    applyProfileUpdate(character, response) {
        // 应用从API响应中获取的角色档案更新
        if (!character.dynamicProfile) {
            character.dynamicProfile = {};
        }
        
        // 更新角色描述
        if (response['角色描述']) {
            character.dynamicProfile.description = response['角色描述'];
        }
        
        // 更新角色性格
        if (response['角色性格']) {
            character.dynamicProfile.personality = response['角色性格'];
        }
        
        // 更新角色背景
        if (response['角色背景']) {
            character.dynamicProfile.background = response['角色背景'];
        }
        
        // 更新角色关系
        if (response['角色关系']) {
            try {
                // 尝试解析JSON，如果失败则解析文本格式
                try {
                    character.dynamicProfile.relationships = JSON.parse(response['角色关系']);
                } catch (e) {
                    // 文本格式：解析 "角色A: 关系描述, 角色B: 关系描述"
                    const relationships = [];
                    const lines = response['角色关系'].split(/[,，\n]/);
                    lines.forEach(line => {
                        const match = line.match(/([^:：]+)[:：]\s*(.+)/);
                        if (match) {
                            relationships.push({
                                name: match[1].trim(),
                                relation: match[2].trim(),
                                description: match[2].trim()
                            });
                        }
                    });
                    if (relationships.length > 0) {
                        character.dynamicProfile.relationships = relationships;
                    }
                }
            } catch (e) {
                console.warn('解析角色关系失败:', e);
            }
        }
        
        // 更新角色标签
        if (response['角色标签']) {
            const tags = response['角色标签'].split(',').map(t => t.trim()).filter(Boolean);
            character.dynamicProfile.tags = tags;
        }
        
        // 更新场景描写示例
        if (response['场景描写示例']) {
            character.dynamicProfile.sceneExamples = response['场景描写示例'];
        }
        
        // 更新创作者笔记
        if (response['创作者笔记']) {
            character.dynamicProfile.notes = response['创作者笔记'];
        }
        
        // 更新数值
        if (response['角色数值']) {
            this.parseAndApplyStats(character, response['角色数值']);
        }
        
        // 更新角色日记（第一人称）
        if (response['角色日记']) {
            this.applyCharacterDiary(character, response['角色日记']);
        }
        
        console.log(`角色 ${character.name} 档案已更新`);
    }
    
    parseAndApplyStats(character, statsString) {
        if (!character.stats || !Array.isArray(character.stats)) {
            character.stats = [];
        }
        
        if (!statsString || typeof statsString !== 'string') {
            return;
        }
        
        // 解析数值字符串，支持中文和英文标签名
        // 如 "欲望值: 65, 忠诚度: 80" 或 "欲望: 65"
        const statPattern = /([\u4e00-\u9fa5a-zA-Z]+)\s*[:：]\s*(\d+)/g;
        let match;
        
        while ((match = statPattern.exec(statsString)) !== null) {
            const statName = match[1].trim();
            const newValue = parseInt(match[2], 10);
            
            if (isNaN(newValue)) continue;
            
            let stat = character.stats.find(s => s.name === statName);
            if (!stat) {
                stat = { name: statName, value: 50, max: 100 };
                character.stats.push(stat);
            }
            
            stat.value = Math.max(0, Math.min(newValue, stat.max || 100));
        }
        
        console.log(`更新角色 ${character.name} 的数值:`, character.stats);
    }
    
    applyCharacterDiary(character, diaryContent) {
        if (!character.diaries || !Array.isArray(character.diaries)) {
            character.diaries = [];
        }
        
        if (!diaryContent || typeof diaryContent !== 'string') {
            return;
        }
        
        // 添加新日记
        const diary = {
            id: `diary_${Date.now()}_${Math.random()}`,
            content: diaryContent,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };
        
        character.diaries.push(diary);
        
        // 保存角色
        storage.saveCharacter(character);
        
        console.log(`角色 ${character.name} 添加了新日记:`, diary);
    }
    
    async analyzeScenesInStory(storyContent) {
        // 分析故事中的场景
        // 这里可以调用场景小助手的方法
        console.log('分析故事中的场景:', storyContent);
    }

    buildStoryContext() {
        const allCharacters = storage.getCharactersByWorldId(this.currentWorldId);
        const selectedCharacters = allCharacters.filter(character => 
            !character.isMain && (this.currentStory ? this.currentStory.characters.includes(character.id) : this.selectedCharacters.includes(character.id))
        );
        
        // 获取主角信息
        const mainCharacter = allCharacters.find(character => character.isMain);
        
        const formattedTime = this.timeManager.formatCurrentTime();
        
        let context = `当前时间: ${formattedTime}\n`;
        
        // 添加主角信息
        if (mainCharacter) {
            const dynamicProfile = mainCharacter.dynamicProfile || {};
            const fixedProfile = mainCharacter.fixedProfile || mainCharacter.profile || {};
            
            context += `你是${mainCharacter.name}，`;
            context += `性格: ${dynamicProfile.personality || fixedProfile.personality || '无'}\n`;
            context += `背景: ${dynamicProfile.background || fixedProfile.background || '无'}\n`;
            
            if (dynamicProfile.tags && dynamicProfile.tags.length > 0) {
                context += `标签: ${dynamicProfile.tags.join(', ')}\n`;
            } else if (fixedProfile.tags && fixedProfile.tags.length > 0) {
                context += `标签: ${fixedProfile.tags.join(', ')}\n`;
            }
        } else {
            context += `这是一个故事生成场景，你作为主角参与其中，`;
        }
        
        if (selectedCharacters.length > 0) {
            context += `其他参与角色有: ${selectedCharacters.map(c => c.name).join('、')}。`;
        }
        
        // 添加其他角色信息
        selectedCharacters.forEach(character => {
            const dynamicProfile = character.dynamicProfile || {};
            const fixedProfile = character.fixedProfile || character.profile || {};
            
            context += `\n\n${character.name}的人设:\n`;
            context += `性格: ${dynamicProfile.personality || fixedProfile.personality || '无'}\n`;
            context += `背景: ${dynamicProfile.background || fixedProfile.background || '无'}\n`;
            
            if (dynamicProfile.tags && dynamicProfile.tags.length > 0) {
                context += `标签: ${dynamicProfile.tags.join(', ')}\n`;
            } else if (fixedProfile.tags && fixedProfile.tags.length > 0) {
                context += `标签: ${fixedProfile.tags.join(', ')}\n`;
            }
        });
        
        // 添加之前的日记内容
        const previousDiaries = this.getPreviousDiaries();
        if (previousDiaries.length > 0) {
            context += '\n\n之前的故事日记:\n';
            previousDiaries.forEach((diary, index) => {
                context += `\n${index + 1}. ${diary.content.substring(0, 500)}${diary.content.length > 500 ? '...' : ''}\n`;
            });
        }
        
        if (this.currentStory && this.currentStory.scenes.length > 0) {
            context += '\n\n最近的故事场景:\n';
            const recentScenes = this.currentStory.scenes.slice(-3);
            recentScenes.forEach(scene => {
                scene.messages.forEach(msg => {
                    if (msg.type !== 'system') {
                        context += `${msg.sender}: ${msg.content}\n`;
                    }
                });
            });
        }
        
        if (this.currentStory && this.currentStory.storySummary) {
            context += `\n\n故事概要: ${this.currentStory.storySummary}`;
        }
        
        return context;
    }
    
    // 获取之前的日记内容
    getPreviousDiaries() {
        const stories = storage.getStoriesByWorldId(this.currentWorldId) || [];
        let diaries = [];
        
        stories.forEach(story => {
            if (story.archive && story.archive.length > 0) {
                story.archive.forEach(archiveItem => {
                    if (archiveItem.summary === '故事日记') {
                        diaries.push(archiveItem);
                    }
                });
            }
        });
        
        // 按时间倒序排序，取最近的3篇日记
        diaries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return diaries.slice(0, 3);
    }
    
    async endStory() {
        if (!this.currentStory) return;
        
        // 更新小助手状态
        this.updateAssistantStatus('story-assistant', '结束故事');
        this.updateAssistantStatus('profile-assistant', '更新角色档案');
        this.updateAssistantStatus('scene-assistant', '分析故事场景');
        this.updateAssistantStatus('summary-assistant', '生成故事总结');
        
        this.currentStory.endTime = new Date().toISOString();
        
        // 生成故事总结
        await this.generateStorySummary();
        
        // 集成其他小助手处理
        const lastScene = this.currentStory.scenes[this.currentStory.scenes.length - 1];
        if (lastScene) {
            const lastSceneContent = lastScene.messages
                .filter(msg => msg.type !== 'system')
                .map(msg => `${msg.sender}: ${msg.content}`)
                .join('\n');
            
            await this.integrateOtherAssistants(lastSceneContent);
        }
        
        // 保存场景到故事档案
        this.currentStory.archive = this.currentStory.scenes.map(scene => {
            // 构建场景内容
            let sceneContent = '';
            scene.messages.forEach(msg => {
                if (msg.type !== 'system') {
                    sceneContent += `${msg.sender}: ${msg.content}\n`;
                }
            });
            
            return {
                id: scene.id,
                summary: `场景: ${scene.scene || '未知场景'}`,
                content: sceneContent.trim(),
                timestamp: scene.timestamp,
                scene: scene.scene
            };
        });
        
        // 从localStorage读取所有卡片数据
        const storedCards = localStorage.getItem(`story_cards_${this.currentWorldId}`);
        let cards = [];
        if (storedCards) {
            try {
                cards = JSON.parse(storedCards);
            } catch (error) {
                console.error('解析卡片数据失败:', error);
            }
        }
        
        // 根据卡片内容生成第三人称日记
        if (cards.length > 0) {
            let diaryContent = '';
            // 检查总结小助手是否启用
            const isSummaryAssistantEnabled = window.assistantsModule && 
                window.assistantsModule.assistantsInstances['summary-assistant'] && 
                window.assistantsModule.assistantsInstances['summary-assistant'].settings && 
                window.assistantsModule.assistantsInstances['summary-assistant'].settings.enabled;
            
            if (isSummaryAssistantEnabled) {
                const summaryAssistant = window.assistantsModule.assistantsInstances['summary-assistant'];
                try {
                    console.log('调用总结小助手生成故事日记...');
                    
                    // 准备输入数据
                    const inputTags = summaryAssistant.getInputTags();
                    const outputTags = summaryAssistant.getOutputTags();
                    
                    // 获取日记设置 - 故事日记是第三人称
                    const diarySettings = summaryAssistant.settings?.diarySettings || {
                        style: '简洁',
                        format: '段落',
                        wordCount: 200,
                        diaryType: '第三人称',
                        tone: '客观',
                        includeDate: true
                    };
                    
                    // 构建请求参数
                    const requestData = {
                        prompt: '请根据以下故事卡片内容，生成一篇故事日记',
                        context: '',
                        userInput: '',
                        params: {
                            storyCards: JSON.stringify(cards),
                            allStoryContent: this.formatAllStoryContent(),
                            diarySettings: JSON.stringify(diarySettings)
                        },
                        inputTags: inputTags,
                        outputTags: outputTags
                    };
                    
                    // 通过大总管调用API
                    const response = await summaryAssistant.submitRequest(requestData);
                    
                    console.log('总结小助手返回的响应:', response);
                    
                    // 处理响应
                    if (response && response['生成日记']) {
                        diaryContent = response['生成日记'];
                    } else if (response && response['最近记录']) {
                        // 如果返回的是最近记录格式，尝试提取日记内容
                        diaryContent = response['最近记录'];
                    } else {
                        // 后备：使用本地生成
                        diaryContent = summaryAssistant.generateDiaryFromCards(cards);
                    }
                } catch (error) {
                    console.error('总结小助手API调用失败:', error);
                    // 后备：使用本地生成
                    diaryContent = summaryAssistant.generateDiaryFromCards(cards);
                }
            } else {
                diaryContent = this.generateDiaryFromCards(cards);
            }
            

            
            // 将日记添加到故事档案
            this.currentStory.archive.push({
                id: `diary_${Date.now()}`,
                summary: '故事日记',
                content: diaryContent,
                timestamp: new Date().toISOString(),
                scene: '故事日记'
            });
        }
        
        // 构建完整的剧情内容
        let fullStoryContent = '';
        const individualScenes = [];
        
        this.currentStory.scenes.forEach((scene, index) => {
            let sceneContent = `场景 ${index + 1}:\n`;
            scene.messages.forEach(msg => {
                if (msg.type !== 'system') {
                    const messageContent = `${msg.sender}: ${msg.content}`;
                    sceneContent += messageContent + '\n';
                    fullStoryContent += messageContent + '\n';
                }
            });
            individualScenes.push(sceneContent.trim());
        });
        
        // 保存修改后的故事
        storage.saveStory(this.currentStory);
        
        // 检查总结小助手是否启用
        const isSummaryAssistantEnabled = window.assistantsModule && 
            window.assistantsModule.assistantsInstances['summary-assistant'] && 
            window.assistantsModule.assistantsInstances['summary-assistant'].settings && 
            window.assistantsModule.assistantsInstances['summary-assistant'].settings.enabled;
        
        // 将故事添加到最近故事记录
        if (isSummaryAssistantEnabled) {
            window.assistantsModule.assistantsInstances['summary-assistant'].saveToRecentStories({
                id: this.currentStory.id,
                worldId: this.currentStory.worldId,
                storySummary: this.currentStory.storySummary,
                fullStory: fullStoryContent,
                scenes: individualScenes,
                endTime: this.currentStory.endTime,
                characters: this.currentStory.characters
            });
        } else {
            storage.addRecentStory({
                id: this.currentStory.id,
                worldId: this.currentStory.worldId,
                storySummary: this.currentStory.storySummary,
                fullStory: fullStoryContent,
                scenes: individualScenes,
                endTime: this.currentStory.endTime,
                characters: this.currentStory.characters
            });
        }
        
        // 集成其他管理功能
        if (isSummaryAssistantEnabled) {
            window.assistantsModule.assistantsInstances['summary-assistant'].integrateManagement();
        }
        
        this.addSystemMessage('故事已结束。');
        
        // 更新小助手状态
        this.updateAssistantStatus('story-assistant', '故事已结束');
        this.updateAssistantStatus('profile-assistant', '角色档案已更新');
        this.updateAssistantStatus('scene-assistant', '场景分析完成');
        this.updateAssistantStatus('time-assistant', '时间记录完成');
        this.updateAssistantStatus('character-generator-assistant', '角色分析完成');
        this.updateAssistantStatus('summary-assistant', '总结完成');
        
        const endStory = document.getElementById('end-story');
        if (endStory) {
            endStory.disabled = true;
        }
        
        const choiceInput = document.getElementById('choice-input');
        if (choiceInput) {
            choiceInput.disabled = true;
        }
        
        const sendChoice = document.getElementById('send-choice');
        if (sendChoice) {
            sendChoice.disabled = true;
        }
    }
    
    async generateStorySummary() {
        if (!this.currentStory || this.currentStory.scenes.length === 0) return;
        
        try {
            // 更新小助手状态
            this.updateAssistantStatus('story-assistant', '生成故事总结');
            
            // 构建故事内容
            let storyContent = '';
            this.currentStory.scenes.forEach(scene => {
                scene.messages.forEach(msg => {
                    if (msg.type !== 'system') {
                        storyContent += `${msg.sender}: ${msg.content}\n`;
                    }
                });
            });
            
            // 构建总结提示
            const prompt = `请为以下故事生成一个详细的总结，包括主要角色、关键情节和故事发展：\n\n${storyContent}`;
            
            // 调用API生成总结
            if (window.api && window.api.config.apiKey) {
                const response = await window.api.callAPI('user', prompt);
                this.currentStory.storySummary = response;
            }
            
            // 更新小助手状态
            this.updateAssistantStatus('story-assistant', '故事总结生成完成');
        } catch (error) {
            console.error('生成故事总结失败:', error);
            this.updateAssistantStatus('story-assistant', '生成故事总结失败');
        }
    }
    
    generatePlotSummaryFromCards(cards) {
        // 按时间排序卡片
        const sortedCards = [...cards].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // 提取所有角色
        const characters = new Set();
        sortedCards.forEach(card => {
            card.messages.forEach(msg => {
                if (msg.sender && msg.sender !== '旁白' && msg.sender !== '系统') {
                    characters.add(msg.sender);
                }
            });
        });
        
        // 提取主要场景
        const scenes = new Set();
        sortedCards.forEach(card => {
            if (card.scene && card.scene !== '未知场景') {
                scenes.add(card.scene);
            }
        });
        
        // 构建剧情发展
        let plotDevelopment = '';
        sortedCards.forEach((card, index) => {
            if (card.messages.length > 0) {
                const firstMessage = card.messages[0];
                if (firstMessage.type === 'narration') {
                    plotDevelopment += `\n${index + 1}. ${firstMessage.content.substring(0, 100)}...`;
                }
            }
        });
        

        

    }
    
    generateDiaryFromCards(cards) {
        // 按时间排序卡片
        const sortedCards = [...cards].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // 提取所有角色
        const characters = new Set();
        sortedCards.forEach(card => {
            card.messages.forEach(msg => {
                if (msg.sender && msg.sender !== '旁白' && msg.sender !== '系统') {
                    characters.add(msg.sender);
                }
            });
        });
        
        // 提取主要场景
        const scenes = new Set();
        sortedCards.forEach(card => {
            if (card.scene && card.scene !== '未知场景') {
                scenes.add(card.scene);
            }
        });
        
        // 提取故事主要内容和情节
        let storyEvents = [];
        sortedCards.forEach(card => {
            card.messages.forEach(msg => {
                if (msg.type === 'narration' || msg.type === 'character') {
                    storyEvents.push({
                        sender: msg.sender,
                        content: msg.content,
                        type: msg.type
                    });
                }
            });
        });
        
        // 返回格式化的故事内容
        let content = '';
        
        // 添加角色
        if (characters.size > 0) {
            content += `主要角色: ${Array.from(characters).join('、')}\n\n`;
        }
        
        // 添加场景
        if (scenes.size > 0) {
            content += `主要场景: ${Array.from(scenes).join('、')}\n\n`;
        }
        
        // 添加故事内容
        content += '故事内容:\n';
        storyEvents.forEach(event => {
            content += `${event.sender}: ${event.content}\n`;
        });
        
        return content;
    }
    
    formatAllStoryContent() {
        // 格式化所有故事内容，用于大总管API调用
        if (!this.currentStory || !this.currentStory.scenes) {
            return '暂无故事内容';
        }
        
        let content = '';
        
        // 添加每个场景的内容
        this.currentStory.scenes.forEach((scene, index) => {
            content += `--- 场景 ${index + 1} ---\n`;
            if (scene.scene) {
                content += `场景: ${scene.scene}\n`;
            }
            scene.messages.forEach(msg => {
                if (msg.type !== 'system') {
                    content += `${msg.sender}: ${msg.content}\n`;
                }
            });
            content += '\n';
        });
        
        return content;
    }

    loadStory(storyId) {
        const story = storage.getStoryById(storyId);
        if (!story) return;
        
        this.currentStoryId = storyId;
        this.currentStory = story;
        
        // 确保故事档案存在
        if (!this.currentStory.archive) {
            this.currentStory.archive = [];
        }
        
        this.narrationManager.loadSettings();
        
        this.enableStoryUI();
        
        const characterSelection = document.getElementById('character-selection');
        if (characterSelection) {
            characterSelection.style.display = 'none';
        }
        
        // 渲染所有场景的消息
        story.scenes.forEach(scene => {
            scene.messages.forEach(message => {
                this.messageRenderer.render(message);
            });
        });
        

    }
    

    
    toggleScrollMode() {
        const storyMessages = document.getElementById('story-messages');
        const toggleScrollBtn = document.getElementById('toggle-scroll');
        
        if (storyMessages && toggleScrollBtn) {
            if (storyMessages.classList.contains('horizontal-scroll')) {
                // 切换到上下滑动
                storyMessages.classList.remove('horizontal-scroll');
                toggleScrollBtn.textContent = '左右滑动';
            } else {
                // 切换到左右滑动
                storyMessages.classList.add('horizontal-scroll');
                toggleScrollBtn.textContent = '上下滑动';
            }
        }
    }
    
    scrollLeft() {
        const storyMessages = document.getElementById('story-messages');
        if (storyMessages && storyMessages.classList.contains('horizontal-scroll')) {
            storyMessages.scrollBy({ left: -700, behavior: 'smooth' });
        }
    }
    
    scrollRight() {
        const storyMessages = document.getElementById('story-messages');
        if (storyMessages && storyMessages.classList.contains('horizontal-scroll')) {
            storyMessages.scrollBy({ left: 700, behavior: 'smooth' });
        }
    }
    

}

// 初始化故事模块
let storyModule;
document.addEventListener('DOMContentLoaded', function() {
    storyModule = new StoryModule();
    storyModule.init().then(() => {
        console.log('故事模块初始化完成');
    });
    window.storyModule = storyModule;
});