# TainanSpot

台南房價分析網站，前端使用 React + Vite，部署在 GitHub Pages。

## 資料模式

這個專案現在使用 **GitHub 共用資料管線**：

- 原始 CSV 放在 `data/raw/`
- 執行 `npm run build:data`
- 會自動整理成 `public/data/manifest.json` 和 `public/data/districts/*.json`
- GitHub Actions 部署時也會自動先跑一次資料整理

這樣重新部署後，所有人看到的都是同一份資料。

## 常用指令

```bash
npm install
npm run build:data
npm run build
npm run dev
```

## 目錄重點

- `data/raw/`：放每一期原始 CSV
- `public/data/manifest.json`：首頁和全市摘要用的小檔
- `public/data/districts/*.json`：各行政區明細資料
- `scripts/build-shared-dataset.mjs`：把很多期 CSV 整理成摘要檔和分區明細檔
- `src/hooks/useHousingData.js`：讀取共用資料檔

## 更新資料流程

1. 把新的 CSV 放進 `data/raw/`
2. 執行 `npm run build:data`
3. 確認網站資料正常
4. commit + push
5. GitHub Pages 重新部署後，全站同步更新
