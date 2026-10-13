# Protein RSI Research Report

蛋白质主动学习中的策略自我改进：研究方案、实验协议、完整阶段结果与执行进度。当前尚未证明RSI优势；实测结果、工程验证与未完成正式测试分别标注。

纯静态HTML/CSS/JavaScript，无前端依赖、服务端凭据或私有数据。保留原研究网站与考核展示入口。

公开报告：https://asimfish.github.io/protein-rsi-report/ 。研究背景、动机与数学定义见[研究论证](https://asimfish.github.io/protein-rsi-report/story.html)。

研究说明文档：[如何将 RSI 应用于蛋白实验设计](https://asimfish.github.io/protein-rsi-report/guide.html)。包含问题定义、RSI 使用方式、八项相关工作、系统设计与验证边界；支持章节导航、方法图和 [Markdown 下载](public/downloads/protein-rsi-guide.md)。研究状态按文中日期记录。

## 本地查看

Node.js 24：`npm test`、`npm run build`。运行`npm run preview`后访问`http://127.0.0.1:8765`。

## GitHub Pages部署

把本目录作为独立公开仓库推送到`main`；仓库Settings → Pages → Source选择GitHub Actions。已包含官方Pages构建与部署workflow。Actions成功后以其输出的page_url作为真实网址；本地构建通过不等于已经上线。

公开数据由原实验工作区的`research/github_report/export_public.py`导出，导出器只读取计数和已公开的完成结果；真实研究、标签与API在本机，GitHub不运行生物实验。研究论证与完整结果由维护者更新；执行计数由GitHub Actions从已有公开接口同步并部署。同步器不调用模型、不查询生物标签，不上传实验凭据。

`public/data/progress.json`记录实际进程核验时间与数据时间。进程停止、数据超过15分钟或核验过期时，页面明确显示已中断/待确认；不会仅凭旧队列running或上传成功声称实验正在执行。网页每60秒重新读取公开快照。定时同步配置为每5分钟；实际执行可能受GitHub调度影响，以页面数据时间为准。同步失败保留旧快照并由页面显示过期状态。

## 来源

已完成v17/v18全部配对比较与方法指标直接转录原公开聚合数据。详细协议与参考链接见网页资源区。历史负结果不删除、跨研究初始化不混算。图为本项目SVG，能独立下载。
