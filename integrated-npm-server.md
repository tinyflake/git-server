# 集成 NPM 私服到 Git 服务器

## 方案概述

将 NPM 私服功能直接集成到你现有的 Git 服务器中，实现统一管理。

## 实现方案

### 1. 添加 NPM 服务模块

```javascript
// backend/services/npm-registry.js
const express = require('express')
const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')
const semver = require('semver')

class NPMRegistry {
  constructor(options = {}) {
    this.storageDir = options.storageDir || './npm-storage'
    this.baseUrl = options.baseUrl || 'http://localhost:3000'
    this.init()
  }

  init() {
    // 确保存储目录存在
    fs.ensureDirSync(this.storageDir)
    fs.ensureDirSync(path.join(this.storageDir, 'packages'))
  }

  // 发布包
  async publishPackage(packageData, tarballBuffer, user) {
    const { name, version } = packageData
    const packageDir = path.join(this.storageDir, 'packages', name)
    
    fs.ensureDirSync(packageDir)
    
    // 保存 tarball
    const tarballPath = path.join(packageDir, `${name}-${version}.tgz`)
    fs.writeFileSync(tarballPath, tarballBuffer)
    
    // 更新包元数据
    const metadataPath = path.join(packageDir, 'package.json')
    let metadata = {}
    
    if (fs.existsSync(metadataPath)) {
      metadata = fs.readJsonSync(metadataPath)
    }
    
    if (!metadata.versions) metadata.versions = {}
    if (!metadata['dist-tags']) metadata['dist-tags'] = {}
    
    // 添加版本信息
    metadata.versions[version] = {
      ...packageData,
      dist: {
        shasum: crypto.createHash('sha1').update(tarballBuffer).digest('hex'),
        tarball: `${this.baseUrl}/npm/${name}/-/${name}-${version}.tgz`
      },
      _npmUser: user,
      _publishedAt: new Date().toISOString()
    }
    
    // 更新 latest 标签
    metadata['dist-tags'].latest = version
    metadata.name = name
    metadata.description = packageData.description
    
    fs.writeJsonSync(metadataPath, metadata, { spaces: 2 })
    
    return metadata
  }

  // 获取包信息
  async getPackage(name) {
    const packageDir = path.join(this.storageDir, 'packages', name)
    const metadataPath = path.join(packageDir, 'package.json')
    
    if (!fs.existsSync(metadataPath)) {
      return null
    }
    
    return fs.readJsonSync(metadataPath)
  }

  // 获取包列表
  async getPackageList() {
    const packagesDir = path.join(this.storageDir, 'packages')
    
    if (!fs.existsSync(packagesDir)) {
      return []
    }
    
    const packages = []
    const dirs = fs.readdirSync(packagesDir)
    
    for (const dir of dirs) {
      const metadataPath = path.join(packagesDir, dir, 'package.json')
      if (fs.existsSync(metadataPath)) {
        const metadata = fs.readJsonSync(metadataPath)
        packages.push({
          name: metadata.name,
          description: metadata.description,
          'dist-tags': metadata['dist-tags'],
          versions: Object.keys(metadata.versions || {}),
          modified: metadata._publishedAt
        })
      }
    }
    
    return packages
  }
}

module.exports = NPMRegistry
```

### 2. 添加 NPM API 路由

