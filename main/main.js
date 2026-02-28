class App {
    constructor() {
        this.accessMode = this.detectAccessMode();
        this.worlds = [];
        this.init();
    }

    detectAccessMode() {
        return window.location.protocol === 'http:' || window.location.protocol === 'https:' ? 'http' : 'html';
    }

    async init() {
        console.log('初始化应用...');
        console.log('访问模式:', this.accessMode);
        
        await this.loadWorlds();
        this.renderWorlds();
    }

    async loadWorlds() {
        try {
            // 尝试使用storage对象加载世界数据
            if (typeof storage !== 'undefined') {
                this.worlds = storage.getWorlds();
                if (this.worlds.length === 0) {
                    // 如果没有数据，创建默认世界
                    this.createDefaultWorld();
                }
            } else {
                // 降级方案：直接从localStorage加载
                const worldsData = localStorage.getItem('aichat_worlds');
                if (worldsData) {
                    this.worlds = JSON.parse(worldsData);
                } else {
                    // 如果没有数据，创建默认世界
                    this.createDefaultWorld();
                }
            }
        } catch (error) {
            console.error('加载世界数据失败:', error);
            this.createDefaultWorld();
        }
    }

    createDefaultWorld() {
        const defaultWorld = {
            id: 'world-1',
            name: '',
            settings: {
                background: '',
                worldview: '',
                outputFormat: '对话式',
                outputStyle: '生动',
                time: ''
            },
            characters: ['character-1'],
            stories: []
        };

        // 创建空白主角
        const defaultCharacter = {
            id: 'character-1',
            name: '',
            isMain: true,
            profile: {
                description: '',
                personality: '',
                background: '',
                relationships: [],
                sceneExamples: '',
                notes: '',
                tags: []
            },
            stats: [],
            diaries: []
        };

        this.worlds = [defaultWorld];
        
        // 使用storage对象保存数据
        if (typeof storage !== 'undefined') {
            storage.saveWorld(defaultWorld);
            storage.saveCharacter(defaultCharacter);
        } else {
            // 降级方案：直接保存到localStorage
            localStorage.setItem('aichat_worlds', JSON.stringify(this.worlds));
            localStorage.setItem('aichat_character_character-1', JSON.stringify(defaultCharacter));
        }
    }

    renderWorlds() {
        const worldsList = document.getElementById('worlds-list');
        if (!worldsList) return;

        worldsList.innerHTML = '';

        this.worlds.forEach(world => {
            const worldCard = document.createElement('div');
            worldCard.className = 'world-card';
            worldCard.innerHTML = `
                <h3>${world.name}</h3>
                <p>创建时间: ${world.settings.time}</p>
                <p>最近活动: ${this.getLastActivity(world)}</p>
                <div class="world-card-buttons">
                    <button onclick="app.enterWorld('${world.id}')">进入世界</button>
                    <button onclick="exportSingleWorld('${world.id}')">导出</button>
                    <button onclick="app.deleteWorld('${world.id}')" class="delete-world-btn">删除世界</button>
                </div>
            `;
            worldsList.appendChild(worldCard);
        });
    }

    getLastActivity(world) {
        if (world.stories && world.stories.length > 0) {
            return '最近有故事记录';
        }
        return '暂无活动';
    }

    enterWorld(worldId) {
        // 保存当前选中的世界ID
        localStorage.setItem('currentWorldId', worldId);
        // 跳转到世界页面
        window.location.href = '../features/world-management/index.html';
    }

    deleteWorld(worldId) {
        if (confirm('确定要删除这个剧情世界吗？删除后将无法恢复。')) {
            try {
                // 首先获取世界数据，用于后续删除相关角色
                const world = storage.getWorldById(worldId);
                
                // 删除世界
                const worldDeleted = storage.deleteWorld(worldId);
                
                // 如果世界删除成功，删除相关角色
                if (worldDeleted && world && world.characters) {
                    world.characters.forEach(charId => {
                        storage.deleteCharacter(charId);
                    });
                }
                
                if (worldDeleted) {
                    // 重新加载世界列表
                    this.loadWorlds().then(() => {
                        this.renderWorlds();
                        // 直接显示成功提示，不需要再确认
                        alert('世界删除成功！');
                    });
                } else {
                    alert('世界删除失败！');
                }
            } catch (error) {
                console.error('删除世界失败:', error);
                alert('删除世界失败: ' + error.message);
            }
        }
    }
}

// 初始化应用
const app = new App();

// 导出全部世界数据
function exportAllWorlds() {
    try {
        const data = storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai故事世界_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('导出成功！');
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    }
}

// 导出单个世界
function exportSingleWorld(worldId) {
    try {
        const world = storage.getWorldById(worldId);
        if (!world) {
            alert('世界不存在');
            return;
        }

        const exportData = {
            version: '3.2.0',
            exportDate: new Date().toISOString(),
            type: 'ai-story-world',
            world: world,
            characters: [],
            stories: [],
            recentStories: [],
            assistants: null
        };

        // 导出该世界的角色
        if (world.characters) {
            world.characters.forEach(charId => {
                const character = storage.getCharacterById(charId);
                if (character) {
                    exportData.characters.push(character);
                }
            });
        }

        // 导出该世界的故事
        if (world.stories) {
            world.stories.forEach(storyId => {
                const story = storage.getStoryById(storyId);
                if (story) {
                    exportData.stories.push(story);
                }
            });
        }

        // 导出该世界的最近故事记录
        const allRecentStories = storage.getRecentStories();
        exportData.recentStories = allRecentStories.filter(s => s.worldId === worldId);

        // 导出该世界的小助手设置
        const assistantsKey = `assistants_${worldId}`;
        const assistantsData = localStorage.getItem(assistantsKey);
        if (assistantsData) {
            try {
                exportData.assistants = JSON.parse(assistantsData);
            } catch (e) {
                console.warn('解析小助手数据失败');
            }
        }

        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const worldName = world.name || '未命名世界';
        a.download = `${worldName}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`世界 "${worldName}" 导出成功！`);
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    }
}

// 导入世界
function importWorld() {
    document.getElementById('import-file-input').click();
}

// 处理导入文件
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // 检查数据格式
            if (!data.worlds || !Array.isArray(data.worlds)) {
                alert('无效的世界数据格式');
                return;
            }

            let importCount = 0;
            let skipCount = 0;

            // 导入世界
            data.worlds.forEach(world => {
                const existingWorld = storage.getWorldById(world.id);
                if (existingWorld) {
                    skipCount++;
                } else {
                    storage.saveWorld(world);
                    importCount++;
                }
            });

            // 导入角色
            if (data.characters && Array.isArray(data.characters)) {
                data.characters.forEach(character => {
                    storage.saveCharacter(character);
                });
            }

            // 导入故事
            if (data.stories && Array.isArray(data.stories)) {
                data.stories.forEach(story => {
                    storage.saveStory(story);
                });
            }

            // 重新加载世界列表
            app.loadWorlds().then(() => {
                app.renderWorlds();
                alert(`导入成功！新增 ${importCount} 个世界${skipCount > 0 ? `，跳过 ${skipCount} 个已存在的世界` : ''}`);
            });
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // 清空input，允许重复导入同一文件
    event.target.value = '';
}