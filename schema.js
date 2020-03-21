var {
  makeExecutableSchema
} = require('graphql-tools');

const typeDefs = `

type Vendor {
  nr: ID
  label: String
  comment: String
  homepage: String
  country: String
  publisher: Int
  publishDate: String
  offers: [Offer] @Offer(id: "nr", relation: "vendor")
}

type Offer {
  nr: ID
  price: Float
  validFrom: String
  validTo: String
  deliveryDays: Int
  offerWebpage: String
  product: Product @Offer(id: "product", relation: "nr")
  vendor: Vendor @Offer(id: "vendor", relation: "nr")
}

type Product {
  nr: ID
  label: String
  comment: String
  offers: [Offer] @Offer(id: "nr", relation: "product")
  producer: Producer @Product(id: "producer", relation: "nr")
  type: ProductType @producttypeproduct(id: "productType", relation: "product")
  productFeature(limit: Int): [ProductFeature] @Productfeatureproduct(id: "productFeature", relation: "product")
  reviews: [Review] @Review(id: "nr", relation: "product")
}

type ProductType {
  nr: ID
  label: String
  comment: String
  products: [Product] @producttypeproduct(id: "product", relation: "productType")
}

type ProductFeature {
  nr: ID
  label: String
  comment: String
  products(limit: Int): [Product] @Productfeatureproduct(id: "product", relation: "productFeature")
}

type Producer {
  nr: ID
  label: String
  comment: String
  homepage: String
  country: String
  products: [Product] @Product(id: "nr", relation: "producer")
}

type Review {
  nr: ID
  title: String
  text: String
  reviewDate: String
  rating1: Int
  rating2: Int
  rating3: Int
  rating4: Int
  reviewFor: Product @Review(id: "product", relation: "nr")
  reviewer: Person @Review(id: "person", relation: "nr")
}

type Person {
  nr: ID
  name: String
  mbox_sha1sum: String
  country: String
  reviews: [Review] @Review(id: "nr", relation: "person")
  knows: [Person] @Knowsperson(id: "friend", relation: "person")
}


  # the schema allows the following query:
  type Query {
    Review(nr: ID!): Review @Review(id: "nr", relation: "nr")
    Person(nr: ID!): Person @Person(id: "nr", relation: "nr")
    Product(nr: ID!): Product @Product(id: "nr", relation: "nr")
    Offer(nr: ID!): Offer @Offer(id: "nr", relation: "nr")
  }
`;

