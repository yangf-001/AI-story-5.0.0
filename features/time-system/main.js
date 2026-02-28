class TimeManager {
  constructor(worldId) {
    this.worldId = worldId;
    this.timeAssistant = null;
    this.isRunning = false;
    this.intervalId = null;
    this.init();
  }

  init() {
    this.loadTimeAssistant();
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

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.advanceTime();
    }, 1000); // 每秒更新一次
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  advanceTime() {
    if (this.timeAssistant) {
      this.timeAssistant.advanceTime(1/60); // 推进1分钟
      this.notifyTimeUpdated();
    }
  }

  setTime(date) {
    if (this.timeAssistant) {
      const newDate = new Date(date);
      this.timeAssistant.currentTime = {
        year: newDate.getFullYear(),
        month: newDate.getMonth() + 1,
        day: newDate.getDate(),
        hour: newDate.getHours(),
        minute: newDate.getMinutes(),
        second: newDate.getSeconds(),
        weekday: newDate.getDay() || 7 // 转换为1-7，1表示周一
      };
      this.timeAssistant.saveCurrentTime();
      this.notifyTimeUpdated();
    }
  }

  setTimeSpeed(speed) {
    if (this.timeAssistant) {
      this.timeAssistant.updateSettings({ timeSpeed: speed });
    }
  }

  setTimeUnit(unit) {
    // 时间小助手使用timeSpeed来控制速度，这里我们可以忽略unit参数
    // 或者根据unit设置不同的timeSpeed
  }

  getCurrentTime() {
    if (this.timeAssistant) {
      const time = this.timeAssistant.currentTime;
      return new Date(time.year, time.month - 1, time.day, time.hour, time.minute, time.second);
    }
    return new Date();
  }

  getFormattedTime(format = 'full') {
    if (this.timeAssistant) {
      return this.timeAssistant.formatTime();
    } else {
      const date = new Date();
      switch (format) {
        case 'full':
          return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        default:
          return date.toLocaleString('zh-CN');
      }
    }
  }

  getTimeString() {
    return this.getFormattedTime('full');
  }

  notifyTimeUpdated() {
    // 触发时间更新事件
    const event = new CustomEvent('timeUpdated', {
      detail: {
        currentTime: this.getCurrentTime(),
        formattedTime: this.getFormattedTime()
      }
    });
    document.dispatchEvent(event);
  }

  resetTime() {
    if (this.timeAssistant) {
      const now = new Date();
      this.timeAssistant.currentTime = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        weekday: now.getDay() || 7
      };
      this.timeAssistant.saveCurrentTime();
      this.notifyTimeUpdated();
    }
  }

  addTime(amount, unit = 'hour') {
    if (this.timeAssistant) {
      let hours = amount;
      if (unit === 'day') {
        hours = amount * 24;
      } else if (unit === 'minute') {
        hours = amount / 60;
      } else if (unit === 'second') {
        hours = amount / 3600;
      }
      this.timeAssistant.advanceTime(hours);
      this.notifyTimeUpdated();
    }
  }

  subtractTime(amount, unit = 'hour') {
    // 时间小助手没有直接的减法方法，我们可以通过负数来实现
    this.addTime(-amount, unit);
  }

  getTimeSpeed() {
    if (this.timeAssistant) {
      return this.timeAssistant.settings.timeSpeed || 1;
    }
    return 1;
  }

  getTimeUnit() {
    return 'hour'; // 时间小助手使用小时作为单位
  }

  isTimeRunning() {
    return this.isRunning;
  }
}

class TimeSystemUI {
  constructor(timeManager) {
    this.timeManager = timeManager;
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.updateTimeDisplay();
    this.disableControls(); // 初始时禁用所有控制元素
  }

  setupElements() {
    this.timeDisplay = document.getElementById('currentTime');
    this.timeSpeedInput = document.getElementById('timeSpeed');
    this.timeUnitSelect = document.getElementById('timeUnit');
    this.startButton = document.getElementById('startTime');
    this.stopButton = document.getElementById('stopTime');
    this.resetButton = document.getElementById('resetTime');
    this.setTimeButton = document.getElementById('setTime');
    this.timeInput = document.getElementById('timeInput');
    this.addHourButton = document.getElementById('addHour');
    this.addDayButton = document.getElementById('addDay');
    this.editButton = document.getElementById('editButton');
    this.saveButton = document.getElementById('saveButton');
    this.isEditMode = false;
  }

