# Protein RSI Research Report

蛋白质主动学习中的策略自我改进：研究方案、实验协议、完整阶段结果与执行进度。当前尚未证明RSI优势；实测结果、工程验证与未完成正式测试分别标注。

纯静态HTML/CSS/JavaScript，无前端依赖、服务端凭据或私有数据。保留原研究网站与考核展示入口。

## 本地查看

Node.js 24：`npm test`、`npm run build`。运行`npm run preview`后访问`http://127.0.0.1:8765`。

## GitHub Pages部署

把本目录作为独立公开仓库推送到`main`；仓库Settings → Pages → Source选择GitHub Actions。已包含官方Pages构建与部署workflow。Actions成功后以其输出的page_url作为真实网址；本地构建通过不等于已经上线。

公开数据由原实验工作区的`research/github_report/export_public.py`导出，导出器只读取计数和已公开的完成结果；真实研究、标签与API在本机，GitHub不运行生物实验。更新公开JSON后再次推送会重新部署。未配置GitHub认证时无法完成真实发布。

`public/data/progress.json`记录实际进程核验时间与数据时间。进程停止、数据超过15分钟或核验过期时，页面明确显示已中断/待确认；不会仅凭旧队列running或上传成功声称实验正在执行。网页每60秒重新读取公开快照，这不等于快照每60秒生成。

## 来源

已完成v17/v18全部配对比较与方法指标直接转录原公开聚合数据。详细协议与参考链接见网页资源区。历史负结果不删除、跨研究初始化不混算。图为本项目SVG，能独立下载。
