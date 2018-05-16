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
  productFeature: [ProductFeature] @Productfeatureproduct(id: "productFeature", relation: "product")
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
  products: [Product] @Productfeatureproduct(id: "product", relation: "productFeature")
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
      context.db.get('SELECT nr,title,text,reviewDate,rating1,rating2,rating3,rating4,product,person FROM Review WHERE nr = $id', {$id: nr}),
    Person: (_, {nr}, context) =>
      context.db.get('SELECT nr,name,mbox_sha1sum,country FROM Person WHERE nr = $pid', {$pid: nr}),
    Product: (_, {nr}, context) =>
      context.db.get('SELECT nr,label,comment,producer FROM Product WHERE nr = $pr_id', {$pr_id: nr}),
    Offer: (_, {nr}, context) =>
      context.db.get('SELECT nr,price,validFrom,validTo,deliveryDays,offerWebpage,vendor,product FROM Offer WHERE nr = $id', {$id: nr})
  },
  Vendor: {
    offers(vendor, args, context){
      return context.db.all('SELECT nr,price,validFrom,validTo,deliveryDays,offerWebpage,vendor,product FROM Offer WHERE vendor = $id', {$id: vendor.nr});
    }
  },
  Offer: {
    vendor(offer, args, context){
      return context.db.get('SELECT nr,label,comment,homepage,country,publisher,publishDate FROM Vendor WHERE nr = $id', {$id: offer.vendor});
    },
    product(offer, args, context){
      return context.db.get('SELECT nr,label,comment,producer FROM Product WHERE nr = $id', {$id: offer.product});
    }
  },
  Review: {
    reviewer(review, args, context) {
      return context.db.get('SELECT nr,name,mbox_sha1sum,country FROM Person WHERE nr = $pid', {$pid: review.person});
    },
    reviewFor(review, args, context) {
      return context.db.get('SELECT nr,label,comment,producer FROM Product WHERE nr = $pr_id', {$pr_id: review.product});
    }
  },
  Person: {
    reviews(person, args, context) {
      return context.db.all('SELECT nr,title,text,reviewDate,rating1,rating2,rating3,rating4,product,person FROM Review WHERE person = $pid', {$pid: person.nr});
    }
  },
  Product: {
    producer(product, args, context){
      return context.db.get('SELECT nr,label,comment,homepage,country FROM Producer WHERE nr = $pr_id', {$pr_id: product.producer});
    },
    type(product, args, context){
      return context.db.get('SELECT nr,label,comment FROM producttype p LEFT JOIN producttypeproduct ptp on p.nr = ptp.productType WHERE ptp.product = $pr_id', {$pr_id: product.nr});
    },
    productFeature(product, args, context){
      return context.db.all('SELECT nr,label,comment FROM productfeature p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.productfeature WHERE pfp.product = $pr_id;', {$pr_id: product.nr});
    },
    reviews(product, args, context) {
      return context.db.all('SELECT nr,title,text,reviewDate,rating1,rating2,rating3,rating4,product,person FROM Review WHERE product = $pr_id', {$pr_id: product.nr});
    },
    offers(product, args, context){
      return context.db.all('SELECT nr,price,validFrom,validTo,deliveryDays,offerWebpage,vendor,product FROM Offer WHERE product = $pr_id', {$pr_id: product.nr});
    }
  },
  ProductFeature: {
    products(feature, args, context){
      return context.db.all('SELECT nr,label,comment,producer FROM product p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.product WHERE pfp.productfeature = $fid;', {$fid: feature.nr});
    }
  },
  ProductType: {
    products(type, args, context){
      return context.db.all('SELECT nr,label,comment,producer FROM product p LEFT JOIN producttypeproduct ptp ON p.nr = ptp.product WHERE ptp.producttype = $tid;', {$tid: type.nr});
    }
  },
  Producer: {
    products(producer, args, context){
      return context.db.all('SELECT nr,label,comment,producer FROM product WHERE producer = $pid;', {$pid: producer.nr});
    }
  }

};

const Schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = Schema;
