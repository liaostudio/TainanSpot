# GitHub 資料管線

## 目標

讓網站資料不是存在個人瀏覽器，而是存在 repo 內的正式資料檔。

這樣每次更新後：

- 所有人打開網站看到的資料一樣
- 不需要另外架後端資料庫
- 很適合批次整理很多期 CSV

## 流程

1. 把很多期 CSV 放進 `data/raw/`
2. 執行 `npm run build:data`
3. 產生 `public/data/manifest.json`
4. 同時產生 `public/data/districts/*.json`
5. 前端先讀 manifest，再按需要讀行政區明細
6. push 到 GitHub 後，Pages 重新部署

## 指令

```bash
npm run build:data
npm run build
```

## 注意

- 網站前端現在不直接上傳 CSV 到線上系統
- 線上站只負責讀取 repo 產生好的共用資料檔
- 如果要更新資料，請更新 `data/raw/` 後重新建置
