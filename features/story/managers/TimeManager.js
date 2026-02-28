class TimeManager {
    constructor(worldId, storage, onTimeChangeCallback) {
        this.worldId = worldId;
        this.storage = storage;
        this.timeAssistant = null;
        this.onTimeChangeCallback = onTimeChangeCallback;
        this.timeUpdateInterval = null;
    }
    
    initialize() {
        this.loadTimeAssistant();
        this.updateTimeDisplay();
        this.startAutoUpdate();
    }
    
    loadTimeAssistant() {
        // 动态加载时间小助手
        if (window.TimeAssistant) {
            this.timeAssistant = new window.TimeAssistant(this.worldId);
        } else {
            // 尝试从assistants.js中获取
            if (window.assistantsModule && window.assistantsModule.assistantsInstances['time-assistant']) {
                this.timeAssistant = window.assistantsModule.assistantsInstances['time-assistant'];
            }
        }
    }
    
    getCurrentDate() {
        if (this.timeAssistant) {
            return this.timeAssistant.currentTime;
        }
        return new Date();
    }
    
    setCurrentDate(date) {
        if (this.timeAssistant) {
            // 转换为时间小助手的格式
            this.timeAssistant.currentTime = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate(),
                hour: date.getHours(),
                minute: date.getMinutes(),
                second: date.getSeconds(),
                weekday: date.getDay() || 7 // 转换为1-7，1表示周一
            };
            this.timeAssistant.saveCurrentTime();
            this.updateTimeDisplay();
            if (this.onTimeChangeCallback) {
                this.onTimeChangeCallback(date);
            }
        }
    }
    
    updateTimeDisplay() {
        const timeElement = document.getElementById('currentTime');
        if (!timeElement) return;
        
        if (this.timeAssistant) {
            // 使用时间小助手的格式化方法
            timeElement.textContent = this.timeAssistant.formatTime();
        } else {
            // 后备方案
            const now = new Date();
            timeElement.textContent = now.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }
    
    editTime() {
        const modal = document.getElementById('time-edit-modal');
        const timeInput = document.getElementById('time-input');
        
        if (modal && timeInput) {
            let currentDate;
            if (this.timeAssistant) {
                const time = this.timeAssistant.currentTime;
                currentDate = new Date(time.year, time.month - 1, time.day, time.hour, time.minute);
            } else {
                currentDate = new Date();
            }
            const isoString = currentDate.toISOString().slice(0, 16);
            timeInput.value = isoString;
            modal.style.display = 'flex';
        }
    }
    
    closeTimeModal() {
        const modal = document.getElementById('time-edit-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    saveTime() {
        const timeInput = document.getElementById('time-input');
        const modal = document.getElementById('time-edit-modal');
        
        if (timeInput && timeInput.value) {
            const newDate = new Date(timeInput.value);
            this.setCurrentDate(newDate);
        }
        
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    startAutoUpdate() {
        // 清除现有的定时器
        this.stopAutoUpdate();
        
        // 如果启用了自动更新，启动定时器
        if (this.timeAssistant && this.timeAssistant.settings.autoUpdate) {
            const interval = this.timeAssistant.settings.interval || 5000;
            this.timeUpdateInterval = setInterval(() => {
                this.updateTimeBySpeed();
            }, interval);
        }
    }
    
    stopAutoUpdate() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
    }
    
    updateTimeBySpeed() {
        if (this.timeAssistant) {
            // 使用时间小助手的方法推进时间
            this.timeAssistant.advanceTime(1); // 推进1小时
            this.updateTimeDisplay();
        }
    }
    
    analyzeTimeContent(content) {
        if (this.timeAssistant) {
            // 使用时间小助手的方法分析时间内容
            this.timeAssistant.adjustTimeBasedOnStory(content);
            this.updateTimeDisplay();
        }
    }
    
    detectTimePassage(content) {
        // 时间小助手已经在adjustTimeBasedOnStory中处理了这些情况
        this.analyzeTimeContent(content);
    }
    
    formatCurrentTime() {
        if (this.timeAssistant) {
            return this.timeAssistant.formatTime();
        } else {
            const now = new Date();
            return now.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    adjustTimeToLatestDiary() {
        // 时间小助手会从localStorage加载时间，这里不需要额外处理
        this.updateTimeDisplay();
    }
    
    // 获取时间设置
    getTimeSettings() {
        if (this.timeAssistant) {
            return this.timeAssistant.settings;
        }
        return {
            enabled: true,
            autoUpdate: false,
            timeSpeed: 1
        };
    }
    
    // 设置时间设置
    setTimeSettings(settings) {
        if (this.timeAssistant) {
            this.timeAssistant.updateSettings(settings);
            this.startAutoUpdate();
        }
    }
}