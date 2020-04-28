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
    Review(_, {nr}, context){
      return context.reviewLoader.load(nr);
    },
    Person(_, {nr}, context){
      return context.personLoader.load(nr);
    },
    Product(_, {nr}, context){
      return context.productLoader.load(nr);
    },
    Offer(_, {nr}, context){
      return context.offerLoader.load(nr);
    }
  },
  Vendor: {
    nr(vendor, args, context){
      return vendor.nr;
    },
    label(vendor, args, context){
      return vendor.label;
    },
    comment(vendor, args, context){
      return vendor.comment;
    },
    homepage(vendor, args, context){
      return vendor.homepage;
    },
    country(vendor, args, context){
      return vendor.country;
    },
    publisher(vendor, args, context){
      return vendor.publisher;
    },
    publishDate(vendor, args, context){
      return vendor.publishDate;
    },
    offers(vendor, args, context){
      return context.vendorOffersLoader.load(vendor.nr);
    }
  },
  Offer: {
    nr(offer, args, context){
      return offer.nr;
    },
    price(offer, args, context){
      return offer.price;
    },
    validFrom(offer, args, context){
      return offer.validFrom;
    },
    validTo(offer, args, context){
      return offer.validTo;
    },
    deliveryDays(offer, args, context){
      return offer.deliveryDays;
    },
    offerWebpage(offer, args, context){
      return offer.offerWebpage;
    },
    vendor(offer, args, context){
      return context.offerVendorLoader.load(offer.vendor);
    },
    product(offer, args, context){
      return context.productLoader.load(offer.product);
    }
  },
  Review: {
    nr(review, args, context) {
      return review.nr;
    },
    title(review, args, context) {
      return review.title;
    },
    text(review, args, context) {
      return review.text;
    },
    reviewDate(review, args, context) {
      return review.reviewDate;
    },
    rating1(review, args, context) {
      return review.rating1;
    },
    rating2(review, args, context) {
      return review.rating2;
    },
    rating3(review, args, context) {
      return review.rating3;
    },
    rating4(review, args, context) {
      return review.rating4;
    },
    reviewer(review, args, context) {
      return context.personLoader.load(review.person);
    },
    reviewFor(review, args, context) {
      return context.productLoader.load(review.product);
    }
  },
  Person: {
    nr(person, args, context) {
      return person.nr;
    },
    name(person, args, context) {
      return person.name;
    },
    mbox_sha1sum(person, args, context) {
      return person.mbox_sha1sum;
    },
    country(person, args, context) {
      return person.country;
    },
    reviews(person, args, context) {
      return context.personReviewsLoader.load(person.nr);
    },
    knows(person, args, context){
      return context.personKnowsLoader.load(person.nr);
    }
  },
  Product: {
    nr(product, args, context) {
      return product.nr;
    },
    label(product, args, context) {
      return product.label;
    },
    comment(product, args, context) {
      return product.comment;
    },
    producer(product, args, context){
      return context.productProducerLoader.load(product.producer);
    },
    type(product, args, context){
      return context.productTypeLoader.load(product.nr);
    },
    productFeature(product, {limit}, context){
      if(limit){
        return context.productProductFeatureLoader.load({'id': product.nr, 'limit': limit});
      }
      else{
        return context.productProductFeatureLoader.load(product.nr);
      }
    },
    reviews(product, args, context) {
      return context.productReviewsLoader.load(product.nr);
    },
    offers(product, args, context){
      return context.productOffersLoader.load(product.nr);
    }
  },
  ProductFeature: {
    nr(feature, args, context) {
      return feature.nr;
    },
    label(feature, args, context) {
      return feature.label;
    },
    comment(feature, args, context) {
      return feature.comment;
    },
    products(feature, {limit}, context){
      if (limit){
        return context.productFeatureProductsLoader.load({'id': feature.nr, 'limit': limit});
      }
      else{
        return context.productFeatureProductsLoader.load(feature.nr);
      }
    }
  },
  ProductType: {
    nr(type, args, context) {
      return type.nr;
    },
    label(type, args, context) {
      return type.label;
    },
    comment(type, args, context) {
      return type.comment;
    },
    products(type, args, context){
      return context.productTypeProductsLoader.load(type.nr);
    }
  },
  Producer: {
    nr(producer, args, context) {
      return producer.nr;
    },
    label(producer, args, context) {
      return producer.label;
    },    
    comment(producer, args, context) {
      return producer.comment;
    },
    homepage(producer, args, context) {
      return producer.homepage;
    },
    country(producer, args, context) {
      return producer.country;
    },
    products(producer, args, context){
      return context.producerProductsLoader.load(producer.nr);
    }
  }
};

const Schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = Schema;
