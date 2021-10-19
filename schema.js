const { gql } = require('apollo-server');

const typeDefs = gql`
  directive @offer(id:String, relation:String) on FIELD_DEFINITION
  directive @product(id:String, relation:String) on FIELD_DEFINITION
  directive @producttypeproduct(id:String, relation:String) on FIELD_DEFINITION
  directive @review(id:String, relation:String) on FIELD_DEFINITION
  directive @productfeatureproduct(id:String, relation:String) on FIELD_DEFINITION
  directive @knowsperson(id:String, relation:String) on FIELD_DEFINITION
  directive @person(id:String, relation:String) on FIELD_DEFINITION

  type Vendor {
    nr: ID
    label: String
    comment: String
    homepage: String
    country: String
    publisher: Int
    publishDate: String
    offers: [Offer] @offer(id: "nr", relation: "vendor")
  }

  type Offer {
    nr: ID
    price: Float
    validFrom: String
    validTo: String
    deliveryDays: Int
    offerWebpage: String
    product: Product @offer(id: "product", relation: "nr")
    vendor: Vendor @offer(id: "vendor", relation: "nr")
  }

  type Product {
    nr: ID
    label: String
    comment: String
    offers: [Offer] @offer(id: "nr", relation: "product")
    producer: Producer @product(id: "producer", relation: "nr")
    type: ProductType @producttypeproduct(id: "productType", relation: "product")
    productFeature(limit: Int): [ProductFeature] @productfeatureproduct(id: "productFeature", relation: "product")
    reviews: [Review] @review(id: "nr", relation: "product")
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
    products(limit: Int): [Product] @productfeatureproduct(id: "product", relation: "productFeature")
  }

  type Producer {
    nr: ID
    label: String
    comment: String
    homepage: String
    country: String
    products: [Product] @product(id: "nr", relation: "producer")
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
    reviewFor: Product @review(id: "product", relation: "nr")
    reviewer: Person @review(id: "person", relation: "nr")
  }

  type Person {
    nr: ID
    name: String
    mbox_sha1sum: String
    country: String
    reviews: [Review] @review(id: "nr", relation: "person")
    knows: [Person] @knowsperson(id: "friend", relation: "person")
  }


    # the schema allows the following query:
    type Query {
      Review(nr: ID!): Review @review(id: "nr", relation: "nr")
      Person(nr: ID!): Person @person(id: "nr", relation: "nr")
      Product(nr: ID!): Product @product(id: "nr", relation: "nr")
      Offer(nr: ID!): Offer @offer(id: "nr", relation: "nr")
    }
`;

const resolvers = {
  Query: {
    Review(_, {nr}, {dataSources}){
      return dataSources.loaders.reviewLoader.load(nr);
    },
    Person(_, {nr}, {dataSources}){
      return dataSources.loaders.personLoader.load(nr);
    },
    Product(_, {nr}, {dataSources}){
      return dataSources.loaders.productLoader.load(nr);
    },
    Offer(_, {nr}, {dataSources}){
      return dataSources.loaders.offerLoader.load(nr);
    }
  },
  Vendor: {
    offers(vendor, args, {dataSources}){
      return dataSources.loaders.vendorOffersLoader.load(vendor.nr);
    }
  },
  Offer: {
    vendor(offer, args, {dataSources}){
      return dataSources.loaders.offerVendorLoader.load(offer.vendor);
    },
    product(offer, args, {dataSources}){
      return dataSources.loaders.productLoader.load(offer.product);
    }
  },
  Review: {
    reviewer(review, args, {dataSources}) {
      return dataSources.loaders.personLoader.load(review.person);
    },
    reviewFor(review, args, {dataSources}) {
      return dataSources.loaders.productLoader.load(review.product);
    }
  },
  Person: {
    reviews(person, args, {dataSources}) {
      return dataSources.loaders.personReviewsLoader.load(person.nr);
    },
    knows(person, args, {dataSources}){
      return dataSources.loaders.personKnowsLoader.load(person.nr);
    }
  },
  Product: {
    producer(product, args, {dataSources}){
      return dataSources.loaders.productProducerLoader.load(product.producer);
    },
    type(product, args, {dataSources}){
      return dataSources.loaders.productTypeLoader.load(product.nr);
    },
    productFeature(product, {limit}, {dataSources}){
      if(limit){ // we cannot use the data loader for queries with LIMIT
        return new Promise((resolve, reject) => {
          const query = 'SELECT p.nr, p.label, p.comment, pfp.product FROM productfeatureproduct pfp INNER JOIN productfeature p ON pfp.productfeature = p.nr WHERE pfp.product = ' + product.nr + ' LIMIT ' + limit;
          dataSources.db.all(query, (error, rows) => {
            if (error) {
              reject(error);
            }
            else {
              return resolve( rows.map(row => row) );
            }
          });
        });
      }
      else{
        return dataSources.loaders.productProductFeatureLoader.load(product.nr);
      }
    },
    reviews(product, args, {dataSources}) {
      return dataSources.loaders.productReviewsLoader.load(product.nr);
    },
    offers(product, args, {dataSources}){
      return dataSources.loaders.productOffersLoader.load(product.nr);
    }
  },
  ProductFeature: {
    products(feature, {limit}, {dataSources}){
      if (limit){ // we cannot use the data loader for queries with LIMIT
        return new Promise((resolve, reject) => {
          const query = 'SELECT p.nr, p.label, p.comment, p.producer, pfp.productfeature FROM productfeatureproduct pfp INNER JOIN product p ON pfp.product = p.nr WHERE pfp.productfeature = ' + feature.nr + ' LIMIT ' + limit;
          dataSources.db.all(query, (error, rows) => {
            if (error) {
              reject(error);
            }
            else {
              return resolve( rows.map(row => row) );
            }
          });
        });
      }
      else{
        return dataSources.loaders.productFeatureProductsLoader.load(feature.nr);
      }
    }
  },
  ProductType: {
    products(type, args, {dataSources}){
      return dataSources.loaders.productTypeProductsLoader.load(type.nr);
    }
  },
  Producer: {
    products(producer, args, {dataSources}){
      return dataSources.loaders.producerProductsLoader.load(producer.nr);
    }
  }
};

module.exports = { typeDefs, resolvers };
