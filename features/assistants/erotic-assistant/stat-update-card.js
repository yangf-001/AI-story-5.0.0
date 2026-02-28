// 色色小助手数值更新卡片组件
class StatUpdateCard {
    constructor(container) {
        this.container = container;
        this.updateHistory = [];
    }

    // 添加数值更新记录
    addUpdate(characterName, statName, oldValue, newValue) {
        const update = {
            id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            characterName,
            statName,
            oldValue,
            newValue,
            timestamp: new Date()
        };

        this.updateHistory.unshift(update); // 添加到开头
        this.updateHistory = this.updateHistory.slice(0, 10); // 只保留最近10条记录
        this.render();
    }

    // 渲染卡片
    render() {
        if (!this.container) return;

        if (this.updateHistory.length === 0) {
            this.container.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-lg); color: #9CA3AF;">
                    暂无数值更新记录
                </div>
            `;
            return;
        }

        this.container.innerHTML = this.updateHistory.map(update => `
            <div style="
                background: linear-gradient(135deg, #FEF2F2, #FEF7FF);
                border-radius: var(--border-radius-lg);
                padding: var(--spacing-md);
                margin-bottom: var(--spacing-sm);
                border: 1px solid #FECDD3;
                box-shadow: 0 2px 8px rgba(236, 72, 153, 0.1);
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-sm);">
                    <div>
                        <h4 style="margin: 0; font-size: 1rem; font-weight: 600; color: #BE185D;">
                            ${update.characterName}
                        </h4>
                        <p style="margin: var(--spacing-xs) 0; font-size: 0.875rem; color: #EC4899;">
                            ${update.statName}
                        </p>
                    </div>
                    <span style="font-size: 0.75rem; color: #9CA3AF;">
                        ${this.formatTime(update.timestamp)}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: var(--spacing-md);">
                    <span style="font-size: 0.875rem; color: #6B7280;">
                        ${update.oldValue}
                    </span>
                    <div style="flex: 1; height: 4px; background-color: #FECDD3; border-radius: 2px; overflow: hidden;">
                        <div style="
                            height: 100%;
                            background: linear-gradient(90deg, #F472B6, #EC4899);
                            width: ${this.calculateProgress(update.oldValue, update.newValue)}%;
                            transition: width 0.5s ease;
                        "></div>
                    </div>
                    <span style="font-size: 0.875rem; font-weight: 600; color: #BE185D;">
                        ${update.newValue}
                    </span>
                </div>
                <div style="margin-top: var(--spacing-sm); font-size: 0.75rem;">
                    <span style="color: ${update.newValue > update.oldValue ? '#10B981' : '#EF4444'};">
                        ${update.newValue > update.oldValue ? '↑ 增加' : '↓ 减少'} ${Math.abs(update.newValue - update.oldValue)}点
                    </span>
                </div>
            </div>
        `).join('');
    }

    // 格式化时间
    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    // 计算进度条宽度
    calculateProgress(oldValue, newValue) {
        const min = Math.min(oldValue, newValue);
        const max = Math.max(oldValue, newValue);
        const range = max - min;
        return range > 0 ? ((newValue - min) / range) * 100 : 0;
    }

    // 清空更新记录
    clearUpdates() {
        this.updateHistory = [];
        this.render();
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatUpdateCard;
} else if (typeof window !== 'undefined') {
    window.StatUpdateCard = StatUpdateCard;
}