# PicX Android（Capacitor 套壳）

本 fork 在上游 PicX（Vue 3 + Vite 网页应用）的基础上，用
[Capacitor](https://capacitorjs.com/) 打包出 Android 应用，可在手机上
上传、管理、部署图床，与网页版功能一致。

- 应用包名：`io.github.ziyekaixuan.picx`
- 最低系统：Android 7.0（API 24）
- Web 应用版本与上游 PicX 版本一致（如 3.2.2）

## 构建

环境：Node.js 24、pnpm、JDK 17+、Android SDK（platform 36、build-tools 36）。

```bash
pnpm install
node scripts/generate-android-icons.mjs   # 从 public/logo@512x512.png 生成启动图标与闪屏
pnpm build:android                        # 以 capacitor 模式构建 Web 应用（相对路径、不含 PWA）
npx cap sync android                      # 同步 Web 资源到 Android 工程
cd android && ./gradlew :app:assembleRelease
```

首次克隆后需恢复 gradlew 可执行权限：`chmod +x android/gradlew`。

产物：`android/app/build/outputs/apk/release/app-release.apk`

## 签名

release 签名配置从 `android/keystore.properties` 读取（该文件不提交）：

```properties
storeFile=/path/to/picx-release.p12
storePassword=<store password>
keyAlias=picx
keyPassword=<same as store password>
```

注意：PKCS#12 密钥库不支持与 store 密码不同的 key 密码，
`keyPassword` 必须与 `storePassword` 相同。没有该文件时 release
构建会回退为 debug 签名。

创建新密钥库（请妥善保管，丢失后无法再用同一签名更新应用）：

```bash
keytool -genkeypair -storetype PKCS12 -keystore picx-release.p12 \
  -alias picx -keyalg RSA -keysize 4096 -validity 9125 \
  -dname "CN=PicX Android, OU=PicX, O=ziyekaixuan"
```

## 实现要点

- `capacitor.config.ts`：`appId`、`appName`、`webDir: 'dist'`。
- `.env.capacitor`：Capacitor 构建的环境变量，`VITE_USE_PWA=false`
  （应用壳内不使用 service worker）。
- `vite.config.ts`：capacitor 模式下 `base` 为 `./`（相对路径），
  否则仍为 `/images-hosting/`；网页版构建不受影响。
- `package.json`：新增 `build:android`、`sync:android` 脚本。
- `android/`：Capacitor 生成的原生工程，含 release 签名配置与
  build-tools 36 锁定；图标与闪屏 PNG 由
  `scripts/generate-android-icons.mjs` 生成，不提交。
- 路由使用 hash 模式，无需额外适配。

## 登录说明

应用内请使用 **Token 登录**（GitHub Personal Access Token）。
OAuth 登录的回调地址注册在官方站点（picx.xpoet.cn），在应用内
完成授权后会跳转到网站而不是回到应用，因此应用内无法使用。
