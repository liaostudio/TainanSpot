import { AdminLoginCard } from '../siteShared.jsx'

export function ManagePage({
  model,
  isAdminAuthenticated,
  adminPasswordInput,
  setAdminPasswordInput,
  adminAuthError,
  handleAdminLogin,
  handleAdminLogout,
}) {
  return (
    <div className="page-stack">
      {isAdminAuthenticated ? (
        <section className="panel upload-panel">
          <div className="panel-head compact">
            <div>
              <h3>GitHub 共用資料管理</h3>
              <p>把新一期 CSV 放進 `data/raw/`，重新部署後，全站就會更新成同一份資料。</p>
            </div>
            <div className="upload-actions">
              <button type="button" className="upload-trigger ghost" onClick={handleAdminLogout}>
                登出管理
              </button>
            </div>
          </div>
          <div className="upload-stats">
            <span className="upload-chip highlight">已匯入 {model.importedFiles.length} 期</span>
            <span className="upload-chip">現在資料：{model.isRealMode ? '真實資料' : '展示資料'}</span>
            <span className="upload-chip">{model.isSharedMode ? '資料模式：GitHub 共用資料' : `資料模式：${model.storageMode}`}</span>
            <span className="upload-chip">共讀到：{model.uploadStats.totalRaw.toLocaleString()} 筆</span>
            <span className="upload-chip">排除掉：{model.uploadStats.totalExcluded.toLocaleString()} 筆</span>
            <span className="upload-chip">重複的：{model.uploadStats.duplicateCount.toLocaleString()} 筆</span>
            <span className="upload-chip">{model.latestDataDate ? `最新資料：${model.latestDataDate}` : '目前尚未有可分析資料'}</span>
            <span className="upload-chip">{model.persistedAt ? `最近同步：${new Date(model.persistedAt).toLocaleString('zh-TW')}` : '目前還沒有同步記錄'}</span>
          </div>
          {model.importMessage ? <p className="import-feedback success">{model.importMessage}</p> : null}
          {model.importError ? <p className="import-feedback error">{model.importError}</p> : null}
          <div className="upload-sop">
            <span>1. 放進 `data/raw/`</span>
            <span>2. 跑 `npm run build:data`</span>
            <span>3. push 到 GitHub</span>
          </div>
          <div className="import-file-list">
            <div className="panel-head compact">
              <div>
                <h3>已匯入檔案清單</h3>
                <p>這份清單就是目前已整理進共用資料檔的期數。</p>
              </div>
            </div>
            {model.importedFiles.length > 0 ? (
              <div className="table-shell">
                <table className="records-table import-files-table">
                  <thead>
                    <tr>
                      <th>檔名</th>
                      <th>型態</th>
                      <th>有效資料</th>
                      <th>排除</th>
                      <th>重複</th>
                      <th>整理時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.importedFiles.map((file) => (
                      <tr key={file.name}>
                        <td>{file.name}</td>
                        <td>{file.propertyType === 'presale' ? '預售屋' : '中古屋'}</td>
                        <td>{file.validRecords}</td>
                        <td>{file.excludedCount}</td>
                        <td>{file.duplicateCount}</td>
                        <td>{new Date(file.importedAt).toLocaleString('zh-TW')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">目前還沒有任何匯入期數。</div>
            )}
          </div>
        </section>
      ) : (
        <AdminLoginCard
          password={adminPasswordInput}
          onPasswordChange={setAdminPasswordInput}
          onSubmit={handleAdminLogin}
          authError={adminAuthError}
        />
      )}
    </div>
  )
}
