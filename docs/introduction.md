---
title: Introduction
layout: page
nav_order: 2
---

# 简介

## 为什么选择KELE？

1. 支持用户自定义可执行算子（算子是断言逻辑中的概念，为理解方便，此处可以类比一阶逻辑的函数。可执行算子可以类比prolog中的元谓词）；

2. 自然地进行项级别的事实存储和推理；

3. 允许使用者自定义规则和事实的选取规则，以在特定应用场景下加快速度；

4. 支持等词公理；

5. 允许算子间构建嵌套的复合项。



## 安装



### pip安装

WIP

### 通过源代码安装和配置

如果要使用源代码在本地运行项目，请首先将源代码拉取到本地，并通过poetry安装

```
git clone https://github.com/USTC-KnowledgeComputingLab/AL_inference_engine
poetry install
eval $(poetry env activate)  # 或 Invoke-Expression (poetry env activate) 或 poetry shell ...
```

更完整的poetry环境激活命令说明，见[Poetry-Activating the environment](https://python-poetry.org/docs/managing-environments/#powershell)。


## 使用

为了在程序中使用al_inference_engine，需要将项目根目录添加到python路径中。

可以在程序中添加以下代码来实现：

```python
import sys
sys.path.append('/path/to/AL_inference_engine')

import al_inference_engine
```

## 示例

见[_examples](https://github.com/msg-bq/msg-bq.github.io/tree/main/_examples)文件夹下的py文件和[Quick Start]({% link docs/quick_start.md %})小节的说明。



## 推理过程简介

在KELE的前向式推理中，系统从已有事实出发，自动推出新的事实。这一过程被拆分为两个相对独立但紧密配合的阶段：

1. **Grounder：根据当前事实，为规则中的变量寻找可能的实例化取值；**
2. **Executor：在具体实例化规则下，判断规则前提是否全部成立，并据此产生新事实。**

下面分别对这两个阶段做简要说明。

---

### 1. Grounder：为变量寻找实例化候选值

在规则中，我们通常会使用变量来表示“任意符合领域限制的对象”。例如：

```text
parent(X, Y) = True  AND  parent(Y, Z) = True  ->  grandparent(X, Z) = True
```

其中 `X, Y, Z` 是变量，表示“某个对象”“某个人”，并不是具体的常量。
而事实库中保存的是已经确定的事实，例如：

```text
parent(Alice, Bob)   = True
parent(Bob,   Carie) = True
parent(Alice, Dave)  = True
```

Grounder 的职责是：

1. 在给定事实集的基础上，为每条规则计算出所有**可能的变量替换集合**，
2. 并将这些替换作用在规则上，生成只包含常量的**实例化规则**（grounded rules）。

例如，在上面的事实基础上，Grounder 可能给出如下替换：

* 一种替换：`X = Alice, Y = Bob, Z = Carie`
* 另一种替换：`X = Alice, Y = Bob, Z = Dave`
* 以及其他不匹配的组合。

对每一种替换，Grounder 会把变量替换成相应的常量，得到具体的实例化规则，例如：

```text
parent(Alice, Bob) = True  AND  parent(Bob, Carie) = True
    -> grandparent(Alice, Carie) = True
```

将所有规则在其各自的替换集合下实例化后，我们得到整个实例化规则集：

可以将 Grounder 理解为一个**枚举阶段**：
它并不判断这些实例化规则是否“真的成立”，而是先把“所有可能成立的具体情况”列举出来，为下一步执行做准备。

---

### 2. Executor：检验规则前提并产生新事实

在获得实例化规则集 `ground(R)` 之后，Executor 负责真正进行“推理判断”。

Executor 的职责是：

1. 对每一条实例化规则，检查其中每个断言是否被当前事实库推出；
2. 如果规则的前提部分（规则体）全部为真，则将对应的结论作为新事实加入事实库。

仍以前面的规则实例为例：

```text
parent(Alice, Bob) = True  AND  parent(Bob, Carie) = True
    -> grandparent(Alice, Carie) = True
```

Executor 会依次检查：

* 事实库中是否能推出 `parent(Alice, Bob) = True`
* 事实库中是否能推出 `parent(Bob, Carie) = True`

如果两者都存在，则说明该实例化规则的前提`parent(Alice, Bob) = True  AND  parent(Bob, Carie) = True`可以被推出，Executor 便会将结论：

```text
grandparent(Alice, Carie) = True
```

作为一个新的事实写入事实库。

相反，对于某个实例化规则，如果其无法被推出，则该规则在当前状态下被视为不成立，对应的结论不会被加入事实库。

---

### 3. 两个阶段协同形成前向式推理

在实际运行过程中，前向式推理并非只执行一轮（后续称为iteration），而是多次循环：

1. Grounder 使用当前事实库对规则集进行实例化；
2. Executor 检验这些实例化规则，向事实库中加入新的事实；
3. 若产生了新事实，则可以基于更新后的事实库再次进行 Grounding 与 Executing。

这个循环持续进行，直到不再产生新的事实为止。


