// 色色系统 V2 插件 - HentaiV2Plugin.js
// 独立的 HentaiSystemV2 插件

(function() {
    'use strict';

    // =====================================================
    // 色色系统 V2 - HentaiSystemV2 (增强版)
    // =====================================================

    const HentaiSystemV2 = {
        settings: null,
        history: [],
        usedCombinations: [],
        currentSelections: {},

        init(worldId) {
            this.settings = DataManager.getHentaiSettings(worldId) || this._getDefaultSettings();
            this._loadHistory(worldId);
            return this.settings;
        },

        _getDefaultSettings() {
            return {
                enabled: true,
                intensity: 50,
                variety: 80,
                scenes: {
                    dialogue: true,
                    道具: true,
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

        _loadHistory(worldId) {
            const key = `hentaiHistory_${worldId}`;
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                this.history = parsed.history || [];
                this.usedCombinations = parsed.usedCombinations || [];
            }
        },

        _saveHistory(worldId) {
            const key = `hentaiHistory_${worldId}`;
            localStorage.setItem(key, JSON.stringify({
                history: this.history.slice(-100),
                usedCombinations: this.usedCombinations.slice(-500)
            }));
        },

        // ==================== 大规模日常物品库 ====================
        // 各类日常物品与色情用途的关联

        itemPools: {
            // 食物类 - 可食用、可涂抹
            foods: [
                { name: '草莓', icon: '🍓', desc: '柔软的果实，适合轻咬', erotic: '用舌尖轻轻舔舐' },
                { name: '巧克力', icon: '🍫', desc: '甜蜜融化，涂抹全身', erotic: '融化的巧克力涂抹在身体上' },
                { name: '奶油', icon: '🧁', desc: '绵密柔软，可涂抹', erotic: '将奶油涂抹在敏感部位' },
                { name: '蜂蜜', icon: '🍯', desc: '黏稠甜蜜，触感特别', erotic: '蜂蜜的黏稠感带来刺激' },
                { name: '冰淇淋', icon: '🍦', desc: '冰凉甜美，温度反差', erotic: '冰凉的触感接触火热的身体' },
                { name: '香蕉', icon: '🍌', desc: '形状特殊，用途多样', erotic: '曲线带来的联想' },
                { name: '葡萄', icon: '🍇', desc: '小巧多汁，适合游戏', erotic: '用嘴传递的乐趣' },
                { name: '西瓜', icon: '🍉', desc: '清凉多汁，夏日必备', erotic: '水分带来的湿润感' },
                { name: '牛奶', icon: '🥛', desc: '白色液体，柔和触感', erotic: '牛奶浴的诱惑' },
                { name: '红酒', icon: '🍷', desc: '微醺氛围，液体流动', erotic: '红酒涂抹后舔舐' },
                { name: '果酱', icon: '🫙', desc: '浓稠甜蜜，颜色诱人', erotic: '彩色果酱的视觉刺激' },
                { name: '布丁', icon: '🍮', desc: 'Q弹嫩滑，入口即化', erotic: '布丁的触感联想' },
                { name: '棉花糖', icon: '🍡', desc: '柔软蓬松，轻盈触感', erotic: '轻抚的痒感' },
                { name: '坚果', icon: '🥜', desc: '坚硬外壳，内部柔软', erotic: '对比的触感' },
                { name: '糖果', icon: '🍬', desc: '甜蜜味道，小巧可爱', erotic: '含在嘴里的联想' },
                { name: '酸奶', icon: '🥛', desc: '浓稠乳白，肠道健康', erotic: '清洁与护理' },
                { name: '蛋黄酱', icon: '🫙', desc: '乳白浓稠，润滑效果', erotic: '特殊的润滑剂' },
                { name: '辣椒', icon: '🌶️', desc: '火热刺激，痛感快感', erotic: '辣感与快感的混合' },
                { name: '冰块', icon: '🧊', desc: '冰冷坚硬，温度反差', erotic: '冰火两重天的刺激' },
                { name: '柠檬', icon: '🍋', desc: '酸涩清新，汁液丰富', erotic: '酸涩带来的敏感' }
            ],

            // 家居用品类
            homeItems: [
                { name: '枕头', icon: '🛏️', desc: '柔软支撑，可用可枕', erotic: '压制的快感' },
                { name: '床单', icon: '🛏️', desc: '丝滑棉质，肌肤之亲', erotic: '摩擦的舒适感' },
                { name: '毛巾', icon: '🧖', desc: '吸水面料，柔软亲肤', erotic: '擦拭与包裹' },
                { name: '窗帘', icon: '🪟', desc: '遮蔽隐私，薄纱诱惑', erotic: '若隐若现的诱惑' },
                { name: '沙发', icon: '🛋️', desc: '柔软弹性，多种姿势', erotic: '客厅的私密空间' },
                { name: '椅子', icon: '🪑', desc: '支撑牢固，可坐可趴', erotic: '椅子上的花样' },
                { name: '桌子', icon: '🪟', desc: '平面坚硬，支撑稳定', erotic: '各种高度的姿势' },
                { name: '衣柜', icon: '🚪', desc: '封闭空间，隐藏秘密', erotic: '衣柜里的秘密' },
                { name: '镜子', icon: '🪞', desc: '反射影像，自我观赏', erotic: '镜中自赏的刺激' },
                { name: '台灯', icon: '💡', desc: '灯光照明，氛围营造', erotic: '昏黄灯光的暧昧' },
                { name: '风扇', icon: '🌀', desc: '凉风习习，触感微凉', erotic: '风带来全身的颤动' },
                { name: '空调遥控', icon: '❄️', desc: '温度调节，冷热交替', erotic: '空调房的诱惑' },
                { name: '书架', icon: '📚', desc: '高耸稳固，可攀可扶', erotic: '知识与欲望的结合' },
                { name: '花盆', icon: '🪴', desc: '植物绿植，自然气息', erotic: '花香与体香的混合' },
                { name: '地毯', icon: '🧶', desc: '柔软绒毛，地面舒适', erotic: '地毯上的亲密' },
                { name: '抱枕', icon: '🧸', desc: '柔软可抱，多姿多彩', erotic: '拥抱的替代品' },
                { name: '衣架', icon: '👗', desc: '悬挂物品，金属质感', erotic: '束缚的联想' },
                { name: '鞋柜', icon: '👠', desc: '存放鞋子，空间利用', erotic: '高跟鞋的诱惑' },
                { name: '浴室门', icon: '🚿', desc: '隔离空间，私密场所', erotic: '浴室的诱惑' },
                { name: '厨房台面', icon: '🍳', desc: '光滑平面，冰冷坚硬', erotic: '厨房的花样' }
            ],

            // 情趣用品类
            sexToys: [
                { name: '按摩棒', icon: '🔌', desc: '震动按摩，多档调速', erotic: '最基础的快感工具' },
                { name: '跳蛋', icon: '🥚', desc: '小巧便携，远程控制', erotic: '隐藏的刺激' },
                { name: '振动棒', icon: '🔋', desc: '深入探索，多种模式', erotic: '专业快感' },
                { name: '飞机杯', icon: '🥛', desc: '男性专用，模拟真实', erotic: '自动化的乐趣' },
                { name: '乳夹', icon: '🧷', desc: '夹住敏感，轻拉提扯', erotic: '疼痛的快感' },
                { name: '眼罩', icon: '👓', desc: '遮蔽视线，增强感知', erotic: '失明的刺激' },
                { name: '手铐', icon: '⛓️', desc: '束缚工具，控制自由', erotic: '被支配的感觉' },
                { name: '丝带', icon: '🎀', desc: '柔软捆绑，视觉诱惑', erotic: '温柔的束缚' },
                { name: '羽毛', icon: '🪶', desc: '轻轻扫过，瘙痒难耐', erotic: '全身的痒感' },
                { name: '蜡烛', icon: '🕯️', desc: '烛光晚餐，滴蜡游戏', erotic: '热蜡的刺激' },
                { name: '冰块模具', icon: '🧊', desc: '自制冰块，形状多样', erotic: '冰的多种形态' },
                { name: '口球', icon: '⚪', desc: '塞口玩具，禁止说话', erotic: '不能说话的屈辱' },
                { name: '项圈', icon: '🐕', desc: '宠物项圈，支配象征', erotic: '主人的标记' },
                { name: '尾巴', icon: '🐱', desc: '可爱尾巴，宠物扮演', erotic: '可爱诱惑' },
                { name: '胶衣', icon: '👙', desc: '紧身包裹，完全覆盖', erotic: '橡胶的质感' },
                { name: '贞操带', icon: '🔒', desc: '锁住欲望，控制释放', erotic: '禁欲的折磨' },
                { name: '拉珠', icon: '📿', desc: '串珠设计，渐进深入', erotic: '逐步升级的刺激' },
                { name: '假阳具', icon: '🔧', desc: '仿真设计，多种尺寸', erotic: '各种尺寸的选择' },
                { name: '肛塞', icon: '🔺', desc: '后庭开发，多种形态', erotic: '后庭的探索' },
                { name: '吸盘', icon: '🪄', desc: '吸附表面，多处可用', erotic: '各种场景的应用' }
            ],

            // 化妆品类
            cosmetics: [
                { name: '口红', icon: '💄', desc: '鲜艳颜色，涂抹身体', erotic: '在身体上留下痕迹' },
                { name: '指甲油', icon: '💅', desc: '指尖色彩，视觉诱惑', erotic: '手指的延伸' },
                { name: '香水', icon: '🧴', desc: '芬芳气味，嗅觉刺激', erotic: '体香的增强' },
                { name: '身体乳', icon: '🧴', desc: '滋润肌肤，柔软触感', erotic: '全身的抚摸' },
                { name: '面膜', icon: '🥸', desc: '覆盖面部，护理肌肤', erotic: '面膜后的诱惑' },
                { name: '睫毛膏', icon: '🪮', desc: '浓密睫毛，大眼效果', erotic: '眼神的诱惑' },
                { name: '眼线笔', icon: '✏️', desc: '勾勒眼线，电力十足', erotic: '眼线的性感' },
                { name: '腮红', icon: '🌸', desc: '粉嫩脸颊，害羞红晕', erotic: '自然的红晕' },
                { name: '发蜡', icon: '🧴', desc: '定型造型，湿发诱惑', erotic: '凌乱的性感' },
                { name: '剃须泡沫', icon: '🪒', desc: '白色泡沫，剃毛护理', erotic: '光滑的皮肤' },
                { name: '润肤油', icon: '🫒', desc: '油性质地，润滑效果', erotic: '油滑的触感' },
                { name: '痱子粉', icon: '🧴', desc: '爽身干爽，婴儿触感', erotic: '干爽的舒适' },
                { name: '护手霜', icon: '🖐️', desc: '柔软双手，细腻触感', erotic: '手部的重要性' },
                { name: '发圈', icon: '🎀', desc: '扎头发用，弹性绳索', erotic: '束缚的联想' },
                { name: '发夹', icon: '🧷', desc: '金属发夹，尖锐物品', erotic: '轻微的疼痛' }
            ],

            // 电器类
            appliances: [
                { name: '吹风机', icon: '💨', desc: '热风凉风，温度可控', erotic: '风带来全身颤动' },
                { name: '电动牙刷', icon: '🪥', desc: '震动模式，敏感部位', erotic: '高频率的震动' },
                { name: '按摩仪', icon: '🔌', desc: '多档力度，穴位按摩', erotic: '专业的按摩' },
                { name: '小风扇', icon: '🌀', desc: '随身凉风，电池供电', erotic: '持续的微风' },
                { name: '台灯', icon: '💡', desc: '调节亮度，暖光氛围', erotic: '昏黄的浪漫' },
                { name: '音箱', icon: '🔊', desc: '播放音乐，营造氛围', erotic: '音乐催情' },
                { name: '电脑', icon: '💻', desc: '屏幕显示，远程视频', erotic: '视频互动' },
                { name: '手机', icon: '📱', desc: '通讯工具，远程控制', erotic: '远程的刺激' },
                { name: '充电宝', icon: '🔋', desc: '供电设备，持续动力', erotic: '持久的动力' },
                { name: '数据线', icon: '🔌', desc: '线材柔软，可弯可直', erotic: '线材的用途' },
                { name: '耳机', icon: '🎧', desc: '听觉享受，私密音乐', erotic: '专属的音乐' },
                { name: '冰箱', icon: '🧊', desc: '冷藏空间，冷饮存放', erotic: '冰箱里的秘密' },
                { name: '微波炉', icon: '📟', desc: '加热食物，快速便捷', erotic: '加热的联想' },
                { name: '挂钟', icon: '🕐', desc: '时间显示，计时工具', erotic: '计时的play' },
                { name: '电暖器', icon: '🔥', desc: '温暖发热，寒冬必备', erotic: '温暖的环境' }
            ],

            // 服饰配件类
            clothing: [
                { name: '丝袜', icon: '👙', desc: '薄透材质，修饰腿型', erotic: '若有若无的诱惑' },
                { name: '高跟鞋', icon: '👠', desc: '增高提臀，优雅性感', erotic: '完美的曲线' },
                { name: '胸罩', icon: '👙', desc: '承托胸部，蕾丝花边', erotic: '半遮半掩' },
                { name: '内裤', icon: '🩲', desc: '私密遮蔽，棉质蕾丝', erotic: '最后的防线' },
                { name: '吊带袜', icon: '👗', desc: '袜带设计，诱惑加倍', erotic: '大腿的诱惑' },
                { name: '睡裙', icon: '👗', desc: '轻薄材质，居家性感', erotic: '睡衣的诱惑' },
                { name: '旗袍', icon: '👘', desc: '东方韵味，侧开叉设计', erotic: '开叉的联想' },
                { name: '泳装', icon: '👙', desc: '包裹身体，泳池海边', erotic: '湿身的诱惑' },
                { name: '制服', icon: '👔', desc: '职业装束，教师护士', erotic: '角色扮演' },
                { name: '皮衣', icon: '🧥', desc: '皮质面料，酷炫性感', erotic: '野性的诱惑' },
                { name: '围裙', icon: '👨‍🍳', desc: '厨房用品，裸露设计', erotic: '厨房诱惑' },
                { name: '手套', icon: '🧤', desc: '手部装饰，薄纱皮质', erotic: '触摸的隔阂' },
                { name: '帽子', icon: '🎩', desc: '头饰搭配，增添气质', erotic: '气质的改变' },
                { name: '领带', icon: '👔', desc: '正式配件，束缚用途', erotic: '领带的束缚' },
                { name: '脚链', icon: '⛓️', desc: '脚部装饰，铃铛作响', erotic: '声音的诱惑' }
            ],

            // 户外用品
            outdoor: [
                { name: '帐篷', icon: '⛺', desc: '野外遮蔽，私密空间', erotic: '露营的夜晚' },
                { name: '野餐垫', icon: '🧺', desc: '草坪柔软，户外亲密', erotic: '大自然的亲密' },
                { name: '泳镜', icon: '🥽', desc: '防水护目，水下世界', erotic: '水下的视觉' },
                { name: '救生圈', icon: '🦺', desc: '环形漂浮，支撑用途', erotic: '水中的支撑' },
                { name: '沙滩巾', icon: '🏖️', desc: '沙上铺设，吸水速干', erotic: '沙滩的浪漫' },
                { name: '遮阳伞', icon: '⛱️', desc: '遮阳挡光，私密空间', erotic: '伞下的秘密' },
                { name: '自行车', icon: '🚲', desc: '骑行工具，车上姿势', erotic: '自行车的姿势' },
                { name: '汽车', icon: '🚗', desc: '移动空间，私密场所', erotic: '车震的刺激' },
                { name: '电梯', icon: '🚅', desc: '狭小空间，短暂密闭', erotic: '电梯里的刺激' },
                { name: '楼梯', icon: '🪜', desc: '台阶层叠，俯视视角', erotic: '楼梯间的偷情' }
            ],

            // 办公用品
            office: [
                { name: '订书机', icon: '📎', desc: '金属材质，钉合纸张', erotic: '订书针的联想' },
                { name: '回形针', icon: '📌', desc: '弯曲金属，形状多样', erotic: '曲线的用途' },
                { name: '胶带', icon: '🩹', desc: '透明粘性，包裹缠绕', erotic: '胶带的束缚' },
                { name: '计算器', icon: '🔢', desc: '按键操作，数字输入', erotic: '按键的联想' },
                { name: '钢笔', icon: '🖊️', desc: '金属笔尖，书写工具', erotic: '书写的联想' },
                { name: '剪刀', icon: '✂️', desc: '剪切工具，锋利边缘', erotic: '剪开的刺激' },
                { name: '文件夹', icon: '📁', desc: '整理归档，金属夹子', erotic: '夹子的用途' },
                { name: '白板笔', icon: '🖍️', desc: '彩色笔墨，可擦可写', erotic: '在身体上书写' },
                { name: '印章', icon: '🔴', desc: '印泥红色，盖章留痕', erotic: '留下的痕迹' },
                { name: '便利贴', icon: '📝', desc: '小小纸片，留言提醒', erotic: '留言的调情' }
            ],

            // 特殊物品
            special: [
                { name: '扑克牌', icon: '🃏', desc: '纸牌游戏，输赢惩罚', erotic: '惩罚游戏' },
                { name: '骰子', icon: '🎲', desc: '随机点数，决定命运', erotic: '命运的安排' },
                { name: '气球', icon: '🎈', desc: '充气玩具，彩色多样', erotic: '气球的用途' },
                { name: '彩带', icon: '🎊', desc: '庆祝用品，柔软飘带', erotic: '捆绑的装饰' },
                { name: '喷雪罐', icon: '❄️', desc: '白色泡沫，喷射游戏', erotic: '白色的浪漫' },
                { name: '彩弹', icon: '🔫', desc: '彩色颜料，互相射击', erotic: '色彩的印记' },
                { name: '相机', icon: '📷', desc: '拍摄留念，定格瞬间', erotic: '拍照的诱惑' },
                { name: '手机支架', icon: '📱', desc: '固定设备，解放双手', erotic: '录像的便利' },
                { name: 'LED灯串', icon: '💡', desc: '小灯闪烁，浪漫氛围', erotic: '闪烁的浪漫' },
                { name: '香薰蜡烛', icon: '🕯️', desc: '芳香怡人，烛光摇曳', erotic: '香气的催情' }
            ]
        },

        // ==================== 身体部位库 ====================
        bodyParts: {
            头部: ['头发', '耳朵', '脸颊', '嘴唇', '舌头', '牙齿', '下巴', '脖子', '呼吸', '气息'],
            上身: ['肩膀', '手臂', '手', '手指', '胸口', '乳房', '乳头', '后背', '腰部', '肚脐'],
            下身: ['臀部', '大腿', '膝盖', '小腿', '脚', '脚趾', '私处', '阴部', '肛门', '会阴'],
            特殊: ['颈部', '腋下', '肚脐周围', '大腿内侧', '膝盖窝', '耳垂', '手指关节', '手腕']
        },

        // ==================== 性爱姿势库 ====================
        poses: {
            传统式: ['传教士', '后入式', '侧入式', '坐姿', '站姿', '站式', '骑乘', '69式', '对面式', '背后环抱'],
            进阶式: ['火车便当', '水下式', '椅子上', '桌面上', '墙边', '窗台', '楼梯', '浴室', '厨房', '阳台'],
            特殊性: ['观音坐莲', '老汉推车', '隔山取火', '老树盘根', '海枯石烂', '天塌地陷', '双龙出海', '毒龙钻', '千斤压顶', '倒挂金钩'],
            情趣式: ['捆绑式', '蒙眼式', '乳胶衣', '角色扮演', '主仆式', '惩罚式', 'cosplay', 'OL装', '女仆装', '制服诱惑']
        },

        // ==================== 性爱场景库 ====================
        locations: {
            室内: ['卧室', '客厅', '浴室', '厨房', '书房', '阳台', '衣帽间', '储藏室', '地下室', '阁楼'],
            公共场所: ['酒店', '民宿', '办公室', '教室', '图书馆', '餐厅', '咖啡厅', '商场', '电影院', 'KTV'],
            户外: ['公园', '沙滩', '游泳池', '海边', '山顶', '树林', '草地', '河边', '温泉', '营地'],
            特殊: ['电梯', '车内', '火车', '飞机', '船上', '帐篷', '吊床', '秋千', '吊椅', '按摩床']
        },

        // ==================== 性爱风格库 ====================
        styles: {
            温柔: ['缓慢轻柔', '循序渐进', '爱抚为主', '甜蜜耳语', '互相亲吻', '全身抚摸', '耐心引导', '细腻体贴'],
            激烈: ['狂野奔放', '用力冲刺', '快速激烈', '占有欲强', '粗暴一些', '尽情释放', '忘我投入', '激情四射'],
            浪漫: ['烛光晚餐', '花瓣铺床', '音乐相伴', '红酒助兴', '深情对视', '慢慢来', '注重氛围', '甜蜜告白'],
            暧昧: ['调情逗趣', '欲拒还迎', '言语挑逗', '轻薄试探', '故意拖延', '制造悬念', '欲擒故纵', '脸红心跳'],
            特殊性: ['角色扮演', '主人奴隶', '惩罚游戏', '命令服从', '羞耻play', '言语羞辱', '支配控制', '臣服屈服']
        },

        // ==================== 动作库 ====================
        actions: {
            抚摸: ['轻轻抚摸', '用力揉捏', '缓慢滑过', '画圈抚摸', '轻拍', '抓握', '按压', '摩擦'],
            亲吻: ['轻吻', '深吻', '舌吻', '亲吻耳朵', '亲吻脖子', '亲吻胸口', '亲吻腹部', '亲吻大腿'],
            舔舐: ['轻舔', '舌舔', '吸吮', '轻咬', '用舌头画圈', '慢慢品味', '轻轻扫过', '深入探索'],
            爱抚: ['全身爱抚', '敏感部位爱抚', '用手探索', '用手指', '用手掌', '用头发', '用嘴唇', '用舌头'],
            技巧: ['上下移动', '前后摩擦', '旋转', '抽插', '深入', '浅出', '节奏变化', '力量变化']
        },

        // ==================== 对话题材库 ====================
        dialogues: {
            调情: ['你真美', '我想要你', '给我', '舒服吗', '喜欢我这样吗', '叫出来', '说爱我', '求我'],
            喘息: ['啊', '嗯', '好舒服', '不要停', '再来', '好深', '要到了', '去了'],
            撒娇: ['不要嘛', '再陪我', '再來一次', '爱我', '抱抱', '亲亲', '举高高', '要抱抱'],
            命令: ['躺下', '张开', '翘起来', '不要动', '叫声主人', '求我', '给我舔', '听话'],
            赞美: ['你好紧', '好湿', '好棒', '好美', '好可爱', '好性感', '好会吸', '好会夹']
        },

        // ==================== 重口内容 ====================
        extreme: {
            角色扮演: ['护士', '教师', '警察', 'OL', '女仆', '空姐', '动漫角色', '游戏角色'],
            特殊性癖: ['sm', '捆绑', '滴蜡', '鞭打', '乳交', '足交', '颜射', '口爆', '内射', '潮吹'],
            多人: ['3p', '4p', '交换', '群p', '车轮战'],
            场所: ['公共场合', '偷情', '偷窥', '被偷看', ' exhibitionism', 'voyeurism']
        },

        // ==================== 猎奇内容（来自爱好.txt和玩法1.0.json） ====================
        weird: {
            特殊玩法: ['异物', '水果插入', '蔬菜', '瓶子', '玩具', '膨胀', 'fisting', 'multiple', '尿道异物', '尿道扩张', '尿道饮用', '乳交', '榨精', '爆肛', '肛门拓印', '阴唇拓印', '阴道拔河', '胸部瓷器印花', '肛门收缩', '双阴道', '双阴茎', '阴茎变长', '阴道吸吮', '透明肛塞', '发光肛塞', '大型肛塞', '尾巴肛塞', '坐脸放屁', '坐脸排尿', '坐脸排便', '粪便涂抹', '舔粪便', '尿液浇灌', '辣椒水涂抹', '芥末肛门', '电流刺激', '滚烫蜡油', '玻璃刮肛门', '蚂蚁叮咬', '蛇缠绕', '精液浸泡', '进肚条', '下蛋喂食'],
            极端: ['严重sm', '失禁', '排泄', '排便', '呕吐', '窒息', '放逐', '药物', '手术', '舔肛', '肛塞', '透明肚子', '身体互换', '精神控制', '洗脑', '非自愿', '催眠', '记忆丧失'],
            其他: ['人外', '触手', '重毛', '扶她', '马屌', '半人马', '阿黑颜', '巨乳', '乳摇', '乳汁', '挤奶', '吞精', '奶油阴道', '假阴茎口罩', '肛塞外出', '炮机性爱', '蛋入'],
            公众场合: ['露出', '露阴癖', '公众场合隐性性交', '人前隐性性交', '公共场所露阴蒂', '公共场所露阴茎', '公共场所肛交', '公共场所口交', '公共场所手淫', '公共场所尿交', '公共场所群交', '公共场所舔阴蒂', '公共场所舔肛门', '公共场所脚碰', '公共场所脚碰阴蒂', '公共场所震动', '电影院爱抚', '电影院震动', '图书馆做爱', '飞机厕所', '酒店走廊', '厕所做爱', '电梯做爱'],
            外出: ['开大车', '开迷你车', '跳蛋外出', '震动内裤', '肛塞外出', '发光肛塞外出', '购物跳蛋', '公交震动', '地铁刺激'],
            特殊装饰: ['裸体围裙', '情趣内衣', '情趣内衣做家务', '紧身衣做爱', '透明胸罩', '乳胶衣', '丝袜', '吊带袜', '制服诱惑', '角色扮演', '主人奴隶', '命令服从', '羞耻play', '言语羞辱', '支配控制', '臣服屈服'],
            体液: ['汗水', '乳汁', '乳汁喂养', '乳汁涂抹', '乳汁肛门', '乳汁舔肛门', '尿液', '尿交', '坐脸排尿', '尿液浇灌', '精液', '吞精', '精液涂抹', '精液浸泡'],
            特殊刺激: ['舔阴', '口交', '肛交', '乳交', '足交', '颜射', '口爆', '潮吹', '前列腺', '女性射精', '多重高潮', '持续刺激']
        },

        // ==================== 完整标签系统（来自标签.json） ====================
        // 轻度：基本性爱、正常姿势、角色扮演、轻微SM
        lightTags: [
            '内射', '外射', '中出', '口交', '深喉', '颜射', '口内射精', '乳头', '阴唇', '阴蒂', 
            '阴茎', '龟头', '勃起', '潮吹', '自慰', '相互自慰', '自慰指导', '传教士式', '后入式', 
            '女上位', '侧入式', '从背后', '揉捏', '抚摸', '抽插', '撞击', '摩擦', '脖颈亲吻', 
            '耳后轻咬', '腋下爱抚', '大腿内侧抚摸', '脚裸抚摸', '护士play', '女仆play', '学生制服play', 
            '警察play', '主仆play', '丝袜play', '围裙play', '裸体系围裙', '蕾丝play', '振动器play', 
            '跳蛋play', '按摩棒play', '胸部露出', '阴部露出', '阴蒂露出', '龟头露出', '乳头露出', 
            '阴唇张开', '阴部开放', '肛门开放', '乳头开放', '丝袜', '膝袜', '裤袜', '连裤袜', 
            'cosplay', '水手服', '赤脚', '女仆装', '高潮', '高潮表情', '喘息', '喊叫', '呻吟', 
            '娇喘', '湿润', '润滑油', '高潮体验', '痉挛', '熟女', '少女', '萝莉', '正太', '纯情', 
            '温柔', '浪漫', '甜蜜', '爱抚', '亲吻', '拥抱', '轻咬', '抚摸', '按摩', '温柔插入', 
            '缓慢抽插', '轻声细语', '温柔爱抚', '轻柔触摸', '温柔亲吻', '缓慢进入'
        ],

        // 中度：肛交、足交、束缚、调教、公共场所
        mediumTags: [
            '肛交', '肛门', '足交', '足舔', '脚交', '乳头刺激', '阴蒂刺激', 'G点刺激', '手指插入', 
            '口舌服务', '乳房舔弄', '阴蒂舔弄', '肛门刺激', '阴部刺激', '龟头刺激', '肛塞露出', 
            '口球play', '肛门塞', '手铐', '脚镣', '眼罩', '绳子', '束缚', '调教', '性教育', 
            '性训练', '性游戏', '性开发', '办公室性爱', '会议室play', '电梯性爱', '健身房play', 
            '图书馆性爱', '厨房性爱', '餐桌play', '沙发性爱', '浴室play', '浴缸性爱', '公园性爱', 
            '森林play', '海滩性爱', '野外性爱', '月光性爱', '悬浮床', '振动器', '跳蛋', 'dildo', 
            '按摩棒', '口枷', '多重高潮', '连续高潮', '射精控制', '性爱道具', '日常生活道具性爱', 
            '甜品按摩油', '蕾丝女仆装', '棉质白丝袜', '半透明内衣', '性感围裙', '黑色皮质女仆装', 
            '乳头硬直', '阴蒂硬直', '龟头硬直', '阴部润滑', '肛门润滑', '乳头润滑', '阴蒂润滑', 
            '龟头润滑', '精液罐', '恋物', '足恋', '乳头恋', '阴部恋', '臀部恋', '颜射恋', '巨根', 
            '巨乳', '贫乳', '萝莉巨乳', '傲娇', '病娇', '羞耻', '占有欲', '隐忍', '腹黑', '伪娘', 
            '秀吉', '扶他', '精灵', '天使', '恶魔', '人鱼', '吸血鬼'
        ],

        // 重度：SM、特殊性癖、兽人与魔物
        heavyTags: [
            '鞭打', '皮鞭', '滴蜡', '蜜蜡', '蜡烛', '电击', '高级束缚', '锁链', '悬吊', '乳头夹', 
            '拳交', '灌肠', '肛门训练', '重度撞击', '重度羞辱', '公开羞辱', '宠物扮演', '便器游戏', 
            '尿道栓', '公共场合自慰', '山顶play', '田野性爱', '大屌萌妹', '多屌', '性变态', '变身', 
            '性改造', '失神高潮', '持续高潮', '连续射精', '多次射精', '大量射精', '射精表情', '射精量', 
            '射精距离', '射精角度', '射精速度', '射精温度', '射精粘度', '射精颜色', '射精气味', 
            '射精味道', '爱液量', '爱液粘度', '爱液颜色', '爱液气味', '爱液味道', '乳头颜色', '乳头大小', 
            '乳头形状', '乳头敏感', '乳头反应', '阴唇颜色', '阴唇大小', '阴唇形状', '阴唇敏感', '阴唇反应', 
            '阴蒂颜色', '阴蒂大小', '阴蒂形状', '阴蒂敏感', '阴蒂反应', '龟头颜色', '龟头大小', '龟头形状', 
            '龟头敏感', '龟头反应', '阴茎颜色', '阴茎大小', '阴茎形状', '阴茎敏感', '阴茎反应', '肛门颜色', 
            '肛门形状', '肛门敏感', '肛门反应', '乳头周围', '阴唇周围', '阴蒂周围', '龟头周围', '阴茎周围', 
            '肛门周围', '兽人', '龙族', '魔物娘', '透明人', '巨人', '小人', '一寸法师', '巨人族', '小人族', 
            '矮人', '哥布林'
        ],

        // 极端：排泄、兽交、强奸、精神控制
        extremeTags: [
            '黄金淋浴', '粪便游戏', '排便', '大便', '放屁', '极端角色扮演', '食器系女子', '极端玩具', 
            '精液交换', '性转', '食物插入', '水果插入', '触手', '异种交', '魔物交', '兽交', '机器人', 
            '怀孕', '生产', '哺乳', '母乳', '乳汁', '鼻钉', '唇钉', '舌钉', '乳头钉', '阴部钉', '肛门钉', 
            '极端羞辱', '公开暴露', '公共场合性交', '多人轮奸', '群交', '乱伦', '近亲性交', '兽奸', '人兽交', 
            '恋童', '儿童性游戏', '强奸', '强制性交', '暴力性交', '虐待', '性虐待', '肉体虐待', '精神虐待', 
            '酷刑', '性酷刑', '阉割', '生殖器虐待', '肛门扩张', '阴道扩张', '尿道插入', '膀胱插入', '子宫插入', 
            '脑控', '精神控制', '药物控制', '催眠', '性奴隶', '奴隶训练', '性奴调教', '永久标记', '纹身', 
            '刺青', '烙印', '身体改造', '生殖器改造', '乳房改造', '阴部改造', '肛门改造', '极端变性', 
            '性别转换', '身体交换', '意识交换', '灵魂交换', '多重人格', '分裂人格', '精神分裂', '幻觉', 
            '妄想', '精神错乱'
        ],

        // ==================== 输出风格系统（来自输出风格.txt） ====================
        outputStyle: {
            // 身份定义
            identities: {
                daily: '日常生活的观察者 - 敏锐捕捉细微动作、不完美细节和多感官瞬间，营造真实沉浸感',
                erotic: '感官体验的描绘者 - 直白大胆描绘最原始、最直接的感官体验，让读者看到颜色、闻到气味、听到声音、感受到触觉',
                narrative: '叙事工程师 - 确保叙事结构坚实生动，关注动作序列、角色反应、内心感受、声音层次和事后状态',
                creator: '自由与束缚的舞者 - 在自由发挥与系统框架间优雅舞蹈，将数值、特质自然融入描写'
            },
            
            // 词汇选择
            vocabulary: {
                bodyParts: ['淫水', '阴茎', '阴道', '阴蒂', '肛门', '精液', '阴唇', '龟头', '睾丸', '乳房', '乳头', '臀部', '舌头', '手指'],
                fluids: ['淫水', '精液', '尿液', '汗水', '乳汁', '口水'],
                actions: ['抽插', '插入', '舔舐', '吸吮', '揉捏', '抚摸', '爱抚', '摩擦', '撞击', '冲刺', '吞吐', '套弄']
            },

            // 感官描写
            senses: {
                visual: ['乳房晃动幅度', '淫水光润度', '龟头青筋', '阴唇颜色变化', '皮肤泛红程度', '身体起伏'],
                auditory: ['呻吟音调变化', '肉体撞击频率', '唾液吞咽声', '振动器嗡嗡声', '喘息声', '尖叫'],
                tactile: ['皮肤温度差异', '阴道收缩强度', '肛门紧致感', '乳头硬度', '肌肉紧绷程度', '汗水滑落'],
                olfactory: ['体液腥甜', '汗液咸香', '精液麝香', '淫水酸香', '香水混合体味'],
                gustatory: ['精液的咸苦味', '淫水的酸咸味', '肛门的屎臭味', '汗液的咸味', '尿液的骚味']
            },

            // 身体反应
            bodyReactions: {
                breathing: ['呼吸变得粗重嘶哑', '胸部剧烈起伏', '喘息不止', '屏住呼吸'],
                genitals: ['乳头挺立发硬', '阴道内壁皱褶夹紧阴茎', '阴蒂因刺激而肿胀发亮', '肛门括约肌有节奏收缩', '睾丸向上收紧贴近身体'],
                muscles: ['背部肌肉因快感紧绷', '手指因用力关节发白', '脚趾因高潮蜷缩', '全身皮肤因兴奋泛红', '身体微微颤抖']
            },

            // 对话风格
            dialogue: {
                explicit: ['操我', '快一点', '好深', '再用力', '要射了', '插死我', '肛门好涨', '阴蒂好痒', '不要停', '给我', '好舒服', '爱你'],
                gentle: ['轻一点', '慢点', '抱抱', '亲亲', '好痒', '讨厌', '不要这样', '怕怕'],
                dominant: ['躺好', '不许动', '叫声主人', '求我', '听话', '屁股翘起来', '张开腿']
            },

            // 动作描写创新
            innovativeActions: {
                insertion: ['阴茎以螺旋式轨迹缓慢插入', '阴茎以蛇形游动方式深入', '阴茎以脉冲式节奏抽插'],
                fingers: ['手指采用波浪式抽插', '手指呈梳子状分开', '手指画圈探索'],
                tongue: ['舌头用螺旋式技巧', '舌头点状刺激', '舌头画圈混合技巧'],
                hips: ['臀部以8字形摆动', '臀部圆形扭动', '臀部前后大幅度摆动'],
                combined: ['手脚并用', '身体角度调整', '互动式共振', '环境利用', '道具辅助']
            },

            // 情感表达
            emotions: ['羞耻感与快感交织', '征服欲的满足', '被控制的屈辱感与快感混合', '公开场合的紧张感', '背德感的刺激'],

            // 节奏控制
            rhythm: ['缓慢前戏', '逐渐加快', '激烈高潮', '最终爆发', '事后温存'],

            // 细节放大
            details: ['龟头前端的马眼流出透明液体', '阴唇因兴奋而肿胀张开', '阴蒂因刺激而变大变硬', '肛门周围的肌肉因紧张而收缩', '睾丸因即将射精而变得紧绷'],

            // 对比描写
            contrasts: ['纯洁外表与放荡行为', '公共场合紧张与私密放纵', '平时温柔与性交粗暴', '羞耻表情与放荡动作']
        },

        // ==================== 玩法关键词库（来自玩法1.0.json） ====================
        playStyles: [
            // 新增：角色扮演类
            { word: '护士', play: '护士角色扮演', trigger: '护士', desc: '穿着护士服，扮演医护人员进行亲密互动' },
            { word: '教师', play: '教师角色扮演', trigger: '教师', desc: '穿着教师服，扮演老师进行亲密互动' },
            { word: '警察', play: '警察角色扮演', trigger: '警察', desc: '穿着警服，扮演警察进行亲密互动' },
            { word: '空姐', play: '空姐角色扮演', trigger: '空姐', desc: '穿着空姐制服，扮演空姐进行亲密互动' },
            { word: '女仆', play: '女仆角色扮演', trigger: '女仆', desc: '穿着女仆装，扮演仆人进行亲密互动' },
            { word: '学生', play: '学生角色扮演', trigger: '学生', desc: '穿着学生制服，扮演学生进行亲密互动' },
            { word: '办公室', play: '办公室OL角色扮演', trigger: '办公室', desc: '穿着职业装，扮演办公室OL进行亲密互动' },
            { word: '医生', play: '医生角色扮演', trigger: '医生', desc: '穿着白大褂，扮演医生进行亲密互动' },
            
            // 新增：节日主题类
            { word: '圣诞', play: '圣诞主题性爱', trigger: '圣诞', desc: '在圣诞节氛围中进行亲密互动，使用圣诞装饰' },
            { word: '情人节', play: '情人节主题性爱', trigger: '情人节', desc: '在情人节氛围中进行亲密互动，使用玫瑰和巧克力' },
            { word: '万圣节', play: '万圣节主题性爱', trigger: '万圣节', desc: '穿着万圣节服装进行亲密互动' },
            { word: '生日', play: '生日主题性爱', trigger: '生日', desc: '在生日氛围中进行亲密互动，使用蛋糕和蜡烛' },
            
            // 新增：特殊场景类
            { word: '雪景', play: '雪景性爱', trigger: '雪景', desc: '在雪地里或有雪景的环境中进行亲密互动' },
            { word: '篝火', play: '篝火性爱', trigger: '篝火', desc: '在篝火旁进行亲密互动，享受温暖和浪漫' },
            { word: '星空', play: '星空帐篷性爱', trigger: '星空', desc: '在可以看到星空的帐篷里进行亲密互动' },
            { word: '瀑布', play: '瀑布性爱', trigger: '瀑布', desc: '在瀑布下进行亲密互动，享受水流的刺激' },
            
            // 新增：情趣用品类
            { word: '振动器', play: '振动器互动', trigger: '振动器', desc: '使用振动器进行亲密互动，增加刺激感' },
            { word: '肛塞', play: '肛塞互动', trigger: '肛塞', desc: '使用肛塞进行亲密互动，增加肛门刺激' },
            { word: '跳蛋', play: '跳蛋互动', trigger: '跳蛋', desc: '使用跳蛋进行亲密互动，增加阴蒂刺激' },
            { word: '情趣内衣', play: '情趣内衣互动', trigger: '情趣内衣', desc: '穿着情趣内衣进行亲密互动，增加视觉刺激' },
            { word: '捆绑', play: '捆绑互动', trigger: '捆绑', desc: '使用绳子或 handcuffs 进行捆绑互动' },
            { word: '眼罩', play: '蒙眼互动', trigger: '眼罩', desc: '使用眼罩蒙住眼睛，增加感官刺激' },
            
            // 新增：特殊玩法类
            { word: '69式', play: '69式互动', trigger: '69式', desc: '两人同时进行口交的姿势' },
            { word: '肛交', play: '肛交互动', trigger: '肛交', desc: '进行肛门性交，增加刺激感' },
            { word: '乳交', play: '乳交互动', trigger: '乳交', desc: '使用乳房进行性交，增加视觉刺激' },
            { word: '足交', play: '足交互动', trigger: '足交', desc: '使用脚进行性交，增加特殊刺激' },
            { word: '颜射', play: '颜射互动', trigger: '颜射', desc: '在对方脸上射精，增加视觉刺激' },
            { word: '口爆', play: '口爆互动', trigger: '口爆', desc: '在对方口中射精，增加刺激感' },
            
            // 原有玩法
            { word: '摇晃', play: '巨乳乳摇', trigger: '摇晃', desc: '女性乳房晃动，增加视觉刺激' },
            { word: '家务', play: '穿戴情趣内衣做家务', trigger: '家务', desc: '穿着情趣内衣做家务，随时被对方打扰' },
            { word: '做饭', play: '裸体围裙做饭', trigger: '做饭', desc: '穿裸体围裙在厨房做饭，互相爱抚' },
            { word: '游泳', play: '人鱼性爱', trigger: '游泳', desc: '变成人鱼在水中做爱，享受浮力感' },
            { word: '独处', play: '私人场所全裸', trigger: '独处', desc: '在只有两人的私人场所全裸活动' },
            { word: '电影', play: '全裸看片', trigger: '电影', desc: '在家全裸观看色情电影，增加刺激感' },
            { word: '花园', play: '花园全裸', trigger: '花园', desc: '在私人花园全裸活动，享受户外自由' },
            { word: '翅膀', play: '精灵性爱', trigger: '翅膀', desc: '变成有翼精灵，用魔法翅膀增加性爱姿势' },
            { word: '羽毛', play: '羽毛挑逗', trigger: '羽毛', desc: '用羽毛轻轻挑逗对方的阴蒂和肛门' },
            { word: '玫瑰', play: '玫瑰摩擦', trigger: '玫瑰', desc: '用玫瑰花蕾轻轻摩擦对方的阴蒂' },
            { word: '花瓣', play: '花瓣做爱', trigger: '花瓣', desc: '用花瓣铺满床，在花瓣上做爱' },
            { word: '按摩', play: '精油按摩', trigger: '按摩', desc: '用香草精油轻轻按摩对方的阴蒂和肛门' },
            { word: '帐篷', play: '萤火虫帐篷', trigger: '帐篷', desc: '在萤火虫围绕的帐篷里做爱，浪漫氛围' },
            { word: '棉花糖', play: '棉花糖擦拭', trigger: '棉花糖', desc: '用棉花糖轻轻擦拭对方的阴蒂和肛门，然后吃掉' },
            { word: '星空', play: '屋顶做爱', trigger: '星空', desc: '在星空下的屋顶上做爱，享受开阔感' },
            { word: '扇子', play: '羽毛扇挑逗', trigger: '扇子', desc: '用羽毛扇轻轻扇动对方的私密部位' },
            { word: '温泉', play: '温泉做爱', trigger: '温泉', desc: '在温泉中做爱，享受温暖的水流' },
            { word: '紧身衣', play: '紧身衣做爱', trigger: '紧身衣', desc: '女性穿紧身衣凸显乳房曲线，然后做爱' },
            { word: '胸罩', play: '透明胸罩', trigger: '胸罩', desc: '女性穿透明胸罩若隐若现，然后做爱' },
            { word: '巧克力', play: '巧克力涂抹', trigger: '巧克力', desc: '用巧克力酱轻轻涂抹对方的乳房，然后舔食' },
            { word: '洗澡', play: '花瓣浴做爱', trigger: '洗澡', desc: '在花瓣浴中做爱，享受浪漫氛围' },
            { word: '围巾', play: '丝绸捆绑', trigger: '围巾', desc: '用丝绸围巾轻轻捆绑对方的双手，增加刺激' },
            { word: '音乐', play: '音乐做爱', trigger: '音乐', desc: '在音乐中做爱，随着节奏摆动身体' },
            { word: '蜡烛', play: '香薰蜡烛', trigger: '蜡烛', desc: '用香薰蜡烛的温暖蜡油轻轻滴在对方的乳房上' },
            { word: '樱桃', play: '樱桃塞入', trigger: '樱桃', desc: '用樱桃塞进阴道或肛门，然后吃掉' },
            { word: '印章', play: '肛门拓印', trigger: '印章', desc: '在肛门处拓印，留下印记' },
            { word: '印记', play: '阴唇拓印', trigger: '印记', desc: '在阴唇处拓印，留下印记' },
            { word: '奶油', play: '奶油阴道', trigger: '奶油', desc: '奶油挤入阴道，然后舔干净' },
            { word: '玩具', play: '跳蛋外出', trigger: '玩具', desc: '男女都塞入跳蛋，互相拿遥控器外出' },
            { word: '骑马', play: '半人马性交', trigger: '骑马', desc: '半人马（男）与女性性交' },
            { word: '测量', play: '进肚条', trigger: '测量', desc: '肚子上画刻度尺，测量插入深度' },
            { word: '透明', play: '透明肛塞', trigger: '透明', desc: '使用透明肛塞，可观察内部' },
            { word: '看穿', play: '透明肚子', trigger: '看穿', desc: '肚子透明，可以看见子宫、阴道' },
            { word: '下蛋', play: '生蛋喂食', trigger: '下蛋', desc: '变成有翼族生蛋，做给对象吃' },
            { word: '内裤', play: '震动内裤', trigger: '内裤', desc: '穿戴震动内裤外出，遥控器由对方控制' },
            { word: '蜂蜜', play: '蜂蜜涂抹', trigger: '蜂蜜', desc: '用蜂蜜涂抹对方私密部位然后舔食' },
            { word: '电影院', play: '电影院爱抚', trigger: '电影院', desc: '在电影院用手互相爱抚' },
            { word: '阳台', play: '阳台做爱', trigger: '阳台', desc: '在阳台上做爱，享受户外自由感' },
            { word: '购物', play: '购物跳蛋', trigger: '购物', desc: '穿戴遥控跳蛋去购物，由对方控制' },
            { word: '电梯', play: '电梯做爱', trigger: '电梯', desc: '在电梯中快速做爱，享受时间紧迫的刺激' }
        ],

        // ==================== 主要方法 ====================
        currentTab: 'dialogue',

        switchTab(tab) {
            this.currentTab = tab;
            this.renderInteractionPanel(this.worldId, this.mainChars);
        },

        selectDialogue(type) {
            this.currentSelections.dialogue = this.getRandomFromArray(this.dialogues[type]);
            this.updateChoices();
        },

        selectItemCategory(category) {
            const items = this.getRandomItems(category, 5);
            this.currentSelections.items = items;
            this.updateChoices();
        },

        selectBodyPart(part) {
            this.currentSelections.bodyPart = part;
            this.updateChoices();
        },

        selectPose(pose) {
            this.currentSelections.pose = pose;
            this.updateChoices();
        },

        selectLocation(location) {
            this.currentSelections.location = location;
            this.updateChoices();
        },

        selectStyle(style) {
            this.currentSelections.style = style;
            this.updateChoices();
        },

        selectAction(action) {
            this.currentSelections.action = action;
            this.updateChoices();
        },

        selectKeyword(play, desc) {
            this.currentSelections.keyword = { play, desc };
            this.updateChoices();
        },

        selectTheme(theme, desc) {
            this.currentSelections.theme = { theme, desc };
            this.updateChoices();
        },

        selectCombo(name, items, desc) {
            this.currentSelections.combo = { name, items, desc };
            this.updateChoices();
        },

        selectPreset(name, style, actions, desc) {
            this.currentSelections.preset = { name, style, actions, desc };
            this.updateChoices();
        },

        searchKeywords(query) {
            if (!query) {
                document.getElementById('keywordCategories').style.display = 'block';
                return;
            }

            const plays = this.playStyles || [];
            const results = plays.filter(p => 
                p.word.includes(query) || 
                p.play.includes(query) || 
                p.desc.includes(query)
            ).slice(0, 20);

            const container = document.getElementById('keywordCategories');
            if (!container) return;

            let html = '<div class="search-results">';
            html += `<h5>搜索结果 (${results.length})</h5>`;
            html += '<div class="keyword-list">';
            for (const item of results) {
                html += `<button class="keyword-btn" onclick="HentaiSystemV2.selectKeyword('${item.play}', '${item.desc}')" title="${item.desc}">${item.word}</button>`;
            }
            html += '</div></div>';
            container.innerHTML = html;
        },

        updateChoices() {
            const container = document.getElementById('hentaiChoices');
            if (!container) return;

            container.innerHTML = this._generateChoicesHTML();
        },

        _generateChoicesHTML() {
            const s = this.currentSelections;
            if (Object.keys(s).length === 0) {
                return '<p class="hentai-hint">请从上方选择选项，或直接输入描述</p>';
            }

            let html = '<div class="selected-items">';
            html += '<h4>已选择:</h4>';

            if (s.dialogue) html += `<span class="sel-tag">💬 ${s.dialogue}</span>`;
            if (s.items) html += `<span class="sel-tag">🎁 ${s.items.map(i => i.name).join(', ')}</span>`;
            if (s.bodyPart) html += `<span class="sel-tag">💅 ${s.bodyPart}</span>`;
            if (s.pose) html += `<span class="sel-tag">🧘 ${s.pose}</span>`;
            if (s.location) html += `<span class="sel-tag">📍 ${s.location}</span>`;
            if (s.style) html += `<span class="sel-tag">🎭 ${s.style}</span>`;
            if (s.action) html += `<span class="sel-tag">👋 ${s.action}</span>`;
            if (s.keyword) html += `<span class="sel-tag">🔑 ${s.keyword.play}</span>`;
            if (s.theme) html += `<span class="sel-tag">🎨 ${s.theme.theme}</span>`;
            if (s.combo) html += `<span class="sel-tag">🔄 ${s.combo.name}</span>`;
            if (s.preset) html += `<span class="sel-tag">📋 ${s.preset.name}</span>`;

            html += '</div>';
            html += '<button class="hentai-submit-btn" onclick="HentaiSystemV2.generateScene()">开始互动</button>';

            return html;
        },

        submitFree() {
            const input = document.getElementById('hentaiFreeDesc');
            if (input && input.value.trim()) {
                this.currentSelections.freeInput = input.value.trim();
                this.generateScene();
            }
        },

        // ==================== 生成场景 ====================

        async generateScene() {
            const worldId = localStorage.getItem('currentWorldId');
            const s = this.settings;
            const sel = this.currentSelections;

            if (!s.enabled) {
                alert('成人内容已禁用');
                return;
            }

            const participants = window.currentHentaiCharacters || [];
            if (participants.length === 0) {
                alert('请先选择参与互动的角色');
                return;
            }

            // 保存玩法到世界数据中
            this._saveHentaiPlay(worldId, sel, participants);
            
            // 显示保存成功提示
            if (window.showNotification) {
                window.showNotification('玩法保存成功，将在后续剧情中融入', 'success');
            } else {
                alert('玩法保存成功，将在后续剧情中融入');
            }
            
            // 关闭模态框
            if (window.closeModal) {
                window.closeModal();
            }
        },

        _saveHentaiPlay(worldId, selections, participants) {
            const world = DataManager.getWorld(worldId);
            if (!world) return;
            
            const hentaiPlay = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                selections: selections,
                participants: participants.map(p => p.id),
                status: 'active'
            };
            
            world.hentaiPlays = world.hentaiPlays || [];
            world.hentaiPlays.unshift(hentaiPlay);
            
            // 只保留最近5个玩法
            if (world.hentaiPlays.length > 5) {
                world.hentaiPlays = world.hentaiPlays.slice(0, 5);
            }
            
            DataManager.saveWorld(world);
        },

        _buildPrompt(participants, selections, intensity) {
            const pNames = participants.map(p => p.name).join('、');
            
            let prompt = `你是一个专业的情色小说作家。请根据以下设定创作一段引人入胜的亲密互动场景。\n\n`;
            prompt += `【参与者】${pNames}\n`;
            prompt += `【激烈程度】${intensity}%\n\n`;

            if (selections.freeInput) {
                prompt += `【用户自定义描述】${selections.freeInput}\n\n`;
            }

            if (selections.dialogue) {
                prompt += `【对话风格】:${selections.dialogue}\n`;
            }

            if (selections.items && selections.items.length > 0) {
                prompt += `【使用道具】:${selections.items.map(i => `${i.name}(${i.erotic})`).join(', ')}\n`;
            }

            if (selections.bodyPart) {
                prompt += `【接触部位】:${selections.bodyPart}\n`;
            }

            if (selections.pose) {
                prompt += `【性爱姿势】:${selections.pose}\n`;
            }

            if (selections.location) {
                prompt += `【场景地点】:${selections.location}\n`;
            }

            if (selections.style) {
                prompt += `【性爱风格】:${selections.style}\n`;
            }

            if (selections.action) {
                prompt += `【具体动作】:${selections.action}\n`;
            }

            if (selections.keyword) {
                prompt += `【指定玩法】:${selections.keyword.play}\n`;
                prompt += `【玩法描述】:${selections.keyword.desc}\n`;
            }

            if (selections.theme) {
                prompt += `【主题风格】:${selections.theme.theme}\n`;
                prompt += `【主题描述】:${selections.theme.desc}\n`;
            }

            if (selections.combo) {
                prompt += `【道具组合】:${selections.combo.name}\n`;
                prompt += `【组合道具】:${selections.combo.items}\n`;
                prompt += `【组合描述】:${selections.combo.desc}\n`;
            }

            if (selections.preset) {
                prompt += `【场景预设】:${selections.preset.name}\n`;
                prompt += `【预设风格】:${selections.preset.style}\n`;
                prompt += `【预设动作】:${selections.preset.actions}\n`;
                prompt += `【预设描述】:${selections.preset.desc}\n`;
            }

            const wordCount = this._getWordCount(intensity);
            
            prompt += `\n【写作要求】\n`;
            prompt += `1. 用细腻唯美的文字描写身体接触和情感交流\n`;
            prompt += `2. 通过对话、动作、心理描写营造暧昧氛围\n`;
            prompt += `3. ${this._getIntensityDescription(intensity)}\n`;
            prompt += `4. 适当运用比喻、暗示、联想等文学手法\n`;
            prompt += `5. 保持文学性和美感，避免粗俗直白\n`;
            prompt += `6. 字数要求: ${wordCount}\n`;
            prompt += `7. 结尾留有余韵，可以是继续发展或温馨收尾\n`;
            prompt += this._buildStylePrompt(intensity);

            return prompt;
        },

        _getWordCount(intensity) {
            if (intensity < 20) return 300;
            if (intensity < 40) return 500;
            if (intensity < 60) return 800;
            if (intensity < 80) return 1200;
            return 2000;
        },

        _getIntensityDescription(intensity) {
            const style = this.outputStyle;
            
            if (intensity < 20) {
                return `【日常描写】${style.identities.daily}。以调情、暧昧、轻抚为主，含蓄委婉，点到为止`;
            }
            if (intensity < 40) {
                return `【感官描写】${style.identities.erotic}。有亲密接触和爱抚，适度描写身体接触，但不过于露骨`;
            }
            if (intensity < 60) {
                return `【叙事描写】${style.identities.narrative}。激情描写为主，有详细的身体接触、感官体验和情感交流`;
            }
            if (intensity < 80) {
                return `【详细描写】${style.identities.creator}。深入详细的亲密描写，使用直接世俗的语言（${style.vocabulary.bodyParts.slice(0,5).join('、')}等），展现各种姿势和技巧`;
            }
            return `【极限描写】${style.identities.creator}。最详细最直接的描写，包括所有感官体验（视觉${style.senses.visual[0]}、听觉${style.senses.auditory[0]}、触觉${style.senses.tactile[0]}等），使用直接词汇`;
        },

        _buildStylePrompt(intensity) {
            const style = this.outputStyle;
            let prompt = '\n【写作风格指导】\n';
            
            prompt += `身份定位: ${style.identities.creator}\n`;
            
            if (intensity >= 60) {
                prompt += `- 使用直接词汇: ${style.vocabulary.bodyParts.slice(0, 8).join('、')}\n`;
                prompt += `- 体液描写: ${style.vocabulary.fluids.join('、')}\n`;
                prompt += `- 动作词汇: ${style.vocabulary.actions.slice(0, 6).join('、')}\n`;
            }
            
            if (intensity >= 40) {
                prompt += `- 感官描写:\n`;
                prompt += `  视觉: ${style.senses.visual.join('、')}\n`;
                prompt += `  听觉: ${style.senses.auditory.join('、')}\n`;
                prompt += `  触觉: ${style.senses.tactile.join('、')}\n`;
                if (intensity >= 70) {
                    prompt += `  嗅觉: ${style.senses.olfactory.join('、')}\n`;
                    prompt += `  味觉: ${style.senses.gustatory.join('、')}\n`;
                }
            }
            
            if (intensity >= 50) {
                prompt += `- 身体反应: ${style.bodyReactions.genitals.join('、')}、${style.bodyReactions.muscles.join('、')}\n`;
                prompt += `- 情感表达: ${style.emotions.join('、')}\n`;
            }
            
            if (intensity >= 70) {
                prompt += `- 动作创新: ${style.innovativeActions.insertion.join('、')}\n`;
                prompt += `- 对话风格: 直接放荡(${style.dialogue.explicit.slice(0,4).join('、')})、主导(${style.dialogue.dominant.slice(0,4).join('、')})\n`;
            }
            
            prompt += `- 节奏: ${style.rhythm.join(' → ')}\n`;
            prompt += `- 对比: ${style.contrasts.join('、')}\n`;
            
            return prompt;
        },

        _onSceneGenerated(content, worldId) {
            this.history.push({
                content: content.substring(0, 200),
                selections: {...this.currentSelections},
                timestamp: Date.now()
            });

            if (this.history.length > 100) {
                this.history = this.history.slice(-100);
            }

            this._saveHistory(worldId);

            if (window.HentaiSceneCallback) {
                window.HentaiSceneCallback(content);
            }
        },

        // ==================== 随机生成（用户点击随机按钮） ====================

        async generateRandom(worldId, characters) {
            this.init(worldId);
            const s = this.settings;

            if (!s.enabled) return null;

            const sel = {
                dialogue: this.getRandomFromArray(Object.values(this.dialogues).flat()),
                items: this.getRandomItems('foods', Math.ceil(s.intensity / 30)),
                bodyPart: this.getRandomFromArray(Object.values(this.bodyParts).flat()),
                pose: this.getRandomFromArray(Object.values(this.poses).flat()),
                location: this.getRandomFromArray(Object.values(this.locations).flat()),
                style: this.getRandomFromArray(Object.values(this.styles).flat()),
                action: this.getRandomFromArray(Object.values(this.actions).flat()),
                keyword: this.playStyles ? {
                    play: this.getRandomFromArray(this.playStyles)?.play || '',
                    desc: this.getRandomFromArray(this.playStyles)?.desc || ''
                } : null
            };

            this.currentSelections = sel;
            return await this.generateScene();
        },

        // ==================== 设置界面增强 ====================

        renderEnhancedSettingsPanel(worldId) {
            this.init(worldId);
            const s = this.settings;

            return `
                <div class="hentai-settings-v2">
                    <div class="setting-section">
                        <h4>
                            📊 基础设置
                            <button class="toggle-btn" onclick="var p=this.parentElement.parentElement;p.classList.toggle('collapsed');this.textContent=p.classList.contains('collapsed')?'展开':'收起'">收起</button>
                        </h4>
                        <div class="setting-content">
                            <div class="setting-row">
                                <label>启用成人内容</label>
                                <input type="checkbox" ${s.enabled ? 'checked' : ''} 
                                    onchange="HentaiSystemV2.toggleEnabled('${worldId}', this.checked)">
                            </div>
                            <div class="setting-row">
                                <label>激烈程度: ${s.intensity}%</label>
                                <input type="range" min="0" max="100" value="${s.intensity}"
                                    onchange="HentaiSystemV2.updateIntensity('${worldId}', this.value)">
                            </div>
                            <div class="setting-row">
                                <label>多样性: ${s.variety}%</label>
                                <input type="range" min="0" max="100" value="${s.variety}"
                                    onchange="HentaiSystemV2.updateVariety('${worldId}', this.value)">
                            </div>
                        </div>
                    </div>

                    <div class="setting-section">
                        <h4>
                            🎯 内容选项
                            <button class="toggle-btn" onclick="var p=this.parentElement.parentElement;p.classList.toggle('collapsed');this.textContent=p.classList.contains('collapsed')?'展开':'收起'">收起</button>
                        </h4>
                        <div class="setting-content">
                            ${this._renderSceneOption('dialogue', '💬 对话调情', worldId)}
                            ${this._renderSceneOption('道具', '🎁 道具互动', worldId)}
                            ${this._renderSceneOption('action', '👋 动作描写', worldId)}
                            ${this._renderSceneOption('body', '💅 身体接触', worldId)}
                            ${this._renderSceneOption('pose', '🧘 姿势体位', worldId)}
                            ${this._renderSceneOption('location', '📍 场景选择', worldId)}
                            ${this._renderSceneOption('style', '🎭 性爱风格', worldId)}
                        </div>
                    </div>

                    <div class="setting-section warning">
                        <h4>
                            ⚠️ 高级选项
                            <button class="toggle-btn" onclick="var p=this.parentElement.parentElement;p.classList.toggle('collapsed');this.textContent=p.classList.contains('collapsed')?'展开':'收起'">收起</button>
                        </h4>
                        <div class="setting-content">
                            ${this._renderSceneOption('extreme', '🔥 重口内容', worldId)}
                            ${this._renderSceneOption('weird', '💀 猎奇内容', worldId)}
                        </div>
                    </div>

                    <div class="setting-section">
                        <h4>
                            🧹 历史记录
                            <button class="toggle-btn" onclick="var p=this.parentElement.parentElement;p.classList.toggle('collapsed');this.textContent=p.classList.contains('collapsed')?'展开':'收起'">收起</button>
                        </h4>
                        <div class="setting-content">
                            <button class="btn btn-secondary" onclick="HentaiSystemV2.clearHistory('${worldId}')">
                                清空历史记录
                            </button>
                            <p class="setting-hint">已记录 ${this.usedCombinations.length} 个组合</p>
                        </div>
                    </div>
                </div>
            `;
        },

        _renderSceneOption(key, label, worldId) {
            const checked = this.settings?.scenes?.[key] ?? true;
            return `
                <div class="setting-row">
                    <label>${label}</label>
                    <input type="checkbox" ${checked ? 'checked' : ''}
                        onchange="HentaiSystemV2.toggleScene('${worldId}', '${key}', this.checked)">
                </div>
            `;
        },

        toggleEnabled(worldId, enabled) {
            this.settings.enabled = enabled;
            this._saveSettings(worldId);
        },

        updateIntensity(worldId, value) {
            this.settings.intensity = parseInt(value);
            this._saveSettings(worldId);
        },

        updateVariety(worldId, value) {
            this.settings.variety = parseInt(value);
            this._saveSettings(worldId);
        },

        toggleScene(worldId, key, value) {
            this.settings.scenes = this.settings.scenes || {};
            this.settings.scenes[key] = value;
            this._saveSettings(worldId);
        },

        _saveSettings(worldId) {
            DataManager.saveHentaiSettings(worldId, this.settings);
        },

        clearHistory(worldId) {
            if (confirm('确定清空所有历史记录吗？这会重置避免重复的系统。')) {
                this.history = [];
                this.usedCombinations = [];
                this._saveHistory(worldId);
                alert('历史记录已清空');
            }
        },

        // ==================== 辅助方法 ====================
        
        getRandomFromArray(array) {
            if (!array || array.length === 0) return null;
            return array[Math.floor(Math.random() * array.length)];
        },

        getRandomItems(category, count) {
            const pool = this.itemPools[category];
            if (!pool || pool.length === 0) return [];
            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        },

        renderInteractionPanel(worldId, mainChars) {
            this.worldId = worldId;
            this.mainChars = mainChars;
            this.init(worldId);

            let html = `
                <div class="hentai-interaction-panel">
                    <div class="hentai-tabs">
                        <button class="hentai-tab ${this.currentTab === 'dialogue' ? 'active' : ''}" onclick="HentaiSystemV2.switchTab('dialogue')">💬 对话</button>
                        <button class="hentai-tab ${this.currentTab === 'item' ? 'active' : ''}" onclick="HentaiSystemV2.switchTab('item')">🎁 道具</button>
                        <button class="hentai-tab ${this.currentTab === 'action' ? 'active' : ''}" onclick="HentaiSystemV2.switchTab('action')">👋 行动</button>
                        <button class="hentai-tab ${this.currentTab === 'body' ? 'active' : ''}" onclick="HentaiSystemV2.switchTab('body')">💅 部位</button>
                        <button class="hentai-tab ${this.currentTab === 'pose' ? 'active' : ''}" onclick="HentaiSystemV2.switchTab('pose')">🧷 姿势</button>
                        <button class="hentai-tab ${this.currentTab === 'location' ? 'active' : ''}" onclick="HentaiSystemV2.switchTab('location')">📍 场景</button>
                        <button class="hentai-tab ${this.currentTab === 'style' ? 'active' : ''}" onclick="HentaiSystemV2.switchTab('style')">🎭 风格</button>
                        <button class="hentai-tab ${this.currentTab === 'keyword' ? 'active' : ''}" onclick="HentaiSystemV2.switchTab('keyword')">🔑 玩法</button>
                        <button class="hentai-tab ${this.currentTab === 'free' ? 'active' : ''}" onclick="HentaiSystemV2.switchTab('free')">✏️ 自由</button>
                    </div>
                    <div class="hentai-tab-content">
            `;

            switch (this.currentTab) {
                case 'dialogue':
                    html += this._renderDialogueTab();
                    break;
                case 'item':
                    html += this._renderItemTab();
                    break;
                case 'action':
                    html += this._renderActionTab();
                    break;
                case 'body':
                    html += this._renderBodyTab();
                    break;
                case 'pose':
                    html += this._renderPoseTab();
                    break;
                case 'location':
                    html += this._renderLocationTab();
                    break;
                case 'style':
                    html += this._renderStyleTab();
                    break;
                case 'keyword':
                    html += this._renderKeywordTab();
                    break;
                case 'free':
                    html += this._renderFreeTab();
                    break;
            }

            html += `
                    </div>
                    <div id="hentaiChoices" class="hentai-choices">
                        ${this._generateChoicesHTML()}
                    </div>
                </div>
            `;

            return html;
        },

        _renderDialogueTab() {
            let html = '<div class="hentai-option-group">';
            html += '<h4>选择对话类型</h4>';
            html += '<div class="dialogue-options">';
            
            for (const [type, dialogues] of Object.entries(this.dialogues)) {
                html += `
                    <button class="hentai-option-btn" onclick="HentaiSystemV2.selectDialogue('${type}')">
                        ${type}
                    </button>
                `;
            }
            
            html += '</div></div>';
            return html;
        },

        _renderItemTab() {
            let html = '<div class="hentai-option-group">';
            html += '<h4>选择道具类别</h4>';
            html += '<div class="item-categories">';
            
            for (const [category, items] of Object.entries(this.itemPools)) {
                html += `
                    <button class="hentai-category-btn" onclick="HentaiSystemV2.selectItemCategory('${category}')">
                        ${category} (${items.length})
                    </button>
                `;
            }
            
            html += '</div></div>';
            return html;
        },

        _renderBodyTab() {
            let html = '<div class="hentai-option-group">';
            html += '<h4>选择身体部位</h4>';
            html += '<div class="body-parts">';
            
            for (const [category, parts] of Object.entries(this.bodyParts)) {
                html += `<div class="body-category"><h5>${category}</h5>`;
                html += '<div class="body-part-list">';
                for (const part of parts) {
                    html += `<button class="body-part-btn" onclick="HentaiSystemV2.selectBodyPart('${part}')">${part}</button>`;
                }
                html += '</div></div>';
            }
            
            html += '</div></div>';
            return html;
        },

        _renderPoseTab() {
            let html = '<div class="hentai-option-group">';
            html += '<h4>选择性爱姿势</h4>';
            html += '<div class="poses">';
            
            for (const [category, poses] of Object.entries(this.poses)) {
                html += `<div class="pose-category"><h5>${category}</h5>`;
                html += '<div class="pose-list">';
                for (const pose of poses) {
                    html += `<button class="pose-btn" onclick="HentaiSystemV2.selectPose('${pose}')">${pose}</button>`;
                }
                html += '</div></div>';
            }
            
            html += '</div></div>';
            return html;
        },

        _renderLocationTab() {
            let html = '<div class="hentai-option-group">';
            html += '<h4>选择场景地点</h4>';
            html += '<div class="locations">';
            
            for (const [category, locations] of Object.entries(this.locations)) {
                html += `<div class="location-category"><h5>${category}</h5>`;
                html += '<div class="location-list">';
                for (const location of locations) {
                    html += `<button class="location-btn" onclick="HentaiSystemV2.selectLocation('${location}')">${location}</button>`;
                }
                html += '</div></div>';
            }
            
            html += '</div></div>';
            return html;
        },

        _renderStyleTab() {
            let html = '<div class="hentai-option-group">';
            html += '<h4>选择性爱风格</h4>';
            html += '<div class="styles">';
            
            for (const [category, styles] of Object.entries(this.styles)) {
                html += `<div class="style-category"><h5>${category}</h5>`;
                html += '<div class="style-list">';
                for (const style of styles) {
                    html += `<button class="style-btn" onclick="HentaiSystemV2.selectStyle('${style}')">${style}</button>`;
                }
                html += '</div></div>';
            }
            
            html += '</div></div>';
            return html;
        },

        _renderKeywordTab() {
            const plays = this.playStyles || [];
            const categories = {};
            
            plays.forEach(p => {
                const cat = p.play.split(' ')[0] || '其他';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(p);
            });

            let html = '<div class="hentai-option-group">';
            html += '<h4>选择玩法关键词（来自玩法库）</h4>';
            html += '<div class="hentai-keyword-search">';
            html += '<input type="text" id="keywordSearch" placeholder="搜索玩法..." oninput="HentaiSystemV2.searchKeywords(this.value)" />';
            html += '</div>';
            html += '<div class="hentai-keyword-categories" id="keywordCategories">';

            for (const [cat, items] of Object.entries(categories)) {
                html += `<div class="keyword-category"><h5>${cat}</h5>`;
                html += '<div class="keyword-list">';
                for (const item of items.slice(0, 10)) {
                    html += `<button class="keyword-btn" onclick="HentaiSystemV2.selectKeyword('${item.play}', '${item.desc}')" title="${item.desc}">${item.word}</button>`;
                }
                html += '</div></div>';
            }
            
            html += '</div></div>';
            return html;
        },

        _renderActionTab() {
            let html = '<div class="hentai-option-group">';
            html += '<h4>选择动作</h4>';
            html += '<div class="hentai-actions">';
            
            for (const [type, actions] of Object.entries(this.actions)) {
                html += `<div class="action-category"><h5>${type}</h5>`;
                html += '<div class="action-list">';
                
                for (const action of actions) {
                    html += `<button class="action-btn" onclick="HentaiSystemV2.selectAction('${action}')">${action}</button>`;
                }
                
                html += '</div></div>';
            }
            
            html += '</div></div>';
            return html;
        },

        _renderFreeTab() {
            return `
                <div class="hentai-option-group">
                    <h4>自由描述</h4>
                    <textarea id="hentaiFreeDesc" placeholder="请输入详细的亲密互动描述..." rows="6"></textarea>
                    <button onclick="HentaiSystemV2.submitFree()">发送</button>
                </div>
            `;
        }
    };

    // =====================================================
    // 导出到全局
    // =====================================================

    window.HentaiSystemV2 = HentaiSystemV2;

})();