const resolvers = {
  Query: {
    Review: (_, {nr}, context)  =>
      context.db.get('SELECT nr FROM Review WHERE nr = $id', {$id: nr}),
    Person: (_, {nr}, context) =>
      context.db.get('SELECT nr FROM Person WHERE nr = $pid', {$pid: nr}),
    Product: (_, {nr}, context) =>
      context.db.get('SELECT nr FROM Product WHERE nr = $pr_id', {$pr_id: nr}),
    Offer: (_, {nr}, context) =>
      context.db.get('SELECT nr FROM Offer WHERE nr = $id', {$id: nr})
  },
  Vendor: {
    nr(vendor, args, context){
      return context.db.get('SELECT nr FROM Vendor WHERE nr = $id', {$id: vendor.nr});
    },
    label(vendor, args, context){
      return context.db.get('SELECT label FROM Vendor WHERE nr = $id', {$id: vendor.nr});
    },
    comment(vendor, args, context){
      return context.db.get('SELECT comment FROM Vendor WHERE nr = $id', {$id: vendor.nr});
    },
    homepage(vendor, args, context){
      return context.db.get('SELECT homepage FROM Vendor WHERE nr = $id', {$id: vendor.nr});
    },
    country(vendor, args, context){
      return context.db.get('SELECT country FROM Vendor WHERE nr = $id', {$id: vendor.nr});
    },
    publisher(vendor, args, context){
      return context.db.get('SELECT publisher FROM Vendor WHERE nr = $id', {$id: vendor.nr});
    },
    publishDate(vendor, args, context){
      return context.db.get('SELECT publishDate FROM Vendor WHERE nr = $id', {$id: vendor.nr});
    },
    offers(vendor, args, context){
      return context.db.all('SELECT nr FROM Offer WHERE vendor = $id', {$id: vendor.nr});
    }
  },
  Offer: {
    nr(offer, args, context){
      return context.db.get('SELECT nr FROM Offer WHERE nr = $id', {$id: offer.nr});
    },
    price(offer, args, context){
      return context.db.get('SELECT price FROM Offer WHERE nr = $id', {$id: offer.nr});
    },
    validFrom(offer, args, context){
      return context.db.get('SELECT validFrom FROM Offer WHERE nr = $id', {$id: offer.nr});
    },
    validTo(offer, args, context){
      return context.db.get('SELECT validTo FROM Offer WHERE nr = $id', {$id: offer.nr});
    },
    deliveryDays(offer, args, context){
      return context.db.get('SELECT deliveryDays FROM Offer WHERE nr = $id', {$id: offer.nr});
    },
    offerWebpage(offer, args, context){
      return context.db.get('SELECT offerWebpage FROM Offer WHERE nr = $id', {$id: offer.nr});
    },
    vendor(offer, args, context){
      return context.db.get('SELECT vendor AS nr FROM Offer WHERE nr = $id', {$id: offer.nr});
    },
    product(offer, args, context){
      return context.db.get('SELECT product AS nr FROM Offer WHERE nr = $id', {$id: offer.nr});
    }
  },
  Review: {
    nr(review, args, context) {
      return context.db.get('SELECT nr FROM Review WHERE nr = $pid', {$pid: review.nr});
    },
    title(review, args, context) {
      return context.db.get('SELECT title FROM Review WHERE nr = $pid', {$pid: review.nr});
    },
    text(review, args, context) {
      return context.db.get('SELECT text FROM Review WHERE nr = $pid', {$pid: review.nr});
    },
    reviewDate(review, args, context) {
      return context.db.get('SELECT reviewDate FROM Review WHERE nr = $pid', {$pid: review.nr});
    },
    rating1(review, args, context) {
      return context.db.get('SELECT rating1 FROM Review WHERE nr = $pid', {$pid: review.nr});
    },
    rating2(review, args, context) {
      return context.db.get('SELECT rating2 FROM Review WHERE nr = $pid', {$pid: review.nr});
    },
    rating3(review, args, context) {
      return context.db.get('SELECT rating3 FROM Review WHERE nr = $pid', {$pid: review.nr});
    },
    rating4(review, args, context) {
      return context.db.get('SELECT rating4 FROM Review WHERE nr = $pid', {$pid: review.nr});
    },
    reviewer(review, args, context) {
      return context.db.get('SELECT person AS nr FROM Review WHERE nr = $pid', {$pid: review.nr});
    },
    reviewFor(review, args, context) {
      return context.db.get('SELECT product AS nr FROM Review WHERE nr = $pr_id', {$pr_id: review.nr});
    }
  },
  Person: {
    nr(person, args, context) {
      return context.db.get('SELECT nr FROM Person WHERE nr = $pid', {$pid: person.nr});
    },
    name(person, args, context) {
      return context.db.get('SELECT name FROM Person WHERE nr = $pid', {$pid: person.nr});
    },
    mbox_sha1sum(person, args, context) {
      return context.db.get('SELECT mbox_sha1sum FROM Person WHERE nr = $pid', {$pid: person.nr});
    },
    country(person, args, context) {
      return context.db.get('SELECT country FROM Person WHERE nr = $pid', {$pid: person.nr});
    },
    reviews(person, args, context) {
      return context.db.all('SELECT nr FROM Review WHERE person = $pid', {$pid: person.nr});
    },
    knows(person, args, context){
      return context.db.all('SELECT nr FROM Person p LEFT JOIN knowsperson kp on p.nr = kp.friend WHERE kp.person = $pid', {$pid: person.nr});
    }
  },
  Product: {
    nr(product, args, context) {
      return context.db.get('SELECT nr FROM Product WHERE nr = $pr_id', {$pr_id: product.nr});
    },
    label(product, args, context) {
      return context.db.get('SELECT label FROM Product WHERE nr = $pr_id', {$pr_id: product.nr});
    },
    comment(product, args, context) {
      return context.db.get('SELECT comment FROM Product WHERE nr = $pr_id', {$pr_id: product.nr});
    },
    producer(product, args, context){
      return context.db.get('SELECT producer AS nr FROM Product WHERE nr = $pr_id', {$pr_id: product.nr});
    },
    type(product, args, context){
      return context.db.get('SELECT nr FROM producttype p LEFT JOIN producttypeproduct ptp on p.nr = ptp.productType WHERE ptp.product = $pr_id', {$pr_id: product.nr});
    },
    productFeature(product, {limit}, context){
      if(limit){
        return context.db.all('SELECT nr FROM productfeature p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.productfeature WHERE pfp.product = $pr_id LIMIT $limit;', {$pr_id: product.nr, $limit: limit});
      }
      else{
        return context.db.all('SELECT nr FROM productfeature p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.productfeature WHERE pfp.product = $pr_id;', {$pr_id: product.nr});
      }
    },
    reviews(product, args, context) {
      return context.db.all('SELECT nr FROM Review WHERE product = $pr_id', {$pr_id: product.nr});
    },
    offers(product, args, context){
      return context.db.all('SELECT nr FROM Offer WHERE product = $pr_id', {$pr_id: product.nr});
    }
  },
  ProductFeature: {
    nr(feature, args, context) {
      return context.db.get('SELECT nr FROM productfeature WHERE nr = $pr_id', {$pr_id: feature.nr});
    },
    label(feature, args, context) {
      return context.db.get('SELECT label FROM productfeature WHERE nr = $pr_id', {$pr_id: feature.nr});
    },
    comment(feature, args, context) {
      return context.db.get('SELECT comment FROM productfeature WHERE nr = $pr_id', {$pr_id: feature.nr});
    },
    products(feature, {limit}, context){
      if (limit){
        return context.db.all('SELECT nr FROM product p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.product WHERE pfp.productfeature = $fid LIMIT $limit;', {$fid: feature.nr, $limit: limit});
      }
      else{
        return context.db.all('SELECT nr FROM product p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.product WHERE pfp.productfeature = $fid;', {$fid: feature.nr});
      }
    }
  },
  ProductType: {
    nr(type, args, context) {
      return context.db.get('SELECT nr FROM producttype WHERE nr = $pr_id', {$pr_id: type.nr});
    },
    label(type, args, context) {
      return context.db.get('SELECT label FROM producttype WHERE nr = $pr_id', {$pr_id: type.nr});
    },
    comment(type, args, context) {
      return context.db.get('SELECT comment FROM producttype WHERE nr = $pr_id', {$pr_id: type.nr});
    },
    products(type, args, context){
      return context.db.all('SELECT nr FROM product p LEFT JOIN producttypeproduct ptp ON p.nr = ptp.product WHERE ptp.producttype = $tid;', {$tid: type.nr});
    }
  },
  Producer: {
    nr(producer, args, context) {
      return context.db.get('SELECT nr FROM Producer WHERE nr = $pr_id', {$pr_id: producer.nr});
    },
    label(producer, args, context) {
      return context.db.get('SELECT label FROM Producer WHERE nr = $pr_id', {$pr_id: producer.nr});
    },    
    comment(producer, args, context) {
      return context.db.get('SELECT comment FROM Producer WHERE nr = $pr_id', {$pr_id: producer.nr});
    },
    homepage(producer, args, context) {
      return context.db.get('SELECT homepage FROM Producer WHERE nr = $pr_id', {$pr_id: producer.nr});
    },
    country(producer, args, context) {
      return context.db.get('SELECT country FROM Producer WHERE nr = $pr_id', {$pr_id: producer.nr});
    },
    products(producer, args, context){
      return context.db.all('SELECT nr FROM product WHERE producer = $pid;', {$pid: producer.nr});
    }
  }
};

const Schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = Schema;
