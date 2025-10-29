# AssetScan 开发说明

## 1. 项目概览
- 项目基于 Ionic Vue、Vue 3 与 TypeScript 构建，目标平台为 Android（通过 Capacitor 容器部署）。
- 功能覆盖二维码扫描、serial number 设备检索、列表展示与编辑，以及 Excel(.xlsx) 文件的导入导出。
- 前端 UI 使用 Ionic 组件库与 Ionicons 图标；应用通过 Vite 构建、支持热更新与现代构建优化。
- 设备数据通过 `@capacitor-community/sqlite` 持久化存储，若初始化失败会弹出提示并阻止后续读写，避免静默丢数据。

## 2. 技术栈与外部依赖

### 2.1 核心框架
- `vue@^3.3`：组合式 API，配合 `<script setup>` 实现模块化视图逻辑。
- `@ionic/vue@^8` + `@ionic/vue-router@^8`：提供移动友好的 UI 组件、Ion Router 容器与导航守卫。
- `vue-router@^4.2`：定义页面路由（`src/router/index.ts`），与 Ionic RouterOutler 协同。

### 2.2 构建与工程工具
- `vite@^5`：打包与开发服务器，入口配置位于 `vite.config.ts`。
- `vue-tsc` + `typescript@~5.6`：SFC 类型检查与 TS 编译。
- `eslint`、`@vue/eslint-config-typescript`、`eslint-plugin-vue`：代码质量保障。
- `vitest`、`@vue/test-utils`：单元测试框架与 Vue 组件测试工具。
- `cypress`：E2E 测试。
- `@vitejs/plugin-vue`、`@vitejs/plugin-legacy`、`terser`：构建期间的 Vue 支持、旧浏览器兼容与压缩。

### 2.3 Capacitor 核心与插件
- `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`：Capacitor 容器及 Android 平台支持。
- `@capacitor/app`、`@capacitor/haptics`、`@capacitor/keyboard`、`@capacitor/status-bar`、`@capacitor/filesystem`：常用系统能力封装，文件系统插件用于 Excel 输出到原生存储。
- `@capacitor-community/sqlite`：提供原生 SQLite 读写能力，是设备数据的持久化后端；加载失败时会唤起系统对话框提示。
- `@capacitor/barcode-scanner`：官方 Capacitor 条码扫描插件，提供跨平台摄像头识别能力。

### 2.4 其他第三方库
- `ionicons@^7`：图标资源。
- `xlsx@^0.18`：读写 Excel 文件，配合 Capacitor Filesystem 原生保存。

## 3. 功能模块实现原理

### 3.1 启动流程与路由
- `src/main.ts` 创建 Vue 应用实例，引入 Ionic 核心样式与主题变量 (`src/theme/variables.css`)，挂载 `App.vue`。
- `App.vue` 提供 `IonApp` 容器，`<ion-router-outlet />` 用于渲染各路由页面。
- `src/router/index.ts` 定义主要导航路径：主页、扫码、设备列表、设备编辑、导入导出等。

### 3.2 二维码扫描（`src/views/ScanPage.vue`）
- 页面挂载时调用 `ensureScannerPermission()` 申请摄像头权限，并在受限时给出提示。
- “开始扫码”按钮通过 `startQrScan()` 调用官方条码扫描插件，仅识别二维码格式，成功后带着序列号跳转至列表页面。
- `stopScanner()` 用于结束扫码会话并恢复界面状态，确保相机资源及时释放。

### 3.3 设备数据管理（`src/services/deviceService.ts`）
- 初始化阶段连接 SQLite，自动创建 `devices` 表与索引并落地种子数据；若连接失败会弹出告警对话框并让调用方感知错误。
- 服务对外暴露异步 API：`listBySerial`、`getById`、`save`、`replaceAll`、`mergeBySerial`、`exportAll` 与 `ready`，内部维护响应式缓存 `devicesRef` 供组件消费。
- `save` 与 `mergeBySerial` 借助 `INSERT ... ON CONFLICT` 实现基于 `id` 或 `serialNumber` 的 UPSERT；所有写操作统一更新时间戳，便于导出比对。

### 3.4 设备列表页面（`src/views/DeviceListPage.vue`）
- 读取路由查询参数中的 `serial` 作为初始筛选条件，支持实时搜索与下拉刷新。
- 使用多语言文本（中英文）展示设备详情，结合状态枚举计算颜色与标签。
- “查询”按钮显式刷新；点击设备项跳转到编辑页面；“导入 / 导出”按钮跳转对应页面。

