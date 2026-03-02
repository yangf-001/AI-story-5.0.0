(function() {
    'use strict';

    // =====================================================
    // 核心数据结构定义
    // 定义了故事生成器中使用的所有数据模型结构
    // =====================================================

    const DataSchema = {
        World: {
            id: 'string',
            name: 'string',
            type: 'string',
            createdAt: 'datetime',
            updatedAt: 'datetime',
            settings: {
                tone: 'string',
                timeStart: 'datetime',
                adultContent: 'number',
                mode: 'string'
            },
            worldview: 'string',
            background: 'string',
            rules: ['string'],
            keywords: ['string']
        },

        Character: {
            id: 'string',
            worldId: 'string',
            name: 'string',
            isMain: 'boolean',
            baseProfile: {
                age: 'number',
                gender: 'string',
                appearance: 'string',
                personality: 'string'
            },
            dynamicProfile: {
                currentStatus: 'string',
                mood: 'string',
                location: 'string'
            },
            stats: {
                health: 'number',
                energy: 'number',
                arousal: 'number',
                affection: 'number'
            },
            inventory: ['string'],
            relationships: 'object'
        },

        Story: {
            id: 'string',
            worldId: 'string',
            startTime: 'datetime',
            endTime: 'datetime',
            summary: 'string',
            mainCharacters: ['string'],
            keyEvents: ['string'],
            choices: ['object']
        },

        Scene: {
            id: 'string',
            storyId: 'string',
            time: 'datetime',
            content: 'string',
            choices: ['object'],
            characters: ['string'],
            location: 'string',
            mood: 'string'
        },

        Task: {
            id: 'string',
            worldId: 'string',
            title: 'string',
            description: 'string',
            type: 'string',
            status: 'string',
            target: 'string',
            reward: 'object'
        },

        Item: {
            id: 'string',
            name: 'string',
            type: 'string',
            durability: 'number',
            maxDurability: 'number',
            effects: 'object',
            owner: 'string'
        },

        Event: {
            id: 'string',
            worldId: 'string',
            name: 'string',
            description: 'string',
            type: 'string',
            conditions: 'object',
            actions: 'object',
            cg: 'string',
            priority: 'number',
            isActive: 'boolean',
            createdAt: 'datetime',
            updatedAt: 'datetime'
        }
    };

    // =====================================================
    // 工具函数
    // =====================================================

    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // =====================================================
    // 数据管理器 - DataManager
    // =====================================================

    const DataManager = {
        _cache: {},
        _localStorageCache: {},
        _cacheExpiry: 5 * 60 * 1000, // 5分钟缓存过期时间
        _domCache: {}, // DOM元素缓存

        init(worldId) {
            this._cache[worldId] = this._cache[worldId] || {
                world: null,
                characters: new Map(),
                stories: [],
                currentStory: null,
                tasks: [],
                inventory: [],
                time: null,
                hentaiSettings: null
            };
            return this._cache[worldId];
        },

        // DOM元素缓存
        getElement(id) {
            if (!this._domCache[id]) {
                this._domCache[id] = document.getElementById(id);
            }
            return this._domCache[id];
        },

        // 清理缓存
        clearCache() {
            this._domCache = {};
        },

        // LocalStorage 缓存操作
        _getFromCache(key) {
            const cached = this._localStorageCache[key];
            if (cached && Date.now() - cached.timestamp < this._cacheExpiry) {
                return cached.data;
            }
            return null;
        },

        _setToCache(key, data) {
            this._localStorageCache[key] = {
                data: data,
                timestamp: Date.now()
            };
        },

        _clearCache(key) {
            if (key) {
                delete this._localStorageCache[key];
            } else {
                this._localStorageCache = {};
            }
        },

        // 世界相关
        getWorlds() {
            const cached = this._getFromCache('worlds');
            if (cached) return cached;
            
            try {
                const data = localStorage.getItem('worlds');
                const worlds = data ? JSON.parse(data) : [];
                this._setToCache('worlds', worlds);
                return worlds;
            } catch (e) {
                console.error('获取世界列表失败:', e);
                return [];
            }
        },

        getWorld(worldId) {
            const worlds = this.getWorlds();
            return worlds.find(w => w.id === worldId);
        },

        saveWorld(world) {
            try {
                const worlds = this.getWorlds();
                const index = worlds.findIndex(w => w.id === world.id);
                if (index >= 0) {
                    worlds[index] = world;
                } else {
                    worlds.push(world);
                }
                localStorage.setItem('worlds', JSON.stringify(worlds));
                this._clearCache('worlds');
                
                // 同时更新 world_${worldId} 键中的世界数据
                const data = this._getWorldData(world.id);
                this._saveWorldData(world.id, { ...data, ...world });
            } catch (e) {
                console.error('保存世界失败:', e);
            }
        },

        deleteWorld(worldId) {
            try {
                const worlds = this.getWorlds().filter(w => w.id !== worldId);
                localStorage.setItem('worlds', JSON.stringify(worlds));
                localStorage.removeItem(`world_${worldId}`);
                this._clearCache('worlds');
            } catch (e) {
                console.error('删除世界失败:', e);
            }
        },

        // 角色相关
        getCharacters(worldId) {
            const data = this._getWorldData(worldId);
            return Array.from(data.characters.values()) || [];
        },

        getMainCharacters(worldId) {
            return this.getCharacters(worldId).filter(c => c.isMain);
        },

        getTempCharacters(worldId) {
            return this.getCharacters(worldId).filter(c => !c.isMain);
        },

        getCharacter(worldId, characterId) {
            const data = this._getWorldData(worldId);
            return data.characters.get(characterId);
        },

        addCharacter(worldId, character) {
            const data = this._getWorldData(worldId);
            character.id = character.id || generateId();
            character.worldId = worldId;
            data.characters.set(character.id, character);
            this._saveWorldData(worldId, data);
            return character;
        },

        updateCharacter(worldId, characterId, updates) {
            const data = this._getWorldData(worldId);
            const character = data.characters.get(characterId);
            if (character) {
                data.characters.set(characterId, { ...character, ...updates });
                this._saveWorldData(worldId, data);
            }
        },

        deleteCharacter(worldId, characterId) {
            const data = this._getWorldData(worldId);
            data.characters.delete(characterId);
            this._saveWorldData(worldId, data);
        },

        // 角色数值
        getCharacterStats(worldId, characterId) {
            const char = this.getCharacter(worldId, characterId);
            return char ? char.stats : null;
        },

        updateCharacterStat(worldId, characterId, statName, value) {
            const data = this._getWorldData(worldId);
            let char;
            if (data.characters instanceof Map) {
                char = data.characters.get(characterId);
            } else if (Array.isArray(data.characters)) {
                char = data.characters.find(c => c.id === characterId);
            }
            if (char && char.stats && statName in char.stats) {
                char.stats[statName] = Math.max(0, Math.min(100, value));
                this._saveWorldData(worldId, data);
            }
        },

        updateCharacterStats(worldId, characterId, stats) {
            const data = this._getWorldData(worldId);
            let char;
            if (data.characters instanceof Map) {
                char = data.characters.get(characterId);
            } else if (Array.isArray(data.characters)) {
                char = data.characters.find(c => c.id === characterId);
            }
            if (char) {
                char.stats = char.stats || {};
                Object.keys(stats).forEach(key => {
                    char.stats[key] = Math.max(0, Math.min(100, stats[key]));
                });
                this._saveWorldData(worldId, data);
            }
        },

        // 角色档案
        getCharacterProfile(worldId, characterId) {
            const char = this.getCharacter(worldId, characterId);
            return char ? { base: char.baseProfile, dynamic: char.dynamicProfile } : null;
        },

        updateCharacterProfile(worldId, characterId, section, key, value) {
            const data = this._getWorldData(worldId);
            let char;
            if (data.characters instanceof Map) {
                char = data.characters.get(characterId);
            } else if (Array.isArray(data.characters)) {
                char = data.characters.find(c => c.id === characterId);
            }
            if (char) {
                if (section === 'base' && char.baseProfile) {
                    char.baseProfile[key] = value;
                } else if (section === 'dynamic' && char.dynamicProfile) {
                    char.dynamicProfile[key] = value;
                }
                this._saveWorldData(worldId, data);
            }
        },

        saveCharacterProfile(worldId, characterId, profile) {
            const data = this._getWorldData(worldId);
            let char;
            if (data.characters instanceof Map) {
                char = data.characters.get(characterId);
            } else if (Array.isArray(data.characters)) {
                char = data.characters.find(c => c.id === characterId);
            }
            if (char) {
                if (profile.base) {
                    char.baseProfile = { ...char.baseProfile, ...profile.base };
                }
                if (profile.dynamic) {
                    char.dynamicProfile = { ...char.dynamicProfile, ...profile.dynamic };
                }
                this._saveWorldData(worldId, data);
            }
        },

        // 角色关系
        getRelationships(worldId) {
            const chars = this.getCharacters(worldId);
            const relationships = {};
            chars.forEach(c => {
                relationships[c.id] = c.relationships || {};
            });
            return relationships;
        },

        updateRelationship(worldId, charId, targetId, type, value) {
            const data = this._getWorldData(worldId);
            let char;
            if (data.characters instanceof Map) {
                char = data.characters.get(charId);
            } else if (Array.isArray(data.characters)) {
                char = data.characters.find(c => c.id === charId);
            }
            if (char) {
                char.relationships = char.relationships || {};
                char.relationships[targetId] = char.relationships[targetId] || {};
                char.relationships[targetId][type] = value;
                this._saveWorldData(worldId, data);
            }
        },

        // 故事相关
        getStories(worldId, limit = 50) {
            const key = `stories_${worldId}`;
            const data = localStorage.getItem(key);
            const stories = data ? JSON.parse(data) : [];
            return stories.slice(0, limit);
        },

        getCurrentStory(worldId) {
            const key = `currentStory_${worldId}`;
            const data = localStorage.getItem(key);
            if (!data || data === 'null') return null;
            try {
                const story = JSON.parse(data);
                return story;
            } catch (e) {
                console.error('解析当前故事失败:', e);
                return null;
            }
        },

        saveCurrentStory(worldId, story) {
            const key = `currentStory_${worldId}`;
            if (story === null || story === undefined) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(story));
                
                // 保存故事后检查并触发事件
                this.checkAndTriggerEvents(worldId);
            }
        },

        checkAndTriggerEvents(worldId) {
            const events = this.getEvents(worldId);
            const activeEvents = events.filter(e => e.isActive);
            
            // 按优先级排序
            activeEvents.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            
            for (const event of activeEvents) {
                if (this.checkEventConditions(worldId, event)) {
                    const triggeredEvent = this.triggerEvent(worldId, event.id);
                    if (triggeredEvent) {
                        console.log('事件触发:', triggeredEvent.name);
                        // 可以在这里添加事件触发的通知或其他处理
                        break; // 一次只触发一个事件
                    }
                }
            }
        },

        saveStoryToHistory(worldId, story) {
            const key = `stories_${worldId}`;
            const data = localStorage.getItem(key);
            const stories = data ? JSON.parse(data) : [];
            
            // 只保存摘要和关键信息，减少存储占用
            const storySummary = {
                id: story.id,
                worldId: story.worldId,
                startTime: story.startTime,
                endTime: story.endTime,
                summary: story.summary,
                mainCharacters: story.mainCharacters,
                keyEvents: story.keyEvents,
                mode: story.mode
            };
            
            stories.unshift(storySummary);
            if (stories.length > 50) stories.length = 50;
            localStorage.setItem(key, JSON.stringify(stories));
        },

        // 存档管理
        saveGameSave(worldId, saveName, story) {
            try {
                const currentStory = story || this.getCurrentStory(worldId);
                if (!currentStory) return null;
                
                const save = {
                    id: generateId(),
                    worldId: worldId,
                    name: saveName || `存档 ${new Date().toLocaleString()}`,
                    timestamp: new Date().toISOString(),
                    story: currentStory,
                    version: '1.2' // 增加版本号，用于后续扩展
                };
                
                const saves = this.getGameSaves(worldId);
                saves.unshift(save);
                if (saves.length > 10) saves.length = 10; // 最多保存10个存档
                
                localStorage.setItem(`saves_${worldId}`, JSON.stringify(saves));
                return save;
            } catch (e) {
                console.error('保存存档失败:', e);
                return null;
            }
        },

        getGameSaves(worldId) {
            try {
                const key = `saves_${worldId}`;
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : [];
            } catch (e) {
                console.error('获取存档列表失败:', e);
                return [];
            }
        },

        loadGameSave(worldId, saveId) {
            try {
                const saves = this.getGameSaves(worldId);
                const save = saves.find(s => s.id === saveId);
                if (save) {
                    // 版本兼容性处理
                    this._migrateSaveData(save);
                    this.saveCurrentStory(worldId, save.story);
                    return save;
                }
                return null;
            } catch (e) {
                console.error('加载存档失败:', e);
                return null;
            }
        },

        deleteGameSave(worldId, saveId) {
            try {
                const saves = this.getGameSaves(worldId);
                const filteredSaves = saves.filter(s => s.id !== saveId);
                localStorage.setItem(`saves_${worldId}`, JSON.stringify(filteredSaves));
            } catch (e) {
                console.error('删除存档失败:', e);
            }
        },

        exportGameSave(save) {
            try {
                return JSON.stringify(save, null, 2);
            } catch (e) {
                console.error('导出存档失败:', e);
                return null;
            }
        },

        importGameSave(worldId, saveJson) {
            try {
                const save = JSON.parse(saveJson);
                if (save.worldId === worldId) {
                    // 版本兼容性处理
                    this._migrateSaveData(save);
                    const saves = this.getGameSaves(worldId);
                    saves.unshift(save);
                    if (saves.length > 10) saves.length = 10;
                    localStorage.setItem(`saves_${worldId}`, JSON.stringify(saves));
                    return save;
                }
                return null;
            } catch (e) {
                console.error('导入存档失败:', e);
                return null;
            }
        },

        updateGameSave(worldId, saveId, updatedStory) {
            try {
                const saves = this.getGameSaves(worldId);
                const saveIndex = saves.findIndex(s => s.id === saveId);
                if (saveIndex !== -1) {
                    saves[saveIndex].story = updatedStory;
                    saves[saveIndex].timestamp = new Date().toISOString();
                    saves[saveIndex].version = '1.2'; // 更新版本号
                    localStorage.setItem(`saves_${worldId}`, JSON.stringify(saves));
                    return saves[saveIndex];
                }
                return null;
            } catch (e) {
                console.error('更新存档失败:', e);
                return null;
            }
        },

        getSaveById(worldId, saveId) {
            try {
                const saves = this.getGameSaves(worldId);
                return saves.find(s => s.id === saveId) || null;
            } catch (e) {
                console.error('获取存档失败:', e);
                return null;
            }
        },

        // 存档版本迁移
        _migrateSaveData(save) {
            if (!save.version) {
                // 为旧版本存档添加版本号
                save.version = '1.0';
            }
            
            // 版本 1.0 到 1.1 的迁移
            if (save.version === '1.0') {
                // 在这里添加需要的迁移逻辑
                save.version = '1.1';
            }
            
            // 版本 1.1 到 1.2 的迁移
            if (save.version === '1.1') {
                // 在这里添加需要的迁移逻辑
                save.version = '1.2';
            }
        },

        getStorySummary(worldId) {
            const stories = this.getStories(worldId, 5);
            return stories.map(s => ({
                id: s.id,
                startTime: s.startTime,
                endTime: s.endTime,
                summary: s.summary,
                mainCharacters: s.mainCharacters
            }));
        },

        // 物品相关
        getInventory(worldId, characterId = null) {
            const data = this._getWorldData(worldId);
            if (characterId) {
                let char;
                if (data.characters instanceof Map) {
                    char = data.characters.get(characterId);
                } else if (Array.isArray(data.characters)) {
                    char = data.characters.find(c => c.id === characterId);
                }
                return char ? char.inventory : [];
            }
            return data.inventory || [];
        },

        addItem(worldId, item, ownerId = null) {
            const data = this._getWorldData(worldId);
            item.id = item.id || generateId();

            if (ownerId) {
                let char;
                if (data.characters instanceof Map) {
                    char = data.characters.get(ownerId);
                } else if (Array.isArray(data.characters)) {
                    char = data.characters.find(c => c.id === ownerId);
                }
                if (char) {
                    char.inventory = char.inventory || [];
                    char.inventory.push(item.id);
                }
            } else {
                data.inventory = data.inventory || [];
                data.inventory.push(item);
            }
            this._saveWorldData(worldId, data);
            return item;
        },

        removeItem(worldId, itemId, ownerId = null) {
            const data = this._getWorldData(worldId);
            if (ownerId) {
                let char;
                if (data.characters instanceof Map) {
                    char = data.characters.get(ownerId);
                } else if (Array.isArray(data.characters)) {
                    char = data.characters.find(c => c.id === ownerId);
                }
                if (char && char.inventory) {
                    char.inventory = char.inventory.filter(id => id !== itemId);
                }
            } else if (data.inventory) {
                data.inventory = data.inventory.filter(i => i.id !== itemId);
            }
            this._saveWorldData(worldId, data);
        },

        useItem(worldId, itemId, ownerId) {
            const data = this._getWorldData(worldId);
            let item = null;

            let char;
            if (data.characters instanceof Map) {
                char = data.characters.get(ownerId);
            } else if (Array.isArray(data.characters)) {
                char = data.characters.find(c => c.id === ownerId);
            }
            if (char && char.inventory) {
                item = char.inventory.find(i => (i.id || i) === itemId);
            }

            if (!item && data.inventory) {
                item = data.inventory.find(i => i.id === itemId);
            }

            if (item && item.durability !== undefined) {
                item.durability--;
                if (item.durability <= 0) {
                    this.removeItem(worldId, itemId, ownerId);
                } else {
                    this._saveWorldData(worldId, data);
                }
            }
        },

        // 任务相关
        getTasks(worldId) {
            const data = this._getWorldData(worldId);
            return data.tasks || [];
        },

        addTask(worldId, task) {
            const data = this._getWorldData(worldId);
            task.id = task.id || generateId();
            task.worldId = worldId;
            task.status = task.status || 'active';
            data.tasks = data.tasks || [];
            data.tasks.push(task);
            this._saveWorldData(worldId, data);
            return task;
        },

        updateTask(worldId, taskId, updates) {
            const data = this._getWorldData(worldId);
            const task = data.tasks.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, updates);
                this._saveWorldData(worldId, data);
            }
        },

        completeTask(worldId, taskId) {
            this.updateTask(worldId, taskId, { status: 'completed' });
        },

        // 色色系统设置
        getHentaiSettings(worldId) {
            const world = this.getWorld(worldId);
            return world ? world.hentaiSettings : this._getDefaultHentaiSettings();
        },

        _getDefaultHentaiSettings() {
            return {
                enabled: true,
                intensity: 50,
                variety: 50,
                scenes: {
                    dialogue: true,
                    items: true,
                    action: true,
                    body: true,
                    pose: true,
                    location: true,
                    style: true,
                    extreme: false,
                    weird: false
                }
            };
        },

        saveHentaiSettings(worldId, settings) {
            const world = this.getWorld(worldId);
            if (world) {
                world.hentaiSettings = settings;
                this.saveWorld(world);
            }
        },

        // 事件相关
        getEvents(worldId) {
            const data = this._getWorldData(worldId);
            return data.events || [];
        },

        getEvent(worldId, eventId) {
            const data = this._getWorldData(worldId);
            return data.events?.find(e => e.id === eventId) || null;
        },

        addEvent(worldId, event) {
            const data = this._getWorldData(worldId);
            event.id = event.id || generateId();
            event.worldId = worldId;
            event.createdAt = new Date().toISOString();
            event.updatedAt = new Date().toISOString();
            event.isActive = event.isActive !== false;
            event.priority = event.priority || 5;
            data.events = data.events || [];
            data.events.push(event);
            this._saveWorldData(worldId, data);
            return event;
        },

        updateEvent(worldId, eventId, updates) {
            const data = this._getWorldData(worldId);
            const event = data.events?.find(e => e.id === eventId);
            if (event) {
                Object.assign(event, updates);
                event.updatedAt = new Date().toISOString();
                this._saveWorldData(worldId, data);
            }
        },

        deleteEvent(worldId, eventId) {
            const data = this._getWorldData(worldId);
            data.events = data.events?.filter(e => e.id !== eventId) || [];
            this._saveWorldData(worldId, data);
        },

        // 事件导入导出
        exportEvents(worldId) {
            try {
                const events = this.getEvents(worldId);
                const exportData = {
                    version: '1.0',
                    worldId: worldId,
                    events: events,
                    exportTime: new Date().toISOString()
                };
                return JSON.stringify(exportData, null, 2);
            } catch (e) {
                console.error('导出事件失败:', e);
                return null;
            }
        },

        importEvents(worldId, eventsJson) {
            try {
                const importData = JSON.parse(eventsJson);
                if (!importData.events || !Array.isArray(importData.events)) {
                    return false;
                }

                const data = this._getWorldData(worldId);
                data.events = data.events || [];

                let importedCount = 0;
                importData.events.forEach(event => {
                    // 为导入的事件生成新ID，避免冲突
                    event.id = generateId();
                    event.worldId = worldId;
                    event.createdAt = new Date().toISOString();
                    event.updatedAt = new Date().toISOString();
                    data.events.push(event);
                    importedCount++;
                });

                this._saveWorldData(worldId, data);
                return importedCount;
            } catch (e) {
                console.error('导入事件失败:', e);
                return false;
            }
        },

        // 世界设定导入导出
        exportWorldSettings(worldId) {
            try {
                const world = this.getWorld(worldId);
                if (!world) return null;

                const exportData = {
                    version: '1.0',
                    worldId: worldId,
                    settings: {
                        name: world.name,
                        type: world.type,
                        settings: world.settings,
                        worldview: world.worldview,
                        background: world.background,
                        rules: world.rules,
                        keywords: world.keywords,
                        hentaiSettings: world.hentaiSettings
                    },
                    exportTime: new Date().toISOString()
                };
                return JSON.stringify(exportData, null, 2);
            } catch (e) {
                console.error('导出世界设定失败:', e);
                return null;
            }
        },

        importWorldSettings(worldId, settingsJson) {
            try {
                const importData = JSON.parse(settingsJson);
                if (!importData.settings) {
                    return false;
                }

                const world = this.getWorld(worldId);
                if (!world) return false;

                const settings = importData.settings;
                Object.assign(world, {
                    name: settings.name || world.name,
                    type: settings.type || world.type,
                    settings: settings.settings || world.settings,
                    worldview: settings.worldview || world.worldview,
                    background: settings.background || world.background,
                    rules: settings.rules || world.rules,
                    keywords: settings.keywords || world.keywords,
                    hentaiSettings: settings.hentaiSettings || world.hentaiSettings,
                    updatedAt: new Date().toISOString()
                });

                this.saveWorld(world);
                return true;
            } catch (e) {
                console.error('导入世界设定失败:', e);
                return false;
            }
        },

        // 人设导入导出
        exportCharacters(worldId) {
            try {
                const characters = this.getCharacters(worldId);
                const exportData = {
                    version: '1.0',
                    worldId: worldId,
                    characters: characters,
                    exportTime: new Date().toISOString()
                };
                return JSON.stringify(exportData, null, 2);
            } catch (e) {
                console.error('导出人设失败:', e);
                return null;
            }
        },

        importCharacters(worldId, charactersJson) {
            try {
                const importData = JSON.parse(charactersJson);
                if (!importData.characters || !Array.isArray(importData.characters)) {
                    return false;
                }

                let importedCount = 0;
                importData.characters.forEach(character => {
                    // 为导入的角色生成新ID，避免冲突
                    character.id = generateId();
                    character.worldId = worldId;
                    this.addCharacter(worldId, character);
                    importedCount++;
                });

                return importedCount;
            } catch (e) {
                console.error('导入人设失败:', e);
                return false;
            }
        },

        checkEventConditions(worldId, event) {
            if (!event.conditions) return true;
            
            const data = this._getWorldData(worldId);
            const characters = Array.from(data.characters.values());
            const currentStory = this.getCurrentStory(worldId);
            
            // 检查角色条件
            if (event.conditions.character) {
                const charCondition = event.conditions.character;
                const char = characters.find(c => c.id === charCondition.id);
                if (!char) return false;
                
                // 检查角色属性
                if (charCondition.stats) {
                    for (const [stat, minValue] of Object.entries(charCondition.stats)) {
                        if (char.stats?.[stat] < minValue) return false;
                    }
                }
                
                // 检查角色状态
                if (charCondition.status && char.dynamicProfile?.currentStatus !== charCondition.status) {
                    return false;
                }
            }
            
            // 检查故事条件
            if (event.conditions.story) {
                const storyCondition = event.conditions.story;
                if (!currentStory) return false;
                
                if (storyCondition.sceneCount && currentStory.scenes?.length < storyCondition.sceneCount) {
                    return false;
                }
                
                if (storyCondition.keywords) {
                    const storyText = JSON.stringify(currentStory);
                    if (!storyCondition.keywords.some(keyword => storyText.includes(keyword))) {
                        return false;
                    }
                }
            }
            
            // 检查时间条件
            if (event.conditions.time) {
                const timeCondition = event.conditions.time;
                const currentTime = TimeManager.getTime(worldId);
                const currentDate = new Date(currentTime.timestamp);
                
                if (timeCondition.dayOfWeek && currentDate.getDay() !== timeCondition.dayOfWeek) {
                    return false;
                }
                
                if (timeCondition.hour && currentDate.getHours() !== timeCondition.hour) {
                    return false;
                }
            }
            
            return true;
        },

        triggerEvent(worldId, eventId) {
            const event = this.getEvent(worldId, eventId);
            if (!event || !event.isActive) return null;
            
            if (!this.checkEventConditions(worldId, event)) return null;
            
            // 执行事件动作
            if (event.actions) {
                const data = this._getWorldData(worldId);
                
                // 角色属性变化
                if (event.actions.characterStats) {
                    for (const [charId, stats] of Object.entries(event.actions.characterStats)) {
                        DataManager.updateCharacterStats(worldId, charId, stats);
                    }
                }
                
                // 任务操作
                if (event.actions.tasks) {
                    event.actions.tasks.forEach(taskAction => {
                        if (taskAction.type === 'add') {
                            TaskManager.createTask(worldId, taskAction.config);
                        }
                    });
                }
            }
            
            return event;
        },

        // 私有方法
        _getWorldData(worldId) {
            try {
                if (!this._cache[worldId]) {
                    this.init(worldId);
                    const key = `world_${worldId}`;
                    const saved = localStorage.getItem(key);
                    if (saved) {
                        try {
                            const parsed = JSON.parse(saved);
                            // 将角色数组转换为 Map
                            if (Array.isArray(parsed.characters)) {
                                const charactersMap = new Map();
                                parsed.characters.forEach(char => {
                                    if (char.id) {
                                        charactersMap.set(char.id, char);
                                    }
                                });
                                parsed.characters = charactersMap;
                            }
                            this._cache[worldId] = { ...this._cache[worldId], ...parsed };
                        } catch (e) {
                            console.error('解析世界数据失败:', e);
                        }
                    }
                }
                return this._cache[worldId];
            } catch (e) {
                console.error('获取世界数据失败:', e);
                return this.init(worldId);
            }
        },

        _saveWorldData(worldId, data) {
            try {
                const key = `world_${worldId}`;
                // 将 Map 转换为数组，以便存储到 localStorage
                const dataToSave = JSON.parse(JSON.stringify(data));
                if (data.characters instanceof Map) {
                    dataToSave.characters = Array.from(data.characters.values());
                }
                localStorage.setItem(key, JSON.stringify(dataToSave));
            } catch (e) {
                console.error('保存世界数据失败:', e);
            }
        }
    };

    // =====================================================
    // 时间管理器 - TimeManager
    // =====================================================

    const TimeManager = {
        getTime(worldId) {
            const data = DataManager._getWorldData(worldId);
            return data.time || this._getDefaultTime();
        },

        setTime(worldId, time) {
            const data = DataManager._getWorldData(worldId);
            data.time = time;
            DataManager._saveWorldData(worldId, data);
        },

        advanceTime(worldId, amount, unit = 'hours') {
            const current = this.getTime(worldId);
            const newTime = new Date(current.timestamp);

            switch (unit) {
                case 'minutes': newTime.setMinutes(newTime.getMinutes() + amount); break;
                case 'hours': newTime.setHours(newTime.getHours() + amount); break;
                case 'days': newTime.setDate(newTime.getDate() + amount); break;
                case 'weeks': newTime.setDate(newTime.getDate() + amount * 7); break;
                case 'months': newTime.setMonth(newTime.getMonth() + amount); break;
                case 'years': newTime.setFullYear(newTime.getFullYear() + amount); break;
            }

            this.setTime(worldId, {
                timestamp: newTime.getTime(),
                formatted: this._formatTime(newTime)
            });

            return newTime;
        },

        _getDefaultTime() {
            const now = new Date();
            return {
                timestamp: now.getTime(),
                formatted: this._formatTime(now)
            };
        },

        _formatTime(date) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hour = date.getHours();
            const minute = date.getMinutes();
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const weekday = weekdays[date.getDay()];
            return `${year}年${month}月${day}日 ${weekday} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        },

        getTimeDifference(worldId, targetTime) {
            const current = this.getTime(worldId);
            const diff = new Date(targetTime) - new Date(current.timestamp);
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(hours / 24);
            return { hours, days, total: diff };
        },

        isCharacterActive(worldId, characterId) {
            const character = DataManager.getCharacter(worldId, characterId);
            if (!character || !character.baseProfile) return false;

            const birthDate = character.baseProfile.birthDate;
            if (!birthDate) return true;

            const current = new Date(this.getTime(worldId).timestamp);
            const birth = new Date(birthDate);
            return current >= birth;
        },

        getCharacterAge(worldId, characterId) {
            const character = DataManager.getCharacter(worldId, characterId);
            if (!character) return null;
            
            if (character.baseProfile?.age) {
                return character.baseProfile.age;
            }
            
            if (!character.baseProfile || !character.baseProfile.birthDate) return null;

            const current = new Date(this.getTime(worldId).timestamp);
            const birth = new Date(character.baseProfile.birthDate);
            let age = current.getFullYear() - birth.getFullYear();
            const monthDiff = current.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && current.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        }
    };

    // =====================================================
    // 世界管理器 - WorldManager
    // =====================================================

    const WorldManager = {
        create(config) {
            const world = {
                id: generateId(),
                name: config.name,
                type: config.type || '自定义',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                settings: {
                    tone: config.tone || '中性',
                    timeStart: config.timeStart || new Date().toISOString(),
                    adultContent: config.adultContent || 50,
                    mode: config.mode || '互动'
                },
                worldview: config.worldview || '',
                background: config.background || '',
                rules: config.rules || [],
                keywords: config.keywords || [],
                hentaiSettings: DataManager._getDefaultHentaiSettings()
            };

            DataManager.saveWorld(world);
            DataManager.init(world.id);

            const data = DataManager._getWorldData(world.id);
            data.world = world;
            data.time = { timestamp: new Date(world.settings.timeStart).getTime(), formatted: TimeManager._formatTime(new Date(world.settings.timeStart)) };
            DataManager._saveWorldData(world.id, data);

            if (config.mainCharacters && config.mainCharacters.length > 0) {
                config.mainCharacters.forEach(char => {
                    char.isMain = true;
                    DataManager.addCharacter(world.id, char);
                });
            }

            return world;
        },

        getAll() {
            return DataManager.getWorlds();
        },

        get(worldId) {
            return DataManager.getWorld(worldId);
        },

        update(worldId, updates) {
            const world = DataManager.getWorld(worldId);
            if (world) {
                Object.assign(world, updates);
                world.updatedAt = new Date().toISOString();
                DataManager.saveWorld(world);
            }
        },

        delete(worldId) {
            DataManager.deleteWorld(worldId);
        }
    };

    // =====================================================
    // 物品管理器 - InventoryManager
    // =====================================================

    const InventoryManager = {
        getItems(worldId, characterId = null) {
            const data = DataManager._getWorldData(worldId);
            if (!data) return [];
            
            const allItems = characterId 
                ? (data.characters instanceof Map 
                    ? (data.characters.get(characterId)?.inventory || [])
                    : (data.characters?.find(c => c.id === characterId)?.inventory || []))
                : (data.inventory || []);
            
            if (!allItems || !Array.isArray(allItems)) return [];
            
            return allItems.map(itemId => {
                if (typeof itemId === 'object') return itemId;
                const worldItems = data.inventory || [];
                return worldItems.find(i => i.id === itemId);
            }).filter(Boolean);
        },

        createItem(config) {
            const item = {
                id: generateId(),
                name: config.name,
                type: config.type || 'misc',
                durability: config.durability || config.maxDurability || 1,
                maxDurability: config.maxDurability || 1,
                effects: config.effects || {},
                description: config.description || '',
                icon: config.icon || '📦'
            };
            return item;
        },

        giveItem(worldId, item, ownerId = null) {
            return DataManager.addItem(worldId, item, ownerId);
        },

        takeItem(worldId, itemId, ownerId = null) {
            DataManager.removeItem(worldId, itemId, ownerId);
        },

        useItem(worldId, itemId, ownerId, targetId = null) {
            const data = DataManager._getWorldData(worldId);
            let item = null;

            if (ownerId) {
                let char;
                if (data.characters instanceof Map) {
                    char = data.characters.get(ownerId);
                } else if (Array.isArray(data.characters)) {
                    char = data.characters.find(c => c.id === ownerId);
                }
                if (char && char.inventory) {
                    const itemRef = char.inventory.find(i => (i.id || i) === itemId);
                    if (typeof itemRef === 'object') item = itemRef;
                }
            }

            if (!item) {
                item = (data.inventory || []).find(i => i.id === itemId);
            }

            if (!item) return null;

            if (item.effects) {
                if (item.effects.arousal && targetId) {
                    DataManager.updateCharacterStat(worldId, targetId, 'arousal', (DataManager.getCharacterStats(worldId, targetId)?.arousal || 0) + item.effects.arousal);
                }
                if (item.effects.energy && targetId) {
                    DataManager.updateCharacterStat(worldId, targetId, 'energy', (DataManager.getCharacterStats(worldId, targetId)?.energy || 0) + item.effects.energy);
                }
            }

            DataManager.useItem(worldId, itemId, ownerId);
            return item;
        }
    };

    // =====================================================
    // 任务管理器 - TaskManager
    // =====================================================

    const TaskManager = {
        getTasks(worldId, status = null) {
            let tasks = DataManager.getTasks(worldId);
            if (status) {
                tasks = tasks.filter(t => t.status === status);
            }
            return tasks;
        },

        createTask(worldId, config) {
            const task = {
                title: config.title,
                description: config.description,
                type: config.type || 'system',
                status: 'active',
                target: config.target,
                progress: config.progress || 0,
                maxProgress: config.maxProgress || 1,
                reward: config.reward || {},
                createdAt: new Date().toISOString()
            };
            return DataManager.addTask(worldId, task);
        },

        updateProgress(worldId, taskId, progress) {
            const tasks = DataManager.getTasks(worldId);
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.progress = progress;
                if (task.progress >= task.maxProgress) {
                    this.completeTask(worldId, taskId);
                } else {
                    DataManager.updateTask(worldId, taskId, { progress });
                }
            }
        },

        completeTask(worldId, taskId) {
            const tasks = DataManager.getTasks(worldId);
            const task = tasks.find(t => t.id === taskId);
            if (task && task.reward) {
                if (task.reward.item) {
                    InventoryManager.giveItem(worldId, task.reward.item, task.reward.owner);
                }
                if (task.reward.stats) {
                    Object.entries(task.reward.stats).forEach(([charId, stats]) => {
                        Object.entries(stats).forEach(([stat, value]) => {
                            DataManager.updateCharacterStat(worldId, charId, stat, (DataManager.getCharacterStats(worldId, charId)?.[stat] || 0) + value);
                        });
                    });
                }
            }
            DataManager.completeTask(worldId, taskId);
        },

        suggestTasks(worldId) {
            const stories = DataManager.getStories(worldId, 1);
            const current = DataManager.getCurrentStory(worldId);
            const suggestions = [];

            if (!stories.length && !current) {
                suggestions.push({
                    title: '开始第一个故事',
                    description: '创建你的第一个故事剧情',
                    type: 'suggestion'
                });
            }

            const mainChars = DataManager.getMainCharacters(worldId);
            mainChars.forEach(char => {
                const stats = DataManager.getCharacterStats(worldId, char.id);
                if (stats && stats.arousal > 70) {
                    suggestions.push({
                        title: `帮助 ${char.name} 降火`,
                        description: `${char.name} 似乎很躁动...`,
                        type: 'suggestion',
                        priority: 'high'
                    });
                }
            });

            return suggestions;
        },

        generateSmartSuggestions(worldId) {
            const suggestions = [];
            const stories = DataManager.getStories(worldId);
            const current = DataManager.getCurrentStory(worldId);
            const mainChars = DataManager.getMainCharacters(worldId);
            const world = DataManager.getWorld(worldId);

            if (stories.length > 0 && !current) {
                suggestions.push({
                    title: '继续故事',
                    description: '基于上次剧情继续发展',
                    type: 'continue',
                    icon: '🔄'
                });
            }

            if (mainChars.length >= 2) {
                const relationships = mainChars.flatMap(c => 
                    Object.values(c.relationships || {}).map(r => ({...r, char: c.name}))
                );
                const closeRels = relationships.filter(r => r.affection > 70);
                if (closeRels.length > 0) {
                    suggestions.push({
                        title: '加深关系',
                        description: `${closeRels[0].char}和某人感情很好...`,
                        type: 'relationship',
                        icon: '💕'
                    });
                }
            }

            if (world?.settings?.tone === '浪漫') {
                suggestions.push({
                    title: '浪漫邂逅',
                    description: '创造一个浪漫的场景',
                    type: 'romance',
                    icon: '🌹'
                });
            } else if (world?.settings?.tone === '冒险') {
                suggestions.push({
                    title: '冒险挑战',
                    description: '安排一场冒险旅程',
                    type: 'adventure',
                    icon: '⚔️'
                });
            }

            mainChars.forEach(char => {
                const stats = DataManager.getCharacterStats(worldId, char.id);
                if (stats && stats.health < 30) {
                    suggestions.push({
                        title: `照顾 ${char.name}`,
                        description: `${char.name} 需要休息`,
                        type: 'care',
                        icon: '💊'
                    });
                }
            });

            return suggestions;
        }
    };

    // =====================================================
    // 目标管理器 - GoalManager
    // =====================================================

    const GoalManager = {
        getGoals(worldId) {
            const data = DataManager._getWorldData(worldId);
            return data.goals || [];
        },

        addGoal(worldId, goal) {
            const data = DataManager._getWorldData(worldId);
            data.goals = data.goals || [];
            goal.id = generateId();
            goal.createdAt = new Date().toISOString();
            goal.status = 'active';
            goal.progress = goal.progress || 0;
            data.goals.push(goal);
            DataManager._saveWorldData(worldId, data);
            return goal;
        },

        updateGoalProgress(worldId, goalId, progress) {
            const data = DataManager._getWorldData(worldId);
            const goal = data.goals?.find(g => g.id === goalId);
            if (goal) {
                goal.progress = progress;
                if (goal.progress >= goal.target) {
                    goal.status = 'completed';
                    goal.completedAt = new Date().toISOString();
                }
                DataManager._saveWorldData(worldId, data);
            }
        },

        completeGoal(worldId, goalId) {
            const data = DataManager._getWorldData(worldId);
            const goal = data.goals?.find(g => g.id === goalId);
            if (goal) {
                goal.status = 'completed';
                goal.progress = goal.target;
                goal.completedAt = new Date().toISOString();
                DataManager._saveWorldData(worldId, data);
            }
        },

        deleteGoal(worldId, goalId) {
            const data = DataManager._getWorldData(worldId);
            data.goals = data.goals?.filter(g => g.id !== goalId) || [];
            DataManager._saveWorldData(worldId, data);
        },

        addMilestone(worldId, goalId, milestone) {
            const data = DataManager._getWorldData(worldId);
            const goal = data.goals?.find(g => g.id === goalId);
            if (goal) {
                goal.milestones = goal.milestones || [];
                milestone.id = generateId();
                milestone.status = milestone.status || 'pending';
                goal.milestones.push(milestone);
                DataManager._saveWorldData(worldId, data);
            }
        },

        completeMilestone(worldId, goalId, milestoneId) {
            const data = DataManager._getWorldData(worldId);
            const goal = data.goals?.find(g => g.id === goalId);
            const milestone = goal?.milestones?.find(m => m.id === milestoneId);
            if (milestone) {
                milestone.status = 'completed';
                milestone.completedAt = new Date().toISOString();
                this.updateGoalProgress(worldId, goalId, (goal.milestones.filter(m => m.status === 'completed').length));
                DataManager._saveWorldData(worldId, data);
            }
        },

        renderGoalPanel(worldId) {
            const goals = this.getGoals(worldId);
            if (goals.length === 0) {
                return `
                    <div class="goal-empty">
                        <p>暂无目标</p>
                        <button class="btn btn-secondary" onclick="GoalManager.showAddGoalModal('${worldId}')">+ 添加目标</button>
                    </div>
                `;
            }

            return `
                <div class="goal-list">
                    ${goals.map(goal => this.renderGoalItem(worldId, goal)).join('')}
                </div>
                <button class="btn btn-secondary" onclick="GoalManager.showAddGoalModal('${worldId}')" style="margin-top: 16px;">+ 添加目标</button>
            `;
        },

        renderGoalItem(worldId, goal) {
            const progress = Math.min(100, Math.round((goal.progress / goal.target) * 100));
            const statusIcon = goal.status === 'completed' ? '✅' : '🎯';
            
            return `
                <div class="goal-item" data-goal-id="${goal.id}">
                    <div class="goal-header">
                        <span class="goal-icon">${statusIcon}</span>
                        <span class="goal-title">${goal.title}</span>
                        <button class="goal-delete" onclick="GoalManager.deleteGoal('${worldId}', '${goal.id}')">×</button>
                    </div>
                    <div class="goal-desc">${goal.description || ''}</div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="goal-progress-text">${goal.progress} / ${goal.target} (${progress}%)</div>
                    ${goal.milestones?.length ? `
                        <div class="milestone-list">
                            ${goal.milestones.map(m => `
                                <div class="milestone-item ${m.status}" onclick="GoalManager.toggleMilestone('${worldId}', '${goal.id}', '${m.id}')">
                                    <span class="milestone-check">${m.status === 'completed' ? '✓' : '○'}</span>
                                    <span class="milestone-title">${m.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    <button class="btn btn-secondary btn-sm" onclick="GoalManager.showAddMilestoneModal('${worldId}', '${goal.id}')" style="margin-top: 8px;">+ 添加阶段</button>
                </div>
            `;
        },

        toggleMilestone(worldId, goalId, milestoneId) {
            const data = DataManager._getWorldData(worldId);
            const goal = data.goals?.find(g => g.id === goalId);
            const milestone = goal?.milestones?.find(m => m.id === milestoneId);
            if (milestone) {
                if (milestone.status === 'completed') {
                    milestone.status = 'pending';
                    milestone.completedAt = null;
                } else {
                    this.completeMilestone(worldId, goalId, milestoneId);
                }
                DataManager._saveWorldData(worldId, data);
                this.refreshGoalPanel(worldId);
            }
        },

        refreshGoalPanel(worldId) {
            const panel = document.getElementById('goalPanelContent');
            if (panel) {
                panel.innerHTML = this.renderGoalPanel(worldId);
            }
        },

        showAddGoalModal(worldId) {
            document.getElementById('modalTitle').textContent = '添加目标';
            document.getElementById('modalBody').innerHTML = `
                <div class="form-group">
                    <label>目标名称</label>
                    <input type="text" id="goalTitle" placeholder="例如：攻略所有角色">
                </div>
                <div class="form-group">
                    <label>目标描述</label>
                    <textarea id="goalDescription" rows="2" placeholder="描述这个目标"></textarea>
                </div>
                <div class="form-group">
                    <label>目标类型</label>
                    <select id="goalType" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;">
                        <option value="story">剧情目标</option>
                        <option value="relationship">关系目标</option>
                        <option value="exploration">探索目标</option>
                        <option value="custom">自定义</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>目标数值</label>
                    <input type="number" id="goalTarget" value="1" min="1">
                </div>
                <button class="btn" onclick="GoalManager.addGoalFromModal('${worldId}')">确认添加</button>
            `;
            document.getElementById('modalOverlay').classList.add('active');
        },

        addGoalFromModal(worldId) {
            const title = document.getElementById('goalTitle').value.trim();
            const description = document.getElementById('goalDescription').value.trim();
            const type = document.getElementById('goalType').value;
            const target = parseInt(document.getElementById('goalTarget').value) || 1;

            if (!title) {
                showNotification('请输入目标名称', 'error');
                return;
            }

            this.addGoal(worldId, { title, description, type, target, progress: 0 });
            closeModal();
            showNotification('目标添加成功', 'success');
            this.refreshGoalPanel(worldId);
        },

        showAddMilestoneModal(worldId, goalId) {
            document.getElementById('modalTitle').textContent = '添加阶段目标';
            document.getElementById('modalBody').innerHTML = `
                <div class="form-group">
                    <label>阶段名称</label>
                    <input type="text" id="milestoneTitle" placeholder="例如：完成第一章">
                </div>
                <div class="form-group">
                    <label>阶段描述</label>
                    <textarea id="milestoneDescription" rows="2" placeholder="描述这个阶段"></textarea>
                </div>
                <button class="btn" onclick="GoalManager.addMilestoneFromModal('${worldId}', '${goalId}')">确认添加</button>
            `;
            document.getElementById('modalOverlay').classList.add('active');
        },

        addMilestoneFromModal(worldId, goalId) {
            const title = document.getElementById('milestoneTitle').value.trim();
            const description = document.getElementById('milestoneDescription').value.trim();

            if (!title) {
                showNotification('请输入阶段名称', 'error');
                return;
            }

            this.addMilestone(worldId, goalId, { title, description });
            closeModal();
            showNotification('阶段添加成功', 'success');
            this.refreshGoalPanel(worldId);
        }
    };

    // =====================================================
    // 角色面板管理器 - CharacterPanelManager
    // =====================================================

    const CharacterPanelManager = {
        getPanelData(worldId, characterId) {
            DataManager.init(worldId);
            const character = DataManager.getCharacter(worldId, characterId);
            if (!character) return null;

            const stats = DataManager.getCharacterStats(worldId, characterId);
            const profile = DataManager.getCharacterProfile(worldId, characterId);
            const inventory = InventoryManager.getItems(worldId, characterId);
            const age = TimeManager.getCharacterAge(worldId, characterId);

            return {
                id: character.id,
                name: character.name,
                isMain: character.isMain,
                avatar: character.avatar || '👤',
                age: age,
                base: profile?.base || {},
                baseProfile: character.baseProfile || {},
                dynamic: profile?.dynamic || {},
                stats: stats || {},
                inventory: inventory,
                relationships: character.relationships || {}
            };
        },

        getAllPanelsData(worldId) {
            const characters = DataManager.getCharacters(worldId);
            return characters.map(c => this.getPanelData(worldId, c.id));
        },

        renderCharacterCard(worldId, characterId) {
            const data = this.getPanelData(worldId, characterId);
            if (!data) return '';

            const healthColor = this._getStatColor(data.stats.health);
            const energyColor = this._getStatColor(data.stats.energy);
            const arousalColor = this._getStatColor(data.stats.arousal, true);
            const affectionColor = this._getStatColor(data.stats.affection);

            return `
                <div class="character-card" onclick="CharacterPanelManager.openPanel('${worldId}', '${characterId}')">
                    <div class="char-avatar">${data.avatar}</div>
                    <div class="char-name">${data.name}</div>
                    <div class="char-status">
                        <div class="stat-bar">
                            <span class="stat-label">❤️</span>
                            <div class="stat-track"><div class="stat-fill" style="width: ${data.stats.health || 0}%; background: ${healthColor}"></div></div>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-label">⚡</span>
                            <div class="stat-track"><div class="stat-fill" style="width: ${data.stats.energy || 0}%; background: ${energyColor}"></div></div>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-label">💕</span>
                            <div class="stat-track"><div class="stat-fill" style="width: ${data.stats.affection || 0}%; background: ${affectionColor}"></div></div>
                        </div>
                    </div>
                </div>
            `;
        },

        _getStatColor(value, reverse = false) {
            if (reverse) {
                if (value < 30) return '#4ade80';
                if (value < 70) return '#facc15';
                return '#ef4444';
            }
            if (value > 70) return '#4ade80';
            if (value > 30) return '#facc15';
            return '#ef4444';
        },

        openPanel(worldId, characterId) {
            const data = this.getPanelData(worldId, characterId);
            if (!data) return;

            const html = this._renderPanelFull(data);
            if (window.UIManager) {
                window.UIManager.showModal(html, { title: data.name, size: 'large' });
            } else {
                console.error('UIManager is not loaded');
            }
        },

        _renderPanelFull(data) {
            return `
                <div class="panel-full">
                    <div class="panel-header">
                        <span class="panel-avatar">${data.avatar}</span>
                        <div class="panel-basic">
                            <h2>${data.name}</h2>
                            <p>${data.isMain ? '主角' : '配角'} · ${data.age !== null ? data.age + '岁' : '年龄未知'} · ${data.baseProfile?.gender || '未设定'}</p>
                        </div>
                    </div>

                    <div class="panel-section">
                        <h3>角色设定</h3>
                        ${data.baseProfile?.appearance ? `<p><strong>外貌:</strong> ${data.baseProfile.appearance}</p>` : ''}
                        ${data.baseProfile?.personality ? `<p><strong>性格:</strong> ${data.baseProfile.personality}</p>` : ''}
                        ${data.baseProfile?.background ? `<p><strong>背景:</strong> ${data.baseProfile.background}</p>` : ''}
                        ${!data.baseProfile?.appearance && !data.baseProfile?.personality && !data.baseProfile?.background ? '<p>暂无详细设定</p>' : ''}
                    </div>

                    <div class="panel-section">
                        <h3>身体状态</h3>
                        <div class="stats-grid">
                            ${this._renderStatRow('❤️ 生命', data.stats.health, false)}
                            ${this._renderStatRow('⚡ 体力', data.stats.energy, false)}
                            ${this._renderStatRow('🔥 情欲', data.stats.arousal, true)}
                            ${this._renderStatRow('💕 好感', data.stats.affection, false)}
                            ${data.baseProfile?.gender === '男性' ? this._renderStatRow('💜 勃起', data.stats.erection || 0, true) : ''}
                        </div>
                    </div>

                    <div class="panel-section">
                        <h3>当前状态</h3>
                        <p>${data.dynamic.currentStatus || '正常'}</p>
                        <p>心情: ${data.dynamic.mood || '未知'}</p>
                        <p>位置: ${data.dynamic.location || '未知'}</p>
                    </div>

                    <div class="panel-section">
                        <h3>色色状态</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${this._renderHentaiTag('发情', data.stats.arousal > 30)}
                            ${this._renderHentaiTag('欲望', data.stats.arousal > 50)}
                            ${this._renderHentaiTag('意乱情迷', data.stats.arousal > 70)}
                            ${this._renderHentaiTag('敏感', data.stats.arousal > 40)}
                            ${data.baseProfile?.gender === '男性' ? this._renderHentaiTag('勃起', (data.stats.erection || 0) > 50) : ''}
                            ${data.baseProfile?.gender === '男性' ? this._renderHentaiTag('坚硬', (data.stats.erection || 0) > 80) : ''}
                            ${this._renderHentaiTag('害羞', data.dynamic.mood?.includes('害羞'))}
                            ${this._renderHentaiTag('享受', data.dynamic.mood?.includes('享受'))}
                            ${this._renderHentaiTag('紧张', data.dynamic.mood?.includes('紧张'))}
                            ${this._renderHentaiTag('抗拒', data.dynamic.mood?.includes('抗拒'))}
                        </div>
                    </div>

                    <div class="panel-section">
                        <h3>物品 (${data.inventory.length})</h3>
                        ${data.inventory.length ? data.inventory.map(i => `
                            <div class="item-row">
                                <span>${i.icon || '📦'} ${i.name}</span>
                                ${i.durability !== undefined ? `<span>耐久: ${i.durability}/${i.maxDurability}</span>` : ''}
                            </div>
                        `).join('') : '<p>无物品</p>'}
                    </div>
                </div>
            `;
        },

        _renderStatRow(label, value, isReverse) {
            const color = this._getStatColor(value, isReverse);
            return `
                <div class="stat-row">
                    <span>${label}</span>
                    <div class="stat-bar-full">
                        <div class="stat-fill" style="width: ${value || 0}%; background: ${color}"></div>
                    </div>
                    <span>${value || 0}</span>
                </div>
            `;
        },

        _renderHentaiTag(label, active) {
            return `<span style="padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; background: ${active ? '#f472b6' : '#374151'}; color: ${active ? 'white' : '#9ca3af'};">${label}</span>`;
        }
    };



    // =====================================================
    // 故事引擎 - StoryEngine
    // =====================================================

    const StoryEngine = {
        worldId: null,
        currentStory: null,
        currentSaveId: null,
        currentSceneIndex: 0,

        init(worldId) {
            this.worldId = worldId;
            DataManager.init(worldId);
            this._loadCurrent();
        },

        async startNew(config) {
            if (!window.miniAI) {
                throw new Error('miniAI is not loaded');
            }
            
            const world = DataManager.getWorld(this.worldId);
            const previousStories = DataManager.getStories(this.worldId, 3); // 获取最近3个故事
            
            // 提取历史故事的摘要和关键信息
            const historyContext = previousStories.map((story, index) => {
                return {
                    id: story.id,
                    summary: story.summary,
                    mainCharacters: story.mainCharacters,
                    keyEvents: story.keyEvents,
                    endTime: story.endTime
                };
            });

            this.currentStory = {
                id: generateId(),
                worldId: this.worldId,
                startTime: new Date().toISOString(),
                endTime: null,
                summary: '',
                mainCharacters: config.mainCharacters || [],
                keyEvents: [],
                choices: [],
                scenes: [],
                mode: world?.settings?.mode || '互动',
                maxTokens: config.maxTokens || 2000,
                historyContext: historyContext.slice(0, 2) // 只保存最近2个故事的上下文
            };

            const firstScene = await this._generateFirstScene(config, historyContext);
            this.currentStory.scenes.push(firstScene);
            this.currentSceneIndex = 0;
            
            await this._updateCharacterStatsFromStory(firstScene.content);
            
            DataManager.saveCurrentStory(this.worldId, this.currentStory);
            
            // 自动创建存档
            const save = DataManager.saveGameSave(this.worldId, `新故事 ${new Date().toLocaleString()}`);
            if (save) {
                this.currentSaveId = save.id;
            }
            
            return this.currentStory;
        },

        async _generateFirstScene(config, historyContext) {
            const mainChars = DataManager.getMainCharacters(this.worldId);
            const world = DataManager.getWorld(this.worldId);
            const goals = GoalManager.getGoals(this.worldId);
            const isNovelMode = this.currentStory.mode === '小说';

            let prompt = `你是一个专业的小说作家。请为以下世界观创作一个引人入胜的故事开头，要与历史剧情连贯。\n\n`;
            prompt += `世界名称: ${world?.name || '未知世界'}\n`;
            prompt += `世界观: ${world?.worldview || world?.background || '这是一个自定义世界'}\n`;
            prompt += `设定: ${world?.settings?.tone || '中性'}\n\n`;

            if (historyContext && historyContext.length > 0) {
                prompt += `【历史剧情摘要】:\n`;
                historyContext.forEach((story, index) => {
                    if (story.summary) {
                        prompt += `${index + 1}. ${story.summary}\n`;
                    }
                });
                prompt += `\n`;
            }

            if (goals && goals.length > 0) {
                prompt += `【当前目标】:\n`;
                goals.filter(g => g.status === 'active').forEach(g => {
                    prompt += `- ${g.name}: ${g.description || ''} (${g.progress || 0}/${g.target || 1})\n`;
                });
                prompt += `\n`;
            }

            // 添加保存的成人玩法
            const hentaiPlays = world?.hentaiPlays?.filter(p => p.status === 'active') || [];
            if (hentaiPlays.length > 0) {
                prompt += `【成人玩法】:\n`;
                hentaiPlays.forEach((play, index) => {
                    const selections = play.selections;
                    const playElements = [];
                    if (selections.dialogue) playElements.push(`对话: ${selections.dialogue}`);
                    if (selections.items) playElements.push(`道具: ${selections.items.map(i => i.name).join(', ')}`);
                    if (selections.bodyPart) playElements.push(`身体部位: ${selections.bodyPart}`);
                    if (selections.pose) playElements.push(`姿势: ${selections.pose}`);
                    if (selections.location) playElements.push(`场景: ${selections.location}`);
                    if (selections.style) playElements.push(`风格: ${selections.style}`);
                    if (selections.action) playElements.push(`行动: ${selections.action}`);
                    if (selections.keyword) playElements.push(`玩法: ${selections.keyword.play}`);
                    if (selections.freeInput) playElements.push(`自定义: ${selections.freeInput}`);
                    
                    if (playElements.length > 0) {
                        prompt += `${index + 1}. ${playElements.join('，')}\n`;
                        // 将使用过的玩法标记为已使用
                        play.status = 'inactive';
                    }
                });
                prompt += `\n`;
                // 保存世界数据，更新玩法状态
                DataManager.saveWorld(world);
            }

            prompt += `【主角详细介绍】:\n`;
            mainChars.forEach((char, idx) => {
                prompt += `\n主角${idx + 1}: ${char.name}\n`;
                prompt += `性别: ${char.baseProfile?.gender || '未设定'}\n`;
                prompt += `年龄: ${char.baseProfile?.age || '未设定'}\n`;
                prompt += `外貌: ${char.baseProfile?.appearance || '未设定'}\n`;
                prompt += `性格: ${char.baseProfile?.personality || '未设定'}\n`;
                prompt += `背景: ${char.baseProfile?.background || '未设定'}\n`;
            });
            prompt += `\n`;

            const wordCount = isNovelMode ? '800-1200' : '200-400';
            prompt += `请创作故事开头，要求:\n`;
            prompt += `1. ${wordCount}字\n`;
            prompt += `2. 与历史剧情保持连贯，延续之前的故事线\n`;
            prompt += `3. 自然融入保存的成人玩法元素\n`;
            prompt += `4. 设定场景和人物\n`;
            prompt += `5. 结尾必须提供4个选项，每个选项单独一行，格式如下：\n`;
            prompt += `选择1: 和郑灵珑打招呼\n`;
            prompt += `选择2: 去找吴小婉\n`;
            prompt += `选择3: 观察周围环境\n`;
            prompt += `选择4: 思考下一步行动\n`;
            prompt += `6. 可以适当加入暧昧情节\n`;

            const response = await window.miniAI?.call?.(prompt, { temperature: 0.8, maxTokens: isNovelMode ? 2000 : 800 }) || '故事开始...';
            
            console.log('AI返回内容:', response);
            const choices = this._parseChoices(response);
            console.log('解析的选项:', choices);

            return {
                id: generateId(),
                storyId: this.currentStory.id,
                time: TimeManager.getTime(this.worldId).timestamp,
                content: response,
                choices: choices,
                characters: mainChars.map(c => c.id),
                location: '待设定',
                mood: '待设定'
            };
        },

        _parseChoices(content) {
            const choices = [];
            const usedTexts = new Set();
            
            const regexPatterns = [
                /选择1[:：]\s*(.+)/gi,
                /选择2[:：]\s*(.+)/gi,
                /选择3[:：]\s*(.+)/gi,
                /选择4[:：]\s*(.+)/gi,
                /选项1[:：]\s*(.+)/gi,
                /选项2[:：]\s*(.+)/gi,
                /选项3[:：]\s*(.+)/gi,
                /选项4[:：]\s*(.+)/gi,
                /1[.、]\s*(.+)/gi,
                /2[.、]\s*(.+)/gi,
                /3[.、]\s*(.+)/gi,
                /4[.、]\s*(.+)/gi
            ];
            
            for (const pattern of regexPatterns) {
                const matches = content.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        const text = match.replace(/^(选择|选项|\d+[.、])\s*[:：]?\s*/i, '').trim();
                        if (text && text.length > 1 && text.length < 40 && !usedTexts.has(text)) {
                            choices.push({ id: generateId(), text: text });
                            usedTexts.add(text);
                        }
                    }
                }
            }

            if (choices.length < 2) {
                const allLines = content.split('\n');
                const shortLines = allLines.filter(line => {
                    const t = line.trim();
                    return t.length >= 4 && t.length <= 30 && !t.endsWith('...') && !t.endsWith('。');
                });
                
                for (const line of shortLines.slice(-8)) {
                    if (choices.length >= 4) break;
                    const text = line.trim();
                    if (!usedTexts.has(text)) {
                        choices.push({ id: generateId(), text: text });
                        usedTexts.add(text);
                    }
                }
            }

            if (choices.length === 0) {
                choices.push(
                    { id: generateId(), text: '继续探索' },
                    { id: generateId(), text: '与角色互动' },
                    { id: generateId(), text: '休息整顿' },
                    { id: generateId(), text: '发起挑战' }
                );
            }

            console.log('解析选项 - 结果:', choices);
            
            return choices.slice(0, 4);
        },

        async continue(userChoice) {
            if (!this.currentStory) return null;
            if (!window.miniAI) {
                throw new Error('miniAI is not loaded');
            }

            this.currentStory.choices.push({
                sceneIndex: this.currentSceneIndex,
                choice: userChoice,
                timestamp: new Date().toISOString()
            });

            const prompt = this._buildContinuationPrompt(userChoice);
            const isNovelMode = this.currentStory.mode === '小说';
            const response = await window.miniAI?.call?.(prompt, {
                temperature: 0.8,
                maxTokens: isNovelMode ? (this.currentStory.maxTokens || 2000) : 600
            }) || '故事继续...';

            const newScene = {
                id: generateId(),
                storyId: this.currentStory.id,
                time: TimeManager.getTime(this.worldId).timestamp,
                content: response,
                choices: this._parseChoices(response),
                characters: this._selectCharactersForScene(),
                location: '待设定',
                mood: '待设定'
            };

            this.currentStory.scenes.push(newScene);
            this.currentSceneIndex++;
            
            await this._updateCharacterStatsFromStory(response);
            
            DataManager.saveCurrentStory(this.worldId, this.currentStory);

            // 更新当前存档（如果有）
            if (this.currentSaveId) {
                DataManager.updateGameSave(this.worldId, this.currentSaveId, this.currentStory);
            }

            return newScene;
        },

        async loadSaveAndContinue(worldId, saveId) {
            const save = DataManager.getSaveById(worldId, saveId);
            if (!save) return null;

            // 加载存档中的故事
            this.worldId = worldId;
            this.currentStory = save.story;
            this.currentSaveId = saveId;
            this.currentSceneIndex = this.currentStory.scenes.length - 1;

            // 保存到当前故事
            DataManager.saveCurrentStory(worldId, this.currentStory);

            return this.currentStory;
        },

        async _updateCharacterStatsFromStory(storyContent) {
            const mainChars = DataManager.getMainCharacters(this.worldId);
            if (mainChars.length === 0) return;

            const charNames = mainChars.map(c => c.name).join('、');
            
            const statusPrompt = `根据以下故事内容，分析角色状态变化。如果角色之间有互动或亲密度提升，请输出状态更新。

故事内容：
${storyContent}

角色：${charNames}

请以JSON格式输出每个角色的状态变化（如果没有变化则输出null）：
{
  "角色名": {
    "affectionChange": 数字（-10到10，正数表示好感增加）,
    "arousalChange": 数字（0到20，情欲变化）,
    "energyChange": 数字（-10到10，体力变化）,
    "status": "状态描述，如：开心、害羞、生气、疲惫、发情、欲望、意乱情迷、享受、紧张、抗拒等",
    "erection": 数字（0到100，只用于男性角色，表示勃起程度）
  }
}

只输出JSON，不要其他文字。如果没有角色互动，输出：{}`;

            try {
                const statusResponse = await window.miniAI?.call?.(statusPrompt, { temperature: 0.3, maxTokens: 500 });
                
                let statusData = {};
                try {
                    const jsonMatch = statusResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        statusData = JSON.parse(jsonMatch[0]);
                    }
                } catch (e) {
                    console.log('解析角色状态失败:', e);
                }

                mainChars.forEach(char => {
                    const status = statusData[char.name];
                    if (status) {
                        const currentStats = DataManager.getCharacterStats(this.worldId, char.id) || {
                            health: 100,
                            energy: 100,
                            arousal: 0,
                            affection: 50,
                            erection: 0
                        };

                        if (status.affectionChange) {
                            currentStats.affection = Math.max(0, Math.min(100, currentStats.affection + status.affectionChange));
                        }
                        if (status.arousalChange) {
                            currentStats.arousal = Math.max(0, Math.min(100, currentStats.arousal + status.arousalChange));
                        }
                        if (status.energyChange) {
                            currentStats.energy = Math.max(0, Math.min(100, currentStats.energy + status.energyChange));
                        }
                        if (status.erection !== undefined && status.erection !== null) {
                            currentStats.erection = Math.max(0, Math.min(100, status.erection));
                        }

                        DataManager.updateCharacterStats(this.worldId, char.id, currentStats);

                        if (status.status) {
                            const profile = DataManager.getCharacterProfile(this.worldId, char.id) || {};
                            profile.dynamic = profile.dynamic || {};
                            profile.dynamic.mood = status.status;
                            DataManager.saveCharacterProfile(this.worldId, char.id, profile);
                        }
                    }
                });
                
                console.log('角色状态已更新:', statusData);
            } catch (e) {
                console.log('更新角色状态失败:', e);
            }
        },

        _buildContinuationPrompt(userChoice) {
            const currentScene = this.currentStory.scenes[this.currentSceneIndex];
            const world = DataManager.getWorld(this.worldId);
            const previousSummary = DataManager.getStorySummary(this.worldId);
            const mainChars = DataManager.getMainCharacters(this.worldId);
            const goals = GoalManager.getGoals(this.worldId);
            const isNovelMode = this.currentStory.mode === '小说';

            let prompt = `你是一个专业的小说作家。请根据用户的选择继续故事。\n\n`;
            prompt += `世界设定: ${world?.worldview || world?.background || ''}\n`;
            prompt += `故事模式: ${isNovelMode ? '小说模式' : '互动模式'}\n\n`;

            if (goals && goals.length > 0) {
                prompt += `【当前目标】:\n`;
                goals.filter(g => g.status === 'active').forEach(g => {
                    prompt += `- ${g.name}: ${g.description || ''} (${g.progress || 0}/${g.target || 1})\n`;
                });
                prompt += `\n`;
            }

            // 添加保存的成人玩法
            const hentaiPlays = world?.hentaiPlays?.filter(p => p.status === 'active') || [];
            if (hentaiPlays.length > 0) {
                prompt += `【成人玩法】:\n`;
                hentaiPlays.forEach((play, index) => {
                    const selections = play.selections;
                    const playElements = [];
                    if (selections.dialogue) playElements.push(`对话: ${selections.dialogue}`);
                    if (selections.items) playElements.push(`道具: ${selections.items.map(i => i.name).join(', ')}`);
                    if (selections.bodyPart) playElements.push(`身体部位: ${selections.bodyPart}`);
                    if (selections.pose) playElements.push(`姿势: ${selections.pose}`);
                    if (selections.location) playElements.push(`场景: ${selections.location}`);
                    if (selections.style) playElements.push(`风格: ${selections.style}`);
                    if (selections.action) playElements.push(`行动: ${selections.action}`);
                    if (selections.keyword) playElements.push(`玩法: ${selections.keyword.play}`);
                    if (selections.freeInput) playElements.push(`自定义: ${selections.freeInput}`);
                    
                    if (playElements.length > 0) {
                        prompt += `${index + 1}. ${playElements.join('，')}\n`;
                        // 将使用过的玩法标记为已使用
                        play.status = 'inactive';
                    }
                });
                prompt += `\n`;
                // 保存世界数据，更新玩法状态
                DataManager.saveWorld(world);
            }

            prompt += `【主角详细介绍】:\n`;
            mainChars.forEach((char, idx) => {
                prompt += `\n主角${idx + 1}: ${char.name}\n`;
                prompt += `性别: ${char.baseProfile?.gender || '未设定'}\n`;
                prompt += `年龄: ${char.baseProfile?.age || '未设定'}\n`;
                prompt += `外貌: ${char.baseProfile?.appearance || '未设定'}\n`;
                prompt += `性格: ${char.baseProfile?.personality || '未设定'}\n`;
                prompt += `背景: ${char.baseProfile?.background || '未设定'}\n`;
            });
            prompt += `\n`;

            if (previousSummary.length > 0) {
                prompt += `已发生的故事:\n${previousSummary[0].summary}\n\n`;
            }

            prompt += `最新情节:\n${currentScene.content}\n\n`;
            prompt += `用户选择: ${userChoice}\n\n`;

            const wordCount = isNovelMode ? (this.currentStory.maxTokens || 2000) : 300;

            prompt += `请继续故事，要求:\n`;
            prompt += `1. 字数: ${isNovelMode ? wordCount + '字左右' : wordCount + '-500字'}\n`;
            prompt += `2. 保持剧情连贯\n`;
            prompt += `3. ${isNovelMode ? '输出大量剧情，用户少量参与' : '输出简短剧情，侧重用户与角色互动'}\n`;
            prompt += `4. 自然融入保存的成人玩法元素\n`;
            prompt += `5. 结尾必须提供4个选项，每个选项单独一行，格式如下：\n`;
            prompt += `选择1: 和角色对话\n`;
            prompt += `选择2: 探索周围\n`;
            prompt += `选择3: 使用物品\n`;
            prompt += `选择4: 休息整顿\n`;

            return prompt;
        },

        _selectCharactersForScene() {
            const allChars = DataManager.getCharacters(this.worldId);
            const mainChars = allChars.filter(c => c.isMain);
            const selected = [];

            const count = Math.min(Math.ceil(mainChars.length * 0.7), 4);
            const shuffled = [...mainChars].sort(() => Math.random() - 0.5);

            for (let i = 0; i < count; i++) {
                if (TimeManager.isCharacterActive(this.worldId, shuffled[i].id)) {
                    selected.push(shuffled[i].id);
                }
            }

            return selected;
        },

        async generateHentaiScene(participants, context) {
            const world = DataManager.getWorld(this.worldId);
            const hentaiSettings = DataManager.getHentaiSettings(this.worldId);

            if (!hentaiSettings.enabled) {
                return { content: '成人内容已禁用', choices: [] };
            }

            // 构建详细的提示词，包含新的设置选项
            let prompt = `你是一个专业的情色小说作家。请根据以下设定创作一段引人入胜的亲密互动场景。\n\n`;
            prompt += `【参与者】${participants.map(p => p.name).join('、')}\n`;
            prompt += `【激烈程度】${hentaiSettings.intensity}%\n`;
            prompt += `【身体描写详细度】${hentaiSettings.bodyDetail || 50}%\n`;
            prompt += `【情感描写详细度】${hentaiSettings.emotionDetail || 50}%\n\n`;

            // 添加场景选项
            const enabledScenes = [];
            if (hentaiSettings.scenes) {
                if (hentaiSettings.scenes.romantic) enabledScenes.push('浪漫互动');
                if (hentaiSettings.scenes.passionate) enabledScenes.push('激情互动');
                if (hentaiSettings.scenes.gentle) enabledScenes.push('温柔互动');
                if (hentaiSettings.scenes.rough) enabledScenes.push('粗暴互动');
                if (hentaiSettings.scenes.romantic_ambiance) enabledScenes.push('浪漫氛围');
                if (hentaiSettings.scenes.exciting) enabledScenes.push('刺激氛围');
                if (hentaiSettings.scenes.secret) enabledScenes.push('隐秘氛围');
                if (hentaiSettings.scenes.cosy) enabledScenes.push('温馨氛围');
                if (hentaiSettings.scenes.literary) enabledScenes.push('文学性描写');
                if (hentaiSettings.scenes.direct) enabledScenes.push('直白表达');
                if (hentaiSettings.scenes.colloquial) enabledScenes.push('口语化表达');
                if (hentaiSettings.scenes.poetic) enabledScenes.push('诗意表达');
                if (hentaiSettings.scenes.bdsm) enabledScenes.push('BDSM');
                if (hentaiSettings.scenes.exhibitionism) enabledScenes.push('暴露癖');
                if (hentaiSettings.scenes.voyeurism) enabledScenes.push('偷窥癖');
                if (hentaiSettings.scenes.foot_fetish) enabledScenes.push('足恋');
                if (hentaiSettings.scenes.breast_fetish) enabledScenes.push('乳房恋');
                if (hentaiSettings.scenes.anal_fetish) enabledScenes.push('肛门恋');
                if (hentaiSettings.scenes.roleplay) enabledScenes.push('角色扮演');
                if (hentaiSettings.scenes.age_play) enabledScenes.push('年龄扮演');
            }

            if (enabledScenes.length > 0) {
                prompt += `【风格选项】${enabledScenes.join('、')}\n\n`;
            }

            prompt += `【写作要求】\n`;
            prompt += `1. 用细腻唯美的文字描写身体接触和情感交流\n`;
            prompt += `2. 通过对话、动作、心理描写营造暧昧氛围\n`;
            prompt += `3. 根据选择的风格选项调整语言和描写方式\n`;
            prompt += `4. 保持文学性和美感，避免粗俗直白\n`;
            prompt += `5. 字数要求: 800-1200字\n`;
            prompt += `6. 结尾留有余韵，可以是继续发展或温馨收尾`;

            const response = await window.miniAI?.call?.(prompt, {
                temperature: 0.9,
                maxTokens: 2000
            }) || '场景生成中...';

            participants.forEach(p => {
                DataManager.updateCharacterStat(this.worldId, p.id, 'arousal',
                    Math.min(100, (DataManager.getCharacterStats(this.worldId, p.id)?.arousal || 0) + 20));
            });

            return {
                content: response,
                choices: [
                    { id: generateId(), text: '继续温存' },
                    { id: generateId(), text: '换个姿势' },
                    { id: generateId(), text: '结束互动' },
                    { id: generateId(), text: '尝试新玩法' }
                ]
            };
        },

        async end() {
            if (!this.currentStory) return;

            this.currentStory.endTime = new Date().toISOString();
            await this._generateSummary();

            DataManager.saveStoryToHistory(this.worldId, this.currentStory);
            DataManager.saveCurrentStory(this.worldId, null);

            const result = deepClone(this.currentStory);
            this.currentStory = null;
            this.currentSceneIndex = 0;

            return result;
        },

        buildContext() {
            const world = DataManager.getWorld(this.worldId);
            const mainChars = DataManager.getMainCharacters(this.worldId);
            const currentScene = this.currentStory?.scenes[this.currentSceneIndex];

            let context = `世界: ${world?.name || '未知'}\n`;
            context += `世界观: ${world?.worldview || world?.background || '无'}\n`;
            context += `角色: ${mainChars.map(c => c.name).join('、')}\n`;
            if (currentScene) {
                context += `最新情节: ${currentScene.content}\n`;
            }
            return context;
        },

        async _generateSummary() {
            if (!this.currentStory || this.currentStory.scenes.length === 0) return;

            const content = this.currentStory.scenes.map(s => s.content).join('\n\n');

            const prompt = `请为以下故事生成一个详细摘要，便于下一次剧情的继续发展，包括：

1. 故事开头（50字）
2. 关键事件（列出3-5个）
3. 角色发展和情感变化
4. 角色之间的关系变化
5. 重要的场景和地点
6. 故事的结局状态
7. 未解决的问题或悬念
8. 适合继续发展的方向

请使用连续的叙述性语言，不要使用列表格式，确保摘要具有连贯性和可读性，便于AI理解并生成后续剧情。

故事内容：
${content}`;

            try {
                const response = await window.miniAI?.call?.(prompt, {
                    temperature: 0.5,
                    maxTokens: 800
                });
                this.currentStory.summary = response || '故事结束';
            } catch (e) {
                this.currentStory.summary = '故事结束';
            }
        },

        _loadCurrent() {
            this.currentStory = DataManager.getCurrentStory(this.worldId);
            if (this.currentStory) {
                this.currentSceneIndex = this.currentStory.scenes.length - 1;
            }
        },

        getCurrent() {
            return this.currentStory;
        },

        getCurrentScene() {
            if (this.currentStory && this.currentStory.scenes[this.currentSceneIndex]) {
                return this.currentStory.scenes[this.currentSceneIndex];
            }
            return null;
        },

        async connectToPrevious() {
            const stories = DataManager.getStories(this.worldId, 1);
            if (stories.length > 0) {
                return stories[0].summary;
            }
            return '';
        }
    };

    // =====================================================
    // UI管理器 - UIManager
    // =====================================================

    const UIManager = {
        showModal(content, options = {}) {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.onclick = (e) => {
                if (e.target === overlay) this.closeModal();
            };

            const modal = document.createElement('div');
            modal.className = 'modal-content';
            if (options.size === 'large') modal.classList.add('modal-large');

            modal.innerHTML = `
                <div class="modal-header">
                    <h3>${options.title || '提示'}</h3>
                    <button class="modal-close" onclick="UIManager.closeModal()">×</button>
                </div>
                <div class="modal-body">${content}</div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('active'), 10);
        },

        closeModal() {
            const overlay = document.querySelector('.modal-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            }
        },

        showNotification(message, type = 'info') {
            const notif = document.createElement('div');
            notif.className = `notification notification-${type}`;
            notif.textContent = message;
            document.body.appendChild(notif);
            setTimeout(() => notif.classList.add('active'), 10);
            setTimeout(() => {
                notif.classList.remove('active');
                setTimeout(() => notif.remove(), 300);
            }, 3000);
        },

        showInSidebar(content) {
            const sidebar = document.getElementById('sidebar-content');
            if (sidebar) {
                sidebar.innerHTML = content;
            }
        },

        showInPanel(content, options) {
            const panel = document.querySelector(options.selector);
            if (panel) {
                panel.innerHTML = content;
            }
        }
    };



    // =====================================================
    // 导出到全局
    // =====================================================

    window.DataManager = DataManager;
    window.TimeManager = TimeManager;
    window.WorldManager = WorldManager;
    window.InventoryManager = InventoryManager;
    window.TaskManager = TaskManager;
    window.CharacterPanelManager = CharacterPanelManager;
    window.StoryEngine = StoryEngine;
    window.UIManager = UIManager;
    window.GoalManager = GoalManager;

})();
