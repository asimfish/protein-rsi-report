# 编辑选择的学习排序与不确定性：前瞻机制实验

2026-10-23。用户“继续”授权；根据完整v9负结果设计。本轮仍是GB1历史实测景观上的开发机制验证，不宣称完整RSI、Qwen提案、改进器自修改、跨蛋白泛化或湿实验。原冻结源/结果/优势门槛保持。TrpB4只审计，不做性能评估。

## 假设与对照

v9收益回归的微小误差变化未改变40次编辑选择。本轮隔离三项因素：已付状态表征、收益回归与成对排序损失、使用排序得分bootstrap下界的保守选择。

候选族、数值worker与MLP200epochs等参数完整复用冻结v9。3模型×2采集函数×2候选池=12动作，其中MLP5/UCB/global是父代，其余11可组合编辑；第1或3轮开始修改并保持。每回放32+8×16=160，所有子代独立查询并计费共同前缀，分叉时只有32或64已付标签。所有收益来自完整实测回放。

9条选择规则：parent、uniform_expected、group、supported_group、mse_basic、mse_rich、rank_basic、rank_rich、rank_rich_lcb。前两者分别不修改和12动作均匀选择的解析期望。group是编辑×时刻的训练均值；supported_group应用与四学习器相同的支持范围。4学习器用同一批配对记录，仅改变状态特征和损失。rank_rich_lcb直接使用同一冻结rank_rich模型的bootstrap第10百分位，其余按点估计最高且>0选择；没有正值或无支持则保留父代。固定平局顺序为候选登记顺序，null为0。

## 特征与损失

basic为v9四项状态：上一批反馈存在、内部线性CV nRMSE/2、上一批nRMSE/2、CV缺失指示。rich保留basic，再加停滞轮数/8、上一批改进z/4、上一批不确定性/4、上一批2sigma覆盖率、上一批平均Hamming距离、当前best_z/8、已付数量/160、上一批nRMSE/max(不确定性,.1)/4，共12维。首轮缺失反馈填0并由存在指示区分，非有限状态拒绝。没有未测标签、序列ID、跨回放序列标签缓存或全库统计输入。

动作编码为非null的11维one-hot；phi=[a,a*c_1,...,a*c_d]，null恒0，basic55维、rich143维，前者为后者前55维。phi输入c逐项clip[-4,4]。所有学习器与supported_group统一按未截断rich状态，分时刻训练min/max外扩.25*max(range,.1)判断支持；group不加此范围。任何支持差异单独报告。

mse损失为每状态12动作（含null）的平均平方误差，加lambda/2*||theta||²。rank损失对同状态12动作中不同实测收益的无序对使用成对logistic：log(1+exp(-sign(g_i-g_j)*(s_i-s_j)))；权重为|g_i-g_j|在该状态内归一化，每个状态等权；全平局状态贡献0。加同一lambda/2*||theta||²。排序得分不等于fitness增益，不计算其RMSE或声称概率已校准。

lambda固定(.001,.01,.1,1)。训练种子按排序索引mod5划分5个初始化簇折，所有时刻/编辑随初始化一起留出。每折支持范围只由训练折建立，以留出状态实际被选编辑的平均收益选择lambda（含不支持/null的0收益）；并列取较大lambda。任何新评估数据均不参与选lambda。收益回归同样按选择收益选lambda，隔离损失效应。收益回归直接用精确ridge线性方程求解上述MSE目标；只有成对排序使用L-BFGS-B，固定maxiter250/ftol1e-9、从0开始，未收敛停止而非静默部署。

6个冻结估计器：group、supported_group、mse_basic、mse_rich、rank_basic、rank_rich。bootstrap128次、seed1013，整初始化及其全部22记录一起重抽。区间是条件均值或排序得分稳定性的bootstrap描述，不是单次回放保证，也不声称已校准。第10百分位只用于rank_rich_lcb，不能当作已建立的统计安全保证。冻结后从实际JSON重新加载。

## 新初始化、队列与固定预算

sanity921000：old-v9 P0、new P0、第1轮pairwise/UCB/global、第3轮MLP/UCB/local，共4完整回放/640标签；不入fit。核验新旧P0完整轨迹一致及两个32/64已付前缀。

training921100..921139：40新初始化，每个1父代+11编辑×2时刻=23完整回放，920回放/147200标签；880配对记录，独立簇40。全部完成后拟合和冻结。

diagnosis921200..921239：另40新初始化，同920回放/147200标签。80个分叉状态的6×11=5280候选预测和7个实际选择，在首子代分叉查询前保存。选择器成绩复用事前选择对应的完整实测矩阵；没有额外独立选择器回放，不能称已部署在线RSI。

总1844回放/295040标签，模型API硬0，最大1回放、每进程2线程、CPUQuota200%，本机原.venv warm复用，不安装/GPU/远程/wandb。sanity->训练->冻结->评估->完整分析，任何失败保留消费并停止，不替换或隐式重跑。全完成前只读计数与服务，不读取部分分数。

## 指标与证据

nAUBC主指标、归一化Best@160终点。预先保留Delta nAUBC>=.01、配对95%区间下界>0、终点差>=-.02联合判据。rank_rich_lcb对其余8规则报告全部比较；另报告rich/basic在两损失下、rank/mse在两特征下、LCB/点估计共5机制消融。两时刻先在初始化内平均，再按40初始化bootstrap10000 seed713，不能把880行当880独立样本。仍为探索性机制研究，未作正式多重校正，不能升级为确认性RSI优效。

报告9规则表现、6估计器支持比例/同状态Spearman/正收益选择命中率、5消融、全部22编辑与18因素对照、选择分布/不修改原因、有限矩阵事后最佳参照及相对其选择损失。只有4个收益估计器group/supported_group/mse_basic/mse_rich计算同支持集RMSE/MAE；rank得分单位单列。bootstrap下界必须核验实际改变决策的次数。事后最佳不是可部署成绩或泛化上界。

## 独立审查与公开报告

ARIS experiment-bridge/run-experiment/auto-review-loop；研究启动前独立代码审查，再由另一fresh Agent逐字执行环境文档。same-family/provisional，仅工程通过；科学结果看完整实测。保留已有考核展示、guide和旧实验入口，接入同一GitHub网站，新页ranking.html。完整结果前页面只展示计数/已冻结方案；不发布部分性能。

## 方法依据

成对logistic排序损失借鉴RankNet（Burges et al., ICML2005）：https://www.microsoft.com/en-us/research/publication/learning-to-rank-using-gradient-descent/ 。以决策质量选择模型的动机参考Mandi et al., ICML2022，Decision-Focused Learning: Through the Lens of Learning to Rank：https://proceedings.mlr.press/v162/mandi22a.html 。本实现是线性成对排序与受控机制对照，不声称完整复现上述方法或新理论。

2026-10-23 查询前R2修订：只澄清MSE精确求解与排序优化器；在分叉前保存各规则不修改原因，并在完整JSON、选择器CSV和公开表中区分无支持、点得分不为正、bootstrap下界不为正、固定父代与随机null期望。方法、特征、损失、正则、阈值、种子及预算不变。
