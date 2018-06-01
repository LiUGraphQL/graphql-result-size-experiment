//CYCLIC
var queries1 = [
  `{Product(nr:6){reviews{reviewFor{label}}}}`,
  `{Product(nr:6){reviews{reviewFor{reviews{reviewFor{label}}}}}}`,
  `{Product(nr:6){reviews{reviewFor{reviews{reviewFor{reviews{reviewFor{label}}}}}}}}`,
  `{Product(nr:6){reviews{reviewFor{reviews{reviewFor{reviews{reviewFor{reviews{reviewFor{label}}}}}}}}}}`,
  `{Product(nr:6){reviews{reviewFor{reviews{reviewFor{reviews{reviewFor{reviews{reviewFor{reviews{reviewFor{label}}}}}}}}}}}}`,
  `{Product(nr:6){reviews{reviewFor{reviews{reviewFor{reviews{reviewFor{reviews{reviewFor{reviews{reviewFor{reviews{reviewFor{label}}}}}}}}}}}}}}`
];

//ACYCLIC
var queries2 = [
  `{Person(nr:1){knows{knows{name}}}}`,
  `{Person(nr:1){knows{knows{knows{name}}}}}`,
  `{Person(nr:1){knows{knows{knows{knows{name}}}}}}`,
  `{Person(nr:1){knows{knows{knows{knows{knows{name}}}}}}}`,
  `{Person(nr:1){knows{knows{knows{knows{knows{knows{name}}}}}}}}`,
  `{Person(nr:1){knows{knows{knows{knows{knows{knows{knows{name}}}}}}}}}`,
  `{Person(nr:1){knows{knows{knows{knows{knows{knows{knows{knows{name}}}}}}}}}}`
];

//VARYING FIELDS
var queries3 = [
  `{Person(nr: 2) {reviews {reviewFor {offers {vendor {nr}}}}}}`,
  `{Person(nr: 2) {name reviews {title reviewFor {label offers {price vendor {country nr}}}}}}`,
  `{Person(nr: 2) {name country reviews {title reviewDate reviewFor {label comment offers {price deliveryDays vendor {country nr label}}}}}}`,
  `{Person(nr: 2) {name country nr reviews {title reviewDate nr reviewFor {label comment nr offers {price deliveryDays nr vendor {country nr label homepage}}}}}}`
];

//EXTREME BLOWUP
var queries4 = [
  `{Product(nr: 2) {productFeature {label}}}`,
  `{Product(nr: 2) {productFeature {products {label}}}}`,
  `{Product(nr: 2) {productFeature {products {productFeature {label}}}}}`,
  `{Product(nr: 2) {productFeature {products {productFeature {products {label}}}}}}`
];

//EXTREME BLOWUP, LIMIT 3
var queries5 = [
  `{Product(nr: 2) {productFeature(limit: 3){label}}}`,
  `{Product(nr: 2) {productFeature(limit: 3){products(limit: 3){label}}}}`,
  `{Product(nr: 2) {productFeature(limit: 3){products(limit: 3){productFeature(limit: 3){label}}}}}`,
  `{Product(nr: 2) {productFeature(limit: 3) {products(limit: 3) {productFeature(limit: 3) {products(limit: 3) {label}}}}}}`,
  `{Product(nr: 2) {productFeature(limit: 3) {products(limit: 3) {productFeature(limit: 3) {products(limit: 3) {productFeature(limit: 3){label}}}}}}}`,
  `{Product(nr: 2) {productFeature(limit: 3) {products(limit: 3) {productFeature(limit: 3) {products(limit: 3) {productFeature(limit: 3){products(limit: 3){label}}}}}}}}`
];

module.exports = {
  queries1,
  queries2,
  queries3,
  queries4,
  queries5
};
