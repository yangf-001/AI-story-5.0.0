// 色色系统插件 - HentaiPlugin.js
// 独立的色色系统插件，包含 HentaiSystem

(function() {
    'use strict';

    // =====================================================
    // 色色系统 - HentaiSystem (基础版)
    // =====================================================

    const HentaiSystem = {
        settings: null,

        init(worldId) {
            this.settings = DataManager.getHentaiSettings(worldId);
            return this.settings;
        },

        isEnabled() {
            return this.settings?.enabled ?? true;
        },

        getIntensity() {
            return this.settings?.intensity ?? 50;
        },

        canGenerate(type) {
            if (!this.isEnabled()) return false;
            if (type === 'extreme' && !this.settings?.scenes?.extreme) return false;
            if (type === 'weird' && !this.settings?.scenes?.weird) return false;
            return this.settings?.scenes?.[type] ?? true;
        },

        generateScenePrompt(participants, context) {
            const intensity = this.getIntensity();
            const prompts = {
                dialogue: this._generateDialoguePrompt(participants, intensity),
                道具: this._generateItemPrompt(participants, intensity),
                action: this._generateActionPrompt(participants, intensity),
                body: this._generateBodyPrompt(participants, intensity),
                pose: this._generatePosePrompt(participants, intensity),
                location: this._generateLocationPrompt(intensity),
                style: this._generateStylePrompt(intensity)
            };

            let prompt = `你是一个创作型作家。请根据以下情境创作一段暧昧/色情描写。\n\n`;
            prompt += `参与者: ${participants.map(p => p.name).join('、')}\n`;
            prompt += `情境: ${context}\n`;
            prompt += `激烈程度: ${intensity}%\n\n`;

            const enabledTypes = Object.entries(this.settings?.scenes || {})
                .filter(([k, v]) => v && k !== 'extreme' && k !== 'weird')
                .map(([k]) => k);

            if (enabledTypes.length > 0) {
                prompt += `请包含以下元素:\n`;
                enabledTypes.forEach(type => {
                    if (prompts[type]) prompt += `- ${type}: ${prompts[type]}\n`;
                });
            }

            prompt += `\n要求:\n`;
            prompt += `1. 用细腻的文字描写身体接触和情感交流\n`;
            prompt += `2. 通过对话、动作、心理描写营造氛围\n`;
            prompt += `3. 根据激烈程度调整描写深度\n`;
            prompt += `4. 不要出现不适内容\n`;
            prompt += `5. 保持文学性和美感\n`;
            prompt += `6. 字数根据激烈程度: ${this._getWordCount(intensity)}\n`;

            return prompt;
        },

        _generateDialogueParticipants(participants) {
            const types = ['调情', '告白', '请求', '赞美', '喘息', '撒娇'];
            return types[Math.floor(Math.random() * types.length)];
        },

        _generateDialoguePrompt(participants, intensity) {
            const type = this._generateDialogueParticipants(participants);
            const content = {
                low: `${participants[0].name}轻声对${participants[1]?.name || '对方'}说着甜蜜的话...`,
                medium: `两人互相调情，说着暧昧的话语...`,
                high: `${participants[0].name}用各种方式诱惑着对方...`
            };
            return content[intensity < 30 ? 'low' : intensity < 70 ? 'medium' : 'high'];
        },

        _generateItemPrompt(participants, intensity) {
            const items = [
                '按摩棒', '跳蛋', '蜡烛', '丝带', '眼罩', '手铐', '羽毛',
                '冰块', '红酒', '巧克力', '奶油', '草莓'
            ];
            if (intensity < 30) return '使用一些增添情趣的小道具...';
            const selected = items.slice(0, Math.ceil(intensity / 20));
            return `使用道具: ${selected.join('、')}`;
        },

        _generateActionPrompt(participants, intensity) {
            const low = ['牵手', '拥抱', '轻吻', '抚摸头发', '耳语'];
            const medium = ['亲吻', '爱抚', '脱衣', '抚摩', '拥抱'];
            const high = ['各种亲密接触', '深入交流', '激情缠绵'];

            let actions;
            if (intensity < 30) actions = low;
            else if (intensity < 70) actions = medium;
            else actions = high;

            return `动作: ${actions[Math.floor(Math.random() * actions.length)]}`;
        },

        _generateBodyPrompt(participants, intensity) {
            const parts = {
                low: ['手指', '手掌', '嘴唇'],
                medium: ['颈部', '耳垂', '肩膀', '腰部'],
                high: ['全身', '敏感部位', '私密处']
            };
            const level = intensity < 30 ? 'low' : intensity < 70 ? 'medium' : 'high';
            return `接触部位: ${parts[level].join('、')}`;
        },

        _generatePosePrompt(participants, intensity) {
            const poses = {
                low: ['面对面', '依偎', '拥抱'],
                medium: ['壁咚', '推倒', '公主抱'],
                high: ['各种姿势', '由浅入深', '变化万千']
            };
            const level = intensity < 30 ? 'low' : intensity < 70 ? 'medium' : 'high';
            return `姿势: ${poses[level][Math.floor(Math.random() * poses[level].length)]}`;
        },

        _generateLocationPrompt(intensity) {
            const locations = [
                '卧室', '浴室', '客厅', '厨房', '阳台', '书房',
                '花园', '车内', '酒店', '沙滩', '森林'
            ];
            const count = Math.ceil(intensity / 25);
            return `场景: ${locations.slice(0, count).join('、')}`;
        },

        _generateStylePrompt(intensity) {
            const styles = {
                low: '清新甜蜜',
                medium: '暧昧旖旎',
                high: '激情火热'
            };
            return `风格: ${styles[intensity < 30 ? 'low' : intensity < 70 ? 'medium' : 'high']}`;
        },

        _getWordCount(intensity) {
            if (intensity < 30) return '300-500字';
            if (intensity < 60) return '500-800字';
            if (intensity < 80) return '800-1200字';
            return '1200-2000字';
        },

        updateSettings(worldId, newSettings) {
            this.settings = { ...this.settings, ...newSettings };
            DataManager.saveHentaiSettings(worldId, this.settings);
        },

        renderSettingsPanel(worldId) {
            this.init(worldId);
            const s = this.settings;

            return `
                <div class="hentai-settings">
                    <div class="setting-section collapsed">
                        <h4>
                            基础设置
                            <button class="toggle-btn" onclick="var p=this.parentElement.parentElement;p.classList.toggle('collapsed');this.textContent=p.classList.contains('collapsed')?'展开':'收起'">展开</button>
                        </h4>
                        <div class="setting-content">
                            <div class="setting-row">
                                <label>启用成人内容</label>
                                <input type="checkbox" ${s.enabled ? 'checked' : ''} onchange="HentaiSystem.toggleEnabled('${worldId}', this.checked)">
                            </div>

                            <div class="setting-row">
                                <label>激烈程度: ${s.intensity}%</label>
                                <input type="range" min="0" max="100" value="${s.intensity}"
                                    onchange="HentaiSystem.updateIntensity('${worldId}', this.value)">
                            </div>

                            <div class="setting-row">
                                <label>多样性: ${s.variety}%</label>
                                <input type="range" min="0" max="100" value="${s.variety}"
                                    onchange="HentaiSystem.updateVariety('${worldId}', this.value)">
                            </div>
                        </div>
                    </div>

                    <div class="setting-section collapsed">
                        <h4>
                            内容选项
                            <button class="toggle-btn" onclick="var p=this.parentElement.parentElement;p.classList.toggle('collapsed');this.textContent=p.classList.contains('collapsed')?'展开':'收起'">展开</button>
                        </h4>
                        <div class="setting-content">
                            ${this._renderSceneOption('dialogue', '对话调情', worldId)}
                            ${this._renderSceneOption('道具', '道具互动', worldId)}
                            ${this._renderSceneOption('action', '动作描写', worldId)}
                            ${this._renderSceneOption('body', '身体接触', worldId)}
                            ${this._renderSceneOption('pose', '姿势体位', worldId)}
                            ${this._renderSceneOption('location', '场景选择', worldId)}
                            ${this._renderSceneOption('style', '性爱风格', worldId)}
                        </div>
                    </div>

                    <div class="setting-section collapsed warning">
                        <h4>
                            ⚠️ 高级选项
                            <button class="toggle-btn" onclick="var p=this.parentElement.parentElement;p.classList.toggle('collapsed');this.textContent=p.classList.contains('collapsed')?'展开':'收起'">展开</button>
                        </h4>
                        <div class="setting-content">
                            ${this._renderSceneOption('extreme', '重口内容', worldId)}
                            ${this._renderSceneOption('weird', '猎奇内容', worldId)}
                        </div>
                    </div>
                </div>
            `;
        },

        _renderSceneOption(key, label, worldId) {
            const checked = this.settings?.scenes?.[key] ?? true;
            return `
                <div class="scene-option">
                    <label>${label}</label>
                    <input type="checkbox" ${checked ? 'checked' : ''}
                        onchange="HentaiSystem.toggleScene('${worldId}', '${key}', this.checked)">
                </div>
            `;
        },

        toggleEnabled(worldId, enabled) {
            this.settings.enabled = enabled;
            DataManager.saveHentaiSettings(worldId, this.settings);
        },

        updateIntensity(worldId, value) {
            this.settings.intensity = parseInt(value);
            DataManager.saveHentaiSettings(worldId, this.settings);
        },

        updateVariety(worldId, value) {
            this.settings.variety = parseInt(value);
            DataManager.saveHentaiSettings(worldId, this.settings);
        },

        toggleScene(worldId, key, value) {
            this.settings.scenes = this.settings.scenes || {};
            this.settings.scenes[key] = value;
            DataManager.saveHentaiSettings(worldId, this.settings);
        }
    };

    // 导出到全局
    window.HentaiSystem = HentaiSystem;

})();