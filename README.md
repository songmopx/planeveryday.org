# 个人每日规划系统 (Personal Daily Planning System)

一个现代化的个人任务管理应用，支持每日任务和单日任务管理，具备完整的数据统计和跨设备同步功能。

## ✨ 主要功能

### 🔐 用户认证
- Google OAuth 登录
- 用户数据隔离
- 访客模式支持

### 📋 任务管理
- **每日任务**：可重复的日常任务
- **单日任务**：一次性任务
- **多维度支持**：次数、时间、简单完成
- **智能调度**：自动生成未来任务

### ☁️ 云端同步
- Firebase Firestore 云端存储
- 跨设备数据同步
- 智能数据合并
- 离线支持

### 📊 数据统计
- 完成趋势图表
- 任务分类统计
- 持续天数统计
- 详细数据分析

### 🌍 国际化
- 完整的中英文支持
- 动态语言切换
- 本地化日期格式

## 🚀 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **UI框架**：Tailwind CSS
- **图表库**：Chart.js
- **后端服务**：Firebase
  - Authentication (Google OAuth)
  - Firestore (数据库)
  - Hosting (部署)

## 🛠️ 开发环境设置

### 1. 克隆项目
```bash
git clone [your-repo-url]
cd personal-daily-planning
```

### 2. 启动本地服务器
```bash
# 使用 Python
python3 -m http.server 8080

# 或使用 Node.js
npx serve .
```

### 3. 访问应用
打开浏览器访问：`http://localhost:8080`

## 🔧 Firebase 配置

### 1. 创建 Firebase 项目
1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 创建新项目
3. 启用 Authentication 和 Firestore

### 2. 配置认证
1. 启用 Google 登录提供商
2. 添加授权域名

### 3. 配置 Firestore
1. 创建数据库
2. 部署安全规则：
```bash
firebase deploy --only firestore:rules
```

### 4. 更新配置
在 `index.html` 中更新 Firebase 配置：
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... 其他配置
};
```

## 📁 项目结构

```
personal-daily-planning/
├── index.html              # 主页面
├── script.js               # 核心逻辑
├── style.css               # 样式文件
├── firebase.json           # Firebase 配置
├── firestore.rules         # 数据库安全规则
├── firestore.indexes.json  # 数据库索引
└── README.md              # 项目文档
```

## 🚀 部署

### 使用 Firebase Hosting

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 登录 Firebase
firebase login

# 初始化项目
firebase init

# 部署
firebase deploy
```

### 使用其他平台
项目是纯静态应用，可以部署到：
- Vercel
- Netlify
- GitHub Pages
- 任何静态托管服务

## 📱 功能演示

### 数据同步逻辑
1. **访客模式**：数据存储在本地
2. **登录后**：本地数据 + 云端数据合并
3. **退出登录**：回到访客本地数据

### 任务类型
- **每日任务**：重复性任务，支持时间范围
- **单日任务**：一次性任务，指定完成日期

### 维度类型
- **次数维度**：可设置目标次数
- **时间维度**：可设置目标时长
- **简单完成**：简单的完成/未完成状态

## 🔒 安全特性

- 用户数据完全隔离
- 严格的 Firestore 安全规则
- 客户端数据验证
- HTTPS 强制加密

## 🌟 最佳实践

- 响应式设计，支持所有设备
- 渐进式 Web 应用特性
- 离线功能支持
- 性能优化

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请创建 Issue 或联系开发者。 