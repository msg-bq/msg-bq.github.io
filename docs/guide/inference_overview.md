---
title: 推理过程简介
---

# 推理过程简介

在 KELE 的前向式推理中，系统从已有事实出发，自动推出新的事实。这一过程被拆分为两个相对独立但紧密配合的阶段：

1. **Grounder：根据当前事实，为规则中的变量寻找可能的实例化取值；**
2. **Executor：在具体实例化规则下，判断规则前提是否全部成立，并据此产生新事实。**

下面分别对这两个阶段做简要说明。

---

## 1. Grounder：为变量寻找实例化候选值

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

## 2. Executor：检验规则前提并产生新事实

在获得实例化规则集之后，Executor 负责真正进行“推理判断”。

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

如果两者都存在，则说明该实例化规则的前提 `parent(Alice, Bob) = True  AND  parent(Bob, Carie) = True` 可以被推出，Executor 便会将结论：

```text
grandparent(Alice, Carie) = True
```

作为一个新的事实写入事实库。

相反，对于某个实例化规则，如果其无法被推出，则该规则在当前状态下被视为不成立，对应的结论不会被加入事实库。

---

## 3. 两个阶段协同形成前向式推理

在实际运行过程中，前向式推理并非只执行一轮（后续称为 iteration），而是多次循环：

1. Grounder 使用当前事实库对规则集进行实例化；
2. Executor 检验这些实例化规则，向事实库中加入新的事实；
3. 若产生了新事实，则可以基于更新后的事实库再次进行 Grounding 与 Executing。

这个循环持续进行，直到不再产生新的事实或求解结束为止。

