// 任务小助手模块
import AssistantBase from '../assistant-base.js';

class TaskAssistant extends AssistantBase {
    constructor(worldId) {
        super(worldId);
        this.id = 'task-assistant';
        this.name = '任务小助手';
        this.color = '#f59e0b';
        this.settings = this.loadSettings();
        this.taskData = this.loadTaskData();
    }

    loadSettings() {
        const storedAssistants = localStorage.getItem(`assistants_${this.worldId}`);
        if (storedAssistants) {
            try {
                const assistants = JSON.parse(storedAssistants);
                const taskAssistant = assistants.find(a => a.id === 'task-assistant');
                if (taskAssistant && taskAssistant.settings) {
                    return taskAssistant.settings;
                }
            } catch (error) {
                console.error('解析assistants存储失败:', error);
            }
        }

        return {
            enabled: true,
            autoUpdate: true,
            goalTypes: ['成长型', '收集型', '剧情型', '混合型'],
            customGoalTypes: [],
            rewardStyles: ['武侠', '仙侠', '玄幻', '西幻', '现代', '科幻'],
            customRewardStyles: [],
            punishmentStyles: ['武侠', '仙侠', '玄幻', '西幻', '现代', '科幻'],
            customPunishmentStyles: [],
            rewardStyle: '武侠',
            punishmentStyle: '武侠',
            enablePunishment: true,
            maxActiveTasks: 3,
            enableRandomTasks: true,
            skillCooldown: 60,
            customPrompts: [
                '根据目标生成相关任务',
                '在故事中适时发布任务',
                '判断任务完成条件',
                '发放奖励到仓库',
                '触发惩罚机制',
                '维护任务进度',
                '平衡任务难度',
                '提供任务提示'
            ]
        };
    }

