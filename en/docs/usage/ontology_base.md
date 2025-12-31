---

title: Ontology Base
parent: Usage
layout: page
nav_order: 6
---

# Ontology Base

---

The ontology base includes Concepts and Operators. Concept-Operator modeling abstracts, generalizes, and summarizes real-world logic by conducting domain analysis on textual information, database information, etc., and using standardized, unified symbols, enabling machines to perform automated reasoning like humans based on these abstract concepts and relationships.

In CO modeling, a Concept represents an entity, object, or conceptual element, and is used to express various states, attributes, or characteristics. A concept can be a concrete physical object, or an abstract concept or a collection of concepts. An Operator represents an action or method that operates on or transforms concepts. Operators describe the relationships and transformations between concepts, thereby establishing connections among concepts.

---

## Examples

We can understand how to define concepts and operators in the ontology base through some simple examples in mathematics and kinship relationships.

### 1. Mathematical Example

**Concepts**:

* **Real (Real)**: Represents the field of real numbers in algebra.
* **Point (Point)**: Represents a position in geometry.
* **Degree (Degree)**: Represents the angle formed by three line segments.

**Operators**:

* **Line_length(Point, Point) → Real**: Represents the distance between two points. For example, `Line_length(A, B) = 5` means the distance between point A and point B is 5.
* **Angle_degree(Point, Point, Point) → Degree**: Represents the angle formed by three points. For example, `Angle_degree(A, B, C) = 90°` means the angle formed by points A, B, and C is 90 degrees.

These operators help us compute actual values (such as length and angle) from geometric concepts (such as points and angles).

### 2. Kinship Relationship Example

**Concepts**:

* **Person (Person)**: Represents humans.

**Operators**:

* **parent(Person, Person) → Bool**: Represents a relationship where X is Y’s parent. For example, `parent(Alice, Bob) = True` means Alice is Bob’s parent.
* **grandparent(Person, Person) → Bool**: Represents a relationship where X is Z’s grandparent. For example, `grandparent(Alice, Carie) = True`.

These operators help us describe relationships among family members; subsequently, we can also perform reasoning according to rules to derive other kinship relationships. 