### 3.5 设备编辑页面（`src/views/EditDevicePage.vue`）
- 根据路由参数获取目标设备，加载失败时返回“未找到”状态。
- 表单包含名称、型号、状态、位置、备注等字段；保存提交后通过 `deviceService.save` 更新记录，展示成功提示并回到列表。
- 利用 Ionic 表单组件和 `IonToast` 提示状态。

### 3.6 Excel 导入导出（`src/views/ImportExportPage.vue` + `src/services/excelService.ts`）
- 导出：`exportDevicesToExcel` 使用 `xlsx` 将设备 JSON 转换为工作簿。Web 端通过 Blob + a 标签触发下载；原生端写入 `Directory.Documents`（需 Filesystem 插件支持）。
- 导入：文件选择后 `importDevicesFromExcel` 解析首个工作表，按行构建 `DeviceRecord`，并通过 `mergeBySerial` 合并到当前数据集中（serial number 相同则覆盖）。
- Excel 行字段默认回填名称与时间戳，`normalizeStatus` 保证状态值合法。

### 3.7 首页导航（`src/views/HomePage.vue`）
- 提供三项快捷入口（扫码、设备列表、导入导出），使用 `ion-card` 与图标增强引导。

## 4. 数据流与状态管理
- 组件通过 `deviceService` 提供的响应式缓存及异步方法共享数据，无需额外状态管理库。
- 所有跨页面筛选依旧使用路由查询参数（serial number），配合 SQLite 查询实现高效过滤。
- Excel 导入后调用 `mergeBySerial`，批量 UPSERT 并刷新缓存，确保 serial number 唯一。

## 5. 平台与原生集成注意事项
- 安装或升级 Capacitor 插件（Filesystem、SQLite 等）后执行 `npx cap sync android` 同步原生项目；首次建议运行 `npx cap open android` 检查权限与 Gradle 配置。
- 扫码流程依赖官方条码扫描插件，需要在 `AndroidManifest.xml` 中声明 `android.permission.CAMERA`；如在 Android 上首次调用时需下载条码识别组件，请提前确保网络可用或预装对应依赖。
- SQLite 持久化依赖 `@capacitor-community/sqlite`，请确认原生工程已集成插件并授予必要权限；若初始化失败应用会以系统弹窗提示并中断数据操作。
- Excel 导出目录位于 Android 的 Documents；若需与系统共享文件，可结合 Storage Access Framework 或媒体库权限。

## 6. 构建、调试与测试命令
- `npm install`：安装依赖。
- `npm run dev`：启动 Vite 开发服务器（默认 `http://localhost:5173`），支持 HMR。
- `npm run build`：执行类型检查与生产构建，产物输出至 `dist/`。
- `npm run preview`：本地预览生产构建。
- `npm run lint`：运行 ESLint。
- `npm run test:unit` / `npm run test:e2e`：分别执行 Vitest 单测与 Cypress 端到端测试。
- Android 同步：`npm run build` 后运行 `npx cap sync android`，必要时 `npx cap open android`。

## 7. Android 打包编译流程
1. 安装依赖并构建前端资源：`npm install && npm run build`。
2. 同步 Capacitor 原生工程：`npx cap sync android`，确保 Filesystem 等必需插件注册无误。
3. 打开 Android Studio：执行 `npx cap open android`，等待 Gradle Sync 完成。
4. 在 Android Studio 中选择构建变体（`Build > Select Build Variant...`），通常使用 `release`。
5. 配置签名信息：
   - 通过 `Build > Generate Signed Bundle / APK...` 创建或选择 keystore，并填写 `Key alias`、密码等。
   - 或在 `android/app/build.gradle` 中添加 `signingConfigs`，再在 `buildTypes` 中引用。
6. 生成产物：
   - Android Studio：`Build > Generate Signed Bundle / APK...`，按照向导生成 `.aab` 或 `.apk`。
   - 命令行：`cd android && ./gradlew assembleRelease`（APK）或 `./gradlew bundleRelease`（AAB）。
7. 产物位置：
   - APK：`android/app/build/outputs/apk/release/app-release.apk`
   - AAB：`android/app/build/outputs/bundle/release/app-release.aab`
8. 可选验证：
   - 使用 `adb install android/app/build/outputs/apk/release/app-release.apk` 进行真机安装。
   - 通过 Play Console 上传 `.aab`，并在发布前检查是否需要 ProGuard keep 规则以兼容 Capacitor 插件。

## 8. TODO
- 评估在 Web 环境使用 `jeep-sqlite` 实现一致的数据库行为，或显式禁用浏览器端数据编辑。
- 增加扫码历史、批量处理或离线模式，并结合 Capacitor Background Task。
- 为 Excel 导入添加数据校验与错误行提示，提升易用性。
- 编写覆盖核心场景的单元测试与 E2E 用例（扫码流程可通过 mock 服务在单测阶段验证）。