    loadTaskData() {
        const key = `task_assistant_${this.worldId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('解析任务数据失败:', error);
            }
        }

        return {
            currentGoal: '',
            goalType: '成长型',
            goalDifficulty: '普通',
            tasks: [],
            rewards: [],
            skills: [],
            completedTasks: [],
            failedTasks: []
        };
    }

    saveTaskData() {
        const key = `task_assistant_${this.worldId}`;
        localStorage.setItem(key, JSON.stringify(this.taskData));
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

        const index = assistants.findIndex(a => a.id === 'task-assistant');
        if (index >= 0) {
            assistants[index] = {
                ...assistants[index],
                settings: this.settings
            };
        } else {
            assistants.push({
                id: 'task-assistant',
                name: '任务小助手',
                description: '管理任务系统，引导剧情发展',
                profile: {
                    personality: '严谨、公正、善于激励',
                    background: '我是专门负责管理任务的小助手，帮助你设定目标并发布任务，引导剧情朝着目标发展。',
                    tags: ['任务管理', '目标引导', '奖励发放', '惩罚机制']
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

    setGoal(goal, goalType = '成长型', goalDifficulty = '普通') {
        this.taskData.currentGoal = goal;
        this.taskData.goalType = goalType;
        this.taskData.goalDifficulty = goalDifficulty;
        this.saveTaskData();

        if (this.settings.enabled) {
            this.generateInitialTasks();
        }
    }

    generateInitialTasks() {
        if (!this.taskData.currentGoal) return;

        const prompt = `基于以下目标生成3-5个初始任务：
目标：${this.taskData.currentGoal}
目标类型：${this.taskData.goalType}
难度：${this.taskData.goalDifficulty}
世界观风格：${this.settings.rewardStyle}

请为每个任务包含：
1. 任务名称
2. 任务描述
3. 任务类型（主线/支线）
4. 预期完成条件
5. 奖励内容（道具、技能、属性等）
6. 惩罚内容（任务失败时的惩罚）

输出格式：
【任务1】
名称：
描述：
类型：
完成条件：
奖励：
惩罚：

【任务2】
...`;

        this.submitRequest({
            prompt: prompt,
            outputTags: ['任务列表']
        }).then(response => {
            this.parseAndSaveTasks(response['任务列表']);
        });
    }

    parseAndSaveTasks(taskListText) {
        try {
            const taskMatches = taskListText.match(/【任务\d+】[\s\S]*?(?=【任务\d+】|$)/g);
            if (!taskMatches) return;

            const newTasks = taskMatches.map((taskText, index) => {
                const id = `task-${Date.now()}-${index}`;
                return {
                    id,
                    name: this.extractField(taskText, '名称') || `任务${index + 1}`,
                    description: this.extractField(taskText, '描述') || '',
                    type: this.extractField(taskText, '类型') || '支线',
                    condition: this.extractField(taskText, '完成条件') || '',
                    reward: this.extractField(taskText, '奖励') || '',
                    punishment: this.extractField(taskText, '惩罚') || '',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    progress: 0
                };
            });

            this.taskData.tasks = newTasks;
            this.saveTaskData();
        } catch (error) {
            console.error('解析任务失败:', error);
        }
    }

    extractField(text, fieldName) {
        const regex = new RegExp(`${fieldName}：[\\s\\S]*?(?=【|$)`);
        const match = text.match(regex);
        if (match) {
            return match[0].replace(`${fieldName}：`, '').trim();
        }
        return '';
    }

    addTask(task) {
        const newTask = {
            id: `task-${Date.now()}`,
            name: task.name || '新任务',
            description: task.description || '',
            type: task.type || '支线',
            condition: task.condition || '',
            reward: task.reward || '',
            punishment: task.punishment || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            progress: 0,
            deadline: task.deadline || null
        };

        if (this.taskData.tasks.length < this.settings.maxActiveTasks) {
            this.taskData.tasks.push(newTask);
            this.saveTaskData();
            return newTask;
        }
        return null;
    }

    completeTask(taskId) {
        const taskIndex = this.taskData.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return false;

        const task = this.taskData.tasks[taskIndex];
        task.status = 'completed';
        task.completedAt = new Date().toISOString();

        this.taskData.completedTasks.push(task);
        this.taskData.tasks.splice(taskIndex, 1);

        if (task.reward) {
            this.addReward(task.reward, task.name);
        }

        this.saveTaskData();
        return true;
    }

    failTask(taskId) {
        const taskIndex = this.taskData.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return false;

        const task = this.taskData.tasks[taskIndex];
        task.status = 'failed';
        task.failedAt = new Date().toISOString();

        this.taskData.failedTasks.push(task);
        this.taskData.tasks.splice(taskIndex, 1);

        if (this.settings.enablePunishment && task.punishment) {
            this.applyPunishment(task.punishment, task.name);
        }

        this.saveTaskData();
        return true;
    }

    addReward(rewardText, taskName) {
        const reward = {
            id: `reward-${Date.now()}`,
            taskName,
            rewardText,
            receivedAt: new Date().toISOString(),
            used: false
        };

        this.taskData.rewards.push(reward);
        this.saveTaskData();
        return reward;
    }

    useReward(rewardId) {
        const rewardIndex = this.taskData.rewards.findIndex(r => r.id === rewardId);
        if (rewardIndex === -1) return null;

        const reward = this.taskData.rewards[rewardIndex];
        reward.used = true;
        reward.usedAt = new Date().toISOString();

        if (reward.rewardText.includes('技能')) {
            this.addSkillFromReward(reward);
        }

        this.taskData.rewards.splice(rewardIndex, 1);
        this.saveTaskData();
        return reward;
    }

    addSkillFromReward(reward) {
        const skill = {
            id: `skill-${Date.now()}`,
            name: reward.rewardText.match(/技能[：:](.+)/)?.[1] || '新技能',
            description: reward.rewardText,
            acquiredAt: new Date().toISOString(),
            cooldown: this.settings.skillCooldown,
            lastUsed: null,
            level: 1
        };

        this.taskData.skills.push(skill);
        this.saveTaskData();
        return skill;
    }

    useSkill(skillId) {
        const skill = this.taskData.skills.find(s => s.id === skillId);
        if (!skill) return null;

        if (skill.lastUsed) {
            const lastUsedTime = new Date(skill.lastUsed).getTime();
            const now = Date.now();
            const cooldownMs = skill.cooldown * 1000;

            if (now - lastUsedTime < cooldownMs) {
                return { error: '技能冷却中', remainingTime: Math.ceil((cooldownMs - (now - lastUsedTime)) / 1000) };
            }
        }

        skill.lastUsed = new Date().toISOString();
        this.saveTaskData();
        return skill;
    }

    applyPunishment(punishmentText, taskName) {
        console.log(`[任务小助手] 惩罚触发 - 任务: ${taskName}`);
        console.log(`[任务小助手] 惩罚内容: ${punishmentText}`);
        return {
            taskName,
            punishmentText,
            appliedAt: new Date().toISOString()
        };
    }

    getInputTags() {
        return ['目标信息', '当前剧情', '角色状态', '任务状态'];
    }

    getOutputTags() {
        return ['任务内容', '奖励内容', '惩罚内容', '任务进度'];
    }

    async run(context, userInput, type = 'default', params = {}, inputTags = null, outputTags = null) {
        if (!this.settings.enabled) return null;

        return super.run(context, userInput, type, params, inputTags, outputTags);
    }

    buildPrompt(context, userInput) {
        const customPrompts = this.settings.customPrompts || [];
        let prompt = `你是${this.name}，${this.profile.background || ''}

当前目标：${this.taskData.currentGoal || '未设定目标'}
目标类型：${this.taskData.goalType}
难度：${this.taskData.goalDifficulty}

`;

        if (this.taskData.tasks.length > 0) {
            prompt += `当前任务：\n`;
            this.taskData.tasks.forEach((task, index) => {
                prompt += `${index + 1}. ${task.name} (${task.type}) - 进度: ${task.progress}%\n`;
                prompt += `   描述: ${task.description}\n`;
                prompt += `   完成条件: ${task.condition}\n`;
            });
            prompt += '\n';
        }

        if (this.taskData.rewards.length > 0) {
            prompt += `奖励仓库：\n`;
            this.taskData.rewards.forEach((reward, index) => {
                prompt += `${index + 1}. ${reward.rewardText} (来自: ${reward.taskName})\n`;
            });
            prompt += '\n';
        }

        if (this.taskData.skills.length > 0) {
            prompt += `已解锁技能：\n`;
            this.taskData.skills.forEach((skill, index) => {
                prompt += `${index + 1}. ${skill.name} (等级: ${skill.level})\n`;
            });
            prompt += '\n';
        }

        prompt += `上下文：
${context}

`;

        if (userInput) {
            prompt += `用户输入：
${userInput}

`;
        }

        prompt += `要求：
`;
        customPrompts.forEach((promptItem, index) => {
            if (promptItem) {
                prompt += `${index + 1}. ${promptItem}
`;
            }
        });

        return prompt;
    }

    generateSettingsHTML(settings) {
        const customPrompts = settings.customPrompts || [];
        const goalTypes = [...(settings.goalTypes || []), ...(settings.customGoalTypes || [])];
        const rewardStyles = [...(settings.rewardStyles || []), ...(settings.customRewardStyles || [])];
        const punishmentStyles = [...(settings.punishmentStyles || []), ...(settings.customPunishmentStyles || [])];

        return `
            <h3 style="color: ${this.color};">${this.name}设置</h3>
            ${this.generateCheckbox('assistant-enabled', `启用${this.name}`, settings.enabled, this.color)}

            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">目标设置</h4>
                <label for="current-goal">当前目标：</label>
                <textarea id="current-goal" placeholder="输入你的总体目标，如：让主角成为武林盟主" style="width: 100%; min-height: 80px; margin-bottom: var(--spacing-md);">${this.taskData.currentGoal || ''}</textarea>

                <label for="goal-type">目标类型：</label>
                <select id="goal-type" style="width: 100%; padding: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
                    ${goalTypes.map(type => `<option value="${type}" ${this.taskData.goalType === type ? 'selected' : ''}>${type}</option>`).join('')}
                </select>
                <div style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
                    <input type="text" id="custom-goal-type" placeholder="添加自定义目标类型" style="flex: 1; padding: var(--spacing-sm);" />
                    <button id="add-goal-type" style="padding: var(--spacing-sm) var(--spacing-md); background-color: ${this.color}; color: white; border: none; border-radius: var(--border-radius-md);">添加</button>
                </div>

                <label for="goal-difficulty">目标难度：</label>
                <select id="goal-difficulty" style="width: 100%; padding: var(--spacing-sm);">
                    <option value="简单" ${this.taskData.goalDifficulty === '简单' ? 'selected' : ''}>简单</option>
                    <option value="普通" ${this.taskData.goalDifficulty === '普通' ? 'selected' : ''}>普通</option>
                    <option value="困难" ${this.taskData.goalDifficulty === '困难' ? 'selected' : ''}>困难</option>
                    <option value="地狱" ${this.taskData.goalDifficulty === '地狱' ? 'selected' : ''}>地狱</option>
                </select>

                <button id="save-goal" class="btn-primary" style="margin-top: var(--spacing-md);">设定目标</button>
            </div>

            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">奖励风格</h4>
                <label for="reward-style">奖励风格：</label>
                <select id="reward-style" style="width: 100%; padding: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
                    ${rewardStyles.map(style => `<option value="${style}" ${settings.rewardStyle === style ? 'selected' : ''}>${style}</option>`).join('')}
                </select>
                <div style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
                    <input type="text" id="custom-reward-style" placeholder="添加自定义奖励风格" style="flex: 1; padding: var(--spacing-sm);" />
                    <button id="add-reward-style" style="padding: var(--spacing-sm) var(--spacing-md); background-color: ${this.color}; color: white; border: none; border-radius: var(--border-radius-md);">添加</button>
                </div>
            </div>

            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">惩罚风格</h4>
                <label for="punishment-style">惩罚风格：</label>
                <select id="punishment-style" style="width: 100%; padding: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
                    ${punishmentStyles.map(style => `<option value="${style}" ${settings.punishmentStyle === style ? 'selected' : ''}>${style}</option>`).join('')}
                </select>
                <div style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
                    <input type="text" id="custom-punishment-style" placeholder="添加自定义惩罚风格" style="flex: 1; padding: var(--spacing-sm);" />
                    <button id="add-punishment-style" style="padding: var(--spacing-sm) var(--spacing-md); background-color: ${this.color}; color: white; border: none; border-radius: var(--border-radius-md);">添加</button>
                </div>

                ${this.generateCheckbox('enable-punishment', '启用惩罚机制', settings.enablePunishment, this.color)}
            </div>

            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">任务设置</h4>
                <label for="max-active-tasks">最大同时任务数：</label>
                <input type="number" id="max-active-tasks" value="${settings.maxActiveTasks || 3}" min="1" max="10" style="width: 100%; padding: var(--spacing-sm); margin-bottom: var(--spacing-md);" />

                ${this.generateCheckbox('enable-random-tasks', '启用随机任务', settings.enableRandomTasks, this.color)}
            </div>

            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">技能设置</h4>
                <label for="skill-cooldown">技能冷却时间（秒）：</label>
                <input type="number" id="skill-cooldown" value="${settings.skillCooldown || 60}" min="0" style="width: 100%; padding: var(--spacing-sm);" />
            </div>

            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <h4 style="color: ${this.color}; margin-bottom: var(--spacing-md);">自定义提示词</h4>
                ${Array.from({ length: 9 }, (_, index) => `
                    <div style="margin-bottom: var(--spacing-sm);">
                        <input type="text" id="custom-prompt-${index + 1}" value="${customPrompts[index] || ''}" placeholder="要求 ${index + 1}" style="width: 100%;" />
                    </div>
                `).join('')}
            </div>

            <button id="save-assistant-settings" class="btn-primary" style="margin-top: var(--spacing-lg); width: 100%;">保存设置</button>
        `;
    }

    bindSettingsEvents() {
        const addGoalTypeBtn = document.getElementById('add-goal-type');
        if (addGoalTypeBtn) {
            addGoalTypeBtn.addEventListener('click', () => {
                const input = document.getElementById('custom-goal-type');
                if (input && input.value.trim()) {
                    if (!this.settings.customGoalTypes) this.settings.customGoalTypes = [];
                    if (!this.settings.customGoalTypes.includes(input.value.trim())) {
                        this.settings.customGoalTypes.push(input.value.trim());
                        this.saveSettings();
                        location.reload();
                    } else {
                        alert('该类型已存在');
                    }
                    input.value = '';
                }
            });
        }

        const addRewardStyleBtn = document.getElementById('add-reward-style');
        if (addRewardStyleBtn) {
            addRewardStyleBtn.addEventListener('click', () => {
                const input = document.getElementById('custom-reward-style');
                if (input && input.value.trim()) {
                    if (!this.settings.customRewardStyles) this.settings.customRewardStyles = [];
                    if (!this.settings.customRewardStyles.includes(input.value.trim())) {
                        this.settings.customRewardStyles.push(input.value.trim());
                        this.saveSettings();
                        location.reload();
                    } else {
                        alert('该风格已存在');
                    }
                    input.value = '';
                }
            });
        }

        const addPunishmentStyleBtn = document.getElementById('add-punishment-style');
        if (addPunishmentStyleBtn) {
            addPunishmentStyleBtn.addEventListener('click', () => {
                const input = document.getElementById('custom-punishment-style');
                if (input && input.value.trim()) {
                    if (!this.settings.customPunishmentStyles) this.settings.customPunishmentStyles = [];
                    if (!this.settings.customPunishmentStyles.includes(input.value.trim())) {
                        this.settings.customPunishmentStyles.push(input.value.trim());
                        this.saveSettings();
                        location.reload();
                    } else {
                        alert('该风格已存在');
                    }
                    input.value = '';
                }
            });
        }

        const saveGoalBtn = document.getElementById('save-goal');
        if (saveGoalBtn) {
            saveGoalBtn.addEventListener('click', () => {
                const goalInput = document.getElementById('current-goal');
                const goalType = document.getElementById('goal-type');
                const goalDifficulty = document.getElementById('goal-difficulty');

                if (goalInput && goalInput.value.trim()) {
                    this.setGoal(goalInput.value.trim(), goalType.value, goalDifficulty.value);
                    alert('目标设定成功！');
                } else {
                    alert('请输入目标内容');
                }
            });
        }

        const saveSettingsBtn = document.getElementById('save-assistant-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                const enabled = document.getElementById('assistant-enabled')?.checked ?? true;
                const rewardStyle = document.getElementById('reward-style')?.value || '武侠';
                const punishmentStyle = document.getElementById('punishment-style')?.value || '武侠';
                const enablePunishment = document.getElementById('enable-punishment')?.checked ?? true;
                const maxActiveTasks = parseInt(document.getElementById('max-active-tasks')?.value) || 3;
                const enableRandomTasks = document.getElementById('enable-random-tasks')?.checked ?? true;
                const skillCooldown = parseInt(document.getElementById('skill-cooldown')?.value) || 60;

                const customPrompts = [];
                for (let i = 1; i <= 9; i++) {
                    const input = document.getElementById(`custom-prompt-${i}`);
                    if (input && input.value.trim()) {
                        customPrompts.push(input.value.trim());
                    }
                }

                this.updateSettings({
                    enabled,
                    rewardStyle,
                    punishmentStyle,
                    enablePunishment,
                    maxActiveTasks,
                    enableRandomTasks,
                    skillCooldown,
                    customPrompts
                });

                alert('设置保存成功！');
            });
        }
    }

    getTaskStatus() {
        return {
            currentGoal: this.taskData.currentGoal,
            activeTasks: this.taskData.tasks,
            completedTasks: this.taskData.completedTasks,
            failedTasks: this.taskData.failedTasks,
            rewards: this.taskData.rewards,
            skills: this.taskData.skills
        };
    }
}

export default TaskAssistant;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskAssistant;
} else if (typeof window !== 'undefined') {
    window.TaskAssistant = TaskAssistant;
}