  setupEventListeners() {
    // 时间速度和单位变化
    if (this.timeSpeedInput) {
      this.timeSpeedInput.addEventListener('input', (e) => {
        this.timeManager.setTimeSpeed(parseFloat(e.target.value));
      });
    }

    if (this.timeUnitSelect) {
      this.timeUnitSelect.addEventListener('change', (e) => {
        this.timeManager.setTimeUnit(e.target.value);
      });
    }

    // 控制按钮
    if (this.startButton) {
      this.startButton.addEventListener('click', () => {
        this.timeManager.start();
        this.updateControlButtons();
      });
    }

    if (this.stopButton) {
      this.stopButton.addEventListener('click', () => {
        this.timeManager.stop();
        this.updateControlButtons();
      });
    }

    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => {
        this.timeManager.resetTime();
      });
    }

    if (this.setTimeButton) {
      this.setTimeButton.addEventListener('click', () => {
        if (this.timeInput && this.timeInput.value) {
          this.timeManager.setTime(this.timeInput.value);
        } else {
          console.error('设置时间 - 输入值为空');
        }
      });
    }

    // 快捷时间调整
    if (this.addHourButton) {
      this.addHourButton.addEventListener('click', () => {
        this.timeManager.addTime(1, 'hour');
      });
    }

    if (this.addDayButton) {
      this.addDayButton.addEventListener('click', () => {
        this.timeManager.addTime(1, 'day');
      });
    }

    // 编辑和保存按钮
    if (this.editButton) {
      this.editButton.addEventListener('click', () => {
        this.toggleEditMode();
      });
    }

    if (this.saveButton) {
      this.saveButton.addEventListener('click', () => {
        this.saveChanges();
      });
    }

    // 监听时间更新事件
    document.addEventListener('timeUpdated', () => {
      this.updateTimeDisplay();
    });
  }

  updateTimeDisplay() {
    if (this.timeDisplay) {
      this.timeDisplay.textContent = this.timeManager.getFormattedTime('full');
    }

    if (this.timeSpeedInput) {
      this.timeSpeedInput.value = this.timeManager.getTimeSpeed();
    }

    if (this.timeUnitSelect) {
      this.timeUnitSelect.value = this.timeManager.getTimeUnit();
    }

    if (this.timeInput) {
      this.timeInput.value = this.timeManager.getCurrentTime().toISOString().slice(0, 16);
    }
  }

  updateControlButtons() {
    const isRunning = this.timeManager.isTimeRunning();
    
    if (this.startButton) {
      this.startButton.disabled = isRunning;
    }
    
    if (this.stopButton) {
      this.stopButton.disabled = !isRunning;
    }
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    
    if (this.isEditMode) {
      // 进入编辑模式
      if (this.editButton) this.editButton.textContent = '取消';
      if (this.saveButton) this.saveButton.disabled = false;
      this.enableControls();
    } else {
      // 退出编辑模式
      if (this.editButton) this.editButton.textContent = '编辑';
      if (this.saveButton) this.saveButton.disabled = true;
      this.disableControls();
    }
  }

  enableControls() {
    // 启用所有控制元素
    if (this.timeSpeedInput) this.timeSpeedInput.disabled = false;
    if (this.timeUnitSelect) this.timeUnitSelect.disabled = false;
    if (this.startButton) this.startButton.disabled = false;
    if (this.stopButton) this.stopButton.disabled = false;
    if (this.resetButton) this.resetButton.disabled = false;
    if (this.setTimeButton) this.setTimeButton.disabled = false;
    if (this.timeInput) this.timeInput.disabled = false;
    if (this.addHourButton) this.addHourButton.disabled = false;
    if (this.addDayButton) this.addDayButton.disabled = false;
  }

  disableControls() {
    // 禁用所有控制元素
    if (this.timeSpeedInput) this.timeSpeedInput.disabled = true;
    if (this.timeUnitSelect) this.timeUnitSelect.disabled = true;
    if (this.startButton) this.startButton.disabled = true;
    if (this.stopButton) this.stopButton.disabled = true;
    if (this.resetButton) this.resetButton.disabled = true;
    if (this.setTimeButton) this.setTimeButton.disabled = true;
    if (this.timeInput) this.timeInput.disabled = true;
    if (this.addHourButton) this.addHourButton.disabled = true;
    if (this.addDayButton) this.addDayButton.disabled = true;
  }

  saveChanges() {
    // 保存更改
    this.timeManager.saveTimeSettings();
    this.toggleEditMode(); // 保存后退出编辑模式
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    let worldId = new URLSearchParams(window.location.search).get('worldId');
    // 如果没有worldId，尝试从本地存储获取
    if (!worldId) {
      worldId = localStorage.getItem('currentWorldId');
    }
    // 如果仍然没有worldId，使用默认值
    if (!worldId) {
      worldId = 'default';
    }
    console.log('初始化时间系统 - 世界ID:', worldId);
    const timeManager = new TimeManager(worldId);
    new TimeSystemUI(timeManager);
  });
} else {
  let worldId = new URLSearchParams(window.location.search).get('worldId');
  // 如果没有worldId，尝试从本地存储获取
  if (!worldId) {
    worldId = localStorage.getItem('currentWorldId');
  }
  // 如果仍然没有worldId，使用默认值
  if (!worldId) {
    worldId = 'default';
  }
  console.log('初始化时间系统 - 世界ID:', worldId);
  const timeManager = new TimeManager(worldId);
  new TimeSystemUI(timeManager);
}