```javascript
// backend/routes/npm-routes.js
const express = require('express')
const router = express.Router()
const multer = require('multer')
const NPMRegistry = require('../services/npm-registry')
const { authenticateJWT, requireAdmin } = require('../utils/jwt-utils')
const { logOperation } = require('../utils/operation-logger')

const upload = multer({ storage: multer.memoryStorage() })
const npmRegistry = new NPMRegistry({
  storageDir: './npm-storage',
  baseUrl: process.env.SERVER_URL || 'http://localhost:3000'
})

// NPM 包发布
router.put('/:packageName', authenticateJWT, requireAdmin, upload.single('attachment'), async (req, res) => {
  try {
    const { packageName } = req.params
    const packageData = JSON.parse(req.body.package || '{}')
    const tarballBuffer = req.file?.buffer
    
    if (!tarballBuffer) {
      return res.status(400).json({ error: 'Missing package tarball' })
    }
    
    const result = await npmRegistry.publishPackage(
      packageData, 
      tarballBuffer, 
      req.user.username
    )
    
    // 记录操作日志
    logOperation(
      req.user.username,
      'npm_publish',
      packageName,
      `发布版本 ${packageData.version}`
    )
    
    res.json({ success: true, package: result })
  } catch (error) {
    console.error('NPM 发布失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取包信息
router.get('/:packageName', async (req, res) => {
  try {
    const { packageName } = req.params
    const packageInfo = await npmRegistry.getPackage(packageName)
    
    if (!packageInfo) {
      return res.status(404).json({ error: 'Package not found' })
    }
    
    res.json(packageInfo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 下载包
router.get('/:packageName/-/:filename', async (req, res) => {
  try {
    const { packageName, filename } = req.params
    const filePath = path.join(npmRegistry.storageDir, 'packages', packageName, filename)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }
    
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取包列表（管理界面用）
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const packages = await npmRegistry.getPackageList()
    res.json({ packages })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除包
router.delete('/:packageName', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { packageName } = req.params
    const packageDir = path.join(npmRegistry.storageDir, 'packages', packageName)
    
    if (fs.existsSync(packageDir)) {
      fs.removeSync(packageDir)
      
      logOperation(
        req.user.username,
        'npm_unpublish',
        packageName,
        '删除包'
      )
      
      res.json({ success: true })
    } else {
      res.status(404).json({ error: 'Package not found' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
```

### 3. 集成到主应用

```javascript
// backend/app.js 中添加
const npmRoutes = require('./routes/npm-routes')

// NPM 私服路由
app.use('/npm', npmRoutes)
```

### 4. 前端管理界面

```vue
<!-- frontend/src/views/NPMRegistry.vue -->
<template>
  <div class="npm-registry">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>NPM 私服管理</span>
          <el-button type="primary" @click="showPublishDialog = true">
            发布组件
          </el-button>
        </div>
      </template>
      
      <el-table :data="packages" style="width: 100%">
        <el-table-column prop="name" label="包名" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="dist-tags.latest" label="最新版本" />
        <el-table-column prop="modified" label="更新时间" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" @click="viewPackage(row)">查看</el-button>
            <el-button size="small" type="danger" @click="deletePackage(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 发布对话框 -->
    <PublishDialog v-model="showPublishDialog" @success="loadPackages" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { npmApi } from '@/api/npm'

const packages = ref([])
const showPublishDialog = ref(false)

const loadPackages = async () => {
  try {
    const response = await npmApi.getPackages()
    packages.value = response.data.packages
  } catch (error) {
    ElMessage.error('加载包列表失败')
  }
}

const deletePackage = async (pkg) => {
  try {
    await npmApi.deletePackage(pkg.name)
    ElMessage.success('删除成功')
    loadPackages()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadPackages()
})
</script>
```

### 5. 使用方式

```bash
# 配置客户端使用你的私服
npm config set registry http://your-server:3000/npm

# 发布组件
npm publish

# 安装组件
npm install @yourcompany/your-component
```

## 优势

✅ **统一管理** - Git 和 NPM 在同一个系统中  
✅ **权限统一** - 使用相同的用户权限体系  
✅ **部署简单** - 只需要一个服务  
✅ **定制化** - 完全按你的需求定制  

## 注意事项

1. **性能考虑** - 大量包时可能需要优化存储
2. **备份策略** - 需要备份 npm-storage 目录
3. **安全性** - 建议添加更多安全检查
4. **兼容性** - 确保与标准 NPM 客户端兼容
