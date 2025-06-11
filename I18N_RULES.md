# 🌐 国际化开发规则 (Internationalization Rules)

## 📋 基本原则

### 🚫 禁止事项
1. **绝对禁止**在代码中直接写中文或英文字符串
2. **绝对禁止**硬编码任何用户可见的文本
3. **绝对禁止**在HTML模板中直接写文本内容
4. **绝对禁止**在动态生成的内容中使用固定语言

### ✅ 必须遵循
1. **必须**使用 `getText(key)` 函数获取所有文本
2. **必须**为新功能添加完整的中英文翻译
3. **必须**在 `translations` 对象中维护翻译键值
4. **必须**确保中英文翻译键值对一致

## 🛠 实施规则

### 1. 文本显示规则

#### ✅ 正确示例
```javascript
// 静态文本
element.textContent = getText('taskName');

// 动态文本组合
element.innerHTML = `${getText('total')}: ${count} ${getText('times')}`;

// 模态框标题
document.getElementById('modalTitle').textContent = getText('modal.addTask');

// 单位显示
unitLabel.textContent = getText('minutes');
```

#### ❌ 错误示例
```javascript
// 硬编码中文
element.textContent = '任务名称';

// 硬编码英文
element.innerHTML = `Total: ${count} times`;

// 混合语言
element.innerHTML = `${getText('total')}: ${count}次`;

// 直接赋值
unitLabel.textContent = '分钟';
```

### 2. HTML模板规则

#### ✅ 正确示例
```html
<!-- 使用 data-i18n 属性 -->
<button data-i18n="nav.home">Home</button>

<!-- 使用 data-i18n-placeholder 属性 -->
<input data-i18n-placeholder="home.quickAddPlaceholder" placeholder="Enter task name...">

<!-- 动态内容使用 getText() -->
<div id="dynamicContent"></div>
```

#### ❌ 错误示例
```html
<!-- 硬编码文本 -->
<button>首页</button>
<button>Home</button>

<!-- 硬编码placeholder -->
<input placeholder="输入任务名称...">
```

### 3. JavaScript动态内容规则

#### ✅ 正确示例
```javascript
// 条件文本
const statusText = isCompleted ? getText('completed') : getText('pending');

// 复杂模板
const template = `
    <div class="task-item">
        <h3>${task.name}</h3>
        <p>${getText('target')}: ${task.value} ${getText('times')}</p>
        <button onclick="complete()">${getText('complete')}</button>
    </div>
`;

// 通知消息
this.showNotification(getText('taskCompleted'), 'success');
```

#### ❌ 错误示例
```javascript
// 条件中的硬编码
const statusText = isCompleted ? '已完成' : 'Pending';

// 模板中的硬编码
const template = `
    <div class="task-item">
        <h3>${task.name}</h3>
        <p>目标: ${task.value}次</p>
        <button onclick="complete()">Complete</button>
    </div>
`;

// 通知中的硬编码
this.showNotification('任务已完成', 'success');
```

## 📚 翻译键值管理

### 1. 命名约定
- 使用**点号分隔**的层级结构：`nav.home`, `modal.title`
- 使用**驼峰命名**：`taskCompleted`, `addNewTask`
- 使用**语义化**命名：`confirmDelete` 而不是 `button1`

### 2. 分类组织
```javascript
const translations = {
    en: {
        // 导航相关
        "nav.title": "Personal Daily Planning",
        "nav.home": "Home",
        
        // 模态框相关
        "modal.addTask": "Add Task",
        "modal.cancel": "Cancel",
        
        // 操作相关
        "complete": "Complete",
        "delete": "Delete",
        
        // 单位相关
        "times": "times",
        "minutes": "minutes"
    },
    zh: {
        "nav.title": "个人每日规划",
        "nav.home": "首页",
        // ... 对应的中文翻译
    }
};
```

## 🔧 开发工具

### 1. 检查工具
在浏览器控制台中运行：
```javascript
// 检查翻译完整性
checkTranslationCompleteness();

// 检查硬编码文本
checkInternationalization();

// 运行所有检查
runAllI18nChecks();
```

### 2. 自动检查
- 本地开发时会自动运行国际化检查
- 控制台会显示检查结果和问题报告

## 🚀 新功能开发流程

### 1. 开发前准备
1. 确定功能涉及的所有文本内容
2. 在 `translations` 对象中添加翻译键值
3. 确保中英文完全对应

### 2. 开发中执行
1. 使用 `getText(key)` 获取所有文本
2. 动态内容统一使用国际化函数
3. 避免任何硬编码文本

### 3. 开发后检查
1. 运行 `runAllI18nChecks()` 检查
2. 测试中英文切换功能
3. 确认所有文本正确显示

## 📝 常见问题解决

### Q: 如何处理复杂的文本组合？
A: 分解为多个翻译键值，然后组合
```javascript
// 不要这样
getText('taskCompletedWithCount'); // "任务已完成 3 次"

// 这样做
`${getText('taskCompleted')} ${count} ${getText('times')}`
```

### Q: 如何处理包含HTML的文本？
A: 分离HTML结构和文本内容
```javascript
// 不要这样
innerHTML = getText('boldTaskName'); // "<strong>任务名称</strong>"

// 这样做
innerHTML = `<strong>${getText('taskName')}</strong>`;
```

### Q: 如何处理动态单位？
A: 使用 `getUnit()` 函数
```javascript
// 不要这样
const unit = task.dimension === 'time' ? '分钟' : '次';

// 这样做  
const unit = this.getUnit(task.dimension);
```

## ✅ 验收标准

新功能完成后必须满足：
1. ✅ 翻译完整性检查通过
2. ✅ 硬编码检查通过  
3. ✅ 中英文切换功能正常
4. ✅ 所有文本正确显示
5. ✅ 无语言混杂现象

遵循这些规则，确保系统的国际化质量！🎯 